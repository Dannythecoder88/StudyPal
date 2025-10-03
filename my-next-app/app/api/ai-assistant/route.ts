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

// Function to check if a message is study-related
async function isStudyRelated(message: string): Promise<boolean> {
  try {
    const filterCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a content filter for a study assistant app. Your job is to determine if a user's message is related to studying, education, academics, homework, assignments, courses, learning, Google Classroom, or school-related topics.

Respond with ONLY "YES" if the message is study-related, or "NO" if it's not.

Study-related topics include:
- Academic subjects (math, science, history, literature, etc.)
- Homework and assignments
- Study techniques and strategies
- Educational concepts and explanations
- Course planning and scheduling
- Google Classroom tasks
- Learning difficulties or questions
- School projects and research
- Test preparation and exams
- Academic motivation and productivity

Non-study topics include:
- General conversation
- Entertainment (movies, games, sports)
- Personal relationships
- Weather or news
- Shopping or lifestyle
- Technology unrelated to learning
- Random questions not about education`
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 10,
      temperature: 0.1,
    });

    const response = filterCompletion.choices[0]?.message?.content?.trim().toUpperCase();
    return response === "YES";
  } catch (error) {
    console.error('Content filtering error:', error);
    // If filtering fails, err on the side of caution and allow the message
    return true;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: AIAssistantRequest = await request.json();
    const { message, context, type } = body;

    // Check if the message is study-related
    const isStudyQuestion = await isStudyRelated(message);
    
    if (!isStudyQuestion) {
      return NextResponse.json({
        response: "Sorry, I can only help with study-related questions, homework, assignments, or Google Classroom tasks. Please ask me something about your studies, courses, or academic work!",
        type: 'general',
        timestamp: new Date().toISOString(),
        filtered: true
      });
    }

    let systemPrompt = '';
    let userPrompt = '';

    switch (type) {
      case 'explanation':
        systemPrompt = `You are StudyPal, a dedicated academic assistant focused ONLY on educational topics. Explain concepts clearly and simply, using examples when helpful. 
        Keep explanations concise but thorough. If the user is studying ${context?.subject || 'a subject'}, 
        tailor your explanation to that context.
        
        IMPORTANT: You must ONLY respond to questions about academic subjects, homework, assignments, studying techniques, or educational content. If asked about non-academic topics, politely redirect to study-related questions.`;
        userPrompt = `Please explain: ${message}`;
        break;

      case 'study_tip':
        systemPrompt = `You are StudyPal, an expert study coach focused exclusively on academic success. Provide practical, actionable study tips and strategies. 
        Consider the user is studying ${context?.subject || 'various subjects'} and has been studying for ${context?.studyTime || 0} minutes today. 
        Give specific, implementable advice.
        
        IMPORTANT: Only provide study-related advice. If the question isn't about studying, learning, or academics, redirect to educational topics.`;
        userPrompt = `I need study tips for: ${message}`;
        break;

      case 'motivation':
        systemPrompt = `You are StudyPal, a motivational study coach dedicated to academic success. Provide encouraging, uplifting messages to help students stay motivated with their studies. 
        Be supportive and remind them of their academic goals and progress. Keep it positive and actionable.
        
        IMPORTANT: Focus only on academic motivation. If asked about non-study topics, redirect to educational motivation and goals.`;
        userPrompt = `I need motivation for: ${message}`;
        break;

      case 'schedule_help':
        systemPrompt = `You are StudyPal, an AI study planner specialized in academic scheduling and productivity. Help optimize study schedules and provide smart recommendations. 
        Consider the user's current focus score of ${context?.focusScore || 0}% and their study patterns. 
        Give practical scheduling advice for academic work.
        
        IMPORTANT: Only help with study schedules, homework planning, and academic time management. Redirect non-academic scheduling questions to study-related planning.`;
        userPrompt = `I need help with my study schedule: ${message}`;
        break;

      default:
        systemPrompt = `You are StudyPal, a helpful study assistant focused exclusively on educational and academic topics. 
        
        IMPORTANT RULES:
        - ONLY respond to questions about studying, homework, assignments, courses, academic subjects, or Google Classroom
        - If asked about non-academic topics, respond: "Sorry, I can only help with study-related questions, homework, assignments, or Google Classroom tasks. Please ask me something about your studies, courses, or academic work!"
        - Always keep responses educational and study-focused
        - Help with academic concepts, study techniques, homework help, and educational planning`;
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