'use client';

import { useState } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Square, Play, Pause } from 'lucide-react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { transcribeAudio, formatRecordingTime } from '../utils/speechToText';

interface VoiceChatButtonProps {
  onMessage: (message: string) => Promise<string>; // Function that sends message and returns AI response
  disabled?: boolean;
  className?: string;
  autoSpeak?: boolean; // Automatically speak AI responses
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
}

export default function VoiceChatButton({
  onMessage,
  disabled = false,
  className = '',
  autoSpeak = true,
  voice = 'alloy'
}: VoiceChatButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<string | null>(null);

  const {
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    isRecording,
    isPaused,
    recordingTime,
    error: recordingError,
    isSupported: recordingSupported,
  } = useAudioRecorder();

  const {
    speak,
    stop: stopSpeaking,
    isPlaying,
    isLoading: ttsLoading,
    error: ttsError,
    isSupported: ttsSupported,
  } = useTextToSpeech();

  const handleStartVoiceChat = async () => {
    try {
      setError(null);
      await startRecording();
    } catch (error: any) {
      setError(error.message || 'Failed to start recording');
    }
  };

  const handleStopAndProcess = async () => {
    try {
      setIsProcessing(true);
      setError(null);

      // Stop recording and get audio
      const audioBlob = await stopRecording();
      if (!audioBlob) {
        throw new Error('No audio recorded');
      }

      // Transcribe audio to text
      console.log('Transcribing audio...');
      const transcriptionResult = await transcribeAudio(audioBlob, {
        model: 'gpt-4o-mini-transcribe',
        prompt: 'This is a study-related conversation about assignments, courses, or academic topics.',
      });

      if (!transcriptionResult.success || !transcriptionResult.text) {
        throw new Error(transcriptionResult.error || 'Failed to transcribe audio');
      }

      console.log('Transcribed text:', transcriptionResult.text);

      // Send message to AI and get response
      const aiResponse = await onMessage(transcriptionResult.text);
      setLastResponse(aiResponse);

      // Automatically speak the AI response if enabled
      if (autoSpeak && aiResponse && ttsSupported) {
        console.log('Speaking AI response...');
        await speak(aiResponse, { voice, model: 'tts-1' });
      }

    } catch (error: any) {
      console.error('Voice chat error:', error);
      setError(error.message || 'Voice chat failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTogglePlayback = async () => {
    if (isPlaying) {
      stopSpeaking();
    } else if (lastResponse) {
      try {
        await speak(lastResponse, { voice, model: 'tts-1' });
      } catch (error: any) {
        setError(error.message || 'Failed to play response');
      }
    }
  };

  const isActive = isRecording || isProcessing || isPlaying || ttsLoading;
  const hasError = recordingError || ttsError || error;

  // Show error if neither recording nor TTS is supported
  if (!recordingSupported && !ttsSupported) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="text-xs text-red-600">Voice chat not supported</div>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Main voice chat button */}
      {!isRecording ? (
        <button
          type="button"
          onClick={handleStartVoiceChat}
          disabled={disabled || isProcessing || !recordingSupported}
          className={`p-2 rounded-full transition-colors ${
            disabled || isProcessing
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50'
          }`}
          title="Start voice conversation"
        >
          <Mic className="h-5 w-5" />
        </button>
      ) : (
        <div className="flex items-center space-x-1">
          {/* Pause/Resume button */}
          <button
            type="button"
            onClick={isPaused ? resumeRecording : pauseRecording}
            disabled={disabled || isProcessing}
            className="p-1 text-yellow-600 hover:text-yellow-700 disabled:opacity-50 transition-colors"
            title={isPaused ? 'Resume recording' : 'Pause recording'}
          >
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </button>
          
          {/* Stop and process button */}
          <button
            type="button"
            onClick={handleStopAndProcess}
            disabled={disabled || isProcessing}
            className="p-1 text-red-600 hover:text-red-700 disabled:opacity-50 transition-colors"
            title="Stop recording and get AI response"
          >
            <Square className="h-4 w-4" />
          </button>
          
          {/* Recording indicator */}
          <div className="flex items-center space-x-1 text-sm">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-gray-600 font-mono text-xs">
              {formatRecordingTime(recordingTime)}
            </span>
            {isPaused && (
              <span className="text-yellow-600 text-xs">(Paused)</span>
            )}
          </div>
        </div>
      )}

      {/* TTS playback controls */}
      {lastResponse && ttsSupported && (
        <button
          type="button"
          onClick={handleTogglePlayback}
          disabled={disabled || isRecording || isProcessing}
          className={`p-2 rounded-full transition-colors ${
            isPlaying
              ? 'text-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
          } ${disabled || isRecording || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={isPlaying ? 'Stop playback' : 'Replay AI response'}
        >
          {isPlaying ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
      )}

      {/* Status indicators */}
      {isProcessing && (
        <div className="flex items-center space-x-1 text-sm text-blue-600">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="text-xs">Processing...</span>
        </div>
      )}

      {ttsLoading && (
        <div className="flex items-center space-x-1 text-sm text-green-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs">Speaking...</span>
        </div>
      )}

      {/* Error display */}
      {hasError && (
        <div className="text-xs text-red-600 max-w-xs truncate" title={hasError}>
          {hasError}
        </div>
      )}
    </div>
  );
}
