import TurndownService from 'turndown'

const turndown = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  fence: '```',
  emDelimiter: '*',
  strongDelimiter: '**',
  linkStyle: 'inlined',
})

// Override default list item rule to use single space after marker
turndown.addRule('listItem', {
  filter: 'li',
  replacement(content, node) {
    content = content.replace(/^\n+/, '').replace(/\n+$/, '\n').replace(/\n/gm, '\n  ')

    let prefix = '- '
    const parent = node.parentNode as HTMLElement
    if (parent && parent.nodeName === 'OL') {
      const start = parent.getAttribute('start')
      const index = Array.from(parent.children).indexOf(node as Element)
      prefix = (start ? Number(start) + index : index + 1) + '. '
    }

    return prefix + content.trim() + '\n'
  },
})

export function toMarkdown(html: string): string {
  const md = turndown.turndown(html)
  return cleanMarkdown(md)
}

function cleanMarkdown(md: string): string {
  return md
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+|\s+$/g, '')
    .trim()
}
