import React, { useEffect, useState } from 'react';
import type { GoogleCalendarEvent, JournalEntry, UserProfile } from '../../types';
import { reconnectGoogleCalendar } from '../../lib/firebase/client';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

interface CalendarViewProps {
  entries: JournalEntry[];
  onSelectEntry: (entry: JournalEntry) => void;
  user: UserProfile;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ entries, onSelectEntry, user }) => {
  const [activeTab, setActiveTab] = useState<'month' | 'week' | 'timeline'>('month');
  const [calendarEvents, setCalendarEvents] = useState<GoogleCalendarEvent[]>([]);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState(user.googleAccessToken);
  const [reconnecting, setReconnecting] = useState(false);
  const [month, setMonth] = useState(() => new Date());
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const leadingDays = (firstDay + 6) % 7;

  useEffect(() => {
    setAccessToken(user.googleAccessToken);
  }, [user.googleAccessToken]);

  useEffect(() => {
    if (!accessToken) {
      setCalendarError('Reconnect with Google to grant Calendar read access.');
      return;
    }

    const loadCalendar = async (token: string) => {
      try {
        setCalendarError(null);
        const start = new Date(month.getFullYear(), month.getMonth(), 1).toISOString();
        const end = new Date(month.getFullYear(), month.getMonth() + 1, 1).toISOString();
        const params = new URLSearchParams({
          calendarId: 'primary',
          timeMin: start,
          timeMax: end,
          singleEvents: 'true',
          orderBy: 'startTime',
        });
        const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.status === 401) throw new Error('Calendar authorization expired. Click Reconnect Google Calendar.');
        if (response.status === 403) throw new Error('Google Calendar API access is not enabled for this Firebase project. Enable it in Google Cloud Console.');
        if (!response.ok) throw new Error(`Google Calendar request failed (${response.status}).`);
        const data = await response.json();
        setCalendarEvents((data.items || []).map((event: {
          id: string;
          summary?: string;
          start?: { date?: string; dateTime?: string };
          end?: { date?: string; dateTime?: string };
        }) => ({
          id: event.id,
          title: event.summary || 'Untitled event',
          start: event.start?.dateTime || event.start?.date || '',
          end: event.end?.dateTime || event.end?.date,
          allDay: Boolean(event.start?.date),
        })));
      } catch (error: unknown) {
        setCalendarEvents([]);
        setCalendarError(error instanceof Error ? error.message : 'Unable to load Google Calendar.');
      }
    };

    void loadCalendar(accessToken);
  }, [month, accessToken]);

  const handleReconnect = async () => {
    try {
      setReconnecting(true);
      setCalendarError(null);
      const refreshedToken = await reconnectGoogleCalendar();
      setAccessToken(refreshedToken);
    } catch (error: unknown) {
      setCalendarError(error instanceof Error ? error.message : 'Google Calendar reconnection failed.');
    } finally {
      setReconnecting(false);
    }
  };

  const monthLabel = month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const monthEventCount = calendarEvents.length;
  const weekStart = new Date(month);
  weekStart.setDate(month.getDate() - ((month.getDay() + 6) % 7));
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });
  const journalDays = new Set(
    entries
      .map((entry) => new Date(entry.createdAt))
      .filter((date) => date.getMonth() === month.getMonth() && date.getFullYear() === month.getFullYear())
      .map((date) => date.getDate())
  ).size;
  const eventsForDay = (day: number) => calendarEvents.filter((event) => {
    const eventDate = new Date(event.start);
    return eventDate.getDate() === day && eventDate.getMonth() === month.getMonth() && eventDate.getFullYear() === month.getFullYear();
  });
  const eventsForDate = (date: Date) => calendarEvents.filter((event) => {
    const eventDate = new Date(event.start);
    return eventDate.getDate() === date.getDate() && eventDate.getMonth() === date.getMonth() && eventDate.getFullYear() === date.getFullYear();
  });
  const entriesForDate = (date: Date) => entries.filter((entry) => {
    const entryDate = new Date(entry.createdAt);
    return entryDate.getDate() === date.getDate() && entryDate.getMonth() === date.getMonth() && entryDate.getFullYear() === date.getFullYear();
  });
  const timelineItems = [
    ...calendarEvents.map((event) => ({
      id: `event-${event.id}`,
      date: new Date(event.start),
      title: event.title,
      type: 'Calendar event',
      color: 'bg-[#cbe8ef]',
    })),
    ...entries.map((entry) => ({
      id: `entry-${entry.id}`,
      date: new Date(entry.createdAt),
      title: entry.title,
      type: 'Journal entry',
      color: 'bg-[#f9b2d7]',
    })),
  ].sort((first, second) => second.date.getTime() - first.date.getTime());

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b border-[#efeeeb]">
        <div>
          <span className="text-[10px] text-[#504349] uppercase tracking-wider font-semibold block mb-1">
            Chronological Perspective
          </span>
          <div className="flex items-center gap-3">
            <h2 className="font-serif text-3xl text-[#1b1c1a]">{monthLabel}</h2>
            <div className="flex items-center gap-1 bg-[#efeeeb] rounded-lg p-0.5 border border-[#d4c2c9]/30">
              <button
                className="p-1 text-[#504349] hover:text-[#1b1c1a] rounded cursor-pointer"
                onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                title="Previous month"
                type="button"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                className="p-1 text-[#504349] hover:text-[#1b1c1a] rounded cursor-pointer"
                onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                title="Next month"
                type="button"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-xs text-[#504349] mt-1 font-serif italic">
            Your primary Google Calendar, aligned with your journal entries.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-[#efeeeb] p-1 rounded-xl border border-[#d4c2c9]/30 shadow-2xs">
          <button
            onClick={() => setActiveTab('month')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'month' ? 'bg-white text-[#1b1c1a] shadow-xs' : 'text-[#504349] hover:text-[#1b1c1a]'
            }`}
            type="button"
          >
            Month
          </button>
          <button
            onClick={() => setActiveTab('week')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'week' ? 'bg-white text-[#1b1c1a] shadow-xs' : 'text-[#504349] hover:text-[#1b1c1a]'
            }`}
            type="button"
          >
            Week
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'timeline' ? 'bg-white text-[#1b1c1a] shadow-xs' : 'text-[#504349] hover:text-[#1b1c1a]'
            }`}
            type="button"
          >
            Timeline
          </button>
        </div>
      </div>

      {calendarError && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#f9b2d7] bg-[#fff1f7] px-4 py-3 text-xs text-[#784160]">
          <span>{calendarError}</span>
          <button
            type="button"
            onClick={handleReconnect}
            disabled={reconnecting}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#854c6c] px-3 py-1.5 font-semibold text-white disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${reconnecting ? 'animate-spin' : ''}`} />
            {reconnecting ? 'Reconnecting...' : 'Reconnect Google Calendar'}
          </button>
        </div>
      )}

      {activeTab === 'month' && <div className="bg-white rounded-2xl border border-[#eae8e5] shadow-xs p-6 mb-8">
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-[#504349] pb-3 border-b border-[#efeeeb]">
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
          <span>Sun</span>
        </div>

        <div className="grid grid-cols-7 gap-2 pt-3">
          {Array.from({ length: leadingDays }, (_, index) => (
            <div key={`leading-${index}`} className="min-h-[88px] p-2.5 rounded-xl bg-[#fbf9f6]/40 opacity-40" />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const dayEvents = eventsForDay(day);
            const isToday = day === new Date().getDate() && month.getMonth() === new Date().getMonth() && month.getFullYear() === new Date().getFullYear();
            const dayEntry = entries.find((e) => new Date(e.createdAt).getDate() === day) || (isToday ? entries[0] : null);

            return (
              <div
                key={day}
                onClick={() => dayEntry && onSelectEntry(dayEntry)}
                className={`min-h-[88px] p-2.5 rounded-xl border text-left transition-all duration-150 ${
                  isToday
                    ? 'bg-[#ffd8ea]/30 border-[#854c6c] shadow-2xs cursor-pointer hover:bg-[#ffd8ea]/50'
                    : dayEntry
                    ? 'bg-[#f5f3f0] border-[#d4c2c9]/60 cursor-pointer hover:border-[#854c6c] hover:shadow-2xs'
                    : 'bg-white border-[#efeeeb]'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className={`font-mono ${isToday ? 'font-bold text-[#854c6c]' : 'text-[#504349]'}`}>
                    {day}
                  </span>
                  {(dayEntry || dayEvents.length > 0) && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#854c6c]" />
                  )}
                </div>

                {dayEntry && (
                  <p className="text-[10px] font-serif text-[#1b1c1a] line-clamp-2 leading-tight">
                    {dayEntry.title}
                  </p>
                )}
                {dayEvents.slice(0, 2).map((event) => (
                  <p key={event.id} className="text-[10px] text-[#486369] line-clamp-1 leading-tight">{event.title}</p>
                ))}
              </div>
            );
          })}
        </div>
      </div>}

      {activeTab === 'week' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 mb-8">
          {weekDays.map((date) => {
            const dayEvents = eventsForDate(date);
            const dayEntries = entriesForDate(date);
            const isToday = date.toDateString() === new Date().toDateString();
            return (
              <div key={date.toISOString()} className={`min-h-[220px] rounded-2xl border p-4 ${isToday ? 'border-[#854c6c] bg-[#fff1f7]' : 'border-[#eae8e5] bg-white'}`}>
                <div className="flex items-center justify-between border-b border-[#efeeeb] pb-3 mb-3">
                  <span className="text-[10px] uppercase font-semibold text-[#504349]">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                  <span className="font-mono text-sm text-[#1b1c1a]">{date.getDate()}</span>
                </div>
                <div className="space-y-2">
                  {dayEvents.map((event) => (
                    <div key={event.id} className="rounded-lg bg-[#cbe8ef]/70 px-2.5 py-2 text-[11px] text-[#021f24]">{event.title}</div>
                  ))}
                  {dayEntries.map((entry) => (
                    <button key={entry.id} type="button" onClick={() => onSelectEntry(entry)} className="w-full rounded-lg bg-[#f9b2d7]/70 px-2.5 py-2 text-left text-[11px] text-[#784160]">{entry.title}</button>
                  ))}
                  {dayEvents.length === 0 && dayEntries.length === 0 && <p className="text-[11px] italic text-[#827379]">No activity</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="bg-white rounded-2xl border border-[#eae8e5] shadow-xs p-6 mb-8">
          <div className="space-y-1">
            {timelineItems.length === 0 ? (
              <p className="text-xs text-[#504349]">No calendar or journal activity yet.</p>
            ) : timelineItems.map((item) => (
              <div key={item.id} className="flex items-start gap-3 border-b border-[#efeeeb] py-3 last:border-0">
                <span className={`mt-1.5 h-2.5 w-2.5 rounded-full ${item.color}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#1b1c1a]">{item.title}</p>
                  <p className="mt-1 text-[11px] text-[#504349]">{item.type} · {item.date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <section className="p-6 rounded-2xl bg-white border border-[#eae8e5] shadow-xs">
          <span className="text-[10px] text-[#854c6c] uppercase tracking-wider font-semibold">Temporal rhythm</span>
          <h3 className="font-serif text-xl text-[#1b1c1a] mt-1">Writing habit rhythm</h3>
          <p className="text-xs text-[#504349] leading-relaxed mt-3">
            {journalDays === 0
              ? 'No journal entries are recorded for this month yet.'
              : `${journalDays} day${journalDays === 1 ? '' : 's'} with journal activity this month, alongside ${monthEventCount} scheduled calendar event${monthEventCount === 1 ? '' : 's'}.`}
          </p>
        </section>
        <section className="p-6 rounded-2xl bg-white border border-[#eae8e5] shadow-xs">
          <span className="text-[10px] text-[#486369] uppercase tracking-wider font-semibold">Correlation insight</span>
          <h3 className="font-serif text-xl text-[#1b1c1a] mt-1">Calendar sync synergy</h3>
          <p className="text-xs text-[#504349] leading-relaxed mt-3">
            {monthEventCount > 0 && journalDays > 0
              ? 'Your journal and primary calendar are now visible together for this month.'
              : 'Add calendar events and journal entries to see their relationship here.'}
          </p>
        </section>
      </div>
    </div>
  );
};
