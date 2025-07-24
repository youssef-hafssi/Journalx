-- Add test data to see if admin dashboard works properly
-- Run this in your Supabase SQL Editor

-- First, let's add some test users (profiles)
INSERT INTO profiles (id, email, name, avatar_url, created_at, updated_at) VALUES
  (gen_random_uuid(), 'john.doe@example.com', 'John Doe', null, now() - interval '10 days', now() - interval '10 days'),
  (gen_random_uuid(), 'jane.smith@example.com', 'Jane Smith', null, now() - interval '8 days', now() - interval '8 days'),
  (gen_random_uuid(), 'mike.johnson@example.com', 'Mike Johnson', null, now() - interval '5 days', now() - interval '5 days'),
  (gen_random_uuid(), 'sarah.wilson@example.com', 'Sarah Wilson', null, now() - interval '3 days', now() - interval '3 days'),
  (gen_random_uuid(), 'alex.brown@example.com', 'Alex Brown', null, now() - interval '1 day', now() - interval '1 day')
ON CONFLICT (email) DO NOTHING;

-- Now let's add some test trades
-- First, get some user IDs to use for trades
WITH test_users AS (
  SELECT id, email FROM profiles 
  WHERE email IN ('john.doe@example.com', 'jane.smith@example.com', 'mike.johnson@example.com', 'sarah.wilson@example.com', 'alex.brown@example.com')
  LIMIT 5
)
INSERT INTO trades (
  id, user_id, symbol, side, trade_type, quantity, price, fee, total, status, pnl, 
  entry_date, exit_date, session, timeframe, entry_price, exit_price, 
  created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  u.id,
  CASE (random() * 4)::int 
    WHEN 0 THEN 'EURUSD'
    WHEN 1 THEN 'GBPUSD' 
    WHEN 2 THEN 'USDJPY'
    WHEN 3 THEN 'AUDUSD'
    ELSE 'USDCAD'
  END,
  CASE (random())::int WHEN 0 THEN 'buy' ELSE 'sell' END,
  CASE (random())::int WHEN 0 THEN 'long' ELSE 'short' END,
  (random() * 100000 + 10000)::numeric(10,2), -- quantity
  (random() * 2 + 1)::numeric(8,5), -- price
  (random() * 10 + 2)::numeric(8,2), -- fee
  (random() * 5000 + 1000)::numeric(10,2), -- total
  'closed',
  (random() * 1000 - 500)::numeric(10,2), -- pnl (can be positive or negative)
  now() - interval '1 hour' * (random() * 240), -- entry_date (last 10 days)
  now() - interval '1 hour' * (random() * 240), -- exit_date
  CASE (random() * 3)::int 
    WHEN 0 THEN 'Asia'
    WHEN 1 THEN 'London' 
    WHEN 2 THEN 'NY AM'
    ELSE 'NY PM'
  END,
  CASE (random() * 3)::int 
    WHEN 0 THEN '1H'
    WHEN 1 THEN '4H' 
    WHEN 2 THEN '1D'
    ELSE '15M'
  END,
  (random() * 2 + 1)::numeric(8,5), -- entry_price
  (random() * 2 + 1)::numeric(8,5), -- exit_price
  now() - interval '1 hour' * (random() * 240), -- created_at
  now() - interval '1 hour' * (random() * 240)  -- updated_at
FROM test_users u, generate_series(1, 3) -- 3 trades per user = 15 total trades
ON CONFLICT DO NOTHING;

-- Let's also add a few more recent trades for "today" activity
WITH recent_user AS (
  SELECT id FROM profiles WHERE email = 'dahafssi@gmail.com' LIMIT 1
)
INSERT INTO trades (
  id, user_id, symbol, side, trade_type, quantity, price, fee, total, status, pnl,
  entry_date, exit_date, session, timeframe, entry_price, exit_price,
  created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  u.id,
  'EURUSD',
  'buy',
  'long',
  50000,
  1.0850,
  5.50,
  2500.00,
  'closed',
  150.00,
  now() - interval '2 hours',
  now() - interval '1 hour',
  'London',
  '1H',
  1.0850,
  1.0880,
  now() - interval '1 hour',
  now() - interval '1 hour'
FROM recent_user u
ON CONFLICT DO NOTHING;

-- Verify the data was inserted
SELECT 'Profiles count:' as info, count(*) as count FROM profiles
UNION ALL
SELECT 'Trades count:' as info, count(*) as count FROM trades;
