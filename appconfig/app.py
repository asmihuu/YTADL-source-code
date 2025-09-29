from fastapi import FastAPI, Query
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import subprocess
import json
import re
import threading

# uvicorn app:app --reload --port 8000

# ---------------- FastAPI Setup ----------------
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restrict to your frontend if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Start from current script location (e.g., backend/)
BASE_DIR = Path(__file__).resolve().parent

# Go one level up to reach the project root, then to downloads/
DOWNLOADS_DIR = BASE_DIR.parent / "downloads"
DOWNLOADS_DIR.mkdir(exist_ok=True)

# Define paths to binaries
YTDLP_PATH = BASE_DIR / "bin/yt-dlp.exe"
FFMPEG_PATH = BASE_DIR / "bin/ffmpeg.exe"

# Define path to metadata file
META_FILE = DOWNLOADS_DIR / "downloads.json"

# ---------------- Static Files ----------------
app.mount("/files", StaticFiles(directory=str(DOWNLOADS_DIR)), name="files")

# ---------------- Helpers ----------------


def sanitize_text(text: str) -> str:
    return re.sub(r'[\\/:*?"<>|]', "_", text) if text else ""


def load_metadata():
    if META_FILE.exists():
        with open(META_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def save_metadata(data):
    with open(META_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def download_task(url: str, video_id: str, format: str):
    try:
        # Download audio
        audio_file = DOWNLOADS_DIR / f"{video_id}.{format}"
        subprocess.run([
            str(YTDLP_PATH),
            "-x",
            f"--audio-format={format}",
            f"--ffmpeg-location={FFMPEG_PATH.parent}",
            "-o", str(audio_file),
            url
        ], check=True)

        # Download thumbnail
        thumb_file = DOWNLOADS_DIR / f"{video_id}.webp"
        subprocess.run([
            str(YTDLP_PATH),
            "--skip-download",
            "--write-thumbnail",
            "--convert-thumbnails", "webp",
            "-o", f"{video_id}.%(ext)s",
            url
        ], check=True, cwd=DOWNLOADS_DIR)

        # Save metadata
        cmd_meta = [
            str(YTDLP_PATH),
            "--skip-download",
            "--print-json",
            f"--ffmpeg-location={FFMPEG_PATH.parent}",
            url
        ]
        meta_proc = subprocess.run(
            cmd_meta, capture_output=True, text=True, check=True)
        metadata = json.loads(meta_proc.stdout.splitlines()[0])

        entry = {
            "id": video_id,
            "title": sanitize_text(metadata.get("title", "Unknown Title")),
            "audio": f"/files/{audio_file.name}",
            "thumbnail": f"/files/{thumb_file.name}" if thumb_file.exists() else None,
            "duration": metadata.get("duration"),
            "uploader": sanitize_text(metadata.get("uploader", "Unknown Uploader")),
            "upload_date": sanitize_text(metadata.get("upload_date", ""))
        }

        all_meta = load_metadata()
        all_meta.append(entry)
        save_metadata(all_meta)

    except Exception as e:
        print(f"Download error for {video_id}: {e}")

# ---------------- API Routes ----------------


@app.get("/download")
def download(url: str, format: str = Query("mp3", enum=["mp3", "m4a", "opus"])):
    try:
        cmd_meta = [
            str(YTDLP_PATH),
            "--skip-download",
            "--print-json",
            f"--ffmpeg-location={FFMPEG_PATH.parent}",
            url
        ]
        meta_proc = subprocess.run(
            cmd_meta, capture_output=True, text=True, check=True)
        metadata = json.loads(meta_proc.stdout.splitlines()[0])
        video_id = metadata["id"]

        # Check if already downloaded
        all_meta = load_metadata()
        existing = next((m for m in all_meta if m["id"] == video_id), None)
        if existing:
            return {"status": "already_downloaded", "entry": existing}

        # Start background download
        threading.Thread(target=download_task, args=(
            url, video_id, format), daemon=True).start()
        return {"status": "started", "video_id": video_id}

    except Exception as e:
        return {"status": "error", "error": str(e)}

BACKEND_URL = "http://localhost:8000"

@app.get("/list")
def list_downloads():
    all_meta = load_metadata()
    for entry in all_meta:
        entry["audio"] = f"{BACKEND_URL}/files/{Path(entry['audio']).name}"
        if entry.get("thumbnail"):
            entry["thumbnail"] = f"{BACKEND_URL}/files/{Path(entry['thumbnail']).name}"
    return {"status": "success" if all_meta else "empty", "downloads": all_meta[::-1]}

@app.get("/remove")
def remove_download(id: str):
    all_meta = load_metadata()
    entry = next((m for m in all_meta if m["id"] == id), None)
    if not entry:
        return {"status": "error", "message": f"No entry found with id {id}"}

    audio_file = DOWNLOADS_DIR / Path(entry["audio"]).name
    if audio_file.exists():
        audio_file.unlink()
    if entry.get("thumbnail"):
        thumb_file = DOWNLOADS_DIR / Path(entry["thumbnail"]).name
        if thumb_file.exists():
            thumb_file.unlink()

    all_meta = [m for m in all_meta if m["id"] != id]
    save_metadata(all_meta)
    return {"status": "removed", "id": id}
