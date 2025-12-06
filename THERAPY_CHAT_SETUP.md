# AI Therapy Chat Setup

## Overview
The AI Therapy Chat feature provides a compassionate, feedback-driven conversational AI therapist powered by Google Gemini API.

## Features
- ✅ Real-time chat interface with typing indicators
- ✅ Feedback system (thumbs up/down with optional notes)
- ✅ Context-aware responses based on conversation history
- ✅ Adaptive learning from user feedback
- ✅ Quick reply suggestions
- ✅ Conversation persistence in Supabase
- ✅ User preference learning

## Database Schema
The following tables were created:
- `therapy_conversations` - Session tracking
- `therapy_messages` - All chat messages with feedback
- `therapy_preferences` - Learned user preferences

## Environment Variables
Add these to your `.env.local`:

```bash
# AI Therapy Assistant Configuration
THERAPY_ASSISTANT_ID=asst_9qUg3Px1Hprr0oSgBQfnp19U
GEMINI_API_KEY=your_gemini_api_key_here
```

## Usage

### Access the Chat
Navigate to: `http://localhost:3000/therapy-chat`

### API Endpoints

**POST `/api/therapy-chat`**
Send a message to the therapist
```json
{
  "message": "I'm feeling stressed about work",
  "conversationId": "optional-uuid"
}
```

**POST `/api/therapy-chat/feedback`**
Submit feedback on a response
```json
{
  "messageId": "uuid",
  "feedback": "helpful" | "not_helpful",
  "note": "Optional feedback note"
}
```

## How Feedback Adaptation Works

1. **Positive Feedback** (`helpful`):
   - System learns what types of responses work well
   - Stores patterns in `therapy_preferences` as `helpful_patterns`

2. **Negative Feedback** (`not_helpful`):
   - System learns what to avoid
   - Stores patterns as `unhelpful_patterns`
   - User can provide optional notes for context

3. **Response Generation**:
   - Context includes last 10 messages
   - Recent feedback patterns inform the AI's approach
   - Confidence scores adjust based on feedback frequency

## UI Features

### Quick Replies
On first load, users see suggested quick replies:
- "I'm feeling stressed about work"
- "I've been feeling anxious lately"
- "I'm having trouble sleeping"

### Feedback Flow
1. User receives assistant response
2. Thumbs up → immediate positive feedback
3. Thumbs down → opens text field for detailed feedback
4. Feedback is stored and influences future responses

### Visual Design
- Purple theme matching VAPI branding
- Online status indicator
- Smooth typing animations
- Responsive layout (mobile-friendly)

## Security & Privacy
- Row Level Security (RLS) enabled on all tables
- Users can only access their own conversations
- Messages are encrypted at rest in Supabase
- No PHI (Protected Health Information) is collected

## Limitations & Disclaimers
The AI includes built-in guidelines:
- Never diagnoses or prescribes medical treatment
- Encourages professional help for serious concerns
- Uses empathetic, validating language
- Keeps responses concise (2-4 sentences by default)

## Testing

1. Start the dev server:
```bash
npm run dev
```

2. Navigate to `/therapy-chat`

3. Send a test message

4. Provide feedback (thumbs up/down)

5. Send follow-up messages and observe adaptive responses

## Future Enhancements
- [ ] Voice integration with VAPI
- [ ] Session summaries
- [ ] Export conversation history
- [ ] Mood tracking over time
- [ ] Crisis detection and resource recommendations
- [ ] Multi-language support

## Troubleshooting

**Issue**: "GEMINI_API_KEY not configured"
**Solution**: Add your Gemini API key to `.env.local`

**Issue**: Chat not loading
**Solution**: Verify Supabase connection and user authentication

**Issue**: Feedback not saving
**Solution**: Check browser console for RLS policy errors

## Support
For issues or questions, check:
- Database logs in Supabase dashboard
- Browser console for client-side errors
- API route logs (`/api/therapy-chat`)

























