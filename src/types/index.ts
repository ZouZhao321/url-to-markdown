export interface ExtractContentParams {
  url: string
}

export interface ExtractContentResult {
  content: Array<{ type: 'text'; text: string }>
  isError?: boolean
  [x: string]: unknown
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

export interface SearchResult {
  title: string
  link: string
  publishTime: string
  page: number
}

export interface SearchParams {
  query: string
  page?: number
}

export interface SearchResponse {
  query: string
  page: number
  results: SearchResult[]
}
