"""Serveur local E2E : base SQLite temporaire, indépendante des finances réelles."""
import os
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
os.chdir(ROOT)
os.environ["OMNIBANK_DATA_DIR"] = tempfile.mkdtemp(prefix="omnibank_ui_v2_")

if __name__ == "__main__":
    import sys
    sys.path.insert(0, str(ROOT))
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8436, log_level="warning")
