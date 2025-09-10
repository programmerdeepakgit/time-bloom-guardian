import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TimerButton } from '@/components/ui/timer-button';
import { useAuth } from '@/contexts/AuthContext';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';

interface LoginProps {
  onCreateAccount: () => void;
}

const Login: React.FC<LoginProps> = ({ onCreateAccount }) => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
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
              Sign in to your account
            </p>
          </div>
        </div>

        {/* Login Form */}
        <Card className="gradient-card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">
                <Mail className="w-4 h-4 inline mr-2" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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

            <TimerButton
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={!email.trim() || !password.trim() || loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </TimerButton>
          </form>
        </Card>

        {/* Create Account Option */}
        <Card className="gradient-secondary p-4">
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Don't have an account?
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

export default Login;