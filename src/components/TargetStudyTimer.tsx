import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { TimerButton } from '@/components/ui/timer-button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { formatTime, generateRecordId, formatDate } from '@/utils/timer';
import { storageUtils } from '@/utils/storage';
import { StudyRecord } from '@/types';
import { Play, Square, Pause, Coffee, Target, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface TargetStudyTimerProps {
  onBack: () => void;
}

const TargetStudyTimer: React.FC<TargetStudyTimerProps> = ({ onBack }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentSubject, setCurrentSubject] = useState('all');
  const [targetHours, setTargetHours] = useState(1);
  const [targetMinutes, setTargetMinutes] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalStudied, setTotalStudied] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  // Auto-break settings
  const [autoBreakEnabled, setAutoBreakEnabled] = useState(false);
  const [autoBreakInterval, setAutoBreakInterval] = useState(25); // minutes
  const [autoBreakDuration, setAutoBreakDuration] = useState(5); // minutes
  const [studiedSinceBreak, setStudiedSinceBreak] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (isBreak) {
              // Break over
              setIsBreak(false);
              setStudiedSinceBreak(0);
              toast({ title: "Break Over! 📚", description: "Back to studying!" });
              return 0; // Will be recalculated
            } else {
              // Target reached!
              handleTargetComplete();
              return 0;
            }
          }
          if (!isBreak) {
            setTotalStudied(ts => ts + 1);
            setStudiedSinceBreak(sb => {
              const newVal = sb + 1;
              if (autoBreakEnabled && newVal >= autoBreakInterval * 60) {
                triggerAutoBreak();
              }
              return newVal;
            });
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, isPaused, isBreak, autoBreakEnabled, autoBreakInterval]);

  const triggerAutoBreak = () => {
    setIsBreak(true);
    setTimeLeft(autoBreakDuration * 60);
    setStudiedSinceBreak(0);
    toast({ title: "Auto Break! ☕", description: `Take a ${autoBreakDuration}-minute break.` });
  };

  const updateStudyingStatus = async (studying: boolean) => {
    if (!user) return;
    await supabase
      .from('users')
      .update({ is_studying: studying, currently_studying_subject: studying ? currentSubject : null })
      .eq('auth_user_id', user.id);
  };

  const syncStudyTime = async (duration: number) => {
    if (!user) return;
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

  const handleStart = () => {
    const totalSeconds = (targetHours * 3600) + (targetMinutes * 60);
    if (totalSeconds <= 0) {
      toast({ title: "Set a Target", description: "Please set a valid study duration.", variant: "destructive" });
      return;
    }
    setTimeLeft(totalSeconds);
    setTotalStudied(0);
    setStudiedSinceBreak(0);
    setIsRunning(true);
    setIsPaused(false);
    setIsConfigured(true);
    setSessionStartTime(new Date());
    updateStudyingStatus(true);
    toast({ title: "Target Study Started! 🎯", description: `Target: ${formatTime(totalSeconds)}` });
  };

  const handlePause = () => {
    setIsPaused(true);
    toast({ title: "Paused ⏸️" });
  };

  const handleResume = () => {
    setIsPaused(false);
    toast({ title: "Resumed ▶️" });
  };

  const handleManualBreak = () => {
    setIsBreak(true);
    setIsPaused(false);
    // Store remaining study time, show break timer
    setTimeLeft(autoBreakDuration * 60 || 5 * 60);
    setStudiedSinceBreak(0);
    toast({ title: "Break Time! ☕", description: "Take a short break." });
  };

  const handleTargetComplete = () => {
    setIsRunning(false);
    if (sessionStartTime && totalStudied > 0) {
      const record: StudyRecord = {
        id: generateRecordId(),
        type: 'target-study',
        subject: currentSubject,
        startTime: sessionStartTime,
        endTime: new Date(),
        duration: totalStudied,
        date: formatDate(sessionStartTime),
      };
      storageUtils.saveStudyRecord(record);
      if (user) syncStudyTime(totalStudied);
    }
    updateStudyingStatus(false);
    toast({ title: "Target Complete! 🎉", description: `You studied for ${formatTime(totalStudied)}!` });
    setIsConfigured(false);
    setTotalStudied(0);
  };

  const handleStop = () => {
    setIsRunning(false);
    setIsBreak(false);
    if (sessionStartTime && totalStudied > 10) {
      const record: StudyRecord = {
        id: generateRecordId(),
        type: 'target-study',
        subject: currentSubject,
        startTime: sessionStartTime,
        endTime: new Date(),
        duration: totalStudied,
        date: formatDate(sessionStartTime),
      };
      storageUtils.saveStudyRecord(record);
      if (user) syncStudyTime(totalStudied);
    }
    updateStudyingStatus(false);
    setIsConfigured(false);
    setTotalStudied(0);
    setTimeLeft(0);
    toast({ title: "Target Study Stopped", description: totalStudied > 10 ? `Studied: ${formatTime(totalStudied)}` : "Session too short to save." });
  };

  const totalTarget = (targetHours * 3600) + (targetMinutes * 60);
  const progress = totalTarget > 0 ? Math.min((totalStudied / totalTarget) * 100, 100) : 0;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <TimerButton variant="secondary" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </TimerButton>
          <div>
            <h1 className="text-2xl font-bold text-primary">Target Study</h1>
            <p className="text-muted-foreground text-sm">Set a goal and study</p>
          </div>
        </div>

        {!isConfigured ? (
          <>
            {/* Configuration */}
            <Card className="gradient-card p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Set Your Target</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Hours</Label>
                  <Input type="number" min={0} max={12} value={targetHours} onChange={e => setTargetHours(Number(e.target.value))} />
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Minutes</Label>
                  <Input type="number" min={0} max={59} value={targetMinutes} onChange={e => setTargetMinutes(Number(e.target.value))} />
                </div>
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">Subject</Label>
                <Select value={currentSubject} onValueChange={setCurrentSubject}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    <SelectItem value="physics">Physics</SelectItem>
                    <SelectItem value="chemistry">Chemistry</SelectItem>
                    <SelectItem value="maths">Mathematics</SelectItem>
                    <SelectItem value="computer-science">Computer Science</SelectItem>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="hindi">Hindi</SelectItem>
                    <SelectItem value="social-studies">Social Studies</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>

            {/* Break Settings */}
            <Card className="gradient-secondary p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coffee className="w-4 h-4 text-muted-foreground" />
                  <Label>Auto Breaks</Label>
                </div>
                <Switch checked={autoBreakEnabled} onCheckedChange={setAutoBreakEnabled} />
              </div>
              {autoBreakEnabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Study interval (min)</Label>
                    <Input type="number" min={5} max={120} value={autoBreakInterval} onChange={e => setAutoBreakInterval(Number(e.target.value))} />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Break duration (min)</Label>
                    <Input type="number" min={1} max={30} value={autoBreakDuration} onChange={e => setAutoBreakDuration(Number(e.target.value))} />
                  </div>
                </div>
              )}
            </Card>

            <TimerButton variant="start" size="lg" onClick={handleStart} className="w-full">
              <Play className="w-5 h-5 mr-2" />
              Start Target Study
            </TimerButton>
          </>
        ) : (
          <>
            {/* Active Timer */}
            <Card className={`p-6 text-center ${isBreak ? 'bg-accent/20 border-accent/30' : 'gradient-card card-glow'}`}>
              <div className="space-y-4">
                <span className="text-lg font-semibold text-foreground">
                  {isBreak ? '☕ Break' : '📚 Studying'}
                </span>
                <div className={`text-6xl font-mono ${isRunning && !isPaused ? (isBreak ? 'text-accent-foreground' : 'text-timer-active timer-glow') : 'text-foreground'}`}>
                  {formatTime(timeLeft)}
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-sm text-muted-foreground">
                  Studied: {formatTime(totalStudied)} / Target: {formatTime(totalTarget)}
                </p>
              </div>
            </Card>

            {/* Controls */}
            <div className="flex gap-3">
              {isRunning && !isPaused && !isBreak && (
                <>
                  <TimerButton variant="secondary" size="lg" onClick={handlePause} className="flex-1">
                    <Pause className="w-5 h-5 mr-2" /> Pause
                  </TimerButton>
                  <TimerButton variant="secondary" size="lg" onClick={handleManualBreak} className="flex-1">
                    <Coffee className="w-5 h-5 mr-2" /> Break
                  </TimerButton>
                </>
              )}
              {isPaused && (
                <TimerButton variant="start" size="lg" onClick={handleResume} className="flex-1">
                  <Play className="w-5 h-5 mr-2" /> Resume
                </TimerButton>
              )}
              <TimerButton variant="stop" size="lg" onClick={handleStop} className="flex-1">
                <Square className="w-5 h-5 mr-2" /> Stop
              </TimerButton>
            </div>
          </>
        )}

        <div className="text-center pt-4">
          <p className="text-xs text-muted-foreground">
            Made by{' '}
            <button onClick={() => window.open('https://www.instagram.com/programmer_deepak/', '_blank')} className="text-primary hover:underline cursor-pointer">
              programmer_deepak
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TargetStudyTimer;
