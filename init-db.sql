-- Event Counter Table Initialization
-- Run this SQL in your Supabase project's SQL Editor

-- Drop table if it exists (optional, for clean setup)
-- DROP TABLE IF EXISTS event_counter;

-- Create the event_counter table
CREATE TABLE event_counter (
  id SERIAL PRIMARY KEY,
  count INT NOT NULL DEFAULT 0,
  column tickets_sold INT NOT NULL DEFAULT 0,
  max_count INT NOT NULL DEFAULT 300,
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

CREATE TABLE event_counter_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  counter_id int NOT NULL,
  delta int NOT NULL,
  new_count int NOT NULL,
  source text,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

create or replace function update_counter(
  p_counter_id int,
  p_delta int,
  p_source text default null
)
returns int
language plpgsql
as $$
declare
  v_new_count int;
begin
  update event_counter
  set
    count = count + p_delta,
    tickets_sold = tickets_sold + case when p_delta > 0 then p_delta else 0 end
  where id = p_counter_id
  returning count into v_new_count;

  -- Clamp occupancy to 0
  if v_new_count < 0 then
    update event_counter set count = 0 where id = p_counter_id;
    v_new_count := 0;
  end if;

  insert into event_counter_log (
    counter_id,
    delta,
    new_count,
    source
  )
  values (
    p_counter_id,
    p_delta,
    v_new_count,
    p_source
  );

  return v_new_count;
end;
$$;


--- Projects

create table projects (
    id serial primary key,          -- internal unique ID
    slug text not null unique,      -- public stable identifier (used in URLs)
    name text not null,             -- human-readable name
    created_at timestamp with time zone default now()
);

--- Charts

create or replace function get_occupancy_by_minute()
returns table (
  minute timestamptz,
  entries int,
  exits int,
  people_inside int
)
language sql
stable
as $$
with bounds as (
  select
    date_trunc('minute', min(created_at)) as start_minute,
    date_trunc('minute', max(created_at)) as end_minute
  from event_counter_log
  where created_at >= now() - interval '6 hours'
),

minutes as (
  select
    generate_series(
      bounds.start_minute,
      bounds.end_minute,
      interval '1 minute'
    ) as minute
  from bounds
),

per_minute_events as (
  select
    date_trunc('minute', created_at) as minute,
    sum(delta) filter (where delta > 0) as entries,
    abs(sum(delta)) filter (where delta < 0) as exits
  from event_counter_log
  where created_at >= now() - interval '6 hours'
  group by 1
),

occupancy as (
  select
    m.minute,

    -- entries & exits (default 0)
    coalesce(p.entries, 0) as entries,
    coalesce(p.exits, 0) as exits,

    -- authoritative occupancy at end of this minute
    (
      select e.new_count
      from event_counter_log e
      where
        e.created_at < m.minute + interval '1 minute'
        and e.created_at >= now() - interval '6 hours'
      order by e.created_at desc
      limit 1
    ) as people_inside

  from minutes m
  left join per_minute_events p
    on p.minute = m.minute
)

select *
from occupancy
order by minute;
$$;
