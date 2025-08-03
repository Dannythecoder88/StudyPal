import { createClient } from '@supabase/supabase-js';
import { PlantData } from '../app/components/PlantGarden';

const supabaseUrl = 'https://npcqtmuizskijkuexvdn.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wY3F0bXVpenNraWprdWV4dmRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyNDk2MDUsImV4cCI6MjA2OTgyNTYwNX0.UIfBvM1Gm6wqwAm3j6G-SXP2TzDMAjgj6VMBp1PReOg'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test Supabase connection
const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('user_data').select('user_id').limit(1);
    // If the table doesn't exist, RLS can cause an error. We'll treat that as a pass for now.
    if (error && error.code !== '42P01') { 
        console.error('Supabase connection test failed:', error);
        return false;
    }
    return true;
  } catch (e) {
    console.error('Exception during Supabase connection test:', e);
    return false;
  }
};

// Initialize user data on sign up/login
export const initializeUserData = async (userId: string): Promise<UserData> => {
  console.log('Initializing user data for:', userId)
  
  // Test connection first
  const connectionOk = await testSupabaseConnection();
  if (!connectionOk) {
    console.error('❌ Supabase connection failed, returning default data');
    return getDefaultUserData();
  }
  
  return await loadUserData(userId)
}

export interface UserData {
  tasks: any[]
  studyStats: {
    todayMinutes: number
    weeklyMinutes: number
    focusScore: number
    completedTasks: number
  }
  weeklyStudyData: {
    monday: number
    tuesday: number
    wednesday: number
    thursday: number
    friday: number
    saturday: number
    sunday: number
  }
  dailyGoal: {
    hours: number
    minutes: number
  } | null
  plantData: PlantData;
}

// Default user data for new users
const getDefaultUserData = (): UserData => ({
  tasks: [],
  studyStats: {
    todayMinutes: 0,
    weeklyMinutes: 0,
    focusScore: 0,
    completedTasks: 0
  },
  weeklyStudyData: {
    monday: 0,
    tuesday: 0,
    wednesday: 0,
    thursday: 0,
    friday: 0,
    saturday: 0,
    sunday: 0
  },
  dailyGoal: null,
  plantData: {
    name: 'My Plant',
    stage: 'seedling',
  }
})

// Save user data to Supabase
export const saveUserData = async (userId: string, data: UserData) => {
  try {
    console.log('🔥 CRITICAL DEBUG: Starting saveUserData for user:', userId);
    console.log('🔥 CRITICAL DEBUG: Data to save:', JSON.stringify(data, null, 2));
    
    // Test connection first
    const { data: testData, error: testError } = await supabase.from('user_data').select('count').limit(1);
    if (testError) {
      console.error('🔥 CRITICAL: Supabase connection test failed:', testError);
      return false;
    }
    console.log('🔥 CRITICAL: Supabase connection test passed');
    
    // Check if user data already exists
    console.log('🔥 CRITICAL: Checking if user data exists for:', userId);
    const { data: existingData, error: checkError } = await supabase
      .from('user_data')
      .select('user_id')
      .eq('user_id', userId)
      .single();
    
    console.log('🔥 CRITICAL: Existing data check result:', { existingData, checkError });
    
    const dataToSave = {
      user_id: userId,
      data: JSON.stringify(data),
      updated_at: new Date().toISOString()
    };
    
    console.log('🔥 CRITICAL DEBUG: About to save data:', {
      user_id: dataToSave.user_id,
      dataLength: dataToSave.data.length,
      updated_at: dataToSave.updated_at
    });
    
    let result, error;
    
    if (existingData) {
      // Update existing record
      console.log('🔥 CRITICAL: Updating existing record');
      const updateResult = await supabase
        .from('user_data')
        .update({
          data: dataToSave.data,
          updated_at: dataToSave.updated_at
        })
        .eq('user_id', userId)
        .select();
      
      result = updateResult.data;
      error = updateResult.error;
    } else {
      // Insert new record
      console.log('🔥 CRITICAL: Inserting new record');
      const insertResult = await supabase
        .from('user_data')
        .insert(dataToSave)
        .select();
      
      result = insertResult.data;
      error = insertResult.error;
    }
    
    if (error) {
      console.error('🔥 CRITICAL ERROR: Failed to save user data:', error);
      console.error('🔥 CRITICAL ERROR: Error code:', error.code);
      console.error('🔥 CRITICAL ERROR: Error message:', error.message);
      console.error('🔥 CRITICAL ERROR: Error details:', error.details);
      console.error('🔥 CRITICAL ERROR: Error hint:', error.hint);
      return false
    }
    
    console.log('🔥 CRITICAL SUCCESS: User data saved to Supabase!');
    console.log('🔥 CRITICAL SUCCESS: Save result:', result);
    return true
  } catch (error: any) {
    console.error('🔥 CRITICAL EXCEPTION: Exception in saveUserData:', error);
    console.error('🔥 CRITICAL EXCEPTION: Error stack:', error?.stack);
    return false
  }
}

// Load user data from Supabase (creates default data if none exists)
export const loadUserData = async (userId: string): Promise<UserData> => {
  try {
    console.log('🔥 CRITICAL DEBUG: Starting loadUserData for user:', userId);
    
    // Test connection first
    const { data: testData, error: testError } = await supabase.from('user_data').select('count').limit(1);
    if (testError) {
      console.error('🔥 CRITICAL: Supabase connection test failed in loadUserData:', testError);
      throw testError;
    }
    console.log('🔥 CRITICAL: Supabase connection test passed in loadUserData');
    
    // First, try to get existing user data
    console.log('🔥 CRITICAL DEBUG: Querying user_data table for user:', userId);
    const { data, error } = await supabase
      .from('user_data')
      .select('data')
      .eq('user_id', userId)
      .single()
    
    console.log('🔥 CRITICAL DEBUG: Supabase query result:', { 
      hasData: !!data, 
      dataContent: data?.data ? 'DATA_EXISTS' : 'NO_DATA',
      error: error ? { code: error.code, message: error.message } : null 
    });
    
    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected for new users
      console.error('🔥 CRITICAL ERROR: Unexpected error loading user data:', error)
      throw error
    }
    
    if (!data || !data.data) {
      // No data exists for this user, create default data
      // No data exists for this user, return default data without saving it.
      // The main app will handle saving it on the first data change.
      console.log('🔥 CRITICAL: No user data found, returning default data for user:', userId)
      const defaultData = getDefaultUserData()
      return defaultData
    }
    
    // Parse and return existing data
    console.log('🔥 CRITICAL DEBUG: Raw data from Supabase (first 200 chars):', data.data.substring(0, 200));
    const parsedData = JSON.parse(data.data);
    console.log('🔥 CRITICAL SUCCESS: Parsed user data:', {
      tasksCount: parsedData.tasks?.length || 0,
      studyStats: parsedData.studyStats,
      weeklyStudyData: parsedData.weeklyStudyData,
      dailyGoal: parsedData.dailyGoal
    });
    return parsedData
    
  } catch (error) {
    console.error('🔥 CRITICAL EXCEPTION: Error in loadUserData:', error)
    // Return default data as fallback
    const fallbackData = getDefaultUserData();
    console.log('🔥 CRITICAL FALLBACK: Returning fallback data:', fallbackData);
    return fallbackData
  }
}
