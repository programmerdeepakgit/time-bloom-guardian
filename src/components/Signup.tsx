import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TimerButton } from '@/components/ui/timer-button';
import { useAuth } from '@/contexts/AuthContext';
import { Key, Mail, User, Phone, MapPin, GraduationCap, Eye, EyeOff, Instagram, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import HCaptcha from '@hcaptcha/react-hcaptcha';

interface SignupProps {
  onBackToLogin: () => void;
}

const Signup: React.FC<SignupProps> = ({ onBackToLogin }) => {
  const { signUp, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<'details' | 'success'>('details');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha>(null);
  const [formData, setFormData] = useState({
    name: '',
    class: '',
    state: '',
    city: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleGoogleSignIn = async () => {
    if (!captchaToken) return;
    await signInWithGoogle();
  };

  const validateForm = () => {
    const { name, class: className, state, city, phone, email, password, confirmPassword } = formData;
    
    if (!name.trim() || !className.trim() || !state.trim() || !city.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return false;
    }

    if (phone.length !== 10 || !/^\d+$/.test(phone)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit phone number.",
        variant: "destructive",
      });
      return false;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return false;
    }

    if (password.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return false;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const generateAccessKey = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    return `JEE-${timestamp}-${random}`.toUpperCase();
  };

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !captchaToken) return;

    setLoading(true);
    const key = generateAccessKey();
    const userData = {
      ...formData,
      key,
      registrationDate: new Date().toISOString(),
    };

    const { error } = await signUp(formData.email, formData.password, userData);
    setLoading(false);

    if (!error) {
      setStep('success');
      setCaptchaToken(null);
      captchaRef.current?.resetCaptcha();
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-end mb-4">
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
          
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
            {step === 'success' ? <CheckCircle className="w-8 h-8 text-success" /> : <Key className="w-8 h-8 text-primary" />}
          </div>
          <h1 className="text-2xl font-bold text-primary">JEE TIMER</h1>
          <p className="text-muted-foreground">
            {step === 'details' && 'Create Your Account'}
            {step === 'success' && 'Account Created Successfully!'}
          </p>
        </div>

        {/* Success Step */}
        {step === 'success' && (
          <Card className="gradient-card p-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Welcome to JEE Timer!
                </h3>
                <p className="text-muted-foreground text-sm">
                  Your account has been created successfully. You can now sign in and start your study journey.
                </p>
              </div>
              <TimerButton
                variant="primary"
                size="lg"
                onClick={onBackToLogin}
                className="w-full"
              >
                Go to Login
              </TimerButton>
            </div>
          </Card>
        )}

        {/* Details Step */}
        {step === 'details' && (
          <Card className="gradient-card p-6">
            <form onSubmit={handleDetailsSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label>
                    <User className="w-4 h-4 inline mr-2" />
                    Full Name
                  </Label>
                  <Input
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    <GraduationCap className="w-4 h-4 inline mr-2" />
                    Class
                  </Label>
                  <Input
                    placeholder="e.g., 12th, Dropper, etc."
                    value={formData.class}
                    onChange={(e) => handleInputChange('class', e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>
                      <MapPin className="w-4 h-4 inline mr-2" />
                      State
                    </Label>
                    <Input
                      placeholder="State"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input
                      placeholder="City"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>
                    <Phone className="w-4 h-4 inline mr-2" />
                    Phone Number
                  </Label>
                  <Input
                    placeholder="10-digit phone number"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    maxLength={10}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email Address
                  </Label>
                  <Input
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Password (min 6 characters)</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
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

                <div className="space-y-2">
                  <Label>Confirm Password</Label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      required
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
                disabled={loading || !captchaToken}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
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
                Sign up with Google
              </TimerButton>
              
              <TimerButton
                type="button"
                variant="secondary"
                onClick={onBackToLogin}
                className="w-full"
              >
                Back to Login
              </TimerButton>
            </form>
          </Card>
        )}

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

export default Signup;