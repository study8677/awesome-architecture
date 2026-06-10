# Awesome Architecture · 架构图谱

> 一个专注「**架构**」而非「代码」的开源知识库。
> 收集真实热门系统的架构模板,并配一套让你成为更好架构师的教程。

[English](./README_en.md) · **简体中文**

**🌐 在线阅读(可交互 · 中英双语,HTTPS):** <https://study8677.github.io/awesome-architecture/>

**🏆 社区关注:** 2026-06-08,项目登上 [PickGithub](http://pickgithub.com/rank) **Vue 趋势榜当日第 1**。

**🧭 配套 skill:** [architecture-copilot](https://github.com/study8677/architecture-copilot) —— 把这套知识变成能在 Claude Code / Cursor / Codex 里**引导你一步步设计架构**的交互式 skill。

[![zread](https://img.shields.io/badge/Ask_Zread-_.svg?style=flat&color=00b0aa&labelColor=000000&logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQuOTYxNTYgMS42MDAxSDIuMjQxNTZDMS44ODgxIDEuNjAwMSAxLjYwMTU2IDEuODg2NjQgMS42MDE1NiAyLjI0MDFWNC45NjAxQzEuNjAxNTYgNS4zMTM1NiAxLjg4ODEgNS42MDAxIDIuMjQxNTYgNS42MDAxSDQuOTYxNTZDNS4zMTUwMiA1LjYwMDEgNS42MDE1NiA1LjMxMzU2IDUuNjAxNTYgNC45NjAxVjIuMjQwMUM1LjYwMTU2IDEuODg2NjQgNS4zMTUwMiAxLjYwMDEgNC45NjE1NiAxLjYwMDFaIiBmaWxsPSIjZmZmIi8%2BCjxwYXRoIGQ9Ik00Ljk2MTU2IDEwLjM5OTlIMi4yNDE1NkMxLjg4ODEgMTAuMzk5OSAxLjYwMTU2IDEwLjY4NjQgMS42MDE1NiAxMS4wMzk5VjEzLjc1OTlDMS42MDE1NiAxNC4xMTM0IDEuODg4MSAxNC4zOTk5IDIuMjQxNTYgMTQuMzk5OUg0Ljk2MTU2QzUuMzE1MDIgMTQuMzk5OSA1LjYwMTU2IDE0LjExMzQgNS42MDE1NiAxMy43NTk5VjExLjAzOTlDNS42MDE1NiAxMC42ODY0IDUuMzE1MDIgMTAuMzk5OSA0Ljk2MTU2IDEwLjM5OTlaIiBmaWxsPSIjZmZmIi8%2BCjxwYXRoIGQ9Ik0xMy43NTg0IDEuNjAwMUgxMS4wMzg0QzEwLjY4NSAxLjYwMDEgMTAuMzk4NCAxLjg4NjY0IDEwLjM5ODQgMi4yNDAxVjQuOTYwMUMxMC4zOTg0IDUuMzEzNTYgMTAuNjg1IDUuNjAwMSAxMS4wMzg0IDUuNjAwMUgxMy43NTg0QzE0LjExMTkgNS42MDAxIDE0LjM5ODQgNS4zMTM1NiAxNC4zOTg0IDQuOTYwMVYyLjI0MDFDMTQuMzk4NCAxLjg4NjY0IDE0LjExMTkgMS42MDAxIDEzLjc1ODQgMS42MDAxWiIgZmlsbD0iI2ZmZiIvPgo8cGF0aCBkPSJNNCAxMkwxMiA0TDQgMTJaIiBmaWxsPSIjZmZmIi8%2BCjxwYXRoIGQ9Ik00IDEyTDEyIDQiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4K&logoColor=ffffff)](https://zread.ai/study8677/awesome-architecture)

---

## 这个仓库为什么存在

过去二十年,程序员的核心竞争力是「**把代码写对、写快**」。

但有一件事正在我们眼前发生:**「写代码」这件事,正在消失。** 不是变难,也不是变少,而是作为「一门靠人来做的稀缺手艺」正在终结。在 OpenAI、Anthropic 这样的前沿实验室,代码几乎已经全部由 AI 写出,人类工程师不再亲手敲实现——他们只做两件事:**告诉 AI 要造什么,然后判断它造得对不对。** 当机器几秒就能吐出能跑的代码,"用 `for` 还是 `map`、背没背过某个 API、熟不熟某种语法"这些曾经的看家本领,一夜之间一文不值。

真正不会贬值、而且越来越值钱的,是另一种能力:

> **在动手写第一行代码之前,先想清楚这个系统应该长什么样子。**
>
> 数据从哪来、到哪去?哪些部分必须强一致、哪些可以最终一致?
> 哪里会先崩?用户从 1 万涨到 1 亿时,第一个瓶颈在哪?
> 为了拿到 A,我愿意放弃哪个 B?

这就是**架构思维**。它和具体语言无关,和框架无关,甚至和今年流行什么无关。它是一种「**先看地图,再上路**」的判断力。

**本仓库的信念:未来优秀的开发者,首先是一个会做架构判断的人,其次才是会写代码的人。** 你应该先在架构层面对自己要做的东西有清晰的理解,代码只是把这个理解落地的手段之一。

---

## 仓库里有什么

```
awesome-architecture/
├── tutorial/      📚 教程 —— 系统地教你「怎么像架构师一样思考」
├── templates/     🗺️ 模板 —— 真实热门系统的架构地图,只讲架构、不讲语法
└── cases/         🧪 案例 —— 把具体项目从 0 推到上线,再推到真实压力下
```

### 📚 tutorial/ —— 成为更好架构师的教程

不是讲「某个框架怎么用」,而是讲一套可迁移的思考方法:如何把模糊的需求拆成约束,如何在取舍中做决策,如何画出能沟通的架构图,如何从 0 设计一个全新系统。

| 章节 | 主题 | 你将学会 |
|---|---|---|
| [01](tutorial/01-为什么先有架构思维.md) | 为什么先有架构思维 | 为什么「架构优先」是这个时代的核心技能 |
| [02](tutorial/02-架构师的思考框架.md) | 架构师的思考框架 | 需求 → 约束 → 质量属性 → 取舍 的通用流程 |
| [03](tutorial/03-读懂与画好架构图.md) | 读懂与画好架构图 | 用 C4 模型把脑中的系统画出来、讲明白 |
| [04](tutorial/04-十大核心架构模式.md) | 十大核心架构模式 | 分层、微服务、事件驱动、CQRS… 各自解决什么问题 |
| [05](tutorial/05-数据与状态.md) | 数据与状态 | 为什么「数据」才是系统真正的难点 |
| [06](tutorial/06-质量属性与取舍.md) | 质量属性与取舍 | 性能/可用性/一致性/成本,怎么权衡 |
| [07](tutorial/07-从0到1设计一个系统.md) | 从 0 到 1 设计一个系统 | 一套可照着做的实战方法论 |
| [08](tutorial/08-架构决策记录与演进.md) | 架构决策记录与演进 | 用 ADR 记录决策,让架构随业务长大 |
| [09](tutorial/09-架构品味.md) | 架构品味 | 框架之外什么在拉开差距;用真实案例(微服务回单体、各大公司审美)养出判断力 |

**🚀 进阶篇(10–17,新增)—— 驾驭「做大做关键后才咬人」的硬骨头:**

| 章节 | 主题 | 你将驾驭 |
|---|---|---|
| [10](tutorial/10-分布式系统的硬道理.md) | 分布式系统的硬道理 | 部分失败、无全局时钟、共识的代价、exactly-once 幻觉 |
| [11](tutorial/11-数据一致性工程.md) | 数据一致性工程 | Saga、Outbox、幂等、事件溯源、CQRS |
| [12](tutorial/12-为失败而设计.md) | 为失败而设计·韧性工程 | 级联失败、熔断、舱壁、降载、SLO、混沌工程 |
| [13](tutorial/13-规模化的力学.md) | 规模化的力学 | 一致性哈希、热点、多活、尾延迟与扇出放大 |
| [14](tutorial/14-演进与拆分大型系统.md) | 演进与拆分大型系统 | 绞杀者、并行运行、零停机迁移、拆单体、DDD 限界上下文 |
| [15](tutorial/15-组织即架构.md) | 组织即架构 | 康威 / 逆康威、团队拓扑、平台工程 |
| [16](tutorial/16-安全与多租户架构.md) | 安全与多租户架构 | 威胁建模、零信任、爆炸半径、租户隔离 |
| [17](tutorial/17-大模型时代的架构判断.md) | 大模型时代的架构判断 | vibe coding、非确定性、上下文工程、agentic 硬骨头 |

**🎯 实战篇(18–22)—— 把方法落到真实案例,补上「教程 → 模板」之间的桥:**

| 章节 | 主题 | 你将练会 |
|---|---|---|
| [18](tutorial/18-读地图用框架拆解陌生系统.md) | 读地图:用框架拆解陌生系统 | 对着 `templates/` 逆向读懂「为什么这么设计」;以 RAG / AI 对话产品练眼 |
| [19](tutorial/19-完整设计演练中等复杂度系统.md) | 完整设计演练:中等复杂度系统 | 07 八步从 0 设计「能查单、能退款」的 AI 智能客服(含 token 成本估算) |
| [20](tutorial/20-演进剧本MVP到规模化.md) | 演进剧本:MVP 到规模化 | 08 + [演进触发信号](tutorial/演进触发信号.md),同一个 AI 客服的三段人生 |
| [21](tutorial/21-拆分与迁移实战.md) | 拆分与迁移实战 | 14 章案例化:绞杀者、抽象分支、影子流量、零停机换向量库 |
| [22](tutorial/22-AI原生系统设计.md) | AI 原生系统设计 | 把客服升级为自主 Agent,落地 17 章三个新约束,引向 AI 协同篇 |

**🤝 AI 协同设计篇(23–26)—— 会设计之后,学会与 AI 协作落地与审查:**

| 章节 | 主题 | 你将掌握 |
|---|---|---|
| [23](tutorial/23-规格即架构约束怎么写给AI.md) | 规格即架构:约束怎么写给 AI | ADR / `AGENTS.md` → 可执行护栏,对接 [architecture-copilot](https://github.com/study8677/architecture-copilot) |
| [24](tutorial/24-审查清单AI产出默认缺什么.md) | 审查清单:AI 产出默认缺什么 | 11/12/16 的生产级 review checklist |
| [25](tutorial/25-评测驱动把够好写进架构.md) | 评测驱动:把「够好」写进架构 | eval 当 CI 门禁,承接非确定性 |
| [26](tutorial/26-协作决策树何时vibe何时spec-first.md) | 协作决策树:何时 vibe、何时 spec-first | 原型 vs 生产的 workflow 总收束 |

**🧰 技术栈选型篇(27–34)—— 把「用什么技术」变成架构判断:**

| 章节 | 主题 | 你将判断 |
|---|---|---|
| [27](tutorial/27-编程语言与后端框架选型.md) | 编程语言与后端框架选型 | 语言/框架如何影响运行时、生态、团队和维护成本 |
| [28](tutorial/28-数据库与存储选型.md) | 数据库与存储选型 | 事实源、读模型、搜索、对象存储、向量库怎么分工 |
| [29](tutorial/29-缓存消息队列与事件系统选型.md) | 缓存、消息队列与事件系统选型 | 读热点、削峰、事件广播分别该用什么 |
| [30](tutorial/30-API与服务通信选型.md) | API 与服务通信选型 | REST / gRPC / GraphQL / Webhook 的边界 |
| [31](tutorial/31-云原生与部署平台选型.md) | 云原生与部署平台选型 | PaaS、容器、Serverless、K8s 何时值得上 |
| [32](tutorial/32-可观测性与可靠性技术栈选型.md) | 可观测性与可靠性技术栈选型 | 从 SLO 倒推指标、日志、链路、告警和事故流程 |
| [33](tutorial/33-AI基础设施技术栈选型.md) | AI 基础设施技术栈选型 | 模型 API、RAG、向量库、推理服务、eval 何时升级 |
| [34](tutorial/34-技术选型决策树.md) | 技术选型决策树 | 把阶段、失败模式、团队能力、退出方案串成 ADR |

> 👉 **新手从 [tutorial/README.md](tutorial/README.md) 开始**,那里有完整的学习路径。

### 🧪 cases/ —— 把架构从答案写成推理过程

`cases/` 不是更多模板,而是把一个具体项目从 0 推到能上线、再推到能扛住真实压力。它补的是 `tutorial/` 和 `templates/` 之间的最后一段路:模板告诉你「这类系统通常长什么样」,案例告诉你「在这个具体场景里,为什么最后只能这样取舍」。

第一批 6 个核心案例已经收束:

| 案例 | 对应能力 | 主要练什么 |
|---|---|---|
| [01 · StarArena:演唱会抢票系统](cases/stararena-ticketing/README.md) | 在线票务 / 电商 / 支付 | 有限库存、虚拟等候室、锁座、支付状态机、对账补偿 |
| [02 · PatchDesk:轻量工单 SaaS](cases/patchdesk-saas/README.md) | 普通 Web / SaaS 后台 | 模块化单体、多租户隔离、RBAC、Outbox、异步通知、搜索报表演进 |
| [03 · DocuMind:企业 RAG 知识库](cases/documind-rag/README.md) | RAG / AI 对话 / 向量数据库 | 文档入库、切块、混合检索、知识图谱 RAG、重排、引用、权限、提示注入、评测 |
| [04 · SyncRoom:实时协同工作台](cases/syncroom-collaboration/README.md) | 实时通讯 / 协同文档 / 通知 | 长连接、服务端序号、离线补齐、多端同步、OT / CRDT、Presence、通知降级 |
| [05 · FeedStream:内容分发系统](cases/feedstream-content/README.md) | 社交 Feed / 视频 / 搜索 | 推拉混合、大 V 扇出、时间线收件箱、推荐排序、搜索索引、视频转码、CDN、审核召回 |
| [06 · CodePilot:编码 Agent 平台](cases/codepilot-agent/README.md) | AI Agent / Codex / Claude Code | 工具调用、权限网关、沙箱、人工审批、上下文压缩、检查点、子代理、trace、eval 门禁 |

> 👉 **案例总览见 [cases/README.md](cases/README.md)**。读法很简单:不要背图,盯住「起始架构为什么合理」「哪个量化信号逼它升级」「新架构选择了什么又放弃了什么」。

### 🗺️ templates/ —— 真实系统的架构模板

每一个模板都是一张「架构地图」。我们**刻意不讨论用什么语言、什么框架**,只讨论:这类系统在解决什么问题、由哪些部件组成、数据怎么流动、关键决策怎么取舍、规模化时会死在哪里。

> 目前共 **25** 个模板(16 经典 / 通用 + 5 AI 原生 + 4 AI 编码 / 自治 Agent),每个都在末尾附**真实开源项目 / 工程文档链接**,可顺着去读源码。

**经典 / 通用系统:**

| 模板 | 代表产品 | 核心架构看点 |
|---|---|---|
| [AI 对话产品](templates/ai-chat-product/README.md) | Claude、ChatGPT | LLM 推理、流式输出、上下文管理、RAG、成本控制 |
| [浏览器插件](templates/browser-extension/README.md) | Honey、Grammarly | 内容脚本/后台分离、页面注入、隐私边界、变现 |
| [普通网站](templates/standard-web-app/README.md) | 企业官网、博客、SaaS 后台 | 经典三层、缓存、读写分离的「够用就好」 |
| [移动 App](templates/mobile-app/README.md) | 大多数 iOS/Android 应用 | 离线优先、数据同步、客户端状态、推送 |
| [电商平台](templates/ecommerce-platform/README.md) | Amazon、Shopify、淘宝 | 库存、订单、支付、超卖、大促洪峰 |
| [社交信息流](templates/social-feed/README.md) | Twitter/X、Instagram | Feed 拉取/推送、关注关系、热点扩散 |
| [视频流媒体](templates/video-streaming/README.md) | Netflix、YouTube | 转码、CDN、自适应码率、推荐 |
| [实时通讯](templates/realtime-chat/README.md) | WhatsApp、Slack、微信 | 长连接、消息时序、离线投递、群扩散 |
| [短链接服务](templates/url-shortener/README.md) | Bitly、TinyURL、t.co | 读多写少、缓存、301/302、分布式唯一 ID |
| [支付系统](templates/payment-system/README.md) | Stripe、支付宝、PayPal | 幂等、复式记账、对账、状态机 |
| [搜索引擎](templates/search-engine/README.md) | Google、Elasticsearch | 倒排索引、相关性排序、召回+精排、分片 |
| [网约车 / 出行](templates/ride-hailing/README.md) | Uber、滴滴 | 地理空间索引、实时位置、供需匹配、动态定价 |
| [实时协同文档](templates/collaborative-doc/README.md) | Google Docs、Figma | OT/CRDT、单 writer 串行、操作日志、离线同步 |
| [云存储 / 网盘](templates/cloud-storage/README.md) | Dropbox、iCloud | 文件分块、内容寻址去重、增量同步、断点续传 |
| [通知 / 推送系统](templates/notification-system/README.md) | Novu、FCM/APNs | 多渠道扇出、去重限频、异步重试、优先级 |
| [在线票务 / 抢票](templates/online-ticketing/README.md) | Ticketmaster、大麦、12306 | 虚拟等候室、原子扣减防超卖、锁座超时 |

**🤖 AI 原生系统(LLM 时代新增):**

| 模板 | 代表产品 / 原型 | 核心架构看点 |
|---|---|---|
| [AI 中转站 / 网关](templates/ai-gateway/README.md) | One API、LiteLLM、Portkey | 统一接口、计费限流、负载均衡、故障转移、缓存 |
| [RAG 知识库](templates/rag-knowledge-base/README.md) | RAGFlow、LlamaIndex、Dify | 切块、向量检索、混合检索+重排、引用溯源 |
| [AI Agent / 工作流](templates/ai-agent-platform/README.md) | Dify、Coze、LangGraph | 行动循环、工具沙箱、记忆、可控兜底 |
| [模型推理服务](templates/inference-serving/README.md) | vLLM、SGLang、Triton | 连续批处理、分页 KV 缓存、量化、多副本 |
| [向量数据库](templates/vector-database/README.md) | Milvus、Qdrant、pgvector | ANN 近似最近邻、HNSW/IVF、召回-延迟权衡 |

**🦾 AI 编码 / 自治 Agent(2026 新增,真实在用的 Agent 产品架构):**

| 模板 | 代表产品 / 原型 | 核心架构看点 |
|---|---|---|
| [Claude Code](templates/claude-code/README.md) | Claude Code(Anthropic) | 本地优先编码 agent、子代理/钩子/技能/MCP、双层权限 + OS 沙箱、上下文压缩 |
| [OpenAI Codex](templates/codex/README.md) | Codex CLI + Cloud | 本地 CLI 与云端异步沙箱双形态、沙箱 × 审批双轴、默认断网防注入、自动开 PR |
| [OpenClaw(龙虾 🦞)](templates/openclaw/README.md) | OpenClaw(原 Clawdbot) | 自托管 Gateway、聊天软件即 UI、心跳 / cron、可插拔 harness、记忆即纯文本 |
| [Hermes(爱马仕)](templates/hermes/README.md) | Hermes(Nous Research) | 常驻自我成长、FTS5 持久记忆、自动沉淀技能、cron、多渠道 / 多 provider |

> 👉 **想加入自己的模板?** 套用 [templates/_TEMPLATE.md](templates/_TEMPLATE.md) 的统一格式即可。

---

## 怎么用这个仓库

**如果你是初学者 / 想转向架构思维:**
按顺序读完 `tutorial/`,每读完一章,就去 `templates/` 里挑一个你感兴趣的系统,试着用刚学的框架去「读懂」它。读到 07 章以后,再进入 `cases/` 看完整项目推演。

**如果你正要设计一个新系统:**
先去 `tutorial/07` 学方法论,再去 `templates/` 里找最接近你场景的那张地图,把它当作起点而不是答案——照着它的「关键决策」和「常见误区」逐条问自己。如果你的场景接近第一批案例,直接对照 `cases/` 里的完整推演。

**如果你在准备系统设计面试:**
`templates/` 里的每个模板都覆盖了高频考点(超卖、Feed 扩散、消息时序、流式输出…),按统一格式组织,适合系统性复习。`cases/` 更适合练「从需求一路讲到取舍」的完整表达。

**如果你是资深工程师 / 架构师:**
直接看每个模板的「关键决策与权衡」和「演进路线」,这是最浓缩的部分。欢迎贡献你踩过的坑。

---

## 三条阅读原则

1. **先问「为什么」,再看「怎么做」。** 任何一个架构选择,背后都是某个约束或某个取舍。看不到取舍,就等于没看懂。
2. **没有最好的架构,只有最合适的架构。** 同样是「聊天」,做一个内部工具和做微信,答案天差地别。规模、团队、成本、合规决定一切。
3. **架构是会长大的。** 不要拿成熟期的架构去套 MVP。每个模板都给了「演进路线」,告诉你什么时候该升级、什么时候过度设计。

---

## 一句话总结

> **代码告诉计算机要做什么;架构决定这件事到底值不值得做、能不能做成、扛不扛得住。**
> 这个仓库,帮你练后面那种判断力。

---

## ⭐ Star 历史

> 如果它帮到了你,点颗 Star 就是对它最好的鼓励。

<a href="https://star-history.com/#study8677/awesome-architecture&Date">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=study8677/awesome-architecture&type=Date&theme=dark" />
    <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=study8677/awesome-architecture&type=Date" />
    <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=study8677/awesome-architecture&type=Date" />
  </picture>
</a>

---

## 🔗 友链

- [LINUX DO](https://linux.do/) —— 新的理想型社区,一群热爱技术、乐于分享的开发者聚集地。
