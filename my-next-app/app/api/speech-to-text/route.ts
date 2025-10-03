import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const model = formData.get('model') as string || 'gpt-4o-mini-transcribe';
    const language = formData.get('language') as string;
    const prompt = formData.get('prompt') as string;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Check file size (25MB limit)
    if (audioFile.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 25MB limit' },
        { status: 400 }
      );
    }

    // Check file type with more flexible validation
    const allowedTypes = [
      'audio/mp3', 'audio/mpeg', 'audio/mp4', 'audio/mpga', 
      'audio/m4a', 'audio/wav', 'audio/webm', 'audio/ogg',
      // Browser-specific MIME types
      'audio/webm;codecs=opus', 'audio/ogg;codecs=opus'
    ];
    
    const fileType = audioFile.type.toLowerCase();
    const isValidType = allowedTypes.some(type => 
      fileType.includes(type.split(';')[0]) || // Check base MIME type
      fileType.includes('webm') || // Default browser recording format
      fileType.includes('ogg') ||  // Alternative browser format
      fileType.includes('opus')    // Common codec
    );
    
    if (!isValidType) {
      console.log('Received MIME type:', audioFile.type);
      return NextResponse.json(
        { error: `Unsupported audio format: ${audioFile.type}. Supported formats: mp3, mp4, mpeg, mpga, m4a, wav, webm` },
        { status: 400 }
      );
    }

    // Prepare transcription parameters
    const transcriptionParams: any = {
      file: audioFile,
      model: model,
      response_format: 'json',
    };

    // Add optional parameters if provided
    if (language) {
      transcriptionParams.language = language;
    }

    if (prompt) {
      transcriptionParams.prompt = prompt;
    }

    // Call OpenAI Whisper API
    const transcription = await openai.audio.transcriptions.create(transcriptionParams);

    return NextResponse.json({
      success: true,
      text: transcription.text,
      model: model,
    });

  } catch (error: any) {
    console.error('Speech-to-text error:', error);
    
    // Handle specific OpenAI errors
    if (error.code === 'invalid_api_key') {
      return NextResponse.json(
        { error: 'Invalid OpenAI API key' },
        { status: 401 }
      );
    }
    
    if (error.code === 'insufficient_quota') {
      return NextResponse.json(
        { error: 'OpenAI API quota exceeded' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to transcribe audio', details: error.message },
      { status: 500 }
    );
  }
}

// Handle translation endpoint (converts to English)
export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const prompt = formData.get('prompt') as string;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Check file size (25MB limit)
    if (audioFile.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 25MB limit' },
        { status: 400 }
      );
    }

    // Check file type with flexible validation (same as transcription endpoint)
    const allowedTypes = [
      'audio/mp3', 'audio/mpeg', 'audio/mp4', 'audio/mpga', 
      'audio/m4a', 'audio/wav', 'audio/webm', 'audio/ogg',
      'audio/webm;codecs=opus', 'audio/ogg;codecs=opus'
    ];
    
    const fileType = audioFile.type.toLowerCase();
    const isValidType = allowedTypes.some(type => 
      fileType.includes(type.split(';')[0]) ||
      fileType.includes('webm') ||
      fileType.includes('ogg') ||
      fileType.includes('opus')
    );
    
    if (!isValidType) {
      console.log('Translation - Received MIME type:', audioFile.type);
      return NextResponse.json(
        { error: `Unsupported audio format: ${audioFile.type}. Supported formats: mp3, mp4, mpeg, mpga, m4a, wav, webm` },
        { status: 400 }
      );
    }

    // Prepare translation parameters (only whisper-1 supports translation)
    const translationParams: any = {
      file: audioFile,
      model: 'whisper-1',
    };

    if (prompt) {
      translationParams.prompt = prompt;
    }

    // Call OpenAI translation API
    const translation = await openai.audio.translations.create(translationParams);

    return NextResponse.json({
      success: true,
      text: translation.text,
      model: 'whisper-1',
      translated: true,
    });

  } catch (error: any) {
    console.error('Speech translation error:', error);
    
    return NextResponse.json(
      { error: 'Failed to translate audio', details: error.message },
      { status: 500 }
    );
  }
}
