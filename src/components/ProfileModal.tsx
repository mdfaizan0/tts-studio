import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Sparkles, AlertCircle, Save, Undo2, Check } from "lucide-react";
import { VoiceProfile } from "../types";
import { VOICE_LIST, ACCENT_OPTIONS, STYLE_OPTIONS, PACE_OPTIONS } from "../services/voices";

interface ProfileModalProps {
  isOpen: boolean;
  profile: VoiceProfile | null; // null means create new
  onClose: () => void;
  onSave: (savedProfile: VoiceProfile) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  profile,
  onClose,
  onSave,
}) => {
  const isEditing = Boolean(profile);

  // Form state
  const [name, setName] = useState("");
  const [channelName, setChannelName] = useState("");
  const [description, setDescription] = useState("");
  const [gender, setGender] = useState<string>("Male");
  const [accent, setAccent] = useState<string>("American (Gen)");
  const [customAccent, setCustomAccent] = useState("");
  const [voice, setVoice] = useState<string>("Enceladus");
  const [style, setStyle] = useState<string>("Deadpan");
  const [customStyle, setCustomStyle] = useState("");
  const [pace, setPace] = useState<string>("Natural");
  const [customPace, setCustomPace] = useState("");
  const [voiceDirection, setVoiceDirection] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [voiceSearch, setVoiceSearch] = useState("");

  // Initialize form when opening
  useEffect(() => {
    if (isOpen) {
      if (profile) {
        setName(profile.name);
        setChannelName(profile.channelName);
        setDescription(profile.description || "");
        setGender(profile.gender || "Male");
        
        if (ACCENT_OPTIONS.includes(profile.accent)) {
          setAccent(profile.accent);
          setCustomAccent("");
        } else {
          setAccent("Other / Custom");
          setCustomAccent(profile.accent || "");
        }

        setVoice(profile.voice || "Enceladus");

        if (STYLE_OPTIONS.includes(profile.style)) {
          setStyle(profile.style);
          setCustomStyle("");
        } else {
          setStyle("Custom");
          setCustomStyle(profile.style || "");
        }

        if (PACE_OPTIONS.includes(profile.pace)) {
          setPace(profile.pace);
          setCustomPace("");
        } else {
          setPace("Custom");
          setCustomPace(profile.pace || "");
        }

        setVoiceDirection(profile.voiceDirection || "");
        setIsDefault(Boolean(profile.isDefault));
      } else {
        // Defaults for new profile
        setName("");
        setChannelName("");
        setDescription("");
        setGender("Male");
        setAccent("American (Gen)");
        setCustomAccent("");
        setVoice("Enceladus");
        setStyle("Conversational");
        setCustomStyle("");
        setPace("Natural");
        setCustomPace("");
        setVoiceDirection("");
        setIsDefault(false);
      }
      setVoiceSearch("");
    }
  }, [isOpen, profile]);

  // Compute dirty/unsaved state
  const isDirty = useMemo(() => {
    if (!profile) {
      return Boolean(name.trim() || channelName.trim());
    }
    const finalAccent = accent === "Other / Custom" ? customAccent : accent;
    const finalStyle = style === "Custom" ? customStyle : style;
    const finalPace = pace === "Custom" ? customPace : pace;

    return (
      name !== profile.name ||
      channelName !== profile.channelName ||
      description !== (profile.description || "") ||
      gender !== profile.gender ||
      finalAccent !== profile.accent ||
      voice !== profile.voice ||
      finalStyle !== profile.style ||
      finalPace !== profile.pace ||
      voiceDirection !== profile.voiceDirection ||
      isDefault !== Boolean(profile.isDefault)
    );
  }, [
    profile,
    name,
    channelName,
    description,
    gender,
    accent,
    customAccent,
    voice,
    style,
    customStyle,
    pace,
    customPace,
    voiceDirection,
    isDefault,
  ]);

  // Filtered voice list
  const filteredVoices = useMemo(() => {
    if (!voiceSearch.trim()) return VOICE_LIST;
    const query = voiceSearch.toLowerCase();
    return VOICE_LIST.filter(
      (v) =>
        v.name.toLowerCase().includes(query) ||
        v.description.toLowerCase().includes(query) ||
        v.category.toLowerCase().includes(query) ||
        v.gender.toLowerCase().includes(query)
    );
  }, [voiceSearch]);

  const selectedVoiceObj = useMemo(() => {
    return VOICE_LIST.find((v) => v.name.toLowerCase() === voice.toLowerCase());
  }, [voice]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalAccent = accent === "Other / Custom" ? customAccent.trim() || "American (Gen)" : accent;
    const finalStyle = style === "Custom" ? customStyle.trim() || "Conversational" : style;
    const finalPace = pace === "Custom" ? customPace.trim() || "Natural" : pace;

    const now = new Date().toISOString();
    const updatedProfile: VoiceProfile = {
      id: profile ? profile.id : `profile-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      channelName: channelName.trim() || name.trim(),
      description: description.trim(),
      gender,
      accent: finalAccent,
      voice,
      style: finalStyle,
      pace: finalPace,
      voiceDirection: voiceDirection.trim(),
      isDefault,
      createdAt: profile ? profile.createdAt : now,
      updatedAt: now,
    };

    onSave(updatedProfile);
  };

  const handleApplyDirectionTemplate = (templateType: "storytelling" | "tech" | "mystery") => {
    if (templateType === "storytelling") {
      setVoiceDirection(
        "Male American English narrator in his late 20s to 30s. Medium-low pitch, confident, calm, conversational, and highly engaging. Natural storytelling voice with subtle tension and curiosity. Speak clearly and naturally, as if telling someone an unbelievable story that actually happened. Controlled energy with a slight sense of urgency when the story escalates. Sound intelligent and composed, but never formal or overly polished. Avoid sounding like a news anchor, documentary narrator, movie trailer, horror narrator, or radio announcer. No exaggerated drama, shouting, theatrical pauses, or artificial intensity."
      );
    } else if (templateType === "tech") {
      setVoiceDirection(
        "Crisp, articulate, fast-paced explanatory narration. Engaging and intelligent without being condescending. Punchy sentence cadences, confident delivery, and clean modern articulation."
      );
    } else if (templateType === "mystery") {
      setVoiceDirection(
        "Atmospheric, calm, and measured delivery. Subtle tension and quiet fascination with unexplained details. Deep, steady vocal control with deliberate pauses for impact. Grounded and immersive."
      );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative bg-[#0C0C0E] border border-white/10 rounded-xl max-w-2xl w-full my-6 p-5 sm:p-6 shadow-2xl flex flex-col max-h-[92vh] z-10"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/5 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              {isEditing ? "Edit Voice Profile" : "Create New Voice Profile"}
              {isDirty && (
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-indigo-600/20 text-indigo-300 border border-indigo-500/30">
                  Unsaved changes
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Defines the narrator identity (WHO is speaking) for this channel
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="overflow-y-auto py-4 space-y-5 flex-1 pr-1 text-xs sm:text-sm">
          {/* Section 1: Profile Information */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Profile Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Profile Name <span className="text-indigo-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder=""
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Channel Name <span className="text-indigo-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder=""
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Description <span className="text-slate-500">(Optional)</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder=""
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-colors"
              />
            </div>
          </div>

          {/* Section 2: Speaker Settings */}
          <div className="space-y-3 pt-3 border-t border-white/5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Speaker Settings
            </h3>

            {/* Gender & Accent */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Gender
                </label>
                <div className="flex gap-2">
                  {["Male", "Female"].map((g) => (
                    <button
                      type="button"
                      key={g}
                      onClick={() => setGender(g)}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium border transition-colors ${
                        gender === g
                          ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/50 font-bold"
                          : "bg-black/40 text-slate-400 border-white/10 hover:text-white"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Accent
                </label>
                <select
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500/60 transition-colors"
                >
                  {ACCENT_OPTIONS.map((acc) => (
                    <option key={acc} value={acc} className="bg-[#0C0C0E]">
                      {acc}
                    </option>
                  ))}
                </select>
                {accent === "Other / Custom" && (
                  <input
                    type="text"
                    value={customAccent}
                    onChange={(e) => setCustomAccent(e.target.value)}
                    placeholder="Specify accent (e.g. Scottish, Mid-Atlantic)"
                    className="w-full mt-2 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60"
                  />
                )}
              </div>
            </div>

            {/* Voice Selector */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-300">
                  Gemini TTS Voice <span className="text-indigo-400">*</span>
                </label>
                {selectedVoiceObj && (
                  <span className="text-[11px] text-indigo-400 font-medium">
                    {selectedVoiceObj.name} — {selectedVoiceObj.description}
                  </span>
                )}
              </div>

              <div className="relative mb-2">
                <input
                  type="text"
                  value={voiceSearch}
                  onChange={(e) => setVoiceSearch(e.target.value)}
                  placeholder="Search voices by characteristic (e.g. breathy, lower pitch, calm)..."
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto p-1.5 bg-black/40 rounded-lg border border-white/10">
                {filteredVoices.map((v) => {
                  const isSelected = voice.toLowerCase() === v.name.toLowerCase();
                  return (
                    <button
                      type="button"
                      key={v.name}
                      onClick={() => {
                        setVoice(v.name);
                        // Suggest matching gender if user hasn't heavily customized
                        if (v.gender && !isEditing) setGender(v.gender);
                      }}
                      className={`text-left p-2 rounded-md border transition-all flex flex-col justify-between ${
                        isSelected
                          ? "bg-indigo-600/20 border-indigo-500/50 text-white shadow-xs font-semibold"
                          : "bg-white/[0.02] border-white/5 hover:border-white/15 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-slate-100">{v.name}</span>
                        <span className="text-[10px] text-slate-400 px-1 py-0.2 rounded bg-black/40">
                          {v.gender}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-tight">
                        {v.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Style & Pace */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Style
                </label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500/60 transition-colors"
                >
                  {STYLE_OPTIONS.map((st) => (
                    <option key={st} value={st} className="bg-[#0C0C0E]">
                      {st}
                    </option>
                  ))}
                </select>
                {style === "Custom" && (
                  <input
                    type="text"
                    value={customStyle}
                    onChange={(e) => setCustomStyle(e.target.value)}
                    placeholder="Specify delivery style (e.g. Gritty, Cynical)"
                    className="w-full mt-2 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Pace
                </label>
                <select
                  value={pace}
                  onChange={(e) => setPace(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500/60 transition-colors"
                >
                  {PACE_OPTIONS.map((p) => (
                    <option key={p} value={p} className="bg-[#0C0C0E]">
                      {p}
                    </option>
                  ))}
                </select>
                {pace === "Custom" && (
                  <input
                    type="text"
                    value={customPace}
                    onChange={(e) => setCustomPace(e.target.value)}
                    placeholder="Specify custom pacing notes"
                    className="w-full mt-2 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Voice Direction */}
          <div className="space-y-2 pt-3 border-t border-white/5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Voice Direction
                </label>
                <p className="text-[11px] text-slate-400">
                  Persistent instructions describing how this narrator should sound
                </p>
              </div>

              <div className="flex items-center gap-1 text-[11px]">
                <span className="text-slate-500">Insert preset:</span>
                <button
                  type="button"
                  onClick={() => handleApplyDirectionTemplate("storytelling")}
                  className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors"
                >
                  Storytelling
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyDirectionTemplate("mystery")}
                  className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors"
                >
                  Mystery
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyDirectionTemplate("tech")}
                  className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors"
                >
                  Explainer
                </button>
              </div>
            </div>

            <textarea
              rows={5}
              value={voiceDirection}
              onChange={(e) => setVoiceDirection(e.target.value)}
              placeholder=""
              className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-colors font-sans leading-relaxed"
            />
            <div className="text-[11px] text-slate-500 flex justify-between">
              <span>Included in every video prompt under this profile</span>
              <span>{voiceDirection.length} characters</span>
            </div>
          </div>

          {/* Section 4: Default Profile Checkbox */}
          <div className="pt-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="isDefaultProfile"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-black/40 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-[#0C0C0E] accent-indigo-600"
            />
            <label htmlFor="isDefaultProfile" className="text-xs text-slate-300 select-none cursor-pointer">
              Set as Default Profile (automatically loads when opening TTS Studio)
            </label>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-white/5 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-lg text-slate-300 hover:bg-white/10 border border-white/10 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!name.trim()}
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-[0_0_15px_rgba(79,70,229,0.35)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              Save Profile
            </button>
          </div>
        </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
