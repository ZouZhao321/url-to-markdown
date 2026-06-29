import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { installSkill } from '../../src/commands/init.js'
import { mkdtempSync, readFileSync, existsSync, rmSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

describe('installSkill', () => {
  let tempDir: string
  let originalCwd: string

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'url-to-markdown-test-'))
    originalCwd = process.cwd()
    process.chdir(tempDir)
  })

  afterEach(() => {
    process.chdir(originalCwd)
    rmSync(tempDir, { recursive: true, force: true })
  })

  it('should create skill file', () => {
    installSkill()

    const skillPath = join(tempDir, '.claude', 'skills', 'url-to-markdown.md')
    expect(existsSync(skillPath)).toBe(true)

    const content = readFileSync(skillPath, 'utf-8')
    expect(content).toContain('url-to-markdown')
    expect(content).toContain('extract')
    expect(content).toContain('search')
  })

  it('should create directory if not exists', () => {
    installSkill()

    const skillDir = join(tempDir, '.claude', 'skills')
    expect(existsSync(skillDir)).toBe(true)
  })

  it('should overwrite existing file', () => {
    // Create existing file with different content
    const skillDir = join(tempDir, '.claude', 'skills')
    mkdirSync(skillDir, { recursive: true })
    const skillPath = join(skillDir, 'url-to-markdown.md')
    writeFileSync(skillPath, 'old content', 'utf-8')

    installSkill()

    const content = readFileSync(skillPath, 'utf-8')
    expect(content).not.toBe('old content')
    expect(content).toContain('url-to-markdown')
  })
})
