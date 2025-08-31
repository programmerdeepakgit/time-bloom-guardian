import { StudyRecord, UserData } from '@/types';

const STORAGE_KEYS = {
  USER_DATA: 'jee_timer_user_data',
  STUDY_RECORDS: 'jee_timer_study_records',
  APP_KEY: 'jee_timer_app_key',
} as const;

export const storageUtils = {
  // User Data
  saveUserData: (userData: UserData): void => {
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
  },

  getUserData: (): UserData | null => {
    const data = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    return data ? JSON.parse(data) : null;
  },

  // Study Records
  saveStudyRecord: (record: StudyRecord): void => {
    const existingRecords = storageUtils.getStudyRecords();
    const updatedRecords = [record, ...existingRecords];
    localStorage.setItem(STORAGE_KEYS.STUDY_RECORDS, JSON.stringify(updatedRecords));
  },

  getStudyRecords: (): StudyRecord[] => {
    const data = localStorage.getItem(STORAGE_KEYS.STUDY_RECORDS);
    return data ? JSON.parse(data) : [];
  },

  getRecordsByType: (type: 'self-study' | 'lecture-study'): StudyRecord[] => {
    return storageUtils.getStudyRecords().filter(record => record.type === type);
  },

  // App Key
  saveAppKey: (key: string): void => {
    localStorage.setItem(STORAGE_KEYS.APP_KEY, key);
  },

  getAppKey: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.APP_KEY);
  },

  // Clear all data
  clearAllData: (): void => {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  },
};