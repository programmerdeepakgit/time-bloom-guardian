import React from 'react';
import { Card } from '@/components/ui/card';
import { TimerButton } from '@/components/ui/timer-button';
import { storageUtils } from '@/utils/storage';
import { formatTime } from '@/utils/timer';
import { ArrowLeft, BarChart3, BookOpen } from 'lucide-react';

interface SubjectStatsProps {
  onBack: () => void;
}

const SubjectStats: React.FC<SubjectStatsProps> = ({ onBack }) => {
  const allRecords = storageUtils.getStudyRecords();

  const subjectData = allRecords.reduce((acc, record) => {
    const subject = record.subject || 'all';
    if (!acc[subject]) {
      acc[subject] = { totalTime: 0, sessions: 0, byType: {} as Record<string, number> };
    }
    acc[subject].totalTime += record.duration;
    acc[subject].sessions += 1;
    const type = record.type || 'self-study';
    acc[subject].byType[type] = (acc[subject].byType[type] || 0) + record.duration;
    return acc;
  }, {} as Record<string, { totalTime: number; sessions: number; byType: Record<string, number> }>);

  const sortedSubjects = Object.entries(subjectData).sort(([, a], [, b]) => b.totalTime - a.totalTime);
  const totalTime = sortedSubjects.reduce((sum, [, data]) => sum + data.totalTime, 0);

  const getSubjectLabel = (key: string) => {
    const labels: Record<string, string> = {
      all: 'All Subjects',
      physics: 'Physics',
      chemistry: 'Chemistry',
      maths: 'Mathematics',
      'computer-science': 'Computer Science',
      english: 'English',
      hindi: 'Hindi',
      'social-studies': 'Social Studies',
      mixed: 'Mixed',
    };
    return labels[key] || key.charAt(0).toUpperCase() + key.slice(1);
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'self-study': 'Self Study',
      'lecture-study': 'Lecture Study',
      'pomodoro': 'Pomodoro',
      'target-study': 'Target Study',
    };
    return labels[type] || type;
  };

  const getBarColor = (index: number) => {
    const colors = ['bg-primary', 'bg-success', 'bg-accent-foreground', 'bg-secondary-foreground'];
    return colors[index % colors.length];
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <TimerButton variant="secondary" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </TimerButton>
          <div>
            <h1 className="text-2xl font-bold text-primary">Subject Study Time</h1>
            <p className="text-muted-foreground text-sm">See how much you studied each subject</p>
          </div>
        </div>

        {/* Total */}
        <Card className="gradient-card p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Total Study Time</h2>
          </div>
          <p className="text-3xl font-mono font-bold text-primary">{formatTime(totalTime)}</p>
          <p className="text-sm text-muted-foreground mt-1">{allRecords.length} total sessions</p>
        </Card>

        {sortedSubjects.length === 0 ? (
          <Card className="gradient-secondary p-8 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No study sessions yet. Start studying to see your stats!</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {sortedSubjects.map(([subject, data], index) => {
              const percentage = totalTime > 0 ? Math.round((data.totalTime / totalTime) * 100) : 0;
              return (
                <Card key={subject} className="gradient-secondary p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">{getSubjectLabel(subject)}</h3>
                      <div className="text-right">
                        <span className="text-lg font-mono font-bold text-primary">{formatTime(data.totalTime)}</span>
                        <span className="text-xs text-muted-foreground ml-2">({percentage}%)</span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className={`h-2 rounded-full ${getBarColor(index)} transition-all`} style={{ width: `${percentage}%` }} />
                    </div>
                    {/* Breakdown by type */}
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(data.byType).map(([type, time]) => (
                        <span key={type} className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">
                          {getTypeLabel(type)}: {formatTime(time)}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">{data.sessions} sessions</p>
                  </div>
                </Card>
              );
            })}
          </div>
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

export default SubjectStats;
