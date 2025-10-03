import { useRef, useCallback, useEffect } from 'react';

export interface VoiceActivityDetectionOptions {
  silenceThreshold?: number; // Volume threshold below which is considered silence (0-1)
  silenceDuration?: number; // Duration of silence in ms before considering speech ended
  minSpeechDuration?: number; // Minimum speech duration in ms before allowing auto-stop
}

export interface UseVoiceActivityDetectionReturn {
  startVAD: (stream: MediaStream, onSpeechEnd: () => void) => void;
  stopVAD: () => void;
  isListening: boolean;
  currentVolume: number;
}

export const useVoiceActivityDetection = (
  options: VoiceActivityDetectionOptions = {}
): UseVoiceActivityDetectionReturn => {
  const {
    silenceThreshold = 0.01, // Very sensitive to detect when user stops talking
    silenceDuration = 2000, // 2 seconds of silence before auto-stopping
    minSpeechDuration = 1000, // Must speak for at least 1 second
  } = options;

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const speechStartTimeRef = useRef<number | null>(null);
  const onSpeechEndRef = useRef<(() => void) | null>(null);
  const isListeningRef = useRef(false);
  const currentVolumeRef = useRef(0);

  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    analyserRef.current = null;
    dataArrayRef.current = null;
    speechStartTimeRef.current = null;
    isListeningRef.current = false;
    currentVolumeRef.current = 0;
  }, []);

  const getVolumeLevel = useCallback((): number => {
    if (!analyserRef.current || !dataArrayRef.current) return 0;
    
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    
    let sum = 0;
    for (let i = 0; i < dataArrayRef.current.length; i++) {
      sum += dataArrayRef.current[i];
    }
    
    const average = sum / dataArrayRef.current.length;
    return average / 255; // Normalize to 0-1
  }, []);

  const monitorAudio = useCallback(() => {
    if (!isListeningRef.current) return;
    
    const volume = getVolumeLevel();
    currentVolumeRef.current = volume;
    
    const isSpeaking = volume > silenceThreshold;
    
    if (isSpeaking) {
      // User is speaking
      if (!speechStartTimeRef.current) {
        speechStartTimeRef.current = Date.now();
        console.log('Speech detected, starting timer');
      }
      
      // Clear any existing silence timer
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    } else {
      // User is silent
      if (speechStartTimeRef.current && !silenceTimerRef.current) {
        const speechDuration = Date.now() - speechStartTimeRef.current;
        
        if (speechDuration >= minSpeechDuration) {
          // User has spoken long enough, start silence timer
          console.log(`Starting silence timer (${silenceDuration}ms)`);
          silenceTimerRef.current = setTimeout(() => {
            console.log('Silence detected, ending speech');
            if (onSpeechEndRef.current) {
              onSpeechEndRef.current();
            }
          }, silenceDuration);
        }
      }
    }
    
    // Continue monitoring
    animationFrameRef.current = requestAnimationFrame(monitorAudio);
  }, [silenceThreshold, silenceDuration, minSpeechDuration, getVolumeLevel]);

  const startVAD = useCallback((stream: MediaStream, onSpeechEnd: () => void) => {
    cleanup(); // Clean up any existing VAD
    
    try {
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);
      
      source.connect(analyserRef.current);
      
      onSpeechEndRef.current = onSpeechEnd;
      isListeningRef.current = true;
      speechStartTimeRef.current = null;
      
      console.log('Voice Activity Detection started');
      monitorAudio();
      
    } catch (error) {
      console.error('Failed to start Voice Activity Detection:', error);
    }
  }, [cleanup, monitorAudio]);

  const stopVAD = useCallback(() => {
    console.log('Voice Activity Detection stopped');
    isListeningRef.current = false;
    cleanup();
  }, [cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    startVAD,
    stopVAD,
    isListening: isListeningRef.current,
    currentVolume: currentVolumeRef.current,
  };
};
