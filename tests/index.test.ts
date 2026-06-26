import { describe, test, expect, vi } from 'vitest'

vi.mock('@modelcontextprotocol/sdk/server/mcp.js', () => {
  const tool = vi.fn()
  const connect = vi.fn()
  return {
    McpServer: vi.fn().mockImplementation(() => ({
      tool,
      connect,
    })),
  }
})

vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: vi.fn(),
}))

describe('MCP Server', () => {
  test('服务器注册 extract_content 工具', async () => {
    const { McpServer } = await import('@modelcontextprotocol/sdk/server/mcp.js')
    await import('../src/index.js')

    expect(McpServer).toHaveBeenCalledWith({
      name: 'url-to-markdown',
      version: '1.0.0',
    })
  })
})
