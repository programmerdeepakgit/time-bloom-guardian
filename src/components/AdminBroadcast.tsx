import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { TimerButton } from '@/components/ui/timer-button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Send, Users, User, Megaphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AdminBroadcastProps {
  onBack: () => void;
}

const AdminBroadcast: React.FC<AdminBroadcastProps> = ({ onBack }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<'all' | 'single'>('all');
  const [targetUsername, setTargetUsername] = useState('');
  const [heading, setHeading] = useState('');
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);

  const sendToAll = async () => {
    if (!user || !heading.trim()) return;
    setSending(true);
    try {
      // Get all users except self
      const { data: allUsers, error: usersError } = await supabase
        .from('users')
        .select('auth_user_id')
        .not('auth_user_id', 'is', null)
        .neq('auth_user_id', user.id);

      if (usersError) throw usersError;
      if (!allUsers || allUsers.length === 0) {
        toast({ title: 'No users found', variant: 'destructive' });
        setSending(false);
        return;
      }

      const notifications = allUsers.map((u) => ({
        user_id: u.auth_user_id!,
        type: 'announcement',
        from_user_id: user.id,
        message: `📢 ${heading}${description ? ': ' + description : ''}`,
        data: { heading, description },
      }));

      const { error } = await supabase.from('notifications').insert(notifications);
      if (error) throw error;

      toast({ title: `Sent to ${allUsers.length} users! 🎉` });
      setHeading('');
      setDescription('');
    } catch (error: any) {
      console.error(error);
      toast({ title: 'Failed to send', description: error.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const sendToUser = async () => {
    if (!user || !heading.trim() || !targetUsername.trim()) return;
    setSending(true);
    try {
      const { data: found, error: findError } = await supabase.rpc('find_user_by_username', {
        _username: targetUsername.trim(),
      });

      if (findError) throw findError;
      if (!found || found.length === 0) {
        toast({ title: 'User not found', description: `No user with username "${targetUsername}"`, variant: 'destructive' });
        setSending(false);
        return;
      }

      const targetUser = found[0];

      const { error } = await supabase.from('notifications').insert({
        user_id: targetUser.auth_user_id,
        type: 'announcement',
        from_user_id: user.id,
        message: `📢 ${heading}${description ? ': ' + description : ''}`,
        data: { heading, description },
      });
      if (error) throw error;

      toast({ title: `Sent to @${targetUser.username}! ✅` });
      setHeading('');
      setDescription('');
      setTargetUsername('');
    } catch (error: any) {
      console.error(error);
      toast({ title: 'Failed to send', description: error.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const handleSend = () => {
    if (mode === 'all') sendToAll();
    else sendToUser();
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <TimerButton variant="secondary" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </TimerButton>
          <div>
            <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
              <Megaphone className="w-6 h-6" /> Admin Broadcast
            </h1>
            <p className="text-sm text-muted-foreground">Send notifications to users</p>
          </div>
        </div>

        {/* Mode Selection */}
        <div className="grid grid-cols-2 gap-3">
          <TimerButton
            variant={mode === 'all' ? 'primary' : 'secondary'}
            onClick={() => setMode('all')}
            className="flex items-center gap-2"
          >
            <Users className="w-4 h-4" /> All Users
          </TimerButton>
          <TimerButton
            variant={mode === 'single' ? 'primary' : 'secondary'}
            onClick={() => setMode('single')}
            className="flex items-center gap-2"
          >
            <User className="w-4 h-4" /> Single User
          </TimerButton>
        </div>

        {/* Target username input */}
        {mode === 'single' && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Target Username</label>
            <Input
              placeholder="Enter username (without @)"
              value={targetUsername}
              onChange={(e) => setTargetUsername(e.target.value)}
            />
          </div>
        )}

        <Card className="gradient-card p-5 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Heading *</label>
            <Input
              placeholder="Notification heading"
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Description (optional)</label>
            <Textarea
              placeholder="Notification description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <TimerButton
            variant="start"
            onClick={handleSend}
            disabled={sending || !heading.trim() || (mode === 'single' && !targetUsername.trim())}
            className="w-full flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            {sending ? 'Sending...' : mode === 'all' ? 'Send to All Users' : 'Send to User'}
          </TimerButton>
        </Card>

        <p className="text-xs text-muted-foreground text-center">
          Only accessible to admin accounts. Notifications appear in users' notification tab.
        </p>
      </div>
    </div>
  );
};

export default AdminBroadcast;
