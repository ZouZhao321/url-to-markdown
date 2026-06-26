# URL-to-Markdown MCP服务器设计文档

## 1. 产品概述

### 1.1 核心价值主张
为AI代理（如Claude）提供本地化的智能网页内容提取服务，将URL转换为结构化Markdown格式，替代传统curl命令，提供更好阅读体验的内容。

### 1.2 目标用户
- 个人AI助手用户
- AI开发者
- 需要网页内容提取的开发者

### 1.3 使用场景
- **AI代理获取网络信息**：当AI代理需要读取网页内容时，自动调用此工具
- **内容研究和分析**：批量提取网页内容用于研究
- **自动化内容处理**：集成到自动化工作流中

### 1.4 交互流程
```
用户向Claude提问 → Claude判断需要网络信息 → Claude调用extract_content工具 → 工具返回Markdown内容 → Claude基于内容回答用户
```

**触发方式**：AI代理（如Claude）根据对话内容自动判断是否需要调用工具，无需用户手动指定。

## 2. 技术架构

### 2.1 整体架构
```
Claude等AI代理
      ↓ (MCP协议)
┌─────────────────────────────────────┐
│         URL-to-Markdown MCP服务器   │
│  ┌─────────────────────────────────┐│
│  │         工具接口层              ││
│  │  extract_content(url) → md      ││
│  └─────────────────────────────────┘│
│              ↓                      │
│  ┌─────────────────────────────────┐│
│  │         业务逻辑层              ││
│  │  HTTP请求 → 内容提取 → MD转换   ││
│  └─────────────────────────────────┘│
│              ↓                      │
│  ┌─────────────────────────────────┐│
│  │         依赖库层                ││
│  │  axios + Readability + Turndown ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

### 2.2 技术栈
- **运行时**：Node.js 22+（当前使用22.21.1）
- **语言**：TypeScript
- **MCP SDK**：@modelcontextprotocol/sdk
- **HTTP客户端**：axios（支持超时和重试）
- **内容提取**：@mozilla/readability
- **HTML解析**：jsdom
- **MD转换**：turndown

### 2.3 核心特性
- **本地运行**：无外部API依赖，所有处理在本机完成（需要网络连接访问网页）
- **MCP协议**：通过stdio与AI代理通信
- **单一工具**：只提供`extract_content`工具
- **质量优先**：使用Readability确保内容质量
- **单机部署**：专为个人使用设计，无需高并发处理

## 3. MCP工具设计

### 3.1 工具定义
```json
{
  "name": "extract_content",
  "description": "Extract clean, readable content from a URL and convert to Markdown format",
  "inputSchema": {
    "type": "object",
    "properties": {
      "url": {
        "type": "string",
        "description": "The URL to extract content from",
        "pattern": "^https?://"
      }
    },
    "required": ["url"]
  }
}
```

### 3.2 工具行为

#### 3.2.1 输入验证
- 验证URL格式（必须以http://或https://开头）
- 无效URL立即返回错误

#### 3.2.2 HTTP请求
- 使用axios发送GET请求
- 超时设置：5秒
- User-Agent：模拟正常浏览器

#### 3.2.3 内容提取
- 使用jsdom解析HTML
- 使用Readability提取主要内容
- 过滤广告、导航、页脚等噪音

#### 3.2.4 格式转换
- 使用Turndown将HTML转换为Markdown
- 保留标题、段落、列表、链接等结构

### 3.3 响应格式

#### 成功响应
```json
{
  "content": [
    {
      "type": "text",
      "text": "# 标题\n\n这里是提取的Markdown内容..."
    }
  ]
}
```

#### 错误响应
```json
{
  "content": [
    {
      "type": "text",
      "text": "Error: 页面不存在 (404)"
    }
  ],
  "isError": true
}
```

## 4. 错误处理策略

### 4.1 错误分类和处理

| 错误类型 | 错误消息 | 是否重试 | 重试次数 |
|---------|---------|---------|---------|
| 404 | "页面不存在 (404)" | 否 | 0 |
| 429 | "请求过于频繁，稍后重试" | 是 | 1次（延迟1秒） |
| 500-599 | "服务器错误，正在重试" | 是 | 1次（延迟1秒） |
| 超时 | "请求超时，正在重试" | 是 | 1次（延迟1秒） |
| 连接拒绝 | "无法连接到服务器" | 否 | 0 |
| DNS失败 | "域名不存在或无法解析" | 否 | 0 |
| 其他4xx | "请求被拒绝：{状态码}" | 否 | 0 |
| Readability失败 | "内容提取失败，返回原始内容" | 否（降级处理） | 0 |

**重试策略说明**：
- 所有可重试错误**最多重试1次**
- 重试延迟1秒后执行
- 重试失败后立即返回错误，不再继续重试

### 4.2 重试配置
```typescript
interface RetryConfig {
  maxRetries: number;      // 最大重试次数：1
  retryDelay: number;      // 重试延迟：1000ms
  timeout: number;         // 请求超时：5000ms
}

const retryConfig: RetryConfig = {
  maxRetries: 1,
  retryDelay: 1000,
  timeout: 5000
};
```

### 4.3 降级处理
当Readability无法提取有效内容时：
1. 尝试使用简单的HTML标签清理
2. 移除script、style、nav、footer等标签
3. 提取body标签内的文本内容
4. 转换为基本的Markdown格式

## 5. 内容提取和转换

### 5.1 提取流程
```
URL输入
    ↓
HTTP请求获取HTML
    ↓
HTML预处理（移除script、style、注释）
    ↓
Readability提取主要内容
    ↓
Turndown转换为Markdown
    ↓
Markdown后处理（清理格式）
    ↓
Markdown输出
```

### 5.2 Readability配置
```typescript
const readabilityConfig = {
  charThreshold: 100,        // 最小内容长度阈值
  keepClasses: false,        // 不保留CSS类
  nbTopCandidates: 5,        // 候选内容区域数量
  serializer: (node) => node.innerHTML  // 序列化方式
};
```

**charThreshold说明**：
- 当提取的内容字符数少于100时，Readability可能无法识别有效内容
- 如果内容低于阈值，将触发降级处理流程（见4.3节）
- 降级处理会尝试使用简单的HTML清理方法提取内容

### 5.3 Turndown配置
```typescript
const turndownConfig = {
  headingStyle: 'atx',       // 使用#风格标题
  hr: '---',                 // 水平线格式
  bulletListMarker: '-',     // 无序列表标记
  codeBlockStyle: 'fenced',  // 代码块使用围栏格式
  fence: '```',              // 围栏符号
  emDelimiter: '*',          // 斜体分隔符
  strongDelimiter: '**',     // 粗体分隔符
  linkStyle: 'inlined'       // 链接使用内联格式
};
```

### 5.4 特殊内容处理

| 内容类型 | 处理方式 | 输出格式 |
|---------|---------|---------|
| 标题 | 保留层级结构 | `# 标题` |
| 段落 | 保留段落分隔 | 空行分隔 |
| 列表 | 保留嵌套结构 | `- 项目` |
| 链接 | 保留URL和文本 | `[文本](URL)` |
| 图片 | 保留alt文本和URL | `![alt](URL)` |
| 代码块 | 保留语言标识 | ` ```语言 ` |
| 表格 | 转换为Markdown表格 | `\| 列1 \| 列2 \|` |
| 引用 | 保留引用结构 | `> 引用内容` |

## 6. 项目结构

### 6.1 目录结构
```
url-to-markdown/
├── src/
│   ├── index.ts              # MCP服务器入口
│   ├── tools/
│   │   └── extract.ts        # extract_content工具实现
│   ├── services/
│   │   ├── fetcher.ts        # HTTP请求服务
│   │   ├── extractor.ts      # 内容提取服务
│   │   └── converter.ts      # Markdown转换服务
│   ├── utils/
│   │   ├── errors.ts         # 错误处理工具
│   │   └── retry.ts          # 重试逻辑
│   └── types/
│       └── index.ts          # TypeScript类型定义
├── tests/
│   ├── tools/
│   │   └── extract.test.ts   # 工具测试
│   ├── services/
│   │   ├── fetcher.test.ts   # HTTP请求测试
│   │   ├── extractor.test.ts # 内容提取测试
│   │   └── converter.test.ts # 转换测试
│   └── fixtures/
│       └── sample.html       # 测试用HTML样本
├── package.json              # 项目配置
├── tsconfig.json             # TypeScript配置
├── .eslintrc.json            # ESLint配置
├── jest.config.js            # Jest测试配置
└── README.md                 # 项目文档
```

### 6.2 核心模块职责

| 模块 | 文件 | 职责 |
|------|------|------|
| MCP服务器 | `src/index.ts` | 初始化MCP服务器，注册工具 |
| 工具实现 | `src/tools/extract.ts` | 实现extract_content工具逻辑 |
| HTTP请求 | `src/services/fetcher.ts` | 处理HTTP请求、超时、重试 |
| 内容提取 | `src/services/extractor.ts` | 使用Readability提取主要内容 |
| 格式转换 | `src/services/converter.ts` | 使用Turndown转换为Markdown |
| 错误处理 | `src/utils/errors.ts` | 统一错误类型和消息 |
| 重试逻辑 | `src/utils/retry.ts` | 实现重试策略 |

### 6.3 依赖关系
```
index.ts
    ↓
extract.ts
    ↓
┌─────────────┬─────────────┬─────────────┐
│  fetcher.ts │ extractor.ts│ converter.ts│
└─────────────┴─────────────┴─────────────┘
    ↓
┌─────────────┬─────────────┐
│  errors.ts  │  retry.ts   │
└─────────────┴─────────────┘
```

## 7. 测试策略

### 7.1 测试类型

| 测试类型 | 测试内容 | 测试工具 |
|---------|---------|---------|
| 单元测试 | 各模块独立功能 | Jest |
| 集成测试 | MCP工具完整流程 | Jest + MCP测试工具 |
| 端到端测试 | 实际URL提取效果 | Jest + 真实URL |

### 7.2 测试用例设计
```typescript
// 单元测试示例
describe('extract_content工具', () => {
  test('成功提取网页内容', async () => {
    const result = await extractContent('https://example.com');
    expect(result.content[0].text).toContain('#');
  });

  test('处理404错误', async () => {
    const result = await extractContent('https://example.com/not-found');
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('页面不存在');
  });

  test('处理网络超时', async () => {
    // 测试超时重试逻辑
  });
});
```

## 8. 部署和集成

### 8.1 项目初始化
```bash
# 使用MCP官方脚手架创建项目
npx @modelcontextprotocol/create-server url-to-markdown

# 进入项目目录
cd url-to-markdown

# 安装依赖
npm install

# 添加项目特定依赖
npm install @mozilla/readability jsdom turndown
npm install -D @types/jsdom @types/turndown
```

### 8.2 运行和调试
```bash
# 编译项目
npm run build

# 运行测试
npm test

# 启动MCP服务器
npm start

# 开发模式（自动重编译）
npm run dev
```

### 8.3 与Claude集成
在Claude的MCP配置中添加：
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

## 9. 开发计划

### 9.1 第一阶段：核心功能（2周）
- 使用MCP官方脚手架初始化项目
- 实现基础HTTP请求功能（axios）
- 集成Readability和Turndown
- 实现基本错误处理
- 编写核心功能单元测试

### 9.2 第二阶段：完善和安全（1周）
- 实现重试机制和超时处理
- 添加SSRF安全防护
- 实现降级处理机制
- 完善错误消息

### 9.3 第三阶段：测试和优化（1周）
- 集成测试
- 性能优化
- 文档编写
- 与Claude集成测试

### 9.4 第四阶段：发布（1周）
- 打包和发布
- 用户反馈收集
- 问题修复
- 文档完善

**时间说明**：总计约5周，比原计划更现实，留有缓冲时间应对意外问题。

## 10. 安全考虑

### 10.1 SSRF风险防范
工具接收用户提供的URL并发起HTTP请求，存在潜在的SSRF（服务器端请求伪造）风险。

**防范措施**：
- **URL白名单验证**：只允许http://和https://协议
- **内网地址拦截**：拒绝请求以下地址：
  - localhost、127.0.0.1、0.0.0.0
  - 192.168.x.x、10.x.x.x、172.16-31.x.x
  - IPv6本地地址（::1、fe80::等）
- **端口限制**：只允许80和443端口
- **域名解析检查**：解析域名后检查IP地址是否为内网

### 10.2 请求限制
- **请求频率**：单个URL请求间隔至少1秒
- **内容大小**：限制响应内容最大10MB
- **重定向限制**：最多跟随5次重定向

## 11. 风险和缓解措施

### 11.1 技术风险
- **Readability兼容性**：部分网站可能无法正确提取
  - 容易出问题的网站类型：
    - 需要登录才能访问的网站
    - 有严格反爬虫机制的网站（如Cloudflare防护）
    - 纯JavaScript渲染的单页应用（SPA）
    - 使用动态加载内容的网站（无限滚动等）
    - 有验证码保护的网站
  - 缓解：实现降级处理机制，返回原始HTML文本

- **网络稳定性**：网络请求可能失败
  - 缓解：实现重试机制和超时处理

- **不支持动态内容**：本工具只处理静态HTML页面
  - 不支持JavaScript渲染的内容
  - 不支持需要用户交互才能加载的内容
  - 这是设计决策，不是技术限制

### 11.2 时间风险
- **开发周期**：可能超过预期
  - 缓解：严格遵循MVP原则，优先核心功能

### 11.3 用户接受度
- **用户习惯**：用户可能习惯使用curl
  - 缓解：提供更好的用户体验和文档

## 12. 成功标准

### 12.1 功能标准
- 成功提取90%以上静态网页内容
- 输出Markdown格式正确、可读
- 错误处理完善，用户友好
- SSRF安全防护有效

### 12.2 性能标准
- 平均响应时间3-5秒
- 单机运行稳定
- 资源占用合理（内存<100MB）

### 12.3 用户体验标准
- 与Claude集成顺畅
- 错误信息清晰易懂
- 文档完整、易于使用
- 安装配置简单
