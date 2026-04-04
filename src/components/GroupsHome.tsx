import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { TimerButton } from '@/components/ui/timer-button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Plus, Search, Users, Crown, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GroupsHomeProps {
  onBack: () => void;
  onNavigate: (page: string, data?: any) => void;
}

interface GroupWithCount {
  id: string;
  name: string;
  description: string;
  group_code: string;
  is_public: boolean;
  created_by: string;
  role: string;
  member_count: number;
}

const GroupsHome: React.FC<GroupsHomeProps> = ({ onBack, onNavigate }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [groups, setGroups] = useState<GroupWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyGroups();
  }, []);

  const fetchMyGroups = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Get groups user is a member of
      const { data: memberships, error } = await supabase
        .from('group_members')
        .select('group_id, role')
        .eq('user_id', user.id);

      if (error) throw error;
      if (!memberships || memberships.length === 0) {
        setGroups([]);
        setLoading(false);
        return;
      }

      const groupIds = memberships.map(m => m.group_id);
      const { data: groupsData, error: gError } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds);

      if (gError) throw gError;

      // Get member counts
      const enriched: GroupWithCount[] = [];
      for (const g of (groupsData || [])) {
        const membership = memberships.find(m => m.group_id === g.id);
        const { count } = await supabase
          .from('group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', g.id);

        enriched.push({
          ...g,
          role: membership?.role || 'member',
          member_count: count || 0,
        });
      }
      setGroups(enriched);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyGroupCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copied!", description: `Group code ${code} copied to clipboard.` });
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <TimerButton variant="secondary" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </TimerButton>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-primary">Study Groups</h1>
            <p className="text-muted-foreground text-sm">Study together with friends</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <TimerButton variant="primary" onClick={() => onNavigate('create-group')} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Group
          </TimerButton>
          <TimerButton variant="secondary" onClick={() => onNavigate('search-groups')} className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Search Groups
          </TimerButton>
        </div>

        {/* My Groups */}
        {loading ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <p className="text-muted-foreground mt-4">Loading groups...</p>
          </div>
        ) : groups.length === 0 ? (
          <Card className="gradient-card p-8 text-center">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Groups Yet</h3>
            <p className="text-muted-foreground">Create a group or search for one to join!</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {groups.map(group => (
              <Card
                key={group.id}
                className="gradient-card card-glow cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]"
                onClick={() => onNavigate('group-detail', { groupId: group.id })}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-foreground">{group.name}</h3>
                      {group.role === 'creator' && (
                        <Crown className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); copyGroupCode(group.group_code); }}
                      className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="w-3 h-3" />
                      {group.group_code}
                    </button>
                  </div>
                  {group.description && (
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{group.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {group.member_count} members
                    </span>
                    <span className={`px-2 py-0.5 rounded-full ${group.is_public ? 'bg-success/20 text-success' : 'bg-primary/20 text-primary'}`}>
                      {group.is_public ? 'Public' : 'Private'}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
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

export default GroupsHome;
