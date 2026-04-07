import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { TimerButton } from '@/components/ui/timer-button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus, Check, Trash2, Calendar, BookOpen, Filter } from 'lucide-react';

interface Assignment {
  id: string;
  subject: string;
  task: string;
  createdDate: string;
  dueDate: string;
  completed: boolean;
}

interface AssignmentsProps {
  onBack: () => void;
}

const STORAGE_KEY = 'jee_timer_assignments';

const loadAssignments = (): Assignment[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
};

const saveAssignments = (assignments: Assignment[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
};

const Assignments: React.FC<AssignmentsProps> = ({ onBack }) => {
  const [assignments, setAssignments] = useState<Assignment[]>(loadAssignments);
  const [showAdd, setShowAdd] = useState(false);
  const [subject, setSubject] = useState('');
  const [task, setTask] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [subjectFilter, setSubjectFilter] = useState('all');

  useEffect(() => { saveAssignments(assignments); }, [assignments]);

  const addAssignment = () => {
    if (!subject.trim() || !task.trim()) return;
    const newAssignment: Assignment = {
      id: Date.now().toString(),
      subject: subject.trim(),
      task: task.trim(),
      createdDate: new Date().toISOString().split('T')[0],
      dueDate: dueDate || '',
      completed: false,
    };
    setAssignments(prev => [newAssignment, ...prev]);
    setSubject('');
    setTask('');
    setDueDate('');
    setShowAdd(false);
  };

  const toggleComplete = (id: string) => {
    setAssignments(prev => prev.map(a => a.id === id ? { ...a, completed: !a.completed } : a));
  };

  const deleteAssignment = (id: string) => {
    setAssignments(prev => prev.filter(a => a.id !== id));
  };

  const subjects = [...new Set(assignments.map(a => a.subject))];

  const filtered = assignments.filter(a => {
    if (filter === 'pending' && a.completed) return false;
    if (filter === 'completed' && !a.completed) return false;
    if (subjectFilter !== 'all' && a.subject !== subjectFilter) return false;
    return true;
  });

  const isOverdue = (a: Assignment) => {
    if (!a.dueDate || a.completed) return false;
    return new Date(a.dueDate) < new Date(new Date().toISOString().split('T')[0]);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <TimerButton variant="secondary" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </TimerButton>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
              <BookOpen className="w-6 h-6" /> Assignments
            </h1>
            <p className="text-sm text-muted-foreground">
              {assignments.filter(a => !a.completed).length} pending · {assignments.filter(a => a.completed).length} done
            </p>
          </div>
          <TimerButton variant="start" size="sm" onClick={() => setShowAdd(!showAdd)}>
            <Plus className="w-4 h-4" />
          </TimerButton>
        </div>

        {/* Add Form */}
        {showAdd && (
          <Card className="gradient-card p-4 space-y-3">
            <h3 className="font-semibold text-foreground">New Assignment</h3>
            <Input
              placeholder="Subject (e.g. Physics, Math)"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
            <Textarea
              placeholder="Task description..."
              value={task}
              onChange={(e) => setTask(e.target.value)}
              rows={3}
            />
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Due Date (optional)</label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <TimerButton variant="start" onClick={addAssignment} disabled={!subject.trim() || !task.trim()} className="flex-1">
                Add Assignment
              </TimerButton>
              <TimerButton variant="secondary" onClick={() => setShowAdd(false)}>
                Cancel
              </TimerButton>
            </div>
          </Card>
        )}

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <div className="flex gap-1">
            {(['all', 'pending', 'completed'] as const).map(f => (
              <TimerButton
                key={f}
                variant={filter === f ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </TimerButton>
            ))}
          </div>
          {subjects.length > 1 && (
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="text-sm bg-secondary text-foreground border border-border rounded px-2 py-1"
            >
              <option value="all">All Subjects</option>
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
        </div>

        {/* Assignment List */}
        {filtered.length === 0 ? (
          <Card className="gradient-card p-8 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No assignments found</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map(a => (
              <Card
                key={a.id}
                className={`p-4 transition-all ${a.completed ? 'opacity-60' : ''} ${isOverdue(a) ? 'border-destructive/50' : 'gradient-card'}`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleComplete(a.id)}
                    className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                      a.completed
                        ? 'bg-success border-success text-success-foreground'
                        : 'border-muted-foreground hover:border-primary'
                    }`}
                  >
                    {a.completed && <Check className="w-3 h-3" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium bg-primary/20 text-primary px-2 py-0.5 rounded">
                        {a.subject}
                      </span>
                      {isOverdue(a) && (
                        <span className="text-xs font-medium bg-destructive/20 text-destructive px-2 py-0.5 rounded">
                          Overdue
                        </span>
                      )}
                    </div>
                    <p className={`text-sm ${a.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {a.task}
                    </p>
                    <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                      <span>Added: {a.createdDate}</span>
                      {a.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Due: {a.dueDate}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteAssignment(a.id)}
                    className="p-1 text-muted-foreground hover:text-destructive flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Assignments;
