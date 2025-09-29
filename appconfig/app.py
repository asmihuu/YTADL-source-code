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
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- Paths ----------------
BASE_DIR = Path(__file__).resolve().parent
DOWNLOADS_DIR = BASE_DIR.parent / "downloads"
DOWNLOADS_DIR.mkdir(exist_ok=True)

YTDLP_PATH = BASE_DIR / "bin/yt-dlp.exe"
FFMPEG_PATH = BASE_DIR / "bin/ffmpeg.exe"

META_FILE = DOWNLOADS_DIR / "downloads.json"
BACKEND_URL = "http://localhost:8000"

# ---------------- Static Files ----------------
app.mount("/files", StaticFiles(directory=str(DOWNLOADS_DIR)), name="files")

# ---------------- State ----------------
# In-memory download progress tracker
download_status = {}  # {video_id: {"status": "...", "message": "..."}}

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

def build_entry(metadata: dict, video_id: str, format: str):
    audio_file = DOWNLOADS_DIR / f"{video_id}.{format}"
    thumb_file = DOWNLOADS_DIR / f"{video_id}.webp"
    return {
        "id": video_id,
        "title": sanitize_text(metadata.get("title", "Unknown Title")),
        "audio": f"{BACKEND_URL}/files/{audio_file.name}",
        "thumbnail": f"{BACKEND_URL}/files/{thumb_file.name}" if thumb_file.exists() else None,
        "duration": metadata.get("duration"),
        "uploader": sanitize_text(metadata.get("uploader", "Unknown Uploader")),
        "upload_date": sanitize_text(metadata.get("upload_date", "")),
    }

def download_task(url: str, video_id: str, format: str):
    try:
        download_status[video_id] = {"status": "downloading", "message": "Fetching audio..."}

        # --- Download audio ---
        audio_file = DOWNLOADS_DIR / f"{video_id}.{format}"
        subprocess.run([
            str(YTDLP_PATH),
            "-x", f"--audio-format={format}",
            f"--ffmpeg-location={FFMPEG_PATH.parent}",
            "-o", str(audio_file),
            url
        ], check=True)

        download_status[video_id] = {"status": "processing", "message": "Converting thumbnail..."}

        # --- Download thumbnail ---
        subprocess.run([
            str(YTDLP_PATH),
            "--skip-download",
            "--write-thumbnail",
            "--convert-thumbnails", "webp",
            "-o", f"{video_id}.%(ext)s",
            url
        ], check=True, cwd=DOWNLOADS_DIR)

        download_status[video_id] = {"status": "finalizing", "message": "Saving metadata..."}

        # --- Get metadata ---
        cmd_meta = [
            str(YTDLP_PATH),
            "--skip-download",
            "--print-json",
            f"--ffmpeg-location={FFMPEG_PATH.parent}",
            url,
        ]
        meta_proc = subprocess.run(cmd_meta, capture_output=True, text=True, check=True)
        metadata = json.loads(meta_proc.stdout.splitlines()[0])

        # --- Save entry ---
        entry = build_entry(metadata, video_id, format)
        all_meta = load_metadata()
        if not any(m["id"] == video_id for m in all_meta):
            all_meta.append(entry)
            save_metadata(all_meta)

        download_status[video_id] = {"status": "completed", "message": "Download complete!"}
        print(f"[Download completed] {video_id}")

    except Exception as e:
        download_status[video_id] = {"status": "error", "message": str(e)}
        print(f"[Download error] {video_id}: {e}")

# ---------------- API Routes ----------------
@app.get("/download")
def download(url: str, format: str = Query("mp3", enum=["mp3", "m4a", "opus"])):
    try:
        # Get metadata first
        cmd_meta = [
            str(YTDLP_PATH),
            "--skip-download",
            "--print-json",
            f"--ffmpeg-location={FFMPEG_PATH.parent}",
            url,
        ]
        meta_proc = subprocess.run(cmd_meta, capture_output=True, text=True, check=True)
        metadata = json.loads(meta_proc.stdout.splitlines()[0])
        video_id = metadata["id"]

        # Already downloaded?
        all_meta = load_metadata()
        existing = next((m for m in all_meta if m["id"] == video_id), None)
        if existing:
            return {"status": "already_downloaded", "entry": existing}

        # Start background task
        download_status[video_id] = {"status": "queued", "message": "Waiting to start..."}
        threading.Thread(target=download_task, args=(url, video_id, format), daemon=True).start()

        return {"status": "started", "video_id": video_id}

    except Exception as e:
        return {"status": "error", "error": str(e)}

@app.get("/status/{video_id}")
def get_status(video_id: str):
    return download_status.get(video_id, {"status": "unknown", "message": "No status found"})

@app.get("/list")
def list_downloads():
    all_meta = load_metadata()
    return {
        "status": "success" if all_meta else "empty",
        "downloads": all_meta[::-1],  # newest first
    }

@app.get("/remove")
def remove_download(id: str):
    all_meta = load_metadata()
    entry = next((m for m in all_meta if m["id"] == id), None)
    if not entry:
        return {"status": "error", "message": f"No entry found with id {id}"}

    # Delete files
    audio_file = DOWNLOADS_DIR / Path(entry["audio"]).name
    if audio_file.exists():
        audio_file.unlink()
    if entry.get("thumbnail"):
        thumb_file = DOWNLOADS_DIR / Path(entry["thumbnail"]).name
        if thumb_file.exists():
            thumb_file.unlink()

    # Update metadata
    all_meta = [m for m in all_meta if m["id"] != id]
    save_metadata(all_meta)

    # Remove from status tracker if exists
    download_status.pop(id, None)

    return {"status": "removed", "id": id}
