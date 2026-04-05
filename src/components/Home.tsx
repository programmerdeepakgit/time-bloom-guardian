import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { TimerButton } from '@/components/ui/timer-button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { storageUtils } from '@/utils/storage';
import { formatTime } from '@/utils/timer';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Timer, 
  BookOpen, 
  GraduationCap, 
  Clock,
  TrendingUp,
  Trophy,
  User,
  Settings,
  LogOut,
  RefreshCw,
  MessageSquare,
  Instagram,
  Menu,
  X,
  Target,
  Coffee,
  BarChart3,
  Users,
  Bell
} from 'lucide-react';
import ProfileSettings from './ProfileSettings';
import Feedback from './Feedback';
import { useToast } from '@/hooks/use-toast';

interface HomeProps {
  onNavigate: (page: string, studyType?: any) => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [studyStats, setStudyStats] = useState({
    selfStudy: { sessions: 0, totalTime: 0 },
    lectureStudy: { sessions: 0, totalTime: 0 }
  });

  // Fetch user profile data from database
  useEffect(() => {
    if (user) {
      fetchUserProfile();
      calculateStudyStats();
      fetchUnreadCount();
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      setUnreadNotifications(count || 0);
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  };

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }
      
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const calculateStudyStats = async () => {
    const selfStudyRecords = storageUtils.getRecordsByType('self-study');
    const lectureStudyRecords = storageUtils.getRecordsByType('lecture-study');
    
    const localSelfTime = selfStudyRecords.reduce((sum, record) => sum + record.duration, 0);
    const localLectureTime = lectureStudyRecords.reduce((sum, record) => sum + record.duration, 0);
    const localTotal = localSelfTime + localLectureTime;

    // Always fetch DB total as the source of truth
    let dbTotal = 0;
    if (user) {
      const { data } = await supabase
        .from('users')
        .select('total_study_time')
        .eq('auth_user_id', user.id)
        .maybeSingle();
      dbTotal = data?.total_study_time || 0;
    }

    // The displayed total should be the max of DB and local
    const effectiveTotal = Math.max(localTotal, dbTotal);

    if (localTotal === 0 && dbTotal > 0) {
      // No local records — show DB total (source of truth)
      setStudyStats({
        selfStudy: { sessions: 0, totalTime: dbTotal },
        lectureStudy: { sessions: 0, totalTime: 0 }
      });
    } else if (localTotal > 0) {
      // We have local records — show local breakdown but ensure total >= DB
      const extraFromDb = Math.max(0, dbTotal - localTotal);
      setStudyStats({
        selfStudy: {
          sessions: selfStudyRecords.length,
          totalTime: localSelfTime + extraFromDb
        },
        lectureStudy: {
          sessions: lectureStudyRecords.length,
          totalTime: localLectureTime
        }
      });
    } else {
      setStudyStats({
        selfStudy: { sessions: 0, totalTime: 0 },
        lectureStudy: { sessions: 0, totalTime: 0 }
      });
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  const syncStudyTime = async () => {
    if (!user || !userProfile) return;
    
    setSyncing(true);
    try {
      // Get study records from local storage
      const selfStudyRecords = storageUtils.getRecordsByType('self-study');
      const lectureStudyRecords = storageUtils.getRecordsByType('lecture-study');
      
      // Calculate local total time
      const localTotal = selfStudyRecords.reduce((sum, record) => sum + record.duration, 0) +
                        lectureStudyRecords.reduce((sum, record) => sum + record.duration, 0);

      // Get current DB total to preserve previously synced time
      const { data: currentData } = await supabase
        .from('users')
        .select('total_study_time')
        .eq('auth_user_id', user.id)
        .maybeSingle();
      
      const dbTotal = currentData?.total_study_time || 0;
      // Use the higher value so we never lose time
      const finalTotal = Math.max(localTotal, dbTotal);

      const { error } = await supabase
        .from('users')
        .update({ 
          total_study_time: finalTotal,
          updated_at: new Date().toISOString()
        })
        .eq('auth_user_id', user.id);
      
      if (error) throw error;

      // Update user profile state
      setUserProfile(prev => ({
        ...prev,
        total_study_time: finalTotal,
        updated_at: new Date().toISOString()
      }));

      toast({
        title: "Study Time Synced!",
        description: "Your study time has been updated in the database.",
      });

      // Refresh stats
      calculateStudyStats();
    } catch (error) {
      console.error('Error syncing study time:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync your study time. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const studyModes = [
    {
      title: 'Self Study Timer',
      description: 'Start your self study session',
      icon: Timer,
      color: 'success',
      action: () => onNavigate('timer', 'self-study'),
    },
    {
      title: 'Pomodoro Timer',
      description: '25 min study • 5 min break',
      icon: Coffee,
      color: 'success',
      action: () => onNavigate('pomodoro'),
    },
    {
      title: 'Target Study',
      description: 'Set a goal and study with breaks',
      icon: Target,
      color: 'success',
      action: () => onNavigate('target-study'),
    },
    {
      title: 'Lecture Study Timer',
      description: 'Start your lecture study session',
      icon: Timer,
      color: 'success',
      action: () => onNavigate('timer', 'lecture-study'),
    },
  ];

  const analyticsItems = [
    {
      title: 'Study Records',
      description: 'View all sessions with filters by mode, subject & date',
      icon: BookOpen,
      color: 'primary',
      action: () => onNavigate('records'),
    },
    {
      title: 'Subject Study Time',
      description: 'View time per subject across all modes',
      icon: BarChart3,
      color: 'primary',
      action: () => onNavigate('subject-stats'),
    },
    {
      title: 'Leaderboard',
      description: 'Compare your study time with others',
      icon: Trophy,
      color: 'primary',
      action: () => onNavigate('leaderboard'),
    },
  ];

  const socialItems = [
    {
      title: 'Study Groups',
      description: 'Create or join groups to study together',
      icon: Users,
      color: 'primary',
      action: () => onNavigate('groups'),
    },
  ];

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-between">
            {/* Desktop Navigation */}
            {!isMobile && (
              <>
                <div className="flex items-center gap-2">
                  <TimerButton
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowProfileSettings(true)}
                    className="flex items-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    {userProfile?.username ? 'Profile Settings' : 'Set Username'}
                  </TimerButton>
                </div>
                
                <div className="flex items-center gap-2">
                  <TimerButton
                    variant="secondary"
                    size="sm"
                    onClick={() => onNavigate('notifications')}
                    className="flex items-center gap-2 relative"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadNotifications > 0 && (
                      <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center">
                        {unreadNotifications}
                      </span>
                    )}
                  </TimerButton>

                  <TimerButton
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowFeedback(true)}
                    className="flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Feedback
                  </TimerButton>
                  
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
                
                <div className="flex items-center gap-2">
                  <TimerButton
                    variant="stop"
                    size="sm"
                    onClick={handleLogout}
                    className="flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </TimerButton>
                </div>
              </>
            )}
            
            {/* Mobile Navigation */}
            {isMobile && (
              <>
                <div className="flex items-center gap-2">
                  <TimerButton
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowProfileSettings(true)}
                    className="flex items-center gap-2"
                  >
                    <User className="w-4 h-4" />
                  </TimerButton>
                  <TimerButton
                    variant="secondary"
                    size="sm"
                    onClick={() => onNavigate('notifications')}
                    className="flex items-center gap-2 relative"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadNotifications > 0 && (
                      <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center">
                        {unreadNotifications}
                      </span>
                    )}
                  </TimerButton>
                </div>
                
                <div className="flex items-center gap-2">
                  <TimerButton
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowMobileMenu(!showMobileMenu)}
                    className="flex items-center gap-2"
                  >
                    {showMobileMenu ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                  </TimerButton>
                </div>
              </>
            )}
          </div>
          
          {/* Mobile Menu */}
          {isMobile && showMobileMenu && (
            <Card className="gradient-secondary p-4 mb-4">
              <div className="space-y-3">
                <TimerButton
                  variant="secondary"
                  onClick={() => {
                    onNavigate('groups');
                    setShowMobileMenu(false);
                  }}
                  className="w-full flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Study Groups
                </TimerButton>

                <TimerButton
                  variant="secondary"
                  onClick={() => {
                    onNavigate('leaderboard');
                    setShowMobileMenu(false);
                  }}
                  className="w-full flex items-center gap-2"
                >
                  <Trophy className="w-4 h-4" />
                  Leaderboard
                </TimerButton>
                
                <TimerButton
                  variant="secondary"
                  onClick={() => {
                    setShowFeedback(true);
                    setShowMobileMenu(false);
                  }}
                  className="w-full flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Feedback
                </TimerButton>
                
                <TimerButton
                  variant="secondary"
                  onClick={() => {
                    window.open('https://www.instagram.com/programmer_deepak/', '_blank');
                    setShowMobileMenu(false);
                  }}
                  className="w-full flex items-center gap-2"
                >
                  <Instagram className="w-4 h-4" />
                  Contact Us
                </TimerButton>
                
                <TimerButton
                  variant="stop"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </TimerButton>
              </div>
            </Card>
          )}
          
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
            <GraduationCap className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-primary mb-2">JEE TIMER</h1>
            <div className="space-y-1">
              <p className="text-muted-foreground">
                Welcome back, {userProfile?.name || user?.email || 'Student'}!
              </p>
              {userProfile?.username && (
                <p className="text-sm text-primary">
                  @{userProfile.username}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sync Button */}
        <div className="flex justify-center mb-6">
          <TimerButton
            variant="primary"
            onClick={syncStudyTime}
            disabled={syncing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Study Time'}
          </TimerButton>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="gradient-secondary p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-success/20 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Study Time</p>
                <p className="text-lg font-bold text-foreground">
                  {formatTime(studyStats.selfStudy.totalTime + studyStats.lectureStudy.totalTime)}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="gradient-secondary p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Sessions</p>
                <p className="text-lg font-bold text-foreground">
                  {studyStats.selfStudy.sessions + studyStats.lectureStudy.sessions}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Study Modes */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-success/20 rounded flex items-center justify-center">
                <span className="text-xs font-bold text-success">S</span>
              </div>
              <h2 className="text-xl font-semibold text-foreground">Study Modes</h2>
            </div>
            <div className="grid gap-3">
              {studyModes.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <Card key={index} className="gradient-card card-glow cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]" onClick={item.action}>
                    <div className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-success/20">
                        <IconComponent className="w-6 h-6 text-success" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Analytics & Leaderboard */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-primary/20 rounded flex items-center justify-center">
                <span className="text-xs font-bold text-primary">A</span>
              </div>
              <h2 className="text-xl font-semibold text-foreground">Analytics & Leaderboard</h2>
            </div>
            <div className="grid gap-3">
              {analyticsItems.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <Card key={index} className="gradient-card card-glow cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]" onClick={item.action}>
                    <div className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/20">
                        <IconComponent className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Groups */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-primary/20 rounded flex items-center justify-center">
                <span className="text-xs font-bold text-primary">G</span>
              </div>
              <h2 className="text-xl font-semibold text-foreground">Study Groups</h2>
            </div>
            <div className="grid gap-3">
              {socialItems.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <Card key={index} className="gradient-card card-glow cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]" onClick={item.action}>
                    <div className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/20">
                        <IconComponent className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-4">
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
      
      {/* Profile Settings Modal */}
      <ProfileSettings
        isOpen={showProfileSettings}
        onClose={() => setShowProfileSettings(false)}
      />
      
      {/* Feedback Modal */}
      <Feedback
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
      />
    </div>
  );
};

export default Home;