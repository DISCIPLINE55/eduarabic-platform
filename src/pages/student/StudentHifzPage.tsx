import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { StatusBadge } from '@/components/common/StatusBadge';
import { BookMarked, Mic, MicOff, Upload, Loader2, PlayCircle, CheckCircle, Clock, RotateCcw, Square, Pause, Play, StopCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { SURAH_LIST } from '@/types/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function StudentHifzPage() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const [hifzRecords, setHifzRecords] = useState<any[]>([]);
  const [mySubmissions, setMySubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [surahNum, setSurahNum] = useState('1');
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live recording state
  const [inputMode, setInputMode] = useState<'record' | 'upload'>('record');
  const [recState, setRecState] = useState<'idle' | 'recording' | 'paused' | 'done'>('idle');
  const [recSeconds, setRecSeconds] = useState(0);
  const [recBlob, setRecBlob] = useState<Blob | null>(null);
  const [recUrl, setRecUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  const fetchData = async () => {
    if (!orgId || !profile) return;
    const [{ data: student }, { data: hifz }, { data: subs }, { data: teacher }] = await Promise.all([
      supabase.from('students').select('id').eq('organization_id', orgId).eq('profile_id', profile.id).maybeSingle(),
      supabase.from('hifz_progress').select('*').eq('organization_id', orgId).order('updated_at', { ascending: false }),
      supabase.from('audio_submissions').select('*').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(20),
      supabase.from('profiles').select('id').eq('organization_id', orgId).eq('role', 'teacher').limit(1).maybeSingle(),
    ]);
    setStudentId(student?.id || null);
    setHifzRecords(hifz || []);
    setMySubmissions(subs || []);
    setTeacherId(teacher?.id || null);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [orgId, profile]);

  // ── Live recording helpers ─────────────────────────────────────────────────
  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Pick best supported codec — Safari needs mp4, Chrome/Firefox prefer webm
      const preferredTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
      const mimeType = preferredTypes.find(t => MediaRecorder.isTypeSupported(t)) || '';
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      const usedMime = mimeType || mr.mimeType || 'audio/webm';
      chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: usedMime });
        const url = URL.createObjectURL(blob);
        setRecBlob(blob); setRecUrl(url); setRecState('done');
        stream.getTracks().forEach(t => t.stop());
      };
      mr.onerror = () => {
        toast.error('Recording failed. Please try again.');
        stream.getTracks().forEach(t => t.stop());
        setRecState('idle');
      };
      mr.start(200);
      mediaRecorderRef.current = mr;
      setRecState('recording'); setRecSeconds(0);
      timerRef.current = setInterval(() => setRecSeconds(s => s + 1), 1000);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        toast.error('Microphone access denied. Please allow microphone in your browser settings.');
      } else {
        toast.error('Could not start recording. Please check your microphone.');
      }
    }
  };

  const pauseRecording = () => {
    if (!mediaRecorderRef.current) return;
    mediaRecorderRef.current.pause();
    clearInterval(timerRef.current!);
    setRecState('paused');
  };

  const resumeRecording = () => {
    if (!mediaRecorderRef.current) return;
    mediaRecorderRef.current.resume();
    timerRef.current = setInterval(() => setRecSeconds(s => s + 1), 1000);
    setRecState('recording');
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
    clearInterval(timerRef.current!);
  };

  const resetRecording = () => {
    if (recUrl) URL.revokeObjectURL(recUrl);
    setRecBlob(null); setRecUrl(null); setRecState('idle'); setRecSeconds(0); setPlaying(false);
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current!);
      if (recUrl) URL.revokeObjectURL(recUrl);
    };
  }, [recUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { toast.error('File too large — max 20MB'); return; }
    setSelectedFile(file);
    toast.info(`Selected: ${file.name}`);
  };

  const handleSubmitRecitation = async () => {
    if (!orgId || !studentId) { toast.error('Student record not found'); return; }
    const hasAudio = inputMode === 'record' ? !!recBlob : !!selectedFile;
    if (!hasAudio) { toast.error('Please record or upload your recitation first'); return; }
    setSubmitting(true);

    let audioUrl: string | null = null;
    // Build File from recorded blob — use actual MIME type for extension
    const getExtFromMime = (mime: string) => {
      if (mime.includes('mp4')) return 'mp4';
      if (mime.includes('ogg')) return 'ogg';
      return 'webm';
    };
    const audioSource = inputMode === 'record'
      ? (recBlob ? new File([recBlob], `recitation-${Date.now()}.${getExtFromMime(recBlob.type)}`, { type: recBlob.type || 'audio/webm' }) : null)
      : selectedFile;

    if (audioSource) {
      const ext = audioSource.name.split('.').pop() || 'webm';
      const filePath = `hifz/${orgId}/${studentId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('audio_submissions')
        .upload(filePath, audioSource, { contentType: audioSource.type || 'audio/webm', upsert: false });
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('audio_submissions').getPublicUrl(filePath);
        audioUrl = urlData.publicUrl;
      } else {
        toast.error(`Audio upload failed: ${uploadError.message}`);
        setSubmitting(false);
        return;
      }
    }

    const { error } = await supabase.from('audio_submissions').insert({
      organization_id: orgId, student_id: studentId, teacher_id: teacherId,
      surah_number: parseInt(surahNum), audio_url: audioUrl,
      student_notes: notes || null, status: 'pending', created_by: profile?.id,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Recitation submitted for teacher review!');
    setShowSubmitDialog(false);
    setSelectedFile(null); setNotes(''); setSurahNum('1');
    resetRecording();
    fetchData();
  };

  const surahName = (num: number) => SURAH_LIST.find(s => s.number === num)?.name || `Surah ${num}`;
  const completedSurahs = hifzRecords.filter(r => r.status === 'memorized').length;

  const submissionStatusColor: Record<string, string> = {
    pending: 'bg-warning/10 text-warning border-warning/30',
    reviewed: 'bg-success/10 text-success border-success/30',
    rejected: 'bg-destructive/10 text-destructive border-destructive/30',
  };

  return (
    <div>
      <PageHeader title="Hifz Tracker" description="Track your Quran memorization journey">
        <Button onClick={() => setShowSubmitDialog(true)}>
          <Mic className="h-4 w-4 mr-2" />Submit Recitation
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{completedSurahs}</p>
          <p className="text-sm text-muted-foreground">Surahs Memorized</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{hifzRecords.length}</p>
          <p className="text-sm text-muted-foreground">Total Records</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{Math.round((completedSurahs / 114) * 100)}%</p>
          <p className="text-sm text-muted-foreground">Quran Completion</p>
          <Progress value={(completedSurahs / 114) * 100} className="h-2 mt-2" />
        </CardContent></Card>
      </div>

      <Card className="mb-4">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Surah</TableHead>
                  <TableHead className="whitespace-nowrap">Ayahs</TableHead>
                  <TableHead className="whitespace-nowrap">Progress</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap">Teacher Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading
                  ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                  : hifzRecords.length === 0
                    ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No Hifz records yet. Your teacher will record your progress.</TableCell></TableRow>
                    : hifzRecords.map(rec => (
                      <TableRow key={rec.id}>
                        <TableCell className="whitespace-nowrap">
                          <p className="font-medium text-sm">{surahName(rec.surah_number)}</p>
                          <p className="text-xs text-muted-foreground">#{rec.surah_number}</p>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{rec.ayah_from ?? '—'}–{rec.ayah_to ?? '—'}</TableCell>
                        <TableCell className="whitespace-nowrap min-w-[140px]">
                          <div className="flex items-center gap-2">
                            <Progress value={rec.completion_percentage || 0} className="h-2 flex-1" />
                            <span className="text-xs text-muted-foreground shrink-0">{rec.completion_percentage || 0}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap"><StatusBadge status={rec.status} /></TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{rec.teacher_notes || '—'}</TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {mySubmissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Mic className="h-4 w-4 text-primary" />My Recitation Submissions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Surah</TableHead>
                    <TableHead className="whitespace-nowrap">Submitted</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="whitespace-nowrap">Score</TableHead>
                    <TableHead className="whitespace-nowrap">Feedback</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mySubmissions.map(sub => (
                    <TableRow key={sub.id}>
                      <TableCell className="whitespace-nowrap text-sm font-medium">{sub.surah_number}. {surahName(sub.surah_number)}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{new Date(sub.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant="outline" className={`text-xs ${submissionStatusColor[sub.status] || 'bg-muted'}`}>
                          {sub.status === 'pending' ? <Clock className="h-3 w-3 mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                          {sub.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{sub.score != null ? `${sub.score}/10` : '—'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">{sub.teacher_text_feedback || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={v => {
        setShowSubmitDialog(v);
        if (!v) { setSelectedFile(null); resetRecording(); }
      }}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader><DialogTitle>Submit Recitation</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Surah</Label>
              <Select value={surahNum} onValueChange={setSurahNum}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-48">
                  {SURAH_LIST.map(s => <SelectItem key={s.number} value={String(s.number)}>{s.number}. {s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Mode toggle */}
            <Tabs value={inputMode} onValueChange={v => { setInputMode(v as 'record' | 'upload'); setSelectedFile(null); resetRecording(); }}>
              <TabsList className="w-full">
                <TabsTrigger value="record" className="flex-1 gap-1.5"><Mic className="h-3.5 w-3.5" />Record Live</TabsTrigger>
                <TabsTrigger value="upload" className="flex-1 gap-1.5"><Upload className="h-3.5 w-3.5" />Upload File</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Live recording UI */}
            {inputMode === 'record' && (
              <div className="rounded-lg border-2 border-border p-4 text-center space-y-3">
                {recState === 'idle' && (
                  <>
                    <div className="w-14 h-14 rounded-full bg-destructive/10 border-2 border-destructive/30 flex items-center justify-center mx-auto">
                      <Mic className="h-6 w-6 text-destructive" />
                    </div>
                    <p className="text-sm text-muted-foreground">Press to start recording your recitation</p>
                    <Button onClick={startRecording} className="gap-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                      <Mic className="h-4 w-4" />Start Recording
                    </Button>
                  </>
                )}

                {(recState === 'recording' || recState === 'paused') && (
                  <>
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto border-2 ${recState === 'recording' ? 'bg-destructive/10 border-destructive/50 animate-pulse' : 'bg-muted border-border'}`}>
                      {recState === 'recording' ? <Mic className="h-6 w-6 text-destructive" /> : <MicOff className="h-6 w-6 text-muted-foreground" />}
                    </div>
                    <p className="font-mono text-2xl font-semibold text-foreground">{formatTime(recSeconds)}</p>
                    <p className="text-xs text-muted-foreground">{recState === 'recording' ? 'Recording…' : 'Paused'}</p>
                    <div className="flex items-center justify-center gap-2">
                      {recState === 'recording'
                        ? <Button variant="outline" size="sm" onClick={pauseRecording} className="gap-1.5"><Pause className="h-3.5 w-3.5" />Pause</Button>
                        : <Button variant="outline" size="sm" onClick={resumeRecording} className="gap-1.5"><Play className="h-3.5 w-3.5" />Resume</Button>
                      }
                      <Button size="sm" onClick={stopRecording} className="gap-1.5 bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                        <Square className="h-3.5 w-3.5" />Stop
                      </Button>
                    </div>
                  </>
                )}

                {recState === 'done' && recUrl && (
                  <>
                    <div className="w-14 h-14 rounded-full bg-success/10 border-2 border-success/30 flex items-center justify-center mx-auto">
                      <CheckCircle className="h-6 w-6 text-success" />
                    </div>
                    <p className="text-sm font-medium text-foreground">Recording complete — {formatTime(recSeconds)}</p>
                    {/* Hidden audio element for playback */}
                    <audio ref={audioRef} src={recUrl} onEnded={() => setPlaying(false)} className="hidden" />
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="outline" size="sm" onClick={togglePlayback} className="gap-1.5">
                        {playing ? <StopCircle className="h-3.5 w-3.5" /> : <PlayCircle className="h-3.5 w-3.5" />}
                        {playing ? 'Stop' : 'Play Back'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={resetRecording} className="gap-1.5">
                        <RotateCcw className="h-3.5 w-3.5" />Re-record
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Upload UI */}
            {inputMode === 'upload' && (
              <div className="rounded-lg border-2 border-dashed border-border p-6 text-center">
                <Mic className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                {selectedFile ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-balance">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    <Button variant="outline" size="sm" onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}>
                      <RotateCcw className="h-3.5 w-3.5 mr-1.5" />Change File
                    </Button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground mb-3">Upload your recitation audio (max 20MB)</p>
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="h-4 w-4 mr-2" />Upload Audio
                    </Button>
                  </>
                )}
                <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFileChange} />
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Notes for Teacher (optional)</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Any notes about this recitation…" className="px-3" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowSubmitDialog(false); setSelectedFile(null); resetRecording(); }}>Cancel</Button>
            <Button onClick={handleSubmitRecitation} disabled={submitting || (inputMode === 'record' ? recState !== 'done' : !selectedFile)}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
