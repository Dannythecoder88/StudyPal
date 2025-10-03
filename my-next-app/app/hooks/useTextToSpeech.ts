import { useState, useRef, useCallback, useEffect } from 'react';

export interface TextToSpeechOptions {
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  model?: 'tts-1' | 'tts-1-hd';
}

export interface UseTextToSpeechReturn {
  speak: (text: string, options?: TextToSpeechOptions) => Promise<void>;
  stop: () => void;
  forceStop: () => void;
  initializeUserGesture: () => void;
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  isSupported: boolean;
}

export const useTextToSpeech = (): UseTextToSpeechReturn => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentUrlRef = useRef<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const isUserGestureInitiatedRef = useRef(false);
  const activeAudioEndedHandler = useRef<(() => void) | null>(null);
  const activeAudioErrorHandler = useRef<((e: Event) => void) | null>(null);

  const isSupported = typeof Audio !== 'undefined';

  const cleanupAudio = useCallback(() => {
    console.log('Cleaning up audio...');
    if (audioRef.current) {
      const audio = audioRef.current;
      audio.pause();
      audio.currentTime = 0;
      audio.src = '';

      // Detach all listeners
      if (activeAudioEndedHandler.current) {
        audio.removeEventListener('ended', activeAudioEndedHandler.current);
        activeAudioEndedHandler.current = null;
      }
      // This is the key fix: remove the error handler on cleanup.
      audio.removeEventListener('error', activeAudioErrorHandler.current as EventListener);
      activeAudioErrorHandler.current = null;

      audioRef.current = null;
      console.log('Audio stopped and cleaned up');
    }
    if (currentUrlRef.current) {
      URL.revokeObjectURL(currentUrlRef.current);
      currentUrlRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    console.log('TTS STOP called');
    setIsPlaying(false);
    cleanupAudio();
  }, [cleanupAudio]);

  const forceStop = useCallback(() => {
    console.log('FORCE STOP TTS - EMERGENCY AUDIO STOP');
    stop();
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(console.warn);
      audioContextRef.current = null;
    }
    isUserGestureInitiatedRef.current = false;
    document.querySelectorAll('audio').forEach(a => a.pause());
    console.log('FORCE STOP: Complete cleanup finished');
  }, [stop]);

  const initializeUserGesture = useCallback(() => {
    if (isUserGestureInitiatedRef.current) return;
    isUserGestureInitiatedRef.current = true;
    if (!audioContextRef.current && typeof AudioContext !== 'undefined') {
      try {
        const context = new AudioContext();
        if (context.state === 'suspended') {
          context.resume();
        }
        audioContextRef.current = context;
        const silentAudio = new Audio('data:audio/wav;base64,UklGRj4AAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABgAZGF0YRAAAAAA');
        silentAudio.volume = 0;
        silentAudio.play().catch(() => {});
      } catch (e) {
        console.warn('Failed to initialize audio context:', e);
      }
    }
  }, []);

  const speak = useCallback((text: string, options: TextToSpeechOptions = {}) => {
    return new Promise<void>(async (resolve, reject) => {
      if (!isSupported) {
        setError('Audio playback is not supported in this browser');
        return reject(new Error('Audio not supported'));
      }
      if (!text.trim()) {
        setError('No text provided');
        return reject(new Error('No text provided'));
      }

      stop();
      setIsLoading(true);
      setError(null);

      try {
        initializeUserGesture();
        const response = await fetch('/api/text-to-speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: text.trim(), ...options }),
        });

        if (!response.ok) {
          throw new Error((await response.json()).error || `HTTP ${response.status}`);
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        currentUrlRef.current = audioUrl;

        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        const handleEnded = () => {
          console.log('Audio finished playing.');
          setIsPlaying(false);
          cleanupAudio();
          resolve();
        };
        activeAudioEndedHandler.current = handleEnded;

        const handleError = (e: Event) => {
          // This error is expected when we manually stop the audio by changing src.
          // We can ignore it if the audio is not supposed to be playing.
          if (isPlaying) {
            console.error('Audio playback error:', e);
            setError('Failed to play audio');
            setIsPlaying(false);
            reject(new Error('Audio playback error'));
          }
          cleanupAudio();
        };
        activeAudioErrorHandler.current = handleError;

        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError);

        await audio.play();
        setIsPlaying(true);
      } catch (err: any) {
        console.error('TTS Error:', err);
        setError(err.message || 'Failed to generate speech');
        cleanupAudio();
        reject(err);
      } finally {
        setIsLoading(false);
      }
    });
  }, [isSupported, stop, cleanupAudio, initializeUserGesture]);

  useEffect(() => {
    return () => {
      forceStop();
    };
  }, [forceStop]);

  return {
    speak,
    stop,
    forceStop,
    initializeUserGesture,
    isPlaying,
    isLoading,
    error,
    isSupported,
  };
};
