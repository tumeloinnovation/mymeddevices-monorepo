#!/usr/bin/env python3
"""
Script to compile MJML email templates into HTML templates in apps/backend/compiled_emails/
"""

import os
import subprocess
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).parent.parent.resolve()
TEMPLATES_DIR = ROOT_DIR / "apps" / "backend" / "templates" / "emails"
COMPILED_DIR = ROOT_DIR / "apps" / "backend" / "compiled_emails"

EXCLUDE_DIRS = {"components", "layouts"}


def build_emails():
    if not TEMPLATES_DIR.exists():
        print(f"Templates directory not found: {TEMPLATES_DIR}")
        sys.exit(1)

    COMPILED_DIR.mkdir(parents=True, exist_ok=True)
    gitkeep = COMPILED_DIR / ".gitkeep"
    if not gitkeep.exists():
        gitkeep.touch()

    mjml_files = []
    for root, dirs, files in os.walk(TEMPLATES_DIR):
        # Skip excluded directories
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        for file in files:
            if file.endswith(".mjml"):
                mjml_files.append(Path(root) / file)

    if not mjml_files:
        print("No MJML files found to compile.")
        return

    print(f"Found {len(mjml_files)} MJML template(s) to compile.")

    compiled_count = 0
    for mjml_path in sorted(mjml_files):
        out_name = f"{mjml_path.stem}.html"
        out_path = COMPILED_DIR / out_name
        rel_src = mjml_path.relative_to(ROOT_DIR)
        rel_dst = out_path.relative_to(ROOT_DIR)

        print(f"Compiling {rel_src} -> {rel_dst}...")
        cmd = [
            "npx",
            "mjml",
            str(mjml_path),
            "-o",
            str(out_path),
            "--config.allowIncludes",
            "true",
            "--config.includePath",
            str(TEMPLATES_DIR),
        ]

        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"Error compiling {mjml_path.name}:\n{result.stderr}")
            sys.exit(1)
        else:
            compiled_count += 1

    print(f"Successfully compiled {compiled_count} email template(s) to {COMPILED_DIR}")


if __name__ == "__main__":
    build_emails()
