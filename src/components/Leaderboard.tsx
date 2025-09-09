import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { TimerButton } from '@/components/ui/timer-button';
import { supabaseUtils, LeaderboardEntry } from '@/utils/supabase';
import { storageUtils } from '@/utils/storage';
import { formatTime } from '@/utils/timer';
import { useToast } from '@/hooks/use-toast';
import { 
  Trophy, 
  Medal, 
  Award, 
  RefreshCw, 
  ArrowLeft, 
  Crown,
  TrendingUp,
  Users
} from 'lucide-react';

interface LeaderboardProps {
  onBack: () => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ onBack }) => {
  const { toast } = useToast();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const userData = storageUtils.getUserData();

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabaseUtils.getLeaderboard();
      if (error) throw error;
      setLeaderboardData(data || []);
    } catch (error) {
      toast({
        title: "Error Loading Leaderboard",
        description: "Failed to fetch leaderboard data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const syncStudyTime = async () => {
    if (!userData?.key) return;
    
    setSyncing(true);
    try {
      // Calculate total study time from local records
      const selfStudyRecords = storageUtils.getRecordsByType('self-study');
      const lectureStudyRecords = storageUtils.getRecordsByType('lecture-study');
      const totalTime = selfStudyRecords.reduce((sum, record) => sum + record.duration, 0) +
                       lectureStudyRecords.reduce((sum, record) => sum + record.duration, 0);

      const { error } = await supabaseUtils.updateStudyTime(userData.key, totalTime);
      if (error) throw error;

      toast({
        title: "Update Successful!",
        description: "Your study time has been updated on the leaderboard.",
      });

      // Refresh leaderboard after sync
      await fetchLeaderboard();
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update your study time. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Trophy className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <Award className="w-6 h-6 text-muted-foreground" />;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-yellow-500/30';
      case 2:
        return 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/30';
      case 3:
        return 'bg-gradient-to-r from-amber-600/20 to-amber-700/20 border-amber-600/30';
      default:
        return 'gradient-card';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <Trophy className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <TimerButton
            variant="secondary"
            size="sm"
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </TimerButton>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold text-primary">Leaderboard</h1>
            <p className="text-sm text-muted-foreground">Top JEE Timer Users</p>
          </div>
          
          <TimerButton
            variant="secondary"
            size="sm"
            onClick={syncStudyTime}
            disabled={syncing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Updating...' : 'Update'}
          </TimerButton>
        </div>

        {/* Stats Card */}
        <Card className="gradient-secondary p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Active Users</p>
              <p className="text-lg font-bold text-foreground">{leaderboardData.length}</p>
            </div>
          </div>
        </Card>

        {/* Leaderboard */}
        {leaderboardData.length === 0 ? (
          <Card className="gradient-card p-8 text-center">
            <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Users Yet</h3>
            <p className="text-muted-foreground">
              Be the first to set a username and appear on the leaderboard!
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {leaderboardData.map((user, index) => {
              const rank = index + 1;
              const isCurrentUser = userData?.key && leaderboardData.find(u => 
                u.username === userData.name // This would need to be updated to match by access key
              );
              
              return (
                <Card
                  key={user.id}
                  className={`${getRankColor(rank)} ${
                    isCurrentUser ? 'ring-2 ring-primary/50' : ''
                  } p-4 transition-all hover:scale-[1.01]`}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank & Icon */}
                    <div className="flex items-center gap-3">
                      <div className="text-2xl font-bold text-foreground min-w-[2rem] text-center">
                        {rank}
                      </div>
                      {getRankIcon(rank)}
                    </div>

                    {/* User Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-foreground">{user.username}</h3>
                        {isCurrentUser && (
                          <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {user.name} • {user.class}
                      </p>
                    </div>

                    {/* Study Time */}
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-success" />
                        <span className="text-lg font-bold text-foreground">
                          {formatTime(user.total_study_time)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Total Study Time
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-4">
          <p className="text-xs text-muted-foreground">
            Made by programmer_deepak
          </p>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;