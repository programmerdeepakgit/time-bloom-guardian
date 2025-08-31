export interface StudyRecord {
  id: string;
  type: 'self-study' | 'lecture-study';
  subject: 'physics' | 'chemistry' | 'maths' | 'mixed';
  startTime: Date;
  endTime: Date;
  duration: number; // in seconds
  date: string;
}

export interface UserData {
  name: string;
  class: string;
  state: string;
  city: string;
  phone: string;
  email: string;
  isVerified: boolean;
  key: string;
}

export interface TimerState {
  isRunning: boolean;
  startTime: Date | null;
  elapsedTime: number; // in seconds
  currentSubject: 'physics' | 'chemistry' | 'maths' | 'mixed';
}