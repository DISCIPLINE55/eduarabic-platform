import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { streamLLM } from '@/lib/llm';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Mic, MicOff, Play, Pause, RotateCcw, Sparkles, BookOpen,
  ChevronDown, ChevronUp, Save, Loader2, Star, Clock, Bot,
  Volume2, CheckCircle2, AlertCircle, Info
} from 'lucide-react';

// ── Surah list (abbreviated for selector) ─────────────────────────────────────
const SURAHS = [
  { number: 1,  name: 'Al-Fatihah',    arabic: 'الفاتحة',       ayahs: 7  },
  { number: 2,  name: 'Al-Baqarah',    arabic: 'البقرة',         ayahs: 286 },
  { number: 3,  name: 'Ali Imran',     arabic: 'آل عمران',       ayahs: 200 },
  { number: 4,  name: 'An-Nisa',       arabic: 'النساء',         ayahs: 176 },
  { number: 5,  name: 'Al-Maidah',     arabic: 'المائدة',        ayahs: 120 },
  { number: 36, name: 'Ya-Sin',        arabic: 'يس',             ayahs: 83  },
  { number: 55, name: 'Ar-Rahman',     arabic: 'الرحمن',         ayahs: 78  },
  { number: 56, name: 'Al-Waqi\'ah',   arabic: 'الواقعة',        ayahs: 96  },
  { number: 67, name: 'Al-Mulk',       arabic: 'الملك',          ayahs: 30  },
  { number: 78, name: 'An-Naba',       arabic: 'النبأ',          ayahs: 40  },
  { number: 93, name: 'Ad-Duha',       arabic: 'الضحى',          ayahs: 11  },
  { number: 94, name: 'Ash-Sharh',     arabic: 'الشرح',          ayahs: 8   },
  { number: 95, name: 'At-Tin',        arabic: 'التين',          ayahs: 8   },
  { number: 96, name: 'Al-Alaq',       arabic: 'العلق',          ayahs: 19  },
  { number: 97, name: 'Al-Qadr',       arabic: 'القدر',          ayahs: 5   },
  { number: 98, name: 'Al-Bayyinah',   arabic: 'البينة',         ayahs: 8   },
  { number: 99, name: 'Az-Zalzalah',   arabic: 'الزلزلة',        ayahs: 8   },
  { number: 100, name: 'Al-Adiyat',    arabic: 'العاديات',       ayahs: 11  },
  { number: 101, name: 'Al-Qari\'ah',  arabic: 'القارعة',        ayahs: 11  },
  { number: 102, name: 'At-Takathur',  arabic: 'التكاثر',        ayahs: 8   },
  { number: 103, name: 'Al-Asr',       arabic: 'العصر',          ayahs: 3   },
  { number: 104, name: 'Al-Humazah',   arabic: 'الهمزة',         ayahs: 9   },
  { number: 105, name: 'Al-Fil',       arabic: 'الفيل',          ayahs: 5   },
  { number: 106, name: 'Quraysh',      arabic: 'قريش',           ayahs: 4   },
  { number: 107, name: 'Al-Ma\'un',    arabic: 'الماعون',        ayahs: 7   },
  { number: 108, name: 'Al-Kawthar',   arabic: 'الكوثر',         ayahs: 3   },
  { number: 109, name: 'Al-Kafirun',   arabic: 'الكافرون',       ayahs: 6   },
  { number: 110, name: 'An-Nasr',      arabic: 'النصر',          ayahs: 3   },
  { number: 111, name: 'Al-Masad',     arabic: 'المسد',          ayahs: 5   },
  { number: 112, name: 'Al-Ikhlas',    arabic: 'الإخلاص',        ayahs: 4   },
  { number: 113, name: 'Al-Falaq',     arabic: 'الفلق',          ayahs: 5   },
  { number: 114, name: 'An-Nas',       arabic: 'الناس',          ayahs: 6   },
];

// ── Tajweed rules reference for AI context ─────────────────────────────────────
const TAJWEED_CONTEXT = `Key Tajweed rules to evaluate:
- Makharij (articulation points): Are letters pronounced from correct throat/mouth positions?
- Sifaat (characteristics): Heavy/light letters, whispered/voiced sounds
- Noon/Meem rules: Ikhfa, Iqlab, Idgham, Izhar
- Madd (elongation): Rules for stretching vowels (2, 4, or 6 counts)
- Waqf (stopping): Proper pause positions
- Tafkheem/Tarqeeq: Emphasis on heavy vs. light letters
- Qalqalah: Echo sounds on specific letters`;

interface Session {
  id: string;
  surah_number: number;
  surah_name: string;
  ayah_from: number;
  ayah_to: number;
  self_rating: number | null;
  self_notes: string | null;
  ai_feedback: string | null;
  duration_seconds: number | null;
  created_at: string;
}

type RecordingState = 'idle' | 'recording' | 'recorded' | 'playing';

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(s => (
        <button key={s} onClick={() => onChange(s)} className="transition-colors">
          <Star className={`h-5 w-5 ${s <= value ? 'fill-warning text-warning' : 'text-muted-foreground'}`} />
        </button>
      ))}
    </div>
  );
}

function FeedbackDisplay({ text }: { text: string }) {
  // Parse sections from AI feedback
  const lines = text.split('\n').filter(Boolean);
  return (
    <div className="space-y-2 text-sm text-pretty">
      {lines.map((line, i) => {
        const isBold = line.startsWith('**') && line.includes('**', 2);
        const isCheck = line.startsWith('✅') || line.startsWith('•') || line.startsWith('-');
        const isWarn = line.startsWith('⚠') || line.startsWith('❌');
        const isInfo = line.startsWith('ℹ') || line.startsWith('💡') || line.startsWith('📖');
        const clean = line.replace(/^\*\*(.+?)\*\*:?$/, '$1').replace(/^[✅⚠❌ℹ💡📖•\-]\s*/, '');
        if (isBold) return <p key={i} className="font-semibold text-foreground">{line.replace(/\*\*/g, '')}</p>;
        if (isCheck) return <p key={i} className="flex items-start gap-1.5 text-success"><CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />{clean}</p>;
        if (isWarn) return <p key={i} className="flex items-start gap-1.5 text-warning"><AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />{clean}</p>;
        if (isInfo) return <p key={i} className="flex items-start gap-1.5 text-info"><Info className="h-4 w-4 mt-0.5 shrink-0" />{clean}</p>;
        return <p key={i} className="text-muted-foreground leading-relaxed">{line}</p>;
      })}
    </div>
  );
}

export default function HifzTutorPage() {
  const { profile } = useAuth();

  // Session setup
  const [selectedSurah, setSelectedSurah] = useState(SURAHS[0]);
  const [ayahFrom, setAyahFrom] = useState(1);
  const [ayahTo, setAyahTo] = useState(1);
  const [selfRating, setSelfRating] = useState(3);
  const [selfNotes, setSelfNotes] = useState('');

  // Recording
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const playbackRef = useRef<HTMLAudioElement | null>(null);

  // AI feedback
  const [aiFeedback, setAiFeedback] = useState('');
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  // History
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [savingSession, setSavingSession] = useState(false);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  // Keep ayahTo in sync when surah changes
  useEffect(() => {
    setAyahFrom(1);
    setAyahTo(Math.min(7, selectedSurah.ayahs));
  }, [selectedSurah]);

  useEffect(() => {
    if (ayahTo < ayahFrom) setAyahTo(ayahFrom);
  }, [ayahFrom, ayahTo]);

  // Load session history
  useEffect(() => {
    if (!profile?.id) return;
    loadSessions();
  }, [profile?.id]);

  const loadSessions = async () => {
    if (!profile?.id) return;
    setLoadingSessions(true);
    const { data } = await supabase
      .from('hifz_tutor_sessions')
      .select('*')
      .eq('student_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setSessions(data as Session[]);
    setLoadingSessions(false);
  };

  // ── Recording logic ────────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
        setRecordingState('recorded');
      };
      mr.start(100);
      mediaRecorderRef.current = mr;
      setRecordingSeconds(0);
      setRecordingState('recording');
      timerRef.current = setInterval(() => setRecordingSeconds(s => s + 1), 1000);
    } catch {
      toast.error('Microphone access denied. Please allow microphone in browser settings.');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const resetRecording = () => {
    setAudioBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setAiFeedback('');
    setRecordingState('idle');
    setRecordingSeconds(0);
  };

  const playRecording = () => {
    if (!audioUrl) return;
    if (recordingState === 'playing') {
      playbackRef.current?.pause();
      setRecordingState('recorded');
      return;
    }
    const audio = new Audio(audioUrl);
    playbackRef.current = audio;
    setRecordingState('playing');
    audio.onended = () => setRecordingState('recorded');
    audio.play();
  };

  const formatDuration = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // ── AI feedback ────────────────────────────────────────────────────────────
  const requestFeedback = useCallback(async () => {
    if (!audioBlob) return;
    setLoadingFeedback(true);
    setAiFeedback('');

    const prompt = `You are an expert Quran tutor and Tajweed specialist. A student has just recorded their recitation of:

**Surah ${selectedSurah.name} (${selectedSurah.arabic})** — Ayahs ${ayahFrom} to ${ayahTo}

**Student self-rating:** ${selfRating}/5
**Student's own notes:** ${selfNotes || '(none provided)'}
**Recording duration:** ${formatDuration(recordingSeconds)}

${TAJWEED_CONTEXT}

Based on this information, provide structured Hifz tutor feedback. Since you cannot hear the audio directly, give:

1. **Surah Overview** — Key Tajweed rules that apply to these specific ayahs
2. **Common Mistakes to Watch For** — List the most frequent errors students make in this section
3. **Pronunciation Checkpoints** — Specific letters or words in these ayahs that require attention
4. **Based on Self-Rating (${selfRating}/5)** — Tailored advice based on how the student rated themselves
5. **Practice Recommendations** — Concrete steps to improve this section
6. **Motivational Closing** — A brief Islamic reminder about the virtue of learning the Quran

Keep each section concise. Use ✅ for strengths to aim for, ⚠ for areas to watch, and 💡 for tips.`;

    const contents = [{ role: 'user' as const, parts: [{ text: prompt }] }];

    await streamLLM(contents, {
      onChunk: chunk => setAiFeedback(prev => prev + chunk),
      onComplete: () => setLoadingFeedback(false),
      onError: () => {
        toast.error('AI feedback failed. Please try again.');
        setLoadingFeedback(false);
      },
    });
  }, [audioBlob, selectedSurah, ayahFrom, ayahTo, selfRating, selfNotes, recordingSeconds]);

  // ── Save session ──────────────────────────────────────────────────────────
  const saveSession = async () => {
    if (!profile?.id || !aiFeedback) return;
    setSavingSession(true);
    const { error } = await supabase.from('hifz_tutor_sessions').insert({
      student_id: profile.id,
      surah_number: selectedSurah.number,
      surah_name: selectedSurah.name,
      ayah_from: ayahFrom,
      ayah_to: ayahTo,
      self_rating: selfRating,
      self_notes: selfNotes || null,
      ai_feedback: aiFeedback,
      duration_seconds: recordingSeconds,
    });
    if (error) { toast.error('Failed to save session'); }
    else {
      toast.success('Session saved successfully!');
      loadSessions();
      resetRecording();
      setSelfNotes('');
      setSelfRating(3);
    }
    setSavingSession(false);
  };

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="AI Hifz Tutor"
        description="Record your recitation, receive personalised Tajweed feedback powered by AI"
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Left: Recording panel ─────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-4">
          {/* Surah + Range selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />Select Passage to Recite
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Surah</Label>
                <Select
                  value={String(selectedSurah.number)}
                  onValueChange={v => {
                    const s = SURAHS.find(s => s.number === Number(v));
                    if (s) setSelectedSurah(s);
                  }}
                >
                  <SelectTrigger className="h-9 text-sm px-3"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-64">
                    {SURAHS.map(s => (
                      <SelectItem key={s.number} value={String(s.number)} className="text-sm">
                        <span className="font-medium">{s.number}. {s.name}</span>
                        <span className="ml-2 font-arabic text-muted-foreground" dir="rtl">{s.arabic}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">From Ayah</Label>
                  <Select value={String(ayahFrom)} onValueChange={v => setAyahFrom(Number(v))}>
                    <SelectTrigger className="h-9 text-sm px-3"><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-48">
                      {Array.from({ length: selectedSurah.ayahs }, (_, i) => i + 1).map(n => (
                        <SelectItem key={n} value={String(n)} className="text-sm">{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">To Ayah</Label>
                  <Select value={String(ayahTo)} onValueChange={v => setAyahTo(Number(v))}>
                    <SelectTrigger className="h-9 text-sm px-3"><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-48">
                      {Array.from({ length: selectedSurah.ayahs }, (_, i) => i + 1)
                        .filter(n => n >= ayahFrom)
                        .map(n => (
                          <SelectItem key={n} value={String(n)} className="text-sm">{n}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
                <Info className="h-3.5 w-3.5 shrink-0 text-primary" />
                Reciting <span className="font-medium text-foreground">{selectedSurah.name}</span>,
                ayah {ayahFrom}–{ayahTo} ({ayahTo - ayahFrom + 1} verse{ayahTo - ayahFrom > 0 ? 's' : ''})
              </div>
            </CardContent>
          </Card>

          {/* Recording */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Mic className="h-4 w-4 text-primary" />Record Recitation
              </CardTitle>
              <CardDescription className="text-xs">
                Press Record, recite the selected passage, then press Stop
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Waveform / timer */}
              <div className={`rounded-xl border-2 flex items-center justify-center min-h-20 transition-colors ${
                recordingState === 'recording'
                  ? 'border-destructive/60 bg-destructive/5'
                  : recordingState === 'recorded' || recordingState === 'playing'
                    ? 'border-success/60 bg-success/5'
                    : 'border-border bg-muted/30'
              }`}>
                {recordingState === 'idle' && (
                  <p className="text-muted-foreground text-sm">Press Record to begin</p>
                )}
                {recordingState === 'recording' && (
                  <div className="text-center space-y-2">
                    <div className="flex items-center gap-2 justify-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
                      <span className="text-destructive font-semibold text-sm">Recording</span>
                    </div>
                    <p className="text-2xl font-mono font-bold text-foreground">{formatDuration(recordingSeconds)}</p>
                    {/* Fake waveform bars */}
                    <div className="flex items-center gap-0.5 justify-center h-8">
                      {Array.from({ length: 20 }).map((_, i) => (
                        <div key={i} className="w-1 bg-destructive/60 rounded-full animate-pulse"
                          style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 50}ms` }} />
                      ))}
                    </div>
                  </div>
                )}
                {(recordingState === 'recorded' || recordingState === 'playing') && (
                  <div className="text-center space-y-1">
                    <CheckCircle2 className="h-8 w-8 text-success mx-auto" />
                    <p className="text-sm font-medium text-success">Recording complete</p>
                    <p className="text-xs text-muted-foreground">{formatDuration(recordingSeconds)} recorded</p>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2 justify-center flex-wrap">
                {recordingState === 'idle' && (
                  <Button onClick={startRecording} className="gap-2 min-w-32">
                    <Mic className="h-4 w-4" />Start Recording
                  </Button>
                )}
                {recordingState === 'recording' && (
                  <Button onClick={stopRecording} variant="destructive" className="gap-2 min-w-32">
                    <MicOff className="h-4 w-4" />Stop Recording
                  </Button>
                )}
                {(recordingState === 'recorded' || recordingState === 'playing') && (
                  <>
                    <Button onClick={playRecording} variant="outline" className="gap-2">
                      {recordingState === 'playing'
                        ? <><Pause className="h-4 w-4" />Pause</>
                        : <><Volume2 className="h-4 w-4" />Play Back</>
                      }
                    </Button>
                    <Button onClick={resetRecording} variant="ghost" className="gap-2">
                      <RotateCcw className="h-4 w-4" />Re-record
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Self-assessment */}
          {recordingState !== 'idle' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Self-Assessment</CardTitle>
                <CardDescription className="text-xs">Rate your recitation and add notes for the AI tutor</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs">How confident were you? (1 = unsure, 5 = very confident)</Label>
                  <StarRating value={selfRating} onChange={setSelfRating} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Your notes / specific questions (optional)</Label>
                  <Textarea
                    placeholder="e.g. I struggled with the Madd in ayah 3, or I'm unsure about the Waqf positions…"
                    value={selfNotes}
                    onChange={e => setSelfNotes(e.target.value)}
                    className="resize-none text-sm px-3"
                    rows={3}
                  />
                </div>

                <Button
                  onClick={requestFeedback}
                  disabled={!audioBlob || loadingFeedback}
                  className="w-full gap-2"
                >
                  {loadingFeedback
                    ? <><Loader2 className="h-4 w-4 animate-spin" />Generating Feedback…</>
                    : <><Sparkles className="h-4 w-4" />Get AI Feedback</>
                  }
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Right: AI Feedback + History ─────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          {/* AI Feedback */}
          <Card className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" />AI Tutor Feedback
                {aiFeedback && !loadingFeedback && (
                  <Badge variant="secondary" className="ml-auto text-[10px]">Ready</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!aiFeedback && !loadingFeedback && (
                <div className="text-center py-8 space-y-3">
                  <Sparkles className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    Record your recitation and tap <strong>Get AI Feedback</strong> to receive personalised Tajweed guidance
                  </p>
                </div>
              )}
              {(aiFeedback || loadingFeedback) && (
                <ScrollArea className="max-h-[500px] pr-2">
                  <div className="space-y-1">
                    <FeedbackDisplay text={aiFeedback} />
                    {loadingFeedback && (
                      <p className="text-xs text-muted-foreground animate-pulse mt-2">Analysing…</p>
                    )}
                  </div>
                </ScrollArea>
              )}
              {aiFeedback && !loadingFeedback && (
                <div className="mt-4 pt-3 border-t border-border">
                  <Button
                    onClick={saveSession}
                    disabled={savingSession}
                    size="sm"
                    className="w-full gap-2"
                    variant="secondary"
                  >
                    {savingSession
                      ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving…</>
                      : <><Save className="h-3.5 w-3.5" />Save This Session</>
                    }
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Session history */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />Past Sessions
                {!loadingSessions && sessions.length > 0 && (
                  <Badge variant="outline" className="ml-auto text-[10px]">{sessions.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loadingSessions && (
                <div className="space-y-2">
                  {[1, 2].map(i => <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />)}
                </div>
              )}
              {!loadingSessions && sessions.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No saved sessions yet. Complete a session and tap "Save" to keep a record.
                </p>
              )}
              {sessions.map(s => (
                <div key={s.id} className="border border-border rounded-lg overflow-hidden">
                  <button
                    className="w-full flex items-center gap-3 p-3 hover:bg-muted/40 transition-colors text-left"
                    onClick={() => setExpandedSession(expandedSession === s.id ? null : s.id)}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">{s.surah_number}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{s.surah_name} ({s.ayah_from}–{s.ayah_to})</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(s.created_at).toLocaleDateString()}
                        </span>
                        {s.self_rating && (
                          <div className="flex gap-0.5">
                            {Array.from({ length: s.self_rating }).map((_, i) => (
                              <Star key={i} className="h-2.5 w-2.5 fill-warning text-warning" />
                            ))}
                          </div>
                        )}
                        {s.duration_seconds && (
                          <span className="text-[10px] text-muted-foreground">{formatDuration(s.duration_seconds)}</span>
                        )}
                      </div>
                    </div>
                    {expandedSession === s.id
                      ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                      : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    }
                  </button>
                  {expandedSession === s.id && s.ai_feedback && (
                    <div className="px-3 pb-3 border-t border-border">
                      <Separator className="mb-3" />
                      <ScrollArea className="max-h-52">
                        <FeedbackDisplay text={s.ai_feedback} />
                      </ScrollArea>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
