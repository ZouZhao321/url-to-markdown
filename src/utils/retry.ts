import { ExtractionError, RetryConfig } from '../types/index.js'

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function withRetry<T>(fn: () => Promise<T>, config: RetryConfig): Promise<T> {
  let lastError: ExtractionError | undefined

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      if (err instanceof ExtractionError) {
        lastError = err
        if (!err.retryable || attempt >= config.maxRetries) {
          throw err
        }
        await sleep(config.retryDelay)
      } else {
        throw err
      }
    }
  }

  throw lastError
}
