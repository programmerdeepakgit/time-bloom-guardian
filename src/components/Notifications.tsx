import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { TimerButton } from '@/components/ui/timer-button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Bell, Check, X, Users, UserPlus, Play, Trash2, Megaphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NotificationsProps {
  onClose: () => void;
  onNavigateToGroup?: (groupId: string) => void;
}

interface NotificationItem {
  id: string;
  type: string;
  from_user_id: string | null;
  group_id: string | null;
  message: string;
  is_read: boolean;
  data: any;
  created_at: string;
}

const Notifications: React.FC<NotificationsProps> = ({ onClose, onNavigateToGroup }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const handleAcceptInvite = async (notification: NotificationItem) => {
    if (!user || !notification.group_id) return;
    try {
      const { error } = await supabase
        .from('group_members')
        .insert({ group_id: notification.group_id, user_id: user.id, role: 'member' });
      if (error) {
        if (error.code === '23505') {
          toast({ title: "Already a member!" });
        } else throw error;
      } else {
        toast({ title: "Joined! 🎉" });
      }
      await markAsRead(notification.id);
    } catch (error) {
      toast({ title: "Failed to join", variant: "destructive" });
    }
  };

  const handleAcceptJoinRequest = async (notification: NotificationItem) => {
    if (!user || !notification.group_id || !notification.data?.requester_id) return;
    try {
      // Add requester as member
      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: notification.group_id,
          user_id: notification.data.requester_id,
          role: 'member',
        });
      if (error) throw error;

      // Notify the requester
      const { data: groupData } = await supabase
        .from('groups')
        .select('name')
        .eq('id', notification.group_id)
        .single();

      await supabase.from('notifications').insert({
        user_id: notification.data.requester_id,
        type: 'request_accepted',
        from_user_id: user.id,
        group_id: notification.group_id,
        message: `Your request to join "${groupData?.name}" was accepted! 🎉`,
      });

      await markAsRead(notification.id);
      toast({ title: "Request Accepted!" });
    } catch (error) {
      toast({ title: "Failed to accept", variant: "destructive" });
    }
  };

  const handleRejectJoinRequest = async (notification: NotificationItem) => {
    if (!user || !notification.group_id || !notification.data?.requester_id) return;
    try {
      const { data: groupData } = await supabase
        .from('groups')
        .select('name')
        .eq('id', notification.group_id)
        .single();

      await supabase.from('notifications').insert({
        user_id: notification.data.requester_id,
        type: 'request_rejected',
        from_user_id: user.id,
        group_id: notification.group_id,
        message: `Your request to join "${groupData?.name}" was declined.`,
      });

      await markAsRead(notification.id);
      toast({ title: "Request Rejected" });
    } catch (error) {
      toast({ title: "Failed", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAllRead = async () => {
    if (!user) return;
    const unread = notifications.filter(n => !n.is_read);
    for (const n of unread) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', n.id);
    }
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'invite': return <UserPlus className="w-5 h-5 text-primary" />;
      case 'join_request': return <Users className="w-5 h-5 text-primary" />;
      case 'study_session': return <Play className="w-5 h-5 text-success" />;
      case 'request_accepted': return <Check className="w-5 h-5 text-success" />;
      case 'request_rejected': return <X className="w-5 h-5 text-destructive" />;
      case 'announcement': return <Megaphone className="w-5 h-5 text-primary" />;
      default: return <Bell className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TimerButton variant="secondary" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </TimerButton>
            <h1 className="text-2xl font-bold text-primary">Notifications</h1>
            {unreadCount > 0 && (
              <span className="bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <TimerButton variant="secondary" size="sm" onClick={markAllRead}>
              Mark all read
            </TimerButton>
          )}
        </div>

        {loading ? (
          <div className="text-center py-8">
            <Bell className="w-8 h-8 text-muted-foreground mx-auto animate-pulse" />
            <p className="text-muted-foreground mt-2">Loading...</p>
          </div>
        ) : notifications.length === 0 ? (
          <Card className="gradient-card p-8 text-center">
            <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Notifications</h3>
            <p className="text-muted-foreground">You're all caught up!</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => (
              <Card key={n.id} className={`p-4 transition-all ${n.is_read ? 'gradient-secondary opacity-75' : 'gradient-card border-primary/20'}`}>
                <div className="flex items-start gap-3">
                  <div className="mt-1">{getIcon(n.type)}</div>
                  <div className="flex-1">
                    <p className={`text-sm ${n.is_read ? 'text-muted-foreground' : 'text-foreground font-medium'}`}>
                      {n.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(n.created_at).toLocaleString('en-IN')}
                    </p>

                    {/* Action buttons */}
                    {!n.is_read && n.type === 'invite' && (
                      <div className="flex gap-2 mt-2">
                        <TimerButton variant="start" size="sm" onClick={() => handleAcceptInvite(n)}>
                          <Check className="w-3 h-3 mr-1" /> Accept
                        </TimerButton>
                        <TimerButton variant="secondary" size="sm" onClick={() => markAsRead(n.id)}>
                          Decline
                        </TimerButton>
                      </div>
                    )}
                    {!n.is_read && n.type === 'join_request' && (
                      <div className="flex gap-2 mt-2">
                        <TimerButton variant="start" size="sm" onClick={() => handleAcceptJoinRequest(n)}>
                          <Check className="w-3 h-3 mr-1" /> Accept
                        </TimerButton>
                        <TimerButton variant="stop" size="sm" onClick={() => handleRejectJoinRequest(n)}>
                          <X className="w-3 h-3 mr-1" /> Reject
                        </TimerButton>
                      </div>
                    )}
                    {!n.is_read && n.type === 'study_session' && n.group_id && (
                      <div className="flex gap-2 mt-2">
                        <TimerButton variant="start" size="sm" onClick={() => {
                          markAsRead(n.id);
                          onNavigateToGroup?.(n.group_id!);
                        }}>
                          <Play className="w-3 h-3 mr-1" /> View Group
                        </TimerButton>
                        <TimerButton variant="secondary" size="sm" onClick={() => markAsRead(n.id)}>
                          Dismiss
                        </TimerButton>
                      </div>
                    )}
                  </div>
                  <button onClick={() => handleDelete(n.id)} className="p-1 text-muted-foreground hover:text-destructive">
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

export default Notifications;
