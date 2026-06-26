export interface ExtractContentParams {
  url: string
}

export interface ExtractContentResult {
  content: Array<{ type: 'text'; text: string }>
  isError?: boolean
}

export interface RetryConfig {
  maxRetries: number
  retryDelay: number
  timeout: number
}

export class ExtractionError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly retryable: boolean = false,
  ) {
    super(message)
    this.name = 'ExtractionError'
  }
}
