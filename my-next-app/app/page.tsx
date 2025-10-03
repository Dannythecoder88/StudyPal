'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  BookOpen, 
  Clock, 
  Target, 
  TrendingUp, 
  Calendar,
  Play,
  Pause,
  RotateCcw,
  Plus,
  CheckCircle,
  AlertCircle,
  Bot,
  Settings,
  Sprout,
  Trash2,
  ExternalLink
} from 'lucide-react';
import AddTaskModal from './components/AddTaskModal';
import AIChat from './components/AIChat';
import Recommendations from './components/AIRecommendations';
import SettingsModal from './components/SettingsModal';
import SmartStudyTimer from './components/FocusSession';
import PlantGarden, { PlantData, PlantStage } from './components/PlantGarden';
import AuthModal from './components/AuthModal';
import GoogleClassroomConnect from './components/GoogleClassroomConnect';
import { supabase, saveUserData, loadUserData, initializeUserData, UserData, saveWeeklyStudyData, getWeeklyStudyHistory, WeeklyStudyRecord } from '../lib/supabase';

interface Task {
  id: number;
  title: string;
  subject: string;
  dueDate: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  completed: boolean;
  daysUntilDue?: number;
}

export default function StudyPal() {
  const defaultPlantData: PlantData = { name: 'My Plant', stage: 'seedling' };
  const [studyStats, setStudyStats] = useState({
    todayMinutes: 0,
    weeklyMinutes: 0,
    focusScore: 0,
    completedTasks: 0
  });

  const [tasks, setTasks] = useState<Task[]>([]);
  const [studyGoal, setStudyGoal] = useState(0); // in minutes
  const [goalHoursInput, setGoalHoursInput] = useState(0);
  const [goalMinutesInput, setGoalMinutesInput] = useState(0);
  const [liveElapsedSeconds, setLiveElapsedSeconds] = useState(0);
  const [liveBlockElapsedSeconds, setLiveBlockElapsedSeconds] = useState(0);

  // Weekly study data - tracks actual study time per day
  const [weeklyStudyData, setWeeklyStudyData] = useState({
    monday: 0,
    tuesday: 0,
    wednesday: 0,
    thursday: 0,
    friday: 0,
    saturday: 0,
    sunday: 0
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPlantGardenOpen, setIsPlantGardenOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isGoogleClassroomOpen, setIsGoogleClassroomOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [colorMode, setColorMode] = useState<'light' | 'dark'>('light');
  const [isHydrated, setIsHydrated] = useState(false);
  const [plantData, setPlantData] = useState<PlantData>(defaultPlantData);

  // Historical weekly data state
  const [weeklyHistory, setWeeklyHistory] = useState<WeeklyStudyRecord[]>([]);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0); // 0 = current week, 1 = last week, etc.
  const [isLoadingWeeklyData, setIsLoadingWeeklyData] = useState(false);

  // Utility functions for localStorage operations
  const saveToLocalStorage = (key: string, data: any) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, JSON.stringify(data));
        console.log(`Saved ${key}:`, data);
      } catch (error) {
        console.error(`Error saving ${key}:`, error);
      }
    }
  };

  const loadFromLocalStorage = (key: string, defaultValue: any = null) => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(key);
        if (saved) {
          const parsed = JSON.parse(saved);
          console.log(`Loaded ${key}:`, parsed);
          return parsed;
        }
      } catch (error) {
        console.error(`Error loading ${key}:`, error);
      }
    }
    return defaultValue;
  };

  // Check for existing auth session and load data
  useEffect(() => {
    setIsHydrated(true);
    
    console.log('🚀 Initializing app and checking authentication...');
    
    // Single session check on mount
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting session:', error);
          loadDataFromLocalStorage();
          return;
        }
        
        if (session?.user) {
          console.log('✅ Found existing session for:', session.user.email);
          setUser(session.user);
          await loadUserDataFromSupabase(session.user.id);
        } else {
          console.log('ℹ️ No existing session, showing blank state');
          // Don't load localStorage for signed-out users - show blank state
        }
      } catch (error) {
        console.error('❌ Exception during auth initialization:', error);
        loadDataFromLocalStorage();
      }
    };
    
    initializeAuth();
    
    // Set up auth state change listener
    console.log('🔄 Setting up auth state listener');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state change:', event, session?.user?.email || 'No user');
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('✅ User signed in, loading data for:', session.user.id);
        setUser(session.user);
        await loadUserDataFromSupabase(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        console.log('🚪 User signed out, clearing data');
        setUser(null);
        clearAllData();
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);
  
  const loadDataFromLocalStorage = () => {
    const savedTasks = localStorage.getItem('studypal-tasks');
    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks));
      } catch (error) {
        console.error('Error loading tasks:', error);
      }
    }
    
    const savedStats = localStorage.getItem('studypal-stats');
    if (savedStats) {
      try {
        setStudyStats(JSON.parse(savedStats));
      } catch (error) {
        console.error('Error loading study stats:', error);
      }
    }
    
    const savedGoal = localStorage.getItem('studypal-daily-goal');
    if (savedGoal) {
      try {
        setStudyGoal(JSON.parse(savedGoal));
      } catch (error) {
        console.error('Error loading daily goal:', error);
      }
    }
    
    const savedColorMode = localStorage.getItem('studypal-color-mode');
    if (savedColorMode) {
      setColorMode(savedColorMode as 'light' | 'dark');
    }
  };
  
  // Load weekly history data from Supabase
  const loadWeeklyHistoryData = async (userId: string) => {
    try {
      setIsLoadingWeeklyData(true);
      console.log('📊 Loading weekly history data for user:', userId);
      
      const history = await getWeeklyStudyHistory(userId, 12); // Get last 12 weeks
      setWeeklyHistory(history);
      
      console.log(`✅ Loaded ${history.length} weeks of study history`);
    } catch (error) {
      console.error('❌ Failed to load weekly history:', error);
      setWeeklyHistory([]);
    } finally {
      setIsLoadingWeeklyData(false);
    }
  };
  
  const loadUserDataFromSupabase = async (userId: string) => {
    try {
      console.log('🔄 CRITICAL: Loading ALL user data for:', userId);
      
      // First clear any existing data to ensure clean state
      console.log('🧹 Clearing existing data before loading from Supabase...');
      
      const userData = await initializeUserData(userId);
      console.log('📦 CRITICAL: Received user data from Supabase:', userData);
      
      if (!userData) {
        console.error('❌ No user data received from Supabase!');
        return;
      }
      
      // Load ALL user data into app state with verification
      console.log('📝 CRITICAL: Setting tasks - Count:', userData.tasks?.length || 0);
      setTasks(userData.tasks || []);
      
      console.log('📊 CRITICAL: Setting study stats:', userData.studyStats);
      const statsToSet = userData.studyStats || { todayMinutes: 0, weeklyMinutes: 0, focusScore: 0, completedTasks: 0 };
      setStudyStats(statsToSet);
      
      // Load weekly study data - CRITICAL for weekly overview
      console.log('📅 CRITICAL: Setting weekly data:', userData.weeklyStudyData);
      const weeklyToSet = userData.weeklyStudyData || {
        monday: 0, tuesday: 0, wednesday: 0, thursday: 0,
        friday: 0, saturday: 0, sunday: 0
      };
      setWeeklyStudyData(weeklyToSet);
      
      // Load daily goal - CRITICAL for study goal persistence
      if (userData.dailyGoal) {
        const goalMinutes = userData.dailyGoal.hours * 60 + userData.dailyGoal.minutes;
        console.log('🎯 CRITICAL: Setting daily goal:', goalMinutes, 'minutes');
        setStudyGoal(goalMinutes);
        setGoalHoursInput(userData.dailyGoal.hours);
        setGoalMinutesInput(userData.dailyGoal.minutes);
      } else {
        console.log('🎯 CRITICAL: No daily goal found, setting to 0');
        setStudyGoal(0);
        setGoalHoursInput(0);
        setGoalMinutesInput(0);
      }

      // Load plant data
      console.log('🌱 CRITICAL: Setting plant data:', userData.plantData);
      setPlantData(userData.plantData || defaultPlantData);
      
      // Load weekly history data
      await loadWeeklyHistoryData(userId);
      
      console.log('✅ CRITICAL: ALL user data loaded successfully!');
      console.log('✅ Final state:', {
        tasks: userData.tasks?.length || 0,
        studyStats: statsToSet,
        weeklyData: weeklyToSet,
        dailyGoal: userData.dailyGoal
      });
      
    } catch (error) {
      console.error('❌ CRITICAL ERROR: Failed to load user data:', error);
      console.error('❌ Error details:', error instanceof Error ? error.message : 'Unknown error');
      // On error, don't clear data - keep what we have
    }
  };
  
  const clearAllData = () => {
    console.log('🧹 Clearing ALL local data and resetting app state...');
    
    // Clear all React state
    setTasks([]);
    setStudyStats({ todayMinutes: 0, weeklyMinutes: 0, focusScore: 0, completedTasks: 0 });
    setWeeklyStudyData({
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0,
      sunday: 0
    });
    
    // Clear study goal completely
    setStudyGoal(0);
    setGoalHoursInput(0);
    setGoalMinutesInput(0);
    
    // Reset plant data
    setPlantData(defaultPlantData);
    
    // Plant data will be cleared via localStorage.clear()
    
    // Clear ALL localStorage when signed out
    localStorage.clear(); // Clear everything to ensure no data persists
    
    console.log('✅ All data cleared - app is now in blank state');
  };
  
  const handleSignOut = async () => {
    console.log('🚪 Signing out and clearing ALL data...');
    
    try {
      // First, clear all local data and state
      clearAllData();
      
      // Clear user state immediately
      setUser(null);
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Force a complete reset by reloading the page
      window.location.reload();
      
    } catch (error) {
      console.error('❌ Error during sign out:', error);
      // Even if there's an error, clear everything locally
      clearAllData();
      setUser(null);
      window.location.reload();
    }
  };
  
  const handleAuthSuccess = async (authUser: any) => {
    console.log('🔐 CRITICAL: User signed in successfully:', authUser.email);
    
    try {
      // Set user first
      setUser(authUser);
      
      // CRITICAL: Load ALL user data from Supabase immediately
      console.log('📥 CRITICAL: Loading user data from Supabase...');
      await loadUserDataFromSupabase(authUser.id);
      
      console.log('✅ CRITICAL: Authentication and data loading complete!');
      
      // CRITICAL: Test immediate sync after login to verify save functionality
      console.log('🧪 CRITICAL TEST: Testing immediate sync after login...');
      setTimeout(() => {
        console.log('🧪 CRITICAL TEST: Current state after login:', {
          tasksCount: tasks.length,
          studyStats,
          weeklyStudyData,
          studyGoal
        });
        syncUserData();
      }, 1000);
      
    } catch (error) {
      console.error('❌ CRITICAL ERROR during auth success:', error);
      // Even if data loading fails, keep user signed in
      setUser(authUser);
    }
  };
  
  // Sync data to Supabase when user is signed in
  const syncUserData = async () => {
    if (!user) {
      console.log('🔥 CRITICAL: syncUserData called but no user signed in');
      return;
    }
    
    console.log('🔥 CRITICAL DEBUG: Starting syncUserData for user:', user.email);
    console.log('🔥 CRITICAL DEBUG: Current app state:', {
      tasksCount: tasks.length,
      tasks: tasks,
      studyStats: studyStats,
      weeklyStudyData: weeklyStudyData,
      studyGoal: studyGoal
    });
    
    const userData: UserData = {
      tasks,
      studyStats,
      weeklyStudyData,
      dailyGoal: studyGoal > 0 ? {
        hours: goalHoursInput,
        minutes: goalMinutesInput
      } : null,
      plantData: plantData
    };
    
    console.log('🔥 CRITICAL DEBUG: UserData object to sync:', JSON.stringify(userData, null, 2));
    
    const success = await saveUserData(user.id, userData);
    console.log('🔥 CRITICAL DEBUG: Sync result:', success ? 'SUCCESS' : 'FAILED');
    
    // Also save current week's study data to weekly history table
    if (success) {
      console.log('📅 Saving current week study data to weekly history...');
      const weeklySuccess = await saveWeeklyStudyData(user.id, weeklyStudyData);
      console.log('📅 Weekly data save result:', weeklySuccess ? 'SUCCESS' : 'FAILED');
      
      // Reload weekly history to include the updated data
      if (weeklySuccess) {
        await loadWeeklyHistoryData(user.id);
      }
    }
  };
  
  // Sync data whenever ANY user data changes - CRITICAL for data persistence
  // Only sync if user is authenticated and we're not in the initial loading phase
  useEffect(() => {
    if (user && isHydrated) {
      const handler = setTimeout(() => {
        console.log('🔄 Debounced sync triggered by data change.');
        syncUserData();
      }, 1000); // Debounce sync by 1 second

      return () => {
        clearTimeout(handler);
      };
    }
  }, [tasks, studyStats, weeklyStudyData, studyGoal, plantData, user, isHydrated]);

  // CRITICAL: Handle hydration and authentication state
  // When signed in: ONLY use Supabase data (no localStorage)
  // When signed out: Show completely blank state
  useEffect(() => {
    setIsHydrated(true);
    
    if (user) {
      // CRITICAL: When signed in, ONLY load data from Supabase
      // Do NOT load from localStorage - this causes data conflicts
      console.log('🔐 User is signed in - data will be loaded from Supabase only');
      loadUserDataFromSupabase(user.id);
    } else {
      // CRITICAL: When signed out, ensure completely blank state
      console.log('🚪 User is signed out - showing blank state');
      clearAllData();
    }
    
    const savedColorMode = loadFromLocalStorage('studypal-color-mode', 'light');
    if (savedColorMode) {
      setColorMode(savedColorMode);
      document.documentElement.classList.toggle('dark', savedColorMode === 'dark');
    }
  }, [user]);

  // CRITICAL: When signed in, do NOT use localStorage - only Supabase
  // Data persistence is handled by the Supabase sync useEffect above
  // No localStorage operations needed for authenticated users
  
  useEffect(() => {
    if (isHydrated) {
      document.documentElement.classList.toggle('dark', colorMode === 'dark');
      saveToLocalStorage('studypal-color-mode', colorMode);
    }
  }, [colorMode, isHydrated]);


  // Live Focus Score Calculation - only update when there's actual progress
  useEffect(() => {
    if (isHydrated && (liveElapsedSeconds > 0 || liveBlockElapsedSeconds > 0)) {
      let newScore;
      if (studyGoal > 0) {
        newScore = Math.round((liveElapsedSeconds / (studyGoal * 60)) * 100);
      } else {
        const thirtyMinutesInSeconds = 30 * 60;
        newScore = thirtyMinutesInSeconds > 0 ? Math.round((liveBlockElapsedSeconds / thirtyMinutesInSeconds) * 100) : 0;
      }
      newScore = Math.min(newScore, 100);
      
      // Only update if the score has actually changed and there's progress
      setStudyStats(prev => {
        if (prev.focusScore !== newScore) {
          const newStats = { ...prev, focusScore: newScore };
          console.log('Focus score updated:', newScore, '%');
          // Save immediately when focus score changes
          saveToLocalStorage('studypal-study-stats', newStats);
          return newStats;
        }
        return prev;
      });
    }
  }, [studyGoal, liveElapsedSeconds, liveBlockElapsedSeconds, isHydrated]);

  // Function to update study time from FocusSession
  const handleUpdateStudyTime = (minutes: number) => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    const newStats = { ...studyStats, todayMinutes: studyStats.todayMinutes + minutes };
    const newWeeklyData = {
      ...weeklyStudyData,
      [today]: weeklyStudyData[today as keyof typeof weeklyStudyData] + minutes
    };
    
    console.log('Updating study time:', { minutes, newStats, newWeeklyData });
    setStudyStats(newStats);
    setWeeklyStudyData(newWeeklyData);
    
    // Data will be automatically synced to Supabase via useEffect for authenticated users
    // No localStorage needed - Supabase handles all persistence
  };

  const handleSetStudyGoal = () => {
    const totalMinutes = goalHoursInput * 60 + goalMinutesInput;
    setStudyGoal(totalMinutes);
    // Data will be automatically synced to Supabase via useEffect
  };

  // Calculate total weekly minutes
  useEffect(() => {
    const totalWeeklyMinutes = Object.values(weeklyStudyData).reduce((sum, minutes) => sum + minutes, 0);
    setStudyStats(prev => ({ ...prev, weeklyMinutes: totalWeeklyMinutes }));
  }, [weeklyStudyData]);

  const handleProgressUpdate = useCallback((seconds: number) => {
    // This function can be used to trigger saves or other actions
    // console.log(`Total elapsed study time: ${seconds} seconds`);
  }, []);  

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDueDate = (dueDate: string, daysUntilDue: number) => {
    if (daysUntilDue < 0) return 'Overdue';
    if (daysUntilDue === 0) return 'Due today';
    if (daysUntilDue === 1) return 'Due tomorrow';
    if (daysUntilDue <= 7) return `Due in ${daysUntilDue} days`;
    return new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getDueDateColor = (daysUntilDue: number) => {
    if (daysUntilDue < 0) return 'text-red-600';
    if (daysUntilDue <= 1) return 'text-red-500';
    if (daysUntilDue <= 3) return 'text-orange-500';
    if (daysUntilDue <= 7) return 'text-yellow-600';
    return 'text-green-600';
  };

  const handleAddTask = (newTask: Omit<Task, 'id' | 'completed'>) => {
    const newTaskWithId = { ...newTask, id: Date.now(), completed: false };
    const updatedTasks = [...tasks, newTaskWithId];
    setTasks(updatedTasks);
    // Direct save to ensure immediate persistence
    saveToLocalStorage('studypal-tasks', updatedTasks);
  };

  const toggleTaskCompletion = (taskId: number) => {
    let wasCompleted = false;
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        wasCompleted = task.completed;
        return { ...task, completed: !task.completed };
      }
      return task;
    });
    setTasks(updatedTasks);
    // Data will be automatically synced to Supabase via useEffect

    // Update completed tasks count
    const newStats = {
      ...studyStats,
      completedTasks: wasCompleted 
        ? Math.max(0, studyStats.completedTasks - 1)
        : studyStats.completedTasks + 1
    };
    setStudyStats(newStats);
    // Data will be automatically synced to Supabase via useEffect
  };

  const deleteTask = (taskId: number) => {
    const taskToDelete = tasks.find(task => task.id === taskId);
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    
    // If deleting a completed task, decrease completed count
    if (taskToDelete?.completed) {
      setStudyStats(prev => ({
        ...prev,
        completedTasks: Math.max(0, prev.completedTasks - 1)
      }));
    }
    
    setTasks(updatedTasks);
    // Data will be automatically synced to Supabase via useEffect
  };

  const groupedTasks = tasks.reduce((groups, task) => {
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    let priority = 'low';
    if (daysUntilDue <= 1) priority = 'urgent';
    else if (daysUntilDue <= 3) priority = 'high';
    else if (daysUntilDue <= 7) priority = 'medium';
    
    if (!groups[priority]) groups[priority] = [];
    groups[priority].push({ ...task, daysUntilDue });
    return groups;
  }, {} as { [key: string]: Task[] });

  Object.keys(groupedTasks).forEach(priority => {
    groupedTasks[priority].sort((a, b) => (a.daysUntilDue ?? 0) - (b.daysUntilDue ?? 0));
  });

  return (
    <div className={colorMode === 'dark' ? 'bg-black text-white min-h-screen' : 'min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100'}>
      <header className={`shadow-sm border-b ${colorMode === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-8 w-8 text-primary-600" />
              <span className="text-2xl font-bold text-primary-700">StudyPal</span>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <>
                  <button className="btn-secondary" onClick={() => setIsPlantGardenOpen(true)}>
                    <Sprout className="h-4 w-4 mr-2" />
                    Your Plant
                  </button>
                  <button className="btn-secondary" onClick={() => setIsAIChatOpen(true)}>
                    <Bot className="h-4 w-4 mr-2" />
                    AI Assistant
                  </button>
                </>
              )}
              <button className="btn-secondary" onClick={() => setIsSettingsOpen(true)}>
                <Settings className="h-5 w-5" />
              </button>
              {user && (
                <button 
                  className="btn-secondary" 
                  onClick={() => setIsGoogleClassroomOpen(true)}
                  title="Connect Google Classroom"
                >
                  <ExternalLink className="h-5 w-5" />
                </button>
              )}
              {user ? (
                <>
                  <button 
                    onClick={handleSignOut}
                    className="btn-secondary text-red-600 hover:text-red-700"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setIsAuthModalOpen(true)}
                  className="btn-secondary"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-3">
            {/* Signed in status */}
            {user && (
              <div className="mb-4 text-center">
                <p className="text-sm text-gray-600">
                  Signed in as: <span className="font-medium text-gray-900">{user.email}</span>
                </p>
              </div>
            )}
            
            <div className="card">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Daily Study Goal</h2>
              <div className="flex items-center space-x-2">
                <input 
                  type="number" 
                  min="0"
                  value={goalHoursInput}
                  onChange={(e) => setGoalHoursInput(Number(e.target.value))}
                  className="input w-20 text-black"
                  placeholder="Hours"
                />
                <span className="text-gray-700">hr</span>
                <input 
                  type="number" 
                  min="0"
                  max="59"
                  value={goalMinutesInput}
                  onChange={(e) => setGoalMinutesInput(Number(e.target.value))}
                  className="input w-20 text-black"
                  placeholder="Min"
                />
                <span className="text-gray-700">min</span>
                <button onClick={handleSetStudyGoal} className="btn-primary ml-auto">Set Goal</button>
              </div>
              {studyGoal > 0 && (
                <div className="mt-4">
                  <p className="text-gray-700">Your goal is to study for <strong>{Math.floor(studyGoal / 60)}h {studyGoal % 60}m</strong> today.</p>
                  <p className="text-gray-700">Progress: <strong>{Math.floor(studyStats.todayMinutes / 60)}h {studyStats.todayMinutes % 60}m</strong> of {Math.floor(studyGoal / 60)}h {studyGoal % 60}m</p>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                    <div 
                      className="bg-primary-600 h-2.5 rounded-full"
                      style={{ width: `${studyGoal > 0 ? Math.min((studyStats.todayMinutes / studyGoal) * 100, 100) : 0}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <SmartStudyTimer
              onStudyTime={handleUpdateStudyTime}
              onProgressUpdate={setLiveElapsedSeconds}
              onBlockProgressUpdate={setLiveBlockElapsedSeconds}
              colorMode={colorMode}
              title="Focus Session Now"
              studyGoal={studyGoal}
            />

            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Today's Progress</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-primary-600 mr-3" />
                    <span className="text-gray-700">Study Time</span>
                  </div>
                  <span className="font-semibold text-gray-900">{studyStats.todayMinutes} min</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <TrendingUp className="h-5 w-5 text-success-600 mr-3" />
                    <span className="text-gray-700">Focus Score</span>
                  </div>
                  <span className="font-semibold text-gray-900">{studyStats.focusScore}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-info-600 mr-3" />
                    <span className="text-gray-700">Tasks Completed</span>
                  </div>
                  <span className="font-semibold text-gray-900">{studyStats.completedTasks}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Task List</h2>
                <button 
                  onClick={() => setIsModalOpen(true)} 
                  className="btn-primary whitespace-nowrap flex items-center"
                >
                  Add New Task
                  <Plus className="h-4 w-4 ml-2" />
                </button>
              </div>
              <div className="space-y-4">
                {tasks.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">You have no tasks. Add one to get started!</p>
                  </div>
                ) : (
                  Object.entries(groupedTasks).map(([priority, tasks]) => (
                    <div key={priority}>
                      <h3 className={`text-lg font-semibold mb-2 capitalize ${getPriorityColor(priority).replace('bg', 'text')}`}>
                        {priority}
                      </h3>
                      {tasks.map(task => (
                        <div key={task.id} className={`flex items-center justify-between p-3 rounded-lg mb-2 ${task.completed ? 'bg-gray-100' : 'bg-white'}`}>
                          <div className="flex items-center">
                            <button onClick={() => toggleTaskCompletion(task.id)} className="mr-4">
                              {task.completed ? (
                                <CheckCircle className="h-6 w-6 text-green-500" />
                              ) : (
                                <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
                              )}
                            </button>
                            <div className="text-gray-900">
                              <h3 className={`font-medium ${
                                task.completed ? 'text-green-700 line-through' : 'text-gray-900'
                              }`}>
                                {task.title}
                              </h3>
                              <div className="flex items-center space-x-2 mt-1">
                                <p className="text-sm text-gray-600">{task.subject}</p>
                                <span className="text-gray-400">•</span>
                                <p className={`text-sm font-medium ${getDueDateColor(task.daysUntilDue ?? 0)}`}>
                                  {formatDueDate(task.dueDate, task.daysUntilDue ?? 0)}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              task.completed ? 'bg-green-100 text-green-800' : getPriorityColor(task.priority)
                            }`}>
                              {task.priority}
                            </span>
                            <button
                              onClick={() => deleteTask(task.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors p-1"
                              title="Delete task"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* AI Recommendations */}
            <Recommendations />

            {/* Weekly Overview */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Weekly Overview</h2>
                {user && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentWeekOffset(Math.min(currentWeekOffset + 1, weeklyHistory.length - 1))}
                      disabled={currentWeekOffset >= weeklyHistory.length - 1 || isLoadingWeeklyData}
                      className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Previous week"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <span className="text-sm text-gray-600 min-w-[100px] text-center">
                      {currentWeekOffset === 0 ? 'This Week' : 
                       currentWeekOffset === 1 ? 'Last Week' : 
                       `${currentWeekOffset} weeks ago`}
                    </span>
                    <button
                      onClick={() => setCurrentWeekOffset(Math.max(currentWeekOffset - 1, 0))}
                      disabled={currentWeekOffset <= 0 || isLoadingWeeklyData}
                      className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Next week"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              
              {isLoadingWeeklyData ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-gray-500">Loading weekly data...</div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-7 gap-2">
                    {[
                      { day: 'monday', label: 'Mon' },
                      { day: 'tuesday', label: 'Tue' },
                      { day: 'wednesday', label: 'Wed' },
                      { day: 'thursday', label: 'Thu' },
                      { day: 'friday', label: 'Fri' },
                      { day: 'saturday', label: 'Sat' },
                      { day: 'sunday', label: 'Sun' }
                    ].map(({ day, label }) => {
                      // Get data for the selected week
                      let displayData = weeklyStudyData;
                      if (user && currentWeekOffset > 0 && weeklyHistory[currentWeekOffset - 1]) {
                        displayData = weeklyHistory[currentWeekOffset - 1].study_data;
                      }
                      
                      const isToday = currentWeekOffset === 0 && new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() === day;
                      const studyMinutes = displayData[day as keyof typeof displayData] || 0;
                      const maxHeight = Math.max(...Object.values(displayData), 60); // At least 60px height
                      const heightPercentage = maxHeight > 0 ? (studyMinutes / maxHeight) * 100 : 0;
                      
                      return (
                        <div key={day} className="text-center">
                          <div className={`text-sm font-medium mb-2 ${
                            isToday ? 'text-primary-600 font-semibold' : 'text-gray-600'
                          }`}>
                            {label}
                            {isToday && <span className="text-xs text-primary-500 block">Today</span>}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-20 relative">
                            <div 
                              className={`rounded-full absolute bottom-0 w-full transition-all duration-1000 ${
                                studyMinutes > 0 ? 'bg-primary-500' : 'bg-gray-300'
                              }`}
                              style={{ 
                                height: `${Math.max(heightPercentage, 5)}%`,
                              }}
                            />
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {studyMinutes}m
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Weekly Summary */}
                  {user && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Total for this week:</span>
                        <span className="font-semibold text-gray-900">
                          {(() => {
                            let displayData = weeklyStudyData;
                            if (currentWeekOffset > 0 && weeklyHistory[currentWeekOffset - 1]) {
                              displayData = weeklyHistory[currentWeekOffset - 1].study_data;
                            }
                            const total = Object.values(displayData).reduce((sum, minutes) => sum + (minutes || 0), 0);
                            const hours = Math.floor(total / 60);
                            const mins = total % 60;
                            return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
                          })()} 
                        </span>
                      </div>
                      {currentWeekOffset > 0 && weeklyHistory[currentWeekOffset - 1] && (
                        <div className="text-xs text-gray-500 mt-1">
                          Week of {new Date(weeklyHistory[currentWeekOffset - 1].week_start_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddTask={handleAddTask}
      />

      {/* AI Chat Modal */}
      <AIChat
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        currentSubject={tasks.find(t => !t.completed)?.subject}
        currentTask={tasks.find(t => !t.completed)?.title}
        studyTime={studyStats.todayMinutes}
        focusScore={studyStats.focusScore}
        userId={user?.id}
      />

      {/* Plant Garden Modal */}
      <PlantGarden
        isOpen={isPlantGardenOpen}
        onClose={() => setIsPlantGardenOpen(false)}
        studyTimeMinutes={studyStats.todayMinutes}
        plantData={plantData}
        onUpdatePlant={setPlantData}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} colorMode={colorMode} setColorMode={setColorMode} />

      {/* Google Classroom Connect Modal */}
      <GoogleClassroomConnect
        isOpen={isGoogleClassroomOpen}
        onClose={() => setIsGoogleClassroomOpen(false)}
        userId={user?.id || ''}
      />

    </div>
  );
}
