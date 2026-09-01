# 🗺️ 架构模板库

> 每个模板是一张「架构地图」。我们**只讲架构,不讲语言/框架/语法**。
> 目标是:让你看完就能理解「这类系统为什么这么设计」,并能把它当作自己设计的起点。

---

## 模板清单

> 共 **31** 个模板:16 个经典 / 通用系统 + 5 个 AI 原生系统 + 4 个 AI 编码 / 自治 Agent + 1 个系统提示词架构 + 5 个工业 / 嵌入式系统。每个模板都附**真实开源项目 / 工程文档链接**(见各模板末尾「参考原型与延伸阅读」)。

### 经典 / 通用系统

| 模板 | 代表产品 | 一句话定位 | 核心看点 |
|---|---|---|---|
| [AI 对话产品](ai-chat-product/README.md) | Claude、ChatGPT | 把大模型包装成可对话、可流式、可联网的产品 | 推理服务、流式、上下文、RAG、成本 |
| [浏览器插件](browser-extension/README.md) | Honey、Grammarly | 在别人的网页里安全地注入能力并变现 | 脚本分离、注入、隐私边界、变现 |
| [普通网站](standard-web-app/README.md) | 官网、博客、SaaS 后台 | 90% 项目真正需要的「够用就好」架构 | 三层、缓存、读写分离 |
| [移动 App](mobile-app/README.md) | 大多数 iOS/Android 应用 | 在不稳定网络下提供顺滑体验 | 离线优先、同步、状态、推送 |
| [电商平台](ecommerce-platform/README.md) | Amazon、Shopify、淘宝 | 让「钱货两清」在高并发下不出错 | 库存、订单、支付、超卖、洪峰 |
| [社交信息流](social-feed/README.md) | Twitter/X、Instagram | 把海量内容按关系/兴趣排好送到每个人眼前 | Feed 推拉、关注图、热点扩散 |
| [视频流媒体](video-streaming/README.md) | Netflix、YouTube | 把大文件以最低延迟、最省带宽送达全球 | 转码、CDN、自适应码率、推荐 |
| [实时通讯](realtime-chat/README.md) | WhatsApp、Slack、微信 | 让消息又快又不丢又有序地到达 | 长连接、时序、离线投递、群扩散 |
| [短链接服务](url-shortener/README.md) | Bitly、TinyURL、t.co | 把长链接压成可分发可追踪的短码并极速重定向 | 读多写少、缓存、301/302、唯一 ID |
| [支付系统](payment-system/README.md) | Stripe、支付宝、PayPal | 在不确定世界里把账算到分毫不差 | 幂等、复式记账、对账、状态机 |
| [搜索引擎](search-engine/README.md) | Google、Elasticsearch | 用倒排索引让关键词毫秒级命中并排序 | 倒排索引、相关性、召回+精排、分片 |
| [网约车 / 出行](ride-hailing/README.md) | Uber、滴滴 | 在活地图上秒级撮合海量司机与乘客 | 地理空间索引、实时位置、供需匹配 |
| [实时协同文档](collaborative-doc/README.md) | Google Docs、Figma | 多人同时编辑、实时合并、互不覆盖 | OT/CRDT、单 writer 串行、操作日志 |
| [云存储 / 网盘](cloud-storage/README.md) | Dropbox、iCloud | 文件不丢、多设备同步、少占空间 | 分块、内容寻址去重、增量同步 |
| [通知 / 推送系统](notification-system/README.md) | Novu、FCM/APNs | 把「发生了什么」克制可靠地送达对的人 | 多渠道扇出、去重限频、异步重试 |
| [在线票务 / 抢票](online-ticketing/README.md) | Ticketmaster、大麦、12306 | 海量瞬时争抢有限座位还不超卖 | 虚拟等候室、原子扣减、锁座超时 |

### 🤖 AI 原生系统(LLM 时代新增)

| 模板 | 代表产品 / 原型 | 一句话定位 | 核心看点 |
|---|---|---|---|
| [AI 中转站 / 网关](ai-gateway/README.md) | One API、LiteLLM、Bifrost、Portkey | 用统一入口接入所有大模型并集中治理 | 统一接口、计费限流、负载均衡、缓存 |
| [RAG 知识库](rag-knowledge-base/README.md) | RAGFlow、LlamaIndex、Dify | 让模型「开卷考试」、基于你的资料作答 | 切块、向量检索、混合检索+重排、引用 |
| [AI Agent / 工作流](ai-agent-platform/README.md) | Dify、Coze、LangGraph | 让模型规划→调工具→观察→再决策 | 行动循环、工具沙箱、记忆、可控兜底 |
| [模型推理服务](inference-serving/README.md) | vLLM、SGLang、Triton | 在 GPU 上把模型榨到最高吞吐 | 连续批处理、分页 KV、量化、多副本 |
| [向量数据库](vector-database/README.md) | Milvus、Qdrant、pgvector | 海量高维向量的毫秒级相似检索 | ANN、HNSW/IVF、召回-延迟权衡 |

### 🦾 AI 编码 / 自治 Agent(2026 新增)

| 模板 | 代表产品 / 原型 | 一句话定位 | 核心看点 |
|---|---|---|---|
| [Claude Code](claude-code/README.md) | Claude Code(Anthropic) | 把 Claude 装进终端的本地优先编码 agent | 自治循环、子代理/钩子/MCP、双层权限 + OS 沙箱、上下文压缩 |
| [OpenAI Codex](codex/README.md) | Codex CLI + Cloud | 同一内核:本地实时结对 + 云端异步跑完开 PR | 双形态、沙箱 × 审批双轴、内核级隔离、默认断网 |
| [OpenClaw(龙虾 🦞)](openclaw/README.md) | OpenClaw(原 Clawdbot/Moltbot) | 自托管常驻、把 agent 接到你在用的聊天软件 | 单进程 Gateway、消息平台即 UI、心跳 / cron、可插拔 harness |
| [Hermes(爱马仕)](hermes/README.md) | Hermes(Nous Research) | 跟你一起成长的自托管常驻智能体 | FTS5 持久记忆、自动沉淀技能、cron、多渠道 / 多 provider |

### 📜 系统提示词架构

| 模板 | 代表产品 / 原型 | 一句话定位 | 核心看点 |
|---|---|---|---|
| [系统提示词架构](system-prompt-architecture/README.md) | Claude Fable 5、GPT-5.5、Gemini、Grok、Cursor | 把大模型包装成产品的分层 Agent OS | 六层模块、决策树路由、Skills 外化、合规硬约束、运行时注入 |

### 🏭 工业 / 嵌入式系统(2026 新增)

> 这一组的共同点:**软件的错误会变成物理世界的后果**——变砖、停产、撞人。所以架构的主角从「扩容和迭代」换成了「隔离、自治、兜底」。

| 模板 | 代表产品 / 原型 | 一句话定位 | 核心看点 |
|---|---|---|---|
| [嵌入式设备固件](embedded-device/README.md) | 智能门锁、手环;Zephyr、FreeRTOS | 资源锁死、错误无处逃的微型系统 | HAL 分层、状态机、看门狗、A/B 双分区 OTA |
| [IoT 设备接入平台](iot-platform/README.md) | AWS IoT Core、涂鸦;ThingsBoard、EMQX | 让百万不可靠设备连上来、收上来、下得去 | 海量长连接、一机一密、设备影子、灰度 OTA |
| [工业边缘网关 / SCADA](industrial-edge/README.md) | 工厂数采、SCADA;EdgeX、OPC UA | OT 与 IT 之间受管制的过境口岸 | 协议归一、边缘自治、Purdue 隔离、受控反向控制 |
| [车载电子电气(E/E)](automotive-ee/README.md) | 特斯拉集中式、域控;openpilot、AUTOSAR | 轮子上的数据中心,刹车永远优先 | ASIL 隔离、两种总线、整车 OTA、影子模式 |
| [机器人系统](robotics/README.md) | 扫地机、AGV、无人机;ROS 2、PX4 | 感知→规划→控制的毫秒级物理闭环 | 频率分层、安全旁路、录制回放、车队管理 |

---

## 每个模板都长一样:统一的 14 段结构

我们刻意让所有模板遵循**同一套结构**(见 [`_TEMPLATE.md`](_TEMPLATE.md))。这样做有两个好处:

1. **越读越快**:你第一次读要从头看,第十次读就能直接跳到「关键决策」那一节。
2. **结构本身就是教学**:这 14 段,正好就是你设计任何系统时该依次问自己的 14 类问题。

| # | 段落 | 它在回答什么问题 |
|---|---|---|
| 1 | 一句话定位 | 这东西到底是什么? |
| 2 | 业务本质 | 它在解决什么真实问题?谁付钱? |
| 3 | 核心需求与约束 | 功能要做什么?非功能(质量)要满足什么? |
| 4 | 架构全景图 | 整体长什么样?(一张 ASCII 图) |
| 5 | 组件职责 | 每个部件干什么?为什么需要它? |
| 6 | 关键数据流 | 核心场景下,请求/数据怎么流动? |
| 7 | 数据模型与存储 | 存什么?为什么用这种存储? |
| 8 | 关键决策与权衡 | 在哪些岔路口做了选择?放弃了什么? |
| 9 | 规模化与瓶颈 | 用户涨 100 倍,第一个会死的是哪? |
| 10 | 安全与合规 | 哪里是攻击面?哪些数据碰不得? |
| 11 | 常见误区 / 反模式 | 新手最容易在哪里把它做错? |
| 12 | 演进路线 | MVP→成长期→成熟期,每阶段架构长什么样? |
| 13 | 可复用要点 | 哪些思想能搬到别的系统上? |
| 14 | 参考原型与延伸阅读 | 它的真实原型是哪些开源项目 / 公开文档? |

---

## 阅读建议

- **别死记图**。记住的应该是「**为什么**这么连」,而不是「这里有几个框」。同一个系统,换个规模或换个约束,图就完全不同。
- **重点看第 8、9、11 段**。这三段(决策权衡、瓶颈、误区)是浓缩了真实经验的部分,也是面试和实战最值钱的部分。
- **对照第 12 段(演进)看自己**。你现在做的东西,大概率不需要成熟期那套重型架构。看清楚自己在哪个阶段,避免过度设计。

---

## 关于「真实性」的说明

这些模板基于这些产品**公开披露的架构理念、工程博客、技术演讲和业界通行实践**整理而成,目的是**教学**:抓住这类系统架构上的共性与关键取舍。

它们**不是**任何公司的内部真实图纸,具体数字、组件命名做了通用化处理。把它们当作「这一类系统的典型架构长这样」来理解,而不是「某公司就是这么实现的」。

---

## 想贡献一个新模板?

1. 复制 [`_TEMPLATE.md`](_TEMPLATE.md) 到一个新目录,比如 `templates/your-system/README.md`。
2. 把 14 段逐一填满(含给出**真实**的参考原型链接),**坚持只讲架构**——一旦你开始写「用 XX 语言的 YY 库」,就停下来问自己:这是架构决策,还是实现细节?
3. 图用 ASCII 画(纯文本、到处都能看、永不失效)。
4. 在上面的清单表格里加一行。

> 标准:一个没接触过这个领域的工程师,读完你的模板,能讲清楚「这类系统为什么这么设计、会死在哪」。
