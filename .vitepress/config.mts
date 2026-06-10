import { defineConfig } from 'vitepress'

// ---- 中文侧边栏 ----
const zhTutorial = [
  { text: '教程总览', link: '/tutorial/README' },
  { text: '01 · 为什么先有架构思维', link: '/tutorial/01-为什么先有架构思维' },
  { text: '02 · 架构师的思考框架', link: '/tutorial/02-架构师的思考框架' },
  { text: '03 · 读懂与画好架构图', link: '/tutorial/03-读懂与画好架构图' },
  { text: '04 · 十大核心架构模式', link: '/tutorial/04-十大核心架构模式' },
  { text: '05 · 数据与状态', link: '/tutorial/05-数据与状态' },
  { text: '06 · 质量属性与取舍', link: '/tutorial/06-质量属性与取舍' },
  { text: '07 · 从 0 到 1 设计一个系统', link: '/tutorial/07-从0到1设计一个系统' },
  { text: '08 · 架构决策记录与演进', link: '/tutorial/08-架构决策记录与演进' },
  { text: '09 · 架构品味', link: '/tutorial/09-架构品味' },
  { text: '附录 · 架构术语表', link: '/tutorial/术语表' },
  { text: '附录 · 何时升级架构(触发信号)', link: '/tutorial/演进触发信号' },
]

const zhTutorialAdvanced = [
  { text: '10 · 分布式系统的硬道理', link: '/tutorial/10-分布式系统的硬道理' },
  { text: '11 · 数据一致性工程', link: '/tutorial/11-数据一致性工程' },
  { text: '12 · 为失败而设计:韧性工程', link: '/tutorial/12-为失败而设计' },
  { text: '13 · 规模化的力学', link: '/tutorial/13-规模化的力学' },
  { text: '14 · 演进与拆分大型系统', link: '/tutorial/14-演进与拆分大型系统' },
  { text: '15 · 组织即架构', link: '/tutorial/15-组织即架构' },
  { text: '16 · 安全与多租户架构', link: '/tutorial/16-安全与多租户架构' },
  { text: '17 · 大模型时代的架构判断', link: '/tutorial/17-大模型时代的架构判断' },
]

const zhTutorialPractice = [
  { text: '18 · 读地图:用框架拆解陌生系统', link: '/tutorial/18-读地图用框架拆解陌生系统' },
  { text: '19 · 完整设计演练:中等复杂度系统', link: '/tutorial/19-完整设计演练中等复杂度系统' },
  { text: '20 · 演进剧本:MVP 到规模化', link: '/tutorial/20-演进剧本MVP到规模化' },
  { text: '21 · 拆分与迁移实战', link: '/tutorial/21-拆分与迁移实战' },
  { text: '22 · AI 原生系统设计', link: '/tutorial/22-AI原生系统设计' },
]

const zhTutorialCollab = [
  { text: '23 · 规格即架构:约束怎么写给 AI', link: '/tutorial/23-规格即架构约束怎么写给AI' },
  { text: '24 · 审查清单:AI 产出默认缺什么', link: '/tutorial/24-审查清单AI产出默认缺什么' },
  { text: '25 · 评测驱动:把「够好」写进架构', link: '/tutorial/25-评测驱动把够好写进架构' },
  { text: '26 · 协作决策树:何时 vibe、何时 spec-first', link: '/tutorial/26-协作决策树何时vibe何时spec-first' },
]

const zhTutorialStack = [
  { text: '27 · 编程语言与后端框架选型', link: '/tutorial/27-编程语言与后端框架选型' },
  { text: '28 · 数据库与存储选型', link: '/tutorial/28-数据库与存储选型' },
  { text: '29 · 缓存、消息队列与事件系统选型', link: '/tutorial/29-缓存消息队列与事件系统选型' },
  { text: '30 · API 与服务通信选型', link: '/tutorial/30-API与服务通信选型' },
  { text: '31 · 云原生与部署平台选型', link: '/tutorial/31-云原生与部署平台选型' },
  { text: '32 · 可观测性与可靠性技术栈选型', link: '/tutorial/32-可观测性与可靠性技术栈选型' },
  { text: '33 · AI 基础设施技术栈选型', link: '/tutorial/33-AI基础设施技术栈选型' },
  { text: '34 · 技术选型决策树', link: '/tutorial/34-技术选型决策树' },
]

const zhCases = [
  { text: '案例总览', link: '/cases/README' },
  { text: '01 · StarArena:演唱会抢票系统', link: '/cases/stararena-ticketing/README' },
  { text: '02 · PatchDesk:轻量工单 SaaS', link: '/cases/patchdesk-saas/README' },
  { text: '03 · DocuMind:企业 RAG 知识库', link: '/cases/documind-rag/README' },
  { text: '04 · SyncRoom:实时协同工作台', link: '/cases/syncroom-collaboration/README' },
  { text: '05 · FeedStream:内容分发系统', link: '/cases/feedstream-content/README' },
  { text: '06 · CodePilot:编码 Agent 平台', link: '/cases/codepilot-agent/README' },
]

const enCases = [
  { text: 'Cases overview', link: '/en/cases/README' },
  { text: '01 · StarArena: concert ticketing', link: '/en/cases/stararena-ticketing/README' },
  { text: '02 · PatchDesk: ticketing SaaS', link: '/en/cases/patchdesk-saas/README' },
  { text: '03 · DocuMind: enterprise RAG', link: '/en/cases/documind-rag/README' },
  { text: '04 · SyncRoom: realtime collaboration', link: '/en/cases/syncroom-collaboration/README' },
  { text: '05 · FeedStream: content distribution', link: '/en/cases/feedstream-content/README' },
  { text: '06 · CodePilot: coding Agent', link: '/en/cases/codepilot-agent/README' },
]

const zhCommon = [
  { text: 'AI 对话产品', link: '/templates/ai-chat-product/README' },
  { text: '浏览器插件', link: '/templates/browser-extension/README' },
  { text: '普通网站', link: '/templates/standard-web-app/README' },
  { text: '移动 App', link: '/templates/mobile-app/README' },
  { text: '电商平台', link: '/templates/ecommerce-platform/README' },
  { text: '社交信息流', link: '/templates/social-feed/README' },
  { text: '视频流媒体', link: '/templates/video-streaming/README' },
  { text: '实时通讯', link: '/templates/realtime-chat/README' },
  { text: '短链接服务', link: '/templates/url-shortener/README' },
  { text: '支付系统', link: '/templates/payment-system/README' },
  { text: '搜索引擎', link: '/templates/search-engine/README' },
  { text: '网约车 / 出行', link: '/templates/ride-hailing/README' },
  { text: '实时协同文档', link: '/templates/collaborative-doc/README' },
  { text: '云存储 / 网盘', link: '/templates/cloud-storage/README' },
  { text: '通知 / 推送系统', link: '/templates/notification-system/README' },
  { text: '在线票务 / 抢票', link: '/templates/online-ticketing/README' },
]

const zhAI = [
  { text: 'AI 中转站 / 网关', link: '/templates/ai-gateway/README' },
  { text: 'RAG 知识库', link: '/templates/rag-knowledge-base/README' },
  { text: 'AI Agent / 工作流', link: '/templates/ai-agent-platform/README' },
  { text: '模型推理服务', link: '/templates/inference-serving/README' },
  { text: '向量数据库', link: '/templates/vector-database/README' },
]

const zhAgent = [
  { text: 'Claude Code', link: '/templates/claude-code/README' },
  { text: 'OpenAI Codex', link: '/templates/codex/README' },
  { text: 'OpenClaw(龙虾)', link: '/templates/openclaw/README' },
  { text: 'Hermes(爱马仕)', link: '/templates/hermes/README' },
]

export default defineConfig({
  title: 'Awesome Architecture',
  description: '专注「架构思维」的中英双语知识库:34 章教程 + 25 张真实系统架构地图 + 6 个端到端案例。',
  lang: 'zh-Hans',
  base: process.env.GITHUB_PAGES ? '/awesome-architecture/' : '/',
  cleanUrls: true,
  ignoreDeadLinks: false,
  lastUpdated: true,
  srcExclude: [],
  head: [
    ['meta', { name: 'theme-color', content: '#3c8772' }],
    ['meta', { property: 'og:title', content: 'Awesome Architecture · 架构图谱' }],
    ['meta', { property: 'og:description', content: '像架构师一样思考:34 章教程 + 25 张真实系统架构地图 + 6 个端到端案例。' }],
    // 注:Hypothesis 划词标注不再全站默认加载;改由评论区顶部的 toggle 按需注入。
    // 见 .vitepress/theme/components/Comments.vue 的 loadHypothesis()。
  ],

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
          ],
          '/templates/': [
            { text: '🗺️ 经典 / 通用系统', items: zhCommon },
            { text: '🤖 AI 原生系统', items: zhAI },
            { text: '🦾 AI 编码 / 自治 Agent', items: zhAgent },
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
            { text: '🧪 案例篇', collapsed: false, items: zhCases },
            { text: '🗺️ 经典 / 通用系统', collapsed: true, items: zhCommon },
            { text: '🤖 AI 原生系统', collapsed: true, items: zhAI },
            { text: '🦾 AI 编码 / 自治 Agent', collapsed: true, items: zhAgent },
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
      themeConfig: {
        nav: [
          { text: 'Home', link: '/en/' },
          { text: 'Tutorial', link: '/en/tutorial/README' },
          { text: 'Cases', link: '/en/cases/README' },
          { text: 'GitHub', link: 'https://github.com/study8677/awesome-architecture' },
        ],
        sidebar: {
          '/en/cases/': [
            { text: '🧪 Cases', items: enCases },
          ],
          '/en/': [
            {
              text: '📚 Tutorial · Foundations',
              items: [
                { text: 'Overview', link: '/en/tutorial/README' },
                { text: '01 · Why architecture comes first', link: '/en/tutorial/01-为什么先有架构思维' },
                { text: "02 · The architect's thinking framework", link: '/en/tutorial/02-架构师的思考框架' },
                { text: '03 · Reading & drawing diagrams', link: '/en/tutorial/03-读懂与画好架构图' },
                { text: '04 · Ten core patterns', link: '/en/tutorial/04-十大核心架构模式' },
                { text: '05 · Data & state', link: '/en/tutorial/05-数据与状态' },
                { text: '06 · Quality attributes & trade-offs', link: '/en/tutorial/06-质量属性与取舍' },
                { text: '07 · Designing from 0 to 1', link: '/en/tutorial/07-从0到1设计一个系统' },
                { text: '08 · ADRs & evolution', link: '/en/tutorial/08-架构决策记录与演进' },
                { text: '09 · Architectural taste', link: '/en/tutorial/09-架构品味' },
              ],
            },
            {
              text: '🚀 Tutorial · Advanced',
              collapsed: true,
              items: [
                { text: '10 · Distributed systems: hard truths', link: '/en/tutorial/10-分布式系统的硬道理' },
                { text: '11 · The engineering of data consistency', link: '/en/tutorial/11-数据一致性工程' },
                { text: '12 · Designing for failure: resilience', link: '/en/tutorial/12-为失败而设计' },
                { text: '13 · The mechanics of scale', link: '/en/tutorial/13-规模化的力学' },
                { text: '14 · Evolving & splitting large systems', link: '/en/tutorial/14-演进与拆分大型系统' },
                { text: '15 · Organization as architecture', link: '/en/tutorial/15-组织即架构' },
                { text: '16 · Security & multi-tenancy', link: '/en/tutorial/16-安全与多租户架构' },
                { text: '17 · Architecting in the age of LLMs', link: '/en/tutorial/17-大模型时代的架构判断' },
              ],
            },
            {
              text: '🎯 Tutorial · Practice',
              collapsed: true,
              items: [
                { text: '18 · Reading the map: deconstruct unfamiliar systems', link: '/en/tutorial/18-读地图用框架拆解陌生系统' },
                { text: '19 · Full design walkthrough: medium complexity', link: '/en/tutorial/19-完整设计演练中等复杂度系统' },
                { text: '20 · Evolution playbook: MVP → scale', link: '/en/tutorial/20-演进剧本MVP到规模化' },
                { text: '21 · Splitting & migration in practice', link: '/en/tutorial/21-拆分与迁移实战' },
                { text: '22 · AI-native system design', link: '/en/tutorial/22-AI原生系统设计' },
              ],
            },
            {
              text: '🤝 Tutorial · AI-collaborative',
              collapsed: true,
              items: [
                { text: '23 · Spec as architecture: constraints for AI', link: '/en/tutorial/23-规格即架构约束怎么写给AI' },
                { text: '24 · Review checklist: what AI output omits by default', link: '/en/tutorial/24-审查清单AI产出默认缺什么' },
                { text: '25 · Eval-driven: bake "good enough" into architecture', link: '/en/tutorial/25-评测驱动把够好写进架构' },
                { text: '26 · Collaboration decision tree: when to vibe, when to spec-first', link: '/en/tutorial/26-协作决策树何时vibe何时spec-first' },
              ],
            },
            {
              text: '🧰 Tutorial · Technology Stack Selection',
              collapsed: true,
              items: [
                { text: '27 · Languages & backend frameworks', link: '/en/tutorial/27-编程语言与后端框架选型' },
                { text: '28 · Databases & storage', link: '/en/tutorial/28-数据库与存储选型' },
                { text: '29 · Cache, queues & events', link: '/en/tutorial/29-缓存消息队列与事件系统选型' },
                { text: '30 · APIs & service communication', link: '/en/tutorial/30-API与服务通信选型' },
                { text: '31 · Cloud native & deployment', link: '/en/tutorial/31-云原生与部署平台选型' },
                { text: '32 · Observability & reliability', link: '/en/tutorial/32-可观测性与可靠性技术栈选型' },
                { text: '33 · AI infrastructure', link: '/en/tutorial/33-AI基础设施技术栈选型' },
                { text: '34 · Technology selection decision tree', link: '/en/tutorial/34-技术选型决策树' },
              ],
            },
            {
              text: '🧪 Cases',
              collapsed: false,
              items: enCases,
            },
            {
              text: '🗺️ Templates · Classic / General',
              collapsed: true,
              items: [
                { text: 'AI Chat Product', link: '/en/templates/ai-chat-product/README' },
                { text: 'Browser Extension', link: '/en/templates/browser-extension/README' },
                { text: 'Standard Web App', link: '/en/templates/standard-web-app/README' },
                { text: 'Mobile App', link: '/en/templates/mobile-app/README' },
                { text: 'E-commerce Platform', link: '/en/templates/ecommerce-platform/README' },
                { text: 'Social Feed', link: '/en/templates/social-feed/README' },
                { text: 'Video Streaming', link: '/en/templates/video-streaming/README' },
                { text: 'Realtime Chat', link: '/en/templates/realtime-chat/README' },
                { text: 'URL Shortener', link: '/en/templates/url-shortener/README' },
                { text: 'Payment System', link: '/en/templates/payment-system/README' },
                { text: 'Search Engine', link: '/en/templates/search-engine/README' },
                { text: 'Ride-Hailing', link: '/en/templates/ride-hailing/README' },
                { text: 'Collaborative Doc', link: '/en/templates/collaborative-doc/README' },
                { text: 'Cloud Storage', link: '/en/templates/cloud-storage/README' },
                { text: 'Notification System', link: '/en/templates/notification-system/README' },
                { text: 'Online Ticketing', link: '/en/templates/online-ticketing/README' },
              ],
            },
            {
              text: '🤖 Templates · AI-native',
              collapsed: true,
              items: [
                { text: 'AI Gateway / Relay', link: '/en/templates/ai-gateway/README' },
                { text: 'RAG Knowledge Base', link: '/en/templates/rag-knowledge-base/README' },
                { text: 'AI Agent / Workflow', link: '/en/templates/ai-agent-platform/README' },
                { text: 'Inference Serving', link: '/en/templates/inference-serving/README' },
                { text: 'Vector Database', link: '/en/templates/vector-database/README' },
              ],
            },
            {
              text: '🦾 Templates · AI Coding & Autonomous Agents',
              collapsed: true,
              items: [
                { text: 'Claude Code', link: '/en/templates/claude-code/README' },
                { text: 'OpenAI Codex', link: '/en/templates/codex/README' },
                { text: 'OpenClaw (the lobster)', link: '/en/templates/openclaw/README' },
                { text: 'Hermes', link: '/en/templates/hermes/README' },
              ],
            },
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
