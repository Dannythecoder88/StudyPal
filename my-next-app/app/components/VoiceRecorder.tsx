'use client';

import { useState } from 'react';
import { Mic, MicOff, Square, Pause, Play, Upload } from 'lucide-react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { transcribeAudio, formatRecordingTime, SpeechToTextOptions } from '../utils/speechToText';

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
  transcriptionOptions?: SpeechToTextOptions;
}

export default function VoiceRecorder({
  onTranscription,
  onError,
  disabled = false,
  className = '',
  transcriptionOptions = {}
}: VoiceRecorderProps) {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  
  const {
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    isRecording,
    isPaused,
    recordingTime,
    error: recordingError,
    isSupported,
  } = useAudioRecorder();

  const handleStartRecording = async () => {
    try {
      await startRecording();
    } catch (error: any) {
      onError?.(error.message || 'Failed to start recording');
    }
  };

  const handleStopRecording = async () => {
    try {
      const audioBlob = await stopRecording();
      if (audioBlob) {
        await handleTranscription(audioBlob);
      }
    } catch (error: any) {
      onError?.(error.message || 'Failed to stop recording');
    }
  };

  const handleTranscription = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    
    try {
      // Debug information
      console.log('Audio blob info:', {
        type: audioBlob.type,
        size: audioBlob.size,
        sizeKB: Math.round(audioBlob.size / 1024),
        sizeMB: Math.round(audioBlob.size / (1024 * 1024) * 100) / 100
      });
      
      const result = await transcribeAudio(audioBlob, {
        model: 'gpt-4o-mini-transcribe',
        prompt: 'This is a study-related conversation about assignments, courses, or academic topics.',
        ...transcriptionOptions,
      });

      if (result.success && result.text) {
        onTranscription(result.text);
      } else {
        console.error('Transcription failed:', result);
        onError?.(result.error || 'Failed to transcribe audio');
      }
    } catch (error: any) {
      console.error('Transcription error:', error);
      onError?.(error.message || 'Transcription failed');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (file.size > 25 * 1024 * 1024) {
      onError?.('File size exceeds 25MB limit');
      return;
    }

    const allowedTypes = ['audio/mp3', 'audio/mp4', 'audio/mpeg', 'audio/mpga', 'audio/m4a', 'audio/wav', 'audio/webm'];
    if (!allowedTypes.includes(file.type)) {
      onError?.('Unsupported audio format');
      return;
    }

    await handleTranscription(file);
    
    // Reset file input
    event.target.value = '';
    setShowFileUpload(false);
  };

  // Show error message if recording is not supported
  if (!isSupported) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <button
          type="button"
          onClick={() => setShowFileUpload(!showFileUpload)}
          disabled={disabled || isTranscribing}
          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Upload audio file"
        >
          <Upload className="h-5 w-5" />
        </button>
        {showFileUpload && (
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="text-xs"
            disabled={isTranscribing}
          />
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Recording controls */}
      {!isRecording ? (
        <button
          type="button"
          onClick={handleStartRecording}
          disabled={disabled || isTranscribing}
          className="p-2 text-gray-400 hover:text-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Start voice recording"
        >
          <Mic className="h-5 w-5" />
        </button>
      ) : (
        <div className="flex items-center space-x-1">
          {/* Pause/Resume button */}
          <button
            type="button"
            onClick={isPaused ? resumeRecording : pauseRecording}
            disabled={disabled}
            className="p-1 text-yellow-600 hover:text-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title={isPaused ? 'Resume recording' : 'Pause recording'}
          >
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </button>
          
          {/* Stop button */}
          <button
            type="button"
            onClick={handleStopRecording}
            disabled={disabled || isTranscribing}
            className="p-1 text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Stop recording and transcribe"
          >
            <Square className="h-4 w-4" />
          </button>
          
          {/* Recording indicator */}
          <div className="flex items-center space-x-1 text-sm">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-gray-600 font-mono">
              {formatRecordingTime(recordingTime)}
            </span>
            {isPaused && (
              <span className="text-yellow-600 text-xs">(Paused)</span>
            )}
          </div>
        </div>
      )}

      {/* File upload option */}
      <button
        type="button"
        onClick={() => setShowFileUpload(!showFileUpload)}
        disabled={disabled || isTranscribing || isRecording}
        className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Upload audio file"
      >
        <Upload className="h-5 w-5" />
      </button>

      {/* Transcription status */}
      {isTranscribing && (
        <div className="flex items-center space-x-1 text-sm text-blue-600">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span>Transcribing...</span>
        </div>
      )}

      {/* Error display */}
      {recordingError && (
        <div className="text-xs text-red-600 max-w-xs truncate" title={recordingError}>
          {recordingError}
        </div>
      )}

      {/* File upload input */}
      {showFileUpload && (
        <input
          type="file"
          accept="audio/mp3,audio/mp4,audio/mpeg,audio/mpga,audio/m4a,audio/wav,audio/webm"
          onChange={handleFileUpload}
          className="text-xs"
          disabled={isTranscribing || isRecording}
        />
      )}
    </div>
  );
}
