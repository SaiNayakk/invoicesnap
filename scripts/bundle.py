import tarfile
from pathlib import Path

root = Path("C:/Users/sai34/Desktop/Projects/invoicesnap")
out_dir = root / "dist"
out_dir.mkdir(exist_ok=True)
archive_path = out_dir / "invoicesnap_src.tar.gz"

# Create run.sh inside root with LF endings
run_sh = root / "run.sh"
run_sh.write_bytes(b"""#!/bin/sh
set -e
cd "$(dirname "$0")"

export PORT=3002
echo "Starting InvoiceSnap on port 3002..."
exec ./node_modules/.bin/next start -p 3002
""")

include_top = [
    "src", "public", "scripts",
    "package.json", "package-lock.json", "tsconfig.json",
    "next.config.ts", "postcss.config.mjs",
    ".env.local", "run.sh"
]

with tarfile.open(archive_path, "w:gz") as tar:
    for item in include_top:
        p = root / item
        if p.exists():
            print(f"Adding {item}...")
            tar.add(p, arcname=item)

print("Source archive created at:", archive_path, f"({archive_path.stat().st_size / 1024 / 1024:.2f} MB)")
