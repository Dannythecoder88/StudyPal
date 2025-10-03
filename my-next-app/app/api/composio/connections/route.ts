import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { connectionId, status } = await request.json();
    const supabase = createRouteHandlerClient({ cookies });

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Store or update the connection in the database
    const { data, error } = await supabase
      .from('google_classroom_connections')
      .upsert({
        user_id: user.id,
        connection_id: connectionId,
        status: status,
        connected_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error storing connection:', error);
      return NextResponse.json(
        { error: 'Failed to store connection' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      connection: data,
    });
  } catch (error) {
    console.error('Error managing connection:', error);
    return NextResponse.json(
      { error: 'Failed to manage connection' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's Google Classroom connection
    const { data, error } = await supabase
      .from('google_classroom_connections')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching connection:', error);
      return NextResponse.json(
        { error: 'Failed to fetch connection' },
        { status: 500 }
      );
    }

    // If we have a connection, simulate verification
    if (data?.connection_id) {
      // For demo purposes, assume connection is active if it exists
      const isActive = data.status === 'ACTIVE';
      
      return NextResponse.json({
        success: true,
        connection: data,
        isConnected: isActive,
      });
    }

    return NextResponse.json({
      success: true,
      connection: data,
      isConnected: false,
    });
  } catch (error) {
    console.error('Error getting connection:', error);
    return NextResponse.json(
      { error: 'Failed to get connection' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Delete the connection from the database
    const { error } = await supabase
      .from('google_classroom_connections')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting connection:', error);
      return NextResponse.json(
        { error: 'Failed to delete connection' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Connection deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting connection:', error);
    return NextResponse.json(
      { error: 'Failed to delete connection' },
      { status: 500 }
    );
  }
}
