'use client';

import { useState, useEffect } from 'react';
import { Lightbulb, RefreshCw } from 'lucide-react';

const STUDY_TIPS = [
  {
    title: 'Use the Pomodoro Technique',
    description: 'Study in focused 25-minute blocks with 5-minute breaks to maximize concentration and avoid burnout.'
  },
  {
    title: 'Prioritize Difficult Tasks First',
    description: 'Tackle your hardest or most urgent assignments at the start of your study session when your energy is highest.'
  },
  {
    title: 'Eliminate Distractions',
    description: 'Put your phone on Do Not Disturb, close unrelated tabs, and create a dedicated study space.'
  },
  {
    title: 'Set Clear, Achievable Goals',
    description: 'Break big assignments into smaller tasks and set specific goals for each study session.'
  },
  {
    title: 'Review and Self-Test',
    description: 'After studying, quiz yourself or explain the material out loud to reinforce your understanding.'
  },
  {
    title: 'Mix Up Subjects',
    description: 'Switch between different subjects or types of tasks to keep your mind fresh and engaged.'
  },
  {
    title: 'Stay Hydrated and Take Care of Yourself',
    description: 'Drink water, eat healthy snacks, and get enough sleep to keep your brain performing at its best.'
  },
  {
    title: 'Use Active Recall',
    description: 'Instead of just rereading notes, try to recall information from memory to strengthen learning.'
  },
  {
    title: 'Teach What You Learn',
    description: 'Explaining concepts to someone else is a powerful way to deepen your understanding.'
  },
  {
    title: 'Plan Your Breaks',
    description: 'Schedule short, regular breaks to rest and recharge—don’t wait until you’re exhausted.'
  },
  {
    title: 'Organize Your Materials',
    description: 'Keep your notes, textbooks, and digital files organized so you can find what you need quickly.'
  },
  {
    title: 'Reward Yourself',
    description: 'Give yourself a small reward after completing a study session or finishing a tough task.'
  },
];

function getRandomTips(n: number) {
  const shuffled = [...STUDY_TIPS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

export default function Recommendations() {
  const [tips, setTips] = useState<{ title: string; description: string; }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setTips(getRandomTips(3));
  }, []);

  const regenerate = () => {
    setIsLoading(true);
    setTimeout(() => {
      setTips(getRandomTips(3));
      setIsLoading(false);
    }, 400);
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <Lightbulb className="h-5 w-5 mr-2 text-yellow-400" />
          Study Tips
        </h2>
        <button
          onClick={regenerate}
          disabled={isLoading}
          className="text-primary-600 hover:text-primary-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <div className="space-y-3">
        {tips.map((tip, idx) => (
          <div key={idx} className="p-4 bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg border border-primary-100">
            <h3 className="font-medium text-gray-900 mb-1">{tip.title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{tip.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
} 