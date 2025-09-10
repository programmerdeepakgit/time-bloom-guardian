import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TimerButton } from '@/components/ui/timer-button';
import { useAuth } from '@/contexts/AuthContext';
import { Key, Mail, User, Phone, MapPin, GraduationCap, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const API_KEY = 'allthekingisdeepak@2458';

interface SignupProps {
  onBackToLogin: () => void;
}

const Signup: React.FC<SignupProps> = ({ onBackToLogin }) => {
  const { signUp } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<'api' | 'details'>('api');
  const [apiKey, setApiKey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
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

  const handleApiSubmit = () => {
    if (apiKey === API_KEY) {
      setStep('details');
      toast({
        title: "API Key Verified",
        description: "Please fill in your details to create your account.",
      });
    } else {
      toast({
        title: "Invalid API Key",
        description: "Please enter the correct API key to proceed.",
        variant: "destructive",
      });
    }
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
    if (!validateForm()) return;

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
      // Success is handled by the AuthContext
      setStep('api');
      setFormData({
        name: '',
        class: '',
        state: '',
        city: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: '',
      });
      setApiKey('');
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
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
            <Key className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-primary">JEE TIMER</h1>
          <p className="text-muted-foreground">
            {step === 'api' && 'Enter API Key to Continue'}
            {step === 'details' && 'Create Your Account'}
          </p>
        </div>

        {/* API Key Step */}
        {step === 'api' && (
          <Card className="gradient-card p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="Enter API key..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>
              <TimerButton
                variant="primary"
                size="lg"
                onClick={handleApiSubmit}
                className="w-full"
                disabled={!apiKey.trim()}
              >
                Verify API Key
              </TimerButton>
              
              <TimerButton
                variant="secondary"
                onClick={onBackToLogin}
                className="w-full"
              >
                Back to Login
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

              <TimerButton
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create Account & Verify Email'}
              </TimerButton>
              
              <TimerButton
                type="button"
                variant="secondary"
                onClick={() => setStep('api')}
                className="w-full"
              >
                Back
              </TimerButton>
            </form>
          </Card>
        )}

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

export default Signup;