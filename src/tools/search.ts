import { searchSogou } from '../services/sogou.js'
import { createFallbackResult } from '../utils/errors.js'
import type { SearchParams, ExtractContentResult } from '../types/index.js'

export async function searchTool(params: SearchParams): Promise<ExtractContentResult> {
  const { query, page = 1 } = params

  try {
    const response = await searchSogou(query, page)

    if (response.results.length === 0) {
      return createFallbackResult(`未找到与"${query}"相关的微信公众号文章`)
    }

    const text = response.results
      .map((r, i) => `${i + 1}. ${r.title}\n   链接: ${r.link}\n   发布时间: ${r.publishTime}`)
      .join('\n\n')

    return createFallbackResult(`找到 ${response.results.length} 篇文章:\n\n${text}`)
  } catch (err) {
    const message = (err as Error).message
    if (message.includes('反爬')) {
      return createFallbackResult('触发搜狗反爬机制，请等待几分钟后重试', true)
    }
    return createFallbackResult(`搜索失败: ${message}`, true)
  }
}
