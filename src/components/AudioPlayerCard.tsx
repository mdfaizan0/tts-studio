import React, { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import {
  Play,
  Pause,
  Download,
  RotateCcw,
  Volume2,
  VolumeX,
  Activity,
  Check,
  FileAudio,
} from "lucide-react";
import { GenerationResult } from "../types";
import { formatDuration, triggerAudioDownload } from "../services/audio";

interface AudioPlayerCardProps {
  result: GenerationResult;
  onGenerateAgain: () => void;
}

export const AudioPlayerCard: React.FC<AudioPlayerCardProps> = ({
  result,
  onGenerateAgain,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(result.durationSec || 0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    // Reset state when new result arrives
    setIsPlaying(false);
    setCurrentTime(0);
    setDownloaded(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.load();
    }
  }, [result.wavUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((err) => console.error("Playback error:", err));
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && !isNaN(audioRef.current.duration) && audioRef.current.duration > 0) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audioRef.current.muted = nextMuted;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (audioRef.current) {
      audioRef.current.volume = val;
      audioRef.current.muted = val === 0;
    }
  };

  const handleDownload = () => {
    triggerAudioDownload(result.wavBlob, result.filename);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="bg-[#0C0C0E] border border-white/10 rounded-xl p-4 sm:p-5 shadow-[0_10px_30px_rgba(0,0,0,0.5)] space-y-4"
    >
      {/* Hidden native audio element */}
      <audio
        ref={audioRef}
        src={result.wavUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Header Info Banner */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-[0_0_10px_rgba(79,70,229,0.2)]">
            <FileAudio className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white">
                Generated Narration WAV
              </h3>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-indigo-600/15 text-indigo-300 border border-indigo-500/30">
                24 kHz 16-Bit
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              {result.filename}
            </p>
          </div>
        </div>

        {/* Action buttons: Generate Again + Download */}
        <div className="flex items-center gap-2">
          <button
            onClick={onGenerateAgain}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-medium transition-colors"
            title="Generate this narration again"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Generate Again</span>
          </button>

          <button
            onClick={handleDownload}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all ${
              downloaded
                ? "bg-emerald-500 text-black font-bold"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.35)]"
            }`}
          >
            {downloaded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Download WAV</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Primary Audio Player Controls */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Big Play / Pause Button */}
          <button
            onClick={togglePlay}
            className="w-12 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.45)] transition-transform active:scale-95 shrink-0"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-white" />
            ) : (
              <Play className="w-5 h-5 fill-white ml-0.5" />
            )}
          </button>

          {/* Scrubber & Time */}
          <div className="flex-1 space-y-1.5 min-w-0">
            <div className="relative flex items-center">
              <input
                type="range"
                min={0}
                max={duration || 1}
                step={0.01}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="text-slate-200">{formatDuration(currentTime)}</span>
              {/* Equalizer animation when playing */}
              {isPlaying && (
                <div className="flex items-center gap-1">
                  {[40, 80, 55, 95, 60, 85, 45, 90].map((h, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: [3, (h / 100) * 12, 3] }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.5 + (i % 3) * 0.15,
                        ease: "easeInOut",
                      }}
                      className="w-0.5 bg-indigo-400 rounded-full"
                    />
                  ))}
                </div>
              )}
              <span>{formatDuration(duration)}</span>
            </div>
          </div>
        </div>

        {/* Secondary controls: Speed & Volume & Telemetry */}
        <div className="flex items-center justify-between flex-wrap gap-3 pt-2 text-xs">
          {/* Playback speed selector */}
          <div className="flex items-center gap-1">
            <span className="text-slate-500 mr-1">Speed:</span>
            {[0.8, 1.0, 1.25, 1.5].map((rate) => (
              <button
                key={rate}
                onClick={() => handleRateChange(rate)}
                className={`px-2 py-0.5 rounded text-xs font-mono transition-colors ${
                  playbackRate === rate
                    ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 font-bold"
                    : "bg-white/5 text-slate-400 hover:text-slate-200 border border-white/10"
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>

          {/* Volume control */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 sm:w-20 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          {/* Telemetry pill */}
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded border border-white/10">
              <Activity className="w-3 h-3 text-indigo-400" />
              {(result.latencyMs / 1000).toFixed(2)}s latency
            </span>
            <span className="hidden sm:inline bg-white/5 px-2 py-0.5 rounded border border-white/10">
              Voice: {result.voice}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
