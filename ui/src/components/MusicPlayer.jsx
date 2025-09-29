import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Shuffle,
  Repeat,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { formatDuration } from "../utils/format";

export default function MusicPlayer({
  playlist = [],
  currentTrackIndex,
  setCurrentTrackIndex,
  isPlaying,
  setIsPlaying,
}) {
  const audioRef = useRef(null);
  const firstLoad = useRef(true);

  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(70);
  const [isSeeking, setIsSeeking] = useState(false);

  // 🔀 Shuffle & 🔁 Repeat
  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState("off"); // "off" | "one" | "all"

  const currentTrack = playlist[currentTrackIndex] || {
    title: "No Track",
    uploader: "-",
    duration: "0:00",
    thumbnail: "",
    audio: "",
  };

  /* === Load & Play Track on Change === */
  useEffect(() => {
    if (!audioRef.current || !currentTrack.audio) return;

    audioRef.current.src = currentTrack.audio;
    audioRef.current.load();

    if (firstLoad.current) {
      firstLoad.current = false;
      setIsPlaying(false);
      return;
    }

    audioRef.current
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  }, [currentTrackIndex, currentTrack.audio, setIsPlaying]);

  /* === Play / Pause & Volume === */
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume / 100;

    if (isPlaying) {
      audioRef.current.play().catch(() => setIsPlaying(false));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, volume, setIsPlaying]);

  /* === Progress Update === */
  const handleTimeUpdate = () => {
    if (audioRef.current?.duration && !isSeeking) {
      const percent =
        (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(percent);
    }
  };

  /* === Seek Handlers === */
  const seekToPercent = (percent) => {
    if (!audioRef.current) return;
    const newTime = (percent / 100) * audioRef.current.duration;
    audioRef.current.currentTime = newTime;
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = ((e.clientX - rect.left) / rect.width) * 100;
    setProgress(percent);
    seekToPercent(percent);
  };

  const handleSeekStart = () => setIsSeeking(true);

  const handleSeekMove = (e) => {
    if (!isSeeking) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = Math.max(
      0,
      Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)
    );
    setProgress(percent);
  };

  const handleSeekEnd = (e) => {
    if (!isSeeking) return;
    setIsSeeking(false);
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = Math.max(
      0,
      Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)
    );
    setProgress(percent);
    seekToPercent(percent);
  };

  /* === Controls === */
  const getRandomIndex = () => {
    if (playlist.length <= 1) return currentTrackIndex;
    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * playlist.length);
    } while (randomIndex === currentTrackIndex);
    return randomIndex;
  };

  const nextTrack = () => {
    if (!playlist.length) return;
    if (shuffle) {
      setCurrentTrackIndex(getRandomIndex());
    } else {
      setCurrentTrackIndex((prev) => (prev + 1) % playlist.length);
    }
  };

  const prevTrack = () => {
    if (!playlist.length) return;
    if (shuffle) {
      setCurrentTrackIndex(getRandomIndex());
    } else {
      setCurrentTrackIndex((prev) =>
        prev === 0 ? playlist.length - 1 : prev - 1
      );
    }
  };

  const handleEnded = () => {
    if (repeatMode === "one") {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } else if (repeatMode === "all") {
      nextTrack();
    } else {
      if (currentTrackIndex < playlist.length - 1) {
        nextTrack();
      } else {
        setIsPlaying(false);
      }
    }
  };

  const cycleRepeatMode = () => {
    setRepeatMode((prev) =>
      prev === "off" ? "one" : prev === "one" ? "all" : "off"
    );
  };

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
            src={
              currentTrack.thumbnail ||
              "https://placehold.co/56x56/000/fff?text=?"
            }
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
        {/* Controls */}
        <div className="flex items-center space-x-6 mb-1">
          <button
            onClick={() => setShuffle(!shuffle)}
            className={shuffle ? "text-brown-500" : "text-zinc-300 hover:text-white"}
          >
            <Shuffle size={18} />
          </button>

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

          <button onClick={cycleRepeatMode} className="relative">
            <Repeat
              size={18}
              className={
                repeatMode === "off"
                  ? "text-zinc-300 hover:text-white"
                  : "text-brown-500"
              }
            />
            {repeatMode === "one" && (
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                1
              </span>
            )}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full flex items-center space-x-2 text-xs text-zinc-400 select-none">
          {/* Current Time */}
          <span>
            {audioRef.current
              ? `${Math.floor(audioRef.current.currentTime / 60)}:${String(
                Math.floor(audioRef.current.currentTime % 60)
              ).padStart(2, "0")}`
              : "0:00"}
          </span>

          {/* Seek Bar */}
          <div
            className="relative flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden cursor-pointer"
            onClick={handleSeek}
            onMouseDown={handleSeekStart}
            onMouseMove={handleSeekMove}
            onMouseUp={handleSeekEnd}
            onMouseLeave={() => setIsSeeking(false)}
          >
            <motion.div
              className="h-full bg-brown-500"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "easeOut", duration: 0.1 }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow"
              style={{
                left: `${progress}%`,
                transform: "translate(-50%, -50%)",
              }}
            />
          </div>

          {/* Duration */}
          <span>{formatDuration(currentTrack.duration)}</span>
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
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-28 h-1.5 rounded-lg accent-brown-500 no-appearance cursor-pointer"
        />
      </div>

      {/* Audio */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />
    </div>
  );
}
