import { describe, test, expect, vi, beforeEach } from 'vitest'
import { ExtractionError } from '../../src/types/index.js'

vi.mock('axios')

describe('fetchUrl', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  test('成功请求时返回 HTML', async () => {
    const axios = await import('axios')
    vi.mocked(axios.default.get).mockResolvedValueOnce({
      status: 200,
      data: '<html><body>你好</body></html>',
    })

    const { fetchUrl } = await import('../../src/services/fetcher.js')
    const html = await fetchUrl('https://example.com')

    expect(html).toBe('<html><body>你好</body></html>')
    expect(axios.default.get).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({
        timeout: 5000,
        headers: expect.objectContaining({
          'User-Agent': expect.any(String),
        }),
      }),
    )
  })

  test('HTTP 404 时抛出 ExtractionError', async () => {
    const axios = await import('axios')
    const error = Object.assign(new Error('Not Found'), {
      response: { status: 404 },
      isAxiosError: true,
    })
    vi.mocked(axios.default.get).mockRejectedValueOnce(error)

    const { fetchUrl } = await import('../../src/services/fetcher.js')
    await expect(fetchUrl('https://example.com/missing')).rejects.toThrow(ExtractionError)
  })

  test('网络超时时抛出 ExtractionError', async () => {
    const axios = await import('axios')
    const error = Object.assign(new Error('timeout'), {
      code: 'ECONNABORTED',
      isAxiosError: true,
    })
    vi.mocked(axios.default.get).mockRejectedValueOnce(error)

    const { fetchUrl } = await import('../../src/services/fetcher.js')
    await expect(fetchUrl('https://slow.example.com')).rejects.toThrow(ExtractionError)
  })
})
