import { NextRequest, NextResponse } from 'next/server';

// Mock database - in real app, this would be Supabase
let tasks = [
  { id: 1, title: 'AP Euro Unit 7 Review', subject: 'History', priority: 'high', completed: false, dueDate: '2024-01-15' },
  { id: 2, title: 'Math Problem Set #12', subject: 'Mathematics', priority: 'medium', completed: true, dueDate: '2024-01-14' },
  { id: 3, title: 'Physics Lab Report', subject: 'Physics', priority: 'high', completed: false, dueDate: '2024-01-16' },
  { id: 4, title: 'English Essay Draft', subject: 'English', priority: 'low', completed: false, dueDate: '2024-01-18' },
];

export async function GET() {
  return NextResponse.json(tasks);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newTask = {
      id: tasks.length + 1,
      title: body.title,
      subject: body.subject,
      priority: body.priority || 'medium',
      completed: false,
      dueDate: body.dueDate,
    };
    
    tasks.push(newTask);
    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const taskIndex = tasks.findIndex(task => task.id === body.id);
    
    if (taskIndex === -1) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    tasks[taskIndex] = { ...tasks[taskIndex], ...body };
    return NextResponse.json(tasks[taskIndex]);
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id') || '0');
    
    const taskIndex = tasks.findIndex(task => task.id === id);
    if (taskIndex === -1) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    tasks.splice(taskIndex, 1);
    return NextResponse.json({ message: 'Task deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
} 