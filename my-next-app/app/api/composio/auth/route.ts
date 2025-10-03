import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Composio configuration
const COMPOSIO_API_KEY = process.env.COMPOSIO_API_KEY;
const COMPOSIO_BASE_URL = 'https://api.composio.dev'; // CORRECT API BASE URL
const GOOGLE_CLASSROOM_AUTH_CONFIG_ID = 'ac_2uIibC1LpJ1s';

// Enhanced fetch with timeout and retry
async function fetchWithRetry(url: string, options: RequestInit, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Attempt ${i + 1} - Fetching:`, url);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      console.log(`Success on attempt ${i + 1}:`, response.status);
      return response;
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
    }
  }
  throw new Error('All retry attempts failed');
}

// Validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Generate a valid UUID if needed
function ensureValidUserId(userId: string): string {
  if (isValidUUID(userId)) {
    return userId;
  }
  
  // If not a valid UUID, create a deterministic UUID from the string
  // This ensures the same user always gets the same UUID
  const crypto = require('crypto');
  const hash = crypto.createHash('md5').update(userId).digest('hex');
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    '4' + hash.substring(13, 16), // Version 4 UUID
    ((parseInt(hash.substring(16, 17), 16) & 0x3) | 0x8).toString(16) + hash.substring(17, 20),
    hash.substring(20, 32)
  ].join('-');
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== Composio Auth Request Started ===');
    
    let requestBody;
    try {
      const rawBody = await request.text();
      console.log('Raw request body:', rawBody);
      requestBody = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    console.log('Parsed request body:', requestBody);
    const { userId } = requestBody;

    if (!userId || typeof userId !== 'string') {
      console.error('Invalid or missing userId:', userId);
      return NextResponse.json(
        { error: 'Missing or invalid userId' },
        { status: 400 }
      );
    }

    if (!COMPOSIO_API_KEY) {
      console.error('Missing COMPOSIO_API_KEY');
      return NextResponse.json(
        { error: 'Composio API key not configured. Please set COMPOSIO_API_KEY environment variable.' },
        { status: 500 }
      );
    }

    // Ensure userId is in valid UUID format for Composio
    const validUserId = ensureValidUserId(userId);
    console.log('Original userId:', userId);
    console.log('Valid userId for Composio:', validUserId);
    console.log('Using auth config:', GOOGLE_CLASSROOM_AUTH_CONFIG_ID);

    // Use Composio's initiate connection API with proper payload
    const composioPayload = {
      user_id: validUserId,
      auth_config_id: GOOGLE_CLASSROOM_AUTH_CONFIG_ID,
    };

    console.log('Composio API payload:', JSON.stringify(composioPayload, null, 2));
    const apiUrl = `${COMPOSIO_BASE_URL}/api/v1/connectedAccounts/initiate`; // CORRECT V1 API endpoint
    console.log('Composio API URL:', apiUrl);
    console.log('API Key present:', !!COMPOSIO_API_KEY);
    console.log('API Key length:', COMPOSIO_API_KEY?.length || 0);

    // Test network connectivity first
    try {
      console.log('Testing network connectivity to Composio...');
      const testResponse = await fetchWithRetry(`${COMPOSIO_BASE_URL}/health`, {
        method: 'GET',
        headers: { 'User-Agent': 'StudyPal-NextJS/1.0' },
      });
      console.log('Network test result:', testResponse.status);
    } catch (networkError) {
      console.error('Network connectivity test failed:', networkError);
      return NextResponse.json(
        { error: 'Network connectivity issue. Please check your internet connection.' },
        { status: 503 }
      );
    }

    const response = await fetchWithRetry(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': COMPOSIO_API_KEY!,
        'User-Agent': 'StudyPal-NextJS/1.0',
      },
      body: JSON.stringify(composioPayload),
    });

    console.log('Composio API response status:', response.status);
    console.log('Composio API response headers:', Object.fromEntries(response.headers.entries()));

    let data;
    const responseText = await response.text();
    console.log('Raw Composio API response:', responseText);
    
    try {
      data = JSON.parse(responseText);
    } catch (jsonError) {
      console.error('Failed to parse Composio API response as JSON:', jsonError);
      console.error('Response text was:', responseText);
      return NextResponse.json(
        { error: `Invalid JSON response from Composio API: ${responseText}` },
        { status: 500 }
      );
    }

    console.log('Parsed Composio API response:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('Composio API error - Status:', response.status);
      console.error('Composio API error - Data:', data);
      return NextResponse.json(
        { error: data.message || data.error || data.detail || 'Failed to initiate Composio authentication' },
        { status: response.status }
      );
    }

    // Validate that we got the expected response structure
    if (!data.connection_id || !data.redirect_url) {
      console.error('Invalid Composio response structure:', data);
      return NextResponse.json(
        { error: 'Invalid response structure from Composio API' },
        { status: 500 }
      );
    }

    console.log('Storing connection in database...');
    
    // Store the connection request in our database using the original userId
    const { error: dbError } = await supabase
      .from('google_classroom_connections')
      .upsert({
        connection_id: data.connection_id,
        user_id: userId, // Use original userId for database
        status: 'PENDING',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'connection_id' });

    if (dbError) {
      console.error('Database error:', dbError);
      // Don't fail the request for database errors, just log them
    } else {
      console.log('Connection stored successfully in database');
    }

    console.log('=== Composio Auth Request Completed Successfully ===');
    
    return NextResponse.json({
      success: true,
      redirectUrl: data.redirect_url,
      connectionId: data.connection_id,
    });
  } catch (error) {
    console.error('=== Composio Auth Request Failed ===');
    console.error('Error initiating Composio auth:', error);
    console.error('Error stack:', (error as Error).stack);
    return NextResponse.json(
      { error: `Failed to initiate authentication: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get('connectionId');

    if (!connectionId) {
      return NextResponse.json(
        { error: 'Missing connectionId' },
        { status: 400 }
      );
    }

    if (!COMPOSIO_API_KEY) {
      return NextResponse.json(
        { error: 'Composio API key not configured' },
        { status: 500 }
      );
    }

    // Check connection status with Composio API
    const statusApiUrl = `${COMPOSIO_BASE_URL}/api/v1/connectedAccounts/${connectionId}`; // CORRECT V1 API endpoint
    console.log('Checking connection status at:', statusApiUrl);
    const response = await fetchWithRetry(statusApiUrl, {
      method: 'GET',
      headers: {
        'X-API-Key': COMPOSIO_API_KEY!,
        'User-Agent': 'StudyPal-NextJS/1.0',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({
          success: true,
          status: 'PENDING',
          connectedAccount: null,
        });
      }
      
      const errorData = await response.json();
      console.error('Composio API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to check connection status' },
        { status: 500 }
      );
    }

    const connectionData = await response.json();
    
    // Update our database with the latest status
    if (connectionData.status === 'ACTIVE') {
      await supabase
        .from('google_classroom_connections')
        .upsert({
          connection_id: connectionId,
          user_id: connectionData.user_id,
          status: 'ACTIVE',
          connected_at: connectionData.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'connection_id' });
    }
    
    return NextResponse.json({
      success: true,
      status: connectionData.status,
      connectedAccount: connectionData.status === 'ACTIVE' ? {
        id: connectionData.id,
        status: connectionData.status,
        appName: 'Google Classroom',
        connectedAt: connectionData.created_at
      } : null,
    });
  } catch (error) {
    console.error('Error checking connection status:', error);
    return NextResponse.json(
      { error: 'Failed to check connection status' },
      { status: 500 }
    );
  }
}
