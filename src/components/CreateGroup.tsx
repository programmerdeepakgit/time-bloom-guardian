import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { TimerButton } from '@/components/ui/timer-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Plus, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

interface CreateGroupProps {
  onBack: () => void;
}

const CreateGroup: React.FC<CreateGroupProps> = ({ onBack }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCreate = async () => {
    if (!user || !name.trim()) {
      toast({ title: "Enter a group name", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      const groupCode = generateCode();
      
      const { data: group, error } = await supabase
        .from('groups')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          group_code: groupCode,
          is_public: isPublic,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as member with 'creator' role
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'creator',
        });

      if (memberError) throw memberError;

      setCreatedCode(groupCode);
      toast({ title: "Group Created! 🎉", description: `Share code: ${groupCode}` });
    } catch (error: any) {
      if (error?.code === '23505') {
        // Duplicate code, retry
        handleCreate();
        return;
      }
      console.error('Error creating group:', error);
      toast({ title: "Failed to create group", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  if (createdCode) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto space-y-6">
          <Card className="gradient-card p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto">
              <Plus className="w-8 h-8 text-success" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Group Created!</h2>
            <p className="text-muted-foreground">Share this code with friends to invite them:</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl font-mono font-bold text-primary tracking-wider">{createdCode}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(createdCode);
                  toast({ title: "Copied!" });
                }}
                className="p-2 bg-muted rounded-lg hover:bg-muted/80"
              >
                <Copy className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <TimerButton variant="primary" onClick={onBack} className="w-full mt-4">
              Go to My Groups
            </TimerButton>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <TimerButton variant="secondary" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </TimerButton>
          <h1 className="text-2xl font-bold text-primary">Create Group</h1>
        </div>

        <Card className="gradient-card p-6 space-y-4">
          <div>
            <Label>Group Name *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., JEE Warriors 2026" maxLength={50} />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What's this group about?" maxLength={200} rows={3} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Public Group</Label>
              <p className="text-xs text-muted-foreground">Anyone can search & request to join</p>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>
        </Card>

        <TimerButton variant="start" size="lg" onClick={handleCreate} disabled={creating || !name.trim()} className="w-full">
          <Plus className="w-5 h-5 mr-2" />
          {creating ? 'Creating...' : 'Create Group'}
        </TimerButton>
      </div>
    </div>
  );
};

export default CreateGroup;
