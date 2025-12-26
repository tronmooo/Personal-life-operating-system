/**
 * LifeHub Command Catalog
 *
 * Single source of truth for what the AI assistant is allowed to do.
 * - Used for UI “What can you do?” displays
 * - Used inside system prompts to keep the model aligned with real capabilities
 *
 * IMPORTANT: This file must not contain secrets.
 */
export const AI_ASSISTANT_ACTIONS = [
  // CRUD / data management
  'create_entry',
  'update',
  'delete',
  'bulk_update',
  'bulk_delete',
  'archive',
  'restore',
  'find_duplicates',

  // Planning objects
  'create_task',
  'create_habit',
  'create_bill',
  'create_event',

  // Analysis / reporting
  'analyze',
  'predict',
  'correlate',
  'generate_report',
  'custom_chart',

  // Export
  'export',

  // Utility / navigation
  'navigate',
  'open_tool',
  'execute_code',

  // Integrations
  'add_to_google_calendar',
] as const

export type AIAssistantAction = (typeof AI_ASSISTANT_ACTIONS)[number]

export const VOICE_ACTIONS = ['log', 'add', 'update', 'query', 'schedule', 'navigate'] as const
export type VoiceAction = (typeof VOICE_ACTIONS)[number]

/**
 * Voice parser’s supported domains (as documented in app/api/voice/parse-command/route.ts).
 * Note: this list is broader than the app’s current DOMAIN_CONFIGS union.
 */
export const VOICE_DOMAINS = [
  'health',
  'fitness',
  'nutrition',
  'financial',
  'vehicles',
  'property',
  'tasks',
  'habits',
  'goals',
  'education',
  'career',
  'relationships',
  'pets',
  'travel',
  'hobbies',
  'mindfulness',
  'insurance',
  'legal',
  'appliances',
  'digital-life',
  'app',
] as const

export const VOICE_EXAMPLE_COMMANDS = [
  'My weight is 175 pounds',
  'Log 10000 steps',
  'Add water 16 ounces',
  'Record blood pressure 120 over 80',
  'Log meal chicken salad 450 calories',
  'Add task call dentist',
  'Schedule car service next Tuesday',
  'How much did I spend this month?',
  "What's my net worth?",
  'Show my appointments',
  'Open dashboard',
  'My weight is 175 pounds and log 10000 steps',
] as const

export const COMMAND_CATALOG = {
  version: 1,
  aiAssistantActions: AI_ASSISTANT_ACTIONS,
  voice: {
    actions: VOICE_ACTIONS,
    domains: VOICE_DOMAINS,
    examples: VOICE_EXAMPLE_COMMANDS,
  },
  notes: [
    'For write operations, prefer using /api/ai-assistant/actions (it supports confirmations for destructive operations).',
    'Voice commands use /api/voice/parse-command (OpenAI) with a local regex fallback; execution uses Supabase inserts/updates.',
  ],
} as const

/**
 * Compact prompt snippet to keep the model aligned with real capabilities.
 * Keep this short to avoid blowing token budgets.
 */
export const COMMAND_CATALOG_PROMPT = `\n\nLIFEHUB CAPABILITIES (authoritative):\n- Allowed AI actions: ${AI_ASSISTANT_ACTIONS.join(
  ', '
)}\n- Voice actions: ${VOICE_ACTIONS.join(', ')}\n- If user asks to "do" something, respond by either (1) calling execute_ai_action with an appropriate action + parameters, or (2) asking a brief clarifying question if required fields are missing.\n- Never invent actions outside the allowed list.\n`






































