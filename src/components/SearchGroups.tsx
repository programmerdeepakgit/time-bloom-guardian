import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { TimerButton } from '@/components/ui/timer-button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Search, Users, Lock, Globe, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SearchGroupsProps {
  onBack: () => void;
}

interface GroupResult {
  id: string;
  name: string;
  description: string;
  group_code: string;
  is_public: boolean;
  created_by: string;
}

const SearchGroups: React.FC<SearchGroupsProps> = ({ onBack }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchByCode, setSearchByCode] = useState('');
  const [results, setResults] = useState<GroupResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const handleSearchByName = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('is_public', true)
        .ilike('name', `%${searchQuery.trim()}%`)
        .limit(20);
      if (error) throw error;
      setResults(data || []);
      if ((data || []).length === 0) {
        toast({ title: "No groups found", description: "Try a different search term." });
      }
    } catch (error) {
      toast({ title: "Search failed", variant: "destructive" });
    } finally {
      setSearching(false);
    }
  };

  const handleSearchByCode = async () => {
    if (!searchByCode.trim()) return;
    setSearching(true);
    try {
      const { data, error } = await supabase
        .rpc('get_group_by_code', { _group_code: searchByCode.trim() });
      if (error) throw error;
      setResults((data as any[]) || []);
      if ((data || []).length === 0) {
        toast({ title: "No group found", description: "Check the code and try again." });
      }
    } catch (error) {
      toast({ title: "Search failed", variant: "destructive" });
    } finally {
      setSearching(false);
    }
  };

  const handleJoinOrRequest = async (group: GroupResult) => {
    if (!user) return;
    setJoiningId(group.id);
    try {
      // Check if already a member
      const { data: existing } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', group.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        toast({ title: "Already a member!", description: "You're already in this group." });
        setJoiningId(null);
        return;
      }

      if (group.is_public) {
        // Direct join
        const { error } = await supabase
          .from('group_members')
          .insert({ group_id: group.id, user_id: user.id, role: 'member' });
        if (error) throw error;

        toast({ title: "Joined! 🎉", description: `You joined ${group.name}` });
      } else {
        // Send join request notification to creator
        // Get user's own username (RLS allows viewing own data)
        const { data: profile } = await supabase
          .from('users')
          .select('username, name')
          .eq('auth_user_id', user.id)
          .maybeSingle();

        const { error } = await supabase
          .from('notifications')
          .insert({
            user_id: group.created_by,
            type: 'join_request',
            from_user_id: user.id,
            group_id: group.id,
            message: `${profile?.username || profile?.name || 'Someone'} wants to join "${group.name}"`,
            data: { requester_id: user.id },
          });
        if (error) throw error;

        toast({ title: "Request Sent!", description: "The group creator will review your request." });
      }
    } catch (error) {
      console.error('Error joining group:', error);
      toast({ title: "Failed to join", variant: "destructive" });
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <TimerButton variant="secondary" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </TimerButton>
          <h1 className="text-2xl font-bold text-primary">Search Groups</h1>
        </div>

        {/* Search by name */}
        <Card className="gradient-card p-4 space-y-3">
          <label className="text-sm font-medium text-foreground">Search by Name</label>
          <div className="flex gap-2">
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Group name..."
              onKeyDown={e => e.key === 'Enter' && handleSearchByName()}
            />
            <TimerButton variant="primary" onClick={handleSearchByName} disabled={searching}>
              <Search className="w-4 h-4" />
            </TimerButton>
          </div>
        </Card>

        {/* Search by code */}
        <Card className="gradient-secondary p-4 space-y-3">
          <label className="text-sm font-medium text-foreground">Join by Group Code</label>
          <div className="flex gap-2">
            <Input
              value={searchByCode}
              onChange={e => setSearchByCode(e.target.value.toUpperCase())}
              placeholder="e.g., ABC123"
              maxLength={6}
              className="font-mono tracking-wider"
              onKeyDown={e => e.key === 'Enter' && handleSearchByCode()}
            />
            <TimerButton variant="primary" onClick={handleSearchByCode} disabled={searching}>
              <Search className="w-4 h-4" />
            </TimerButton>
          </div>
        </Card>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Results</h2>
            {results.map(group => (
              <Card key={group.id} className="gradient-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-foreground">{group.name}</h3>
                      {group.is_public ? (
                        <Globe className="w-3 h-3 text-success" />
                      ) : (
                        <Lock className="w-3 h-3 text-primary" />
                      )}
                    </div>
                    {group.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{group.description}</p>
                    )}
                  </div>
                  <TimerButton
                    variant="start"
                    size="sm"
                    onClick={() => handleJoinOrRequest(group)}
                    disabled={joiningId === group.id}
                    className="ml-3"
                  >
                    <UserPlus className="w-4 h-4 mr-1" />
                    {group.is_public ? 'Join' : 'Request'}
                  </TimerButton>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchGroups;
