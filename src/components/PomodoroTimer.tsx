import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { TimerButton } from '@/components/ui/timer-button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatTime, generateRecordId, formatDate } from '@/utils/timer';
import { storageUtils } from '@/utils/storage';
import { StudyRecord } from '@/types';
import { Play, Square, Clock, Coffee, BookOpen, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface PomodoroTimerProps {
  onBack: () => void;
}

const STUDY_DURATION = 25 * 60; // 25 minutes
const BREAK_DURATION = 5 * 60; // 5 minutes

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ onBack }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [timeLeft, setTimeLeft] = useState(STUDY_DURATION);
  const [currentSubject, setCurrentSubject] = useState('all');
  const [sessionCount, setSessionCount] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            handlePhaseComplete();
            return 0;
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
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, isBreak]);

  // Update studying status in DB
  const updateStudyingStatus = async (studying: boolean) => {
    if (!user) return;
    await supabase
      .from('users')
      .update({ 
        is_studying: studying, 
        currently_studying_subject: studying ? currentSubject : null 
      })
      .eq('auth_user_id', user.id);
  };

  const handlePhaseComplete = () => {
    setIsRunning(false);
    if (!isBreak && sessionStartTime) {
      // Study phase completed - save record
      const endTime = new Date();
      const record: StudyRecord = {
        id: generateRecordId(),
        type: 'pomodoro',
        subject: currentSubject,
        startTime: sessionStartTime,
        endTime,
        duration: STUDY_DURATION,
        date: formatDate(sessionStartTime),
      };
      storageUtils.saveStudyRecord(record);
      setSessionCount(prev => prev + 1);

      // Auto-sync
      if (user) {
        syncStudyTime(STUDY_DURATION);
      }

      updateStudyingStatus(false);

      toast({
        title: "Study Phase Complete! 🎉",
        description: "Time for a 5-minute break!",
      });
      setIsBreak(true);
      setTimeLeft(BREAK_DURATION);
    } else {
      // Break completed
      toast({
        title: "Break Over! 📚",
        description: "Ready for another 25-minute study session?",
      });
      setIsBreak(false);
      setTimeLeft(STUDY_DURATION);
    }
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
    setIsRunning(true);
    if (!isBreak) {
      setSessionStartTime(new Date());
      updateStudyingStatus(true);
    }
    toast({
      title: isBreak ? "Break Started ☕" : "Study Session Started 📚",
      description: isBreak ? "Relax for 5 minutes" : "Focus for 25 minutes",
    });
  };

  const handleStop = () => {
    setIsRunning(false);
    if (!isBreak && sessionStartTime) {
      const elapsed = STUDY_DURATION - timeLeft;
      if (elapsed > 10) {
        const endTime = new Date();
        const record: StudyRecord = {
          id: generateRecordId(),
          type: 'pomodoro',
          subject: currentSubject,
          startTime: sessionStartTime,
          endTime,
          duration: elapsed,
          date: formatDate(sessionStartTime),
        };
        storageUtils.saveStudyRecord(record);
        if (user) syncStudyTime(elapsed);
      }
      updateStudyingStatus(false);
    }
    setIsBreak(false);
    setTimeLeft(STUDY_DURATION);
    setSessionStartTime(null);
    toast({ title: "Pomodoro Stopped", description: "Session ended." });
  };

  const progress = isBreak 
    ? ((BREAK_DURATION - timeLeft) / BREAK_DURATION) * 100
    : ((STUDY_DURATION - timeLeft) / STUDY_DURATION) * 100;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <TimerButton variant="secondary" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </TimerButton>
          <div>
            <h1 className="text-2xl font-bold text-primary">Pomodoro Timer</h1>
            <p className="text-muted-foreground text-sm">25 min study • 5 min break</p>
          </div>
        </div>

        {/* Status */}
        <Card className={`p-6 text-center ${isBreak ? 'bg-accent/20 border-accent/30' : 'gradient-card card-glow'}`}>
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              {isBreak ? <Coffee className="w-6 h-6 text-accent-foreground" /> : <BookOpen className="w-6 h-6 text-primary" />}
              <span className="text-lg font-semibold text-foreground">
                {isBreak ? 'Break Time' : 'Study Time'}
              </span>
            </div>
            <div className={`text-6xl font-mono ${isRunning ? (isBreak ? 'text-accent-foreground' : 'text-timer-active timer-glow') : 'text-foreground'}`}>
              {formatTime(timeLeft)}
            </div>
            {/* Progress bar */}
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${isBreak ? 'bg-accent-foreground' : 'bg-primary'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            {isRunning && (
              <div className="flex items-center justify-center gap-2 text-timer-active">
                <div className="w-2 h-2 bg-timer-active rounded-full animate-pulse" />
                <span className="text-sm">{isBreak ? 'Resting...' : 'Focusing...'}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Sessions counter */}
        <Card className="gradient-secondary p-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Sessions Completed</span>
            <span className="text-2xl font-bold text-primary">{sessionCount}</span>
          </div>
        </Card>

        {/* Subject Selection */}
        <Card className="gradient-secondary p-4">
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Select Subject:</label>
            <Select value={currentSubject} onValueChange={setCurrentSubject} disabled={isRunning}>
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

        {/* Controls */}
        <div className="flex gap-4">
          {!isRunning ? (
            <TimerButton variant="start" size="lg" onClick={handleStart} className="flex-1">
              <Play className="w-5 h-5 mr-2" />
              {isBreak ? 'Start Break' : 'Start Study'}
            </TimerButton>
          ) : (
            <TimerButton variant="stop" size="lg" onClick={handleStop} className="flex-1">
              <Square className="w-5 h-5 mr-2" />
              Stop
            </TimerButton>
          )}
        </div>

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

export default PomodoroTimer;
