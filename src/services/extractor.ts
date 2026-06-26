import { JSDOM } from 'jsdom'
import { Readability } from '@mozilla/readability'

export function extractContent(html: string): string {
  const dom = new JSDOM(html)
  const reader = new Readability(dom.window.document, {
    charThreshold: 100,
    keepClasses: false,
    nbTopCandidates: 5,
  })
  const article = reader.parse()

  if (article && article.content) {
    return article.content
  }

  return fallbackExtract(html)
}

function fallbackExtract(html: string): string {
  const dom = new JSDOM(html)
  const document = dom.window.document

  const removeSelectors = ['script', 'style', 'nav', 'footer', 'header', 'noscript', 'iframe']
  for (const selector of removeSelectors) {
    for (const el of document.querySelectorAll(selector)) {
      el.remove()
    }
  }

  const body = document.body
  return body ? body.innerHTML : ''
}
