import { useEffect } from 'react';

export default function SettingsModal({ isOpen, onClose, colorMode, setColorMode }: {
  isOpen: boolean;
  onClose: () => void;
  colorMode: 'light' | 'dark';
  setColorMode: (mode: 'light' | 'dark') => void;
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className={`rounded-xl shadow-xl w-full max-w-sm mx-4 p-6 ${colorMode === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}
        role="dialog" aria-modal="true">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="mb-6">
          <label className="flex items-center cursor-pointer">
            <span className="mr-3 font-medium">Dark Mode</span>
            <span className="relative inline-block w-12 h-6">
              <input
                type="checkbox"
                checked={colorMode === 'dark'}
                onChange={e => setColorMode(e.target.checked ? 'dark' : 'light')}
                className="sr-only peer"
              />
              <span className="absolute left-0 top-0 w-12 h-6 rounded-full transition bg-gray-300 peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-pink-500" />
              <span className="absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white transition-transform peer-checked:translate-x-6" />
            </span>
          </label>
        </div>
        <button
          onClick={onClose}
          className="w-full py-2 rounded-lg bg-gradient-to-r from-blue-500 to-pink-500 text-white font-semibold shadow hover:opacity-90 transition"
        >
          Close
        </button>
      </div>
    </div>
  );
}