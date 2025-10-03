'use client';

import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { MessageCircle, Square, Volume2, VolumeX, Mic } from 'lucide-react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { useVoiceActivityDetection } from '../hooks/useVoiceActivityDetection';
import { transcribeAudio, formatRecordingTime } from '../utils/speechToText';

interface PureVoiceConversationButtonProps {
  onVoiceMessage: (message: string) => Promise<string>; // Function that processes voice message and returns AI response
  disabled?: boolean;
  className?: string;
  voice?: string; // Voice to use for TTS
}

export interface PureVoiceConversationButtonRef {
  forceStop: () => void;
}

const PureVoiceConversationButton = forwardRef<PureVoiceConversationButtonRef, PureVoiceConversationButtonProps>(function PureVoiceConversationButton({
  onVoiceMessage,
  disabled = false,
  className = '',
  voice = 'onyx'
}, ref) {
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
    getMediaStream,
  } = useAudioRecorder();

  const {
    speak,
    stop: stopSpeaking,
    initializeUserGesture,
    isPlaying,
    isLoading: ttsLoading,
    error: ttsError,
    isSupported: ttsSupported,
  } = useTextToSpeech();

  const {
    startVAD,
    stopVAD,
    isListening,
    currentVolume,
  } = useVoiceActivityDetection({
    silenceThreshold: 0.01,
    silenceDuration: 1500, // 1.5 seconds of silence for faster response
    minSpeechDuration: 800, // Reduced to 0.8 seconds for quicker detection
  });

  const handleStartVoiceConversation = async () => {
    try {
      setError(null);
      
      // Initialize user gesture for audio playback on first interaction
      initializeUserGesture();
      
      setConversationState('recording');
      await startRecording();
      
      // Start Voice Activity Detection for automatic speech ending
      const stream = getMediaStream();
      if (stream) {
        startVAD(stream, handleAutoStopAndConverse);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to start recording');
      setConversationState('idle');
    }
  };

  const handleAutoStopAndConverse = async () => {
    console.log('Auto-stopping conversation due to silence');
    stopVAD();
    await handleStopAndConverse();
  };

  const handleStopAndConverse = async () => {
    try {
      setConversationState('processing');
      setError(null);
      
      // Stop VAD if it's running
      stopVAD();

      // Stop recording and get audio
      const audioBlob = await stopRecording();
      if (!audioBlob) {
        throw new Error('No audio recorded');
      }

      console.log('Processing pure voice conversation...');

      // Transcribe audio to text using fastest model
      const transcriptionResult = await transcribeAudio(audioBlob, {
        model: 'whisper-1', // Fastest transcription model
        prompt: 'Study conversation. Quick transcription.',
      });

      if (!transcriptionResult.success || !transcriptionResult.text) {
        throw new Error(transcriptionResult.error || 'Failed to transcribe audio');
      }

      console.log('User said:', transcriptionResult.text);

      // Get AI response (this should NOT add messages to chat)
      const aiResponse = await onVoiceMessage(transcriptionResult.text);
      
      if (!aiResponse) {
        throw new Error('No response from AI');
      }

      console.log('AI responded:', aiResponse);

      // Speak the AI response
      if (ttsSupported && aiResponse) {
        console.log('🗣️ Setting conversation state to SPEAKING');
        setConversationState('speaking');
        console.log('🎵 Starting TTS playback...');
        await speak(aiResponse, { voice: voice as any, model: 'tts-1' }); // tts-1 is fastest
        console.log('🎵 TTS playback completed');
      }

      setConversationState('idle');

    } catch (error: any) {
      console.error('Pure voice conversation error:', error);
      setError(error.message || 'Voice conversation failed');
      setConversationState('idle');
    }
  };

  const handleStopSpeaking = () => {
    console.log('MANUAL STOP BUTTON CLICKED - Stopping voice conversation');
    
    // Immediate state change
    setConversationState('idle');
    setError(null);
    
    // Stop all voice activities
    stopSpeaking();
    stopVAD();
    
    console.log('Manual stop completed');
  };

  const handleForceStop = () => {
    console.log('FORCE STOP ALL VOICE ACTIVITIES - EMERGENCY STOP');
    
    // Immediate state reset
    setConversationState('idle');
    setError(null);
    setIsProcessing(false);
    
    // Stop all voice activities
    stopSpeaking();
    stopVAD();
    
    console.log('Force stop completed - all activities halted');
  };

  // Expose force stop function to parent component
  useImperativeHandle(ref, () => ({
    forceStop: handleForceStop
  }), []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('PureVoiceConversationButton unmounting, cleaning up');
      handleForceStop();
    };
  }, []);

  const isActive = conversationState !== 'idle';
  const hasError = recordingError || ttsError || error;
  const showStopButton = conversationState === 'recording' || conversationState === 'processing' || conversationState === 'speaking';

  if (!recordingSupported || !ttsSupported) {
    return (
      <div className="text-xs text-gray-500">
        Voice chat not supported
      </div>
    );
  }

  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      {/* Universal Stop Button - Always visible when AI is active */}
      {showStopButton && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleStopSpeaking}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-md font-medium"
            title="Stop AI immediately"
          >
            <div className="flex items-center space-x-2">
              <Square className="h-4 w-4" />
              <span className="text-sm">
                {conversationState === 'recording' && 'Stop Recording'}
                {conversationState === 'processing' && 'Stop Processing'}
                {conversationState === 'speaking' && 'Stop Speaking'}
              </span>
            </div>
          </button>
        </div>
      )}
      
      <div className="flex items-center space-x-2">
      {/* Main voice conversation button */}
      {conversationState === 'idle' && (
        <button
          type="button"
          onClick={handleStartVoiceConversation}
          disabled={disabled}
          className={`p-2 rounded-full transition-colors ${
            disabled
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-green-600 hover:text-green-700 hover:bg-green-50'
          }`}
          title="Start voice conversation (no text)"
        >
          <MessageCircle className="h-5 w-5" />
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
            title="Stop recording manually (or just stop talking)"
          >
            <Square className="h-5 w-5" />
          </button>
          
          {/* Recording indicator with auto-detection */}
          <div className="flex items-center space-x-2 text-sm">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <Mic className="h-3 w-3 text-red-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-gray-600 font-mono text-xs">
                {formatRecordingTime(recordingTime)}
              </span>
              <span className="text-xs text-gray-500">
                Listening... (auto-stops in 1.5s)
              </span>
            </div>
            {/* Volume indicator */}
            <div className="flex items-center space-x-1">
              <div className="w-8 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-100"
                  style={{ width: `${Math.min(currentVolume * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Processing state */}
      {conversationState === 'processing' && (
        <div className="flex items-center space-x-3 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
          <button
            type="button"
            onClick={handleStopSpeaking}
            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors shadow-md"
            title="Stop AI processing"
          >
            <Square className="h-4 w-4" />
          </button>
          <div className="flex items-center space-x-2 text-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <div className="flex flex-col">
              <span className="text-blue-800 font-medium">AI is thinking...</span>
              <span className="text-xs text-blue-600">Click stop to cancel</span>
            </div>
          </div>
        </div>
      )}

      {/* Speaking state */}
      {conversationState === 'speaking' && (
        <div className="flex items-center space-x-3 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
          <button
            type="button"
            onClick={handleStopSpeaking}
            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors shadow-md"
            title="Stop AI response immediately"
          >
            <Square className="h-4 w-4" />
          </button>
          <div className="flex items-center space-x-2 text-sm">
            <Volume2 className="w-5 h-5 text-blue-600 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-blue-800 font-medium">AI is speaking...</span>
              <span className="text-xs text-blue-600">Click stop button to interrupt</span>
            </div>
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
    </div>
  );
});

export default PureVoiceConversationButton;
