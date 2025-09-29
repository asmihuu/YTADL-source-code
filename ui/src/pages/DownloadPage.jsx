import { Download } from "lucide-react";
import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import axios from "axios";

export default function DownloadPage() {
  const { addTrack, downloads, setDownloads } = useOutletContext();

  const [url, setUrl] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [message, setMessage] = useState("");

  // Poll until download finishes
  const pollStatus = async (videoId) => {
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`http://localhost:8000/status/${videoId}`);
        const { status, message } = res.data;

        setMessage(message || status);

        setDownloads((prev) =>
          prev.map((d) =>
            d.id === videoId ? { ...d, status, message } : d
          )
        );

        if (status === "completed" || status === "error") {
          clearInterval(interval);

          // Refresh list from backend when completed
          if (status === "completed") {
            const listRes = await axios.get("http://localhost:8000/list");
            setDownloads(listRes.data.downloads);

            // Add the latest track into playlist
            const latest = listRes.data.downloads.find((d) => d.id === videoId);
            if (latest) addTrack(latest);
          }
        }
      } catch (err) {
        console.error(err);
        clearInterval(interval);
      }
    }, 2000); // poll every 2s
  };

  const handleDownload = async () => {
    if (!url.trim()) return;
    setDownloading(true);
    setMessage("Starting download...");

    try {
      const res = await axios.get("http://localhost:8000/download", {
        params: { url },
      });

      if (res.data.status === "error") {
        setMessage("Error: " + (res.data.error || "Unknown error"));
        return;
      }

      const videoId = res.data.video_id || res.data.entry?.id;

      // Add placeholder entry while downloading
      setDownloads((prev) => [
        ...prev,
        {
          id: videoId,
          title: res.data.entry?.title || videoId,
          uploader: res.data.entry?.uploader || "Unknown Artist",
          duration: res.data.entry?.duration || "0:00",
          thumbnail: res.data.entry?.thumbnail || "",
          audio: res.data.entry?.audio || "",
          status: res.data.status,
        },
      ]);

      setMessage(
        res.data.status === "already_downloaded"
          ? "File already exists."
          : "Queued..."
      );

      if (res.data.status === "started") {
        pollStatus(videoId);
      }

      if (res.data.status === "already_downloaded") {
        // Refresh list so UI is accurate
        const listRes = await axios.get("http://localhost:8000/list");
        setDownloads(listRes.data.downloads);
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

      {/* Input + Button */}
      <div className="flex gap-3 mb-4">
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

      <div className="relative">
        <div className="absolute top-0 left-0 flex items-center text-sm text-neutral-400">
          <Download size={16} className="mr-1" />
          <span className="font-medium">Status: </span>
          <span className="ml-1">{message}</span>
        </div>
      </div>

      {/* Download History */}
      {downloads.length > 0 && (
        <div className="mt-12 flex pb-16 flex-col h-[calc(100vh-16rem)]">
          <h2 className="text-lg font-semibold mb-3">Download History</h2>

          {/* Scrollable area that expands with window */}
          <div className="flex-1 overflow-y-auto pr-3 scrollbar">
            <ul className="space-y-2">
              {downloads.map((d, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg border border-neutral-700"
                >
                  <div>
                    <p className="text-sm text-white">{d.title}</p>
                    <p className="text-xs text-neutral-400">{d.uploader}</p>
                  </div>
                  <span
                    className={`text-xs font-medium ${d.status === "completed"
                      ? "text-green-500"
                      : d.status === "error"
                        ? "text-red-500"
                        : "text-pastel-brown"
                      }`}
                  >
                    {d.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
