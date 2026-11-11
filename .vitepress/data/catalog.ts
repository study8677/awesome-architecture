export type TemplateCategory = 'common' | 'ai' | 'agent' | 'prompt' | 'industrial'

export interface TemplateCatalogItem {
  slug: string
  icon: string
  cat: TemplateCategory
  zh: {
    name: string
    sidebarText?: string
    desc: string
  }
  en: {
    name: string
    sidebarText?: string
    desc: string
  }
}

export interface ExplorerItem {
  name: string
  icon: string
  cat: TemplateCategory
  desc: string
  link: string
}

// ── 31 个正式架构模板的单一数据源 (Single Source of Truth) ──
// 同时驱动 .vitepress/config.mts 侧边栏与 .vitepress/theme/components/ArchExplorer.vue
export const TEMPLATE_CATALOG: TemplateCatalogItem[] = [
  // 1. 经典 / 通用系统 (16)
  {
    slug: 'ai-chat-product',
    icon: '🤖',
    cat: 'common',
    zh: { name: 'AI 对话产品', desc: 'LLM 推理 · 流式 · 上下文 · 成本' },
    en: { name: 'AI Chat Product', desc: 'LLM inference · streaming · context · cost' },
  },
  {
    slug: 'browser-extension',
    icon: '🧩',
    cat: 'common',
    zh: { name: '浏览器插件', desc: '脚本分离 · 注入 · 隐私边界' },
    en: { name: 'Browser Extension', desc: 'Content/background split · injection · privacy' },
  },
  {
    slug: 'standard-web-app',
    icon: '🌐',
    cat: 'common',
    zh: { name: '普通网站', desc: '三层 · 缓存 · 读写分离' },
    en: { name: 'Standard Web App', desc: 'Three-tier · caching · read/write split' },
  },
  {
    slug: 'mobile-app',
    icon: '📱',
    cat: 'common',
    zh: { name: '移动 App', desc: '离线优先 · 同步 · 推送' },
    en: { name: 'Mobile App', desc: 'Offline-first · sync · push' },
  },
  {
    slug: 'ecommerce-platform',
    icon: '🛒',
    cat: 'common',
    zh: { name: '电商平台', desc: '库存 · 订单 · 超卖 · 洪峰' },
    en: { name: 'E-commerce Platform', desc: 'Inventory · orders · overselling · spikes' },
  },
  {
    slug: 'social-feed',
    icon: '📰',
    cat: 'common',
    zh: { name: '社交信息流', desc: 'Feed 推拉 · 关注图 · 扩散' },
    en: { name: 'Social Feed', desc: 'Feed push/pull · follow graph · fan-out' },
  },
  {
    slug: 'video-streaming',
    icon: '🎬',
    cat: 'common',
    zh: { name: '视频流媒体', desc: '转码 · CDN · 自适应码率' },
    en: { name: 'Video Streaming', desc: 'Transcoding · CDN · adaptive bitrate' },
  },
  {
    slug: 'realtime-chat',
    icon: '💬',
    cat: 'common',
    zh: { name: '实时通讯', desc: '长连接 · 时序 · 离线投递' },
    en: { name: 'Realtime Chat', desc: 'Long-lived conns · ordering · offline delivery' },
  },
  {
    slug: 'url-shortener',
    icon: '🔗',
    cat: 'common',
    zh: { name: '短链接服务', desc: '读多写少 · 重定向 · 唯一 ID' },
    en: { name: 'URL Shortener', desc: 'Read-heavy · redirect · unique ID' },
  },
  {
    slug: 'payment-system',
    icon: '💳',
    cat: 'common',
    zh: { name: '支付系统', desc: '幂等 · 复式记账 · 对账' },
    en: { name: 'Payment System', desc: 'Idempotency · double-entry · reconciliation' },
  },
  {
    slug: 'search-engine',
    icon: '🔍',
    cat: 'common',
    zh: { name: '搜索引擎', desc: '倒排索引 · 召回 + 精排' },
    en: { name: 'Search Engine', desc: 'Inverted index · recall + rerank' },
  },
  {
    slug: 'ride-hailing',
    icon: '🚗',
    cat: 'common',
    zh: { name: '网约车 / 出行', desc: '地理索引 · 实时匹配' },
    en: { name: 'Ride-Hailing', desc: 'Geo index · realtime matching' },
  },
  {
    slug: 'collaborative-doc',
    icon: '📝',
    cat: 'common',
    zh: { name: '实时协同文档', desc: 'OT/CRDT · 单 writer 串行' },
    en: { name: 'Collaborative Doc', desc: 'OT/CRDT · single-writer serialization' },
  },
  {
    slug: 'cloud-storage',
    icon: '☁️',
    cat: 'common',
    zh: { name: '云存储 / 网盘', desc: '分块 · 去重 · 增量同步' },
    en: { name: 'Cloud Storage', desc: 'Chunking · dedup · incremental sync' },
  },
  {
    slug: 'notification-system',
    icon: '🔔',
    cat: 'common',
    zh: { name: '通知 / 推送', sidebarText: '通知 / 推送系统', desc: '多渠道扇出 · 去重限频' },
    en: { name: 'Notification System', desc: 'Multi-channel fan-out · dedup/throttling' },
  },
  {
    slug: 'online-ticketing',
    icon: '🎫',
    cat: 'common',
    zh: { name: '在线票务 / 抢票', desc: '等候室 · 原子扣减 · 锁座' },
    en: { name: 'Online Ticketing', desc: 'Waiting room · atomic decrement · seat lock' },
  },

  // 2. AI 原生系统 (5)
  {
    slug: 'ai-gateway',
    icon: '🚪',
    cat: 'ai',
    zh: { name: 'AI 网关 / 中转站', sidebarText: 'AI 中转站 / 网关', desc: '统一接口 · 计费 · 负载均衡' },
    en: { name: 'AI Gateway / Relay', desc: 'Unified API · billing · load balancing' },
  },
  {
    slug: 'rag-knowledge-base',
    icon: '📚',
    cat: 'ai',
    zh: { name: 'RAG 知识库', desc: '切块 · 向量检索 · 重排' },
    en: { name: 'RAG Knowledge Base', desc: 'Chunking · vector retrieval · rerank' },
  },
  {
    slug: 'ai-agent-platform',
    icon: '🤹',
    cat: 'ai',
    zh: { name: 'AI Agent / 工作流', desc: '行动循环 · 工具 · 记忆' },
    en: { name: 'AI Agent / Workflow', desc: 'Action loop · tools · memory' },
  },
  {
    slug: 'inference-serving',
    icon: '⚡',
    cat: 'ai',
    zh: { name: '模型推理服务', desc: '连续批处理 · 分页 KV' },
    en: { name: 'Inference Serving', desc: 'Continuous batching · paged KV' },
  },
  {
    slug: 'vector-database',
    icon: '🧭',
    cat: 'ai',
    zh: { name: '向量数据库', desc: 'ANN · HNSW · 相似检索' },
    en: { name: 'Vector Database', desc: 'ANN · HNSW · similarity search' },
  },

  // 3. AI 编码 / 自治 Agent (4)
  {
    slug: 'claude-code',
    icon: '🖥️',
    cat: 'agent',
    zh: { name: 'Claude Code', desc: '本地优先编码 · 子代理/钩子/MCP · 双层权限' },
    en: { name: 'Claude Code', desc: 'Local-first coding · subagents/hooks/MCP · two-tier perms' },
  },
  {
    slug: 'codex',
    icon: '🛰️',
    cat: 'agent',
    zh: { name: 'OpenAI Codex', desc: '本地 CLI + 云端沙箱 · 异步开 PR · 双轴安全' },
    en: { name: 'OpenAI Codex', desc: 'Local CLI + cloud sandbox · async PRs · two-axis safety' },
  },
  {
    slug: 'openclaw',
    icon: '🦞',
    cat: 'agent',
    zh: { name: 'OpenClaw(龙虾)', desc: '自托管网关 · 聊天软件即 UI · 常驻' },
    en: { name: 'OpenClaw (the lobster)', desc: 'Self-hosted gateway · chat as UI · always-on' },
  },
  {
    slug: 'hermes',
    icon: '🧠',
    cat: 'agent',
    zh: { name: 'Hermes(爱马仕)', desc: 'FTS5 持久记忆 · 自动沉淀技能 · 常驻' },
    en: { name: 'Hermes', desc: 'FTS5 memory · auto-distilled skills · always-on' },
  },

  // 4. 系统提示词架构 (1)
  {
    slug: 'system-prompt-architecture',
    icon: '📜',
    cat: 'prompt',
    zh: { name: '系统提示词架构', desc: '分层 Agent OS · 决策树路由 · 合规' },
    en: { name: 'System Prompt Architecture', desc: 'Layered Agent OS · routing · compliance' },
  },

  // 5. 工业 / 嵌入式系统 (5)
  {
    slug: 'embedded-device',
    icon: '🔩',
    cat: 'industrial',
    zh: { name: '嵌入式设备固件', desc: 'HAL 分层 · 状态机 · A/B OTA 防变砖' },
    en: { name: 'Embedded Device Firmware', desc: 'HAL layering · state machines · A/B OTA' },
  },
  {
    slug: 'iot-platform',
    icon: '📡',
    cat: 'industrial',
    zh: { name: 'IoT 设备接入平台', desc: '百万长连接 · 设备影子 · 灰度 OTA' },
    en: { name: 'IoT Device Platform', desc: 'Massive connections · device shadow · staged OTA' },
  },
  {
    slug: 'industrial-edge',
    icon: '🏭',
    cat: 'industrial',
    zh: { name: '工业边缘 / SCADA', sidebarText: '工业边缘网关 / SCADA', desc: '协议归一 · 边缘自治 · OT/IT 隔离' },
    en: { name: 'Industrial Edge / SCADA', desc: 'Protocol normalization · edge autonomy · OT/IT isolation' },
  },
  {
    slug: 'automotive-ee',
    icon: '🚙',
    cat: 'industrial',
    zh: { name: '车载电子电气(E/E)', desc: 'ASIL 隔离 · 两张网 · 整车 OTA' },
    en: { name: 'Automotive E/E', desc: 'ASIL isolation · two networks · vehicle OTA' },
  },
  {
    slug: 'robotics',
    icon: '🦾',
    cat: 'industrial',
    zh: { name: '机器人系统', desc: '频率分层 · 安全旁路 · 录制回放' },
    en: { name: 'Robotics System', desc: 'Frequency layering · safety loop · record & replay' },
  },
]

export const explorerItemsZh: ExplorerItem[] = TEMPLATE_CATALOG.map((item) => ({
  name: item.zh.name,
  icon: item.icon,
  cat: item.cat,
  desc: item.zh.desc,
  link: `/templates/${item.slug}/README`,
}))

export const explorerItemsEn: ExplorerItem[] = TEMPLATE_CATALOG.map((item) => ({
  name: item.en.name,
  icon: item.icon,
  cat: item.cat,
  desc: item.en.desc,
  link: `/en/templates/${item.slug}/README`,
}))

function sidebarTemplates(cat: TemplateCategory, locale: 'zh' | 'en') {
  const prefix = locale === 'en' ? '/en/templates/' : '/templates/'
  return TEMPLATE_CATALOG.filter((item) => item.cat === cat).map((item) => ({
    text: item[locale].sidebarText ?? item[locale].name,
    link: `${prefix}${item.slug}/README`,
  }))
}

export const zhCommon = sidebarTemplates('common', 'zh')
export const zhAI = sidebarTemplates('ai', 'zh')
export const zhAgent = sidebarTemplates('agent', 'zh')
export const zhPrompt = sidebarTemplates('prompt', 'zh')
export const zhIndustrial = sidebarTemplates('industrial', 'zh')

export const enCommon = sidebarTemplates('common', 'en')
export const enAI = sidebarTemplates('ai', 'en')
export const enAgent = sidebarTemplates('agent', 'en')
export const enPrompt = sidebarTemplates('prompt', 'en')
export const enIndustrial = sidebarTemplates('industrial', 'en')

// ---- 中文教程与案例侧边栏 ----
export const zhTutorial = [
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

export const zhTutorialAdvanced = [
  { text: '10 · 分布式系统的硬道理', link: '/tutorial/10-分布式系统的硬道理' },
  { text: '11 · 数据一致性工程', link: '/tutorial/11-数据一致性工程' },
  { text: '12 · 为失败而设计:韧性工程', link: '/tutorial/12-为失败而设计' },
  { text: '13 · 规模化的力学', link: '/tutorial/13-规模化的力学' },
  { text: '14 · 演进与拆分大型系统', link: '/tutorial/14-演进与拆分大型系统' },
  { text: '15 · 组织即架构', link: '/tutorial/15-组织即架构' },
  { text: '16 · 安全与多租户架构', link: '/tutorial/16-安全与多租户架构' },
  { text: '17 · 大模型时代的架构判断', link: '/tutorial/17-大模型时代的架构判断' },
]

export const zhTutorialPractice = [
  { text: '18 · 读地图:用框架拆解陌生系统', link: '/tutorial/18-读地图用框架拆解陌生系统' },
  { text: '19 · 完整设计演练:中等复杂度系统', link: '/tutorial/19-完整设计演练中等复杂度系统' },
  { text: '20 · 演进剧本:MVP 到规模化', link: '/tutorial/20-演进剧本MVP到规模化' },
  { text: '21 · 拆分与迁移实战', link: '/tutorial/21-拆分与迁移实战' },
  { text: '22 · AI 原生系统设计', link: '/tutorial/22-AI原生系统设计' },
]

export const zhTutorialCollab = [
  { text: '23 · 规格即架构:约束怎么写给 AI', link: '/tutorial/23-规格即架构约束怎么写给AI' },
  { text: '24 · 审查清单:AI 产出默认缺什么', link: '/tutorial/24-审查清单AI产出默认缺什么' },
  { text: '25 · 评测驱动:把「够好」写进架构', link: '/tutorial/25-评测驱动把够好写进架构' },
  { text: '26 · 协作决策树:何时 vibe、何时 spec-first', link: '/tutorial/26-协作决策树何时vibe何时spec-first' },
]

export const zhTutorialStack = [
  { text: '27 · 编程语言与后端框架选型', link: '/tutorial/27-编程语言与后端框架选型' },
  { text: '28 · 数据库与存储选型', link: '/tutorial/28-数据库与存储选型' },
  { text: '29 · 缓存、消息队列与事件系统选型', link: '/tutorial/29-缓存消息队列与事件系统选型' },
  { text: '30 · API 与服务通信选型', link: '/tutorial/30-API与服务通信选型' },
  { text: '31 · 云原生与部署平台选型', link: '/tutorial/31-云原生与部署平台选型' },
  { text: '32 · 可观测性与可靠性技术栈选型', link: '/tutorial/32-可观测性与可靠性技术栈选型' },
  { text: '33 · AI 基础设施技术栈选型', link: '/tutorial/33-AI基础设施技术栈选型' },
  { text: '34 · 技术选型决策树', link: '/tutorial/34-技术选型决策树' },
]

export const zhTutorialOrg = [
  { text: '35 · AI 原生组织架构', link: '/tutorial/35-AI原生组织架构' },
  { text: '36 · 超级个体与超级团队', link: '/tutorial/36-超级个体与超级团队' },
  { text: '37 · 共享上下文架构', link: '/tutorial/37-共享上下文架构' },
  { text: '38 · AI 工作流架构', link: '/tutorial/38-AI工作流架构' },
  { text: '39 · 责任与治理架构', link: '/tutorial/39-责任与治理架构' },
  { text: '40 · AI 原生组织演进路线', link: '/tutorial/40-AI原生组织演进路线' },
]

export const zhTutorialTraining = [
  { text: 'T01 · 训练方案不是算法排行榜：先把决策分层', link: '/tutorial/T01-训练方案不是算法排行榜先把决策分层' },
]

export const zhCases = [
  { text: '案例总览', link: '/cases/README' },
  { text: '01 · StarArena:演唱会抢票系统', link: '/cases/stararena-ticketing/README' },
  { text: '02 · PatchDesk:轻量工单 SaaS', link: '/cases/patchdesk-saas/README' },
  { text: '03 · DocuMind:企业 RAG 知识库', link: '/cases/documind-rag/README' },
  { text: '04 · SyncRoom:实时协同工作台', link: '/cases/syncroom-collaboration/README' },
  { text: '05 · FeedStream:内容分发系统', link: '/cases/feedstream-content/README' },
  { text: '06 · CodePilot:编码 Agent 平台', link: '/cases/codepilot-agent/README' },
]

// ---- 英文教程与案例侧边栏 ----
export const enTutorial = [
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
  { text: 'Appendix · Architecture glossary', link: '/en/tutorial/术语表' },
  { text: 'Appendix · When to upgrade (trigger signals)', link: '/en/tutorial/演进触发信号' },
]

export const enTutorialAdvanced = [
  { text: '10 · Distributed systems: hard truths', link: '/en/tutorial/10-分布式系统的硬道理' },
  { text: '11 · The engineering of data consistency', link: '/en/tutorial/11-数据一致性工程' },
  { text: '12 · Designing for failure: resilience', link: '/en/tutorial/12-为失败而设计' },
  { text: '13 · The mechanics of scale', link: '/en/tutorial/13-规模化的力学' },
  { text: '14 · Evolving & splitting large systems', link: '/en/tutorial/14-演进与拆分大型系统' },
  { text: '15 · Organization as architecture', link: '/en/tutorial/15-组织即架构' },
  { text: '16 · Security & multi-tenancy', link: '/en/tutorial/16-安全与多租户架构' },
  { text: '17 · Architecting in the age of LLMs', link: '/en/tutorial/17-大模型时代的架构判断' },
]

export const enTutorialPractice = [
  { text: '18 · Reading the map: deconstruct unfamiliar systems', link: '/en/tutorial/18-读地图用框架拆解陌生系统' },
  { text: '19 · Full design walkthrough: medium complexity', link: '/en/tutorial/19-完整设计演练中等复杂度系统' },
  { text: '20 · Evolution playbook: MVP → scale', link: '/en/tutorial/20-演进剧本MVP到规模化' },
  { text: '21 · Splitting & migration in practice', link: '/en/tutorial/21-拆分与迁移实战' },
  { text: '22 · AI-native system design', link: '/en/tutorial/22-AI原生系统设计' },
]

export const enTutorialCollab = [
  { text: '23 · Spec as architecture: constraints for AI', link: '/en/tutorial/23-规格即架构约束怎么写给AI' },
  { text: '24 · Review checklist: what AI output omits by default', link: '/en/tutorial/24-审查清单AI产出默认缺什么' },
  { text: '25 · Eval-driven: bake "good enough" into architecture', link: '/en/tutorial/25-评测驱动把够好写进架构' },
  { text: '26 · Collaboration decision tree: when to vibe, when to spec-first', link: '/en/tutorial/26-协作决策树何时vibe何时spec-first' },
]

export const enTutorialStack = [
  { text: '27 · Languages & backend frameworks', link: '/en/tutorial/27-编程语言与后端框架选型' },
  { text: '28 · Databases & storage', link: '/en/tutorial/28-数据库与存储选型' },
  { text: '29 · Cache, queues & events', link: '/en/tutorial/29-缓存消息队列与事件系统选型' },
  { text: '30 · APIs & service communication', link: '/en/tutorial/30-API与服务通信选型' },
  { text: '31 · Cloud native & deployment', link: '/en/tutorial/31-云原生与部署平台选型' },
  { text: '32 · Observability & reliability', link: '/en/tutorial/32-可观测性与可靠性技术栈选型' },
  { text: '33 · AI infrastructure', link: '/en/tutorial/33-AI基础设施技术栈选型' },
  { text: '34 · Technology selection decision tree', link: '/en/tutorial/34-技术选型决策树' },
]

export const enTutorialOrg = [
  { text: '35 · AI-native organizational architecture', link: '/en/tutorial/35-AI原生组织架构' },
  { text: '36 · Super individuals & super teams', link: '/en/tutorial/36-超级个体与超级团队' },
  { text: '37 · Shared context architecture', link: '/en/tutorial/37-共享上下文架构' },
  { text: '38 · AI workflow architecture', link: '/en/tutorial/38-AI工作流架构' },
  { text: '39 · Accountability & governance architecture', link: '/en/tutorial/39-责任与治理架构' },
  { text: '40 · AI-native organization evolution roadmap', link: '/en/tutorial/40-AI原生组织演进路线' },
]

export const enTutorialTraining = [
  { text: 'T01 · Training Plans Are Not an Algorithm Leaderboard: Layer the Decision First', link: '/en/tutorial/T01-训练方案不是算法排行榜先把决策分层' },
]

export const enCases = [
  { text: 'Cases overview', link: '/en/cases/README' },
  { text: '01 · StarArena: concert ticketing', link: '/en/cases/stararena-ticketing/README' },
  { text: '02 · PatchDesk: ticketing SaaS', link: '/en/cases/patchdesk-saas/README' },
  { text: '03 · DocuMind: enterprise RAG', link: '/en/cases/documind-rag/README' },
  { text: '04 · SyncRoom: realtime collaboration', link: '/en/cases/syncroom-collaboration/README' },
  { text: '05 · FeedStream: content distribution', link: '/en/cases/feedstream-content/README' },
  { text: '06 · CodePilot: coding Agent', link: '/en/cases/codepilot-agent/README' },
]
