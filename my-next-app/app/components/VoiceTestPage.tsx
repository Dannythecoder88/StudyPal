'use client';

import { useState } from 'react';
import VoiceRecorder from './VoiceRecorder';
import { Mic, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function VoiceTestPage() {
  const [transcriptions, setTranscriptions] = useState<Array<{
    id: string;
    text: string;
    timestamp: Date;
    model?: string;
  }>>([]);
  const [errors, setErrors] = useState<Array<{
    id: string;
    error: string;
    timestamp: Date;
  }>>([]);
  const [isSupported, setIsSupported] = useState<boolean | null>(null);

  // Check browser support on component mount
  useState(() => {
    const supported = typeof navigator !== 'undefined' &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function' &&
      typeof MediaRecorder !== 'undefined';
    setIsSupported(supported);
  });

  const handleTranscription = (text: string) => {
    const newTranscription = {
      id: Date.now().toString(),
      text,
      timestamp: new Date(),
    };
    setTranscriptions(prev => [newTranscription, ...prev]);
  };

  const handleError = (error: string) => {
    const newError = {
      id: Date.now().toString(),
      error,
      timestamp: new Date(),
    };
    setErrors(prev => [newError, ...prev]);
  };

  const clearAll = () => {
    setTranscriptions([]);
    setErrors([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
          <Mic className="h-6 w-6 mr-2 text-primary-600" />
          Speech-to-Text Test Page
        </h1>
        
        {/* Browser Support Status */}
        <div className="mb-6 p-4 rounded-lg border">
          <h2 className="text-lg font-semibold mb-2">Browser Compatibility</h2>
          <div className="flex items-center space-x-2">
            {isSupported === null ? (
              <AlertCircle className="h-5 w-5 text-yellow-500" />
            ) : isSupported ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <span className={`font-medium ${
              isSupported === null ? 'text-yellow-700' :
              isSupported ? 'text-green-700' : 'text-red-700'
            }`}>
              {isSupported === null ? 'Checking...' :
               isSupported ? 'Voice recording is supported!' : 'Voice recording is not supported in this browser'}
            </span>
          </div>
        </div>

        {/* Voice Recorder */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Test Voice Recording</h2>
          <div className="flex items-center space-x-4">
            <VoiceRecorder
              onTranscription={handleTranscription}
              onError={handleError}
              transcriptionOptions={{
                model: 'gpt-4o-mini-transcribe',
                prompt: 'This is a test of the speech-to-text system for StudyPal.'
              }}
            />
            <span className="text-sm text-gray-600">
              Click the microphone to start recording or upload an audio file
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-6">
          <button
            onClick={clearAll}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Clear All Results
          </button>
        </div>

        {/* Results */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Successful Transcriptions */}
          <div>
            <h2 className="text-lg font-semibold mb-3 text-green-700">
              Successful Transcriptions ({transcriptions.length})
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {transcriptions.length === 0 ? (
                <p className="text-gray-500 italic">No transcriptions yet. Try recording something!</p>
              ) : (
                transcriptions.map((transcription) => (
                  <div key={transcription.id} className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-green-900 font-medium mb-1">"{transcription.text}"</p>
                    <p className="text-green-600 text-xs">
                      {transcription.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Errors */}
          <div>
            <h2 className="text-lg font-semibold mb-3 text-red-700">
              Errors ({errors.length})
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {errors.length === 0 ? (
                <p className="text-gray-500 italic">No errors yet. Great!</p>
              ) : (
                errors.map((error) => (
                  <div key={error.id} className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-900 font-medium mb-1">{error.error}</p>
                    <p className="text-red-600 text-xs">
                      {error.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">How to Test</h3>
          <ul className="text-blue-800 space-y-1 text-sm">
            <li>• Click the microphone icon to start recording</li>
            <li>• Speak clearly into your microphone</li>
            <li>• Click the stop button to end recording and transcribe</li>
            <li>• Or click the upload icon to test with an audio file</li>
            <li>• Check the results in the sections above</li>
            <li>• Try different phrases to test accuracy</li>
          </ul>
        </div>

        {/* Technical Details */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Technical Details</h3>
          <div className="text-sm text-gray-700 space-y-1">
            <p><strong>Model:</strong> gpt-4o-mini-transcribe (OpenAI Whisper)</p>
            <p><strong>Supported formats:</strong> mp3, mp4, wav, webm, m4a, mpeg, mpga</p>
            <p><strong>Max file size:</strong> 25MB</p>
            <p><strong>API endpoint:</strong> /api/speech-to-text</p>
          </div>
        </div>
      </div>
    </div>
  );
}
