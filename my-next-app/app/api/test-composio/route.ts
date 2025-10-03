import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const COMPOSIO_API_KEY = process.env.COMPOSIO_API_KEY;
  
  console.log('=== Composio API Test ===');
  console.log('API Key present:', !!COMPOSIO_API_KEY);
  console.log('API Key length:', COMPOSIO_API_KEY?.length || 0);
  console.log('API Key starts with:', COMPOSIO_API_KEY?.substring(0, 10) + '...');
  
  if (!COMPOSIO_API_KEY) {
    return NextResponse.json({
      error: 'COMPOSIO_API_KEY not found in environment variables'
    }, { status: 500 });
  }

  try {
    // Test basic connectivity to Composio
    console.log('Testing Composio API connectivity...');
    
    const response = await fetch('https://api.composio.dev/api/v1/auth-configs', {
      method: 'GET',
      headers: {
        'X-API-Key': COMPOSIO_API_KEY,
        'User-Agent': 'StudyPal-NextJS/1.0',
      },
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('Response body:', responseText);

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: 'Composio API connection successful',
        status: response.status,
        data: responseText.substring(0, 200) + '...'
      });
    } else {
      return NextResponse.json({
        error: 'Composio API returned error',
        status: response.status,
        response: responseText
      }, { status: response.status });
    }
  } catch (error) {
    console.error('Test failed:', error);
    return NextResponse.json({
      error: 'Network or API error',
      details: (error as Error).message,
      stack: (error as Error).stack
    }, { status: 500 });
  }
}
