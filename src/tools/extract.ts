import { ExtractContentParams, ExtractContentResult, ExtractionError } from '../types/index.js'
import { fetchUrl } from '../services/fetcher.js'
import { extractContent } from '../services/extractor.js'
import { toMarkdown } from '../services/converter.js'
import { createFallbackResult } from '../utils/errors.js'

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

function isPrivateHost(hostname: string): boolean {
  if (hostname === 'localhost' || hostname === '0.0.0.0') return true

  const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (ipv4Match) {
    const [, a, b] = ipv4Match.map(Number)
    if (a === 127) return true
    if (a === 10) return true
    if (a === 192 && b === 168) return true
    if (a === 172 && b >= 16 && b <= 31) return true
  }

  if (hostname === '::1' || hostname.startsWith('fe80:')) return true

  return false
}

export async function extractContentTool(
  params: ExtractContentParams,
): Promise<ExtractContentResult> {
  const { url } = params

  if (!url || !isValidUrl(url)) {
    return createFallbackResult('Error: 无效的URL，必须以http://或https://开头', true)
  }

  const parsed = new URL(url)
  if (isPrivateHost(parsed.hostname)) {
    return createFallbackResult('Error: 不允许访问内网地址', true)
  }

  try {
    const html = await fetchUrl(url)
    const contentHtml = extractContent(html)
    const markdown = toMarkdown(contentHtml)
    return createFallbackResult(markdown)
  } catch (err) {
    if (err instanceof ExtractionError) {
      return createFallbackResult(`Error: ${err.message}`, true)
    }
    return createFallbackResult(`Error: 提取失败 - ${(err as Error).message}`, true)
  }
}
