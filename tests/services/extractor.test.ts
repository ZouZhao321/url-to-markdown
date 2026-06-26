import { describe, test, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { extractContent } from '../../src/services/extractor.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const fixturePath = join(__dirname, '..', 'fixtures', 'sample.html')

describe('extractContent', () => {
  test('从 HTML 中提取主要内容', () => {
    const html = readFileSync(fixturePath, 'utf-8')
    const result = extractContent(html)
    expect(result).toContain('主标题')
    expect(result).toContain('主要内容')
    expect(result).not.toContain('console.log')
    expect(result).not.toContain('版权所有')
  })

  test('对空 HTML 返回降级结果', () => {
    const result = extractContent('<html><body></body></html>')
    expect(typeof result).toBe('string')
  })
})
