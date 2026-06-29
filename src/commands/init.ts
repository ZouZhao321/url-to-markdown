import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export function installSkill(): void {
  const templatePath = join(__dirname, '..', '..', 'skills', 'url-to-markdown.md')
  const targetDir = join(process.cwd(), '.claude', 'skills')
  const targetPath = join(targetDir, 'url-to-markdown.md')

  if (!existsSync(templatePath)) {
    console.error('错误: 找不到 skill 模板文件')
    process.exit(1)
  }

  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true })
  }

  const content = readFileSync(templatePath, 'utf-8')
  writeFileSync(targetPath, content, 'utf-8')

  console.log(`✓ Skill 已安装到 ${targetPath}`)
}
