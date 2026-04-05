import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { TimerButton } from '@/components/ui/timer-button';
import { Input } from '@/components/ui/input';
import { storageUtils } from '@/utils/storage';
import { formatTime, formatDateTime } from '@/utils/timer';
import { StudyRecord } from '@/types';
import { ArrowLeft, BookOpen, Clock, Calendar, Filter, Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface StudyRecordsProps {
  onBack: () => void;
}

const StudyRecords: React.FC<StudyRecordsProps> = ({ onBack }) => {
  const allRecords = storageUtils.getStudyRecords();
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  const filteredRecords = useMemo(() => {
    let records = [...allRecords];
    if (modeFilter !== 'all') {
      records = records.filter(r => r.type === modeFilter);
    }
    if (subjectFilter !== 'all') {
      records = records.filter(r => r.subject === subjectFilter);
    }
    if (dateFilter) {
      records = records.filter(r => r.date === dateFilter);
    }
    return records.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }, [allRecords, modeFilter, subjectFilter, dateFilter]);

  const getSubjectIcon = (subject: string) => {
    const icons: Record<string, string> = {
      physics: '⚛️', chemistry: '🧪', maths: '📐', 'computer-science': '💻',
      english: '📝', hindi: '🔤', 'social-studies': '🌍', mixed: '📚', all: '📚',
    };
    return icons[subject] || '📚';
  };

  const getModeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'self-study': 'Self Study',
      'lecture-study': 'Lecture Study',
      pomodoro: 'Pomodoro',
      'target-study': 'Target Study',
    };
    return labels[type] || type;
  };

  const getModeColor = (type: string) => {
    const colors: Record<string, string> = {
      'self-study': 'bg-success/20 text-success',
      'lecture-study': 'bg-primary/20 text-primary',
      pomodoro: 'bg-orange-500/20 text-orange-500',
      'target-study': 'bg-purple-500/20 text-purple-500',
    };
    return colors[type] || 'bg-muted text-muted-foreground';
  };

  const totalTime = filteredRecords.reduce((sum, r) => sum + r.duration, 0);
  const uniqueSubjects = [...new Set(allRecords.map(r => r.subject))];
  const uniqueDates = [...new Set(allRecords.map(r => r.date))].sort().reverse();

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <TimerButton variant="secondary" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </TimerButton>
          <div>
            <h1 className="text-2xl font-bold text-primary">Study Records</h1>
            <p className="text-muted-foreground">
              {filteredRecords.length} sessions • Total: {formatTime(totalTime)}
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card className="gradient-secondary p-4 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Filters</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Mode</label>
              <Select value={modeFilter} onValueChange={setModeFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modes</SelectItem>
                  <SelectItem value="self-study">Self Study</SelectItem>
                  <SelectItem value="lecture-study">Lecture Study</SelectItem>
                  <SelectItem value="pomodoro">Pomodoro</SelectItem>
                  <SelectItem value="target-study">Target Study</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Subject</label>
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {uniqueSubjects.map(s => (
                    <SelectItem key={s} value={s}>{getSubjectIcon(s)} {s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Date</label>
              <Select value={dateFilter || 'all'} onValueChange={v => setDateFilter(v === 'all' ? '' : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  {uniqueDates.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="gradient-secondary p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sessions</p>
                <p className="text-xl font-bold text-foreground">{filteredRecords.length}</p>
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
                <p className="text-xl font-bold text-foreground">{formatTime(totalTime)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Records List */}
        <div className="space-y-3">
          {filteredRecords.length === 0 ? (
            <Card className="gradient-card p-8 text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto">
                  <BookOpen className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No records found</h3>
                  <p className="text-muted-foreground">
                    {allRecords.length === 0
                      ? 'Start a study session to see records here.'
                      : 'Try adjusting your filters.'}
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            filteredRecords.map((record) => (
              <Card key={record.id} className="gradient-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{getSubjectIcon(record.subject)}</div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground capitalize">{record.subject}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getModeColor(record.type)}`}>
                          {getModeLabel(record.type)}
                        </span>
                        <span className="text-sm font-mono text-primary">
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

        <div className="text-center pt-4">
          <p className="text-xs text-muted-foreground">Made by programmer_deepak</p>
        </div>
      </div>
    </div>
  );
};

export default StudyRecords;
