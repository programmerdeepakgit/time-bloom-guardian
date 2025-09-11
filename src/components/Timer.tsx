import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { TimerButton } from '@/components/ui/timer-button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatTime, generateRecordId, formatDate, calculateDuration } from '@/utils/timer';
import { storageUtils } from '@/utils/storage';
import { StudyRecord, TimerState } from '@/types';
import { Play, Pause, Square, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TimerProps {
  studyType: 'self-study' | 'lecture-study';
  onBack: () => void;
}

const Timer: React.FC<TimerProps> = ({ studyType, onBack }) => {
  const { toast } = useToast();
  const [timerState, setTimerState] = useState<TimerState>({
    isRunning: false,
    startTime: null,
    elapsedTime: 0,
    currentSubject: 'all',
  });
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timerState.isRunning) {
      intervalRef.current = setInterval(() => {
        setTimerState(prev => ({
          ...prev,
          elapsedTime: prev.startTime 
            ? Math.floor((Date.now() - prev.startTime.getTime()) / 1000)
            : prev.elapsedTime + 1
        }));
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerState.isRunning]);

  const handleStart = () => {
    const now = new Date();
    setTimerState(prev => ({
      ...prev,
      isRunning: true,
      startTime: now,
    }));
    
    toast({
      title: "Timer Started",
      description: `${studyType === 'self-study' ? 'Self Study' : 'Lecture Study'} timer is now running`,
    });
  };

  const handleStop = () => {
    if (!timerState.startTime) return;

    const endTime = new Date();
    const duration = calculateDuration(timerState.startTime, endTime);

    const record: StudyRecord = {
      id: generateRecordId(),
      type: studyType,
      subject: timerState.currentSubject,
      startTime: timerState.startTime,
      endTime,
      duration,
      date: formatDate(timerState.startTime),
    };

    storageUtils.saveStudyRecord(record);

    setTimerState({
      isRunning: false,
      startTime: null,
      elapsedTime: 0,
      currentSubject: timerState.currentSubject,
    });

    toast({
      title: "Study Session Completed!",
      description: `Duration: ${formatTime(duration)} | Subject: ${timerState.currentSubject}`,
    });
  };

  const handleSubjectChange = (subject: string) => {
    setTimerState(prev => ({
      ...prev,
      currentSubject: subject,
    }));
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-primary">
            {studyType === 'self-study' ? 'Self Study' : 'Lecture Study'} Timer
          </h1>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>JEE TIMER</span>
          </div>
        </div>

        {/* Timer Display */}
        <Card className="gradient-card card-glow p-8">
          <div className="text-center space-y-6">
            <div className={`timer-display text-6xl font-mono ${
              timerState.isRunning ? 'text-timer-active timer-glow' : 'text-foreground'
            }`}>
              {formatTime(timerState.elapsedTime)}
            </div>
            
            {timerState.isRunning && (
              <div className="flex items-center justify-center gap-2 text-timer-active">
                <div className="w-2 h-2 bg-timer-active rounded-full animate-pulse" />
                <span className="text-sm font-medium">Recording...</span>
              </div>
            )}
          </div>
        </Card>

        {/* Subject Selection */}
        <Card className="gradient-secondary p-4">
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">
              Select Subject:
            </label>
            <Select
              value={timerState.currentSubject}
              onValueChange={handleSubjectChange}
              disabled={timerState.isRunning}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
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

        {/* Timer Controls */}
        <div className="flex gap-4">
          {!timerState.isRunning ? (
            <TimerButton
              variant="start"
              size="lg"
              onClick={handleStart}
              className="flex-1"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Timer
            </TimerButton>
          ) : (
            <TimerButton
              variant="stop"
              size="lg"
              onClick={handleStop}
              className="flex-1"
            >
              <Square className="w-5 h-5 mr-2" />
              Stop Timer
            </TimerButton>
          )}
        </div>

        {/* Back Button */}
        <TimerButton
          variant="secondary"
          onClick={onBack}
          className="w-full"
        >
          Back to Home
        </TimerButton>

        {/* Footer */}
        <div className="text-center pt-4">
          <p className="text-xs text-muted-foreground">
            Made by{' '}
            <button
              onClick={() => window.open('https://www.instagram.com/programmer_deepak/', '_blank')}
              className="text-primary hover:underline cursor-pointer"
            >
              programmer_deepak
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Timer;