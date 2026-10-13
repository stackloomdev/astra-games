"""Runtime checks shared by CI, staged ECS releases, and post-deploy checks."""
import argparse
import json
from pathlib import Path
import re
import time
import urllib.error
import urllib.parse
import urllib.request


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None


def get(base, path='', headers=None, redirects=True):
    opener = urllib.request.build_opener() if redirects else urllib.request.build_opener(NoRedirect)
    try:
        response = opener.open(urllib.request.Request(base.rstrip('/') + '/' + path.lstrip('/'), headers=headers or {}), timeout=15)
    except urllib.error.HTTPError as error:
        response = error
    with response:
        body = response.read(5_000_001)
        if len(body) > 5_000_000:
            raise ValueError('Smoke response too large')
        return response.status, response.headers, body


def wait_for(base, path, check, seconds=90):
    deadline = time.monotonic() + seconds
    while True:
        try:
            result = get(base, path)
            if check(result):
                return result
        except (OSError, ValueError):
            pass
        if time.monotonic() >= deadline:
            raise RuntimeError(f'Readiness failed: {path}')
        time.sleep(1)


def registry_entries(registry):
    source = Path(registry).read_text()
    entries = re.findall(r"code:\s*'([^']+)',\s*readme:\s*'([^']+)'", source)
    if not entries:
        raise ValueError('Empty locale registry')
    return entries


def mirror_ready(base, registry, seconds=90):
    for _, readme in registry_entries(registry):
        wait_for(base, readme, lambda r: r[0] == 200 and bool(r[1].get('X-Astra-Upstream-Checked-At')), seconds=seconds)


def verify(base, sha, registry, quick=False, legacy=False, require_fresh=True):
    if not legacy:
        _, _, body = wait_for(base, '/api/health', lambda r: r[0] == 200, seconds=90 if require_fresh else 30)
        health = json.loads(body)
        if health.get('status') != 'ok' or health.get('commit') != sha:
            raise RuntimeError('Health commit does not match the release')
    else:
        wait_for(base, '/en', lambda r: r[0] == 200, seconds=90 if require_fresh else 30)
    status, headers, _ = get(base, '/', {'Accept-Language': 'zh-CN'}, redirects=False)
    if status != 307 or urllib.parse.urlparse(headers.get('Location', '')).path != '/zh-CN':
        raise RuntimeError('Locale middleware redirect failed')
    entries = registry_entries(registry)
    locales = ['en', 'zh-CN'] if quick else [code for code, _ in entries]
    sample_html = ''
    chinese = None
    for locale in locales:
        status, _, body = get(base, '/' + locale)
        if status != 200 or b'<h1' not in body:
            raise RuntimeError(f'Homepage failed: {locale}')
        sample_html = body.decode()
        status, _, body = get(base, '/api/catalog?locale=' + locale)
        catalog = json.loads(body)
        if status != 200 or (require_fresh and catalog.get('source', {}).get('status') != 'fresh'):
            raise RuntimeError(f'Catalogue is not fresh: {locale}')
        if locale == 'zh-CN':
            chinese = catalog
    for path in ['/robots.txt', '/sitemap.xml', '/llms.txt']:
        if get(base, path)[0] != 200:
            raise RuntimeError(f'Discovery resource failed: {path}')
    for suffix in ['css', 'js']:
        paths = re.findall(r'(?:href|src)="(/_next/static/[^"?]+\.' + suffix + r')(?:\?[^\"]*)?"', sample_html)
        if not paths or get(base, paths[0])[0] != 200:
            raise RuntimeError(f'Standalone {suffix} assets are missing')
    cover = re.search(r'/covers/[a-f0-9]{16}-\d+\.webp', sample_html)
    if not cover or get(base, cover.group())[0] != 200:
        raise RuntimeError('Built WebP covers are missing')
    if not require_fresh:
        print('PASS: prior application and static assets restored; upstream freshness checked separately', flush=True)
        return
    screenshots = [work for work in (chinese or {}).get('works', []) if '/main/assets/' in (work.get('imageUrl') or '')]
    screenshots.sort(key=lambda work: 'miami-flap' not in work.get('imageUrl', ''))
    if not screenshots:
        raise RuntimeError('No upstream screenshot available for preview validation')
    for work in screenshots[:1 if quick else 3]:
        path = '/api/preview?' + urllib.parse.urlencode({'id': work['id'], 'l': 'zh-CN'})
        status, headers, body = get(base, path)
        if status != 200 or not headers.get('Content-Type', '').startswith('image/') or not body:
            raise RuntimeError(f'Author screenshot preview failed: {work["id"]}')
    print(f'PASS: {len(locales)} locales, fresh catalogues, middleware, static assets, and screenshot previews', flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('base', nargs='?')
    parser.add_argument('--sha')
    parser.add_argument('--registry', required=True)
    parser.add_argument('--mirror')
    args = parser.parse_args()
    if args.mirror:
        mirror_ready(args.mirror, args.registry)
    else:
        verify(args.base, args.sha, args.registry)
