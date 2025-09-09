import React from 'react';
import { Card } from '@/components/ui/card';
import { TimerButton } from '@/components/ui/timer-button';
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
  Settings
} from 'lucide-react';
import UsernameModal from './UsernameModal';

interface HomeProps {
  onNavigate: (page: string, studyType?: 'self-study' | 'lecture-study') => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const [showUsernameModal, setShowUsernameModal] = React.useState(false);
  const [currentUsername, setCurrentUsername] = React.useState<string | null>(null);
  const userData = storageUtils.getUserData();
  const selfStudyRecords = storageUtils.getRecordsByType('self-study');
  const lectureStudyRecords = storageUtils.getRecordsByType('lecture-study');

  React.useEffect(() => {
    if (userData?.username) {
      setCurrentUsername(userData.username);
    }
  }, [userData]);

  const getSelfStudyStats = () => {
    const totalTime = selfStudyRecords.reduce((sum, record) => sum + record.duration, 0);
    return {
      sessions: selfStudyRecords.length,
      totalTime,
    };
  };

  const getLectureStudyStats = () => {
    const totalTime = lectureStudyRecords.reduce((sum, record) => sum + record.duration, 0);
    return {
      sessions: lectureStudyRecords.length,
      totalTime,
    };
  };

  const selfStats = getSelfStudyStats();
  const lectureStats = getLectureStudyStats();

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
      description: `${selfStats.sessions} sessions • ${formatTime(selfStats.totalTime)}`,
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
      description: `${lectureStats.sessions} sessions • ${formatTime(lectureStats.totalTime)}`,
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
                onClick={() => setShowUsernameModal(true)}
                className="flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                {currentUsername ? 'Change Username' : 'Set Username'}
              </TimerButton>
            </div>
            
            <TimerButton
              variant="secondary"
              onClick={() => onNavigate('leaderboard')}
              className="flex items-center gap-2"
            >
              <Trophy className="w-4 h-4" />
              Leaderboard
            </TimerButton>
          </div>
          
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
            <GraduationCap className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-primary mb-2">JEE TIMER</h1>
            <div className="space-y-1">
              <p className="text-muted-foreground">
                Welcome back, {userData?.name || 'Student'}!
              </p>
              {currentUsername && (
                <p className="text-sm text-primary">
                  @{currentUsername}
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
                  {formatTime(selfStats.totalTime + lectureStats.totalTime)}
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
                  {selfStats.sessions + lectureStats.sessions}
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
          <p className="text-xs text-muted-foreground">
           NOTE- Username and Leaderboard Feature are in Development. It May not Work
          </p>
        </div>
      </div>
      
      {/* Username Modal */}
      <UsernameModal
        isOpen={showUsernameModal}
        onClose={() => setShowUsernameModal(false)}
        onUsernameSet={(username) => setCurrentUsername(username)}
      />
    </div>
  );
};

export default Home;