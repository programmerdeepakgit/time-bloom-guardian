import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { TimerButton } from '@/components/ui/timer-button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatTime, generateRecordId, formatDate } from '@/utils/timer';
import { storageUtils } from '@/utils/storage';
import { StudyRecord } from '@/types';
import {
  ArrowLeft, Play, Pause, Square, Coffee, Users, Crown,
  Timer as TimerIcon, Target, Clock, BookOpen,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

type GroupMode = 'pomodoro' | 'target-study' | 'simple';
type ParticipantStatus = 'studying' | 'break' | 'left';

interface Participant {
  user_id: string;
  username: string | null;
  status: ParticipantStatus;
  joined_at: string;
}

interface GroupStudyTimerProps {
  groupId: string;
  initialMode?: GroupMode;
  initialSubject?: string;
  groupName?: string;
  onBack: () => void;
}

const SUBJECTS = [
  { value: 'all', label: 'All Subjects' },
  { value: 'physics', label: 'Physics' },
  { value: 'chemistry', label: 'Chemistry' },
  { value: 'maths', label: 'Mathematics' },
  { value: 'computer-science', label: 'Computer Science' },
  { value: 'english', label: 'English' },
  { value: 'hindi', label: 'Hindi' },
  { value: 'social-studies', label: 'Social Studies' },
  { value: 'biology', label: 'Biology' },
  { value: 'mixed', label: 'Mixed' },
];

const POMODORO_STUDY = 25 * 60;
const POMODORO_BREAK = 5 * 60;

const GroupStudyTimer: React.FC<GroupStudyTimerProps> = ({
  groupId, initialMode = 'pomodoro', initialSubject = 'all', groupName, onBack,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [mode, setMode] = useState<GroupMode>(initialMode);
  const [subject, setSubject] = useState<string>(initialSubject);
  const [targetHours, setTargetHours] = useState(1);
  const [targetMinutes, setTargetMinutes] = useState(0);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [timeValue, setTimeValue] = useState(0); // seconds — counts down (pomodoro/target) or up (simple)
  const [totalStudied, setTotalStudied] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);

  const [participants, setParticipants] = useState<Participant[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Realtime: fetch existing participants + subscribe ────────────────────
  useEffect(() => {
    if (!sessionId) return;

    const load = async () => {
      const { data } = await supabase
        .from('group_session_participants')
        .select('user_id, username, status, joined_at')
        .eq('session_id', sessionId)
        .neq('status', 'left');
      if (data) setParticipants(data as Participant[]);
    };
    load();

    const channel = supabase
      .channel(`gsp-${sessionId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'group_session_participants',
        filter: `session_id=eq.${sessionId}`,
      }, () => load())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  // ─── Timer tick ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isRunning || isPaused) {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      return;
    }

    intervalRef.current = setInterval(() => {
      if (mode === 'simple') {
        // Stopwatch up
        setTimeValue(prev => prev + 1);
        if (!isBreak) setTotalStudied(ts => ts + 1);
      } else {
        // Countdown
        setTimeValue(prev => {
          if (prev <= 1) {
            handlePhaseComplete();
            return 0;
          }
          return prev - 1;
        });
        if (!isBreak) setTotalStudied(ts => ts + 1);
      }
    }, 1000);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, isPaused, isBreak, mode]);

  // ─── Heartbeat: update last_seen every 20s ────────────────────────────────
  useEffect(() => {
    if (!sessionId || !user) return;
    heartbeatRef.current = setInterval(async () => {
      await supabase
        .from('group_session_participants')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('session_id', sessionId)
        .eq('user_id', user.id);
    }, 20000);
    return () => { if (heartbeatRef.current) clearInterval(heartbeatRef.current); };
  }, [sessionId, user]);

  // ─── Cleanup on unmount: leave session ────────────────────────────────────
  useEffect(() => {
    return () => {
      if (sessionId && user) {
        supabase
          .from('group_session_participants')
          .delete()
          .eq('session_id', sessionId)
          .eq('user_id', user.id)
          .then(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const updateMyStatus = async (status: ParticipantStatus) => {
    if (!sessionId || !user) return;
    await supabase
      .from('group_session_participants')
      .update({ status, last_seen_at: new Date().toISOString() })
      .eq('session_id', sessionId)
      .eq('user_id', user.id);
  };

  const updateGlobalStudyStatus = async (studying: boolean) => {
    if (!user) return;
    await supabase
      .from('users')
      .update({
        is_studying: studying,
        currently_studying_subject: studying ? subject : null,
      })
      .eq('auth_user_id', user.id);
  };

  const syncStudyTime = async (duration: number) => {
    if (!user || duration <= 0) return;
    const { data } = await supabase
      .from('users')
      .select('total_study_time')
      .eq('auth_user_id', user.id)
      .single();
    const dbTotal = data?.total_study_time || 0;
    await supabase
      .from('users')
      .update({ total_study_time: dbTotal + duration, updated_at: new Date().toISOString() })
      .eq('auth_user_id', user.id);
  };

  // ─── Find or create active session, then join as participant ──────────────
  const startOrJoinSession = async () => {
    if (!user) return;

    // Look for an existing active session in this group with same mode
    const { data: existing } = await supabase
      .from('group_study_sessions')
      .select('*')
      .eq('group_id', groupId)
      .eq('is_active', true)
      .eq('mode', mode)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let activeSessionId = existing?.id;

    if (!activeSessionId) {
      // Create new session
      const { data: created, error } = await supabase
        .from('group_study_sessions')
        .insert({
          group_id: groupId,
          started_by: user.id,
          mode,
          subject,
        })
        .select()
        .single();
      if (error || !created) {
        toast({ title: 'Failed to start session', variant: 'destructive' });
        return null;
      }
      activeSessionId = created.id;
    }

    // Get my username
    const { data: me } = await supabase
      .from('users')
      .select('username')
      .eq('auth_user_id', user.id)
      .single();

    // Upsert myself as participant
    await supabase
      .from('group_session_participants')
      .upsert(
        {
          session_id: activeSessionId,
          user_id: user.id,
          username: me?.username || 'Someone',
          status: 'studying',
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: 'session_id,user_id' }
      );

    setSessionId(activeSessionId);
    return activeSessionId;
  };

  // ─── Controls ─────────────────────────────────────────────────────────────
  const handleStart = async () => {
    if (mode === 'target-study') {
      const total = targetHours * 3600 + targetMinutes * 60;
      if (total <= 0) {
        toast({ title: 'Set a target', description: 'Choose hours/minutes.', variant: 'destructive' });
        return;
      }
      setTimeValue(total);
    } else if (mode === 'pomodoro') {
      setTimeValue(POMODORO_STUDY);
    } else {
      setTimeValue(0);
    }

    const sId = await startOrJoinSession();
    if (!sId) return;

    setIsRunning(true);
    setIsPaused(false);
    setIsBreak(false);
    setTotalStudied(0);
    setSessionStartTime(new Date());
    updateGlobalStudyStatus(true);
    toast({ title: 'Joined Group Study! 🚀' });
  };

  const handlePause = () => { setIsPaused(true); updateMyStatus('break'); toast({ title: 'Paused ⏸️' }); };
  const handleResume = () => { setIsPaused(false); updateMyStatus('studying'); toast({ title: 'Resumed ▶️' }); };

  const handleBreak = () => {
    setIsBreak(true);
    setIsPaused(false);
    if (mode === 'pomodoro' || mode === 'target-study') setTimeValue(POMODORO_BREAK);
    updateMyStatus('break');
    toast({ title: 'Break time ☕' });
  };

  const handleResumeFromBreak = () => {
    setIsBreak(false);
    if (mode === 'pomodoro') setTimeValue(POMODORO_STUDY);
    if (mode === 'target-study') {
      const remaining = (targetHours * 3600 + targetMinutes * 60) - totalStudied;
      setTimeValue(Math.max(remaining, 0));
    }
    updateMyStatus('studying');
    toast({ title: 'Back to studying 📚' });
  };

  const handlePhaseComplete = () => {
    if (mode === 'pomodoro') {
      if (isBreak) {
        setIsBreak(false);
        setTimeValue(POMODORO_STUDY);
        updateMyStatus('studying');
        toast({ title: 'Break done! 📚' });
      } else {
        // Save pomodoro chunk
        if (sessionStartTime) saveStudyRecord(POMODORO_STUDY);
        setIsBreak(true);
        setTimeValue(POMODORO_BREAK);
        updateMyStatus('break');
        toast({ title: 'Pomodoro complete! ☕ Break time.' });
      }
    } else if (mode === 'target-study') {
      // Target reached
      setIsRunning(false);
      if (sessionStartTime && totalStudied > 0) saveStudyRecord(totalStudied);
      updateGlobalStudyStatus(false);
      updateMyStatus('left');
      toast({ title: 'Target Complete! 🎉' });
    }
  };

  const saveStudyRecord = (duration: number) => {
    if (!sessionStartTime || duration < 10) return;
    const record: StudyRecord = {
      id: generateRecordId(),
      type: mode === 'pomodoro' ? 'pomodoro' : mode === 'target-study' ? 'target-study' : 'self-study',
      subject,
      startTime: sessionStartTime,
      endTime: new Date(),
      duration,
      date: formatDate(sessionStartTime),
    };
    storageUtils.saveStudyRecord(record);
    if (user) syncStudyTime(duration);
  };

  const handleStop = async () => {
    setIsRunning(false);
    setIsPaused(false);
    setIsBreak(false);

    if (sessionStartTime && totalStudied >= 10) saveStudyRecord(totalStudied);
    updateGlobalStudyStatus(false);

    if (sessionId && user) {
      await supabase
        .from('group_session_participants')
        .delete()
        .eq('session_id', sessionId)
        .eq('user_id', user.id);
    }

    toast({
      title: 'Stopped',
      description: totalStudied >= 10 ? `Saved: ${formatTime(totalStudied)}` : 'Session too short to save.',
    });

    setTotalStudied(0);
    setTimeValue(0);
    setSessionId(null);
    setSessionStartTime(null);
  };

  // ─── Derived ──────────────────────────────────────────────────────────────
  const studyingCount = participants.filter(p => p.status === 'studying').length;
  const breakCount = participants.filter(p => p.status === 'break').length;
  const isCountdown = mode === 'pomodoro' || mode === 'target-study';
  const totalTarget = mode === 'target-study' ? targetHours * 3600 + targetMinutes * 60 :
                       mode === 'pomodoro' ? POMODORO_STUDY : 0;
  const progress = totalTarget > 0 && isRunning && !isBreak
    ? Math.min((totalStudied / totalTarget) * 100, 100)
    : 0;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <TimerButton variant="secondary" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </TimerButton>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-primary flex items-center gap-2">
              <Users className="w-5 h-5" /> Group Study
            </h1>
            {groupName && <p className="text-xs text-muted-foreground truncate">{groupName}</p>}
          </div>
          {sessionId && (
            <span className="text-xs px-2 py-1 rounded-full bg-success/20 text-success flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> LIVE
            </span>
          )}
        </div>

        {/* Mode + Subject (only before start) */}
        {!isRunning && (
          <Card className="gradient-card p-4 space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Timer Mode</Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setMode('pomodoro')}
                  className={`p-3 rounded-lg border text-center transition ${
                    mode === 'pomodoro' ? 'bg-primary/20 border-primary text-primary' : 'border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <TimerIcon className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-xs font-medium">Pomodoro</div>
                </button>
                <button
                  onClick={() => setMode('target-study')}
                  className={`p-3 rounded-lg border text-center transition ${
                    mode === 'target-study' ? 'bg-primary/20 border-primary text-primary' : 'border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <Target className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-xs font-medium">Target</div>
                </button>
                <button
                  onClick={() => setMode('simple')}
                  className={`p-3 rounded-lg border text-center transition ${
                    mode === 'simple' ? 'bg-primary/20 border-primary text-primary' : 'border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <Clock className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-xs font-medium">Stopwatch</div>
                </button>
              </div>
            </div>

            {mode === 'target-study' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Hours</Label>
                  <Input type="number" min={0} max={12} value={targetHours} onChange={e => setTargetHours(Number(e.target.value))} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Minutes</Label>
                  <Input type="number" min={0} max={59} value={targetMinutes} onChange={e => setTargetMinutes(Number(e.target.value))} />
                </div>
              </div>
            )}

            <div>
              <Label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1">
                <BookOpen className="w-3 h-3" /> Subject
              </Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <TimerButton variant="start" size="lg" onClick={handleStart} className="w-full">
              <Play className="w-5 h-5 mr-2" /> Start Group Study
            </TimerButton>
          </Card>
        )}

        {/* Active Timer */}
        {isRunning && (
          <Card className={`p-6 text-center ${isBreak ? 'bg-warning/10 border-warning/30' : 'gradient-card card-glow'}`}>
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-sm font-semibold text-foreground">
                {isBreak ? <><Coffee className="w-4 h-4 text-warning" /> On Break</> :
                  isPaused ? <>⏸️ Paused</> :
                  <><BookOpen className="w-4 h-4 text-success" /> Studying — {SUBJECTS.find(s => s.value === subject)?.label}</>
                }
              </div>

              <div className={`text-5xl sm:text-6xl font-mono font-bold ${
                isBreak ? 'text-warning' : isPaused ? 'text-foreground' : 'text-timer-active timer-glow'
              }`}>
                {formatTime(timeValue)}
              </div>

              {isCountdown && totalTarget > 0 && !isBreak && (
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Studied: <span className="font-mono text-foreground">{formatTime(totalStudied)}</span>
                {mode === 'pomodoro' && <> • Mode: 🍅 Pomodoro</>}
                {mode === 'target-study' && <> / Target: {formatTime(totalTarget)}</>}
                {mode === 'simple' && <> • Mode: ⏱️ Stopwatch</>}
              </p>
            </div>
          </Card>
        )}

        {/* Controls */}
        {isRunning && (
          <div className="grid grid-cols-2 gap-2">
            {!isPaused && !isBreak && (
              <>
                <TimerButton variant="secondary" onClick={handlePause}>
                  <Pause className="w-4 h-4 mr-1" /> Pause
                </TimerButton>
                <TimerButton variant="secondary" onClick={handleBreak}>
                  <Coffee className="w-4 h-4 mr-1" /> Break
                </TimerButton>
              </>
            )}
            {isPaused && (
              <TimerButton variant="start" onClick={handleResume} className="col-span-1">
                <Play className="w-4 h-4 mr-1" /> Resume
              </TimerButton>
            )}
            {isBreak && (
              <TimerButton variant="start" onClick={handleResumeFromBreak} className="col-span-1">
                <Play className="w-4 h-4 mr-1" /> Back to Study
              </TimerButton>
            )}
            <TimerButton variant="stop" onClick={handleStop} className={isPaused || isBreak ? 'col-span-1' : 'col-span-2'}>
              <Square className="w-4 h-4 mr-1" /> Leave Session
            </TimerButton>
          </div>
        )}

        {/* Live Members */}
        {sessionId && (
          <Card className="gradient-secondary p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Users className="w-4 h-4" /> In This Session
              </h3>
              <div className="flex gap-2 text-xs">
                <span className="px-2 py-0.5 rounded-full bg-success/20 text-success">
                  {studyingCount} studying
                </span>
                {breakCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-warning/20 text-warning">
                    {breakCount} break
                  </span>
                )}
              </div>
            </div>

            {participants.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-2">
                Waiting for others to join...
              </p>
            ) : (
              <div className="space-y-2">
                {participants
                  .sort((a, b) => (a.status === b.status ? 0 : a.status === 'studying' ? -1 : 1))
                  .map(p => (
                    <div key={p.user_id} className="flex items-center gap-3 p-2 rounded-lg bg-card/50">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm ${
                        p.status === 'studying' ? 'bg-success/20 text-success' :
                        p.status === 'break' ? 'bg-warning/20 text-warning' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {(p.username || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground truncate">
                            @{p.username || 'unknown'}
                          </span>
                          {p.user_id === user?.id && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary">YOU</span>
                          )}
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          {p.status === 'studying' && '📚 Studying'}
                          {p.status === 'break' && '☕ On a break'}
                          {p.status === 'left' && '👋 Left'}
                        </span>
                      </div>
                      {p.status === 'studying' && (
                        <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                      )}
                      {p.status === 'break' && (
                        <Coffee className="w-4 h-4 text-warning" />
                      )}
                    </div>
                  ))}
              </div>
            )}
          </Card>
        )}

        <div className="text-center pt-2">
          <p className="text-xs text-muted-foreground">
            Made by{' '}
            <button
              onClick={() => window.open('https://www.instagram.com/programmer_deepak/', '_blank')}
              className="text-primary hover:underline"
            >
              programmer_deepak
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default GroupStudyTimer;
