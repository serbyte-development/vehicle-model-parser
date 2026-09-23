"""Explicit, pinned download for the local-only AutoSpecNER diagnostic.

Raw source includes contact details. It is ignored by Git and excluded from npm.
Normal installs, tests, and builds do not execute this script.
"""
import hashlib
import json
from pathlib import Path
from urllib.request import urlopen


def main() -> None:
    root = Path(__file__).resolve().parent
    manifest = json.loads((root / 'manifest.json').read_text())
    for item in manifest['files']:
        target = root / item['localPath']
        if target.exists():
            content = target.read_bytes()
        else:
            url = (f"https://raw.githubusercontent.com/FilipposVentirozos/AutoSpecNER/"
                   f"{manifest['commit']}/{item['upstreamPath']}")
            with urlopen(url, timeout=60) as response:
                content = response.read()
        if len(content) != item['bytes'] or hashlib.sha256(content).hexdigest() != item['sha256']:
            raise RuntimeError(f"Pinned source checksum mismatch: {item['localPath']}")
        if not target.exists():
            target.write_bytes(content)
        print(f"Verified {item['localPath']}: {item['sha256']}")


if __name__ == '__main__':
    main()
