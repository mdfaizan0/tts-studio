import React, { useState, useRef, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  History,
  Play,
  Pause,
  Download,
  Trash2,
  Clock,
  Volume2,
  Search,
  ArrowUpRight,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Tv,
  FileText,
} from "lucide-react";
import { GenerationHistoryItem } from "../types";
import {
  formatDuration,
  triggerAudioDownload,
  base64ToUint8Array,
  convertPcmToWav,
  getRuntimeAudio,
  cacheRuntimeAudio,
} from "../services/audio";

interface RecentGenerationsSectionProps {
  history: GenerationHistoryItem[];
  onClearHistory: () => void;
  onDeleteItem: (id: string) => void;
  onLoadScript: (item: GenerationHistoryItem) => void;
  isCompact?: boolean;
}

export const RecentGenerationsSection: React.FC<RecentGenerationsSectionProps> = ({
  history,
  onClearHistory,
  onDeleteItem,
  onLoadScript,
  isCompact = false,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "longest" | "shortest">("newest");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Stop playback when unmounting
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  // Filter and sort items
  const filteredHistory = useMemo(() => {
    let list = [...history];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          item.fullText.toLowerCase().includes(q) ||
          item.profileName.toLowerCase().includes(q) ||
          item.voice.toLowerCase().includes(q) ||
          item.channelName.toLowerCase().includes(q) ||
          (item.projectTitle && item.projectTitle.toLowerCase().includes(q))
      );
    }

    switch (sortBy) {
      case "newest":
        list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        break;
      case "oldest":
        list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        break;
      case "longest":
        list.sort((a, b) => (b.durationSec || 0) - (a.durationSec || 0));
        break;
      case "shortest":
        list.sort((a, b) => (a.durationSec || 0) - (b.durationSec || 0));
        break;
    }

    return list;
  }, [history, searchQuery, sortBy]);

  // Audio helper: resolves or prepares blob/url
  const getAudioUrl = (item: GenerationHistoryItem): string | null => {
    // Check runtime cache first
    const cached = getRuntimeAudio(item.id);
    if (cached?.url) return cached.url;

    // Decode from base64 if available
    if (item.audioBase64) {
      try {
        const bytes = base64ToUint8Array(item.audioBase64);
        const blob = convertPcmToWav(bytes, item.sampleRate || 24000);
        const url = URL.createObjectURL(blob);
        cacheRuntimeAudio(item.id, blob, url, item.audioBase64);
        return url;
      } catch (e) {
        console.error("Failed to decode audio for item", item.id, e);
        return null;
      }
    }
    return null;
  };

  // Play / Pause handler
  const handlePlayToggle = (item: GenerationHistoryItem) => {
    if (playingId === item.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingId(null);
      return;
    }

    const url = getAudioUrl(item);
    if (url && audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.play().catch((err) => {
        console.error("Error playing audio:", err);
      });
      setPlayingId(item.id);
      setCurrentTime(0);
    }
  };

  // Download handler
  const handleDownload = (item: GenerationHistoryItem) => {
    const cached = getRuntimeAudio(item.id);
    if (cached?.blob) {
      triggerAudioDownload(cached.blob, item.filename);
      return;
    }

    if (item.audioBase64) {
      try {
        const bytes = base64ToUint8Array(item.audioBase64);
        const blob = convertPcmToWav(bytes, item.sampleRate || 24000);
        triggerAudioDownload(blob, item.filename);
      } catch (err) {
        console.error("Failed to download audio:", err);
      }
    }
  };

  const handleCopyText = (item: GenerationHistoryItem) => {
    navigator.clipboard.writeText(item.fullText);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setAudioDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return {
        dateStr: date.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        timeStr: date.toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
    } catch {
      return { dateStr: "Recent", timeStr: "" };
    }
  };

  return (
    <div className="space-y-4 w-full">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => {
          setPlayingId(null);
          setCurrentTime(0);
        }}
        onPause={() => setPlayingId(null)}
      />

      {/* Header controls & filter bar */}
      <div className="bg-[#0C0C0E] border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <History className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white">Recent Generations</h3>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10">
                {history.length} {history.length === 1 ? "take" : "takes"}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Locally persisted narration history with instant replay, script recovery, and 24 kHz WAV downloads
            </p>
          </div>
        </div>

        {history.length > 0 && (
          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={onClearHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-rose-500/15 border border-white/10 hover:border-rose-500/30 text-slate-400 hover:text-rose-300 text-xs font-medium transition-all"
              title="Clear all generation history from localStorage"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Toolbar */}
      {history.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center gap-2.5 justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by script text, voice, or profile..."
              className="w-full bg-[#0C0C0E] border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-xs text-slate-500">Sort:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-[#0C0C0E] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500/60 cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="longest">Longest Duration</option>
              <option value="shortest">Shortest Duration</option>
            </select>
          </div>
        </div>
      )}

      {/* History Items List with Animations */}
      {history.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0C0C0E] border border-white/5 rounded-xl p-8 sm:p-12 text-center space-y-3"
        >
          <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-500">
            <History className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-slate-200">No recent generations yet</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              When you generate audio narrations, they will be automatically saved here with options to replay, recover script text, and download.
            </p>
          </div>
        </motion.div>
      ) : filteredHistory.length === 0 ? (
        <div className="bg-[#0C0C0E] border border-white/5 rounded-xl p-6 text-center text-xs text-slate-400">
          No generations match your search query "{searchQuery}".
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredHistory.map((item, index) => {
              const isPlaying = playingId === item.id;
              const isExpanded = expandedId === item.id;
              const hasAudio = Boolean(getRuntimeAudio(item.id)?.url || item.audioBase64);
              const { dateStr, timeStr } = formatDate(item.timestamp);
              const wordCount = item.fullText.trim().split(/\s+/).filter(Boolean).length;
              const charCount = item.fullText.length;

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10, scale: 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
                  transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.2) }}
                  className={`bg-[#0C0C0E] border rounded-xl p-4 transition-all ${
                    isPlaying
                      ? "border-indigo-500/50 shadow-[0_0_20px_rgba(79,70,229,0.15)] ring-1 ring-indigo-500/30"
                      : "border-white/10 hover:border-white/20 shadow-md"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-white/5">
                    {/* Left: Metadata */}
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-white truncate">
                          {item.profileName}
                        </span>
                        <span className="text-slate-600">·</span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Tv className="w-3 h-3 text-slate-500" />
                          {item.channelName}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-indigo-600/20 text-indigo-300 font-mono text-[11px] font-medium border border-indigo-500/30 flex items-center gap-1">
                          <Volume2 className="w-3 h-3 text-indigo-400" />
                          {item.voice}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {dateStr} at {timeStr}
                        </span>
                        <span className="text-slate-600">·</span>
                        <span className="font-mono text-indigo-300 font-semibold">
                          Duration: {formatDuration(item.durationSec, true)}
                        </span>
                        <span className="text-slate-600">·</span>
                        <span className="text-slate-500">
                          {wordCount} words ({charCount} chars)
                        </span>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
                      {/* Play Button */}
                      {hasAudio ? (
                        <button
                          onClick={() => handlePlayToggle(item)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            isPlaying
                              ? "bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]"
                              : "bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10"
                          }`}
                          title={isPlaying ? "Pause audio" : "Play audio"}
                        >
                          {isPlaying ? (
                            <>
                              <Pause className="w-3.5 h-3.5 fill-current" />
                              <span>Pause</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                              <span>Play</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <span
                          className="px-2.5 py-1 text-[10px] text-slate-500 rounded bg-white/5 border border-white/5"
                          title="Audio payload shed to conserve local storage space"
                        >
                          Audio Expired
                        </span>
                      )}

                      {/* Download Button */}
                      {hasAudio && (
                        <button
                          onClick={() => handleDownload(item)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-medium transition-colors"
                          title={`Download ${item.filename}`}
                        >
                          <Download className="w-3.5 h-3.5 text-slate-400" />
                          <span className="hidden sm:inline">WAV</span>
                        </button>
                      )}

                      {/* Load into Script */}
                      <button
                        onClick={() => onLoadScript(item)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 border border-indigo-500/25 text-xs font-medium transition-colors"
                        title="Load this script back into the generator editor"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Load Script</span>
                      </button>

                      {/* Delete Item */}
                      <button
                        onClick={() => onDeleteItem(item.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete this record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Active Playback Scrubber (only shown when this item is playing) */}
                  {isPlaying && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="py-2.5 border-b border-white/5 space-y-1.5"
                    >
                      <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                        <span className="text-indigo-400 font-semibold">
                          {formatDuration(currentTime)}
                        </span>
                        <input
                          type="range"
                          min={0}
                          max={audioDuration || item.durationSec || 1}
                          step={0.05}
                          value={currentTime}
                          onChange={handleSeek}
                          className="flex-1 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                        <span>{formatDuration(audioDuration || item.durationSec)}</span>
                      </div>

                      {/* Equalizer animation */}
                      <div className="flex items-center gap-1 pt-0.5 justify-center">
                        {[40, 75, 55, 90, 60, 80, 45, 95, 70, 50].map((height, i) => (
                          <motion.div
                            key={i}
                            animate={{
                              height: [4, (height / 100) * 14, 4],
                            }}
                            transition={{
                              repeat: Infinity,
                              duration: 0.6 + (i % 3) * 0.2,
                              ease: "easeInOut",
                            }}
                            className="w-1 bg-indigo-500 rounded-full"
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Narration Script Text */}
                  <div className="pt-3 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <FileText className="w-3 h-3 text-slate-500" />
                        Narration Script
                      </span>

                      <button
                        onClick={() => handleCopyText(item)}
                        className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p
                      className={`text-xs text-slate-300 leading-relaxed font-sans bg-black/40 border border-white/5 rounded-lg p-3 ${
                        isExpanded ? "" : "line-clamp-2"
                      }`}
                    >
                      {item.fullText}
                    </p>

                    {item.fullText.length > 120 && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium pt-0.5"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-3 h-3" />
                            <span>Collapse Script</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3 h-3" />
                            <span>Read Complete Script ({charCount} characters)</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
