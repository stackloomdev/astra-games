import hashlib
import importlib.util
import io
import json
from pathlib import Path
import sys
import tarfile
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'deploy'))
spec = importlib.util.spec_from_file_location('astra_release', Path(__file__).resolve().parents[1] / 'deploy/release.py')
release = importlib.util.module_from_spec(spec)
spec.loader.exec_module(release)


class FakeDeployer(release.Deployer):
    def __init__(self, root, fail=False):
        self.commands = []
        self.checks = []
        self.fail = fail
        super().__init__(root, self.record_command, self.record_check, root / 'units')

    def record_command(self, *args):
        self.commands.append(args)

    def record_check(self, base, sha, registry, **kwargs):
        self.checks.append((base, sha, kwargs))
        if self.fail and sha == 'b' * 40:
            raise RuntimeError('New release is unhealthy')

    def configure(self, candidate):
        pass


class ReleaseTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name).resolve()
        (self.root / 'releases').mkdir()
        (self.root / 'units').mkdir()
        self.old = self.make_release('a' * 40, 10)
        (self.root / 'current').symlink_to(self.old)
        self.new = self.make_release('b' * 40, 20)

    def tearDown(self):
        self.temp.cleanup()

    def make_release(self, sha, run):
        path = self.root / 'releases' / f'{sha}-{run}-1'
        (path / 'deploy').mkdir(parents=True)
        (path / 'lib').mkdir()
        (path / 'deploy/catalog-mirror.py').write_text('mirror')
        (path / 'lib/i18n.ts').write_text('registry')
        (path / 'release.json').write_text(json.dumps({'commit': sha, 'run_id': run, 'attempt': 1}))
        (path / '.deployed').touch()
        return path

    def archive(self, name, kind=tarfile.REGTYPE, target=''):
        data = io.BytesIO()
        with tarfile.open(fileobj=data, mode='w') as archive:
            info = tarfile.TarInfo(name)
            info.type = kind
            info.linkname = target
            archive.addfile(info)
        data.seek(0)
        return tarfile.open(fileobj=data)

    def test_rejects_traversal_and_credentials_before_extraction(self):
        for name in ['../outside', '/etc/passwd', 'node_modules/../../secret', '.env.local', '.workbench/config.json', '.git/config', 'a\\b']:
            with self.subTest(name=name), self.archive(name) as archive:
                with self.assertRaises(ValueError):
                    release.safe_members(archive)

    def test_rejects_devices_and_hardlinks(self):
        for kind in [tarfile.CHRTYPE, tarfile.LNKTYPE, tarfile.FIFOTYPE]:
            with self.archive('special', kind, 'server.js') as archive:
                with self.assertRaises(ValueError):
                    release.safe_members(archive)

    def test_data_filter_rejects_external_symlink(self):
        with self.archive('escape', tarfile.SYMTYPE, '/etc') as archive:
            members = release.safe_members(archive)
            with self.assertRaises(tarfile.FilterError):
                archive.extractall(self.root / 'staged', members=members, filter='data')

    def test_outdated_and_duplicate_workflows_do_not_stage_or_switch(self):
        release.write_json(self.root / 'deployment-state.json', {'run_id': 30, 'attempt': 2})
        deployer = FakeDeployer(self.root)
        for sequence in [(29, 100), (30, 1), (30, 2)]:
            deployer.deploy(Path('does-not-exist'), 'x', 'b' * 40, sequence)
        self.assertEqual((self.root / 'current').resolve(), self.old)
        self.assertEqual(deployer.commands, [])
        self.assertFalse(deployer.newer_than((30, 3)))

    def test_checksum_failure_does_not_create_a_release(self):
        archive = self.root / 'bad.tar.gz'
        archive.write_bytes(b'bad')
        deployer = FakeDeployer(self.root)
        with self.assertRaisesRegex(ValueError, 'checksum'):
            deployer.prepare(archive, '0' * 64, 'c' * 40, (40, 1))
        self.assertEqual((self.root / 'current').resolve(), self.old)
        self.assertFalse((self.root / 'releases' / f'{"c" * 40}-40-1').exists())

    def test_failed_postdeploy_check_restores_previous_release(self):
        deployer = FakeDeployer(self.root, fail=True)
        with patch.object(release, 'mirror_ready'):
            with self.assertRaisesRegex(RuntimeError, 'unhealthy'):
                deployer.activate(self.new, 'b' * 40)
        self.assertEqual((self.root / 'current').resolve(), self.old)
        self.assertEqual(deployer.commands.count(('systemctl', 'restart', 'astra-games')), 2)
        self.assertEqual(deployer.checks[-1][1], 'a' * 40)
        self.assertFalse((self.root / 'deployment-state.json').exists())

    def test_mirror_restarts_only_when_its_inputs_change(self):
        for changed in [False, True]:
            (self.new / 'deploy/catalog-mirror.py').write_text('changed' if changed else 'mirror')
            deployer = FakeDeployer(self.root)
            deployer.point_to(self.old)
            with patch.object(release, 'mirror_ready'):
                deployer.activate(self.new, 'b' * 40)
            self.assertEqual(('systemctl', 'restart', 'astra-catalog-mirror') in deployer.commands, changed)

    def test_first_rollback_can_restore_the_legacy_source_release(self):
        (self.old / 'release.json').unlink()
        deployer = FakeDeployer(self.root, fail=True)
        with patch.object(release, 'mirror_ready'):
            with self.assertRaises(RuntimeError):
                deployer.activate(self.new, 'b' * 40)
        self.assertTrue(deployer.checks[-1][2]['legacy'])
        self.assertEqual((self.root / 'current').resolve(), self.old)

    def test_manual_rollback_only_accepts_completed_retained_releases(self):
        deployer = FakeDeployer(self.root)
        for value in ['../outside', 'x', self.new.name + '/other']:
            with self.assertRaises(ValueError):
                deployer.rollback(value, (40, 1))
        (self.new / '.deployed').unlink()
        with self.assertRaisesRegex(ValueError, 'successful'):
            deployer.rollback(self.new.name, (40, 1))

    def test_broken_candidate_service_configuration_is_restored(self):
        paths = [self.root / 'start-app.sh', self.root / 'units/astra-games.service', self.root / 'units/astra-catalog-mirror.service']
        for path in paths:
            path.write_text('previous configuration')
            path.chmod(0o640)
        for name in ['start-app.sh', 'astra-games.service', 'astra-catalog-mirror.service']:
            (self.new / 'deploy' / name).write_text('bad candidate configuration')
        deployer = FakeDeployer(self.root, fail=True)
        deployer.configure = lambda candidate: release.Deployer.configure(deployer, candidate)
        with patch.object(release, 'mirror_ready'):
            with self.assertRaises(RuntimeError):
                deployer.activate(self.new, 'b' * 40)
        for path in paths:
            self.assertEqual(path.read_text(), 'previous configuration')
            self.assertEqual(path.stat().st_mode & 0o777, 0o640)
        self.assertEqual(deployer.commands.count(('systemctl', 'daemon-reload')), 2)

    def test_state_write_failure_also_restores_previous_release(self):
        deployer = FakeDeployer(self.root)
        with patch.object(release, 'mirror_ready'), patch.object(release, 'write_json', side_effect=OSError('disk full')):
            with self.assertRaisesRegex(OSError, 'disk full'):
                deployer.activate(self.new, 'b' * 40, lambda: deployer.finish(self.new, (40, 1), 'deploy'))
        self.assertEqual((self.root / 'current').resolve(), self.old)

    def test_rollback_waits_for_old_mirror_before_app_restart(self):
        (self.new / 'deploy/catalog-mirror.py').write_text('new mirror')
        deployer = FakeDeployer(self.root, fail=True)
        events = []
        deployer.command = lambda *args: events.append(args)
        with patch.object(release, 'mirror_ready', side_effect=lambda base, registry, **kwargs: events.append(('ready', str(registry)))):
            with self.assertRaises(RuntimeError):
                deployer.activate(self.new, 'b' * 40)
        old_ready = events.index(('ready', str(self.old / 'lib/i18n.ts')))
        self.assertEqual(events[old_ready + 1], ('systemctl', 'restart', 'astra-games'))

    def test_old_mirror_outage_does_not_prevent_app_recovery(self):
        (self.new / 'deploy/catalog-mirror.py').write_text('new mirror')
        deployer = FakeDeployer(self.root)
        def readiness(base, registry, **kwargs):
            raise RuntimeError('Upstream outage')
        with patch.object(release, 'mirror_ready', side_effect=readiness):
            with self.assertRaises(RuntimeError):
                deployer.activate(self.new, 'b' * 40)
        self.assertEqual((self.root / 'current').resolve(), self.old)
        self.assertIn(('systemctl', 'restart', 'astra-games'), deployer.commands)
        self.assertFalse(deployer.checks[-1][2]['require_fresh'])

    def test_retention_preserves_five_completed_versions_and_manual_release(self):
        manual = self.root / 'releases/20261013T165207'
        manual.mkdir()
        for run in range(31, 39):
            self.make_release('c' * 40, run)
        deployer = FakeDeployer(self.root)
        deployer.point_to(self.new)
        deployer.finish(self.new, (50, 1), 'deploy')
        self.assertTrue(manual.exists())
        self.assertEqual(len([p for p in deployer.releases.iterdir() if (p / '.deployed').exists()]), 5)
        self.assertTrue(self.new.exists())
        self.assertEqual(json.loads(deployer.state.read_text())['run_id'], 50)

    def test_failed_new_candidate_is_cleaned_without_touching_current(self):
        deployer = FakeDeployer(self.root)
        with patch.object(deployer, 'prepare', return_value=self.new), patch.object(deployer, 'stage', side_effect=RuntimeError('bad package')):
            with self.assertRaises(RuntimeError):
                deployer.deploy(Path('unused'), 'unused', 'b' * 40, (40, 1))
        self.assertFalse(self.new.exists())
        self.assertTrue(self.old.exists())
        self.assertEqual((self.root / 'current').resolve(), self.old)

    def test_success_marker_failure_is_a_transaction_failure(self):
        deployer = FakeDeployer(self.root)
        original_touch = Path.touch
        def touch(path, *args, **kwargs):
            if path == self.new / '.deployed':
                raise OSError('marker is unwritable')
            return original_touch(path, *args, **kwargs)
        with patch.object(release, 'mirror_ready'), patch.object(Path, 'touch', touch):
            with self.assertRaisesRegex(OSError, 'marker'):
                deployer.activate(self.new, 'b' * 40, lambda: deployer.finish(self.new, (40, 1), 'deploy'))
        self.assertEqual((self.root / 'current').resolve(), self.old)
        self.assertFalse(deployer.state.exists())

    def test_old_mirror_restart_error_does_not_skip_app_recovery(self):
        (self.new / 'deploy/catalog-mirror.py').write_text('new mirror')
        deployer = FakeDeployer(self.root, fail=True)
        restarts = 0
        def command(*args):
            nonlocal restarts
            deployer.commands.append(args)
            if args == ('systemctl', 'restart', 'astra-catalog-mirror'):
                restarts += 1
                if restarts == 2:
                    raise release.subprocess.CalledProcessError(1, args)
        deployer.command = command
        with patch.object(release, 'mirror_ready'):
            with self.assertRaises(RuntimeError):
                deployer.activate(self.new, 'b' * 40)
        self.assertEqual((self.root / 'current').resolve(), self.old)
        self.assertEqual(deployer.checks[-1][1], 'a' * 40)


if __name__ == '__main__':
    unittest.main()
