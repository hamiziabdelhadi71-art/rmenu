-- Create page_views table to track storefront visits
CREATE TABLE IF NOT EXISTS page_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  page_path TEXT,
  referrer TEXT,
  user_agent TEXT,
  session_id TEXT
);

-- Create index for efficient querying by restaurant and date
CREATE INDEX IF NOT EXISTS idx_page_views_restaurant_date ON page_views(restaurant_id, viewed_at DESC);

-- Enable RLS
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (for tracking public page views)
CREATE POLICY "Anyone can insert page views" ON page_views
  FOR INSERT WITH CHECK (true);

-- Only restaurant owners can view their page views
CREATE POLICY "Restaurant owners can view their page views" ON page_views
  FOR SELECT USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = auth.uid()
    )
  );
