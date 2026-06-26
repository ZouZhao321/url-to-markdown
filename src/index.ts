import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { extractContentTool } from './tools/extract.js'

const server = new McpServer({
  name: 'url-to-markdown',
  version: '1.0.0',
})

server.tool(
  'extract_content',
  '从 URL 提取干净可读的内容并转换为 Markdown 格式',
  {
    url: z.string().url().describe('要提取内容的 URL'),
  },
  async ({ url }) => {
    return await extractContentTool({ url })
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
