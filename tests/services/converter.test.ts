import { describe, test, expect } from 'vitest'
import { toMarkdown } from '../../src/services/converter.js'

describe('toMarkdown', () => {
  test('将标题转换为 ATX 风格', () => {
    const html = '<h1>标题</h1><h2>副标题</h2>'
    const md = toMarkdown(html)
    expect(md).toContain('# 标题')
    expect(md).toContain('## 副标题')
  })

  test('转换段落', () => {
    const html = '<p>第一段。</p><p>第二段。</p>'
    const md = toMarkdown(html)
    expect(md).toContain('第一段。')
    expect(md).toContain('第二段。')
  })

  test('转换列表', () => {
    const html = '<ul><li>项目 A</li><li>项目 B</li></ul>'
    const md = toMarkdown(html)
    expect(md).toContain('- 项目 A')
    expect(md).toContain('- 项目 B')
  })

  test('转换链接', () => {
    const html = '<p>访问 <a href="https://example.com">示例</a></p>'
    const md = toMarkdown(html)
    expect(md).toContain('[示例](https://example.com)')
  })

  test('转换图片', () => {
    const html = '<img src="https://example.com/img.png" alt="照片">'
    const md = toMarkdown(html)
    expect(md).toContain('![照片](https://example.com/img.png)')
  })

  test('转换代码块', () => {
    const html = '<pre><code class="language-js">const x = 1;</code></pre>'
    const md = toMarkdown(html)
    expect(md).toContain('```')
    expect(md).toContain('const x = 1;')
  })

  test('转换引用块', () => {
    const html = '<blockquote><p>引用内容</p></blockquote>'
    const md = toMarkdown(html)
    expect(md).toContain('> 引用内容')
  })

  test('转换粗体和斜体', () => {
    const html = '<p><strong>粗体</strong>和<em>斜体</em></p>'
    const md = toMarkdown(html)
    expect(md).toContain('**粗体**')
    expect(md).toContain('*斜体*')
  })
})
