import importlib.util
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('workbench_release', Path(__file__).resolve().parents[1] / 'deploy/workbench-release.py')
client = importlib.util.module_from_spec(spec)
spec.loader.exec_module(client)


class CredentialTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.home = Path(self.temp.name)
        self.config = self.home / '.workbench/config.json'

    def tearDown(self):
        self.temp.cleanup()

    def test_config_is_private_and_handles_literal_characters(self):
        client.write_credentials(self.config, 'dummy-id', 'dummy-quote"\nvalue')
        self.assertEqual(self.config.stat().st_mode & 0o777, 0o600)
        self.assertEqual(self.config.parent.stat().st_mode & 0o777, 0o700)
        profile = json.loads(self.config.read_text())['profiles']['default']
        self.assertEqual(profile, {'mode': 'AK', 'access_key_id': 'dummy-id', 'access_key_secret': 'dummy-quote"\nvalue'})

    def test_existing_credentials_are_never_overwritten(self):
        client.write_credentials(self.config, 'first-dummy', 'first-value')
        previous = self.config.read_bytes()
        with self.assertRaises(FileExistsError):
            client.write_credentials(self.config, 'second-dummy', 'second-value')
        self.assertEqual(self.config.read_bytes(), previous)

    def test_partial_write_failure_removes_only_the_new_file(self):
        def broken_dump(data, output):
            output.write('dummy partial bytes')
            raise OSError('simulated write failure')
        with patch.object(client.json, 'dump', side_effect=broken_dump):
            with self.assertRaisesRegex(OSError, 'write failure'):
                client.write_credentials(self.config, 'dummy-id', 'dummy-value')
        self.assertFalse(self.config.exists())

    def test_failure_always_removes_credentials_and_excludes_them_from_child_environment(self):
        env = {'ECS_INSTANCE_ID': 'i-example', 'ECS_REGION': 'cn-hangzhou', 'GITHUB_SHA': 'a' * 40,
               'GITHUB_RUN_ID': '1', 'GITHUB_RUN_ATTEMPT': '1',
               'ALIBABA_CLOUD_ACCESS_KEY_ID': 'dummy-id', 'ALIBABA_CLOUD_ACCESS_KEY_SECRET': 'dummy-value'}
        calls = []
        def command(args, **kwargs):
            calls.append(args)
            self.assertNotIn('ALIBABA_CLOUD_ACCESS_KEY_ID', kwargs['env'])
            self.assertNotIn('ALIBABA_CLOUD_ACCESS_KEY_SECRET', kwargs['env'])
            if args == ['workbench', 'daemon', 'stop']:
                raise subprocess.TimeoutExpired(args, 15)
            return subprocess.CompletedProcess(args, 5, '', 'simulated connection failure')
        with patch.dict(os.environ, env, clear=True), patch.object(Path, 'home', return_value=self.home), patch.object(client.subprocess, 'run', side_effect=command):
            with self.assertRaises(subprocess.TimeoutExpired):
                client.main()
        self.assertFalse(self.config.exists())
        self.assertEqual(calls[-1], ['workbench', 'daemon', 'stop'])


if __name__ == '__main__':
    unittest.main()
