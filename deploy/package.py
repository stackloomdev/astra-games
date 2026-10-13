"""Package only the standalone runtime and the explicit deployment allowlist."""
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import tarfile


def main():
    sha = os.environ['ASTRA_BUILD_SHA']
    run = os.environ['GITHUB_RUN_ID']
    attempt = os.environ['GITHUB_RUN_ATTEMPT']
    if not re.fullmatch(r'[a-f0-9]{40}', sha) or not all(re.fullmatch(r'[1-9][0-9]*', n) for n in [run, attempt]):
        raise ValueError('Invalid release identity')
    out = Path('dist')
    out.mkdir(exist_ok=True)
    payload = out / 'payload'
    if payload.exists():
        raise ValueError('Package output already exists; use a clean workspace')
    shutil.copytree('.next/standalone', payload, symlinks=True)
    # Build-time caches and accidental dotfiles are never part of a release.
    shutil.rmtree(payload / '.next/cache', ignore_errors=True)
    for path in payload.rglob('*'):
        if any(part == '.git' or part.startswith('.env') or part in {'.workbench', '.aws'} for part in path.relative_to(payload).parts):
            raise ValueError('Private configuration found in standalone output')
    for name in ['catalog-mirror.py', 'smoke.py', 'start-app.sh', 'astra-games.service', 'astra-catalog-mirror.service']:
        target = payload / 'deploy' / name
        target.parent.mkdir(exist_ok=True)
        shutil.copyfile(Path('deploy') / name, target)
    (payload / 'lib').mkdir(exist_ok=True)
    shutil.copyfile('lib/i18n.ts', payload / 'lib/i18n.ts')
    metadata = {'schema': 1, 'commit': sha, 'run_id': int(run), 'attempt': int(attempt)}
    (payload / 'release.json').write_text(json.dumps(metadata) + '\n')
    archive = out / 'release.tar.gz'
    with tarfile.open(archive, 'w:gz') as bundle:
        for child in sorted(payload.iterdir()):
            bundle.add(child, arcname=child.name)
    with archive.open('rb') as source:
        digest = hashlib.file_digest(source, 'sha256').hexdigest()
    (out / 'release.sha256').write_text(digest + '\n')
    print(f'Packaged {sha}: {archive.stat().st_size} bytes, SHA256 {digest}')


if __name__ == '__main__':
    main()
