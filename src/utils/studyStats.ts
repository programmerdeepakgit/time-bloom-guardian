import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const syncStudyTimeToDatabase = async (userId: string) => {
  try {
    // Get study records from local storage
    const selfStudyRecords = JSON.parse(localStorage.getItem('jee-timer-self-study-records') || '[]');
    const lectureStudyRecords = JSON.parse(localStorage.getItem('jee-timer-lecture-study-records') || '[]');
    
    // Calculate total time
    const totalTime = selfStudyRecords.reduce((sum: number, record: any) => sum + record.duration, 0) +
                     lectureStudyRecords.reduce((sum: number, record: any) => sum + record.duration, 0);

    // Update in database
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
    console.error('Error syncing study time:', error);
    return { success: false, error };
  }
};

export const getLocalStudyStats = () => {
  const selfStudyRecords = JSON.parse(localStorage.getItem('jee-timer-self-study-records') || '[]');
  const lectureStudyRecords = JSON.parse(localStorage.getItem('jee-timer-lecture-study-records') || '[]');
  
  return {
    selfStudy: {
      sessions: selfStudyRecords.length,
      totalTime: selfStudyRecords.reduce((sum: number, record: any) => sum + record.duration, 0)
    },
    lectureStudy: {
      sessions: lectureStudyRecords.length,
      totalTime: lectureStudyRecords.reduce((sum: number, record: any) => sum + record.duration, 0)
    }
  };
};