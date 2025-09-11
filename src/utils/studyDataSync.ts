import { supabase } from '@/integrations/supabase/client';
import { storageUtils } from './storage';

export const studyDataSync = {
  // Sync local study data to Supabase
  syncToDatabase: async (userId: string) => {
    try {
      const selfStudyRecords = storageUtils.getRecordsByType('self-study');
      const lectureStudyRecords = storageUtils.getRecordsByType('lecture-study');
      
      const totalTime = selfStudyRecords.reduce((sum, record) => sum + record.duration, 0) +
                       lectureStudyRecords.reduce((sum, record) => sum + record.duration, 0);

      const { error } = await supabase
        .from('users')
        .update({ 
          total_study_time: totalTime,
          updated_at: new Date().toISOString()
        })
        .eq('auth_user_id', userId);
      
      if (error) throw error;
      return { success: true, totalTime };
    } catch (error) {
      console.error('Error syncing to database:', error);
      return { success: false, error };
    }
  },

  // Load study data from database and merge with local
  loadFromDatabase: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('total_study_time')
        .eq('auth_user_id', userId)
        .single();
      
      if (error) throw error;
      return { success: true, totalTime: data?.total_study_time || 0 };
    } catch (error) {
      console.error('Error loading from database:', error);
      return { success: false, error };
    }
  },

  // Auto-sync on login
  autoSyncOnLogin: async (userId: string) => {
    try {
      // Get local data
      const selfStudyRecords = storageUtils.getRecordsByType('self-study');
      const lectureStudyRecords = storageUtils.getRecordsByType('lecture-study');
      const localTotalTime = selfStudyRecords.reduce((sum, record) => sum + record.duration, 0) +
                            lectureStudyRecords.reduce((sum, record) => sum + record.duration, 0);

      // Get database data
      const { data, error } = await supabase
        .from('users')
        .select('total_study_time')
        .eq('auth_user_id', userId)
        .single();
      
      if (error) throw error;
      
      const dbTotalTime = data?.total_study_time || 0;
      
      // Use the higher value (in case user studied on different devices)
      const finalTotalTime = Math.max(localTotalTime, dbTotalTime);
      
      // Update database with the final value
      if (finalTotalTime !== dbTotalTime) {
        await supabase
          .from('users')
          .update({ 
            total_study_time: finalTotalTime,
            updated_at: new Date().toISOString()
          })
          .eq('auth_user_id', userId);
      }
      
      return { success: true, totalTime: finalTotalTime };
    } catch (error) {
      console.error('Error during auto-sync:', error);
      return { success: false, error };
    }
  }
};