import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const fixtureHtml = readFileSync(resolve(__dirname, '../fixtures/sogou-search.html'), 'utf-8')

vi.mock('../../src/services/fetcher.js', () => ({
  sogouAxios: {
    get: vi.fn(),
  },
}))

import { sogouAxios } from '../../src/services/fetcher.js'
import { searchSogou } from '../../src/services/sogou.js'

describe('searchSogou', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should parse search results correctly', async () => {
    vi.mocked(sogouAxios.get).mockResolvedValue({
      status: 200,
      data: fixtureHtml,
      url: 'https://weixin.sogou.com/weixin',
    })

    const result = await searchSogou('test', 1)

    expect(result.query).toBe('test')
    expect(result.page).toBe(1)
    expect(result.results.length).toBe(2)
    expect(result.results[0]).toHaveProperty('title', 'AI文章标题1')
    expect(result.results[0]).toHaveProperty('link', 'https://weixin.sogou.com/redirect_0')
    expect(result.results[0]).toHaveProperty('publishTime', '2024-01-13')
    expect(result.results[0]).toHaveProperty('page', 1)
    expect(result.results[1]).toHaveProperty('title', 'AI文章标题2')
    expect(result.results[1]).toHaveProperty('link', 'https://weixin.sogou.com/redirect_1')
    expect(result.results[1]).toHaveProperty('publishTime', '2024-01-14')
  })

  it('should throw error on antispider in strict mode', async () => {
    vi.mocked(sogouAxios.get).mockResolvedValue({
      status: 200,
      data: '<html>seccoderight</html>',
      url: 'https://weixin.sogou.com/antispider',
    })

    await expect(searchSogou('test', 1, true)).rejects.toThrow('反爬')
  })

  it('should also throw on antispider in non-strict mode (source always throws)', async () => {
    // NOTE: source code always throws on antispider detection regardless of strict parameter
    vi.mocked(sogouAxios.get).mockResolvedValue({
      status: 200,
      data: '<html>seccoderight</html>',
      url: 'https://weixin.sogou.com/antispider',
    })

    await expect(searchSogou('test', 1, false)).rejects.toThrow('反爬')
  })

  it('should return empty results on non-200 status', async () => {
    vi.mocked(sogouAxios.get).mockResolvedValue({
      status: 403,
      data: '',
      url: 'https://weixin.sogou.com/weixin',
    })

    const result = await searchSogou('test', 1)
    expect(result.results).toEqual([])
  })

  it('should throw error on non-200 status in strict mode', async () => {
    vi.mocked(sogouAxios.get).mockResolvedValue({
      status: 403,
      data: '',
      url: 'https://weixin.sogou.com/weixin',
    })

    await expect(searchSogou('test', 1, true)).rejects.toThrow('HTTP 403')
  })

  it('should return empty results on network error', async () => {
    vi.mocked(sogouAxios.get).mockRejectedValue(new Error('Network error'))

    const result = await searchSogou('test', 1)
    expect(result.results).toEqual([])
  })

  it('should throw error on network error in strict mode', async () => {
    vi.mocked(sogouAxios.get).mockRejectedValue(new Error('Network error'))

    await expect(searchSogou('test', 1, true)).rejects.toThrow('网络错误')
  })
})
