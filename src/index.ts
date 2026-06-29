import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { extractContentTool } from './tools/extract.js'
import { searchTool } from './tools/search.js'
import { installSkill } from './commands/init.js'

// CLI init 命令
if (process.argv[2] === 'init') {
  installSkill()
  process.exit(0)
}

// MCP Server
const server = new McpServer({
  name: 'url-to-markdown',
  version: '1.0.0',
})

server.tool(
  'extract',
  '从 URL 提取干净可读的内容并转换为 Markdown 格式',
  {
    url: z.string().url().describe('要提取内容的 URL'),
  },
  async ({ url }) => {
    return await extractContentTool({ url })
  },
)

server.tool(
  'search',
  '搜索微信公众号文章',
  {
    query: z.string().describe('搜索关键词'),
    page: z.number().optional().describe('页码，默认 1'),
  },
  async ({ query, page }) => {
    return await searchTool({ query, page })
  },
)

async function main(): Promise<void> {
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch((err) => {
  console.error('服务器错误:', err)
  process.exit(1)
})
