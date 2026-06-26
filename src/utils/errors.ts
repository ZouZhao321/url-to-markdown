import { ExtractionError, ExtractContentResult } from '../types/index.js'

export function mapHttpError(statusCode: number): ExtractionError {
  switch (statusCode) {
    case 404:
      return new ExtractionError('页面不存在 (404)', statusCode, false)
    case 429:
      return new ExtractionError('请求过于频繁，稍后重试', statusCode, true)
    default:
      if (statusCode >= 500) {
        return new ExtractionError('服务器错误，正在重试', statusCode, true)
      }
      return new ExtractionError(`请求被拒绝：${statusCode}`, statusCode, false)
  }
}

export function mapNetworkError(code: string): ExtractionError {
  switch (code) {
    case 'ECONNREFUSED':
      return new ExtractionError('无法连接到服务器', undefined, false)
    case 'ENOTFOUND':
      return new ExtractionError('域名不存在或无法解析', undefined, false)
    case 'ECONNABORTED':
      return new ExtractionError('请求超时，正在重试', undefined, true)
    default:
      return new ExtractionError(`网络错误：${code}`, undefined, false)
  }
}

export function createFallbackResult(text: string, isError: boolean = false): ExtractContentResult {
  return {
    content: [{ type: 'text', text }],
    ...(isError && { isError: true }),
  }
}
