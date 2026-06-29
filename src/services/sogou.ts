import { JSDOM } from 'jsdom'
import { sogouAxios } from './fetcher.js'
import { ExtractionError } from '../types/index.js'
import type { SearchResponse, SearchResult } from '../types/index.js'

const BASE = 'https://weixin.sogou.com/weixin'

function isAnti(url: string, body: string): boolean {
  const u = url.toLowerCase()
  const b = body.toLowerCase()
  return u.includes('antispider') || b.includes('seccoderight') || b.includes('anti.min.css')
}

export async function searchSogou(
  query: string,
  page = 1,
  strict = false,
): Promise<SearchResponse> {
  const params = new URLSearchParams({
    type: '2',
    s_from: 'input',
    query,
    ie: 'utf8',
    page: String(page),
    _sug_: 'n',
    _sug_type_: '',
  })
  const url = `${BASE}?${params}`

  let response
  try {
    response = await sogouAxios.get(url, {
      headers: {
        Referer: `https://weixin.sogou.com/weixin?query=${encodeURIComponent(query)}`,
      },
    })
  } catch (e) {
    if (strict) throw new ExtractionError(`网络错误: ${(e as Error).message}`, undefined, false)
    return { query, page, results: [] }
  }

  if (response.status !== 200) {
    if (strict) throw new ExtractionError(`HTTP ${response.status}`, response.status, false)
    return { query, page, results: [] }
  }

  const html = response.data as string
  if (isAnti(response.url ?? '', html)) {
    throw new ExtractionError('触发反爬机制，请稍后重试', undefined, false)
  }

  const dom = new JSDOM(html)
  const document = dom.window.document
  const results: SearchResult[] = []

  const links = document.querySelectorAll('a[id^="sogou_vr_11002601_title_"]')
  links.forEach((el) => {
    let link = el.getAttribute('href') ?? ''
    if (link && !link.startsWith('http')) link = `https://weixin.sogou.com${link}`

    const pubEl = document.querySelector(`li[id^="sogou_vr_11002601_box_"] .txt-box .s-p .s2`)

    results.push({
      title: el.textContent?.trim() ?? '',
      link,
      publishTime: pubEl?.textContent?.trim() ?? '',
      page,
    })
  })

  return { query, page, results }
}
