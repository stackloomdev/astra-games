#!/usr/bin/env python3
"""Serve upstream READMEs and raster assets from GitHub's official archive."""

import hashlib
import io
import json
import os
import re
import sys
import tarfile
import threading
import time
import urllib.request
from urllib.parse import unquote, urlsplit
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ARCHIVE_URL = "https://codeload.github.com/MartinDelophy/awesome-gpt-6-astra/tar.gz/refs/heads/main"
MAX_ARCHIVE_BYTES = 64 * 1024 * 1024
MAX_README_BYTES = 2_000_000
MAX_ASSET_BYTES = 4 * 1024 * 1024
MAX_ASSETS_BYTES = 64 * 1024 * 1024
REFRESH_SECONDS = 300
SYNC_SECONDS = REFRESH_SECONDS - 60
RETRY_SECONDS = 30
MAX_AGE_SECONDS = REFRESH_SECONDS


def is_asset_path(path):
    parts = path.split("/")
    return (len(parts) >= 2 and parts[0] == "assets"
            and all(part not in ["", ".", ".."] for part in parts)
            and not re.search(r"[\\\x00-\x1f\x7f]", path)
            and re.search(r"\.(?:png|jpe?g|webp|gif|avif)$", path, re.I) is not None)


def raster_type(body):
    if len(body) < 16:
        return None
    if body.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if body.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if body.startswith((b"GIF87a", b"GIF89a")):
        return "image/gif"
    if body[:4] == b"RIFF" and body[8:12] == b"WEBP":
        return "image/webp"
    if body[4:8] == b"ftyp" and body[8:12] in [b"avif", b"avis"]:
        return "image/avif"
    return None


def read_archive(readme_paths):
    request = urllib.request.Request(ARCHIVE_URL, headers={"User-Agent": "Astra-Games-Catalog-Mirror/1.0"})
    with urllib.request.urlopen(request, timeout=30) as response:
        body = response.read(MAX_ARCHIVE_BYTES + 1)
    if len(body) > MAX_ARCHIVE_BYTES:
        raise ValueError("upstream archive exceeds size limit")
    documents = {}
    asset_bytes = 0
    with tarfile.open(fileobj=io.BytesIO(body), mode="r:gz") as archive:
        for member in archive:
            parts = member.name.split("/")
            if len(parts) < 2 or not member.isfile():
                continue
            path = "/".join(parts[1:])
            readme = len(parts) == 2 and path in readme_paths
            asset = is_asset_path(path)
            if not readme and not asset:
                continue
            limit = MAX_README_BYTES if readme else MAX_ASSET_BYTES
            if member.size > limit:
                if readme:
                    raise ValueError(f"{path} exceeds size limit")
                continue
            if asset and asset_bytes + member.size > MAX_ASSETS_BYTES:
                continue
            stream = archive.extractfile(member)
            if stream is None:
                raise ValueError(f"{path} is unreadable")
            content = stream.read(limit + 1)
            if readme:
                content.decode("utf-8")
            elif len(content) > limit or not raster_type(content):
                continue
            else:
                asset_bytes += len(content)
            documents[path] = content
    missing = set(readme_paths) - documents.keys()
    if missing:
        raise ValueError(f"missing upstream READMEs: {sorted(missing)}")
    return documents


class Snapshot:
    def __init__(self, readme_paths):
        self.readme_paths = readme_paths
        self.lock = threading.Lock()
        self.documents = {}
        self.checked_at = 0
        self.error = "initial synchronization pending"

    def synchronize(self):
        while True:
            try:
                documents = read_archive(self.readme_paths)
                with self.lock:
                    self.documents = documents
                    self.checked_at = time.time()
                    self.error = None
                print(json.dumps({"status": "fresh", "readmes": len(self.readme_paths),
                                  "assets": len(documents) - len(self.readme_paths),
                                  "checked_at": self.checked_at}), flush=True)
                # Fetch before the current snapshot expires so a healthy
                # download does not itself cause a gap of 503 responses.
                delay = SYNC_SECONDS
            except Exception as error:
                with self.lock:
                    self.error = str(error)
                print(json.dumps({"status": "unavailable", "error": str(error)}), flush=True)
                delay = RETRY_SECONDS
            time.sleep(delay)


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.respond(head=False)

    def do_HEAD(self):
        self.respond(head=True)

    def respond(self, head):
        try:
            path = unquote(urlsplit(self.path).path, errors="strict").lstrip("/")
        except (ValueError, UnicodeError):
            self.send_error(400)
            return
        snapshot = self.server.snapshot
        readme = path in snapshot.readme_paths
        asset = is_asset_path(path)
        if not readme and not asset:
            self.send_error(404)
            return
        with snapshot.lock:
            checked_at = snapshot.checked_at
            healthy = snapshot.error is None and time.time() - checked_at < MAX_AGE_SECONDS
            # An already synchronized screenshot can remain usable while a
            # refresh fails, just like the preview resolver's positive cache.
            content = snapshot.documents.get(path) if healthy or asset else None
        if content is None:
            # Let the application's existing last-good cache and retry logic
            # handle a failed synchronization, instead of labelling old data fresh.
            self.send_error(503 if readme else 404, "Upstream resource unavailable")
            return
        etag = '"' + hashlib.sha256(content).hexdigest() + '"'
        unchanged = self.headers.get("If-None-Match") == etag
        self.send_response(304 if unchanged else 200)
        self.send_header("X-Astra-Upstream-Checked-At", datetime.fromtimestamp(checked_at, timezone.utc).isoformat())
        self.send_header("ETag", etag)
        self.send_header("Cache-Control", "no-store")
        if unchanged:
            self.end_headers()
            return
        self.send_header("Content-Type", "text/plain; charset=utf-8" if readme else raster_type(content))
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        if not head:
            self.wfile.write(content)

    def log_message(self, *_):
        pass


def main():
    source = Path(sys.argv[1]).read_text()
    paths = sorted(set(re.findall(r"readme:\s*'([^']+)'", source)))
    if not paths or any(not re.fullmatch(r"README(?:\.[A-Za-z-]+)?\.md", path) for path in paths):
        raise ValueError("locale registry contains no valid README paths")
    snapshot = Snapshot(paths)
    server = ThreadingHTTPServer(("127.0.0.1", int(os.environ.get("ASTRA_MIRROR_PORT", "3031"))), Handler)
    server.snapshot = snapshot
    threading.Thread(target=snapshot.synchronize, daemon=True).start()
    server.serve_forever()


if __name__ == "__main__":
    main()
