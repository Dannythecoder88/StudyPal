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
  description?: string; // Added for notes
}

interface RecommendationRequest {
  tasks: Task[];
  studyTime: number;
  focusScore: number;
  weeklyStudyData: {
    [key: string]: number;
  };
  completedTasks: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: RecommendationRequest = await request.json();
    const { tasks, studyTime, focusScore, weeklyStudyData, completedTasks } = body;

    // Filter out completed tasks for analysis
    const activeTasks = tasks.filter(task => !task.completed);
    if (activeTasks.length === 0) {
      return NextResponse.json({
        recommendations: [
          {
            type: 'motivation',
            title: 'Great job!',
            description: 'You\'ve completed all your tasks! Consider adding new tasks or reviewing completed work to reinforce learning.'
          }
        ]
      });
    }

    // Analyze tasks and create context for GPT
    const urgentTasks = activeTasks.filter(task => task.daysUntilDue && task.daysUntilDue <= 1);
    const highPriorityTasks = activeTasks.filter(task => task.daysUntilDue && task.daysUntilDue <= 3);
    const subjects = [...new Set(activeTasks.map(task => task.subject))];
    const totalEstimatedTime = activeTasks.reduce((sum, task) => sum + (task.estimatedTime || 60), 0);
    const averageFocusScore = focusScore;
    const studyStreak = Object.values(weeklyStudyData).filter(minutes => minutes > 0).length;

    const prompt = `You are an expert study coach. Analyze the following student context and tasks, and provide 3-4 specific, actionable recommendations to optimize their workflow and efficiency. Focus on helping them prioritize assignments due soonest, and suggest how to structure their study time for maximum productivity. If there are extra comments or notes in the tasks, weigh those in as well.

STUDENT CONTEXT:
- Study time today: ${studyTime} minutes
- Focus score: ${averageFocusScore}%
- Completed tasks: ${completedTasks}
- Study streak: ${studyStreak} days this week
- Subjects being studied: ${subjects.join(', ')}

CURRENT TASKS:
${activeTasks.map(task => 
  `- ${task.title} (${task.subject}, ${task.priority} priority, due in ${task.daysUntilDue} days, estimated ${task.estimatedTime || 60} min${task.description ? ", notes: " + task.description : ""})`
).join('\n')}

URGENT TASKS (due today/tomorrow): ${urgentTasks.length}
HIGH PRIORITY TASKS (due this week): ${highPriorityTasks.length}
TOTAL ESTIMATED TIME NEEDED: ${totalEstimatedTime} minutes

WEEKLY STUDY PATTERN:
${Object.entries(weeklyStudyData).map(([day, minutes]) => `${day}: ${minutes} minutes`).join(', ')}

Provide recommendations that consider:
1. Task prioritization based on urgency and importance
2. Time management strategies given their current study time
3. Focus improvement techniques based on their focus score
4. Study schedule optimization
5. Subject-specific study strategies
6. Motivation and productivity tips

Format your response as a JSON array of recommendation objects with 'type', 'title', and 'description' fields. Keep descriptions concise but actionable (2-3 sentences max).`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert study coach and productivity consultant. Provide practical, actionable advice to help students optimize their study efficiency. Focus on specific, implementable recommendations rather than general advice."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 800,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || '[]';
    const recommendations = JSON.parse(response);
    return NextResponse.json({
      recommendations: Array.isArray(recommendations) ? recommendations : []
    });
  } catch (error) {
    console.error('AI Recommendations Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations from GPT. Please try again.' },
      { status: 500 }
    );
  }
} 