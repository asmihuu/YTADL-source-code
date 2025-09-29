import { useState, useEffect } from "react";
import { Search, Play, Pause, Trash } from "lucide-react";
import axios from "axios";
import { useOutletContext } from "react-router-dom";
import { formatDuration } from "../utils/format";

export default function Library() {
  const { playlist, setPlaylist, addTrack, currentTrackIndex, setCurrentTrackIndex, isPlaying, setIsPlaying } =
    useOutletContext();

  const [tracks, setTracks] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch downloaded tracks
  useEffect(() => {
    const fetchDownloads = async () => {
      setLoading(true);
      try {
        const res = await axios.get("http://localhost:8000/list");
        if (res.data.status === "success") setTracks(res.data.downloads);
        else setTracks([]);
      } catch (err) {
        console.error(err);
        setTracks([]);
      }
      setLoading(false);
    };
    fetchDownloads();
  }, []);

  const playTrack = (track) => {
    const existingIndex = playlist.findIndex((t) => t.audio === track.audio);

    if (existingIndex !== -1) {
      // Track already in playlist → switch or toggle play/pause
      setCurrentTrackIndex(existingIndex);
      if (currentTrackIndex === existingIndex) {
        // Toggle play/pause if clicking the currently playing track
        setIsPlaying(!isPlaying);
      } else {
        // Switch to new track and start playing
        setIsPlaying(true);
      }
    } else {
      // Add track to playlist and play
      const newPlaylist = [...playlist, track];
      setPlaylist(newPlaylist);
      setCurrentTrackIndex(newPlaylist.length - 1);
      setIsPlaying(true);
    }
  };

  const removeTrack = async (id) => {
    try {
      const res = await axios.get("http://localhost:8000/remove", { params: { id } });
      if (res.data.status === "removed") {
        setTracks((prev) => prev.filter((t) => t.id !== id));
        setPlaylist((prev) => prev.filter((t) => t.id !== id));
        if (playlist[currentTrackIndex]?.id === id) setCurrentTrackIndex(0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTracks = tracks.filter(
    (track) =>
      track.title.toLowerCase().includes(search.toLowerCase()) ||
      (track.uploader || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex items-center gap-2">
        <Search className="w-5 h-5 text-gray-500" />
        <input
          type="text"
          placeholder="Search your library..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm outline-none"
        />
      </div>

      {/* Track Grid */}
      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : filteredTracks.length === 0 ? (
        <p className="text-gray-400">No tracks found.</p>
      ) : (
        <div className="flex flex-col pb-1 h-[calc(100vh-14rem)]">
          {/* Scrollable grid */}
          <div className="flex-1 overflow-y-auto pr-3 scrollbar">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredTracks.map((track) => {
                const isCurrent = playlist[currentTrackIndex]?.audio === track.audio;

                return (
                  <div
                    key={track.id}
                    className="bg-white dark:bg-gray-900 rounded-xl shadow p-3 hover:shadow-lg transition"
                  >
                    <img
                      src={track.thumbnail || "https://via.placeholder.com/150"}
                      alt={track.title}
                      className="rounded-lg w-full h-32 object-cover"
                    />
                    <div className="mt-3 flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold truncate">{track.title}</h3>
                        <p className="text-xs text-gray-500 truncate">{track.uploader}</p>
                        <p className="text-xs text-gray-400">
                          {formatDuration(track.duration)}
                        </p>
                      </div>

                      <div className="flex flex-col items-center gap-2 ml-2">
                        <button
                          onClick={() => playTrack(track)}
                          className="p-2 rounded-full bg-brown-500 hover:bg-brown-600 text-white transition"
                        >
                          {isCurrent && isPlaying ? <Pause size={16} /> : <Play size={16} />}
                        </button>
                        <button
                          onClick={() => removeTrack(track.id)}
                          className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40 text-red-500 transition"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
