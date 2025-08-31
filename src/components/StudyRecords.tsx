import React from 'react';
import { Card } from '@/components/ui/card';
import { TimerButton } from '@/components/ui/timer-button';
import { storageUtils } from '@/utils/storage';
import { formatTime, formatDateTime } from '@/utils/timer';
import { StudyRecord } from '@/types';
import { ArrowLeft, BookOpen, Clock, Calendar } from 'lucide-react';

interface StudyRecordsProps {
  studyType: 'self-study' | 'lecture-study';
  onBack: () => void;
}

const StudyRecords: React.FC<StudyRecordsProps> = ({ studyType, onBack }) => {
  const records = storageUtils.getRecordsByType(studyType);

  const getSubjectIcon = (subject: string) => {
    const icons = {
      physics: '⚛️',
      chemistry: '🧪',
      maths: '📐',
      mixed: '📚',
    };
    return icons[subject as keyof typeof icons] || '📚';
  };

  const getTotalStudyTime = () => {
    return records.reduce((total, record) => total + record.duration, 0);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <TimerButton
            variant="secondary"
            size="sm"
            onClick={onBack}
          >
            <ArrowLeft className="w-4 h-4" />
          </TimerButton>
          <div>
            <h1 className="text-2xl font-bold text-primary">
              {studyType === 'self-study' ? 'Self Study' : 'Lecture Study'} Records
            </h1>
            <p className="text-muted-foreground">
              {records.length} sessions • Total: {formatTime(getTotalStudyTime())}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="gradient-secondary p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Sessions</p>
                <p className="text-xl font-bold text-foreground">{records.length}</p>
              </div>
            </div>
          </Card>
          
          <Card className="gradient-secondary p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-success/20 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Time</p>
                <p className="text-xl font-bold text-foreground">{formatTime(getTotalStudyTime())}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Records List */}
        <div className="space-y-3">
          {records.length === 0 ? (
            <Card className="gradient-card p-8 text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto">
                  <BookOpen className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No study records yet
                  </h3>
                  <p className="text-muted-foreground">
                    Start your first {studyType === 'self-study' ? 'self study' : 'lecture study'} session to see records here.
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            records.map((record) => (
              <Card key={record.id} className="gradient-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{getSubjectIcon(record.subject)}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground capitalize">
                          {record.subject}
                        </h3>
                        <span className="text-sm text-muted-foreground">•</span>
                        <span className="text-sm font-mono text-timer-active">
                          {formatTime(record.duration)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{record.date}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {formatDateTime(record.startTime).split(', ')[1]} - {formatDateTime(record.endTime).split(', ')[1]}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="text-center pt-4">
          <p className="text-xs text-muted-foreground">
            Made by programmer_deepak
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudyRecords;