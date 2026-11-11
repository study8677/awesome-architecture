import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vitepress'
import {
  enAgent,
  enAI,
  enCases,
  enCommon,
  enIndustrial,
  enPrompt,
  enTutorial,
  enTutorialAdvanced,
  enTutorialCollab,
  enTutorialOrg,
  enTutorialPractice,
  enTutorialStack,
  enTutorialTraining,
  zhAgent,
  zhAI,
  zhCases,
  zhCommon,
  zhIndustrial,
  zhPrompt,
  zhTutorial,
  zhTutorialAdvanced,
  zhTutorialCollab,
  zhTutorialOrg,
  zhTutorialPractice,
  zhTutorialStack,
  zhTutorialTraining,
} from './data/catalog'

// ── 站点级常量:被 sitemap、canonical、Open Graph 卡片复用,避免多处硬编码 ──
const SITE_URL = 'https://study8677.github.io/awesome-architecture/'
const SITE_TITLE = 'Awesome Architecture'
const SITE_DESC =
  '专注「架构思维」的中英双语知识库:40 章教程 + 31 张真实系统架构地图 + 6 个端到端案例。'
const SITE_DESC_EN =
  'A bilingual knowledge base focused on architectural thinking: 40 tutorial chapters + 31 real-system architecture maps + 6 end-to-end cases.'

function extractPageDescription(relativePath: string): string {
  try {
    const raw = fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf-8')
    const body = raw
      .replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '')
      .replace(/<!--[\s\S]*?-->/g, '')
    const quoteLines: string[] = []
    let inQuote = false
    for (const line of body.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (trimmed.startsWith('>')) {
        inQuote = true
        const text = trimmed.replace(/^>+\s*/, '').trim()
        if (text) quoteLines.push(text)
      } else if (inQuote) {
        break
      }
    }
    if (!quoteLines.length) return ''
    return quoteLines
      .join(' ')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[*_`]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  } catch {
    return ''
  }
}

export default defineConfig({
  title: SITE_TITLE,
  description: SITE_DESC,
  lang: 'zh-Hans',
  base: process.env.GITHUB_PAGES ? '/awesome-architecture/' : '/',
  cleanUrls: true,
  ignoreDeadLinks: false,
  lastUpdated: true,
  // 生成 sitemap.xml,利于搜索引擎收录(公开知识库的 SEO 基础)。
  // hostname 用 GitHub Pages 默认域名;换自定义域名时改 SITE_URL 即可。
  sitemap: {
    hostname: SITE_URL,
  },
  srcExclude: ['README.md', 'README_en.md', 'CONTRIBUTING.md', 'templates/_TEMPLATE.md'],
  head: [
    [
      'link',
      {
        rel: 'icon',
        type: 'image/svg+xml',
        href: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%232f8a6b'/%3E%3Cpath d='M32 12L14 22v20l18 10 18-10V22L32 12zm0 6.8l11.2 6.2L32 31.2 20.8 25 32 18.8zm-13 11.4l10.5 5.8v11.6L19 41.8V30.2zm26 0v11.6l-10.5 5.8V36l10.5-5.8z' fill='%23fff'/%3E%3C/svg%3E",
      },
    ],
    ['meta', { name: 'theme-color', content: '#3c8772' }],
    // 站点级 OG/Twitter 默认值(不含 title/description —— 那两项由下方 transformPageData
    // 按页注入,避免同一页出现两个 og:title 这类重复标签)。
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: SITE_TITLE }],
    ['meta', { name: 'twitter:card', content: 'summary' }],
    // 注:Hypothesis 划词标注不再全站默认加载;改由评论区顶部的 toggle 按需注入。
    // 见 .vitepress/theme/components/Comments.vue 的 loadHypothesis()。
  ],

  // ── 逐页注入 canonical + Open Graph/Twitter 的标题与描述 ──
  // 按每页真实标题/首段导读引用生成页面级 description,并补上规范链接,利于 SEO 与社交分享。
  transformPageData(pageData) {
    // 源文件相对路径 → cleanUrls 后的线上路径:
    //   index.md              → ''                    (站点根)
    //   en/index.md           → 'en/'
    //   templates/x/README.md → 'templates/x/README'
    const cleanPath = pageData.relativePath
      .replace(/(^|\/)index\.md$/, '$1')
      .replace(/\.md$/, '')
    const url = SITE_URL + cleanPath
    const isEn = pageData.relativePath.startsWith('en/')
    const title = pageData.title ? `${pageData.title} · ${SITE_TITLE}` : SITE_TITLE
    const description =
      pageData.description ||
      pageData.frontmatter?.description ||
      pageData.frontmatter?.hero?.tagline ||
      extractPageDescription(pageData.relativePath) ||
      (isEn ? SITE_DESC_EN : SITE_DESC)

    pageData.description = description

    const head = (pageData.frontmatter.head ??= [])
    head.push(
      ['link', { rel: 'canonical', href: url }],
      ['meta', { property: 'og:url', content: url }],
      ['meta', { property: 'og:title', content: title }],
      ['meta', { property: 'og:description', content: description }],
      ['meta', { name: 'twitter:title', content: title }],
      ['meta', { name: 'twitter:description', content: description }],
    )
  },

  themeConfig: {
    search: { provider: 'local' },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/study8677/awesome-architecture' },
    ],
  },

  locales: {
    root: {
      label: '简体中文',
      lang: 'zh-Hans',
      themeConfig: {
        nav: [
          { text: '首页', link: '/' },
          { text: '教程', link: '/tutorial/README' },
          { text: '架构模板', link: '/templates/README' },
          { text: '案例篇', link: '/cases/README' },
        ],
        sidebar: {
          '/tutorial/': [
            { text: '📚 入门篇', items: zhTutorial },
            { text: '🚀 进阶篇', items: zhTutorialAdvanced },
            { text: '🎯 实战篇', items: zhTutorialPractice },
            { text: '🤝 AI 协同篇', items: zhTutorialCollab },
            { text: '🧰 技术栈选型篇', items: zhTutorialStack },
            { text: '🧬 AI 原生组织篇', items: zhTutorialOrg },
            { text: '🧠 基础模型训练决策专题', items: zhTutorialTraining },
          ],
          '/templates/': [
            { text: '🗺️ 架构模板', items: [{ text: '模板总览', link: '/templates/README' }] },
            { text: '🗺️ 经典 / 通用系统', items: zhCommon },
            { text: '🤖 AI 原生系统', items: zhAI },
            { text: '🦾 AI 编码 / 自治 Agent', items: zhAgent },
            { text: '📜 系统提示词架构', items: zhPrompt },
            { text: '🏭 工业 / 嵌入式', items: zhIndustrial },
          ],
          '/cases/': [
            { text: '🧪 案例篇', items: zhCases },
          ],
          '/': [
            { text: '📚 教程 · 入门篇', collapsed: false, items: zhTutorial },
            { text: '🚀 教程 · 进阶篇', collapsed: false, items: zhTutorialAdvanced },
            { text: '🎯 教程 · 实战篇', collapsed: false, items: zhTutorialPractice },
            { text: '🤝 教程 · AI 协同篇', collapsed: false, items: zhTutorialCollab },
            { text: '🧰 教程 · 技术栈选型篇', collapsed: false, items: zhTutorialStack },
            { text: '🧬 教程 · AI 原生组织篇', collapsed: false, items: zhTutorialOrg },
            { text: '🧠 教程 · 基础模型训练决策专题', collapsed: false, items: zhTutorialTraining },
            { text: '🧪 案例篇', collapsed: false, items: zhCases },
            { text: '🗺️ 经典 / 通用系统', collapsed: true, items: zhCommon },
            { text: '🤖 AI 原生系统', collapsed: true, items: zhAI },
            { text: '🦾 AI 编码 / 自治 Agent', collapsed: true, items: zhAgent },
            { text: '📜 系统提示词架构', collapsed: true, items: zhPrompt },
            { text: '🏭 工业 / 嵌入式', collapsed: true, items: zhIndustrial },
          ],
        },
        outline: { label: '本页大纲', level: [2, 3] },
        docFooter: { prev: '上一篇', next: '下一篇' },
        darkModeSwitchLabel: '外观',
        lightModeSwitchTitle: '切换到浅色模式',
        darkModeSwitchTitle: '切换到深色模式',
        sidebarMenuLabel: '菜单',
        returnToTopLabel: '回到顶部',
        langMenuLabel: '切换语言',
        lastUpdatedText: '最后更新',
      },
    },

    en: {
      label: 'English',
      lang: 'en',
      link: '/en/',
      description: SITE_DESC_EN,
      themeConfig: {
        nav: [
          { text: 'Home', link: '/en/' },
          { text: 'Tutorial', link: '/en/tutorial/README' },
          { text: 'Templates', link: '/en/templates/README' },
          { text: 'Cases', link: '/en/cases/README' },
        ],
        sidebar: {
          '/en/tutorial/': [
            { text: '📚 Foundations', items: enTutorial },
            { text: '🚀 Advanced', items: enTutorialAdvanced },
            { text: '🎯 Practice', items: enTutorialPractice },
            { text: '🤝 AI-collaborative', items: enTutorialCollab },
            { text: '🧰 Technology Stack Selection', items: enTutorialStack },
            { text: '🧬 AI-Native Organization', items: enTutorialOrg },
            { text: '🧠 Foundation Model Training Decisions', items: enTutorialTraining },
          ],
          '/en/templates/': [
            { text: '🗺️ Architecture Templates', items: [{ text: 'Templates overview', link: '/en/templates/README' }] },
            { text: '🗺️ Classic / General', items: enCommon },
            { text: '🤖 AI-native', items: enAI },
            { text: '🦾 AI Coding & Autonomous Agents', items: enAgent },
            { text: '📜 System Prompt Architecture', items: enPrompt },
            { text: '🏭 Industrial / Embedded', items: enIndustrial },
          ],
          '/en/cases/': [
            { text: '🧪 Cases', items: enCases },
          ],
          '/en/': [
            { text: '📚 Tutorial · Foundations', items: enTutorial },
            { text: '🚀 Tutorial · Advanced', collapsed: true, items: enTutorialAdvanced },
            { text: '🎯 Tutorial · Practice', collapsed: true, items: enTutorialPractice },
            { text: '🤝 Tutorial · AI-collaborative', collapsed: true, items: enTutorialCollab },
            { text: '🧰 Tutorial · Technology Stack Selection', collapsed: true, items: enTutorialStack },
            { text: '🧬 Tutorial · AI-Native Organization', collapsed: true, items: enTutorialOrg },
            { text: '🧠 Special Topic · Foundation Model Training Decisions', collapsed: false, items: enTutorialTraining },
            { text: '🧪 Cases', collapsed: false, items: enCases },
            { text: '🗺️ Templates · Classic / General', collapsed: true, items: enCommon },
            { text: '🤖 Templates · AI-native', collapsed: true, items: enAI },
            { text: '🦾 Templates · AI Coding & Autonomous Agents', collapsed: true, items: enAgent },
            { text: '📜 System Prompt Architecture', collapsed: true, items: enPrompt },
            { text: '🏭 Templates · Industrial / Embedded', collapsed: true, items: enIndustrial },
          ],
        },
        outline: { label: 'On this page', level: [2, 3] },
        docFooter: { prev: 'Previous', next: 'Next' },
        returnToTopLabel: 'Back to top',
        langMenuLabel: 'Change language',
      },
    },
  },
})
