import React, { useState, useEffect, useRef } from 'react';
import type { JournalEntry, CompanionInteraction, UserProfile } from '../../types';
import { requestCompanionReflection } from '../../lib/api';
import { saveCompanionInteraction } from '../../lib/firestore/service';
import {
  Sparkles,
  Mic,
  MicOff,
  Maximize2,
  Minimize2,
  Cloud,
  FileText,
  Quote,
  HelpCircle,
  MessageSquare,
  Plus,
  X,
  Copy,
  Check,
  CornerDownLeft,
  ChevronRight,
  BookOpen,
} from 'lucide-react';

interface NotebookEditorProps {
  entry: JournalEntry;
  user: UserProfile;
  onSaveEntry: (updated: JournalEntry) => void;
  onDeleteEntry?: (id: string) => void;
}

export const NotebookEditor: React.FC<NotebookEditorProps> = ({
  entry,
  user,
  onSaveEntry,
}) => {
  const [title, setTitle] = useState(entry.title);
  const [content, setContent] = useState(entry.content);
  const [category, setCategory] = useState<'work' | 'personal'>(entry.category || 'work');
  const [tags, setTags] = useState<string[]>(entry.tags || []);
  const [marginNotes, setMarginNotes] = useState<string[]>(entry.marginNotes || []);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [companionLoading, setCompanionLoading] = useState(false);
  const [activeInteraction, setActiveInteraction] = useState<CompanionInteraction | null>(null);
  const [customPromptInput, setCustomPromptInput] = useState('');
  const [showCustomPromptModal, setShowCustomPromptModal] = useState(false);
  const [audioRecording, setAudioRecording] = useState(false);
  const [saveBanner, setSaveBanner] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const contentRef = useRef<HTMLTextAreaElement>(null);

  // Synchronize local states when entry changes
  useEffect(() => {
    setTitle(entry.title);
    setContent(entry.content);
    setCategory(entry.category || 'work');
    setTags(entry.tags || []);
    setMarginNotes(entry.marginNotes || []);
    setActiveInteraction(null);
  }, [entry.id]);

  // Compute stats
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const readTime = Math.max(1, Math.ceil(words / 220));

  // Auto-save debounced
  useEffect(() => {
    const timer = setTimeout(() => {
      const updated: JournalEntry = {
        ...entry,
        title,
        content,
        category,
        tags,
        marginNotes,
        wordCount: words,
        readingTimeMinutes: readTime,
        updatedAt: new Date().toISOString(),
      };
      onSaveEntry(updated);
    }, 800);

    return () => clearTimeout(timer);
  }, [title, content, category, tags, marginNotes]);

  const handleInvokeCompanion = async (
    cmd: '/gem' | '/ask' | '/summarise' | '/prompt' | '/quotes',
    promptText?: string
  ) => {
    try {
      setCompanionLoading(true);
      setShowSlashMenu(false);
      setShowCustomPromptModal(false);

      const result = await requestCompanionReflection({
        command: cmd,
        currentTitle: title,
        currentContent: content,
        userPrompt: promptText,
        userId: user.uid,
      });

      const newInteraction: CompanionInteraction = {
        id: 'int_' + Date.now(),
        userId: user.uid,
        entryId: entry.id,
        command: cmd,
        prompt: promptText || `Invoked ${cmd} on "${title}"`,
        response: result.response,
        modelUsed: result.modelUsed,
        timestamp: new Date().toISOString(),
        suggestion: result.suggestion,
      };

      setActiveInteraction(newInteraction);
      await saveCompanionInteraction(user.uid, newInteraction);

      setSaveBanner(`Companion reflection generated via ${result.modelUsed}`);
      setTimeout(() => setSaveBanner(null), 4000);
    } catch (err: unknown) {
      console.warn('Error invoking companion:', err);
    } finally {
      setCompanionLoading(false);
    }
  };

  const handleInsertMarginNote = (noteText: string) => {
    const updatedNotes = [...marginNotes, noteText];
    setMarginNotes(updatedNotes);
    onSaveEntry({
      ...entry,
      title,
      content,
      category,
      tags,
      marginNotes: updatedNotes,
    });
    setSaveBanner('Insight inserted as margin note.');
    setTimeout(() => setSaveBanner(null), 3000);
  };

  const handleCopyReflection = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleToggleSpeak = () => {
    if (audioRecording) {
      setAudioRecording(false);
      setContent(
        (prev) =>
          prev +
          (prev ? '\n\n' : '') +
          '[Voice Reflection • 09:42 AM]: Observed how physical spatial constraints preserve focus more reliably than willpower alone.'
      );
    } else {
      setAudioRecording(true);
      setTimeout(() => {
        setAudioRecording(false);
        setContent(
          (prev) =>
            prev +
            (prev ? '\n\n' : '') +
            '[Audio Capture Decoded]: The mind requires deliberate pauses to synthesize architectural trade-offs.'
        );
      }, 3500);
    }
  };

  return (
    <div className={`relative max-w-5xl mx-auto py-8 px-4 sm:px-6 transition-all duration-200 ${isFocusMode ? 'max-w-3xl' : ''}`}>
      {/* Save Notification Toast */}
      {saveBanner && (
        <div className="fixed top-18 right-8 z-50 px-4 py-2.5 rounded-xl bg-white text-[#1b1c1a] border border-[#d4c2c9] shadow-lg text-xs flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2">
          <span className="w-2 h-2 rounded-full bg-[#4a6550]" />
          <span className="font-medium">{saveBanner}</span>
        </div>
      )}

      {/* Grid Layout: Main Manuscript Paper Leaf + Sidecar Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Paper Leaf */}
        <article className={`bg-white rounded-2xl shadow-[0_2px_16px_rgba(0,0,0,0.03)] border border-[#eae8e5] p-8 sm:p-12 relative overflow-hidden transition-all ${activeInteraction && !isFocusMode ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
          {/* Subtle decorative archival corner notch */}
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#d4c2c9]/40 rounded-tr-2xl pointer-events-none" />

          {/* Top Metadata Strip */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 mb-6 border-b border-[#efeeeb]">
            <div className="flex items-center gap-3 text-xs text-[#504349]">
              <span className="font-serif italic text-sm text-[#1b1c1a] font-medium">
                {new Date(entry.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              <span>•</span>
              <span className="font-mono text-[11px]">{words} words</span>
              <span>•</span>
              <span className="font-mono text-[11px]">~{readTime} min read</span>
            </div>

            <div className="flex items-center gap-2.5">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as 'work' | 'personal')}
                className="text-xs bg-[#f5f3f0] text-[#1b1c1a] px-3 py-1.5 rounded-lg border border-[#d4c2c9]/40 focus:outline-none cursor-pointer font-medium"
              >
                <option value="work">Work / Strategy</option>
                <option value="personal">Personal / Solitude</option>
              </select>

              <button
                onClick={() => setIsFocusMode(!isFocusMode)}
                className={`p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer ${
                  isFocusMode ? 'bg-[#854c6c] text-white' : 'text-[#504349] hover:bg-[#efeeeb]'
                }`}
                title="Toggle Distraction-Free Focus Mode"
                type="button"
              >
                {isFocusMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline text-[11px] font-medium">{isFocusMode ? 'Focus On' : 'Focus'}</span>
              </button>
            </div>
          </div>

          {/* Atmospheric Context & Weather Bar */}
          <div className="flex items-center gap-2 mb-6 text-xs text-[#827379] italic font-serif">
            <Cloud className="w-3.5 h-3.5 text-[#486369]" />
            <span>{entry.location || 'Mission District, SF'}</span>
            <span>•</span>
            <span>{entry.weather || 'Fog clearing, 59°F • 09:14 AM'}</span>
          </div>

          {/* Title Input */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title of your reflection..."
            className="w-full font-serif text-3xl sm:text-4xl text-[#1b1c1a] font-normal tracking-tight placeholder:text-[#827379]/40 focus:outline-none mb-6 leading-snug"
          />

          {/* Notebook Body Textarea */}
          <div className="relative mb-6">
            <textarea
              ref={contentRef}
              rows={14}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write freely. Use / to trigger Gemini companion reflections, summaries, or quotes..."
              className="w-full font-serif text-lg text-[#1b1c1a] leading-relaxed bg-transparent resize-y focus:outline-none placeholder:text-[#827379]/40 selection:bg-[#f9b2d7]/30"
            />

            {/* Quick slash trigger pill at bottom of editor */}
            <div className="flex items-center justify-between pt-3 border-t border-[#efeeeb] text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSlashMenu(!showSlashMenu)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f5f3f0] hover:bg-[#efeeeb] text-[#854c6c] font-medium border border-[#d4c2c9]/30 transition-colors cursor-pointer"
                  type="button"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>/ Companion Commands</span>
                </button>
                <span className="text-[#827379] text-[11px]">Type or click to reflect</span>
              </div>

              <span className="text-[10px] text-[#4a6550] font-mono">
                Firestore Isolated • UID: {user.uid.slice(0, 6)}...
              </span>
            </div>
          </div>

          {/* Slash Command Picker Popup */}
          {showSlashMenu && (
            <div className="mb-6 p-4 rounded-xl bg-[#f5f3f0] border border-[#d4c2c9] shadow-md flex flex-col gap-2 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-[#d4c2c9]/30">
                <span className="text-xs font-semibold text-[#1b1c1a] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#854c6c]" />
                  Gemini Notebook Companion
                </span>
                <button
                  onClick={() => setShowSlashMenu(false)}
                  className="text-[#504349] hover:text-[#1b1c1a] p-1 rounded cursor-pointer"
                  type="button"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                <button
                  onClick={() => handleInvokeCompanion('/gem')}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white hover:bg-[#eae8e5] text-left transition-colors border border-[#d4c2c9]/30 cursor-pointer"
                  type="button"
                >
                  <span className="w-7 h-7 rounded-lg bg-[#f9b2d7] text-[#784160] flex items-center justify-center text-xs font-bold font-mono">
                    /gem
                  </span>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-[#1b1c1a]">Reflective Companion</span>
                    <span className="text-[11px] text-[#504349]">Synthesize thoughts &amp; patterns</span>
                  </div>
                </button>

                <button
                  onClick={() => handleInvokeCompanion('/summarise')}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white hover:bg-[#eae8e5] text-left transition-colors border border-[#d4c2c9]/30 cursor-pointer"
                  type="button"
                >
                  <span className="w-7 h-7 rounded-lg bg-[#cbe8ef] text-[#021f24] flex items-center justify-center text-xs font-bold font-mono">
                    /sum
                  </span>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-[#1b1c1a]">Condense Breakthrough</span>
                    <span className="text-[11px] text-[#504349]">2-3 sentence strategic essence</span>
                  </div>
                </button>

                <button
                  onClick={() => handleInvokeCompanion('/prompt')}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white hover:bg-[#eae8e5] text-left transition-colors border border-[#d4c2c9]/30 cursor-pointer"
                  type="button"
                >
                  <span className="w-7 h-7 rounded-lg bg-[#ccead0] text-[#062010] flex items-center justify-center text-xs font-bold font-mono">
                    /prm
                  </span>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-[#1b1c1a]">Catalytic Question</span>
                    <span className="text-[11px] text-[#504349]">Unblock deep philosophical angles</span>
                  </div>
                </button>

                <button
                  onClick={() => handleInvokeCompanion('/quotes')}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white hover:bg-[#eae8e5] text-left transition-colors border border-[#d4c2c9]/30 cursor-pointer"
                  type="button"
                >
                  <span className="w-7 h-7 rounded-lg bg-[#f5f3f0] text-[#504349] flex items-center justify-center text-xs font-bold border border-[#d4c2c9] font-mono">
                    /quo
                  </span>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-[#1b1c1a]">Resonant Citations</span>
                    <span className="text-[11px] text-[#504349]">Classic design &amp; stoic wisdom</span>
                  </div>
                </button>
              </div>

              <div className="pt-2 border-t border-[#d4c2c9]/30 flex items-center justify-between">
                <button
                  onClick={() => {
                    setShowSlashMenu(false);
                    setShowCustomPromptModal(true);
                  }}
                  className="text-xs text-[#854c6c] hover:underline flex items-center gap-1.5 font-medium cursor-pointer"
                  type="button"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Ask specific question about this entry...
                </button>
              </div>
            </div>
          )}

          {/* Custom Prompt Dialog */}
          {showCustomPromptModal && (
            <div className="mb-6 p-4 rounded-xl bg-[#f5f3f0] border border-[#854c6c]/40 shadow-md animate-in fade-in">
              <span className="text-xs font-semibold text-[#1b1c1a] block mb-2">
                Inquire into your thoughts with Gemini
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customPromptInput}
                  onChange={(e) => setCustomPromptInput(e.target.value)}
                  placeholder="e.g. How does this connect with my ideas on spatial simplicity?"
                  className="flex-1 px-3 py-2 text-xs rounded-lg bg-white border border-[#d4c2c9] focus:outline-none focus:ring-1 focus:ring-[#854c6c]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customPromptInput.trim()) {
                      handleInvokeCompanion('/ask', customPromptInput);
                    }
                  }}
                />
                <button
                  onClick={() => handleInvokeCompanion('/ask', customPromptInput)}
                  disabled={!customPromptInput.trim() || companionLoading}
                  className="px-4 py-2 rounded-lg bg-[#854c6c] text-white text-xs font-semibold hover:bg-[#784160] disabled:opacity-50 transition-colors cursor-pointer"
                  type="button"
                >
                  Reflect
                </button>
                <button
                  onClick={() => setShowCustomPromptModal(false)}
                  className="px-3 py-2 rounded-lg bg-white text-xs text-[#504349] border border-[#d4c2c9] cursor-pointer"
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Loading Indicator for AI Companion */}
          {companionLoading && (
            <div className="my-6 p-4 rounded-xl bg-[#f5f3f0] border border-[#f9b2d7] flex items-center gap-3">
              <span className="w-4 h-4 border-2 border-[#854c6c] border-t-transparent rounded-full animate-spin" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-[#1b1c1a]">Contemplating notebook entry...</span>
                <span className="text-[11px] text-[#504349]">
                  Executing server-side fallback ladder (gemini-3.6-flash → gemini-3.1-flash-lite)
                </span>
              </div>
            </div>
          )}

          {/* Existing Margin Notes Section (Inside Paper Leaf) */}
          {marginNotes.length > 0 && (
            <div className="my-6 p-4 rounded-xl bg-[#f5f3f0]/80 border-l-3 border-[#854c6c] space-y-2">
              <span className="text-[10px] font-semibold text-[#854c6c] uppercase tracking-wider block">
                Margin Notes &amp; Synapses
              </span>
              {marginNotes.map((note, idx) => (
                <div key={idx} className="text-xs text-[#504349] font-serif italic flex items-start justify-between gap-3">
                  <span>• {note}</span>
                  <button
                    onClick={() => {
                      const next = marginNotes.filter((_, i) => i !== idx);
                      setMarginNotes(next);
                    }}
                    className="text-[#827379] hover:text-[#ba1a1a] p-0.5 cursor-pointer shrink-0"
                    title="Remove note"
                    type="button"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Tags & Taxonomy */}
          <div className="pt-6 border-t border-[#efeeeb] flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {tags.map((t, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-full bg-[#efeeeb] text-xs text-[#504349] font-medium flex items-center gap-1.5"
                >
                  #{t}
                  <button
                    onClick={() => setTags(tags.filter((_, i) => i !== idx))}
                    className="hover:text-[#ba1a1a] cursor-pointer"
                    type="button"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <button
                onClick={() => {
                  const newTag = prompt('Add tag name:');
                  if (newTag && newTag.trim() && !tags.includes(newTag.trim())) {
                    setTags([...tags, newTag.trim()]);
                  }
                }}
                className="px-2.5 py-1 rounded-full border border-dashed border-[#d4c2c9] text-xs text-[#504349] hover:bg-[#efeeeb] transition-colors cursor-pointer flex items-center gap-1"
                type="button"
              >
                <Plus className="w-3 h-3" />
                <span>Add tag</span>
              </button>
            </div>
          </div>
        </article>

        {/* Sidecar Leaf Column (Image 6 design) - Shown when companion reflection is active */}
        {activeInteraction && !isFocusMode && (
          <aside className="lg:col-span-4 flex flex-col gap-4 animate-in fade-in slide-in-from-right-3">
            <div className="p-6 rounded-2xl bg-[#f5f3f0] border border-[#d4c2c9] shadow-xs relative">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#d4c2c9]/40">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#854c6c]" />
                  <span className="text-xs font-semibold text-[#1b1c1a]">
                    Gemini Reflection
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-[#504349] font-mono px-2 py-0.5 rounded bg-white border border-[#d4c2c9]/30">
                    {activeInteraction.modelUsed}
                  </span>
                  <button
                    onClick={() => setActiveInteraction(null)}
                    className="text-[#504349] hover:text-[#1b1c1a] p-1 rounded cursor-pointer"
                    type="button"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <span className="text-[11px] text-[#854c6c] font-semibold uppercase tracking-wider block mb-2 font-mono">
                {activeInteraction.command} • Insight
              </span>

              <p className="font-serif text-sm text-[#1b1c1a] leading-relaxed italic mb-4">
                "{activeInteraction.response}"
              </p>

              {activeInteraction.suggestion && (
                <div className="p-3 rounded-xl bg-white/70 border border-[#d4c2c9]/40 mb-4">
                  <span className="text-[10px] text-[#4a6550] uppercase tracking-wider font-semibold block mb-1">
                    Catalytic Question
                  </span>
                  <p className="text-xs text-[#504349] font-medium leading-normal">
                    {activeInteraction.suggestion}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-2 pt-2 border-t border-[#d4c2c9]/30">
                <button
                  onClick={() => handleInsertMarginNote(activeInteraction.response)}
                  className="w-full py-2 px-3 rounded-xl bg-white hover:bg-[#efeeeb] text-xs font-semibold text-[#1b1c1a] border border-[#d4c2c9]/50 transition-colors shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                  type="button"
                >
                  <Plus className="w-3.5 h-3.5 text-[#854c6c]" />
                  <span>Insert as margin note</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleInvokeCompanion('/summarise')}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-[#cbe8ef] hover:bg-[#afcbd2] text-xs font-semibold text-[#021f24] transition-colors cursor-pointer text-center"
                    type="button"
                  >
                    Synthesize further
                  </button>
                  <button
                    onClick={() => handleCopyReflection(activeInteraction.response)}
                    className="p-2 rounded-xl bg-white hover:bg-[#efeeeb] border border-[#d4c2c9]/40 text-[#504349] transition-colors cursor-pointer"
                    title="Copy reflection"
                    type="button"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5 text-[#4a6550]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Floating Audio Capture / Speak Button as in Image 1.png */}
      <div className="fixed bottom-8 right-8 z-40">
        <button
          onClick={handleToggleSpeak}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-full text-xs font-semibold transition-all duration-200 shadow-lg cursor-pointer ${
            audioRecording
              ? 'bg-[#ba1a1a] text-white animate-pulse ring-4 ring-[#ffdad6]'
              : 'bg-white hover:bg-[#f5f3f0] text-[#1b1c1a] border border-[#d4c2c9] hover:scale-105 shadow-[0_4px_16px_rgba(0,0,0,0.08)]'
          }`}
          type="button"
        >
          {audioRecording ? (
            <>
              <Mic className="w-4 h-4 text-white animate-bounce" />
              <span>Recording Musings...</span>
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 text-[#854c6c]" />
              <span>Speak to Journal</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
