import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TimerButton } from '@/components/ui/timer-button';
import { supabase } from '@/integrations/supabase/client';
import { storageUtils } from '@/utils/storage';
import { useToast } from '@/hooks/use-toast';
import { User, Check, X } from 'lucide-react';

interface UsernameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUsernameSet: (username: string) => void;
}

const UsernameModal: React.FC<UsernameModalProps> = ({ isOpen, onClose, onUsernameSet }) => {
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  const checkUsernameAvailability = async (usernameToCheck: string) => {
    if (usernameToCheck.length < 3) {
      setIsAvailable(null);
      return;
    }

    setIsChecking(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('username')
        .eq('username', usernameToCheck)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      setIsAvailable(!data);
    } catch (error) {
      setIsAvailable(null);
    } finally {
      setIsChecking(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    // Only allow alphanumeric characters and underscores
    const sanitized = value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    setUsername(sanitized);
    
    // Debounce the availability check
    if (sanitized.length >= 3) {
      const timer = setTimeout(() => {
        checkUsernameAvailability(sanitized);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setIsAvailable(null);
    }
  };

  const handleSubmit = async () => {
    if (!username.trim() || username.length < 3) {
      toast({
        title: "Invalid Username",
        description: "Username must be at least 3 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (isAvailable === false) {
      toast({
        title: "Username Taken",
        description: "This username is already taken. Please choose another.",
        variant: "destructive",
      });
      return;
    }

    const userData = storageUtils.getUserData();
    if (!userData?.key) {
      toast({
        title: "Error",
        description: "User data not found. Please log in again.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ username })
        .eq('access_key', userData.key);
      
      if (error) throw error;

      // Update local storage
      const updatedUserData = { ...userData, username };
      storageUtils.saveUserData(updatedUserData);

      toast({
        title: "Username Set Successfully!",
        description: `Your username "${username}" is now active on the leaderboard.`,
      });

      onUsernameSet(username);
      onClose();
    } catch (error) {
      toast({
        title: "Error Setting Username",
        description: "Failed to set username. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getUsernameStatus = () => {
    if (username.length < 3) return null;
    if (isChecking) return { icon: <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />, color: 'text-muted-foreground' };
    if (isAvailable === true) return { icon: <Check className="w-4 h-4" />, color: 'text-success' };
    if (isAvailable === false) return { icon: <X className="w-4 h-4" />, color: 'text-destructive' };
    return null;
  };

  const status = getUsernameStatus();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="gradient-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <User className="w-5 h-5" />
            Set Your Username
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username for Leaderboard</Label>
            <div className="relative">
              <Input
                id="username"
                placeholder="Enter unique username"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                maxLength={20}
                className="pr-10"
              />
              {status && (
                <div className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${status.color}`}>
                  {status.icon}
                </div>
              )}
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Username must be 3-20 characters long</p>
              <p>• Only letters, numbers, and underscores allowed</p>
              <p>• Username will be visible on the leaderboard</p>
            </div>
            {isAvailable === false && (
              <p className="text-xs text-destructive">This username is already taken</p>
            )}
            {isAvailable === true && (
              <p className="text-xs text-success">Username is available!</p>
            )}
          </div>

          <div className="flex gap-3">
            <TimerButton
              variant="secondary"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </TimerButton>
            <TimerButton
              variant="primary"
              onClick={handleSubmit}
              className="flex-1"
              disabled={isLoading || !username.trim() || username.length < 3 || isAvailable === false}
            >
              {isLoading ? 'Setting...' : 'Set Username'}
            </TimerButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UsernameModal;