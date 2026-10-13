"""Transactional release installer. Run as root through Workbench on ECS."""
import argparse
import fcntl
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import pwd
import re
import shutil
import signal
import subprocess
import tarfile

from smoke import mirror_ready, verify

ROOT = Path('/opt/astra-games')
NODE = '/opt/node-v24.21.0/bin/node'
RELEASE_ID = re.compile(r'(?:[a-f0-9]{40}-[1-9][0-9]*-[1-9][0-9]*|[0-9]{8}T[0-9]{6})')


def run(*args):
    subprocess.run(args, check=True, timeout=120)


def safe_members(archive):
    members = archive.getmembers()
    if len(members) > 50_000 or sum(member.size for member in members) > 1_000_000_000:
        raise ValueError('Release archive exceeds extraction limits')
    for member in members:
        path = PurePosixPath(member.name)
        if path.is_absolute() or '..' in path.parts or '\\' in member.name or any(ord(c) < 32 for c in member.name):
            raise ValueError('Unsafe archive path')
        if any(part == '.git' or part.startswith('.env') or part in {'.aws', '.workbench'} for part in path.parts):
            raise ValueError('Private configuration in release archive')
        if not (member.isfile() or member.isdir() or member.issym()):
            raise ValueError('Unsupported archive entry')
    return members


def write_json(path, value):
    temporary = path.with_name(path.name + '.tmp')
    temporary.write_text(json.dumps(value) + '\n')
    os.replace(temporary, path)


class Deployer:
    def __init__(self, root=ROOT, command=run, checker=verify, unit_dir=Path('/etc/systemd/system')):
        self.root = root
        self.command = command
        self.checker = checker
        self.current = root / 'current'
        self.releases = root / 'releases'
        self.state = root / 'deployment-state.json'
        self.unit_dir = unit_dir

    def snapshot_configuration(self):
        paths = [self.root / 'start-app.sh', *[self.unit_dir / name for name in ['astra-games.service', 'astra-catalog-mirror.service']]]
        return {path: (path.read_bytes(), path.stat().st_mode & 0o777) if path.exists() else None for path in paths}

    def restore_configuration(self, snapshot):
        for path, previous in snapshot.items():
            if previous is None:
                path.unlink(missing_ok=True)
            else:
                path.write_bytes(previous[0])
                path.chmod(previous[1])
        self.command('systemctl', 'daemon-reload')

    def newer_than(self, sequence):
        if not self.state.exists():
            return False
        state = json.loads(self.state.read_text())
        return (state['run_id'], state['attempt']) >= sequence

    def prepare(self, archive_path, checksum, sha, sequence):
        with archive_path.open('rb') as source:
            digest = hashlib.file_digest(source, 'sha256').hexdigest()
        if digest != checksum:
            raise ValueError('Release checksum mismatch')
        release = self.releases / f'{sha}-{sequence[0]}-{sequence[1]}'
        release.mkdir(mode=0o750)
        try:
            with tarfile.open(archive_path, 'r:gz') as archive:
                members = safe_members(archive)
                archive.extractall(release, members=members, filter='data')
            metadata = json.loads((release / 'release.json').read_text())
            expected = {'schema': 1, 'commit': sha, 'run_id': sequence[0], 'attempt': sequence[1]}
            if metadata != expected or (release / '.next/BUILD_ID').read_text().strip() != sha:
                raise ValueError('Release metadata or build ID mismatch')
            required = ['server.js', 'public/covers/manifest.json', '.next/static', 'lib/i18n.ts',
                        'deploy/catalog-mirror.py', 'deploy/smoke.py', 'deploy/start-app.sh',
                        'deploy/astra-games.service', 'deploy/astra-catalog-mirror.service']
            if any(not (release / name).exists() for name in required):
                raise ValueError('Incomplete standalone release')
            account = pwd.getpwnam('astra-games')
            for path in [release, *release.rglob('*')]:
                os.chown(path, account.pw_uid, account.pw_gid, follow_symlinks=False)
            return release
        except BaseException:
            shutil.rmtree(release)
            raise

    def configure(self, release):
        shutil.copyfile(release / 'deploy/start-app.sh', self.root / 'start-app.sh')
        (self.root / 'start-app.sh').chmod(0o755)
        for name in ['astra-games.service', 'astra-catalog-mirror.service']:
            shutil.copyfile(release / 'deploy' / name, self.unit_dir / name)
        self.command('systemctl', 'daemon-reload')
        self.command('systemctl', 'enable', 'astra-games', 'astra-catalog-mirror')

    def stage(self, release, sha):
        env = {**os.environ, 'NODE_ENV': 'production', 'NEXT_TELEMETRY_DISABLED': '1',
               'ASTRA_MIRROR_PORT': '3032', 'ASTRA_README_BASE_URL': 'http://127.0.0.1:3032/',
               'HOSTNAME': '127.0.0.1', 'PORT': '3101'}
        children = []
        try:
            for name, args in [('mirror', ['/usr/bin/python3', '-u', str(release / 'deploy/catalog-mirror.py'), str(release / 'lib/i18n.ts')]),
                               ('app', [NODE, str(release / 'server.js')])]:
                with (release / f'{name}-stage.log').open('wb') as output:
                    process = subprocess.Popen(['runuser', '-u', 'astra-games', '--', *args], cwd=release,
                                               env=env, stdout=output, stderr=subprocess.STDOUT, start_new_session=True)
                children.append(process)
                if name == 'mirror':
                    mirror_ready('http://127.0.0.1:3032/', release / 'lib/i18n.ts')
            self.checker('http://127.0.0.1:3101', sha, release / 'lib/i18n.ts')
        finally:
            for process in reversed(children):
                if process.poll() is None:
                    os.killpg(process.pid, signal.SIGTERM)
                    try:
                        process.wait(timeout=10)
                    except subprocess.TimeoutExpired:
                        os.killpg(process.pid, signal.SIGKILL)
                        process.wait()

    def point_to(self, release):
        link = self.root / '.current-next'
        link.unlink(missing_ok=True)
        link.symlink_to(release)
        os.replace(link, self.current)

    def activate(self, release, sha, on_success=None):
        previous = self.current.resolve(strict=True)
        # Preserve the production mirror's last-good snapshot when its code and
        # locale registry are unchanged; staging used an independent process.
        mirror_changed = any(not (previous / name).is_file() or not (release / name).is_file() or
                             (previous / name).read_bytes() != (release / name).read_bytes()
                             for name in ['deploy/catalog-mirror.py', 'lib/i18n.ts'])
        configuration = self.snapshot_configuration()
        try:
            self.configure(release)
            self.point_to(release)
            if mirror_changed:
                self.command('systemctl', 'restart', 'astra-catalog-mirror')
            else:
                self.command('systemctl', 'start', 'astra-catalog-mirror')
            mirror_ready('http://127.0.0.1:3031/', release / 'lib/i18n.ts')
            self.command('systemctl', 'restart', 'astra-games')
            self.checker('http://127.0.0.1:3000', sha, release / 'lib/i18n.ts', quick=True)
            self.checker('http://127.0.0.1', sha, release / 'lib/i18n.ts', quick=True)
            if on_success:
                on_success()
        except BaseException:
            print('Post-deploy check failed; restoring previous release', flush=True)
            self.point_to(previous)
            self.restore_configuration(configuration)
            if mirror_changed:
                try:
                    self.command('systemctl', 'restart', 'astra-catalog-mirror')
                    mirror_ready('http://127.0.0.1:3031/', previous / 'lib/i18n.ts', seconds=10)
                except (RuntimeError, OSError, subprocess.SubprocessError):
                    print('WARNING: prior upstream mirror is unavailable; restoring the app with its static pages and fallback', flush=True)
            self.command('systemctl', 'restart', 'astra-games')
            previous_metadata = previous / 'release.json'
            previous_sha = json.loads(previous_metadata.read_text())['commit'] if previous_metadata.exists() else None
            self.checker('http://127.0.0.1', previous_sha, previous / 'lib/i18n.ts', quick=True, legacy=not previous_metadata.exists(), require_fresh=False)
            print(f'ROLLBACK_OK: {previous.name}', flush=True)
            raise

    def finish(self, release, sequence, action):
        (release / '.deployed').touch()
        write_json(self.state, {'run_id': sequence[0], 'attempt': sequence[1], 'release': release.name, 'action': action})
        try:
            # Only prune releases produced by this installer; preserve manual ones.
            completed = sorted((path for path in self.releases.iterdir() if path.is_dir() and not path.is_symlink() and (path / '.deployed').exists()),
                               key=lambda path: (path / '.deployed').stat().st_mtime, reverse=True)
            for old in completed[5:]:
                if old != self.current.resolve():
                    shutil.rmtree(old)
        except OSError as error:
            print(f'WARNING: release retention could not complete: {error}', flush=True)
        print(f'DEPLOY_OK: {release.name}', flush=True)

    def deploy(self, archive, checksum, sha, sequence):
        if self.newer_than(sequence):
            print('SKIPPED: a newer or identical workflow has already completed', flush=True)
            return
        release = self.prepare(archive, checksum, sha, sequence)
        try:
            self.stage(release, sha)
            self.activate(release, sha, lambda: self.finish(release, sequence, 'deploy'))
        finally:
            # This is a new candidate owned by this transaction. Keep successful
            # versions and never remove a directory still serving production.
            if release.exists() and release != self.current.resolve():
                shutil.rmtree(release)

    def rollback(self, release_id, sequence):
        if not RELEASE_ID.fullmatch(release_id):
            raise ValueError('Invalid rollback release ID')
        if self.newer_than(sequence):
            print('SKIPPED: a newer or identical workflow has already completed', flush=True)
            return
        release = self.releases / release_id
        if not release.is_dir() or release.is_symlink() or not (release / '.deployed').exists():
            raise ValueError('Rollback target is not a retained successful release')
        metadata = json.loads((release / 'release.json').read_text())
        self.stage(release, metadata['commit'])
        self.activate(release, metadata['commit'], lambda: self.finish(release, sequence, 'rollback'))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('action', choices=['deploy', 'rollback'])
    parser.add_argument('--archive', type=Path)
    parser.add_argument('--checksum')
    parser.add_argument('--sha')
    parser.add_argument('--release')
    parser.add_argument('--run-id', type=int, required=True)
    parser.add_argument('--attempt', type=int, required=True)
    args = parser.parse_args()
    if args.run_id < 1 or args.attempt < 1:
        parser.error('Invalid workflow sequence')
    if os.geteuid() != 0:
        parser.error('Run this installer as root on ECS')
    if args.action == 'deploy' and (not args.archive or not re.fullmatch(r'[a-f0-9]{64}', args.checksum or '') or not re.fullmatch(r'[a-f0-9]{40}', args.sha or '')):
        parser.error('Deployment requires archive, checksum and full commit SHA')
    try:
        with (ROOT / '.deployment.lock').open('a') as lock:
            fcntl.flock(lock, fcntl.LOCK_EX)
            deployer = Deployer()
            sequence = (args.run_id, args.attempt)
            if args.action == 'deploy':
                deployer.deploy(args.archive, args.checksum, args.sha, sequence)
            else:
                deployer.rollback(args.release or '', sequence)
    finally:
        # Cleanup runs on ECS, including when the CI runner has disconnected.
        staging = Path(__file__).resolve().parent
        if staging.parent == Path('/var/tmp') and re.fullmatch(r'astra-ci-[1-9][0-9]*-[1-9][0-9]*', staging.name):
            try:
                shutil.rmtree(staging)
            except OSError as error:
                print(f'WARNING: staging cleanup failed: {error}', flush=True)


if __name__ == '__main__':
    def terminate(signum, frame):
        raise RuntimeError('Deployment interrupted; restoring if activation has started')
    signal.signal(signal.SIGTERM, terminate)
    main()
