import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface LeaderboardEntry {
  id: string;
  username: string;
  total_study_time: number;
  name: string;
  class: string;
  updated_at: string;
}

export const supabaseUtils = {
  // Create user in database
  createUser: async (userData: any) => {
    const { data, error } = await supabase
      .from('users')
      .insert([{
        name: userData.name,
        class: userData.class,
        state: userData.state,
        city: userData.city,
        phone: userData.phone,
        email: userData.email,
        access_key: userData.key,
        username: null,
        total_study_time: 0,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    return { data, error };
  },

  // Update username
  updateUsername: async (accessKey: string, username: string) => {
    const { data, error } = await supabase
      .from('users')
      .update({ username })
      .eq('access_key', accessKey)
      .select()
      .single();
    
    return { data, error };
  },

  // Update total study time
  updateStudyTime: async (accessKey: string, totalTime: number) => {
    const { data, error } = await supabase
      .from('users')
      .update({ 
        total_study_time: totalTime,
        updated_at: new Date().toISOString()
      })
      .eq('access_key', accessKey)
      .select()
      .single();
    
    return { data, error };
  },

  // Get leaderboard data
  getLeaderboard: async (): Promise<{ data: LeaderboardEntry[] | null, error: any }> => {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, total_study_time, name, class, updated_at')
      .not('username', 'is', null)
      .order('total_study_time', { ascending: false })
      .limit(50);
    
    return { data, error };
  },

  // Check if username exists
  checkUsernameExists: async (username: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .single();
    
    return { exists: !!data, error };
  },

  // Get user by access key
  getUserByAccessKey: async (accessKey: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('access_key', accessKey)
      .single();
    
    return { data, error };
  }
};