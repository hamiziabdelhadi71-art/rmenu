-- Add currency field to restaurants table
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'DZD';

-- Update existing restaurants to use DZD
UPDATE restaurants SET currency = 'DZD' WHERE currency IS NULL;
