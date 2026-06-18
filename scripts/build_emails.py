import os
import subprocess
import shutil
from pathlib import Path

# Paths
ROOT_DIR = Path(__file__).parent.parent
TEMPLATE_DIR = ROOT_DIR / "apps" / "backend" / "templates" / "emails"
COMPILED_DIR = ROOT_DIR / "apps" / "backend" / "compiled_emails"

def build_emails():
    # Ensure compiled directory exists
    if COMPILED_DIR.exists():
        shutil.rmtree(COMPILED_DIR)
    COMPILED_DIR.mkdir(parents=True, exist_ok=True)

    # Find all .mjml files except those in components/ and layouts/
    mjml_files = list(TEMPLATE_DIR.glob("**/*.mjml"))
    
    # Filter out partials (components and layouts)
    # Actually, we want to compile everything that is a full template.
    # We'll assume transactional/ and marketing/ contain full templates.
    
    targets = []
    for f in mjml_files:
        if "components" in f.parts or "layouts" in f.parts:
            continue
        targets.append(f)

    print(f"Found {len(targets)} templates to compile.")

    for target in targets:
        # Define output path (keep relative structure if needed, or flatten)
        # For now, let's flatten them into COMPILED_DIR
        output_name = target.stem + ".html"
        output_path = COMPILED_DIR / output_name
        
        print(f"Compiling {target.name} -> {output_name}...")
        
        try:
            # Use npx mjml if installed locally
            result = subprocess.run(
                [
                    "npx", "mjml",
                    str(target),
                    "-o", str(output_path),
                    "--config.minify", "true",
                    "--config.allowIncludes", "true",
                    "--config.includePath", "apps/backend/templates/emails",
                    "--config.validationLevel", "skip"
                ],
                capture_output=True,
                text=True,
                check=True
            )
            if result.stdout:
                print(result.stdout)
        except subprocess.CalledProcessError as e:
            print(f"Error compiling {target.name}:")
            print(e.stderr)
            exit(1)

    print("Email compilation complete.")

if __name__ == "__main__":
    build_emails()
