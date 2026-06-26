import { describe, test, expect } from 'vitest'
import { ExtractionError } from '../../src/types/index.js'
import { mapHttpError, mapNetworkError, createFallbackResult } from '../../src/utils/errors.js'

describe('mapHttpError', () => {
  test('将 404 映射为不可重试错误', () => {
    const error = mapHttpError(404)
    expect(error).toBeInstanceOf(ExtractionError)
    expect(error.message).toBe('页面不存在 (404)')
    expect(error.statusCode).toBe(404)
    expect(error.retryable).toBe(false)
  })

  test('将 429 映射为可重试错误', () => {
    const error = mapHttpError(429)
    expect(error.message).toBe('请求过于频繁，稍后重试')
    expect(error.retryable).toBe(true)
  })

  test('将 500 映射为可重试错误', () => {
    const error = mapHttpError(500)
    expect(error.message).toBe('服务器错误，正在重试')
    expect(error.retryable).toBe(true)
  })

  test('将 503 映射为可重试错误', () => {
    const error = mapHttpError(503)
    expect(error.retryable).toBe(true)
  })

  test('将其他 4xx 映射为不可重试错误', () => {
    const error = mapHttpError(403)
    expect(error.message).toBe('请求被拒绝：403')
    expect(error.retryable).toBe(false)
  })
})

describe('mapNetworkError', () => {
  test('将 ECONNREFUSED 映射为不可重试错误', () => {
    const error = mapNetworkError('ECONNREFUSED')
    expect(error.message).toBe('无法连接到服务器')
    expect(error.retryable).toBe(false)
  })

  test('将 ENOTFOUND 映射为不可重试错误', () => {
    const error = mapNetworkError('ENOTFOUND')
    expect(error.message).toBe('域名不存在或无法解析')
    expect(error.retryable).toBe(false)
  })

  test('将 ECONNABORTED 映射为可重试错误', () => {
    const error = mapNetworkError('ECONNABORTED')
    expect(error.message).toBe('请求超时，正在重试')
    expect(error.retryable).toBe(true)
  })
})

describe('createFallbackResult', () => {
  test('将文本包装为 MCP 内容格式', () => {
    const result = createFallbackResult('降级内容')
    expect(result).toEqual({
      content: [{ type: 'text', text: '降级内容' }],
    })
  })

  test('当 isError 为 true 时创建错误结果', () => {
    const result = createFallbackResult('错误信息', true)
    expect(result).toEqual({
      content: [{ type: 'text', text: '错误信息' }],
      isError: true,
    })
  })
})
