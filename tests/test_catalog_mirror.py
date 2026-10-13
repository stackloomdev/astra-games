import importlib.util
import base64
import io
import tarfile
import threading
import time
import unittest
import urllib.error
import urllib.request
from pathlib import Path
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("catalog_mirror", Path(__file__).parents[1] / "deploy/catalog-mirror.py")
mirror = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mirror)
PNG = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQAAAABJRU5ErkJggg==")
ASSET = "assets/screenshots/miami-flap/gameplay.png"


def archive_response(documents, symlinks=()):
    body = io.BytesIO()
    with tarfile.open(fileobj=body, mode="w:gz") as archive:
        for name, content in documents.items():
            member = tarfile.TarInfo(f"repository-main/{name}")
            member.size = len(content)
            archive.addfile(member, io.BytesIO(content))
        for name in symlinks:
            member = tarfile.TarInfo(f"repository-main/{name}")
            member.type = tarfile.SYMTYPE
            member.linkname = "/etc/passwd"
            archive.addfile(member)
    return io.BytesIO(body.getvalue())


class ArchiveTests(unittest.TestCase):
    def test_partial_language_archive_is_rejected(self):
        response = archive_response({"README.md": b"# English"})
        with patch.object(mirror.urllib.request, "urlopen", return_value=response):
            with self.assertRaisesRegex(ValueError, "missing upstream READMEs"):
                mirror.read_archive(["README.md", "README.zh-CN.md"])

    def test_only_registered_root_files_are_loaded(self):
        response = archive_response({"README.md": b"# English", "nested/README.md": b"unrelated", "README.zh-CN.md": "# 中文".encode()})
        with patch.object(mirror.urllib.request, "urlopen", return_value=response):
            self.assertEqual(mirror.read_archive(["README.md", "README.zh-CN.md"]), {"README.md": b"# English", "README.zh-CN.md": "# 中文".encode()})

    def test_archive_symlinks_cannot_supply_documents(self):
        response = archive_response({}, symlinks=["README.md"])
        with patch.object(mirror.urllib.request, "urlopen", return_value=response):
            with self.assertRaisesRegex(ValueError, "missing upstream READMEs"):
                mirror.read_archive(["README.md"])

    def test_only_bounded_raster_assets_are_retained_with_the_readmes(self):
        response = archive_response({"README.md": b"# English", ASSET: PNG,
                                     "assets/fake.png": b"<html>not an image</html>",
                                     "assets/../private.png": PNG, "private/image.png": PNG})
        with patch.object(mirror.urllib.request, "urlopen", return_value=response):
            self.assertEqual(mirror.read_archive(["README.md"]), {"README.md": b"# English", ASSET: PNG})

    def test_asset_byte_limits_do_not_break_readme_synchronization(self):
        for limit_name in ["MAX_ASSET_BYTES", "MAX_ASSETS_BYTES"]:
            response = archive_response({"README.md": b"# English", ASSET: PNG})
            with patch.object(mirror.urllib.request, "urlopen", return_value=response), patch.object(mirror, limit_name, len(PNG) - 1):
                self.assertEqual(mirror.read_archive(["README.md"]), {"README.md": b"# English"})


class HttpTests(unittest.TestCase):
    def setUp(self):
        self.snapshot = mirror.Snapshot(["README.md"])
        self.snapshot.documents = {"README.md": b"# Current catalogue", ASSET: PNG}
        self.snapshot.checked_at = time.time()
        self.snapshot.error = None
        self.server = mirror.ThreadingHTTPServer(("127.0.0.1", 0), mirror.Handler)
        self.server.snapshot = self.snapshot
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.url = f"http://127.0.0.1:{self.server.server_port}/README.md"

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join()

    def test_get_head_and_conditional_request(self):
        with urllib.request.urlopen(self.url) as response:
            self.assertEqual(response.read(), b"# Current catalogue")
            etag = response.headers["ETag"]
        with urllib.request.urlopen(urllib.request.Request(self.url, method="HEAD")) as response:
            self.assertEqual(response.status, 200)
            self.assertEqual(response.read(), b"")
            self.assertEqual(int(response.headers["Content-Length"]), len(b"# Current catalogue"))
        request = urllib.request.Request(self.url, headers={"If-None-Match": etag})
        with self.assertRaises(urllib.error.HTTPError) as caught:
            urllib.request.urlopen(request)
        self.assertEqual(caught.exception.code, 304)
        caught.exception.close()

    def test_failed_or_expired_sync_is_not_reported_as_fresh(self):
        for condition in ["failed", "expired"]:
            with self.subTest(condition=condition):
                self.snapshot.error = "upstream unavailable" if condition == "failed" else None
                self.snapshot.checked_at = time.time() - mirror.MAX_AGE_SECONDS - 1 if condition == "expired" else time.time()
                with self.assertRaises(urllib.error.HTTPError) as caught:
                    urllib.request.urlopen(self.url)
                self.assertEqual(caught.exception.code, 503)
                caught.exception.close()
                self.assertEqual(self.snapshot.documents["README.md"], b"# Current catalogue")

    def test_a_last_good_screenshot_remains_available_during_a_refresh_failure(self):
        self.snapshot.error = "upstream unavailable"
        self.snapshot.checked_at = time.time() - mirror.MAX_AGE_SECONDS - 1
        url = self.url.rsplit("/", 1)[0] + "/" + ASSET
        with urllib.request.urlopen(url) as response:
            self.assertEqual(response.status, 200)
            self.assertEqual(response.headers["Content-Type"], "image/png")
            self.assertEqual(response.read(), PNG)

    def test_a_removed_screenshot_does_not_remain_in_a_new_snapshot(self):
        self.snapshot.documents = {"README.md": b"# New catalogue"}
        url = self.url.rsplit("/", 1)[0] + "/" + ASSET
        with self.assertRaises(urllib.error.HTTPError) as caught:
            urllib.request.urlopen(url)
        self.assertEqual(caught.exception.code, 404)
        caught.exception.close()


if __name__ == "__main__":
    unittest.main()
