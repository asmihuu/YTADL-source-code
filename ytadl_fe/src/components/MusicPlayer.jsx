import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function MusicPlayer({
  playlist = [],
  currentTrackIndex,
  setCurrentTrackIndex,
  isPlaying,
  setIsPlaying
}) {
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(70);
  const audioRef = useRef(null);

  const currentTrack = playlist[currentTrackIndex] || {
    title: "No Track",
    uploader: "-",
    duration: "0:00",
    thumbnail: "",
    audio: ""
  };

  // Load & play track when currentTrackIndex changes
  useEffect(() => {
    if (!audioRef.current || !currentTrack.audio) return;

    audioRef.current.src = currentTrack.audio;
    audioRef.current.load();

    audioRef.current
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  }, [currentTrackIndex, currentTrack.audio, setIsPlaying]);

  // Handle play/pause & volume
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume / 100;

    if (isPlaying) audioRef.current.play().catch(() => setIsPlaying(false));
    else audioRef.current.pause();
  }, [isPlaying, volume, setIsPlaying]);

  const handleTimeUpdate = () => {
    if (audioRef.current?.duration) {
      setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
    }
  };

  const handleVolumeChange = (e) => setVolume(Number(e.target.value));

  const nextTrack = () => {
    if (!playlist.length) return;
    setCurrentTrackIndex((prev) => (prev + 1) % playlist.length);
  };

  const prevTrack = () => {
    if (!playlist.length) return;
    setCurrentTrackIndex((prev) => (prev === 0 ? playlist.length - 1 : prev - 1));
  };

  const handleEnded = () => nextTrack();

  return (
    <div className="h-20 bg-zinc-900 border-t border-zinc-800 px-6 flex items-center justify-between">
      {/* Left - Song Info */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentTrack.title + currentTrackIndex}
          className="flex items-center space-x-3 w-1/4"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 30 }}
          transition={{ duration: 0.4 }}
        >
          <img
            src={currentTrack.thumbnail || "https://placehold.co/56x56/000/fff?text=?"}
            alt="Thumbnail"
            className="w-14 h-14 rounded-md shadow-md object-cover"
          />
          <div className="overflow-hidden">
            <p className="text-white font-medium text-sm truncate max-w-[120px]">
              {currentTrack.title}
            </p>
            <p className="text-xs text-zinc-400 truncate max-w-[120px]">
              {currentTrack.uploader}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Center - Controls + Progress */}
      <div className="flex flex-col items-center w-2/4">
        <div className="flex items-center space-x-6 mb-1">
          <button onClick={prevTrack} className="text-zinc-300 hover:text-white">
            <SkipBack size={20} />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="bg-white text-black rounded-full p-2 hover:scale-110 transition"
          >
            {isPlaying ? <Pause size={22} /> : <Play size={22} />}
          </button>
          <button onClick={nextTrack} className="text-zinc-300 hover:text-white">
            <SkipForward size={20} />
          </button>
        </div>

        <div className="w-full flex items-center space-x-2 text-xs text-zinc-400">
          <span>
            {audioRef.current
              ? `${Math.floor(audioRef.current.currentTime / 60)}:${String(
                  Math.floor(audioRef.current.currentTime % 60)
                ).padStart(2, "0")}`
              : "0:00"}
          </span>
          <div className="relative flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-brown-500"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "easeOut", duration: 0.2 }}
            />
          </div>
          <span>{currentTrack.duration}</span>
        </div>
      </div>

      {/* Right - Volume */}
      <div className="flex items-center space-x-2 w-1/4 justify-end">
        <Volume2 className="text-zinc-300" size={20} />
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={handleVolumeChange}
          className="w-24"
        />
      </div>

      <audio ref={audioRef} onTimeUpdate={handleTimeUpdate} onEnded={handleEnded} />
    </div>
  );
}
