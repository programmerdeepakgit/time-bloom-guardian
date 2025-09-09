import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TimerButton } from '@/components/ui/timer-button';
import { UserData } from '@/types';
import { storageUtils } from '@/utils/storage';
import { supabaseUtils } from '@/utils/supabase';
import { Key, Mail, User, Phone, MapPin, GraduationCap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const API_KEY = 'allthekingisdeepak@2458';

interface KeyGenerationProps {
  onKeyGenerated: (userData: UserData) => void;
}

const KeyGeneration: React.FC<KeyGenerationProps> = ({ onKeyGenerated }) => {
  const { toast } = useToast();
  const [step, setStep] = useState<'api' | 'details'>('api');
  const [apiKey, setApiKey] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    class: '',
    state: '',
    city: '',
    phone: '',
    email: '',
  });

  const handleApiSubmit = () => {
    if (apiKey === API_KEY) {
      setStep('details');
      toast({
        title: "API Key Verified",
        description: "Please fill in your details to generate your access key.",
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
    const { name, class: className, state, city, phone, email } = formData;
    
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

    return true;
  };


  const generateAccessKey = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    return `JEE-${timestamp}-${random}`.toUpperCase();
  };

  const handleDetailsSubmit = async () => {
    if (!validateForm()) return;

    const key = generateAccessKey();
    const userData: UserData = {
      ...formData,
      isVerified: true,
      key,
      registrationDate: new Date().toISOString(),
    };

    try {
      // Save to local storage first
      storageUtils.saveUserData(userData);
      storageUtils.saveAppKey(key);

      // Save to Supabase database
      const { error } = await supabaseUtils.createUser(userData);
      if (error) {
        console.warn('Failed to save to database:', error);
        // Don't block the user if database save fails
      }

      toast({
        title: "Account Created Successfully!",
        description: "Your JEE Timer account has been activated.",
      });

      // Redirect to app immediately
      onKeyGenerated(userData);
    } catch (error) {
      toast({
        title: "Error Saving Data",
        description: "Failed to save your account data. Please try again.",
        variant: "destructive",
      });
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
            </div>
          </Card>
        )}

        {/* Details Step */}
        {step === 'details' && (
          <Card className="gradient-card p-6">
            <div className="space-y-4">
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
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input
                      placeholder="City"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
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
                  />
                </div>
              </div>

              <TimerButton
                variant="primary"
                size="lg"
                onClick={handleDetailsSubmit}
                className="w-full"
              >
                Create Account & Get Access
              </TimerButton>
            </div>
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

export default KeyGeneration;