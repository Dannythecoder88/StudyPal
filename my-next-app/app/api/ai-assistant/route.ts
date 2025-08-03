import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface AIAssistantRequest {
  message: string;
  context?: {
    subject?: string;
    currentTask?: string;
    studyTime?: number;
    focusScore?: number;
  };
  type: 'explanation' | 'study_tip' | 'motivation' | 'schedule_help';
}

export async function POST(request: NextRequest) {
  try {
    const body: AIAssistantRequest = await request.json();
    const { message, context, type } = body;

    let systemPrompt = '';
    let userPrompt = '';

    switch (type) {
      case 'explanation':
        systemPrompt = `You are a helpful study assistant. Explain concepts clearly and simply, using examples when helpful. 
        Keep explanations concise but thorough. If the user is studying ${context?.subject || 'a subject'}, 
        tailor your explanation to that context.`;
        userPrompt = `Please explain: ${message}`;
        break;

      case 'study_tip':
        systemPrompt = `You are an expert study coach. Provide practical, actionable study tips and strategies. 
        Consider the user is studying ${context?.subject || 'various subjects'} and has been studying for ${context?.studyTime || 0} minutes today. 
        Give specific, implementable advice.`;
        userPrompt = `I need study tips for: ${message}`;
        break;

      case 'motivation':
        systemPrompt = `You are a motivational study coach. Provide encouraging, uplifting messages to help students stay motivated. 
        Be supportive and remind them of their goals and progress. Keep it positive and actionable.`;
        userPrompt = `I need motivation for: ${message}`;
        break;

      case 'schedule_help':
        systemPrompt = `You are an AI study planner. Help optimize study schedules and provide smart recommendations. 
        Consider the user's current focus score of ${context?.focusScore || 0}% and their study patterns. 
        Give practical scheduling advice.`;
        userPrompt = `I need help with my study schedule: ${message}`;
        break;

      default:
        systemPrompt = `You are a helpful study assistant. Provide clear, helpful responses to student questions.`;
        userPrompt = message;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || 'Sorry, I couldn\'t generate a response.';

    return NextResponse.json({
      response,
      type,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI Assistant Error:', error);
    return NextResponse.json(
      { error: 'Failed to get AI response' },
      { status: 500 }
    );
  }
} 