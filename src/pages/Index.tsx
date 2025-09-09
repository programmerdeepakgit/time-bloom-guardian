import React, { useState, useEffect } from 'react';
import { storageUtils } from '@/utils/storage';
import { UserData } from '@/types';
import KeyAuth from '@/components/KeyAuth';
import KeyGeneration from '@/components/KeyGeneration';
import Home from '@/components/Home';
import Timer from '@/components/Timer';
import StudyRecords from '@/components/StudyRecords';
import PDFGenerator from '@/components/PDFGenerator';
import Leaderboard from '@/components/Leaderboard';

const Index = () => {
  const [currentPage, setCurrentPage] = useState<string>('auth');
  const [currentStudyType, setCurrentStudyType] = useState<'self-study' | 'lecture-study' | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    const userData = storageUtils.getUserData();
    const appKey = storageUtils.getAppKey();
    
    if (userData && appKey && userData.isVerified) {
      setIsAuthenticated(true);
      setCurrentPage('home');
    }
  }, []);

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
    setCurrentPage('home');
  };

  const handleCreateAccount = () => {
    setIsCreatingAccount(true);
  };

  const handleKeyGenerated = (userData: UserData) => {
    setIsCreatingAccount(false);
    setIsAuthenticated(true);
    setCurrentPage('home');
  };

  const handleNavigate = (page: string, studyType?: 'self-study' | 'lecture-study') => {
    setCurrentPage(page);
    if (studyType) {
      setCurrentStudyType(studyType);
    }
  };

  const handleBackToHome = () => {
    setCurrentPage('home');
    setCurrentStudyType(null);
  };

  // Authentication flow
  if (!isAuthenticated) {
    if (isCreatingAccount) {
      return <KeyGeneration onKeyGenerated={handleKeyGenerated} />;
    }
    return (
      <KeyAuth
        onAuthenticated={handleAuthenticated}
        onCreateAccount={handleCreateAccount}
      />
    );
  }

  // Main app pages
  switch (currentPage) {
    case 'home':
      return <Home onNavigate={handleNavigate} />;
    
    case 'timer':
      return currentStudyType ? (
        <Timer studyType={currentStudyType} onBack={handleBackToHome} />
      ) : (
        <Home onNavigate={handleNavigate} />
      );
    
    case 'records':
      return currentStudyType ? (
        <StudyRecords studyType={currentStudyType} onBack={handleBackToHome} />
      ) : (
        <Home onNavigate={handleNavigate} />
      );
    
    case 'pdf':
      return currentStudyType ? (
        <PDFGenerator studyType={currentStudyType} onBack={handleBackToHome} />
      ) : (
        <Home onNavigate={handleNavigate} />
      );
    
    case 'leaderboard':
      return <Leaderboard onBack={handleBackToHome} />;
    
    default:
      return <Home onNavigate={handleNavigate} />;
  }
};

export default Index;
