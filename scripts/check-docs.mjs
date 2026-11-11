#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const errors = []

function walkMd(dir) {
  const results = []
  for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const rel = path.posix.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...walkMd(rel))
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      results.push(rel)
    }
  }
  return results.sort()
}

// 1. 中英双语文件 100% 对齐检查
for (const section of ['tutorial', 'templates', 'cases']) {
  const zhFiles = walkMd(section).filter((f) => f !== 'templates/_TEMPLATE.md')
  const enFiles = walkMd(`en/${section}`).map((f) => f.replace(/^en\//, ''))

  const zhSet = new Set(zhFiles)
  const enSet = new Set(enFiles)

  for (const f of zhFiles) {
    if (!enSet.has(f)) errors.push(`[Bilingual Parity] Missing English file: en/${f}`)
  }
  for (const f of enFiles) {
    if (!zhSet.has(f)) errors.push(`[Bilingual Parity] Extra English file without Chinese counterpart: en/${f}`)
  }

  // 2. 交互组件 (<Quiz> / <DecisionCard>) 数量对齐检查
  for (const f of zhFiles) {
    if (!enSet.has(f)) continue
    const zhContent = fs.readFileSync(path.join(ROOT, f), 'utf-8')
    const enContent = fs.readFileSync(path.join(ROOT, 'en', f), 'utf-8')

    const zhQuiz = (zhContent.match(/<Quiz\b/g) || []).length
    const enQuiz = (enContent.match(/<Quiz\b/g) || []).length
    if (zhQuiz !== enQuiz) {
      errors.push(`[Component Parity] <Quiz> count mismatch in ${f}: zh=${zhQuiz}, en=${enQuiz}`)
    }

    const zhDc = (zhContent.match(/<DecisionCard\b/g) || []).length
    const enDc = (enContent.match(/<DecisionCard\b/g) || []).length
    if (zhDc !== enDc) {
      errors.push(`[Component Parity] <DecisionCard> count mismatch in ${f}: zh=${zhDc}, en=${enDc}`)
    }
  }
}

// 3. 正式架构模板 14 段结构检查
const NON_STANDARD_TEMPLATE_DIRS = new Set(['ai-native-organization'])
for (const prefix of ['templates', 'en/templates']) {
  for (const entry of fs.readdirSync(path.join(ROOT, prefix), { withFileTypes: true })) {
    if (!entry.isDirectory() || NON_STANDARD_TEMPLATE_DIRS.has(entry.name)) continue
    const file = path.posix.join(prefix, entry.name, 'README.md')
    const content = fs.readFileSync(path.join(ROOT, file), 'utf-8')
    for (let i = 1; i <= 13; i++) {
      const re = new RegExp(`^##\\s+${i}\\.`, 'm')
      if (!re.test(content)) {
        errors.push(`[Template Structure] ${file} is missing section "## ${i}."`)
      }
    }
    if (!/^##\s+(?:14\.\s*)?(?:参考原型|Reference)/im.test(content)) {
      errors.push(`[Template Structure] ${file} is missing section 14 (Reference Prototypes)`)
    }
  }
}

// 4. 英文站跨语言内链与 GitHub 硬编码中文源码链接检查
const enAllFiles = walkMd('en')
const linkRe = /\]\(([^)]+)\)/g
for (const file of enAllFiles) {
  const content = fs.readFileSync(path.join(ROOT, file), 'utf-8')
  for (const match of content.matchAll(linkRe)) {
    const rawLink = match[1].trim()
    if (!rawLink || rawLink.startsWith('#') || rawLink.startsWith('mailto:')) continue
    if (rawLink.startsWith('http://') || rawLink.startsWith('https://')) {
      if (
        rawLink.includes('github.com/study8677/awesome-architecture/blob/main/') ||
        rawLink.includes('github.com/study8677/awesome-architecture/tree/main/')
      ) {
        if (!rawLink.endsWith('templates/_TEMPLATE.md') && !rawLink.endsWith('/README.md')) {
          errors.push(`[EN Hardcoded GitHub Link] ${file} -> ${rawLink}`)
        } else if (
          rawLink.includes('/tutorial/') ||
          (rawLink.includes('/templates/') && !rawLink.endsWith('templates/_TEMPLATE.md')) ||
          rawLink.includes('/cases/')
        ) {
          errors.push(`[EN Hardcoded GitHub Link] ${file} -> ${rawLink}`)
        }
      }
      continue
    }
    const cleanTarget = rawLink.split('#')[0]
    if (!cleanTarget) continue
    if (cleanTarget.startsWith('/')) {
      if (cleanTarget !== '/' && !cleanTarget.startsWith('/en/')) {
        errors.push(`[Cross-Locale Link] ${file} points to non-EN root path: ${rawLink}`)
      }
    } else {
      const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(file), cleanTarget))
      if (resolved !== 'en' && !resolved.startsWith('en/')) {
        errors.push(`[Cross-Locale Link] ${file} points outside en/: ${rawLink} (${resolved})`)
      }
    }
  }
}

if (errors.length > 0) {
  console.error(`❌ Documentation check failed with ${errors.length} issue(s):\n`)
  for (const err of errors) {
    console.error(`  - ${err}`)
  }
  process.exit(1)
} else {
  console.log('✅ Documentation check passed: 100% bilingual parity, component parity, 14-section template structure, and clean locale links.')
}
