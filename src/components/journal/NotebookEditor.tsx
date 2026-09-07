import React, { useState, useEffect, useRef } from 'react';
import type { JournalEntry, CompanionInteraction, UserProfile } from '../../types';
import { requestCompanionReflection } from '../../lib/api';
import { saveCompanionInteraction } from '../../lib/firestore/service';
import {
  Sparkles,
  Mic,
  Maximize2,
  Minimize2,
  Cloud,
  FileText,
  Quote,
  HelpCircle,
  Plus,
  X,
  Copy,
  Check,
  BookOpen,
  MessageSquare,
  MapPin,
  ArrowLeft,
} from 'lucide-react'; 

interface NotebookEditorProps {
  entry: JournalEntry;
  user: UserProfile;
  onSaveEntry: (updated: JournalEntry) => void;
  onDeleteEntry?: (id: string) => void;
  onBack?: () => void;
}

type JournalBlock = {
  label: string;
  text: string;
  kind: 'entry' | 'companion';
};

const getJournalBlocks = (value: string): JournalBlock[] => {
  const parts = value.split(/(\[Gemini [^\]]+\])/g);
  const blocks: JournalBlock[] = [];
  let currentLabel = 'Journal entry';
  let currentKind: JournalBlock['kind'] = 'entry';

  parts.forEach((part) => {
    const marker = part.match(/^\[Gemini ([^\]]+)\]$/);
    if (marker) {
      currentLabel = `Gemini ${marker[1]}`;
      currentKind = 'companion';
      return;
    }

    if (part.trim()) {
      blocks.push({ label: currentLabel, text: part.trim(), kind: currentKind });
      currentLabel = 'Journal entry';
      currentKind = 'entry';
    }
  });

  return blocks;
};

const hasCompanionEdit = (previous: string, next: string): boolean => {
  if (previous === next) return false;

  let changeStart = 0;
  while (changeStart < previous.length && changeStart < next.length && previous[changeStart] === next[changeStart]) {
    changeStart += 1;
  }

  let previousEnd = previous.length;
  let nextEnd = next.length;
  while (previousEnd > changeStart && nextEnd > changeStart && previous[previousEnd - 1] === next[nextEnd - 1]) {
    previousEnd -= 1;
    nextEnd -= 1;
  }

  const companionRanges = [...previous.matchAll(/\[Gemini [^\]]+\][\s\S]*?(?=\[Gemini [^\]]+\]|$)/g)];
  return companionRanges.some((match) => {
    const start = match.index ?? 0;
    const end = start + match[0].length;
    const isInsertion = changeStart === previousEnd;
    return isInsertion
      ? changeStart > start && changeStart < end
      : changeStart < end && previousEnd > start;
  });
};

export const NotebookEditor: React.FC<NotebookEditorProps> = ({ entry, user, onSaveEntry, onBack }) => {
  const [title, setTitle] = useState(entry.title);
  const [content, setContent] = useState(entry.content);
  const [slashQuery, setSlashQuery] = useState('');
  const [category, setCategory] = useState<'work' | 'personal'>(entry.category || 'work');
  const [tags, setTags] = useState<string[]>(entry.tags || []);
  const [marginNotes, setMarginNotes] = useState<string[]>(entry.marginNotes || []);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [companionLoading, setCompanionLoading] = useState(false);
  const [activeInteraction, setActiveInteraction] = useState<CompanionInteraction | null>(null);
  const [customPromptInput, setCustomPromptInput] = useState('');
  const [showCustomPromptModal, setShowCustomPromptModal] = useState(false);
  const [audioRecording, setAudioRecording] = useState(false);
  const [saveBanner, setSaveBanner] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | null>(null);
  const [showPinPicker, setShowPinPicker] = useState(false);
  const [slashSelectedIndex, setSlashSelectedIndex] = useState(0);
  const isFirstRender = useRef(true);
  const slashTokenRangeRef = useRef<{ start: number; end: number } | null>(null);

  const recognitionRef = useRef<any>(null);
  const [interimText, setInterimText] = useState('');

  const contentRef = useRef<HTMLTextAreaElement>(null);
  const visibleCommandsRef = useRef<typeof slashCommands>([]);

  useEffect(() => {
    setTitle(entry.title);
    setContent(entry.content);
    setCategory(entry.category || 'work');
    setTags(entry.tags || []);
    setMarginNotes(entry.marginNotes || []);
    setActiveInteraction(null);
    isFirstRender.current = true;
  }, [entry.id]);

  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const readTime = Math.max(1, Math.ceil(words / 220));

  useEffect(() => {
    // Skip auto-save on initial mount
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setSaveStatus('saving');
    const timer = setTimeout(() => {
      onSaveEntry({
        ...entry,
        title,
        content,
        category,
        tags,
        marginNotes,
        wordCount: words,
        readingTimeMinutes: readTime,
        updatedAt: new Date().toISOString(),
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 2000);
    }, 800);
    return () => clearTimeout(timer);
  }, [title, content, category, tags, marginNotes]);

  const slashCommands = [
    {
      command: '/gem' as const,
      aliases: ['gem'],
      icon: <Sparkles className="w-4 h-4" />,
      iconBg: 'bg-[#f9b2d7] text-[#784160]',
      label: '/gem',
      badge: 'Companion',
      description: 'Your contextual thinking partner',
    },
    {
      command: '/ask' as const,
      aliases: ['ask'],
      icon: <HelpCircle className="w-4 h-4" />,
      iconBg: 'bg-[#efeeeb] text-[#504349]',
      label: '/ask',
      badge: null,
      description: 'Inquire past thoughts',
    },
    {
      command: '/summarise' as const,
      aliases: ['sum', 'summarise'],
      icon: <FileText className="w-4 h-4" />,
      iconBg: 'bg-[#efeeeb] text-[#504349]',
      label: '/summarise',
      badge: null,
      description: 'Condense entry into core insights',
    },
    {
      command: '/prompt' as const,
      aliases: ['prm', 'prompt'],
      icon: <BookOpen className="w-4 h-4" />,
      iconBg: 'bg-[#efeeeb] text-[#504349]',
      label: '/prompt',
      badge: null,
      description: 'Unblock thinking with questions',
    },
    {
      command: '/quotes' as const,
      aliases: ['quo', 'quotes'],
      icon: <Quote className="w-4 h-4" />,
      iconBg: 'bg-[#efeeeb] text-[#504349]',
      label: '/quotes',
      badge: null,
      description: 'Find resonant citations & philosophy',
    },
  ];

  const openMenu = () => {
    if (contentRef.current) {
      const editor = contentRef.current;
      const rect = editor.getBoundingClientRect();
      const lineHeight = Number.parseFloat(window.getComputedStyle(editor).lineHeight) || 28;
      const beforeCursor = editor.value.slice(0, editor.selectionStart);
      const lineNumber = beforeCursor.split('\n').length - 1;
      const currentLine = beforeCursor.split('\n').pop() || '';
      const fontSize = Number.parseFloat(window.getComputedStyle(editor).fontSize) || 20;
      const estimatedCursorX = currentLine.length * fontSize * 0.48;
      const menuWidth = Math.min(288, window.innerWidth - 24);
      const menuHeight = 360;
      const caretTop = rect.top + 16 + (lineNumber * lineHeight) - editor.scrollTop + lineHeight;
      const preferredTop = caretTop + 12;
      const top = Math.min(preferredTop, Math.max(12, window.innerHeight - menuHeight));
      const preferredLeft = rect.left + 24 + estimatedCursorX - editor.scrollLeft;
      const left = Math.max(12, Math.min(preferredLeft, window.innerWidth - menuWidth - 12));
      setMenuPos({ top, left });
    }
    setShowSlashMenu(true);
  };

  const handleContentChange = (nextContent: string) => {
    if (hasCompanionEdit(content, nextContent)) {
      setSaveBanner('Gemini responses cannot be edited.');
      setTimeout(() => setSaveBanner(null), 2500);
      return;
    }
    setContent(nextContent);
    const cursorPosition = contentRef.current?.selectionStart ?? nextContent.length;
    const textBeforeCursor = nextContent.slice(0, cursorPosition);
    const tokenMatch = textBeforeCursor.match(/(?:^|\s)(\/[^\s]*)$/);
    const currentToken = tokenMatch?.[1] || '';
    if (currentToken.startsWith('/') && currentToken.length <= 20) {
      slashTokenRangeRef.current = {
        start: cursorPosition - currentToken.length,
        end: cursorPosition,
      };
      setSlashQuery(currentToken.slice(1).toLowerCase());
      setSlashSelectedIndex(0);
      openMenu();
    } else {
      slashTokenRangeRef.current = null;
      setSlashQuery('');
      setShowSlashMenu(false);
    }
  };

  const handleEditorKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSlashMenu) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      slashTokenRangeRef.current = null;
      setShowSlashMenu(false);
      setSlashQuery('');
      setSlashSelectedIndex(0);
      return;
    }
    if (event.key === 'ArrowDown') {
      if (visibleCommandsRef.current.length === 0) return;
      event.preventDefault();
      setSlashSelectedIndex((i: number) => (i + 1) % visibleCommandsRef.current.length);
      return;
    }
    if (event.key === 'ArrowUp') {
      if (visibleCommandsRef.current.length === 0) return;
      event.preventDefault();
      setSlashSelectedIndex((i: number) => (i - 1 + visibleCommandsRef.current.length) % visibleCommandsRef.current.length);
      return;
    }
    if (event.key === 'Enter' && !companionLoading) {
      if (visibleCommandsRef.current.length === 0) return;
      event.preventDefault();
      const selectedCommand = visibleCommandsRef.current[slashSelectedIndex].command;
      const range = slashTokenRangeRef.current;
      const cursorPosition = contentRef.current?.selectionStart ?? content.length;
      const start = range?.start ?? cursorPosition;
      const end = range?.end ?? cursorPosition;
      const cleaned = `${content.slice(0, start)}${content.slice(end)}`.replace(/\n{3,}/g, '\n\n').trim();
      slashTokenRangeRef.current = null;
      setContent(cleaned);
      setSlashQuery('');
      setShowSlashMenu(false);
      setSlashSelectedIndex(0);
      void handleInvokeCompanion(selectedCommand, undefined, cleaned);
    }
  };

  const handleCommandSelect = (command: '/gem' | '/ask' | '/summarise' | '/prompt' | '/quotes') => {
    const range = slashTokenRangeRef.current;
    const cursorPosition = contentRef.current?.selectionStart ?? content.length;
    const start = range?.start ?? cursorPosition;
    const end = range?.end ?? cursorPosition;
    const cleaned = range
      ? `${content.slice(0, start)}${content.slice(end)}`.replace(/\n{3,}/g, '\n\n').trim()
      : content;
    slashTokenRangeRef.current = null;
    setContent(cleaned);
    setSlashQuery('');
    setShowSlashMenu(false);
    void handleInvokeCompanion(command, undefined, cleaned);
  };

  const handleInvokeCompanion = async (
    cmd: '/gem' | '/ask' | '/summarise' | '/prompt' | '/quotes',
    promptText?: string,
    contentOverride?: string
  ) => {
    try {
      setCompanionLoading(true);
      setShowSlashMenu(false);
      setShowCustomPromptModal(false);
      const result = await requestCompanionReflection({
        command: cmd,
        currentTitle: title,
        currentContent: contentOverride ?? content,
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
      setContent((c) => `${c.trimEnd()}\n\n[Gemini ${cmd}]\n${result.response}`.trimStart());
      setTags((currentTags) => currentTags.includes(cmd) ? currentTags : [...currentTags, cmd]);
      setActiveInteraction(newInteraction);
      await saveCompanionInteraction(user.uid, newInteraction);
      setSaveBanner(`Companion reflection generated via ${result.modelUsed}`);
      setTimeout(() => setSaveBanner(null), 4000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gemini is unavailable. Try again later.';
      setSaveBanner(message);
      setTimeout(() => setSaveBanner(null), 5000);
    } finally {
      setCompanionLoading(false);
    }
  };

  const handleInsertMarginNote = (noteText: string) => {
    const updatedNotes = [...marginNotes, noteText];
    setMarginNotes(updatedNotes);
    onSaveEntry({ ...entry, title, content, category, tags, marginNotes: updatedNotes });
    setSaveBanner('Insight inserted as margin note.');
    setTimeout(() => setSaveBanner(null), 3000);
  };

  const handleCopyReflection = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const PIN_TYPES = [
    { type: 'default',  emoji: '📍', label: 'Default'  },
    { type: 'home',     emoji: '🏠', label: 'Home'     },
    { type: 'office',   emoji: '🏢', label: 'Office'   },
    { type: 'love',     emoji: '❤️', label: 'Love'     },
    { type: 'cafe',     emoji: '☕', label: 'Café'     },
    { type: 'nature',   emoji: '🌿', label: 'Nature'   },
    { type: 'travel',   emoji: '✈️', label: 'Travel'   },
    { type: 'favorite', emoji: '⭐', label: 'Favorite' },
    { type: 'temple',   emoji: '🛕', label: 'Temple'   },
    { type: 'memory',   emoji: '🕯️', label: 'Memory'   },
  ] as const;

  const handleAddLocation = (pinType: JournalEntry['pinType'] = 'default') => {
    setShowPinPicker(false);
    if (!navigator.geolocation) {
      setSaveBanner('Geolocation not supported by this browser.');
      setTimeout(() => setSaveBanner(null), 3000);
      return;
    }
    setSaveBanner('Acquiring GPS coordinates...');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || 'Unknown';
          const state = data.address?.state || '';
          const country = data.address?.country_code?.toUpperCase() || '';
          const locationStr = [city, state, country].filter(Boolean).join(', ');
          onSaveEntry({ ...entry, title, content, category, tags, marginNotes, location: locationStr, coordinates: { lat: latitude, lng: longitude }, pinType });
          const pin = PIN_TYPES.find((p) => p.type === pinType);
          setSaveBanner(`${pin?.emoji ?? '📍'} Pinned as ${pin?.label}: ${locationStr}`);
        } catch {
          onSaveEntry({ ...entry, title, content, category, tags, marginNotes, location: `${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`, coordinates: { lat: latitude, lng: longitude }, pinType });
          setSaveBanner('📍 Coordinates saved');
        }
        setTimeout(() => setSaveBanner(null), 4000);
      },
      () => { setSaveBanner('Location access denied.'); setTimeout(() => setSaveBanner(null), 3000); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleToggleSpeak = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSaveBanner('Speech recognition not supported in this browser.');
      setTimeout(() => setSaveBanner(null), 3000);
      return;
    }

    if (audioRecording) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;

    recognition.onstart = () => setAudioRecording(true);

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalTranscript += t + ' ';
        else interimTranscript += t;
      }
      if (finalTranscript) {
        setContent((prev) => (prev.trim() ? prev.trimEnd() + ' ' : '') + finalTranscript.trim());
      }
      setInterimText(interimTranscript);
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'aborted') {
        setSaveBanner(`Mic error: ${event.error}`);
        setTimeout(() => setSaveBanner(null), 3000);
      }
      setAudioRecording(false);
      setInterimText('');
    };

    recognition.onend = () => {
      setAudioRecording(false);
      setInterimText('');
    };

    recognition.start();
  };

  const visibleCommands = slashCommands.filter(
    ({ aliases }) => !slashQuery || aliases.some((a) => a.startsWith(slashQuery))
  );
  visibleCommandsRef.current = visibleCommands;

  return (
    <div className={`relative min-w-0 max-w-[1320px] mx-auto py-5 px-3 sm:py-8 sm:px-6 lg:px-10 transition-all duration-200 ${isFocusMode ? 'max-w-4xl' : ''}`}>

      {onBack && (
        <button
          onClick={onBack}
          className="mb-5 inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#504349] transition-colors hover:bg-white hover:text-[#854c6c] cursor-pointer"
          type="button"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to calendar
        </button>
      )}

      {/* Save Banner */}
      {saveBanner && (
        <div className="fixed top-18 right-8 z-50 px-4 py-2.5 rounded-xl bg-white text-[#1b1c1a] border border-[#d4c2c9] shadow-lg text-xs flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2">
          <span className="w-2 h-2 rounded-full bg-[#4a6550]" />
          <span className="font-medium">{saveBanner}</span>
        </div>
      )}

      {/* Slash Command Menu — fixed, escapes all overflow */}
      {showSlashMenu && visibleCommands.length > 0 && (
        <div
          className="fixed z-[9999] w-[min(18rem,calc(100vw-1.5rem))] rounded-2xl bg-white border border-[#e8e4e1] shadow-[0_8px_40px_rgba(43,33,36,0.18)] overflow-hidden"
          style={{ top: menuPos.top, left: menuPos.left }}
        >
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#efeeeb]">
            <span className="text-[10px] font-bold tracking-widest text-[#827379] uppercase">Slash Commands</span>
            <span className="text-[10px] text-[#827379] font-medium tracking-wide">ESC TO CLOSE</span>
          </div>
          <div className="py-1">
            {visibleCommands.map((cmd, i) => (
              <button
                key={cmd.command}
                onClick={() => handleCommandSelect(cmd.command)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors cursor-pointer ${i === slashSelectedIndex ? 'bg-[#fdf6fa]' : 'hover:bg-[#faf9f8]'}`}
                type="button"
              >
                <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${cmd.iconBg}`}>
                  {cmd.icon}
                </span>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#1b1c1a]">{cmd.label}</span>
                    {cmd.badge && (
                      <span className="px-1.5 py-0.5 rounded-md bg-[#f9b2d7] text-[#784160] text-[10px] font-semibold">
                        {cmd.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-[#827379] truncate">{cmd.description}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Paper Leaf */}
        <article className={`min-w-0 bg-[#fffafd] rounded-[22px] shadow-[0_18px_38px_rgba(43,33,36,0.08)] border border-[#f2dce5] p-4 sm:p-7 lg:p-10 relative transition-all ${activeInteraction && !isFocusMode ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#d4c2c9]/40 rounded-tr-2xl pointer-events-none" />

          {/* Metadata Strip */}
          <div className="relative flex flex-wrap items-center justify-between gap-3 pb-5 mb-7 sm:pb-6 sm:mb-10">
            <div className="flex items-center gap-3 text-xs text-[#504349]">
              <span className="font-serif italic text-sm font-semibold text-[#1b1c1a]">
                {new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
              <span className="font-mono text-[11px]">
                {new Date(entry.updatedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </span>
              <span>•</span>
              <span className="font-mono text-[11px]">{words} words</span>
              <span>•</span>
              <span className="font-mono text-[11px]">~{readTime} min read</span>
              {saveStatus === 'saving' && (
                <span className="flex items-center gap-1 text-[#827379] text-[11px]">
                  <span className="w-3 h-3 border border-[#827379] border-t-transparent rounded-full animate-spin" />
                  Saving...
                </span>
              )}
              {saveStatus === 'saved' && (
                <span className="flex items-center gap-1 text-[#4a6550] text-[11px] font-medium">
                  <Check className="w-3 h-3" />
                  Saved
                </span>
              )}
            </div>
            <div className="flex items-center gap-2.5">
              <select
                value={category}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategory(e.target.value as 'work' | 'personal')}
                className="text-xs bg-[#f5f3f0] text-[#1b1c1a] px-3 py-1.5 rounded-lg border border-[#d4c2c9]/40 focus:outline-none cursor-pointer font-medium"
              >
                <option value="work">Work / Strategy</option>
                <option value="personal">Personal / Solitude</option>
              </select>
              <button
                onClick={() => setIsFocusMode(!isFocusMode)}
                className={`p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer ${isFocusMode ? 'bg-[#854c6c] text-white' : 'text-[#504349] hover:bg-[#efeeeb]'}`}
                type="button"
              >
                {isFocusMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline text-[11px] font-medium">{isFocusMode ? 'Focus On' : 'Focus'}</span>
              </button>
            </div>
            <span className="absolute bottom-0 left-0 h-1 w-full rounded-full bg-[#c45b87]" aria-hidden="true" />
          </div>

          {/* Weather Bar */}
          <div className="flex items-center justify-between gap-2 mb-6">
            <div className="flex items-center gap-2 text-xs text-[#827379] italic font-serif">
              <Cloud className="w-3.5 h-3.5 text-[#486369]" />
              {entry.pinType && PIN_TYPES.find(p => p.type === entry.pinType) && (
                <span>{PIN_TYPES.find(p => p.type === entry.pinType)!.emoji}</span>
              )}
              {entry.location && <span>{entry.location}</span>}
              {entry.location && entry.weather && <span>•</span>}
              {entry.weather && <span>{entry.weather}</span>}
            </div>
            <div className="relative">
              <button
                onClick={() => setShowPinPicker((v: boolean) => !v)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#f5f3f0] hover:bg-[#efeeeb] border border-[#d4c2c9]/40 text-[#504349] hover:text-[#854c6c] text-[11px] font-medium transition-colors cursor-pointer"
                type="button"
              >
                <MapPin className="w-3 h-3" />
                {entry.coordinates ? 'Change pin' : 'Pin location'}
              </button>
              {showPinPicker && (
                <div className="absolute right-0 top-8 z-50 bg-white border border-[#e8e4e1] rounded-2xl shadow-[0_8px_32px_rgba(43,33,36,0.14)] p-3 w-64">
                  <p className="text-[10px] text-[#827379] uppercase tracking-wider font-semibold mb-2 px-1">Choose pin type</p>
                  <div className="grid grid-cols-5 gap-1.5">
                    {PIN_TYPES.map((p) => (
                      <button
                        key={p.type}
                        onClick={() => handleAddLocation(p.type)}
                        title={p.label}
                        className={`flex flex-col items-center gap-0.5 p-2 rounded-xl transition-colors cursor-pointer ${
                          entry.pinType === p.type ? 'bg-[#f9b2d7]/40 ring-1 ring-[#854c6c]' : 'hover:bg-[#f5f3f0]'
                        }`}
                        type="button"
                      >
                        <span className="text-lg leading-none">{p.emoji}</span>
                        <span className="text-[9px] text-[#827379] font-medium">{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
            placeholder="Title of your reflection..."
            className="w-full min-w-0 border-b border-[#f1c7d9]/80 pb-2 font-serif text-2xl sm:text-4xl text-[#1b1c1a] font-normal tracking-tight placeholder:text-[#b45f82] focus:outline-none mb-5 leading-[1.1]"
          />

          {/* Editor */}
          <div className="relative mb-6">
            <div
              className="relative w-full max-w-full font-sans text-base sm:text-lg leading-[1.65] text-[#1b1c1a] break-words"
              style={{
                minHeight: 'clamp(26rem, 60vh, 52rem)',
                backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0, transparent calc(1.65em - 1px), rgba(241, 199, 217, 0.55) 1.65em)',
              }}
            >
              <div className="pointer-events-none min-h-[inherit] space-y-3" aria-hidden="true">
                {content ? getJournalBlocks(content).map((block, i) => (
                  <div
                    key={`${block.label}-${i}`}
                    className={`rounded-xl border px-4 py-3 shadow-[0_3px_12px_rgba(132,76,108,0.05)] ${
                      block.kind === 'companion'
                        ? 'border-[#e7a6c3] bg-[#fff2f8]'
                        : 'border-[#f1c7d9] bg-[#fffafd]'
                    }`}
                  >
                    <span className="mb-2 inline-flex rounded-md bg-[#f9b2d7] px-2 py-0.5 text-xs font-semibold text-[#784160]">
                      {block.label}
                    </span>
                    <div className="whitespace-pre-wrap">{block.text}</div>
                  </div>
                )) : (
                  <div className="rounded-xl border border-dashed border-[#e7a6c3] bg-[#fff2f8] px-4 py-3">
                    <span className="mb-2 inline-flex rounded-md bg-[#f9b2d7] px-2 py-0.5 text-xs font-semibold text-[#784160]">
                      Journal entry
                    </span>
                    <div className="text-[#b45f82]">Start writing your reflection...</div>
                  </div>
                )}
              </div>
              <textarea
                ref={contentRef}
                value={content}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleContentChange(e.target.value)}
                onKeyDown={handleEditorKeyDown}
                aria-label="Journal entry"
                className="absolute inset-0 h-full w-full resize-none overflow-hidden bg-transparent font-sans text-base sm:text-lg leading-[1.65] text-transparent caret-[#854c6c] placeholder:text-transparent focus:outline-none selection:bg-[#f9b2d7]/40"
              />
            </div>
            <div className="flex flex-wrap items-start justify-between gap-3 pt-3 border-t border-[#efeeeb] text-xs">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    if (showSlashMenu) {
                      setShowSlashMenu(false);
                    } else {
                      openMenu();
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f5f3f0] hover:bg-[#efeeeb] text-[#854c6c] font-medium border border-[#d4c2c9]/30 transition-colors cursor-pointer"
                  type="button"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>/ Companion Commands</span>
                </button>
                <span className="text-[#827379] text-[11px]">Type / or click to reflect</span>
              </div>
              <span className="max-w-full truncate text-[10px] text-[#4a6550] font-mono">
                Firestore Isolated • UID: {user.uid.slice(0, 6)}...
              </span>
            </div>
          </div>

          {/* Custom Prompt Dialog */}
          {showCustomPromptModal && (
            <div className="mb-6 p-4 rounded-xl bg-[#f5f3f0] border border-[#854c6c]/40 shadow-md animate-in fade-in">
              <span className="text-xs font-semibold text-[#1b1c1a] block mb-2">Inquire into your thoughts with Gemini</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customPromptInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomPromptInput(e.target.value)}
                  placeholder="e.g. How does this connect with my ideas on spatial simplicity?"
                  className="flex-1 px-3 py-2 text-xs rounded-lg bg-white border border-[#d4c2c9] focus:outline-none focus:ring-1 focus:ring-[#854c6c]"
                  onKeyDown={(e) => { if (e.key === 'Enter' && customPromptInput.trim()) handleInvokeCompanion('/ask', customPromptInput); }}
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

          {/* Margin Notes */}
          {marginNotes.length > 0 && (
            <div className="my-6 p-4 rounded-xl bg-[#f5f3f0]/80 border-l-3 border-[#854c6c] space-y-2">
              <span className="text-[10px] font-semibold text-[#854c6c] uppercase tracking-wider block">Margin Notes & Synapses</span>
              {marginNotes.map((note: string, idx: number) => (
                <div key={idx} className="text-xs text-[#504349] font-serif italic flex items-start justify-between gap-3">
                  <span>• {note}</span>
                  <button
                    onClick={() => setMarginNotes(marginNotes.filter((_: string, i: number) => i !== idx))}
                    className="text-[#827379] hover:text-[#ba1a1a] p-0.5 cursor-pointer shrink-0"
                    type="button"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Tags */}
          <div className="pt-6 border-t border-[#efeeeb] flex flex-wrap items-center gap-2">
            {tags.map((t: string, idx: number) => (
              <span key={idx} className="px-2.5 py-1 rounded-full bg-[#efeeeb] text-xs text-[#504349] font-medium flex items-center gap-1.5">
                #{t}
                <button onClick={() => setTags(tags.filter((_: string, i: number) => i !== idx))} className="hover:text-[#ba1a1a] cursor-pointer" type="button">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <button
              onClick={() => {
                const newTag = prompt('Add tag name:');
                if (newTag && newTag.trim() && !tags.includes(newTag.trim())) setTags([...tags, newTag.trim()]);
              }}
              className="px-2.5 py-1 rounded-full border border-dashed border-[#d4c2c9] text-xs text-[#504349] hover:bg-[#efeeeb] transition-colors cursor-pointer flex items-center gap-1"
              type="button"
            >
              <Plus className="w-3 h-3" />
              <span>Add tag</span>
            </button>
          </div>
        </article>

        {/* Sidecar */}
        {activeInteraction && !isFocusMode && (
          <aside className="lg:col-span-4 flex flex-col gap-4 animate-in fade-in slide-in-from-right-3">
            <div className="p-6 rounded-2xl bg-[#f5f3f0] border border-[#d4c2c9] shadow-xs relative">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#d4c2c9]/40">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#854c6c]" />
                  <span className="text-xs font-semibold text-[#1b1c1a]">Gemini Reflection</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-[#504349] font-mono px-2 py-0.5 rounded bg-white border border-[#d4c2c9]/30">{activeInteraction.modelUsed}</span>
                  <button onClick={() => setActiveInteraction(null)} className="text-[#504349] hover:text-[#1b1c1a] p-1 rounded cursor-pointer" type="button">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="mb-3 flex items-center gap-2">
                <span className="rounded-full bg-[#f9b2d7] px-2.5 py-1 text-[11px] font-semibold text-[#784160] font-mono">
                  {activeInteraction.command}
                </span>
                <span className="text-[10px] text-[#827379] uppercase tracking-wider font-semibold">Insight</span>
              </div>
              <p className="font-serif text-sm text-[#1b1c1a] leading-relaxed italic mb-4">"{activeInteraction.response}"</p>
              {activeInteraction.suggestion && (
                <div className="p-3 rounded-xl bg-white/70 border border-[#d4c2c9]/40 mb-4">
                  <span className="text-[10px] text-[#4a6550] uppercase tracking-wider font-semibold block mb-1">Catalytic Question</span>
                  <p className="text-xs text-[#504349] font-medium leading-normal">{activeInteraction.suggestion}</p>
                </div>
              )}
              <div className="flex flex-col gap-2 pt-2 border-t border-[#d4c2c9]/30">
                <button
                  onClick={() => handleInsertMarginNote(activeInteraction.response)}
                  className="w-full py-2 px-3 rounded-xl bg-white hover:bg-[#efeeeb] text-xs font-semibold text-[#1b1c1a] border border-[#d4c2c9]/50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
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

      {/* Floating Speak Button */}
      <div className="fixed bottom-8 right-8 z-40 flex flex-col items-end gap-2">
        {audioRecording && interimText && (
          <div className="max-w-xs px-3 py-2 rounded-xl bg-white border border-[#d4c2c9] shadow text-xs text-[#504349] font-serif italic animate-in fade-in">
            {interimText}
          </div>
        )}
        <button
          onClick={handleToggleSpeak}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-full text-xs font-semibold transition-all duration-200 shadow-lg cursor-pointer ${
            audioRecording
              ? 'bg-[#ba1a1a] text-white ring-4 ring-[#ffdad6]'
              : 'bg-white hover:bg-[#f5f3f0] text-[#1b1c1a] border border-[#d4c2c9] hover:scale-105 shadow-[0_4px_16px_rgba(0,0,0,0.08)]'
          }`}
          type="button"
        >
          <Mic className={`w-4 h-4 ${audioRecording ? 'text-white animate-bounce' : 'text-[#854c6c]'}`} />
          <span>{audioRecording ? 'Tap to stop' : 'Speak'}</span>
          {audioRecording && <span className="w-2 h-2 rounded-full bg-white animate-ping" />}
        </button>
      </div>

      {companionLoading && (
        <div className="fixed bottom-6 right-8 z-50 flex items-center gap-2.5 rounded-xl border border-[#f9b2d7] bg-[#fff8fb] px-3.5 py-2.5 shadow-[0_8px_24px_rgba(133,76,108,0.16)] animate-in fade-in slide-in-from-bottom-2 max-sm:bottom-4 max-sm:right-4">
          <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-[#854c6c] border-t-transparent" />
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-[#854c6c]">Gem is turning the thought over...</span>
            <span className="text-[10px] text-[#4a6550]">A little clarity is on its way.</span>
          </div>
        </div>
      )}
    </div>
  );
};
