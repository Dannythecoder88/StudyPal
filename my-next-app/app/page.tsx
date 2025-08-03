'use client';

import { useState, useEffect } from 'react';
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
  Settings
} from 'lucide-react';
import AddTaskModal from './components/AddTaskModal';
import AIChat from './components/AIChat';
import Recommendations from './components/AIRecommendations';
import SettingsModal from './components/SettingsModal';
import SmartStudyTimer from './components/FocusSession';

export default function StudyPal() {
  const [studyStats, setStudyStats] = useState({
    todayMinutes: 0,
    weeklyMinutes: 0,
    focusScore: 0,
    completedTasks: 0
  });

  const [tasks, setTasks] = useState<any[]>([]);

  // Group tasks by priority and due date
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
  }, {} as { [key: string]: any[] });

  // Sort tasks within each group by due date (earliest first)
  Object.keys(groupedTasks).forEach(priority => {
    groupedTasks[priority].sort((a, b) => a.daysUntilDue - b.daysUntilDue);
  });

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
  const [showTooltip, setShowTooltip] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [colorMode, setColorMode] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('studypal-color-mode') as 'light' | 'dark') || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', colorMode === 'dark');
    localStorage.setItem('studypal-color-mode', colorMode);
  }, [colorMode]);

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedTasks = localStorage.getItem('studypal-tasks');
    const savedWeeklyData = localStorage.getItem('studypal-weekly-data');
    const savedStudyStats = localStorage.getItem('studypal-study-stats');
    
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
    
    if (savedWeeklyData) {
      setWeeklyStudyData(JSON.parse(savedWeeklyData));
    }
    
    if (savedStudyStats) {
      setStudyStats(JSON.parse(savedStudyStats));
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('studypal-tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('studypal-weekly-data', JSON.stringify(weeklyStudyData));
  }, [weeklyStudyData]);

  useEffect(() => {
    localStorage.setItem('studypal-study-stats', JSON.stringify(studyStats));
  }, [studyStats]);

  // Request notification permission on component mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Countdown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    // The old currentSession and timer logic is removed.
    // The SmartStudyTimer component handles its own state and updates.

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, []); // Removed dependencies as they are no longer used

  // Function to update study time
  const updateStudyTime = (minutes: number) => {
    setStudyStats(prev => ({
      ...prev,
      todayMinutes: prev.todayMinutes + minutes
    }));

    // Update weekly data for current day
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as keyof typeof weeklyStudyData;
    setWeeklyStudyData(prev => ({
      ...prev,
      [today]: prev[today] + minutes
    }));
  };

  // Calculate total weekly minutes
  useEffect(() => {
    const totalWeeklyMinutes = Object.values(weeklyStudyData).reduce((sum, minutes) => sum + minutes, 0);
    setStudyStats(prev => ({
      ...prev,
      weeklyMinutes: totalWeeklyMinutes
    }));
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
    return new Date(dueDate).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getDueDateColor = (daysUntilDue: number) => {
    if (daysUntilDue < 0) return 'text-red-600';
    if (daysUntilDue <= 1) return 'text-red-500';
    if (daysUntilDue <= 3) return 'text-orange-500';
    if (daysUntilDue <= 7) return 'text-yellow-600';
    return 'text-green-600';
  };

  const handleAddTask = (newTask: any) => {
    setTasks(prev => [...prev, newTask]);
    // Update total tasks count (for potential future features)
    setStudyStats(prev => ({
      ...prev,
      totalTasks: prev.totalTasks + 1
    }));
  };

  const toggleTaskCompletion = async (taskId: number) => {
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);
    
    // Update completed tasks count
    const completedCount = updatedTasks.filter(task => task.completed).length;
    setStudyStats(prev => ({
      ...prev,
      completedTasks: completedCount
    }));
    
    // Update in API
    try {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        await fetch('/api/tasks', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...task, completed: !task.completed }),
        });
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  return (
    <div className={colorMode === 'dark' ? 'bg-black text-white min-h-screen' : 'min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100'}>
      {/* Header */}
      <header className={`shadow-sm border-b ${colorMode === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-8 w-8 text-primary-600" />
              <span className="text-2xl font-bold text-primary-700">StudyPal</span>
            </div>
            <div className="flex items-center space-x-4">
              <button className="btn-secondary" onClick={() => setIsAIChatOpen(true)}>
                <Bot className="h-4 w-4 mr-2" />
                AI Assistant
              </button>
              <button className="btn-secondary" onClick={() => setIsSettingsOpen(true)}>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7zm7.5-3.5a7.5 7.5 0 0 1-.2 1.7l2.1 1.6a1 1 0 0 1 .2 1.4l-2 3.5a1 1 0 0 1-1.2.5l-2.5-1a7.5 7.5 0 0 1-1.5.9l-.4 2.7a1 1 0 0 1-1 .8h-4a1 1 0 0 1-1-.8l-.4-2.7a7.5 7.5 0 0 1-1.5-.9l-2.5 1a1 1 0 0 1-1.2-.5l-2-3.5a1 1 0 0 1 .2-1.4l2.1-1.6A7.5 7.5 0 0 1 4.5 12c0-.6.1-1.1.2-1.7l-2.1-1.6a1 1 0 0 1-.2-1.4l2-3.5a1 1 0 0 1 1.2-.5l2.5 1c.5-.3 1-.6 1.5-.9l.4-2.7A1 1 0 0 1 10 2h4a1 1 0 0 1 1 .8l.4 2.7c.5.3 1 .6 1.5.9l2.5-1a1 1 0 0 1 1.2.5l2 3.5a1 1 0 0 1-.2 1.4l-2.1 1.6c.1.6.2 1.1.2 1.7z" /></svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Focus Session & Stats */}
          <div className="lg:col-span-1 space-y-6">
            
            <SmartStudyTimer
              onStudyTime={minutes => setStudyStats(prev => ({ ...prev, todayMinutes: minutes }))}
              onFocusScore={score => setStudyStats(prev => ({ ...prev, focusScore: score }))}
              colorMode={colorMode}
              title="Focus Session"
            />

            {/* Today's Stats */}
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
                    <CheckCircle className="h-5 w-5 text-success-600 mr-3" />
                    <span className="text-gray-700">Tasks Done</span>
                  </div>
                  <span className="font-semibold text-gray-900">{studyStats.completedTasks}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Tasks & Schedule */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Today's Tasks */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl font-semibold text-gray-900">Today's Tasks</h2>
                  <div className="relative">
                    <div 
                      className="w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center cursor-help transition-colors"
                      onMouseEnter={() => setShowTooltip(true)}
                      onMouseLeave={() => setShowTooltip(false)}
                    >
                      <span className="text-xs font-bold text-gray-600">?</span>
                    </div>
                    {showTooltip && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-50 min-w-max">
                        <div className="space-y-1">
                          <div><span className="text-red-400 font-medium">Red:</span> Due today/tomorrow</div>
                          <div><span className="text-orange-400 font-medium">Orange:</span> Due in 2-3 days</div>
                          <div><span className="text-yellow-400 font-medium">Yellow:</span> Due in 4-7 days</div>
                          <div><span className="text-green-400 font-medium">Green:</span> Due later</div>
                        </div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                      </div>
                    )}
                  </div>
                </div>
                <button 
                  className="btn-primary"
                  onClick={() => setIsModalOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </button>
              </div>
              
                            <div className="space-y-6">
                {tasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-lg font-medium mb-2">No tasks yet</p>
                    <p className="text-sm">Click "Add Task" to create your first study task!</p>
                  </div>
                ) : (
                  Object.entries(groupedTasks).map(([priority, priorityTasks]) => (
                    <div key={priority} className="space-y-3">
                      {/* Priority Header */}
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          priority === 'urgent' ? 'bg-red-500' :
                          priority === 'high' ? 'bg-orange-500' :
                          priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`} />
                        <h3 className={`font-semibold text-sm ${
                          priority === 'urgent' ? 'text-red-700' :
                          priority === 'high' ? 'text-orange-700' :
                          priority === 'medium' ? 'text-yellow-700' : 'text-green-700'
                        }`}>
                          {priority === 'urgent' ? 'Urgent (Due Today/Tomorrow)' :
                           priority === 'high' ? 'High Priority (Due This Week)' :
                           priority === 'medium' ? 'Medium Priority (Due Soon)' : 'Low Priority'}
                        </h3>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {priorityTasks.length} task{priorityTasks.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      
                      {/* Tasks in this priority group */}
                      {priorityTasks.map((task) => (
                        <div 
                          key={task.id} 
                          className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-200 hover:shadow-md cursor-pointer ${
                            task.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => toggleTaskCompletion(task.id)}
                        >
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleTaskCompletion(task.id);
                              }}
                              className={`w-6 h-6 rounded-full border-2 transition-all duration-200 hover:scale-110 flex items-center justify-center ${
                                task.completed 
                                  ? 'bg-green-500 border-green-500 hover:bg-green-600' 
                                  : 'border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50'
                              }`}
                              title={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
                            >
                              {task.completed && (
                                <CheckCircle className="h-4 w-4 text-white" />
                              )}
                            </button>
                            <div>
                              <h3 className={`font-medium ${
                                task.completed ? 'text-green-700 line-through' : 'text-gray-900'
                              }`}>
                                {task.title}
                              </h3>
                              <div className="flex items-center space-x-2 mt-1">
                                <p className="text-sm text-gray-600">{task.subject}</p>
                                <span className="text-gray-400">•</span>
                                <p className={`text-sm font-medium ${getDueDateColor(task.daysUntilDue)}`}>
                                  {formatDueDate(task.dueDate, task.daysUntilDue)}
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
                            <div className={`w-2 h-2 rounded-full ${
                              task.completed ? 'bg-green-500' : getPriorityColor(task.priority).split(' ')[0]
                            }`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* AI Recommendations */}
            <Recommendations
              tasks={tasks}
              studyTime={studyStats.todayMinutes}
              focusScore={studyStats.focusScore}
              isVisible={true}
              weeklyStudyData={weeklyStudyData}
              completedTasks={studyStats.completedTasks}
            />

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

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} colorMode={colorMode} setColorMode={setColorMode} />
    </div>
  );
}
