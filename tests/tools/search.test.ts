import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/services/sogou.js', () => ({
  searchSogou: vi.fn(),
}))

import { searchSogou } from '../../src/services/sogou.js'

describe('searchTool', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return formatted search results', async () => {
    vi.mocked(searchSogou).mockResolvedValue({
      query: 'test',
      page: 1,
      results: [
        { title: 'Article 1', link: 'https://example.com/1', publishTime: '2024-01-01', page: 1 },
        { title: 'Article 2', link: 'https://example.com/2', publishTime: '2024-01-02', page: 1 },
      ],
    })

    const { searchTool } = await import('../../src/tools/search.js')
    const result = await searchTool({ query: 'test' })

    expect(result.isError).toBeUndefined()
    expect(result.content[0].text).toContain('Article 1')
    expect(result.content[0].text).toContain('Article 2')
    expect(result.content[0].text).toContain('2 篇文章')
  })

  it('should handle empty results', async () => {
    vi.mocked(searchSogou).mockResolvedValue({
      query: 'test',
      page: 1,
      results: [],
    })

    const { searchTool } = await import('../../src/tools/search.js')
    const result = await searchTool({ query: 'test' })

    expect(result.isError).toBeUndefined()
    expect(result.content[0].text).toContain('未找到')
  })

  it('should handle antispider error', async () => {
    vi.mocked(searchSogou).mockRejectedValue(new Error('触发反爬机制'))

    const { searchTool } = await import('../../src/tools/search.js')
    const result = await searchTool({ query: 'test' })

    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain('反爬')
  })

  it('should handle generic error', async () => {
    vi.mocked(searchSogou).mockRejectedValue(new Error('Some error'))

    const { searchTool } = await import('../../src/tools/search.js')
    const result = await searchTool({ query: 'test' })

    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain('搜索失败')
  })
})
