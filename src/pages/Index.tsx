import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Login from '@/components/Login';
import Signup from '@/components/Signup';
import Home from '@/components/Home';
import Timer from '@/components/Timer';
import StudyRecords from '@/components/StudyRecords';
import Leaderboard from '@/components/Leaderboard';
import PublicLeaderboard from '@/components/PublicLeaderboard';
import PomodoroTimer from '@/components/PomodoroTimer';
import TargetStudyTimer from '@/components/TargetStudyTimer';
import SubjectStats from '@/components/SubjectStats';

const Index = () => {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [currentStudyType, setCurrentStudyType] = useState<'self-study' | 'lecture-study' | null>(null);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [showPublicLeaderboard, setShowPublicLeaderboard] = useState(false);

  const handleCreateAccount = () => setIsCreatingAccount(true);
  const handleBackToLogin = () => setIsCreatingAccount(false);
  const handleShowPublicLeaderboard = () => setShowPublicLeaderboard(true);
  const handleBackFromPublicLeaderboard = () => setShowPublicLeaderboard(false);

  const handleNavigate = (page: string, studyType?: 'self-study' | 'lecture-study') => {
    setCurrentPage(page);
    if (studyType) setCurrentStudyType(studyType);
  };

  const handleBackToHome = () => {
    setCurrentPage('home');
    setCurrentStudyType(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <span className="text-lg">⏱️</span>
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (showPublicLeaderboard) return <PublicLeaderboard onBack={handleBackFromPublicLeaderboard} />;
    if (isCreatingAccount) return <Signup onBackToLogin={handleBackToLogin} />;
    return <Login onCreateAccount={handleCreateAccount} onShowLeaderboard={handleShowPublicLeaderboard} />;
  }

  switch (currentPage) {
    case 'home':
      return <Home onNavigate={handleNavigate} />;
    case 'timer':
      return currentStudyType ? <Timer studyType={currentStudyType} onBack={handleBackToHome} /> : <Home onNavigate={handleNavigate} />;
    case 'records':
      return currentStudyType ? <StudyRecords studyType={currentStudyType} onBack={handleBackToHome} /> : <Home onNavigate={handleNavigate} />;
    case 'pomodoro':
      return <PomodoroTimer onBack={handleBackToHome} />;
    case 'target-study':
      return <TargetStudyTimer onBack={handleBackToHome} />;
    case 'subject-stats':
      return <SubjectStats onBack={handleBackToHome} />;
    case 'leaderboard':
      return <Leaderboard onBack={handleBackToHome} />;
    default:
      return <Home onNavigate={handleNavigate} />;
  }
};

export default Index;
