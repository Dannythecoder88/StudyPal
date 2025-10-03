export interface SpeechToTextOptions {
  model?: 'whisper-1' | 'gpt-4o-mini-transcribe' | 'gpt-4o-transcribe';
  language?: string;
  prompt?: string;
  translate?: boolean; // If true, translates to English
}

export interface SpeechToTextResult {
  success: boolean;
  text?: string;
  model?: string;
  translated?: boolean;
  error?: string;
}

/**
 * Convert audio blob to text using OpenAI's Whisper API
 */
export async function transcribeAudio(
  audioBlob: Blob,
  options: SpeechToTextOptions = {}
): Promise<SpeechToTextResult> {
  try {
    const formData = new FormData();
    
    // Convert blob to file with appropriate extension and MIME type
    const originalMimeType = audioBlob.type;
    let extension = 'webm';
    let finalMimeType = 'audio/webm';
    
    console.log('Original MIME type from browser:', originalMimeType);
    
    // Map browser MIME types to supported formats
    if (originalMimeType.includes('mp3') || originalMimeType.includes('mpeg')) {
      extension = 'mp3';
      finalMimeType = 'audio/mp3';
    } else if (originalMimeType.includes('mp4') || originalMimeType.includes('m4a')) {
      extension = 'mp4';
      finalMimeType = 'audio/mp4';
    } else if (originalMimeType.includes('wav')) {
      extension = 'wav';
      finalMimeType = 'audio/wav';
    } else if (originalMimeType.includes('webm') || originalMimeType.includes('opus')) {
      extension = 'webm';
      finalMimeType = 'audio/webm';
    } else {
      // Default to webm for unknown types (most browsers use webm)
      console.log('Unknown MIME type, defaulting to webm');
      extension = 'webm';
      finalMimeType = 'audio/webm';
    }
    
    console.log('Final MIME type for API:', finalMimeType);
    
    const audioFile = new File([audioBlob], `recording.${extension}`, {
      type: finalMimeType,
    });
    
    formData.append('audio', audioFile);
    
    if (options.model) {
      formData.append('model', options.model);
    }
    
    if (options.language) {
      formData.append('language', options.language);
    }
    
    if (options.prompt) {
      formData.append('prompt', options.prompt);
    }

    // Choose endpoint based on whether translation is requested
    const endpoint = options.translate ? '/api/speech-to-text' : '/api/speech-to-text';
    const method = options.translate ? 'PUT' : 'POST';

    const response = await fetch(endpoint, {
      method: method,
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to transcribe audio',
      };
    }

    return result;
  } catch (error: any) {
    console.error('Speech-to-text error:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
    };
  }
}

/**
 * Format recording time for display
 */
export function formatRecordingTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Check if the browser supports audio recording
 */
export function isAudioRecordingSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function' &&
    typeof MediaRecorder !== 'undefined'
  );
}

/**
 * Get optimal audio recording settings for the current browser
 */
export function getOptimalRecordingSettings(): MediaRecorderOptions {
  const options: MediaRecorderOptions = {};
  
  // Try to use the best available codec
  if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
    options.mimeType = 'audio/webm;codecs=opus';
  } else if (MediaRecorder.isTypeSupported('audio/webm')) {
    options.mimeType = 'audio/webm';
  } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
    options.mimeType = 'audio/mp4';
  } else if (MediaRecorder.isTypeSupported('audio/wav')) {
    options.mimeType = 'audio/wav';
  }
  
  return options;
}

/**
 * Validate audio file for speech-to-text processing
 */
export function validateAudioFile(file: File): { valid: boolean; error?: string } {
  // Check file size (25MB limit)
  if (file.size > 25 * 1024 * 1024) {
    return {
      valid: false,
      error: 'File size exceeds 25MB limit',
    };
  }

  // Check file type
  const allowedTypes = [
    'audio/mp3',
    'audio/mp4', 
    'audio/mpeg',
    'audio/mpga',
    'audio/m4a',
    'audio/wav',
    'audio/webm'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Unsupported audio format. Supported formats: mp3, mp4, mpeg, mpga, m4a, wav, webm',
    };
  }

  return { valid: true };
}
