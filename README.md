# Astra Games

[awesome-gpt-6-astra](https://github.com/MartinDelophy/awesome-gpt-6-astra) 的官方网站，**12 种语言**。

作品目录不在本仓库维护 —— 页面在服务端解析上游对应语言的 README，上游合并 PR 后本站几分钟内自动跟上，不需要改网站数据，也不需要重新部署。

- 线上：<https://astragames.aigccreative.com>
- 设计系统：[DESIGN.md](DESIGN.md)

## 页面

| 路由 | 说明 |
| --- | --- |
| `/` | 按 `Accept-Language` 307 跳到最匹配的语言，无匹配则英文 |
| `/{locale}` | 首页：Hero、作品目录、收录标准、收录流程、CTA |
| `/{locale}/works/{slug}` | 作品详情：封面、平台、模型参与说明、开发资料、相关作品 |
| `/api/catalog?locale=` | 目录 JSON |
| `/api/preview?id=&v=&l=` | 作品封面 |

`locale` 为 `en`（默认）`zh-CN` `ja` `ko` `fr` `de` `es` `pt-BR` `ru` `ar` `hi` `id`。阿拉伯语走 RTL。

默认语言只在 `lib/i18n.ts` 的 `DEFAULT_LOCALE` 一处定义 —— 它同时决定 `/` 的兜底目标、`x-default` 指向，以及 404 这类拿不到路由参数的页面说什么语言。

## 技术栈

| | |
| --- | --- |
| 框架 | Next.js 16（App Router，Turbopack） |
| 样式 | Tailwind CSS v4 + CSS 自定义属性令牌 |
| 动效 | Motion（布局与进场）、GSAP ScrollTrigger（滚动时间轴）、Canvas 2D（Hero 粒子场） |
| 字体 | Figtree（拉丁）+ 各语系系统字体栈 |
| 目录解析 | unified / remark-parse / remark-gfm |

## 本地开发

```sh
npm install
npm run dev
```

开发服务同时提供页面和两个 API。数据来自公开上游仓库，不需要 GitHub Token 或截图服务密钥。

```sh
npm run build     # 生产构建，含 TypeScript 检查
npm start
```

## 多语言

`lib/i18n.ts` 是唯一的语言注册表：语言码、上游 README 文件名、`lang`、书写方向。加一种语言 = 加一行 + 一份 `lib/dictionaries/{locale}.ts`。词条对象有统一的 TypeScript 类型，漏翻是编译错误，不会退化成英文泄漏到译文页面。

上游每种语言的 README 既翻译条目标签（`作者` / `Creator` / `제작자` / `المبدع` / `Автор` …），也翻译栏目标题（`动作与街机` / `アクション・アーケード` / `Экшен и аркады` …）。`lib/catalog.js` 里的标签正则和分类关键词收录了全部 12 种语言实际使用的写法。

这一步不做的话失败是静默的：只认中英文时，其余 10 种语言的作者名和源码链接全为空，作品也全部落到「其他」分类。12 份目录现在解析结果完全一致 —— 6 作品、6 作者、5 游戏 + 1 实验。

## 目录数据

**目录是动态的，不在本仓库维护。** 服务端按请求解析上游对应语言的 README，成功结果缓存 5 分钟。上游合并 PR 后本站几分钟内自动跟上 —— 不用改代码、不用重新部署，也没有第二份作品数据要同步。

`lib/catalog.js` 移植自上游 `website/server/catalog.js`，逐条解析 README 的列表与表格，识别作品名、描述、作者、试玩地址、源码地址、截图和嵌套的元信息条目，并按栏目和描述分类。

改动仅三处：快照回退改为静态 JSON 导入以适配打包；服务按语言实例化，各自持有独立缓存和 ETag；标签正则扩到 12 种语言。

三层降级：

1. 上游可达 —— 解析结果缓存 5 分钟（`REFRESH_SECONDS`）。
2. 上游暂时不可达 —— 继续用最近一次成功的结果，页面标记为旧数据。
3. 冷启动就失败 —— 回退到该语言的快照。

快照只有英文和中文两份（`lib/catalog-fallback.*.json`），因为一份快照就是某种语言目录的副本，不能拿去顶替别的语言。没有快照的语言在这种情况下显示空目录和重试入口，而不是显示错语言的内容。

```sh
npm run snapshot   # 从线上刷新两份快照
```

`raw.githubusercontent.com` 有几分钟的 CDN 缓存，上游刚合并就跑这个命令可能拿到上一版；脚本会打印实际抓到的 revision。

文档格式无法识别时会抛错而不是返回空列表，避免上游改版把目录静默清空。

## 作品封面

`/api/preview` 移植自上游 `website/server/previews.js`，按顺序尝试：

1. 上游目录中作者提供的图片
2. `lib/previews.manifest.json` 里已验证的本地实拍截图
3. 演示页面的 Open Graph / Twitter 图片
4. GitHub 源码仓库的 Open Graph 卡片
5. 404 —— 前端退回按作品 ID 生成的渐变封面

URL 来自社区编辑的 README，所以抓取是收紧的：只允许 HTTPS，DNS 只解析一次并把地址钉死在该请求上，私有地址段一律拒绝，限制大小、重定向次数和总时间预算。作品 ID 由标题哈希得出，而标题是翻译过的，所以请求要带 `l=` 指明语言。

## SEO 与 GEO

| 信号 | 位置 |
| --- | --- |
| title / description / canonical | 每种语言各一份，来自 `lib/dictionaries/` |
| hreflang | 12 语言互指 + `x-default` 指向英文 |
| Open Graph 分享卡 | `app/[locale]/opengraph-image.tsx`，1200×630，带实时作品数 |
| 结构化数据 | `lib/structured-data.ts` |
| sitemap | 96 条（12 首页 + 12×7 详情），每条带 hreflang |
| robots | 通配 + 13 个 AI 抓取器显式放行 |
| `/llms.txt` | 从实时目录生成的纯文本简报 |

结构化数据用 schema.org：首页是 `CollectionPage` + `ItemList`，每条作品按分类映射为 `VideoGame` / `SoftwareApplication` / `CreativeWork`；详情页额外带 `BreadcrumbList`。

**只写目录真正记录的字段。** 没有 `offers`、没有 `aggregateRating`、没有 `isAccessibleForFree` —— 这些上游没有逐条核实，编出来既会被搜索引擎判为虚假标记，也会被回答引擎当成事实复述出去。

同理，sitemap **不带 `lastmod`**。这个服务唯一有的时间戳是「上次读取上游的时间」，每几分钟刷新一次，跟内容有没有变无关；发布它等于告诉爬虫每个页面都在持续变更。真实变更时间需要持久化状态，我们没有，所以宁可不写。

`/api/` 整体不进索引，但 `/api/preview` 单独放行 —— 结构化数据和 OG 标签里的封面图都指向它，挡掉的话富媒体结果和分享卡就都没有图。

`/llms.txt` 除了列作品，还明确写了三件容易被误读的事：收录不等于评测或背书、项目与 OpenAI 无隶属关系、模型归因来自作者自述且未逐条核实。这些正是摘要最容易说错的地方。

**没做 `keywords` meta**：主流搜索引擎二十年前就不再使用它。

## 部署

Vercel，零配置。Framework 自动识别为 Next.js，Root Directory 留空。

生产域名 `astragames.aigccreative.com` 目前指向旧的 `astragames` 项目；切换到本项目需要在 Vercel 里把域名从旧项目移除、绑定到新项目。`aigccreative.com` 属于另一个雷达网站项目，不要整域绑定。

## 许可

MIT。上游清单文字与视觉素材以 CC0 1.0 发布；链接指向的作品各自遵循原许可。
