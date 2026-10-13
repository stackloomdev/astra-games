"""CI client. Credentials stay on the ephemeral runner, never in the package."""
import hashlib
import json
import os
from pathlib import Path
import re
import shlex
import subprocess
import time


def write_credentials(config, key_id, key_secret):
    config.parent.mkdir(mode=0o700, exist_ok=True)
    # builtins.open supports an opener; pathlib.Path.open does not.
    output = open(config, 'x', opener=lambda path, flags: os.open(path, flags, 0o600))
    try:
        with output:
            json.dump({'current': 'default', 'profiles': {'default': {
                'mode': 'AK', 'access_key_id': key_id, 'access_key_secret': key_secret,
            }}}, output)
    except BaseException:
        # Exclusive open succeeded: only this invocation's new file is removed.
        config.unlink(missing_ok=True)
        raise


def main():
    instance = os.environ['ECS_INSTANCE_ID']
    region = os.environ['ECS_REGION']
    sha = os.environ['GITHUB_SHA']
    run_id = os.environ['GITHUB_RUN_ID']
    attempt = os.environ['GITHUB_RUN_ATTEMPT']
    action = os.environ.get('DEPLOY_ACTION') or 'deploy'
    release = os.environ.get('ROLLBACK_RELEASE', '')
    if not re.fullmatch(r'i-[a-z0-9]+', instance) or not re.fullmatch(r'[a-z0-9-]+', region):
        raise ValueError('Configure ECS_INSTANCE_ID and ECS_REGION repository variables')
    if not re.fullmatch(r'[a-f0-9]{40}', sha) or not all(re.fullmatch(r'[1-9][0-9]*', n) for n in [run_id, attempt]):
        raise ValueError('Invalid GitHub workflow identity')
    if action not in {'deploy', 'rollback'} or (action == 'rollback' and not re.fullmatch(r'[a-f0-9]{40}-[1-9][0-9]*-[1-9][0-9]*', release)):
        raise ValueError('Select a retained successful release ID for rollback')
    key_id = os.environ.get('ALIBABA_CLOUD_ACCESS_KEY_ID')
    key_secret = os.environ.get('ALIBABA_CLOUD_ACCESS_KEY_SECRET')
    if not key_id or not key_secret:
        raise ValueError('Configure ALIBABA_CLOUD_ACCESS_KEY_ID and ALIBABA_CLOUD_ACCESS_KEY_SECRET Actions secrets')
    config = Path.home() / '.workbench/config.json'
    # A runner must start without other Workbench profiles; never overwrite one.
    write_credentials(config, key_id, key_secret)
    child_env = {key: value for key, value in os.environ.items() if key not in {'ALIBABA_CLOUD_ACCESS_KEY_ID', 'ALIBABA_CLOUD_ACCESS_KEY_SECRET'}}

    def cli(*args):
        result = subprocess.run(['workbench', *args], env=child_env, capture_output=True, text=True,
                                timeout=600 if args[0] == 'upload' else 75)
        if result.returncode:
            raise RuntimeError(f'Workbench failed with exit {result.returncode}: {result.stderr[-1500:]}')
        return result.stdout

    def remote(args):
        output = cli('exec', '--instance-id', instance, '--region', region, '--timeout', '60', '--output', 'json', '--command', shlex.join(args))
        data = json.loads(output)
        if data.get('exit_code', 0):
            raise RuntimeError(data.get('stderr', '') or data.get('stdout', data.get('output', 'Remote command failed')))
        return data.get('stdout', data.get('output', ''))

    directory = f'/var/tmp/astra-ci-{run_id}-{attempt}'
    unit = f'astra-deploy-{run_id}-{attempt}'
    try:
        remote(['install', '-d', '-m', '0700', directory])

        def upload(local, name):
            target = directory + '/' + name
            with local.open('rb') as source:
                digest = hashlib.file_digest(source, 'sha256').hexdigest()
            check = 'import hashlib,pathlib,sys; p=pathlib.Path(sys.argv[1]); print(hashlib.file_digest(p.open("rb"),"sha256").hexdigest() if p.exists() else "absent")'
            present = remote(['python3', '-c', check, target]).strip()
            if present == 'absent':
                cli('upload', str(local), target, '--instance-id', instance, '--region', region)
                present = remote(['python3', '-c', check, target]).strip()
            if present != digest:
                raise RuntimeError('Upload checksum mismatch; refusing to overwrite a different remote file')
            return target

        script = upload(Path('deploy/release.py'), 'release.py')
        upload(Path('deploy/smoke.py'), 'smoke.py')
        args = ['/usr/bin/python3', script, action, '--run-id', run_id, '--attempt', attempt]
        if action == 'deploy':
            archive = upload(Path('dist/release.tar.gz'), 'release.tar.gz')
            checksum = Path('dist/release.sha256').read_text().strip()
            args += ['--archive', archive, '--checksum', checksum, '--sha', sha]
        else:
            args += ['--release', release]
        # systemd owns the transaction even if a runner disconnects or is canceled.
        remote(['systemd-run', '--unit', unit, '--property=Type=exec', '--property=RuntimeMaxSec=600',
                '--property=TimeoutStopSec=180', '--property=KillMode=mixed', *args])
        deadline = time.monotonic() + 840
        while True:
            fields = remote(['systemctl', 'show', unit, '-p', 'ActiveState', '-p', 'SubState', '-p', 'Result', '-p', 'ExecMainStatus'])
            state = dict(line.split('=', 1) for line in fields.splitlines() if '=' in line)
            if state.get('ActiveState') not in {'active', 'activating', 'deactivating'}:
                log = remote(['journalctl', '-u', unit, '-n', '100', '--no-pager'])
                print(log, flush=True)
                if state.get('Result') != 'success' or state.get('ExecMainStatus') != '0':
                    raise RuntimeError('ECS deployment failed; see the transaction log above')
                break
            if time.monotonic() >= deadline:
                raise RuntimeError('ECS transaction exceeded the observation deadline; inspect its systemd log')
            time.sleep(5)
    finally:
        try:
            subprocess.run(['workbench', 'daemon', 'stop'], env=child_env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=15)
        finally:
            config.unlink(missing_ok=True)


if __name__ == '__main__':
    main()
