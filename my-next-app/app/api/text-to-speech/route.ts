import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, voice = 'alloy', model = 'tts-1' } = body;

    if (!text) {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      );
    }

    // Validate voice option
    const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
    if (!validVoices.includes(voice)) {
      return NextResponse.json(
        { error: `Invalid voice. Supported voices: ${validVoices.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate model
    const validModels = ['tts-1', 'tts-1-hd'];
    if (!validModels.includes(model)) {
      return NextResponse.json(
        { error: `Invalid model. Supported models: ${validModels.join(', ')}` },
        { status: 400 }
      );
    }

    // Generate speech from text
    const mp3Response = await openai.audio.speech.create({
      model: model,
      voice: voice as any,
      input: text,
      response_format: 'mp3',
    });

    // Convert response to buffer
    const buffer = Buffer.from(await mp3Response.arrayBuffer());

    // Return audio as response
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error: any) {
    console.error('Text-to-speech error:', error);
    
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
      { error: 'Failed to generate speech', details: error.message },
      { status: 500 }
    );
  }
}
