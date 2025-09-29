import { Download } from "lucide-react";
import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import axios from "axios";

export default function DownloadPage() {
  const { addTrack } = useOutletContext();
  const [url, setUrl] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [message, setMessage] = useState("");
  const [audioUrl, setAudioUrl] = useState("");

  const handleDownload = async () => {
    if (!url.trim()) return;
    setDownloading(true);
    setMessage("Downloading...");
    setAudioUrl("");

    try {
      const res = await axios.get("http://localhost:8000/download", {
        params: { url },
      });

      const videoId = res.data.video_id || res.data.entry?.id;
      const audioFileUrl = `http://localhost:8000/files/${videoId}.mp3`;

      if (res.data.status === "started" || res.data.status === "already_downloaded") {
        setAudioUrl(audioFileUrl);
        setMessage(res.data.status === "started" ? "Download complete!" : "File already exists.");

        // Add track to playlist
        addTrack({
          title: res.data.entry?.title || videoId,
          uploader: res.data.entry?.uploader || "Unknown Artist",
          duration: res.data.entry?.duration || "0:00",
          thumbnail: res.data.entry?.thumbnail || "",
          audio: audioFileUrl,
        });
      } else if (res.data.status === "error") {
        setMessage("Error: " + (res.data.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      setMessage("Error: " + err.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Download Audio</h1>

      <div className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Paste YouTube URL..."
          className="flex-1 px-4 py-3 rounded-xl bg-neutral-800 border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-pastel-brown text-sm"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="px-5 py-3 rounded-xl bg-pastel-brown text-white font-medium hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {downloading ? "Downloading..." : "Download"}
        </button>
      </div>

      {message && (
        <div className="text-sm text-neutral-400 flex items-center gap-2 mt-2">
          <Download size={16} />
          <span>{message}</span>
        </div>
      )}

      {audioUrl && (
        <audio className="w-full mt-4" controls src={audioUrl}>
          Your browser does not support the audio element.
        </audio>
      )}
    </div>
  );
}
