-- Event Counter Table Initialization
-- Run this SQL in your Supabase project's SQL Editor

-- Drop table if it exists (optional, for clean setup)
-- DROP TABLE IF EXISTS event_counter;

-- Create the event_counter table
CREATE TABLE event_counter (
  id SERIAL PRIMARY KEY,
  count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Initialize with one row for the main counter
INSERT INTO event_counter (count) 
VALUES (0);

-- Create an updated_at trigger to automatically update the timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger
CREATE TRIGGER update_event_counter_updated_at BEFORE UPDATE ON event_counter
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime replication
-- Note: You can also enable this through the Supabase dashboard UI
-- Go to Realtime > Tables and toggle ON for event_counter
ALTER PUBLICATION supabase_realtime ADD TABLE event_counter;

-- Verify the table was created
SELECT * FROM event_counter;
