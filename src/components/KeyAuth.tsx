import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TimerButton } from '@/components/ui/timer-button';
import { storageUtils } from '@/utils/storage';
import { Key, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface KeyAuthProps {
  onAuthenticated: () => void;
  onCreateAccount: () => void;
}

const KeyAuth: React.FC<KeyAuthProps> = ({ onAuthenticated, onCreateAccount }) => {
  const { toast } = useToast();
  const [inputKey, setInputKey] = useState('');

  const handleKeySubmit = () => {
    const storedKey = storageUtils.getAppKey();
    const userData = storageUtils.getUserData();

    if (storedKey && userData && inputKey === storedKey) {
      toast({
        title: "Welcome back!",
        description: `Hello ${userData.name}, access granted.`,
      });
      onAuthenticated();
    } else {
      toast({
        title: "Invalid Access Key",
        description: "Please enter a valid access key or create a new account.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-primary mb-2">JEE TIMER</h1>
            <p className="text-muted-foreground">
              Your Personal Study Time Tracker
            </p>
          </div>
        </div>

        {/* Key Input */}
        <Card className="gradient-card p-6">
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <Key className="w-8 h-8 text-primary mx-auto" />
              <h2 className="text-xl font-semibold text-foreground">Enter Access Key</h2>
              <p className="text-sm text-muted-foreground">
                Enter your unique access key to continue
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accessKey">Access Key</Label>
              <Input
                id="accessKey"
                type="password"
                placeholder="JEE-XXXXXXXX-XXXXXXXX"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                className="font-mono"
              />
            </div>

            <TimerButton
              variant="primary"
              size="lg"
              onClick={handleKeySubmit}
              className="w-full"
              disabled={!inputKey.trim()}
            >
              Access App
            </TimerButton>
          </div>
        </Card>

        {/* Create Account Option */}
        <Card className="gradient-secondary p-4">
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Don't have an access key?
            </p>
            <TimerButton
              variant="secondary"
              onClick={onCreateAccount}
              className="w-full"
            >
              Create New Account
            </TimerButton>
          </div>
        </Card>

        {/* Features Preview */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="space-y-2">
            <div className="w-10 h-10 bg-success/20 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-lg">⏱️</span>
            </div>
            <p className="text-xs text-muted-foreground">Smart Timer</p>
          </div>
          <div className="space-y-2">
            <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-lg">📊</span>
            </div>
            <p className="text-xs text-muted-foreground">Track Progress</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Made by programmer_deepak
          </p>
        </div>
      </div>
    </div>
  );
};

export default KeyAuth;