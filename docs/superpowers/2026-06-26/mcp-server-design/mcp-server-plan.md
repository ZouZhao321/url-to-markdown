# URL-to-Markdown MCP 服务器实现计划

> **致智能体工作者：** 必须使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 来逐步执行此计划。步骤使用复选框 (`- [ ]`) 语法进行跟踪。

**目标：** 构建一个本地 MCP 服务器，从 URL 提取网页内容并转换为干净的 Markdown 格式，供 AI 代理使用。

**架构：** 单工具 MCP 服务器，使用 stdio 传输。三层设计：工具接口层 (`extract.ts`) 协调 HTTP 请求 (`fetcher.ts`)、内容提取 (`extractor.ts`) 和 Markdown 转换 (`converter.ts`)。共享工具模块处理错误和重试逻辑。

**技术栈：** Node.js 22+, TypeScript, @modelcontextprotocol/sdk, axios, @mozilla/readability, jsdom, turndown, Vitest

**开发规则：**
- **实现代码** 由 `node-developer` 子智能体编写
- **测试代码** 由 `node-tester` 子智能体编写
- 同一模块的测试和实现必须由不同智能体完成

---

## 文件结构

```
url-to-markdown/
├── package.json                    # 项目配置、脚本、依赖
├── tsconfig.json                   # TypeScript 编译选项
├── vitest.config.ts                # Vitest 测试运行器配置
├── .eslintrc.json                  # ESLint 配置
├── .prettierrc                     # Prettier 配置
├── .husky/pre-commit               # Git pre-commit 钩子
├── src/
│   ├── index.ts                    # MCP 服务器入口，注册工具
│   ├── types/
│   │   └── index.ts                # 所有 TypeScript 接口和类型
│   ├── utils/
│   │   ├── errors.ts               # 自定义错误类和错误格式化
│   │   └── retry.ts                # 通用重试包装器
│   ├── services/
│   │   ├── fetcher.ts              # 通过 axios 发起 HTTP GET，超时、User-Agent
│   │   ├── extractor.ts            # jsdom + Readability 内容提取
│   │   └── converter.ts            # Turndown HTML 转 Markdown
│   └── tools/
│       └── extract.ts              # extract_content 工具：协调整个流水线
├── tests/
│   ├── fixtures/
│   │   └── sample.html             # 单元测试用的静态 HTML 夹具
│   ├── services/
│   │   ├── fetcher.test.ts         # HTTP 请求测试
│   │   ├── extractor.test.ts       # 内容提取测试
│   │   └── converter.test.ts       # Markdown 转换测试
│   ├── tools/
│   │   └── extract.test.ts         # extract_content 完整流水线测试
│   └── utils/
│       ├── errors.test.ts          # 错误处理测试
│       └── retry.test.ts           # 重试逻辑测试
└── README.md                       # 项目文档
```

---

## 任务 1：项目脚手架搭建

**执行者：** 主会话直接执行

- [ ] **步骤 1：使用 pnpm 初始化项目**

```bash
cd /path/to/url-to-markdown
pnpm init
```

- [ ] **步骤 2：配置 package.json**

手动编辑 `package.json`，补充以下字段:

```json
{
  "name": "url-to-markdown",
  "version": "1.0.0",
  "description": "MCP 服务器，提取网页内容并转换为 Markdown",
  "type": "module",
  "main": "build/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node build/index.js",
    "dev": "tsc --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint src/ tests/",
    "lint:fix": "eslint src/ tests/ --fix",
    "format": "prettier --write 'src/**/*.ts' 'tests/**/*.ts'",
    "format:check": "prettier --check 'src/**/*.ts' 'tests/**/*.ts'",
    "prepare": "husky"
  },
  "keywords": ["mcp", "markdown", "web", "content", "extraction"],
  "license": "MIT",
  "engines": {
    "node": ">=22.0.0"
  }
}
```

- [ ] **步骤 3：安装生产依赖**

```bash
pnpm add @modelcontextprotocol/sdk axios @mozilla/readability jsdom turndown zod
```

- [ ] **步骤 4：安装开发依赖**

```bash
pnpm add -D typescript @types/node @types/jsdom @types/turndown vitest eslint @eslint/js typescript-eslint prettier husky lint-staged
```

- [ ] **步骤 5：创建目录结构**

```bash
mkdir -p src/types src/utils src/services src/tools tests/fixtures tests/services tests/tools tests/utils
```

- [ ] **步骤 6：创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "./build",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "build", "tests"]
}
```

- [ ] **步骤 7：创建 vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
```

- [ ] **步骤 8：创建最小入口文件**

```ts
// src/index.ts
console.log('url-to-markdown 启动中...');
```

- [ ] **步骤 9：验证 TypeScript 编译**

```bash
pnpm build
```

预期: `build/index.js` 创建成功，无错误。

- [ ] **步骤 10：初始化 Git 并提交**

```bash
git init
git add package.json tsconfig.json vitest.config.ts src/index.ts pnpm-lock.yaml .gitignore
git commit -m "chore: 使用 pnpm 初始化项目脚手架"
```

---

## 任务 2：代码格式化、检查和 Git 钩子

**执行者：** 主会话直接执行

- [ ] **步骤 1：创建 .prettierrc**

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

- [ ] **步骤 2：创建 .eslintrc.json**

```json
{
  "root": true,
  "parser": "typescript-eslint/parser",
  "plugins": ["typescript-eslint"],
  "extends": [
    "eslint:recommended",
    "plugin:typescript-eslint/recommended"
  ],
  "env": {
    "node": true,
    "es2022": true
  },
  "rules": {
    "no-console": "off"
  },
  "ignores": ["build/", "node_modules/"]
}
```

- [ ] **步骤 3：初始化 Husky**

```bash
npx husky init
```

- [ ] **步骤 4：配置 pre-commit 钩子**

编辑 `.husky/pre-commit`:

```bash
npx lint-staged
```

- [ ] **步骤 5：在 package.json 中添加 lint-staged 配置**

在 `package.json` 中添加:

```json
{
  "lint-staged": {
    "*.ts": [
      "prettier --write",
      "eslint --fix"
    ]
  }
}
```

- [ ] **步骤 6：验证 lint 和 format**

```bash
pnpm lint
pnpm format:check
```

预期: 无错误。

- [ ] **步骤 7：提交**

```bash
git add .prettierrc .eslintrc.json .husky/pre-commit package.json
git commit -m "chore: 配置 ESLint、Prettier 和 Husky pre-commit 钩子"
```

---

## 任务 3：类型定义

**执行者：** `node-developer` 子智能体

- [ ] **步骤 1：实现类型定义**

创建 `src/types/index.ts`:

```ts
export interface ExtractContentParams {
  url: string;
}

export interface ExtractContentResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  timeout: number;
}

export class ExtractionError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly retryable: boolean = false,
  ) {
    super(message);
    this.name = 'ExtractionError';
  }
}
```

- [ ] **步骤 2：验证编译**

```bash
pnpm build
```

- [ ] **步骤 3：提交**

```bash
git add src/types/index.ts
git commit -m "feat: 添加 TypeScript 类型定义"
```

---

## 任务 4：错误处理工具

### 任务 4a：编写错误处理测试

**执行者：** `node-tester` 子智能体

- [ ] **步骤 1：编写测试**

创建 `tests/utils/errors.test.ts`:

```ts
import { describe, test, expect } from 'vitest';
import { ExtractionError } from '../../src/types/index.js';
import { mapHttpError, mapNetworkError, createFallbackResult } from '../../src/utils/errors.js';

describe('mapHttpError', () => {
  test('将 404 映射为不可重试错误', () => {
    const error = mapHttpError(404);
    expect(error).toBeInstanceOf(ExtractionError);
    expect(error.message).toBe('页面不存在 (404)');
    expect(error.statusCode).toBe(404);
    expect(error.retryable).toBe(false);
  });

  test('将 429 映射为可重试错误', () => {
    const error = mapHttpError(429);
    expect(error.message).toBe('请求过于频繁，稍后重试');
    expect(error.retryable).toBe(true);
  });

  test('将 500 映射为可重试错误', () => {
    const error = mapHttpError(500);
    expect(error.message).toBe('服务器错误，正在重试');
    expect(error.retryable).toBe(true);
  });

  test('将 503 映射为可重试错误', () => {
    const error = mapHttpError(503);
    expect(error.retryable).toBe(true);
  });

  test('将其他 4xx 映射为不可重试错误', () => {
    const error = mapHttpError(403);
    expect(error.message).toBe('请求被拒绝：403');
    expect(error.retryable).toBe(false);
  });
});

describe('mapNetworkError', () => {
  test('将 ECONNREFUSED 映射为不可重试错误', () => {
    const error = mapNetworkError('ECONNREFUSED');
    expect(error.message).toBe('无法连接到服务器');
    expect(error.retryable).toBe(false);
  });

  test('将 ENOTFOUND 映射为不可重试错误', () => {
    const error = mapNetworkError('ENOTFOUND');
    expect(error.message).toBe('域名不存在或无法解析');
    expect(error.retryable).toBe(false);
  });

  test('将 ECONNABORTED 映射为可重试错误', () => {
    const error = mapNetworkError('ECONNABORTED');
    expect(error.message).toBe('请求超时，正在重试');
    expect(error.retryable).toBe(true);
  });
});

describe('createFallbackResult', () => {
  test('将文本包装为 MCP 内容格式', () => {
    const result = createFallbackResult('降级内容');
    expect(result).toEqual({
      content: [{ type: 'text', text: '降级内容' }],
    });
  });

  test('当 isError 为 true 时创建错误结果', () => {
    const result = createFallbackResult('错误信息', true);
    expect(result).toEqual({
      content: [{ type: 'text', text: '错误信息' }],
      isError: true,
    });
  });
});
```

- [ ] **步骤 2：验证测试失败**

```bash
pnpm test -- tests/utils/errors.test.ts
```

预期: 失败 — 模块未找到。

- [ ] **步骤 3：提交测试**

```bash
git add tests/utils/errors.test.ts
git commit -m "test: 添加错误处理工具的单元测试"
```

### 任务 4b：实现错误处理工具

**执行者：** `node-developer` 子智能体

- [ ] **步骤 1：实现 errors.ts**

创建 `src/utils/errors.ts`:

```ts
import { ExtractionError, ExtractContentResult } from '../types/index.js';

export function mapHttpError(statusCode: number): ExtractionError {
  switch (statusCode) {
    case 404:
      return new ExtractionError('页面不存在 (404)', statusCode, false);
    case 429:
      return new ExtractionError('请求过于频繁，稍后重试', statusCode, true);
    default:
      if (statusCode >= 500) {
        return new ExtractionError('服务器错误，正在重试', statusCode, true);
      }
      return new ExtractionError(`请求被拒绝：${statusCode}`, statusCode, false);
  }
}

export function mapNetworkError(code: string): ExtractionError {
  switch (code) {
    case 'ECONNREFUSED':
      return new ExtractionError('无法连接到服务器', undefined, false);
    case 'ENOTFOUND':
      return new ExtractionError('域名不存在或无法解析', undefined, false);
    case 'ECONNABORTED':
      return new ExtractionError('请求超时，正在重试', undefined, true);
    default:
      return new ExtractionError(`网络错误：${code}`, undefined, false);
  }
}

export function createFallbackResult(text: string, isError: boolean = false): ExtractContentResult {
  return {
    content: [{ type: 'text', text }],
    ...(isError && { isError: true }),
  };
}
```

- [ ] **步骤 2：运行测试验证通过**

```bash
pnpm test -- tests/utils/errors.test.ts
```

预期: 全部 8 个测试通过。

- [ ] **步骤 3：提交**

```bash
git add src/utils/errors.ts
git commit -m "feat: 实现错误处理工具，支持 HTTP 和网络错误映射"
```

---

## 任务 5：重试逻辑

### 任务 5a：编写重试逻辑测试

**执行者：** `node-tester` 子智能体

- [ ] **步骤 1：编写测试**

创建 `tests/utils/retry.test.ts`:

```ts
import { describe, test, expect, vi } from 'vitest';
import { withRetry } from '../../src/utils/retry.js';
import { ExtractionError } from '../../src/types/index.js';

describe('withRetry', () => {
  test('首次成功时直接返回结果', async () => {
    const fn = vi.fn<() => Promise<string>>().mockResolvedValue('ok');
    const result = await withRetry(fn, { maxRetries: 1, retryDelay: 0, timeout: 5000 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('遇到可重试错误后重试并成功', async () => {
    const retryableError = new ExtractionError('超时', undefined, true);
    const fn = vi.fn<() => Promise<string>>()
      .mockRejectedValueOnce(retryableError)
      .mockResolvedValue('ok');
    const result = await withRetry(fn, { maxRetries: 1, retryDelay: 0, timeout: 5000 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  test('遇到不可重试错误时不重试', async () => {
    const error = new ExtractionError('未找到', 404, false);
    const fn = vi.fn<() => Promise<string>>().mockRejectedValue(error);
    await expect(withRetry(fn, { maxRetries: 1, retryDelay: 0, timeout: 5000 })).rejects.toThrow(
      '未找到',
    );
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('超过最大重试次数后抛出错误', async () => {
    const retryableError = new ExtractionError('超时', undefined, true);
    const fn = vi.fn<() => Promise<string>>().mockRejectedValue(retryableError);
    await expect(withRetry(fn, { maxRetries: 1, retryDelay: 0, timeout: 5000 })).rejects.toThrow(
      '超时',
    );
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **步骤 2：验证测试失败**

```bash
pnpm test -- tests/utils/retry.test.ts
```

预期: 失败 — 模块未找到。

- [ ] **步骤 3：提交测试**

```bash
git add tests/utils/retry.test.ts
git commit -m "test: 添加重试逻辑的单元测试"
```

### 任务 5b：实现重试逻辑

**执行者：** `node-developer` 子智能体

- [ ] **步骤 1：实现 retry.ts**

创建 `src/utils/retry.ts`:

```ts
import { ExtractionError, RetryConfig } from '../types/index.js';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(fn: () => Promise<T>, config: RetryConfig): Promise<T> {
  let lastError: ExtractionError | undefined;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (err instanceof ExtractionError) {
        lastError = err;
        if (!err.retryable || attempt >= config.maxRetries) {
          throw err;
        }
        await sleep(config.retryDelay);
      } else {
        throw err;
      }
    }
  }

  throw lastError;
}
```

- [ ] **步骤 2：运行测试验证通过**

```bash
pnpm test -- tests/utils/retry.test.ts
```

预期: 全部 4 个测试通过。

- [ ] **步骤 3：提交**

```bash
git add src/utils/retry.ts
git commit -m "feat: 实现可配置延迟的重试包装器"
```

---

## 任务 6：HTTP 请求服务

### 任务 6a：编写 fetcher 测试

**执行者：** `node-tester` 子智能体

- [ ] **步骤 1：编写测试**

创建 `tests/services/fetcher.test.ts`:

```ts
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { ExtractionError } from '../../src/types/index.js';

vi.mock('axios');

describe('fetchUrl', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('成功请求时返回 HTML', async () => {
    const axios = await import('axios');
    vi.mocked(axios.default.get).mockResolvedValueOnce({
      status: 200,
      data: '<html><body>你好</body></html>',
    });

    const { fetchUrl } = await import('../../src/services/fetcher.js');
    const html = await fetchUrl('https://example.com');

    expect(html).toBe('<html><body>你好</body></html>');
    expect(axios.default.get).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({
        timeout: 5000,
        headers: expect.objectContaining({
          'User-Agent': expect.any(String),
        }),
      }),
    );
  });

  test('HTTP 404 时抛出 ExtractionError', async () => {
    const axios = await import('axios');
    const error = Object.assign(new Error('Not Found'), {
      response: { status: 404 },
      isAxiosError: true,
    });
    vi.mocked(axios.default.get).mockRejectedValueOnce(error);

    const { fetchUrl } = await import('../../src/services/fetcher.js');
    await expect(fetchUrl('https://example.com/missing')).rejects.toThrow(ExtractionError);
  });

  test('网络超时时抛出 ExtractionError', async () => {
    const axios = await import('axios');
    const error = Object.assign(new Error('timeout'), {
      code: 'ECONNABORTED',
      isAxiosError: true,
    });
    vi.mocked(axios.default.get).mockRejectedValueOnce(error);

    const { fetchUrl } = await import('../../src/services/fetcher.js');
    await expect(fetchUrl('https://slow.example.com')).rejects.toThrow(ExtractionError);
  });
});
```

- [ ] **步骤 2：验证测试失败**

```bash
pnpm test -- tests/services/fetcher.test.ts
```

预期: 失败 — 模块未找到。

- [ ] **步骤 3：提交测试**

```bash
git add tests/services/fetcher.test.ts
git commit -m "test: 添加 HTTP fetcher 的单元测试"
```

### 任务 6b：实现 fetcher

**执行者：** `node-developer` 子智能体

- [ ] **步骤 1：实现 fetcher.ts**

创建 `src/services/fetcher.ts`:

```ts
import axios, { AxiosError } from 'axios';
import { ExtractionError, RetryConfig } from '../types/index.js';
import { mapHttpError, mapNetworkError } from '../utils/errors.js';
import { withRetry } from '../utils/retry.js';

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 1,
  retryDelay: 1000,
  timeout: 5000,
};

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function doFetch(url: string): Promise<string> {
  try {
    const response = await axios.get(url, {
      timeout: DEFAULT_RETRY_CONFIG.timeout,
      headers: { 'User-Agent': USER_AGENT },
      maxRedirects: 5,
      maxContentLength: 10 * 1024 * 1024,
    });
    return response.data;
  } catch (err) {
    if (err instanceof AxiosError || (err as AxiosError).isAxiosError) {
      const axiosErr = err as AxiosError;
      if (axiosErr.response) {
        throw mapHttpError(axiosErr.response.status);
      }
      if (axiosErr.code) {
        throw mapNetworkError(axiosErr.code);
      }
    }
    throw new ExtractionError(`请求失败：${(err as Error).message}`);
  }
}

export async function fetchUrl(url: string): Promise<string> {
  return withRetry(() => doFetch(url), DEFAULT_RETRY_CONFIG);
}
```

- [ ] **步骤 2：运行测试验证通过**

```bash
pnpm test -- tests/services/fetcher.test.ts
```

预期: 全部 3 个测试通过。

- [ ] **步骤 3：提交**

```bash
git add src/services/fetcher.ts
git commit -m "feat: 实现 HTTP 请求服务，支持超时和错误映射"
```

---

## 任务 7：内容提取服务

### 任务 7a：编写 extractor 测试

**执行者：** `node-tester` 子智能体

- [ ] **步骤 1：创建测试夹具**

创建 `tests/fixtures/sample.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <title>测试文章</title>
  <style>body { font-family: sans-serif; }</style>
  <script>console.log('噪音');</script>
</head>
<body>
  <nav><a href="/">首页</a> | <a href="/about">关于</a></nav>
  <article>
    <h1>主标题</h1>
    <p>这是文章的主要内容。包含足够的文本来通过 Readability 的阈值检测。这里需要有足够的文字才能被正确识别为有效内容。</p>
    <p>第二段包含更多内容，确保提取功能正常工作。额外的文字填充以满足最低字符要求。</p>
    <ul>
      <li>项目一</li>
      <li>项目二</li>
    </ul>
  </article>
  <footer><p>版权所有 2024</p></footer>
</body>
</html>
```

- [ ] **步骤 2：编写测试**

创建 `tests/services/extractor.test.ts`:

```ts
import { describe, test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { extractContent } from '../../src/services/extractor.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturePath = join(__dirname, '..', 'fixtures', 'sample.html');

describe('extractContent', () => {
  test('从 HTML 中提取主要内容', () => {
    const html = readFileSync(fixturePath, 'utf-8');
    const result = extractContent(html);
    expect(result).toContain('主标题');
    expect(result).toContain('主要内容');
    expect(result).not.toContain('console.log');
    expect(result).not.toContain('版权所有');
  });

  test('对空 HTML 返回降级结果', () => {
    const result = extractContent('<html><body></body></html>');
    expect(typeof result).toBe('string');
  });
});
```

- [ ] **步骤 3：验证测试失败**

```bash
pnpm test -- tests/services/extractor.test.ts
```

预期: 失败 — 模块未找到。

- [ ] **步骤 4：提交测试**

```bash
git add tests/services/extractor.test.ts tests/fixtures/sample.html
git commit -m "test: 添加内容提取服务的单元测试"
```

### 任务 7b：实现 extractor

**执行者：** `node-developer` 子智能体

- [ ] **步骤 1：实现 extractor.ts**

创建 `src/services/extractor.ts`:

```ts
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

export function extractContent(html: string): string {
  const dom = new JSDOM(html);
  const reader = new Readability(dom.window.document, {
    charThreshold: 100,
    keepClasses: false,
    nbTopCandidates: 5,
  });
  const article = reader.parse();

  if (article && article.content) {
    return article.content;
  }

  return fallbackExtract(html);
}

function fallbackExtract(html: string): string {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  const removeSelectors = ['script', 'style', 'nav', 'footer', 'header', 'noscript', 'iframe'];
  for (const selector of removeSelectors) {
    for (const el of document.querySelectorAll(selector)) {
      el.remove();
    }
  }

  const body = document.body;
  return body ? body.innerHTML : '';
}
```

- [ ] **步骤 2：运行测试验证通过**

```bash
pnpm test -- tests/services/extractor.test.ts
```

预期: 全部 2 个测试通过。

- [ ] **步骤 3：提交**

```bash
git add src/services/extractor.ts
git commit -m "feat: 实现内容提取服务，使用 Readability 并支持降级处理"
```

---

## 任务 8：Markdown 转换服务

### 任务 8a：编写 converter 测试

**执行者：** `node-tester` 子智能体

- [ ] **步骤 1：编写测试**

创建 `tests/services/converter.test.ts`:

```ts
import { describe, test, expect } from 'vitest';
import { toMarkdown } from '../../src/services/converter.js';

describe('toMarkdown', () => {
  test('将标题转换为 ATX 风格', () => {
    const html = '<h1>标题</h1><h2>副标题</h2>';
    const md = toMarkdown(html);
    expect(md).toContain('# 标题');
    expect(md).toContain('## 副标题');
  });

  test('转换段落', () => {
    const html = '<p>第一段。</p><p>第二段。</p>';
    const md = toMarkdown(html);
    expect(md).toContain('第一段。');
    expect(md).toContain('第二段。');
  });

  test('转换列表', () => {
    const html = '<ul><li>项目 A</li><li>项目 B</li></ul>';
    const md = toMarkdown(html);
    expect(md).toContain('- 项目 A');
    expect(md).toContain('- 项目 B');
  });

  test('转换链接', () => {
    const html = '<p>访问 <a href="https://example.com">示例</a></p>';
    const md = toMarkdown(html);
    expect(md).toContain('[示例](https://example.com)');
  });

  test('转换图片', () => {
    const html = '<img src="https://example.com/img.png" alt="照片">';
    const md = toMarkdown(html);
    expect(md).toContain('![照片](https://example.com/img.png)');
  });

  test('转换代码块', () => {
    const html = '<pre><code class="language-js">const x = 1;</code></pre>';
    const md = toMarkdown(html);
    expect(md).toContain('```');
    expect(md).toContain('const x = 1;');
  });

  test('转换引用块', () => {
    const html = '<blockquote><p>引用内容</p></blockquote>';
    const md = toMarkdown(html);
    expect(md).toContain('> 引用内容');
  });

  test('转换粗体和斜体', () => {
    const html = '<p><strong>粗体</strong>和<em>斜体</em></p>';
    const md = toMarkdown(html);
    expect(md).toContain('**粗体**');
    expect(md).toContain('*斜体*');
  });
});
```

- [ ] **步骤 2：验证测试失败**

```bash
pnpm test -- tests/services/converter.test.ts
```

预期: 失败 — 模块未找到。

- [ ] **步骤 3：提交测试**

```bash
git add tests/services/converter.test.ts
git commit -m "test: 添加 Markdown 转换服务的单元测试"
```

### 任务 8b：实现 converter

**执行者：** `node-developer` 子智能体

- [ ] **步骤 1：实现 converter.ts**

创建 `src/services/converter.ts`:

```ts
import TurndownService from 'turndown';

const turndown = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  fence: '```',
  emDelimiter: '*',
  strongDelimiter: '**',
  linkStyle: 'inlined',
});

export function toMarkdown(html: string): string {
  const md = turndown.turndown(html);
  return cleanMarkdown(md);
}

function cleanMarkdown(md: string): string {
  return md
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+|\s+$/g, '')
    .trim();
}
```

- [ ] **步骤 2：运行测试验证通过**

```bash
pnpm test -- tests/services/converter.test.ts
```

预期: 全部 8 个测试通过。

- [ ] **步骤 3：提交**

```bash
git add src/services/converter.ts
git commit -m "feat: 实现 Markdown 转换服务，使用 Turndown"
```

---

## 任务 9：Extract Content 工具（协调器）

### 任务 9a：编写 extract 工具测试

**执行者：** `node-tester` 子智能体

- [ ] **步骤 1：编写测试**

创建 `tests/tools/extract.test.ts`:

```ts
import { describe, test, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/services/fetcher.js');
vi.mock('../../src/services/extractor.js');
vi.mock('../../src/services/converter.js');

describe('extractContentTool', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('成功提取时返回 Markdown', async () => {
    const fetcher = await import('../../src/services/fetcher.js');
    const extractor = await import('../../src/services/extractor.js');
    const converter = await import('../../src/services/converter.js');

    vi.mocked(fetcher.fetchUrl).mockResolvedValue('<html><body>内容</body></html>');
    vi.mocked(extractor.extractContent).mockReturnValue('<article>内容</article>');
    vi.mocked(converter.toMarkdown).mockReturnValue('# 内容');

    const { extractContentTool } = await import('../../src/tools/extract.js');
    const result = await extractContentTool({ url: 'https://example.com' });

    expect(result.content[0].text).toBe('# 内容');
    expect(result.isError).toBeUndefined();
    expect(fetcher.fetchUrl).toHaveBeenCalledWith('https://example.com');
  });

  test('无效 URL 时返回错误', async () => {
    const { extractContentTool } = await import('../../src/tools/extract.js');
    const result = await extractContentTool({ url: 'ftp://invalid.com' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Error');
  });

  test('URL 为空时返回错误', async () => {
    const { extractContentTool } = await import('../../src/tools/extract.js');
    const result = await extractContentTool({ url: '' });
    expect(result.isError).toBe(true);
  });

  test('请求失败时返回错误结果', async () => {
    const fetcher = await import('../../src/services/fetcher.js');
    const { ExtractionError } = await import('../../src/types/index.js');

    vi.mocked(fetcher.fetchUrl).mockRejectedValue(
      new ExtractionError('页面不存在 (404)', 404, false),
    );

    const { extractContentTool } = await import('../../src/tools/extract.js');
    const result = await extractContentTool({ url: 'https://example.com/missing' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('页面不存在');
  });

  test('拒绝 localhost URL', async () => {
    const { extractContentTool } = await import('../../src/tools/extract.js');
    const result = await extractContentTool({ url: 'http://localhost:8080/admin' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('不允许');
  });

  test('拒绝私有 IP 地址 192.168.x.x', async () => {
    const { extractContentTool } = await import('../../src/tools/extract.js');
    const result = await extractContentTool({ url: 'http://192.168.1.1/admin' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('不允许');
  });

  test('拒绝私有 IP 地址 10.x.x.x', async () => {
    const { extractContentTool } = await import('../../src/tools/extract.js');
    const result = await extractContentTool({ url: 'http://10.0.0.1/secret' });
    expect(result.isError).toBe(true);
  });

  test('拒绝私有 IP 地址 172.16-31.x.x', async () => {
    const { extractContentTool } = await import('../../src/tools/extract.js');
    const result = await extractContentTool({ url: 'http://172.16.0.1/admin' });
    expect(result.isError).toBe(true);
  });
});
```

- [ ] **步骤 2：验证测试失败**

```bash
pnpm test -- tests/tools/extract.test.ts
```

预期: 失败 — 模块未找到。

- [ ] **步骤 3：提交测试**

```bash
git add tests/tools/extract.test.ts
git commit -m "test: 添加 extract_content 工具的单元测试，含 SSRF 防护测试"
```

### 任务 9b：实现 extract 工具

**执行者：** `node-developer` 子智能体

- [ ] **步骤 1：实现 extract.ts**

创建 `src/tools/extract.ts`:

```ts
import { ExtractContentParams, ExtractContentResult, ExtractionError } from '../types/index.js';
import { fetchUrl } from '../services/fetcher.js';
import { extractContent } from '../services/extractor.js';
import { toMarkdown } from '../services/converter.js';
import { createFallbackResult } from '../utils/errors.js';

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function isPrivateHost(hostname: string): boolean {
  if (hostname === 'localhost' || hostname === '0.0.0.0') return true;

  const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [, a, b] = ipv4Match.map(Number);
    if (a === 127) return true;
    if (a === 10) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
  }

  if (hostname === '::1' || hostname.startsWith('fe80:')) return true;

  return false;
}

export async function extractContentTool(
  params: ExtractContentParams,
): Promise<ExtractContentResult> {
  const { url } = params;

  if (!url || !isValidUrl(url)) {
    return createFallbackResult('Error: 无效的URL，必须以http://或https://开头', true);
  }

  const parsed = new URL(url);
  if (isPrivateHost(parsed.hostname)) {
    return createFallbackResult('Error: 不允许访问内网地址', true);
  }

  try {
    const html = await fetchUrl(url);
    const contentHtml = extractContent(html);
    const markdown = toMarkdown(contentHtml);
    return createFallbackResult(markdown);
  } catch (err) {
    if (err instanceof ExtractionError) {
      return createFallbackResult(`Error: ${err.message}`, true);
    }
    return createFallbackResult(`Error: 提取失败 - ${(err as Error).message}`, true);
  }
}
```

- [ ] **步骤 2：运行测试验证通过**

```bash
pnpm test -- tests/tools/extract.test.ts
```

预期: 全部 8 个测试通过。

- [ ] **步骤 3：提交**

```bash
git add src/tools/extract.ts
git commit -m "feat: 实现 extract_content 工具，含 SSRF 防护"
```

---

## 任务 10：MCP 服务器入口

### 任务 10a：编写 MCP 服务器测试

**执行者：** `node-tester` 子智能体

- [ ] **步骤 1：编写测试**

创建 `tests/index.test.ts`:

```ts
import { describe, test, expect, vi } from 'vitest';

vi.mock('@modelcontextprotocol/sdk/server/mcp.js', () => {
  const tool = vi.fn();
  const connect = vi.fn();
  return {
    McpServer: vi.fn().mockImplementation(() => ({
      tool,
      connect,
    })),
  };
});

vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: vi.fn(),
}));

describe('MCP Server', () => {
  test('服务器注册 extract_content 工具', async () => {
    const { McpServer } = await import('@modelcontextprotocol/sdk/server/mcp.js');
    const mod = await import('../../src/index.js');

    expect(McpServer).toHaveBeenCalledWith({
      name: 'url-to-markdown',
      version: '1.0.0',
    });
  });
});
```

- [ ] **步骤 2：验证测试失败**

```bash
pnpm test -- tests/index.test.ts
```

预期: 失败。

- [ ] **步骤 3：提交测试**

```bash
git add tests/index.test.ts
git commit -m "test: 添加 MCP 服务器入口的单元测试"
```

### 任务 10b：实现 MCP 服务器入口

**执行者：** `node-developer` 子智能体

- [ ] **步骤 1：实现 index.ts**

重写 `src/index.ts`:

```ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { extractContentTool } from './tools/extract.js';

const server = new McpServer({
  name: 'url-to-markdown',
  version: '1.0.0',
});

server.tool(
  'extract_content',
  '从 URL 提取干净可读的内容并转换为 Markdown 格式',
  {
    url: z.string().url().describe('要提取内容的 URL'),
  },
  async ({ url }) => {
    return await extractContentTool({ url });
  },
);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error('服务器错误:', err);
  process.exit(1);
});
```

- [ ] **步骤 2：验证编译和测试**

```bash
pnpm build
pnpm test
```

预期: 编译成功，所有测试通过。

- [ ] **步骤 3：提交**

```bash
git add src/index.ts
git commit -m "feat: 实现 MCP 服务器入口，注册 extract_content 工具"
```

---

## 任务 11：集成验证与文档

**执行者：** 主会话直接执行

- [ ] **步骤 1：运行完整测试套件**

```bash
pnpm test
```

预期: 所有测试通过。

- [ ] **步骤 2：验证构建**

```bash
pnpm build
ls build/
```

预期: `index.js`, `types/`, `utils/`, `services/`, `tools/` 全部存在。

- [ ] **步骤 3：验证 lint 和格式**

```bash
pnpm lint
pnpm format:check
```

预期: 无错误。

- [ ] **步骤 4：编写 README.md**

```markdown
# url-to-markdown

MCP 服务器，提取网页内容并转换为干净的 Markdown 格式。

## 功能特性

- 使用 Mozilla Readability 从任意 URL 提取可读内容
- 使用 Turndown 将 HTML 转换为干净的 Markdown
- 内置重试逻辑处理瞬时故障
- SSRF 防护阻止访问私有网络
- Readability 失败时自动降级提取

## 安装

```bash
pnpm install
pnpm build
```

## 使用方法

### 配合 Claude Desktop

在 Claude MCP 配置中添加:

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

### 工具: `extract_content`

从 URL 提取内容并返回 Markdown。

**参数:**
- `url` (string, 必填): 要提取内容的 URL（必须以 http:// 或 https:// 开头）

**返回:** Markdown 内容或错误信息。

## 开发

```bash
pnpm dev        # 监听模式
pnpm test       # 运行测试
pnpm build      # 编译 TypeScript
pnpm lint       # 代码检查
pnpm format     # 代码格式化
```
```

- [ ] **步骤 5：提交**

```bash
git add README.md
git commit -m "docs: 添加 README 使用说明"
```
