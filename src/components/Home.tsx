import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { TimerButton } from '@/components/ui/timer-button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { storageUtils } from '@/utils/storage';
import { formatTime } from '@/utils/timer';
import { 
  Timer, 
  BookOpen, 
  FileText, 
  GraduationCap, 
  Clock,
  TrendingUp,
  Trophy,
  User,
  Settings,
  LogOut
} from 'lucide-react';
import ProfileSettings from './ProfileSettings';

interface HomeProps {
  onNavigate: (page: string, studyType?: 'self-study' | 'lecture-study') => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const { user, signOut } = useAuth();
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [studyStats, setStudyStats] = useState({
    selfStudy: { sessions: 0, totalTime: 0 },
    lectureStudy: { sessions: 0, totalTime: 0 }
  });

  // Fetch user profile data from database
  useEffect(() => {
    if (user) {
      fetchUserProfile();
      calculateStudyStats();
    }
  }, [user]);

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

  const calculateStudyStats = () => {
    const selfStudyRecords = storageUtils.getRecordsByType('self-study');
    const lectureStudyRecords = storageUtils.getRecordsByType('lecture-study');
    
    setStudyStats({
      selfStudy: {
        sessions: selfStudyRecords.length,
        totalTime: selfStudyRecords.reduce((sum, record) => sum + record.duration, 0)
      },
      lectureStudy: {
        sessions: lectureStudyRecords.length,
        totalTime: lectureStudyRecords.reduce((sum, record) => sum + record.duration, 0)
      }
    });
  };

  const handleLogout = async () => {
    await signOut();
  };

  const menuItems = [
    // Self Study Options
    {
      title: 'Self Study Timer',
      description: 'Start your self study session',
      icon: Timer,
      color: 'success',
      action: () => onNavigate('timer', 'self-study'),
    },
    {
      title: 'Self Study Records',
      description: `${studyStats.selfStudy.sessions} sessions • ${formatTime(studyStats.selfStudy.totalTime)}`,
      icon: BookOpen,
      color: 'primary',
      action: () => onNavigate('records', 'self-study'),
    },
    {
      title: 'Self Study Report',
      description: 'Generate PDF report',
      icon: FileText,
      color: 'secondary',
      action: () => onNavigate('pdf', 'self-study'),
    },
    // Lecture Study Options
    {
      title: 'Lecture Study Timer',
      description: 'Start your lecture study session',
      icon: Timer,
      color: 'success',
      action: () => onNavigate('timer', 'lecture-study'),
    },
    {
      title: 'Lecture Study Records',
      description: `${studyStats.lectureStudy.sessions} sessions • ${formatTime(studyStats.lectureStudy.totalTime)}`,
      icon: BookOpen,
      color: 'primary',
      action: () => onNavigate('records', 'lecture-study'),
    },
    {
      title: 'Lecture Study Report',
      description: 'Generate PDF report',
      icon: FileText,
      color: 'secondary',
      action: () => onNavigate('pdf', 'lecture-study'),
    },
  ];

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-between">
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
                onClick={() => onNavigate('leaderboard')}
                className="flex items-center gap-2"
              >
                <Trophy className="w-4 h-4" />
                Leaderboard
              </TimerButton>
              
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
          </div>
          
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

        {/* Study Type Sections */}
        <div className="space-y-6">
          {/* Self Study Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-success/20 rounded flex items-center justify-center">
                <span className="text-xs font-bold text-success">S</span>
              </div>
              <h2 className="text-xl font-semibold text-foreground">Self Study</h2>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {menuItems.slice(0, 3).map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <Card
                    key={index}
                    className="gradient-card card-glow cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                    onClick={item.action}
                  >
                    <div className="p-4 flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        item.color === 'success' ? 'bg-success/20' :
                        item.color === 'primary' ? 'bg-primary/20' : 'bg-secondary/20'
                      }`}>
                        <IconComponent className={`w-6 h-6 ${
                          item.color === 'success' ? 'text-success' :
                          item.color === 'primary' ? 'text-primary' : 'text-secondary-foreground'
                        }`} />
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

          {/* Lecture Study Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-primary/20 rounded flex items-center justify-center">
                <span className="text-xs font-bold text-primary">L</span>
              </div>
              <h2 className="text-xl font-semibold text-foreground">Lecture Study</h2>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {menuItems.slice(3, 6).map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <Card
                    key={index + 3}
                    className="gradient-card card-glow cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                    onClick={item.action}
                  >
                    <div className="p-4 flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        item.color === 'success' ? 'bg-success/20' :
                        item.color === 'primary' ? 'bg-primary/20' : 'bg-secondary/20'
                      }`}>
                        <IconComponent className={`w-6 h-6 ${
                          item.color === 'success' ? 'text-success' :
                          item.color === 'primary' ? 'text-primary' : 'text-secondary-foreground'
                        }`} />
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
            Made by programmer_deepak
          </p>
        </div>
      </div>
      
      {/* Profile Settings Modal */}
      <ProfileSettings
        isOpen={showProfileSettings}
        onClose={() => setShowProfileSettings(false)}
      />
    </div>
  );
};

export default Home;