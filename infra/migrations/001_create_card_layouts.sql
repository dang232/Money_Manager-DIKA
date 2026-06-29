-- Card layouts table for persisting user card order preferences
CREATE TABLE IF NOT EXISTS card_layouts (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    layout JSONB NOT NULL DEFAULT '{"categories": [], "budgets": []}',
    version BIGSERIAL NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_card_layouts_user_id ON card_layouts(user_id);

-- GIN index for JSONB queries (if needed for future features)
CREATE INDEX idx_card_layouts_layout ON card_layouts USING GIN (layout);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update
DROP TRIGGER IF EXISTS update_card_layouts_updated_at ON card_layouts;
CREATE TRIGGER update_card_layouts_updated_at
    BEFORE UPDATE ON card_layouts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();