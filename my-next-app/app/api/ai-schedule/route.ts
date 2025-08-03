import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Task {
  id: number;
  title: string;
  subject: string;
  priority: string;
  dueDate: string;
  estimatedTime?: number;
  completed: boolean;
  daysUntilDue?: number;
  description?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tasks } = body;
    const today = new Date();
    const todayStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    const activeTasks = tasks.filter((t: Task) => !t.completed);
    if (activeTasks.length === 0) {
      return NextResponse.json({ schedule: { [todayStr]: [] } });
    }
    const prompt = `You are an expert study planner. Given the following list of tasks, generate a detailed, time-blocked study schedule for today. Prioritize urgent and soon-due assignments. Include breaks after every 25-45 minutes of study. Each block should have a start time, task title, subject, duration (in minutes), and type ('study' or 'break').

TODAY: ${todayStr}

TASKS:
${activeTasks.map(task => `- ${task.title} (${task.subject}, ${task.priority} priority, due ${task.dueDate}, est. ${task.estimatedTime || 60} min${task.description ? ", notes: " + task.description : ""})`).join('\n')}

Assume the student is available to study from 5:00pm to 10:00pm. Distribute the tasks efficiently, focusing on urgent/soon tasks first. Insert breaks as needed. Format your response as a JSON array of schedule blocks, each with: { startTime, taskTitle, subject, duration, type }. If there is not enough time for all tasks, schedule the most urgent ones first.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert study planner. Generate a time-blocked study schedule in JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1200,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || '[]';
    const scheduleBlocks = JSON.parse(response);
    return NextResponse.json({ schedule: { [todayStr]: scheduleBlocks } });
  } catch (error) {
    console.error('AI Schedule Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate schedule from GPT. Please try again.' },
      { status: 500 }
    );
  }
} 