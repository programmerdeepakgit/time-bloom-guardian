import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { TimerButton } from '@/components/ui/timer-button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Check, Trash2, Calendar, ClipboardList, X, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GroupAssignmentsProps {
  groupId: string;
  groupName: string;
  members: Array<{ user_id: string; username: string }>;
}

interface AssignmentRow {
  id: string;
  group_id: string;
  created_by: string;
  creator_name: string | null;
  subject: string;
  task: string;
  due_date: string | null;
  created_at: string;
}

interface Completion {
  assignment_id: string;
  user_id: string;
}

const GroupAssignments: React.FC<GroupAssignmentsProps> = ({ groupId, groupName, members }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [subject, setSubject] = useState('');
  const [task, setTask] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    load();
  }, [groupId]);

  const load = async () => {
    setLoading(true);
    try {
      const { data: aData, error: aErr } = await supabase
        .from('group_assignments')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });
      if (aErr) throw aErr;
      setAssignments(aData || []);

      const ids = (aData || []).map(a => a.id);
      if (ids.length > 0) {
        const { data: cData } = await supabase
          .from('group_assignment_completions')
          .select('assignment_id, user_id')
          .in('assignment_id', ids);
        setCompletions(cData || []);
      } else {
        setCompletions([]);
      }
    } catch (e) {
      console.error('Load assignments error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!user || !subject.trim() || !task.trim()) return;
    setSubmitting(true);
    try {
      const me = members.find(m => m.user_id === user.id);
      const myName = me?.username || 'Someone';

      const { data: inserted, error } = await supabase
        .from('group_assignments')
        .insert({
          group_id: groupId,
          created_by: user.id,
          creator_name: myName,
          subject: subject.trim(),
          task: task.trim(),
          due_date: dueDate || null,
        })
        .select()
        .single();
      if (error) throw error;

      // Notify all other group members
      const others = members.filter(m => m.user_id !== user.id);
      if (others.length > 0) {
        const dueText = dueDate ? ` (due ${dueDate})` : '';
        const notifs = others.map(m => ({
          user_id: m.user_id,
          type: 'assignment',
          from_user_id: user.id,
          group_id: groupId,
          message: `${myName} added an assignment in "${groupName}": ${subject.trim()}${dueText}`,
          data: { assignment_id: inserted?.id },
        }));
        await supabase.from('notifications').insert(notifs);
      }

      toast({ title: 'Assignment added! 📝', description: 'All members notified.' });
      setSubject('');
      setTask('');
      setDueDate('');
      setShowAdd(false);
      load();
    } catch (e: any) {
      console.error('Add assignment error:', e);
      toast({ title: 'Failed to add', description: e.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const isCompletedByMe = (id: string) =>
    !!user && completions.some(c => c.assignment_id === id && c.user_id === user.id);

  const completedCount = (id: string) =>
    completions.filter(c => c.assignment_id === id).length;

  const toggleComplete = async (a: AssignmentRow) => {
    if (!user) return;
    try {
      if (isCompletedByMe(a.id)) {
        await supabase
          .from('group_assignment_completions')
          .delete()
          .eq('assignment_id', a.id)
          .eq('user_id', user.id);
        setCompletions(prev => prev.filter(c => !(c.assignment_id === a.id && c.user_id === user.id)));
      } else {
        const { error } = await supabase
          .from('group_assignment_completions')
          .insert({ assignment_id: a.id, user_id: user.id });
        if (error) throw error;
        setCompletions(prev => [...prev, { assignment_id: a.id, user_id: user.id }]);
      }
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (a: AssignmentRow) => {
    if (!confirm('Delete this assignment for everyone?')) return;
    try {
      const { error } = await supabase.from('group_assignments').delete().eq('id', a.id);
      if (error) throw error;
      setAssignments(prev => prev.filter(x => x.id !== a.id));
      toast({ title: 'Assignment deleted' });
    } catch (e: any) {
      toast({ title: 'Failed to delete', description: e.message, variant: 'destructive' });
    }
  };

  const isOverdue = (a: AssignmentRow) =>
    a.due_date && !isCompletedByMe(a.id) &&
    new Date(a.due_date) < new Date(new Date().toISOString().split('T')[0]);

  return (
    <Card className="gradient-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <ClipboardList className="w-4 h-4" /> Group Assignments
          <span className="text-xs text-muted-foreground">({assignments.length})</span>
        </h3>
        <TimerButton variant="start" size="sm" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </TimerButton>
      </div>

      {showAdd && (
        <div className="space-y-2 p-3 bg-secondary/30 rounded-lg">
          <Input
            placeholder="Subject (e.g. Physics)"
            value={subject}
            onChange={e => setSubject(e.target.value)}
          />
          <Textarea
            placeholder="Assignment / task description..."
            value={task}
            onChange={e => setTask(e.target.value)}
            rows={2}
          />
          <div>
            <label className="text-xs text-muted-foreground">Due Date (optional)</label>
            <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>
          <TimerButton
            variant="start"
            onClick={handleAdd}
            disabled={!subject.trim() || !task.trim() || submitting}
            className="w-full"
          >
            {submitting ? 'Posting...' : 'Post to Group'}
          </TimerButton>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
      ) : assignments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No assignments yet. Add one to share with the group!
        </p>
      ) : (
        <div className="space-y-2">
          {assignments.map(a => {
            const done = isCompletedByMe(a.id);
            const totalDone = completedCount(a.id);
            const canDelete = a.created_by === user?.id;
            return (
              <div
                key={a.id}
                className={`p-3 rounded-lg border transition-all ${
                  isOverdue(a) ? 'border-destructive/50 bg-destructive/5' : 'border-border bg-secondary/20'
                } ${done ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start gap-2">
                  <button
                    onClick={() => toggleComplete(a)}
                    className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      done
                        ? 'bg-success border-success text-success-foreground'
                        : 'border-muted-foreground hover:border-primary'
                    }`}
                  >
                    {done && <Check className="w-3 h-3" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-medium bg-primary/20 text-primary px-2 py-0.5 rounded">
                        {a.subject}
                      </span>
                      {isOverdue(a) && (
                        <span className="text-xs font-medium bg-destructive/20 text-destructive px-2 py-0.5 rounded">
                          Overdue
                        </span>
                      )}
                    </div>
                    <p className={`text-sm ${done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {a.task}
                    </p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                      <span>by @{a.creator_name || 'unknown'}</span>
                      {a.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {a.due_date}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {totalDone}/{members.length} done
                      </span>
                    </div>
                  </div>
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(a)}
                      className="p-1 text-muted-foreground hover:text-destructive flex-shrink-0"
                      title="Delete (creator only)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default GroupAssignments;
