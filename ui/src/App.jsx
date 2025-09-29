import { useState, useEffect } from "react";
import axios from "axios";
import Topbar from "./components/Topbar";
import Sidebar from "./components/Sidebar";
import MusicPlayer from "./components/MusicPlayer";
import { Outlet } from "react-router-dom";

function App() {
  const [darkMode, setDarkMode] = useState(false);

  // Global music state
  const [playlist, setPlaylist] = useState([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Load all downloaded tracks from backend on app start
  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const res = await axios.get("http://localhost:8000/list");
        if (res.data.status === "success") {
          setPlaylist(res.data.downloads);
        }
      } catch (err) {
        console.error("Failed to fetch tracks:", err);
      }
    };
    fetchTracks();
  }, []);

  // Add a track to the playlist or set it as current if already exists
  const addTrack = (track) => {
    setPlaylist((prev) => {
      const existingIndex = prev.findIndex((t) => t.audio === track.audio);
      if (existingIndex !== -1) {
        setCurrentTrackIndex(existingIndex);
        setIsPlaying(true); // automatically play existing track
        return prev;
      }
      const newPlaylist = [...prev, track];
      setCurrentTrackIndex(newPlaylist.length - 1);
      setIsPlaying(true); // automatically play new track
      return newPlaylist;
    });
  };

  return (
    <div className={`${darkMode ? "dark" : ""} h-screen flex flex-col`}>
      <Topbar darkMode={darkMode} setDarkMode={setDarkMode} />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet
            context={{
              playlist,
              setPlaylist,
              addTrack,
              currentTrackIndex,
              setCurrentTrackIndex,
              isPlaying,
              setIsPlaying
            }}
          />
        </main>
      </div>
      <MusicPlayer
        playlist={playlist}
        currentTrackIndex={currentTrackIndex}
        setCurrentTrackIndex={setCurrentTrackIndex}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
      />
    </div>
  );
}

export default App;
