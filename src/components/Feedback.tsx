import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TimerButton } from '@/components/ui/timer-button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Star } from 'lucide-react';

interface FeedbackProps {
  isOpen: boolean;
  onClose: () => void;
}

const Feedback: React.FC<FeedbackProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);

  React.useEffect(() => {
    if (user && isOpen) {
      fetchUserProfile();
    }
  }, [user, isOpen]);

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
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim() || !rating || !user || !userProfile) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('feedback')
        .insert({
          user_id: user.id,
          username: userProfile.username,
          name: userProfile.name,
          email: userProfile.email,
          phone: userProfile.phone,
          state: userProfile.state,
          city: userProfile.city,
          feedback_text: feedback,
          rating: rating
        });

      if (error) throw error;

      toast({
        title: "Feedback Submitted!",
        description: "Thank you for your valuable feedback.",
      });

      setFeedback('');
      setRating(0);
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="gradient-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <MessageSquare className="w-5 h-5" />
            Share Your Feedback
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Rate your experience</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`p-1 transition-colors ${
                    rating >= star ? 'text-yellow-500' : 'text-muted-foreground hover:text-yellow-500'
                  }`}
                >
                  <Star className="w-6 h-6 fill-current" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback">Your Feedback</Label>
            <Textarea
              id="feedback"
              placeholder="Tell us about your experience with JEE Timer..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              maxLength={1000}
              required
            />
            <p className="text-xs text-muted-foreground">
              {feedback.length}/1000 characters
            </p>
          </div>

          <div className="flex gap-3">
            <TimerButton
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </TimerButton>
            <TimerButton
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={loading || !feedback.trim() || !rating}
            >
              {loading ? 'Submitting...' : 'Submit Feedback'}
            </TimerButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default Feedback;