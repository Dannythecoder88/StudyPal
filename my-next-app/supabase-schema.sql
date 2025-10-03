-- Create weekly_study_stats table for storing historical weekly study data
CREATE TABLE IF NOT EXISTS weekly_study_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL, -- Monday of the week (YYYY-MM-DD format)
    year INTEGER NOT NULL,
    week_number INTEGER NOT NULL, -- Week number in the year (1-52/53)
    study_data JSONB NOT NULL DEFAULT '{}', -- Daily study minutes: {"monday": 0, "tuesday": 0, ...}
    total_minutes INTEGER NOT NULL DEFAULT 0, -- Sum of all daily minutes for the week
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one record per user per week
    UNIQUE(user_id, week_start_date)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_weekly_study_stats_user_date 
ON weekly_study_stats(user_id, week_start_date DESC);

-- Create index for year/week queries
CREATE INDEX IF NOT EXISTS idx_weekly_study_stats_year_week 
ON weekly_study_stats(user_id, year, week_number);

-- Enable Row Level Security (RLS)
ALTER TABLE weekly_study_stats ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: Users can only access their own weekly study data
CREATE POLICY "Users can manage their own weekly study data" 
ON weekly_study_stats 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Create function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_weekly_study_stats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on row updates
CREATE TRIGGER trigger_update_weekly_study_stats_updated_at
    BEFORE UPDATE ON weekly_study_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_weekly_study_stats_updated_at();

-- Sample data structure for study_data JSONB column:
-- {
--   "monday": 45,
--   "tuesday": 30,
--   "wednesday": 60,
--   "thursday": 0,
--   "friday": 90,
--   "saturday": 20,
--   "sunday": 15
-- }
