import { useState, useRef, useEffect } from 'react';

const BLOCK_MINUTES = 30;
const SHORT_BREAK_MINUTES = 5;
const LONG_BLOCK_MIN = 120;
const LONG_BLOCK_MAX = 180;

export default function SmartStudyTimer({ onStudyTime, onFocusScore, colorMode, title = 'Smart Study Timer' }: {
  onStudyTime: (minutes: number) => void;
  onFocusScore: (score: number) => void;
  colorMode: 'light' | 'dark';
  title?: string;
}) {
  const [isStudying, setIsStudying] = useState(false);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [blockMinutes, setBlockMinutes] = useState(BLOCK_MINUTES);
  const [breakMinutes, setBreakMinutes] = useState(SHORT_BREAK_MINUTES);
  const [elapsed, setElapsed] = useState(0);
  const [blockElapsed, setBlockElapsed] = useState(0);
  const [longBlockElapsed, setLongBlockElapsed] = useState(0);
  const [focusStreak, setFocusStreak] = useState(0);
  const [showBreakNow, setShowBreakNow] = useState(false);
  const [customBreak, setCustomBreak] = useState(1);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [showLongBreakMsg, setShowLongBreakMsg] = useState(false);

  // Start/stop timer
  useEffect(() => {
    if (isStudying && !isOnBreak && !showLongBreakMsg) {
      intervalRef.current = setInterval(() => {
        setElapsed(e => e + 1);
        setBlockElapsed(b => b + 1);
        setLongBlockElapsed(l => l + 1);
        // Focus streak logic: every 10 min uninterrupted study, +10%
        setFocusStreak(s => {
          if ((blockElapsed + 1) % 10 === 0) {
            const newScore = Math.min(s + 10, 100);
            onFocusScore(newScore);
            return newScore;
          }
          return s;
        });
        // Update parent on study time
        onStudyTime(elapsed + 1);
      }, 1000 * 60);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    // Only depend on isStudying, isOnBreak, showLongBreakMsg
  }, [isStudying, isOnBreak, showLongBreakMsg]);

  // Handle block/break transitions
  useEffect(() => {
    if (!isStudying) return;
    if (!isOnBreak && blockElapsed >= blockMinutes) {
      setIsOnBreak(true);
      setBlockElapsed(0);
      setFocusStreak(0);
      onFocusScore(0);
    }
    if (isOnBreak && blockElapsed >= breakMinutes) {
      setIsOnBreak(false);
      setBlockElapsed(0);
      setBlockMinutes(BLOCK_MINUTES);
      setBreakMinutes(SHORT_BREAK_MINUTES);
    }
    // Long break after 2-3 hours
    if (!isOnBreak && longBlockElapsed >= LONG_BLOCK_MIN && longBlockElapsed <= LONG_BLOCK_MAX) {
      setShowLongBreakMsg(true);
      setIsStudying(false);
    }
  }, [blockElapsed, isOnBreak, isStudying, longBlockElapsed, blockMinutes, breakMinutes, onFocusScore]);

  // Manual break
  const handleBreakNow = () => {
    setShowBreakNow(false);
    setIsOnBreak(true);
    setBlockElapsed(0);
    setBreakMinutes(customBreak);
    setBlockMinutes(BLOCK_MINUTES + customBreak);
    setFocusStreak(0);
    onFocusScore(0);
  };

  // Reset all
  const handleReset = () => {
    setIsStudying(false);
    setIsOnBreak(false);
    setElapsed(0);
    setBlockElapsed(0);
    setLongBlockElapsed(0);
    setFocusStreak(0);
    setShowLongBreakMsg(false);
    onFocusScore(0);
  };

  // Progress bar calculation
  const progress = isOnBreak
    ? Math.min(blockElapsed / breakMinutes, 1)
    : Math.min(blockElapsed / blockMinutes, 1);

  return (
    <div className={`card ${colorMode === 'dark' ? 'bg-gray-900 text-white' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      {showLongBreakMsg ? (
        <div className="text-center py-8">
          <div className="text-lg font-bold mb-2">Great work!</div>
          <div className="mb-4">You’ve completed a long study block ({longBlockElapsed} min). Take a 1–2 hour break and come back refreshed for your next focus session!</div>
          <button className="btn-primary" onClick={handleReset}>Start New Session</button>
        </div>
      ) : (
        <>
          <div className="text-center mb-6">
            <div className="text-4xl font-bold mb-2">
              {isOnBreak ? `${breakMinutes - blockElapsed} min` : `${blockMinutes - blockElapsed} min`}
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
          <div className="flex justify-center space-x-3 mb-4">
            {!isStudying ? (
              <button className="btn-primary" onClick={() => { setIsStudying(true); setIsOnBreak(false); }}>
                Start
              </button>
            ) : (
              <button className="btn-secondary" onClick={() => setIsStudying(false)}>
                Pause
              </button>
            )}
            <button className="btn-secondary" onClick={handleReset}>Reset</button>
            <button className="btn-secondary" onClick={() => setShowBreakNow(true)} disabled={isOnBreak || !isStudying}>Break Now</button>
          </div>
          {showBreakNow && (
            <div className="mb-4 text-center">
              <div className="mb-2">Select break length (1–10 min):</div>
              <input type="range" min={1} max={10} value={customBreak} onChange={e => setCustomBreak(Number(e.target.value))} />
              <span className="ml-2 font-bold">{customBreak} min</span>
              <button className="btn-primary ml-4" onClick={handleBreakNow}>Start Break</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}