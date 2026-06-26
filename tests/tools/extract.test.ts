import { describe, test, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/services/fetcher.js')
vi.mock('../../src/services/extractor.js')
vi.mock('../../src/services/converter.js')

describe('extractContentTool', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  test('成功提取时返回 Markdown', async () => {
    const fetcher = await import('../../src/services/fetcher.js')
    const extractor = await import('../../src/services/extractor.js')
    const converter = await import('../../src/services/converter.js')

    vi.mocked(fetcher.fetchUrl).mockResolvedValue('<html><body>内容</body></html>')
    vi.mocked(extractor.extractContent).mockReturnValue('<article>内容</article>')
    vi.mocked(converter.toMarkdown).mockReturnValue('# 内容')

    const { extractContentTool } = await import('../../src/tools/extract.js')
    const result = await extractContentTool({ url: 'https://example.com' })

    expect(result.content[0].text).toBe('# 内容')
    expect(result.isError).toBeUndefined()
    expect(fetcher.fetchUrl).toHaveBeenCalledWith('https://example.com')
  })

  test('无效 URL 时返回错误', async () => {
    const { extractContentTool } = await import('../../src/tools/extract.js')
    const result = await extractContentTool({ url: 'ftp://invalid.com' })
    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain('Error')
  })

  test('URL 为空时返回错误', async () => {
    const { extractContentTool } = await import('../../src/tools/extract.js')
    const result = await extractContentTool({ url: '' })
    expect(result.isError).toBe(true)
  })

  test('请求失败时返回错误结果', async () => {
    const fetcher = await import('../../src/services/fetcher.js')
    const { ExtractionError } = await import('../../src/types/index.js')

    vi.mocked(fetcher.fetchUrl).mockRejectedValue(
      new ExtractionError('页面不存在 (404)', 404, false),
    )

    const { extractContentTool } = await import('../../src/tools/extract.js')
    const result = await extractContentTool({ url: 'https://example.com/missing' })
    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain('页面不存在')
  })

  test('拒绝 localhost URL', async () => {
    const { extractContentTool } = await import('../../src/tools/extract.js')
    const result = await extractContentTool({ url: 'http://localhost:8080/admin' })
    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain('不允许')
  })

  test('拒绝私有 IP 地址 192.168.x.x', async () => {
    const { extractContentTool } = await import('../../src/tools/extract.js')
    const result = await extractContentTool({ url: 'http://192.168.1.1/admin' })
    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain('不允许')
  })

  test('拒绝私有 IP 地址 10.x.x.x', async () => {
    const { extractContentTool } = await import('../../src/tools/extract.js')
    const result = await extractContentTool({ url: 'http://10.0.0.1/secret' })
    expect(result.isError).toBe(true)
  })

  test('拒绝私有 IP 地址 172.16-31.x.x', async () => {
    const { extractContentTool } = await import('../../src/tools/extract.js')
    const result = await extractContentTool({ url: 'http://172.16.0.1/admin' })
    expect(result.isError).toBe(true)
  })
})
