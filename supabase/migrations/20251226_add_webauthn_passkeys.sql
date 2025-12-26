-- WebAuthn/Passkey Credentials Table
-- Stores passkey credentials for Face ID / Touch ID / biometric authentication

CREATE TABLE IF NOT EXISTS public.webauthn_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter BIGINT NOT NULL DEFAULT 0,
  device_type TEXT, -- 'platform' for Face ID/Touch ID, 'cross-platform' for security keys
  transports TEXT[], -- e.g., ['internal', 'hybrid']
  device_name TEXT, -- User-friendly name like "iPhone 15 Pro"
  backed_up BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

-- Index for faster lookups by user
CREATE INDEX IF NOT EXISTS webauthn_credentials_user_id_idx ON public.webauthn_credentials(user_id);

-- Index for credential lookup during authentication
CREATE INDEX IF NOT EXISTS webauthn_credentials_credential_id_idx ON public.webauthn_credentials(credential_id);

-- WebAuthn Challenges Table
-- Stores temporary challenges for registration and authentication
CREATE TABLE IF NOT EXISTS public.webauthn_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('registration', 'authentication')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster challenge lookups
CREATE INDEX IF NOT EXISTS webauthn_challenges_challenge_idx ON public.webauthn_challenges(challenge);
CREATE INDEX IF NOT EXISTS webauthn_challenges_user_id_idx ON public.webauthn_challenges(user_id);

-- Enable RLS
ALTER TABLE public.webauthn_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webauthn_challenges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for webauthn_credentials
DROP POLICY IF EXISTS "Users can view own credentials" ON public.webauthn_credentials;
CREATE POLICY "Users can view own credentials"
  ON public.webauthn_credentials FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own credentials" ON public.webauthn_credentials;
CREATE POLICY "Users can insert own credentials"
  ON public.webauthn_credentials FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own credentials" ON public.webauthn_credentials;
CREATE POLICY "Users can update own credentials"
  ON public.webauthn_credentials FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own credentials" ON public.webauthn_credentials;
CREATE POLICY "Users can delete own credentials"
  ON public.webauthn_credentials FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for webauthn_challenges (service role access for auth flow)
DROP POLICY IF EXISTS "Service role can manage challenges" ON public.webauthn_challenges;
CREATE POLICY "Service role can manage challenges"
  ON public.webauthn_challenges FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own challenges" ON public.webauthn_challenges;
CREATE POLICY "Users can view own challenges"
  ON public.webauthn_challenges FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Function to clean up expired challenges
CREATE OR REPLACE FUNCTION clean_expired_webauthn_challenges()
RETURNS void AS $$
BEGIN
  DELETE FROM public.webauthn_challenges WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment for documentation
COMMENT ON TABLE public.webauthn_credentials IS 'Stores WebAuthn/Passkey credentials for biometric authentication (Face ID, Touch ID, etc.)';
COMMENT ON TABLE public.webauthn_challenges IS 'Temporary storage for WebAuthn registration/authentication challenges';

