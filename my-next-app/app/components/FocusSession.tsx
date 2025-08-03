import { useState, useRef, useEffect, useCallback } from 'react';

// Custom hook for using localStorage with useState
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        setStoredValue(currentValue => {
          const valueToStore = value instanceof Function ? value(currentValue) : value;
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
          }
          return valueToStore;
        });
      } catch (error) {
        console.log(error);
      }
    },
    [key]
  );

  return [storedValue, setValue];
}

const BLOCK_MINUTES = 30;
const SHORT_BREAK_MINUTES = 5;
const LONG_BLOCK_MIN = 120;
const LONG_BLOCK_MAX = 180;

// Helper to format seconds into MM:SS
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};

export default function SmartStudyTimer({ 
  onStudyTime,
  onProgressUpdate,
  onBlockProgressUpdate,
  colorMode, 
  title,
  studyGoal
}: {
  onStudyTime: (minutes: number) => void;
  onProgressUpdate?: (seconds: number) => void;
  onBlockProgressUpdate?: (seconds: number) => void;
  colorMode: 'light' | 'dark';
  title?: string;
  studyGoal?: number; // in minutes
}) {
  const [isStudying, setIsStudying] = useLocalStorage('focus-isStudying', false);
  const [isOnBreak, setIsOnBreak] = useLocalStorage('focus-isOnBreak', false);
  const [blockMinutes, setBlockMinutes] = useLocalStorage('focus-blockMinutes', BLOCK_MINUTES);
  const [breakMinutes, setBreakMinutes] = useLocalStorage('focus-breakMinutes', SHORT_BREAK_MINUTES);
  const [elapsed, setElapsed] = useLocalStorage('focus-elapsed-seconds', 0);
  const [blockElapsed, setBlockElapsed] = useLocalStorage('focus-blockElapsed-seconds', 0);
  const [longBlockElapsed, setLongBlockElapsed] = useLocalStorage('focus-longBlockElapsed-seconds', 0);
  const [showBreakNow, setShowBreakNow] = useState(false);
  const [customBreak, setCustomBreak] = useState(5);
  const [showLongBreakMsg, setShowLongBreakMsg] = useState(false);
  const [goalMet, setGoalMet] = useLocalStorage('focus-goalMet', false);
  const [isHydrated, setIsHydrated] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isStudying && !showLongBreakMsg) {
      const interval = setInterval(() => {
        setElapsed(prev => {
          const newElapsed = prev + 1;
          if (onProgressUpdate) {
            onProgressUpdate(newElapsed);
          }
          return newElapsed;
        });
        setBlockElapsed(prev => {
          const newBlockElapsed = prev + 1;
          if (onBlockProgressUpdate) {
            onBlockProgressUpdate(newBlockElapsed);
          }
          return newBlockElapsed;
        });
        setLongBlockElapsed(prev => prev + 1);
      }, 1000);
      intervalRef.current = interval;
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isStudying, showLongBreakMsg, setElapsed, setBlockElapsed, setLongBlockElapsed, onProgressUpdate, onBlockProgressUpdate]);

  // Handle parent updates - track minutes more reliably
  const lastMinuteRef = useRef(0);
  useEffect(() => {
    const currentMinute = Math.floor(elapsed / 60);
    if (currentMinute > lastMinuteRef.current && elapsed > 0) {
      const minutesStudied = currentMinute - lastMinuteRef.current;
      console.log(`Study time update: ${minutesStudied} minutes (total elapsed: ${elapsed}s)`);
      onStudyTime(minutesStudied);
      lastMinuteRef.current = currentMinute;
    }
  }, [elapsed, onStudyTime]);

  // Handle block/break transitions
  useEffect(() => {
    if (!isStudying || goalMet) return;

    const goalInSeconds = (studyGoal || 0) * 60;
    if (studyGoal && studyGoal > 0) {
      // Goal-oriented session logic
      if (elapsed >= goalInSeconds) {
        setGoalMet(true);
        setIsStudying(false);
        return;
      }

      const currentBlockMinutes = 30;
      const currentBreakMinutes = 5;

      // Study block finished
      if (!isOnBreak && blockElapsed >= currentBlockMinutes * 60) {
        setIsOnBreak(true);
        setBlockElapsed(0);
        setBreakMinutes(currentBreakMinutes);
        return;
      }

      // Break finished
      if (isOnBreak && blockElapsed >= currentBreakMinutes * 60) {
        setIsOnBreak(false);
        setBlockElapsed(0);
        setBlockMinutes(currentBlockMinutes);
      }
    } else {
      // Original logic for non-goal sessions
      if (!isOnBreak && blockElapsed >= blockMinutes * 60) {
        setIsOnBreak(true);
        setBlockElapsed(0);
        return;
      }

      if (isOnBreak && blockElapsed >= breakMinutes * 60) {
        setIsOnBreak(false);
        setBlockElapsed(0);
        setBlockMinutes(BLOCK_MINUTES);
        setBreakMinutes(SHORT_BREAK_MINUTES);
      }

      if (!isOnBreak && longBlockElapsed >= LONG_BLOCK_MIN * 60 && longBlockElapsed <= LONG_BLOCK_MAX * 60) {
        setShowLongBreakMsg(true);
        setIsStudying(false);
      }
    }
  }, [
    isStudying, elapsed, blockElapsed, isOnBreak, studyGoal, goalMet, blockMinutes, breakMinutes, longBlockElapsed,
    setGoalMet, setIsStudying, setIsOnBreak, setBlockElapsed, setBlockMinutes, setBreakMinutes, setShowLongBreakMsg
  ]);

  // Manual break
  const handleStartStop = () => {
    setIsStudying(prev => !prev);
  };

  const handleBreakNow = () => {
    setIsOnBreak(true);
    setBlockElapsed(0); // Reset block timer for the break
    setBreakMinutes(customBreak);
    setShowBreakNow(false);
  };

  const handleReset = () => {
    // Reset only the current session timer, not overall progress
    setBlockElapsed(0);
    setBlockMinutes(BLOCK_MINUTES); // Reset to 30 minutes
    setIsOnBreak(false);
    setIsStudying(false);
    console.log('Focus session timer reset to 30 minutes');
  };

  // Timer and progress bar calculation
  const totalDuration = (isOnBreak ? breakMinutes : blockMinutes) * 60;
  const remainingTime = totalDuration - blockElapsed;
  const progress = totalDuration > 0 ? Math.min(blockElapsed / totalDuration, 1) : 0;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      </div>
      {goalMet ? (
        <div className="text-center py-8">
          <div className="text-lg font-bold mb-2">Daily Goal Achieved!</div>
          <div className="mb-4">Congratulations! You've completed your study goal of {Math.floor((studyGoal || 0) / 60)}h {(studyGoal || 0) % 60}m.</div>
          <button className="btn-primary" onClick={() => { setGoalMet(false); setElapsed(0); }}>Start a New Goal</button>
        </div>
      ) : showLongBreakMsg ? (
        <div className="text-center py-8">
          <div className="text-lg font-bold mb-2">Great work!</div>
          <div className="mb-4">You’ve completed a long study block ({longBlockElapsed} min). Take a 1–2 hour break and come back refreshed for your next focus session!</div>
          <button className="btn-primary" onClick={() => window.location.reload()}>Start New Session</button>
        </div>
      ) : (
        <>
          <div className="text-center mb-6">
            <div className="text-4xl font-bold mb-2 text-gray-900">
              {isHydrated ? formatTime(remainingTime) : formatTime((isOnBreak ? breakMinutes : blockMinutes) * 60)}
            </div>
            <div className={`text-sm font-medium ${isOnBreak ? 'text-pink-600' : 'text-primary-600'}`}>{isOnBreak ? 'Break Time' : 'Study Time'}</div>
            <div className="mt-2">
              <span className="text-xs text-gray-500">Block: {isOnBreak ? 'Break' : 'Study'} | {isStudying ? 'Active' : 'Paused'}</span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${isOnBreak ? 'bg-gradient-to-r from-pink-400 to-pink-600' : 'bg-gradient-to-r from-blue-400 to-pink-500'}`}
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
          <div className="flex justify-center space-x-4">
            <button className="btn-primary" onClick={handleStartStop}>{isStudying ? 'Pause' : 'Start'}</button>
            <button className="btn-secondary" onClick={handleBreakNow} disabled={!isStudying || isOnBreak}>
              Break
            </button>
            <button className="btn-secondary" onClick={handleReset}>
              Reset
            </button>
          </div>
        </>
      )}
    </div>
  );
}