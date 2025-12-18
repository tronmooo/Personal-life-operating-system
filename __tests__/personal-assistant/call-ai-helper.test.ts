import { describe, it, expect } from '@jest/globals'

describe('call-ai-helper', () => {
  it('exports key helper functions', async () => {
    const mod = await import('@/lib/services/call-ai-helper')
    expect(typeof mod.planCallTask).toBe('function')
    expect(typeof mod.generateCallScript).toBe('function')
    expect(typeof mod.summarizeCall).toBe('function')
  })
})

