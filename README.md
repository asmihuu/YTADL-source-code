# YTADPL Source Code

**YTADPL (YouTube Audio Downloader Player)** is a desktop application that allows you to download audio from YouTube with an interactive and user-friendly interface. It also features a built-in music player and a local music library.

> **Note:** This is a work-in-progress. The application will be fully built once all core features are implemented and stable.

---

## Features (Implemented So Far)

- **Downloader** – Fetch and download audio directly from YouTube  
- **Music Player** – Play downloaded audio within the app  
- **Music Library** – Manage and browse downloaded tracks easily  

---

## Tech Stack

- **Electron** – For building the desktop application  
- **Vite** – Lightning-fast build tool  
- **Tailwind CSS** – For styling and layout  

---

## Setup Instructions

### 1. Prerequisites

Make sure the following binaries are present in the project directory:

```
appconfig/bin/
├── ffmpeg.exe
├── ffprobe.exe
└── yt-dlp.exe
```

These tools are required for downloading, processing, and handling audio files.

### 2. Python Requirements

Install the required Python dependencies by running:

```bash
pip install -r requirements.txt
```

> **Note:** If you're using a `.exe` installer instead of `requirements.txt`, update this section accordingly.

---

## Build

The application will be packaged and built after all core features are completed and tested.

---

## Project Structure (Simplified)

```
YTADPL/
├── appconfig/        # Backend logic (Python)
│   └── bin/          # Required binaries/exe go here
├── ui/               # Frontend and UI logic (Vite + Electron)
├── requirements.txt  # Python dependencies
├── ...
```
