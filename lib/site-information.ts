import type { ArticleCopy, Localized } from './editorial';

export const INFORMATION_PAGES = ['about', 'privacy', 'contact'] as const;
export type InformationPage = (typeof INFORMATION_PAGES)[number];
export const INFORMATION_UPDATED = '2026-10-10';
export const WEBSITE_REPO = 'https://github.com/stackloomdev/astra-games';
export const WEBSITE_ISSUES = WEBSITE_REPO + '/issues/new';

export const INFORMATION: Record<InformationPage, Localized<ArticleCopy>> = {
  about: {
    en: {
      title: 'About Astra Games & our editorial approach',
      description: 'Who maintains the website, how the live catalogue differs from our guides, and how we handle evidence, corrections and rights.',
      intro: 'Astra Games helps people discover and understand games, interactive experiments and creative software made with GPT-6 Astra. The website project is maintained in stackloomdev/astra-games; the community catalogue is maintained separately in MartinDelophy/awesome-gpt-6-astra. Neither listing nor a guide is an endorsement by OpenAI.',
      sections: [
        { heading: 'Two kinds of content, with different jobs', paragraphs: ['The live catalogue follows the public upstream README. Titles, creators, descriptions, links and platform notes come from that source and can change without a website release. A sync date records when the catalogue was read; it is not the date of a playtest or a copyright check.', 'Our guides explain selected mechanics, compare ways to use a work and help readers make a practical choice. They are maintained separately, carry their own dates and sources, and are not overwritten when the catalogue refreshes. A work can appear in the complete catalogue before we publish a guide about it.'] },
        { heading: 'What counts as evidence', items: ['Attribute model use to the creator’s public statement or development record. A model name alone is not a performance measurement.', 'Label documentation-based advice as such. A browser spot-check does not establish a full playthrough, multiplayer reliability or mobile performance.', 'Keep factual descriptions separate from editorial suggestions. We do not invent scores, user reviews, download counts or testing experiences.', 'AI tools may assist with drafting, translation and code. Published claims still need identifiable sources or a stated observation; generated prose alone is not evidence.'] },
        { heading: 'Rights belong to the particular work', paragraphs: ['The upstream catalogue describes its own text and visuals as CC0. Linked works have their own terms. A public repository, an unofficial recreation or inclusion in this list does not establish permission to reuse every character, image, sound or trademark.', 'Check the work’s actual licence and the scope of its assets before reuse. We accept reports about inaccurate attribution, unsupported rights claims and problematic links through the contact page. Adding a disclaimer is not a substitute for resolving a substantiated rights issue.'] },
        { heading: 'Corrections and commercial independence', paragraphs: ['Send website and guide corrections to the website repository. Submit new works and changes to catalogue records upstream, so a fix reaches every language and the next automatic refresh. Include the relevant page and evidence of the proposed correction.', 'Astra Games uses Adsterra advertising after visitor consent. Ad placements are labelled and do not determine catalogue inclusion or our editorial conclusions. Sponsored offers open an advertising destination, separate from a work’s demo.'] },
      ],
    },
    'zh-CN': {
      title: '关于 Astra Games 与编辑原则',
      description: '网站由谁维护，自动目录和原创指南如何分工，以及来源、纠错和作品权利如何处理。',
      intro: 'Astra Games 帮助读者发现并理解使用 GPT-6 Astra 创作的游戏、交互实验和创意软件。官网项目在 stackloomdev/astra-games 维护，社区作品目录在 MartinDelophy/awesome-gpt-6-astra 单独维护。收录和指南均不代表 OpenAI 官方背书。',
      sections: [
        { heading: '自动目录与指南，各自承担什么', paragraphs: ['目录跟随公开的上游 README，名称、作者、简介、链接和平台信息均取自该来源，无需官网重新发布即可更新。目录同步时间表示读取资料的时间，不等于试玩或版权核验日期。', '本站指南针对部分作品解释机制、比较使用方式，帮助读者做出具体选择。指南有独立日期和来源，单独维护，上游刷新不会覆盖它。一个作品可以先出现在完整目录中，之后才有详细指南。'] },
        { heading: '内容依据与验证边界', items: ['模型参与应追溯到作者公开声明或创作记录。只有模型名称，不能构成性能测量。', '根据文档整理的内容明确标注；浏览器抽查不能证明完整通关、多人服务稳定或真实手机性能。', '事实描述与编辑建议分开，不编造分数、用户评价、下载量或测试经历。', 'AI 工具可以辅助写作、翻译和代码，但发布的事实仍需可识别的来源或明确观察，生成文字本身不是证据。'] },
        { heading: '权利需要看具体作品', paragraphs: ['上游目录声明其自身文字与视觉素材按 CC0 提供；链接指向的作品另有各自条款。公开仓库、非官方复刻或被本目录收录，都不能证明其中所有角色、图片、声音与商标可以自由复用。', '复用前请核对许可证以及它具体覆盖的素材范围。如发现署名错误、无依据的授权说明或存在问题的链接，可以通过联系页面反馈。有依据的权利问题需要处理，免责声明不能代替整改。'] },
        { heading: '纠错与商业展示', paragraphs: ['官网和指南的问题反馈到官网仓库；新增作品和目录资料修改提交到上游，让修正能进入各语言目录及后续自动同步。反馈时请附相关页面与支持修正的依据。', 'Astra Games 在访客同意后加载 Adsterra 广告。广告位有明确标识，不影响目录收录或编辑结论。赞助商推广链接指向广告页面，与作品试玩入口分开。'] },
      ],
    },
  },
  privacy: {
    en: {
      title: 'Privacy notice',
      description: 'How Astra Games uses hosting, audience statistics and performance measurements, and what happens when you follow an external game link.',
      intro: 'This notice covers astragames.aigccreative.com. It does not describe the separate radar website or the external games and repositories you may visit. Questions about this website can be raised through the contact page.',
      sections: [
        { heading: 'Browsing and hosting', paragraphs: ['Browsing the catalogue does not require an account, email address or payment. Catalogue search and category filtering run in the page; this version does not send the text you type into that search field as a custom analytics event.', 'Vercel hosts and delivers the website. Requests necessarily provide technical information such as an IP address and request headers to the hosting infrastructure; operational or security logs may be processed by the provider. We do not promise that no technical data is processed simply because the site has no login.'] },
        { heading: 'Audience and performance measurement', paragraphs: ['The production website includes Vercel Web Analytics and Speed Insights. They provide visit statistics and loading/interaction measurements. Depending on the service, data can include page URL, referrer, browser/device information, approximate region and timing metrics.', 'Vercel describes these services as using no analytics cookies. This does not mean that loading a page sends no data. Read the linked provider notices for their current processing and storage details. Browser tools that block these measurement requests do not prevent you from using the catalogue.'] },
        { heading: 'External games, images and feedback', paragraphs: ['Opening a demo, creator profile or source repository takes you to a different service with its own privacy rules. We do not control the data it collects, permissions it requests or payments it may offer. Some preview images may also be delivered from the original creator’s host.', 'Feedback submitted on GitHub is handled by GitHub and may be public. Do not include account credentials, government identifiers or private contact details in a public issue.'] },
        { heading: 'Advertising and changes', paragraphs: ['With your permission, Astra Games loads Adsterra native banner, Social Bar and display banner ads on catalogue and work pages. Adsterra and its advertising partners may receive your IP address, page URL/referrer, device/browser information and advertising interactions, and may use cookies or identifiers for ad delivery, measurement and fraud prevention. Sponsored offers are advertising links to external destinations. Read the linked Adsterra privacy and cookie policies for provider details. Your accept/decline choice is stored locally in your browser under astra-ad-consent-v1. Declining prevents these ad scripts from loading and does not restrict access to works. Use Ad settings at any time to change your choice; withdrawing reloads the page to remove loaded scripts, but does not erase data already collected or third-party cookies. You can clear cookies in your browser and contact the provider about data requests. This control is not a certified consent-management platform.', 'We update this notice when the website’s data practices change. The date on this page records this notice’s revision, not a guarantee about external sites. Use the contact page for a privacy concern or a request relating to information you submitted to the maintainers.'] },
      ],
    },
    'zh-CN': {
      title: '隐私政策',
      description: '说明 Astra Games 的托管、访问统计、性能测量，以及打开外部作品链接后的数据处理边界。',
      intro: '本说明适用于 astragames.aigccreative.com，不覆盖独立的雷达主站，也不覆盖你通过本站访问的外部游戏和仓库。有关本站的问题可通过联系页面提出。',
      sections: [
        { heading: '浏览与网站托管', paragraphs: ['浏览目录不需要注册、提供邮箱或付款。目录搜索和分类筛选在页面内执行；本版本不会把你在搜索框输入的文字作为自定义统计事件发送。', '网站由 Vercel 托管和分发。访问请求必然向托管基础设施提供 IP 地址、请求头等技术信息，服务提供方可能处理运行或安全日志。没有登录功能不等于没有技术数据处理。'] },
        { heading: '访问统计与性能测量', paragraphs: ['生产网站包含 Vercel Web Analytics 与 Speed Insights，用来了解访问情况和页面加载、交互性能。根据不同服务，数据可能包含页面网址、来源、浏览器与设备信息、大致地区以及计时指标。', 'Vercel 将这些服务描述为不使用统计 Cookie；这不等于访问页面不会传输数据。当前处理与存储方式见下方服务商说明。使用浏览器工具阻止这些测量请求，不影响浏览目录。'] },
        { heading: '外部作品、图片与反馈', paragraphs: ['打开试玩、作者主页或源码仓库后，你将访问另一个服务，其隐私规则独立适用。本站不控制其数据收集、权限请求或付款功能。部分预览图片也可能由原作者的图片服务提供。', '通过 GitHub 提交的反馈由 GitHub 处理，并可能公开展示。请勿在公开 Issue 中填写账号凭据、身份证件或私人联系方式。'] },
        { heading: '广告与说明更新', paragraphs: ['在你同意后，本站会在目录和作品页加载 Adsterra 原生、Social Bar 和横幅广告。Adsterra 及其广告合作方可能接收 IP 地址、页面网址与来源、设备和浏览器信息、广告交互，并使用 Cookie 或标识符进行广告投放、统计及反欺诈。赞助商推广链接会打开外部广告页面。服务商详情见下方 Adsterra 隐私与 Cookie 政策。接受或拒绝的选择保存在浏览器本地存储 astra-ad-consent-v1 中。拒绝会阻止这些广告脚本加载，不影响浏览作品。你可随时点击“广告设置”修改选择；撤回同意会刷新页面以移除已加载脚本，但不会删除广告方此前收集的数据或第三方 Cookie。可在浏览器中清理 Cookie，并向服务商提出数据请求。本控件不是经认证的同意管理平台。', '网站的数据处理方式变化时，我们会更新此说明。页面日期代表本说明的修订时间，不保证外部网站的行为。隐私疑问或与曾向维护者提交的信息有关的请求，可通过联系页面提出。'] },
      ],
    },
  },
  contact: {
    en: {
      title: 'Contact, corrections & rights reports',
      description: 'Send a website correction, report an unavailable demo or flag an attribution or copyright concern to the right project.',
      intro: 'There are two maintenance queues: this website and the upstream catalogue. Choosing the right one helps a correction reach the place that publishes the information.',
      sections: [
        { heading: 'Website, guide or privacy question', paragraphs: ['Use the website feedback link below for navigation problems, guide corrections or a privacy concern about this site. Include the page URL, the issue and the outcome you are requesting. Browser and device details help reproduce technical failures.', 'GitHub issues are public. Start with a non-sensitive description and ask for an appropriate private contact channel if a matter requires personal information. Do not attach identity documents, credentials or private files.'] },
        { heading: 'Catalogue entry or broken demo', paragraphs: ['Use the upstream feedback link for a wrong creator name, changed demo URL or unavailable work. Provide the title, the original entry and a public source for the correction. The catalogue follows upstream updates automatically; editing only a website guide would not correct the source list.'] },
        { heading: 'Attribution, copyright or other rights concern', paragraphs: ['Identify the affected page and material, explain the relationship between it and the original work, and link to publicly available evidence where possible. A rights holder or representative should state that role without publishing unnecessary personal information.', 'The website repository handles material on this site; the upstream project handles its catalogue record; an external game is hosted by its own operator. A report is a request to assess and correct the issue, not an automatic determination about ownership or infringement.'] },
      ],
    },
    'zh-CN': {
      title: '联系、纠错与权利反馈',
      description: '将官网问题、失效试玩、错误署名或版权疑问反馈到负责维护的项目。',
      intro: '官网与上游作品目录分别维护。选择对应入口，才能让修正进入实际发布信息的位置。',
      sections: [
        { heading: '官网、指南或隐私问题', paragraphs: ['导航故障、指南更正，以及与本站有关的隐私疑问，请使用下方官网反馈入口。请附页面地址、具体问题和希望如何处理；技术故障还可以说明浏览器与设备，便于复现。', 'GitHub Issue 会公开展示。先提供不含敏感信息的描述；如需提供个人资料，请先向维护者询问合适的私密联系渠道。不要上传身份证件、账号凭据或私人文件。'] },
        { heading: '作品资料或试玩失效', paragraphs: ['作者名有误、试玩地址变更或作品无法访问，请使用上游反馈入口，提供作品名称、原条目和支持修正的公开来源。目录会自动跟随上游更新，只修改官网指南并不能修正源目录。'] },
        { heading: '署名、版权或其他权利问题', paragraphs: ['请指出受影响页面与素材，解释它与原作的关系，并尽量提供公开证据链接。权利人或代理人可以说明自己的身份关系，但不要公开无关的个人信息。', '官网仓库处理本站内容，上游项目处理其目录记录，外部游戏由相应运营者托管。反馈意味着请求评估和修正，不自动构成对权属或侵权的认定。'] },
      ],
    },
  },
};

export function isInformationPage(value: string): value is InformationPage {
  return INFORMATION_PAGES.some((entry) => entry === value);
}
