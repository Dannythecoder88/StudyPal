'use client';

import { useState } from 'react';
import { Mic, MicOff, Square, Volume2, VolumeX } from 'lucide-react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { transcribeAudio, formatRecordingTime } from '../utils/speechToText';

interface VoiceConversationButtonProps {
  onVoiceMessage: (message: string) => Promise<string>; // Function that processes voice message and returns AI response
  disabled?: boolean;
  className?: string;
}

export default function VoiceConversationButton({
  onVoiceMessage,
  disabled = false,
  className = ''
}: VoiceConversationButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationState, setConversationState] = useState<'idle' | 'recording' | 'processing' | 'speaking'>('idle');

  const {
    startRecording,
    stopRecording,
    isRecording,
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

  const handleStartVoiceConversation = async () => {
    try {
      setError(null);
      setConversationState('recording');
      await startRecording();
    } catch (error: any) {
      setError(error.message || 'Failed to start recording');
      setConversationState('idle');
    }
  };

  const handleStopAndConverse = async () => {
    try {
      setConversationState('processing');
      setError(null);

      // Stop recording and get audio
      const audioBlob = await stopRecording();
      if (!audioBlob) {
        throw new Error('No audio recorded');
      }

      console.log('Processing voice conversation...');

      // Transcribe audio to text
      const transcriptionResult = await transcribeAudio(audioBlob, {
        model: 'gpt-4o-mini-transcribe',
        prompt: 'This is a study-related conversation about assignments, courses, or academic topics.',
      });

      if (!transcriptionResult.success || !transcriptionResult.text) {
        throw new Error(transcriptionResult.error || 'Failed to transcribe audio');
      }

      console.log('User said:', transcriptionResult.text);

      // Get AI response (this will handle the chat logic)
      const aiResponse = await onVoiceMessage(transcriptionResult.text);
      
      if (!aiResponse) {
        throw new Error('No response from AI');
      }

      console.log('AI responded:', aiResponse);

      // Speak the AI response
      if (ttsSupported && aiResponse) {
        setConversationState('speaking');
        await speak(aiResponse, { voice: 'onyx', model: 'tts-1' });
      }

      setConversationState('idle');

    } catch (error: any) {
      console.error('Voice conversation error:', error);
      setError(error.message || 'Voice conversation failed');
      setConversationState('idle');
    }
  };

  const handleStopSpeaking = () => {
    stopSpeaking();
    setConversationState('idle');
  };

  const isActive = conversationState !== 'idle';
  const hasError = recordingError || ttsError || error;

  // Show error if neither recording nor TTS is supported
  if (!recordingSupported || !ttsSupported) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="text-xs text-red-600">Voice chat not supported</div>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Main voice conversation button */}
      {conversationState === 'idle' && (
        <button
          type="button"
          onClick={handleStartVoiceConversation}
          disabled={disabled}
          className={`p-2 rounded-full transition-colors ${
            disabled
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50'
          }`}
          title="Start voice conversation"
        >
          <Mic className="h-5 w-5" />
        </button>
      )}

      {/* Recording state */}
      {conversationState === 'recording' && (
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleStopAndConverse}
            disabled={disabled}
            className="p-2 text-red-600 hover:text-red-700 disabled:opacity-50 transition-colors rounded-full hover:bg-red-50"
            title="Stop recording and get AI response"
          >
            <Square className="h-5 w-5" />
          </button>
          
          {/* Recording indicator */}
          <div className="flex items-center space-x-1 text-sm">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-gray-600 font-mono text-xs">
              {formatRecordingTime(recordingTime)}
            </span>
          </div>
        </div>
      )}

      {/* Processing state */}
      {conversationState === 'processing' && (
        <div className="flex items-center space-x-2 text-sm text-blue-600">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="text-xs">Processing...</span>
        </div>
      )}

      {/* Speaking state */}
      {conversationState === 'speaking' && (
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleStopSpeaking}
            className="p-2 text-blue-600 hover:text-blue-700 transition-colors rounded-full hover:bg-blue-50"
            title="Stop AI response"
          >
            <VolumeX className="h-5 w-5" />
          </button>
          <div className="flex items-center space-x-1 text-sm text-blue-600">
            <Volume2 className="w-4 h-4 animate-pulse" />
            <span className="text-xs">AI Speaking...</span>
          </div>
        </div>
      )}

      {/* Error display */}
      {hasError && (
        <div className="text-xs text-red-600 max-w-xs truncate" title={hasError}>
          Error: {hasError}
        </div>
      )}
    </div>
  );
}
