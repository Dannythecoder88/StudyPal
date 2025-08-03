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
  Sprout
} from 'lucide-react';
import AddTaskModal from './components/AddTaskModal';
import AIChat from './components/AIChat';
import Recommendations from './components/AIRecommendations';
import SettingsModal from './components/SettingsModal';
import SmartStudyTimer from './components/FocusSession';
import PlantGarden from './components/PlantGarden';

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
  const [colorMode, setColorMode] = useState<'light' | 'dark'>('light');
  const [isHydrated, setIsHydrated] = useState(false);

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

  // Load data from localStorage on component mount (handle hydration)
  useEffect(() => {
    setIsHydrated(true);
    
    const savedTasks = loadFromLocalStorage('studypal-tasks', []);
    if (savedTasks && savedTasks.length > 0) setTasks(savedTasks);

    const savedWeeklyData = loadFromLocalStorage('studypal-weekly-data');
    if (savedWeeklyData) setWeeklyStudyData(savedWeeklyData);

    const savedStudyStats = loadFromLocalStorage('studypal-study-stats');
    if (savedStudyStats) setStudyStats(savedStudyStats);

    const savedStudyGoal = loadFromLocalStorage('studypal-study-goal', 0);
    if (savedStudyGoal > 0) {
      setStudyGoal(savedStudyGoal);
      setGoalHoursInput(Math.floor(savedStudyGoal / 60));
      setGoalMinutesInput(savedStudyGoal % 60);
    }
    
    const savedColorMode = loadFromLocalStorage('studypal-color-mode', 'light');
    if (savedColorMode) {
      setColorMode(savedColorMode);
      document.documentElement.classList.toggle('dark', savedColorMode === 'dark');
    }
  }, []);

  // Save data to localStorage whenever it changes (only after hydration)
  useEffect(() => {
    if (isHydrated) saveToLocalStorage('studypal-tasks', tasks);
  }, [tasks, isHydrated]);
  
  useEffect(() => {
    if (isHydrated) saveToLocalStorage('studypal-weekly-data', weeklyStudyData);
  }, [weeklyStudyData, isHydrated]);
  
  useEffect(() => {
    if (isHydrated) saveToLocalStorage('studypal-study-stats', studyStats);
  }, [studyStats, isHydrated]);
  
  useEffect(() => {
    if (isHydrated) saveToLocalStorage('studypal-study-goal', studyGoal);
  }, [studyGoal, isHydrated]);
  
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
    
    setStudyStats(newStats);
    setWeeklyStudyData(newWeeklyData);
    
    // Direct save to ensure immediate persistence
    saveToLocalStorage('studypal-study-stats', newStats);
    saveToLocalStorage('studypal-weekly-data', newWeeklyData);
  };

  const handleSetStudyGoal = () => {
    const totalMinutes = goalHoursInput * 60 + goalMinutesInput;
    setStudyGoal(totalMinutes);
    // Direct save to ensure immediate persistence
    saveToLocalStorage('studypal-study-goal', totalMinutes);
  };

  // Calculate total weekly minutes
  useEffect(() => {
    const totalWeeklyMinutes = Object.values(weeklyStudyData).reduce((sum, minutes) => sum + minutes, 0);
    setStudyStats(prev => ({ ...prev, weeklyMinutes: totalWeeklyMinutes }));
  }, [weeklyStudyData]);

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
    // Direct save to ensure immediate persistence
    saveToLocalStorage('studypal-tasks', updatedTasks);

    // Update completed tasks count
    const newStats = {
      ...studyStats,
      completedTasks: wasCompleted 
        ? Math.max(0, studyStats.completedTasks - 1)
        : studyStats.completedTasks + 1
    };
    setStudyStats(newStats);
    saveToLocalStorage('studypal-study-stats', newStats);
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
              <button className="btn-secondary" onClick={() => setIsPlantGardenOpen(true)}>
                <Sprout className="h-4 w-4 mr-2" />
                Your Plant
              </button>
              <button className="btn-secondary" onClick={() => setIsAIChatOpen(true)}>
                <Bot className="h-4 w-4 mr-2" />
                AI Assistant
              </button>
              <button className="btn-secondary" onClick={() => setIsSettingsOpen(true)}>
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-3">
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
                  <p className="text-gray-700">Progress: <strong>{formatTime(liveElapsedSeconds)}</strong></p>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                    <div 
                      className="bg-primary-600 h-2.5 rounded-full"
                      style={{ width: `${studyGoal > 0 ? Math.min((liveElapsedSeconds / (studyGoal * 60)) * 100, 100) : 0}%` }}
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
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Weekly Overview</h2>
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
                  const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() === day;
                  const studyMinutes = weeklyStudyData[day as keyof typeof weeklyStudyData];
                  const maxHeight = Math.max(...Object.values(weeklyStudyData), 60); // At least 60px height
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
      />

      {/* Plant Garden Modal */}
      <PlantGarden
        isOpen={isPlantGardenOpen}
        onClose={() => setIsPlantGardenOpen(false)}
        studyTimeMinutes={studyStats.todayMinutes}
      />

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} colorMode={colorMode} setColorMode={setColorMode} />
    </div>
  );
}
