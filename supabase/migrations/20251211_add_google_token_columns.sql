-- Migration: Add Google OAuth token columns to user_settings
-- Date: 2025-12-11
-- Issue: Gmail sync not working because tokens cannot be stored
-- 
-- The auth callback tries to store google_access_token, google_refresh_token,
-- and google_token_updated_at, but these columns don't exist in the table.

-- Add Google OAuth token columns if they don't exist
DO $$ 
BEGIN
    -- Add google_access_token column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_settings' 
        AND column_name = 'google_access_token'
    ) THEN
        ALTER TABLE public.user_settings 
        ADD COLUMN google_access_token TEXT;
        RAISE NOTICE 'Added column: google_access_token';
    ELSE
        RAISE NOTICE 'Column google_access_token already exists';
    END IF;

    -- Add google_refresh_token column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_settings' 
        AND column_name = 'google_refresh_token'
    ) THEN
        ALTER TABLE public.user_settings 
        ADD COLUMN google_refresh_token TEXT;
        RAISE NOTICE 'Added column: google_refresh_token';
    ELSE
        RAISE NOTICE 'Column google_refresh_token already exists';
    END IF;

    -- Add google_token_updated_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_settings' 
        AND column_name = 'google_token_updated_at'
    ) THEN
        ALTER TABLE public.user_settings 
        ADD COLUMN google_token_updated_at TIMESTAMPTZ;
        RAISE NOTICE 'Added column: google_token_updated_at';
    ELSE
        RAISE NOTICE 'Column google_token_updated_at already exists';
    END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN public.user_settings.google_access_token IS 'Google OAuth access token for Calendar/Gmail/Drive APIs';
COMMENT ON COLUMN public.user_settings.google_refresh_token IS 'Google OAuth refresh token for obtaining new access tokens';
COMMENT ON COLUMN public.user_settings.google_token_updated_at IS 'Timestamp when Google tokens were last updated';

-- Create index on user_id for faster token lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id_tokens 
ON public.user_settings(user_id) 
WHERE google_access_token IS NOT NULL;

-- Verify columns were added
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_settings' 
AND column_name LIKE 'google_%'
ORDER BY column_name;







