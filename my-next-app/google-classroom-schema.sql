-- Google Classroom integration schema for Composio
-- This schema supports storing Google Classroom connections through Composio platform

-- Table to store Google Classroom connections via Composio
CREATE TABLE IF NOT EXISTS google_classroom_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'PENDING',
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE google_classroom_connections ENABLE ROW LEVEL SECURITY;

-- RLS policies for google_classroom_connections
CREATE POLICY "Users can view their own connections" ON google_classroom_connections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own connections" ON google_classroom_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own connections" ON google_classroom_connections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own connections" ON google_classroom_connections
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_google_classroom_connections_user_id ON google_classroom_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_google_classroom_connections_connection_id ON google_classroom_connections(connection_id);
CREATE INDEX IF NOT EXISTS idx_google_classroom_connections_status ON google_classroom_connections(status);
