import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { BlogSummarizer } from '../../src/utils/summarizer'

describe('BlogSummarizer', () => {
  let summarizer: BlogSummarizer

  beforeEach(() => {
    summarizer = new BlogSummarizer()
    // Reset global window mock before each test
    vi.stubGlobal('window', {
      Summarizer: undefined
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    summarizer.destroy()
  })

  it('should return false if Summarizer API is not available', async () => {
    const supported = await summarizer.isSupported()
    expect(supported).toBe(false)
  })

  it('should return false if availability is "no"', async () => {
    vi.stubGlobal('window', {
      Summarizer: {
        availability: vi.fn().mockResolvedValue('no')
      }
    })
    const supported = await summarizer.isSupported()
    expect(supported).toBe(false)
  })

  it('should throw error in summarizeBlogPost if API is not supported', async () => {
    await expect(summarizer.summarizeBlogPost('test content', { type: 'teaser', length: 'short' }))
      .rejects.toThrow('Summarizer API is not supported in this browser')
  })

  it('should throw error if model download times out', async () => {
    // Mock availability to be 'downloadable' then keep it that way to trigger timeout
    const availabilityMock = vi.fn().mockResolvedValue('downloadable')
    vi.stubGlobal('window', {
      Summarizer: {
        availability: availabilityMock
      }
    })

    vi.useFakeTimers()
    
    // Start the process with a short timeout
    const promise = summarizer.summarizeBlogPost('test content', { 
      type: 'teaser', 
      length: 'short',
      maxWaitTime: 1000 
    })
    
    // Attach a temporary catch to prevent Vitest/Node from flagging this as an unhandled rejection
    // when timers are advanced.
    promise.catch(() => {})
    
    // Fast-forward time past the maxWaitTime
    await vi.advanceTimersByTimeAsync(1500)
    
    // Verify the specific error message
    await expect(promise).rejects.toThrow('Model download timed out. Please try again in a few minutes.')
    
    vi.useRealTimers()
  })

  it('should throw error if initialization fails after successful support check', async () => {
    vi.stubGlobal('window', {
      Summarizer: {
        availability: vi.fn().mockResolvedValue('available'),
        create: vi.fn().mockRejectedValue(new Error('Internal Creation Error'))
      }
    })

    await expect(summarizer.summarizeBlogPost('test content', { type: 'teaser', length: 'short' }))
      .rejects.toThrow('Failed to initialize summarizer')
  })
})