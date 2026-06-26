import axios, { AxiosError } from 'axios'
import { ExtractionError, RetryConfig } from '../types/index.js'
import { mapHttpError, mapNetworkError } from '../utils/errors.js'
import { withRetry } from '../utils/retry.js'

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 1,
  retryDelay: 1000,
  timeout: 5000,
}

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

async function doFetch(url: string): Promise<string> {
  try {
    const response = await axios.get(url, {
      timeout: DEFAULT_RETRY_CONFIG.timeout,
      headers: { 'User-Agent': USER_AGENT },
      maxRedirects: 5,
      maxContentLength: 10 * 1024 * 1024,
    })
    return response.data
  } catch (err) {
    if (err instanceof AxiosError || (err as AxiosError).isAxiosError) {
      const axiosErr = err as AxiosError
      if (axiosErr.response) {
        throw mapHttpError(axiosErr.response.status)
      }
      if (axiosErr.code) {
        throw mapNetworkError(axiosErr.code)
      }
    }
    throw new ExtractionError(`请求失败：${(err as Error).message}`)
  }
}

export async function fetchUrl(url: string): Promise<string> {
  return withRetry(() => doFetch(url), DEFAULT_RETRY_CONFIG)
}
