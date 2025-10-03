import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Composio configuration
const COMPOSIO_API_KEY = process.env.COMPOSIO_API_KEY;
const COMPOSIO_BASE_URL = 'https://api.composio.dev'; // CORRECT API BASE URL

// Function to execute Composio tool calls
async function executeComposioToolCalls(userId: string, toolCalls: any[]) {
  const results = [];
  
  for (const toolCall of toolCalls) {
    try {
      const apiUrl = `${COMPOSIO_BASE_URL}/api/v1/actions/execute`;
      console.log('Executing tool via Composio:', apiUrl);
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': COMPOSIO_API_KEY!,
        },
        body: JSON.stringify({
          user_id: userId,
          tool_call: {
            id: toolCall.id,
            function: {
              name: toolCall.function.name,
              arguments: toolCall.function.arguments,
            },
          },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        results.push({
          tool_call_id: toolCall.id,
          output: result.output || result,
        });
      } else {
        const errorData = await response.json();
        console.error(`Tool execution failed for ${toolCall.function.name}:`, errorData);
        results.push({
          tool_call_id: toolCall.id,
          output: `Error: ${errorData.message || 'Tool execution failed'}`,
        });
      }
    } catch (error) {
      console.error(`Error executing tool ${toolCall.function.name}:`, error);
      results.push({
        tool_call_id: toolCall.id,
        output: `Error: ${(error as Error).message}`,
      });
    }
  }
  
  return results;
}



export async function POST(request: NextRequest) {
  try {
    const { userId, message, connectionId } = await request.json();

    if (!userId || !message) {
      return NextResponse.json(
        { error: 'Missing userId or message' },
        { status: 400 }
      );
    }

    if (!COMPOSIO_API_KEY) {
      return NextResponse.json(
        { error: 'Composio API key not configured' },
        { status: 500 }
      );
    }

    // Get Composio tools for the user
    const toolsApiUrl = new URL(`${COMPOSIO_BASE_URL}/api/v1/actions`);
    toolsApiUrl.searchParams.append('user_id', userId);
    toolsApiUrl.searchParams.append('apps', 'GOOGLE_CLASSROOM');
    console.log('Fetching tools from Composio:', toolsApiUrl.toString());
    
    const toolsResponse = await fetch(toolsApiUrl.toString(), {
      method: 'GET',
      headers: {
        'X-API-Key': COMPOSIO_API_KEY,
      },
    });

    if (!toolsResponse.ok) {
      const errorData = await toolsResponse.json();
      console.error('Failed to get Composio tools:', errorData);
      return NextResponse.json(
        { error: 'Failed to get Google Classroom tools' },
        { status: 500 }
      );
    }

    const tools = await toolsResponse.json();

    // Execute the chat completion with Composio tools
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant that can interact with Google Classroom data using Composio tools. 
          You have access to the user's Google Classroom through Composio integration.
          
          Use the available tools to:
          - List courses and assignments
          - Get assignment details and due dates
          - Check announcements
          - Help with study planning based on real classroom data
          
          Always provide helpful and specific responses based on the actual data from Google Classroom.
          Current date: ${new Date().toISOString()}
          
          When mentioning due dates, always check if they are overdue, due today, or upcoming.`,
        },
        {
          role: 'user',
          content: message,
        },
      ],
      tools: tools.tools || [],
    });

    // Handle tool calls if present
    let toolResults = null;
    if (completion.choices[0].message.tool_calls) {
      // Execute tool calls through Composio
      const toolCallResults = await executeComposioToolCalls(
        userId,
        completion.choices[0].message.tool_calls
      );
      toolResults = toolCallResults;
    }

    return NextResponse.json({
      success: true,
      message: completion.choices[0].message.content,
      toolResults: toolResults,
      hasToolCalls: !!completion.choices[0].message.tool_calls,
    });
  } catch (error) {
    console.error('Error executing Google Classroom query:', error);
    return NextResponse.json(
      { error: 'Failed to execute tools', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    // Mock available Google Classroom tools
    const mockTools = [
      {
        name: 'list_courses',
        description: 'List all courses the user is enrolled in'
      },
      {
        name: 'list_assignments',
        description: 'List assignments for a specific course or all courses'
      },
      {
        name: 'get_assignment_details',
        description: 'Get detailed information about a specific assignment'
      }
    ];

    return NextResponse.json({
      success: true,
      tools: mockTools,
      toolCount: mockTools.length,
    });
  } catch (error) {
    console.error('Error getting tools:', error);
    return NextResponse.json(
      { error: 'Failed to get tools' },
      { status: 500 }
    );
  }
}
