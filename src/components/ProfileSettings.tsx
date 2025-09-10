import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TimerButton } from '@/components/ui/timer-button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';

interface ProfileSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ isOpen, onClose }) => {
  const { user, updatePassword } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (isOpen && user) {
      fetchUserProfile();
    }
  }, [isOpen, user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();

      if (error) throw error;
      
      setUserProfile(data);
      setFormData(prev => ({
        ...prev,
        username: data.username || '',
      }));
    } catch (error) {
      toast({
        title: "Error Loading Profile",
        description: "Failed to load your profile data.",
        variant: "destructive",
      });
    }
  };

  const checkUsernameExists = async (username: string) => {
    if (!username.trim()) return false;
    
    const { data } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .neq('auth_user_id', user?.id)
      .single();
    
    return !!data;
  };

  const handleUsernameUpdate = async () => {
    if (!user || !formData.username.trim()) {
      toast({
        title: "Invalid Username",
        description: "Please enter a valid username.",
        variant: "destructive",
      });
      return;
    }

    if (formData.username.length < 3) {
      toast({
        title: "Username Too Short",
        description: "Username must be at least 3 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      toast({
        title: "Invalid Username",
        description: "Username can only contain letters, numbers, and underscores.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Check if username already exists
      const exists = await checkUsernameExists(formData.username);
      if (exists) {
        toast({
          title: "Username Taken",
          description: "This username is already taken. Please choose another.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Update username
      const { error } = await supabase
        .from('users')
        .update({ 
          username: formData.username,
          updated_at: new Date().toISOString()
        })
        .eq('auth_user_id', user.id);

      if (error) throw error;

      toast({
        title: "Username Updated",
        description: `Your username has been set to @${formData.username}`,
      });

      fetchUserProfile(); // Refresh profile data
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update username. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!formData.newPassword || !formData.confirmPassword) {
      toast({
        title: "Missing Password",
        description: "Please fill in both password fields.",
        variant: "destructive",
      });
      return;
    }

    if (formData.newPassword.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await updatePassword(formData.newPassword);
    setLoading(false);

    if (!error) {
      setFormData(prev => ({
        ...prev,
        newPassword: '',
        confirmPassword: '',
      }));
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Profile Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Info */}
          {userProfile && (
            <Card className="gradient-secondary p-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">{userProfile.name}</h3>
                <p className="text-sm text-muted-foreground">{userProfile.email}</p>
                <p className="text-sm text-muted-foreground">
                  {userProfile.class} • {userProfile.city}, {userProfile.state}
                </p>
              </div>
            </Card>
          )}

          {/* Username Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Username</h3>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Enter your username"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Only letters, numbers, and underscores allowed (min 3 characters)
              </p>
            </div>
            <TimerButton
              variant="primary"
              onClick={handleUsernameUpdate}
              disabled={loading || !formData.username.trim()}
              className="w-full"
            >
              {loading ? 'Updating...' : 'Update Username'}
            </TimerButton>
          </div>

          {/* Password Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Change Password
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={formData.newPassword}
                  onChange={(e) => handleInputChange('newPassword', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <TimerButton
              variant="secondary"
              onClick={handlePasswordUpdate}
              disabled={loading || !formData.newPassword || !formData.confirmPassword}
              className="w-full"
            >
              {loading ? 'Updating...' : 'Change Password'}
            </TimerButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileSettings;