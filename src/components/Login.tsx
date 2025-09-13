import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TimerButton } from '@/components/ui/timer-button';
import { useAuth } from '@/contexts/AuthContext';
import { Lock, Mail, Eye, EyeOff, Trophy, Instagram } from 'lucide-react';
import HCaptcha from '@hcaptcha/react-hcaptcha';

interface LoginProps {
  onCreateAccount: () => void;
  onShowLeaderboard: () => void;
}

const Login: React.FC<LoginProps> = ({ onCreateAccount, onShowLeaderboard }) => {
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || !captchaToken) return;

    setLoading(true);
    const { error } = await signIn(email, password);
    if (!error) {
      setCaptchaToken(null);
      captchaRef.current?.resetCaptcha();
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    if (!captchaToken) return;
    await signInWithGoogle();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-end mb-4">
            <TimerButton
              variant="secondary"
              size="sm"
              onClick={() => window.open('https://www.instagram.com/programmer_deepak/', '_blank')}
              className="flex items-center gap-2"
            >
              <Instagram className="w-4 h-4" />
              Contact
            </TimerButton>
          </div>
          
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

            {/* hCaptcha */}
            <div className="flex justify-center">
              <HCaptcha
                ref={captchaRef}
                sitekey="10000000-ffff-ffff-ffff-000000000001" // Test key
                onVerify={(token) => setCaptchaToken(token)}
                onExpire={() => setCaptchaToken(null)}
              />
            </div>

            <TimerButton
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={!email.trim() || !password.trim() || !captchaToken || loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </TimerButton>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <TimerButton
              type="button"
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={!captchaToken || loading}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
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
        <div className="grid grid-cols-3 gap-4 text-center">
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
          <div className="space-y-2">
            <button 
              onClick={onShowLeaderboard}
              className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center mx-auto hover:bg-yellow-500/30 transition-colors"
            >
              <Trophy className="w-5 h-5 text-yellow-500" />
            </button>
            <p className="text-xs text-muted-foreground">Leaderboard</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Made by{' '}
            <button
              onClick={() => window.open('https://www.instagram.com/programmer_deepak/', '_blank')}
              className="text-primary hover:underline cursor-pointer"
            >
              programmer_deepak
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;