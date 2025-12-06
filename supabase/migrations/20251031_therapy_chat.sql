-- Therapy conversation sessions
CREATE TABLE IF NOT EXISTS therapy_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  mood TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual chat messages
CREATE TABLE IF NOT EXISTS therapy_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES therapy_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  feedback TEXT CHECK (feedback IN ('helpful', 'not_helpful', 'neutral')),
  feedback_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User therapy preferences (learned from feedback)
CREATE TABLE IF NOT EXISTS therapy_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preference_type TEXT NOT NULL,
  preference_value JSONB NOT NULL,
  confidence_score NUMERIC DEFAULT 0.5,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, preference_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_therapy_conversations_user ON therapy_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_therapy_messages_conversation ON therapy_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_therapy_messages_created ON therapy_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_therapy_preferences_user ON therapy_preferences(user_id);

-- RLS Policies
ALTER TABLE therapy_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapy_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapy_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations" ON therapy_conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations" ON therapy_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON therapy_conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own messages" ON therapy_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM therapy_conversations 
      WHERE id = conversation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own messages" ON therapy_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM therapy_conversations 
      WHERE id = conversation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own messages feedback" ON therapy_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM therapy_conversations 
      WHERE id = conversation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own preferences" ON therapy_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own preferences" ON therapy_preferences
  FOR ALL USING (auth.uid() = user_id);

























