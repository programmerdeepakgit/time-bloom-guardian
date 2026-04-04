import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { TimerButton } from '@/components/ui/timer-button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatTime } from '@/utils/timer';
import {
  ArrowLeft, Users, Crown, Copy, Play, UserPlus, UserMinus,
  Send, Coffee, Target, Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface GroupDetailProps {
  groupId: string;
  onBack: () => void;
  onStartGroupStudy: (groupId: string, mode: 'pomodoro' | 'target-study', subject: string) => void;
}

interface MemberInfo {
  user_id: string;
  role: string;
  username: string;
  name: string;
  total_study_time: number;
  is_studying: boolean;
  currently_studying_subject: string | null;
}

interface ActiveSession {
  id: string;
  mode: string;
  subject: string;
  started_by: string;
  started_at: string;
  starter_name?: string;
}

const GroupDetail: React.FC<GroupDetailProps> = ({ groupId, onBack, onStartGroupStudy }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [group, setGroup] = useState<any>(null);
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviting, setInviting] = useState(false);
  const [studyMode, setStudyMode] = useState<'pomodoro' | 'target-study'>('pomodoro');
  const [studySubject, setStudySubject] = useState('all');
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    fetchGroupData();
  }, [groupId]);

  const fetchGroupData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch group
      const { data: groupData } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();
      setGroup(groupData);

      // Fetch members
      const { data: memberData } = await supabase
        .from('group_members')
        .select('user_id, role')
        .eq('group_id', groupId);

      if (memberData) {
        const userIds = memberData.map(m => m.user_id);
        const { data: profiles } = await supabase
          .from('users')
          .select('auth_user_id, username, name, total_study_time, is_studying, currently_studying_subject')
          .in('auth_user_id', userIds);

        const enriched: MemberInfo[] = memberData.map(m => {
          const profile = profiles?.find(p => p.auth_user_id === m.user_id);
          return {
            user_id: m.user_id,
            role: m.role,
            username: profile?.username || 'Unknown',
            name: profile?.name || '',
            total_study_time: profile?.total_study_time || 0,
            is_studying: profile?.is_studying || false,
            currently_studying_subject: profile?.currently_studying_subject || null,
          };
        }).sort((a, b) => b.total_study_time - a.total_study_time);

        setMembers(enriched);
        setIsCreator(memberData.some(m => m.user_id === user.id && m.role === 'creator'));
      }

      // Fetch active sessions
      const { data: sessions } = await supabase
        .from('group_study_sessions')
        .select('*')
        .eq('group_id', groupId)
        .eq('is_active', true);

      if (sessions && sessions.length > 0) {
        const starterIds = sessions.map(s => s.started_by);
        const { data: starterProfiles } = await supabase
          .from('users')
          .select('auth_user_id, username, name')
          .in('auth_user_id', starterIds);

        const enrichedSessions = sessions.map(s => ({
          ...s,
          starter_name: starterProfiles?.find(p => p.auth_user_id === s.started_by)?.username || 'Someone',
        }));
        setActiveSessions(enrichedSessions);
      } else {
        setActiveSessions([]);
      }
    } catch (error) {
      console.error('Error fetching group:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!user || !inviteUsername.trim()) return;
    setInviting(true);
    try {
      // Find user by username
      const { data: targetUser } = await supabase
        .from('users')
        .select('auth_user_id, username')
        .eq('username', inviteUsername.trim())
        .single();

      if (!targetUser) {
        toast({ title: "User not found", description: "Check the username and try again.", variant: "destructive" });
        setInviting(false);
        return;
      }

      // Check if already a member
      const { data: existing } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', targetUser.auth_user_id)
        .maybeSingle();

      if (existing) {
        toast({ title: "Already a member", variant: "destructive" });
        setInviting(false);
        return;
      }

      // Get sender's username
      const { data: senderProfile } = await supabase
        .from('users')
        .select('username, name')
        .eq('auth_user_id', user.id)
        .single();

      // Send invite notification
      await supabase.from('notifications').insert({
        user_id: targetUser.auth_user_id,
        type: 'invite',
        from_user_id: user.id,
        group_id: groupId,
        message: `${senderProfile?.username || senderProfile?.name || 'Someone'} invited you to join "${group?.name}"`,
      });

      toast({ title: "Invite Sent! ✉️", description: `Invitation sent to @${inviteUsername}` });
      setInviteUsername('');
    } catch (error) {
      toast({ title: "Failed to send invite", variant: "destructive" });
    } finally {
      setInviting(false);
    }
  };

  const handleStartGroupStudy = async () => {
    if (!user) return;
    try {
      // Create session
      const { error } = await supabase.from('group_study_sessions').insert({
        group_id: groupId,
        started_by: user.id,
        mode: studyMode,
        subject: studySubject,
      });
      if (error) throw error;

      // Get sender info
      const { data: senderProfile } = await supabase
        .from('users')
        .select('username, name')
        .eq('auth_user_id', user.id)
        .single();

      // Notify all members except self
      const otherMembers = members.filter(m => m.user_id !== user.id);
      const notifications = otherMembers.map(m => ({
        user_id: m.user_id,
        type: 'study_session' as const,
        from_user_id: user.id,
        group_id: groupId,
        message: `${senderProfile?.username || 'Someone'} started a ${studyMode === 'pomodoro' ? 'Pomodoro' : 'Target Study'} session in "${group?.name}". Join now!`,
      }));

      if (notifications.length > 0) {
        await supabase.from('notifications').insert(notifications);
      }

      toast({ title: "Group Study Started! 🚀", description: "All members have been notified." });
      onStartGroupStudy(groupId, studyMode, studySubject);
    } catch (error) {
      toast({ title: "Failed to start session", variant: "destructive" });
    }
  };

  const handleLeaveGroup = async () => {
    if (!user) return;
    try {
      await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);
      toast({ title: "Left the group" });
      onBack();
    } catch (error) {
      toast({ title: "Failed to leave", variant: "destructive" });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', memberId);
      toast({ title: "Member removed" });
      fetchGroupData();
    } catch (error) {
      toast({ title: "Failed to remove", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <p className="text-muted-foreground">Loading group...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <TimerButton variant="secondary" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </TimerButton>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-primary">{group?.name}</h1>
            {group?.description && <p className="text-muted-foreground text-sm">{group.description}</p>}
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(group?.group_code || '');
              toast({ title: "Code copied!" });
            }}
            className="flex items-center gap-1 text-xs bg-muted px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground"
          >
            <Copy className="w-3 h-3" />
            {group?.group_code}
          </button>
        </div>

        {/* Active Sessions */}
        {activeSessions.length > 0 && (
          <Card className="bg-success/10 border-success/30 p-4">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
              Active Study Sessions
            </h3>
            {activeSessions.map(session => (
              <div key={session.id} className="flex items-center justify-between py-2">
                <div>
                  <span className="text-sm font-medium text-foreground">
                    {session.starter_name} • {session.mode === 'pomodoro' ? '🍅 Pomodoro' : '🎯 Target Study'}
                  </span>
                  <p className="text-xs text-muted-foreground">{session.subject !== 'all' ? session.subject : 'All subjects'}</p>
                </div>
                <TimerButton
                  variant="start"
                  size="sm"
                  onClick={() => onStartGroupStudy(groupId, session.mode as any, session.subject)}
                >
                  <Play className="w-3 h-3 mr-1" /> Join
                </TimerButton>
              </div>
            ))}
          </Card>
        )}

        {/* Start Study Session */}
        <Card className="gradient-card p-4 space-y-3">
          <h3 className="font-semibold text-foreground">Start Group Study</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Mode</label>
              <Select value={studyMode} onValueChange={(v: any) => setStudyMode(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pomodoro">🍅 Pomodoro</SelectItem>
                  <SelectItem value="target-study">🎯 Target Study</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Subject</label>
              <Select value={studySubject} onValueChange={setStudySubject}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="physics">Physics</SelectItem>
                  <SelectItem value="chemistry">Chemistry</SelectItem>
                  <SelectItem value="maths">Maths</SelectItem>
                  <SelectItem value="computer-science">CS</SelectItem>
                  <SelectItem value="english">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <TimerButton variant="start" onClick={handleStartGroupStudy} className="w-full">
            <Play className="w-4 h-4 mr-2" /> Start & Notify Members
          </TimerButton>
        </Card>

        {/* Invite */}
        <Card className="gradient-secondary p-4 space-y-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> Invite by Username
          </h3>
          <div className="flex gap-2">
            <Input
              value={inviteUsername}
              onChange={e => setInviteUsername(e.target.value)}
              placeholder="Enter username..."
              onKeyDown={e => e.key === 'Enter' && handleInvite()}
            />
            <TimerButton variant="primary" onClick={handleInvite} disabled={inviting || !inviteUsername.trim()}>
              <Send className="w-4 h-4" />
            </TimerButton>
          </div>
        </Card>

        {/* Members */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Users className="w-5 h-5" /> Members ({members.length})
          </h3>
          <div className="space-y-2">
            {members.map((member, index) => (
              <Card key={member.user_id} className="gradient-card p-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-muted-foreground min-w-[1.5rem]">{index + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">@{member.username}</span>
                      {member.role === 'creator' && <Crown className="w-4 h-4 text-primary" />}
                      {member.is_studying && (
                        <span className="inline-flex items-center gap-1 text-xs bg-success/20 text-success px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
                          Studying
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{member.name}</span>
                  </div>
                  <span className="text-sm font-mono text-primary">{formatTime(member.total_study_time)}</span>
                  {isCreator && member.user_id !== user?.id && (
                    <button onClick={() => handleRemoveMember(member.user_id)} className="p-1 text-muted-foreground hover:text-destructive">
                      <UserMinus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Leave Group */}
        {!isCreator && (
          <TimerButton variant="stop" onClick={handleLeaveGroup} className="w-full">
            Leave Group
          </TimerButton>
        )}

        {isCreator && (
          <TimerButton
            variant="stop"
            onClick={async () => {
              try {
                await supabase.from('groups').delete().eq('id', groupId);
                toast({ title: "Group deleted" });
                onBack();
              } catch (e) {
                toast({ title: "Failed to delete", variant: "destructive" });
              }
            }}
            className="w-full"
          >
            <Trash2 className="w-4 h-4 mr-2" /> Delete Group
          </TimerButton>
        )}
      </div>
    </div>
  );
};

export default GroupDetail;
