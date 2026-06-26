import { describe, test, expect, vi } from 'vitest'
import { withRetry } from '../../src/utils/retry.js'
import { ExtractionError } from '../../src/types/index.js'

describe('withRetry', () => {
  test('首次成功时直接返回结果', async () => {
    const fn = vi.fn<() => Promise<string>>().mockResolvedValue('ok')
    const result = await withRetry(fn, { maxRetries: 1, retryDelay: 0, timeout: 5000 })
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  test('遇到可重试错误后重试并成功', async () => {
    const retryableError = new ExtractionError('超时', undefined, true)
    const fn = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(retryableError)
      .mockResolvedValue('ok')
    const result = await withRetry(fn, { maxRetries: 1, retryDelay: 0, timeout: 5000 })
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  test('遇到不可重试错误时不重试', async () => {
    const error = new ExtractionError('未找到', 404, false)
    const fn = vi.fn<() => Promise<string>>().mockRejectedValue(error)
    await expect(withRetry(fn, { maxRetries: 1, retryDelay: 0, timeout: 5000 })).rejects.toThrow(
      '未找到',
    )
    expect(fn).toHaveBeenCalledTimes(1)
  })

  test('超过最大重试次数后抛出错误', async () => {
    const retryableError = new ExtractionError('超时', undefined, true)
    const fn = vi.fn<() => Promise<string>>().mockRejectedValue(retryableError)
    await expect(withRetry(fn, { maxRetries: 1, retryDelay: 0, timeout: 5000 })).rejects.toThrow(
      '超时',
    )
    expect(fn).toHaveBeenCalledTimes(2)
  })
})
