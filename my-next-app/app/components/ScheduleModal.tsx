import { useState, useEffect } from 'react';

export default function ScheduleModal({ isOpen, onClose, tasks, colorMode }: {
  isOpen: boolean;
  onClose: () => void;
  tasks: any[];
  colorMode: 'light' | 'dark';
}) {
  const [schedule, setSchedule] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    setError(null);
    setSchedule(null);
    fetch('/api/ai-schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tasks }),
    })
      .then(res => res.ok ? res.json() : Promise.reject(res.statusText))
      .then(data => setSchedule(data.schedule))
      .catch(e => setError('Failed to generate schedule. Please try again.'))
      .finally(() => setIsLoading(false));
  }, [isOpen, tasks]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className={`rounded-xl shadow-xl w-full max-w-lg mx-4 p-6 ${colorMode === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}
        role="dialog" aria-modal="true">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Your AI-Generated Study Schedule</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 border-t-2"></div>
            <span className="ml-3">Generating schedule...</span>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-8">{error}</div>
        ) : schedule ? (
          <div className="space-y-4">
            {Object.entries(schedule).map(([day, blocks]: any) => (
              <div key={day}>
                <h3 className="font-semibold mb-2 capitalize">{day}</h3>
                <ul className="space-y-1">
                  {blocks.map((block: any, idx: number) => (
                    <li key={idx} className={`rounded px-3 py-2 ${block.type === 'break' ? 'bg-pink-100 text-pink-800' : 'bg-blue-100 text-blue-900'} text-sm`}>
                      {block.type === 'break' ? (
                        <>Break: {block.duration} min</>
                      ) : (
                        <>
                          <span className="font-medium">{block.taskTitle}</span> <span className="text-xs text-gray-500">({block.subject})</span> — {block.duration} min
                          {block.startTime && <span className="ml-2 text-xs text-gray-400">Start: {block.startTime}</span>}
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">No schedule available.</div>
        )}
      </div>
    </div>
  );
}