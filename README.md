# Astra Games

[awesome-gpt-6-astra](https://github.com/MartinDelophy/awesome-gpt-6-astra) 的官方网站。

作品目录不在本仓库维护 —— 页面在服务端解析上游 `README.zh-CN.md`，上游合并 PR 后本站几分钟内自动跟上，不需要改网站数据，也不需要重新部署。

- 线上：<https://astragames.aigccreative.com>
- 设计系统：[DESIGN.md](DESIGN.md)

## 技术栈

| | |
| --- | --- |
| 框架 | Next.js 16（App Router，Turbopack） |
| 样式 | Tailwind CSS v4 + CSS 自定义属性令牌 |
| 动效 | Motion（布局与进场）、GSAP ScrollTrigger（滚动时间轴）、Canvas 2D（Hero 粒子场） |
| 字体 | Figtree + Noto Sans SC |
| 目录解析 | unified / remark-parse / remark-gfm |

## 本地开发

```sh
npm install
npm run dev
```

开发服务同时提供页面和 `/api/catalog`。目录数据来自公开上游仓库，不需要 GitHub Token。

```sh
npm run build     # 生产构建，含 TypeScript 检查
npm start         # 跑生产产物
```

## 目录数据

`lib/catalog.js` 移植自上游 `website/server/catalog.js`，逐条解析 README 的列表与表格，识别作品名、描述、作者、试玩地址、源码地址和截图，并按栏目和描述分类。仅有的改动是快照回退改为静态 JSON 导入，以适配 Next.js 打包。

三层降级：

1. 上游可达 —— 解析结果缓存 5 分钟（`REFRESH_SECONDS`）。
2. 上游暂时不可达 —— 继续用最近一次成功的结果，页面标记为旧数据。
3. 冷启动就失败 —— 回退到 `lib/catalog-fallback.json` 快照。

文档格式无法识别时会抛错而不是返回空列表，避免上游改版把目录静默清空。

### 换一个语言的目录

上游为每种语言维护一个 README。默认读简体中文版，改环境变量即可切换：

```sh
ASTRA_README_PATH=README.md npm run dev     # 英文
```

## 部署

Vercel，零配置。Framework 自动识别为 Next.js，Root Directory 留空。

生产域名 `astragames.aigccreative.com` 目前指向旧的 `astragames` 项目；切换到本项目需要在 Vercel 里把域名从旧项目移除、绑定到新项目。`aigccreative.com` 属于另一个雷达网站项目，不要整域绑定。

## 许可

MIT。上游清单文字与视觉素材以 CC0 1.0 发布；链接指向的作品各自遵循原许可。
