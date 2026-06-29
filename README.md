# url-to-markdown

[中文文档](docs/README.zh-CN.md)

An MCP server that extracts web page content from URLs and converts it to clean Markdown.

## Features

- Extracts readable content from any URL using Mozilla Readability
- Converts HTML to clean Markdown via Turndown
- Built-in retry logic for transient failures
- SSRF protection blocks access to private networks
- Automatic fallback extraction when Readability fails

## Installation

```bash
pnpm install
pnpm build
```

## Usage

### With Claude Desktop

Add to your Claude MCP configuration:

```json
{
  "mcpServers": {
    "url-to-markdown": {
      "command": "node",
      "args": ["/path/to/url-to-markdown/build/index.js"]
    }
  }
}
```

### Tool: `extract_content`

Extracts content from a URL and returns Markdown.

**Parameters:**
- `url` (string, required): The URL to extract content from (must start with `http://` or `https://`)

**Returns:** Markdown content or an error message.

### Tool: `search`

Search WeChat public account articles.

**Parameters:**
- `query` (string, required): Search keyword
- `page` (number, optional): Page number, default 1

**Returns:** Search results list or an error message.

## Development

| Command | Description |
|---------|-------------|
| `pnpm dev` | Watch mode |
| `pnpm test` | Run tests |
| `pnpm build` | Build |
| `pnpm lint` | Lint |
| `pnpm format` | Format code |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the [GNU Lesser General Public License v2.1](LICENSE).
