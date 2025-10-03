'use client';

import { useState } from 'react';
import { Settings, Volume2 } from 'lucide-react';
import { useTextToSpeech } from '../hooks/useTextToSpeech';

interface VoiceSettingsProps {
  onVoiceChange?: (voice: string) => void;
  currentVoice?: string;
}

const VOICE_OPTIONS = [
  { id: 'onyx', name: 'Onyx', description: 'Deep, male voice (default)', gender: 'male' },
  { id: 'echo', name: 'Echo', description: 'Clear, male voice', gender: 'male' },
  { id: 'fable', name: 'Fable', description: 'Warm, male voice', gender: 'male' },
  { id: 'alloy', name: 'Alloy', description: 'Neutral, balanced voice', gender: 'neutral' },
  { id: 'nova', name: 'Nova', description: 'Friendly, female voice', gender: 'female' },
  { id: 'shimmer', name: 'Shimmer', description: 'Bright, female voice', gender: 'female' },
];

export default function VoiceSettings({ onVoiceChange, currentVoice = 'onyx' }: VoiceSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(currentVoice);
  const { speak, isPlaying } = useTextToSpeech();

  const handleVoiceChange = (voiceId: string) => {
    setSelectedVoice(voiceId);
    onVoiceChange?.(voiceId);
  };

  const handleTestVoice = async (voiceId: string) => {
    const testText = "Hello! This is how I sound when helping you study.";
    try {
      await speak(testText, { voice: voiceId as any, model: 'tts-1' });
    } catch (error) {
      console.error('Failed to test voice:', error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors"
        title="Voice Settings"
      >
        <Settings className="h-4 w-4" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Settings Panel */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">AI Voice Settings</h3>
              
              <div className="space-y-2">
                {VOICE_OPTIONS.map((voice) => (
                  <div
                    key={voice.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedVoice === voice.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => handleVoiceChange(voice.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm text-gray-900">
                            {voice.name}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            voice.gender === 'male' 
                              ? 'bg-blue-100 text-blue-800'
                              : voice.gender === 'female'
                              ? 'bg-pink-100 text-pink-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {voice.gender}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {voice.description}
                        </p>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTestVoice(voice.id);
                        }}
                        disabled={isPlaying}
                        className="ml-2 p-1 text-gray-400 hover:text-primary-600 disabled:opacity-50 transition-colors"
                        title="Test voice"
                      >
                        <Volume2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Voice changes apply to new conversations. Current conversation will continue with the previous voice.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
