import type { Work } from './catalog';

// Editorial content is deliberately separate from the live catalogue. A new
// upstream entry never needs a guide to be listed, and sync cannot overwrite one.
export const CONTENT_LOCALES = ['en', 'zh-CN'] as const;
export type ContentLocale = (typeof CONTENT_LOCALES)[number];
export type Localized<T> = Record<ContentLocale, T>;
export type Section = { heading: string; paragraphs?: string[]; items?: string[] };
export type ArticleCopy = { title: string; description: string; intro: string; sections: Section[] };
export type Guide = {
  slug: string;
  published: string;
  kind: Localized<string>;
  basis: Localized<string>;
  works: string[];
  sources: { label: string; href: string }[];
  copy: Localized<ArticleCopy>;
};

export function isContentLocale(locale: string): locale is ContentLocale {
  return CONTENT_LOCALES.some((entry) => entry === locale);
}

export function contentLocale(locale: string): ContentLocale {
  return locale === 'zh-CN' ? 'zh-CN' : 'en';
}

// Match translations by the full demo URL, never a translated title, hash or
// shared repository root. Query parameters may distinguish separate games.
export function workIdentity(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (!['https:', 'http:'].includes(parsed.protocol)) return null;
    return parsed.origin.toLowerCase() + parsed.pathname.replace(/\/+$/, '') + parsed.search + parsed.hash;
  } catch { return null; }
}

export const GUIDES: Guide[] = [
  {
    slug: 'choose-your-first-astra-work',
    published: '2026-09-17',
    kind: { en: 'Field guide', 'zh-CN': '作品选择指南' },
    basis: {
      en: 'An editorial reading guide based on the linked project documentation. This is not a performance benchmark or a rating of every listed work.',
      'zh-CN': '根据下方项目文档整理的选择指南，不是模型性能测试，也不是对目录中全部作品的评分。',
    },
    works: ['https://thunderfall.vercel.app/', 'https://orbital-garden-one.vercel.app/'],
    sources: [
      { label: 'THUNDERFALL · README', href: 'https://github.com/jackroc/awesome-gpt-6-astra/blob/c928251/works/thunderfall/README.md' },
      { label: 'ORBITAL GARDEN · README', href: 'https://github.com/jackroc/awesome-gpt-6-astra/blob/c928251/works/orbital-garden/README.md' },
    ],
    copy: {
      en: {
        title: 'Choose an Astra work by what you want to do',
        description: 'A practical way to compare a scored game, a creative sandbox and an AI development example before you open a demo.',
        intro: 'A striking screenshot tells you very little about what your next five minutes will feel like. Start with the activity you want: work toward a goal, explore a visual system, or inspect how an idea was built. Those are different reasons to open a project, and they need different evidence.',
        sections: [
          { heading: 'For a game session, look for a complete loop', paragraphs: ['A useful description names an action, an obstacle and feedback. In THUNDERFALL you move a fighter, avoid patterned bullets and collect weapon upgrades. Automatic firing leaves your attention on positioning. The campaign links five sectors with upgrade choices; the author documents at least ten minutes of active combat for a full run.', 'That makes a campaign a different commitment from opening a single-stage rehearsal. If you only have a short break, start with practice. Check whether pause, restart and progression work before you invest in a long run. A visible Play button means a demo link is listed, not that every device or every level has been tested by this website.'] },
          { heading: 'For exploration, look for a controllable result', paragraphs: ['ORBITAL GARDEN has no score or winning condition. You choose a particle form, change its motion, rotate the view and export an image. Its useful outcome is a composition you can adjust and keep, rather than a level you complete.', 'Try changing one parameter at a time. Compare the same form at different speeds, then compare different forms at the same speed. That makes the effect of each control easier to understand. The documentation describes an artistic interpretation of gravity, not a scientific simulation; judge it as an interactive artwork.'] },
          { heading: 'For learning, follow the evidence beyond the preview', items: ['Open the source or build notes. Look for run instructions, controls and documented limitations, not just a repository badge.', 'Separate a creator’s model attribution from the process used. A one-shot claim and an iterated, tested project are not comparable measurements.', 'Check the licence of the particular work and its assets. Being listed in an open catalogue does not make a linked game open source.', 'Read the platform requirements. A browser URL does not by itself confirm touch controls, offline use or low-end phone performance.'] },
          { heading: 'A compact first-session check', items: ['Before opening: note the intended platform, login or payment requirements and the original creator.', 'After opening: locate controls, pause, reset and the path back to the catalogue. Use only the permissions the activity actually needs.', 'During use: try the central mechanic first. Distinguish a confusing control from an unavailable feature or a loading failure.', 'Before sharing: describe what you actually tried, on which device, and what remains untested. Report a broken link with its work URL and visible error.'] },
          { heading: 'How this relates to the live catalogue', paragraphs: ['The catalogue remains a complete view of upstream submissions, including prototypes and experiments. These guides add context to selected works; they do not decide whether a new upstream entry appears. A project without a guide is simply a project we have not covered here yet.', 'Choose by the experience you want, then use the creator’s documentation to check the details. Popularity, a polished cover and a model name are useful discovery signals, but none of them replaces trying the actual interaction.'] },
        ],
      },
      'zh-CN': {
        title: '先想玩什么，再选 Astra 作品',
        description: '从目标、操作、时间投入与开发资料入手，区分闯关游戏、交互艺术和可学习的创作案例。',
        intro: '截图能告诉你作品长什么样，却很难告诉你接下来的五分钟会做什么。打开试玩前，先确定自己想完成一个挑战、探索一套视觉系统，还是学习一个点子的实现过程。这三种目标，需要看的信息并不一样。',
        sections: [
          { heading: '想玩一局：先看玩法是否形成闭环', paragraphs: ['有用的游戏介绍应该说清动作、障碍和反馈。以 THUNDERFALL 为例，你移动战机、躲避弹幕、拾取武器升级；自动开火让注意力集中在站位和路线。五关之间还有强化选择，作者文档说明完整战役至少包含十分钟有效战斗。', '因此，开始完整战役和打开单关演练，是两种不同的时间投入。如果只是短暂休息，可以先选演练，再检查暂停、重开和成长过程。目录中的试玩按钮表示提供了演示链接，不代表本站已经在每台设备上测完每一关。'] },
          { heading: '想找灵感：看能否控制并保留结果', paragraphs: ['轨道花园没有分数，也没有胜负条件。你选择粒子形态、改变运动、旋转视角，最后导出一张画面。它提供的是可以调整和收藏的构图，而不是需要完成的关卡。', '体验时一次只改一个参数：先比较同一形态在不同流速下的效果，再固定流速切换形态。这样更容易看出控制项的作用。作者将它定义为艺术化的引力想象，并非科学模拟，适合按交互艺术的标准欣赏。'] },
          { heading: '想学做法：继续追到创作证据', items: ['打开源码或开发资料，找运行步骤、操作说明和已知限制，而不只看有没有 GitHub 图标。', '区分作者对模型的归因与实际开发过程。一次提示生成和多轮实现、测试的作品，不能直接当成同一种测量结果比较。', '检查具体作品及素材的许可证。被开源目录收录，不等于链接指向的游戏也开源。', '核对运行平台。有浏览器地址，不等于支持触屏、离线使用或低配置手机。'] },
          { heading: '第一次体验，可以按这四步检查', items: ['打开前：看平台、登录或付费要求，以及原作者是谁。', '打开后：找到操作、暂停、重置和返回目录的方法，只授予玩法实际需要的权限。', '体验中：先试核心机制，区分操作不熟悉、功能尚未实现和资源加载失败。', '分享前：写清实际尝试过什么、使用什么设备，还有哪些未测试；反馈失效链接时附作品页地址和可见错误。'] },
          { heading: '指南与自动目录各自做什么', paragraphs: ['目录继续完整展示上游收录的作品，包括原型和交互实验。指南为部分作品补充理解和使用方法，不决定新作品能否自动出现；暂时没有指南，只表示本站还没有展开介绍。', '先按想获得的体验来选，再用作者资料核对具体条件。热度、漂亮封面和模型名称可以帮助发现作品，但都不能替代真正尝试其中的交互。'] },
        ],
      },
    },
  },
  {
    slug: 'thunderfall-first-flight',
    published: '2026-09-17',
    kind: { en: 'Play guide', 'zh-CN': '玩法指南' },
    basis: {
      en: 'Based on the creator’s README and published control scheme, checked on 17 September 2026. Advice is editorial interpretation, not a claim of a full playthrough or a device-performance test.',
      'zh-CN': '依据作者 README 与公开操作说明整理，资料核对日期为 2026 年 9 月 17 日。路线建议属于编辑解读，不代表完整通关或实物设备性能测试。',
    },
    works: ['https://thunderfall.vercel.app/'],
    sources: [{ label: 'THUNDERFALL · controls, campaign and licence', href: 'https://github.com/jackroc/awesome-gpt-6-astra/blob/c928251/works/thunderfall/README.md' }],
    copy: {
      en: {
        title: 'THUNDERFALL: plan your first flight',
        description: 'Choose a fighter, read the four weapon pickups and understand when precision movement, bombs and burst are useful.',
        intro: 'THUNDERFALL is an automatic-fire vertical shooter. You do not need to hold a fire button: the decisions are where to move, which pickups to collect and when to spend defensive resources. A useful first objective is to learn those three decisions before chasing a high score.',
        sections: [
          { heading: 'Choose a mode and a manageable commitment', paragraphs: ['The documented campaign has five sectors and at least 120 seconds of active combat per sector. Menus, pauses and upgrade selections do not count toward that time. Allow at least ten active minutes for a complete campaign; a slower boss fight can take longer.', 'Single-stage rehearsal is available and does not count toward the campaign high score. It is the better place to learn a control scheme. Standard mode has an emergency bomb safeguard under specific low-health conditions; Arcade increases bullet speed and boss durability and requires manual bombs.'] },
          { heading: 'Pick a fighter for the decision you want to practise', items: ['Falcon / 鹰隼: the fast, balanced option. Use it to learn movement routes; its speed makes large corrections possible, but small corrections still need care.', 'Prism / 棱镜: lighter protection in exchange for higher damage, with a laser from the start. Choose it when you want to practise staying aligned with targets.', 'Bastion / 堡垒: more armour, shielding and an extra bomb. Its additional defensive resources give you more opportunities to practise recovery.'] },
          { heading: 'Keep the control map within reach', items: ['Move with WASD, arrow keys or a mouse drag. On touchscreens, press and drag in the battlefield; dragging uses relative motion rather than teleporting the fighter to your finger.', 'Hold Shift for precision movement, or toggle the on-screen precision control. This is useful for small corrections between closely spaced bullets.', 'Space uses a shock bomb; E starts Thunder Burst when charge is full. The interface also provides touch buttons.', 'P or Escape pauses. Losing window focus also pauses the game; return and choose Continue when ready.'] },
          { heading: 'Read pickups by their letter, not just their colour', items: ['P · blue: spreading pulse shots cover separated enemies.', 'L · green: a penetrating laser can reach targets lined up behind each other.', 'A · purple: seeking shots turn toward enemies.', 'N · gold: an explosive shot produces area damage.'] },
          { heading: 'A pickup is an opportunity, not an instruction', paragraphs: ['According to the author, matching pickups upgrade a weapon up to level five; switching weapons preserves the levels already earned. Pickups drift and last roughly ten seconds of active combat. That gives you a window to judge a route instead of immediately crossing a dangerous pattern.', 'The small light at the fighter’s centre is the hit core. Practise watching that point while making short movements. A spread weapon favours coverage, while a penetrating weapon rewards alignment. Choose the weapon that fits the situation instead of treating every new colour as an upgrade.'] },
          { heading: 'Separate an escape tool from a damage window', paragraphs: ['A shock bomb clears hostile bullets and lasers, damages enemies and provides brief invulnerability. Thunder Burst lasts eight seconds and clears bullets when it starts, but newly arriving bullets still need to be avoided. Using Burst is therefore not permission to stop moving.', 'Bosses have arrival protection and phase barriers. A burst during a protected phase can waste its useful damage window. Read the warning and barrier states, then attack when the boss is vulnerable. This is a mechanic-based suggestion, not a verified optimal route.'] },
          { heading: 'What the guide does not establish', paragraphs: ['The creator documents browser and touch controls, procedural graphics, synthesized sound and a CC0 licence for the original work. Those statements describe this project; they do not grant rights to unrelated games or brands.', 'This guide has not measured phone frame rates or reproduced a full human campaign clear. Use the linked source for the exact implementation and the demo for the current playable build. Report a mismatch when a later update changes a control or rule.'] },
        ],
      },
      'zh-CN': {
        title: 'THUNDERFALL：第一局怎么选机、走位与换装',
        description: '看懂三架战机、四色补给和两种技能，用单关演练熟悉操作，再进入完整战役。',
        intro: '雷霆战机采用自动开火，你不需要持续按住射击键。真正需要判断的是去哪里、捡什么，以及什么时候消耗防御资源。第一次体验，可以先把这三件事弄清楚，再追求最高分。',
        sections: [
          { heading: '先确定这一局要投入多久', paragraphs: ['作者文档写明，完整战役包含五关，每关至少一百二十秒有效战斗。选机、暂停和关间强化不计时，因此完整流程至少需要十分钟实际战斗；首领战较慢还会更长。', '单关演练不会计入完整战役最高分，适合先熟悉操作。标准模式在特定低血量条件下提供自动炸弹保护；街机模式提高弹速与首领耐久，需要手动使用炸弹。'] },
          { heading: '按想练的能力选择战机', items: ['鹰隼：速度快、能力均衡，适合熟悉移动路线。大幅调整位置比较方便，但通过窄缝仍需要控制幅度。', '棱镜：保护较少，换取更高伤害，并自带激光。适合练习把机体与目标保持在同一攻击线上。', '堡垒：更厚装甲、护盾和额外炸弹，提供更多处理失误和练习脱困的机会。'] },
          { heading: '把操作表放在手边', items: ['移动：WASD、方向键或鼠标拖动；触屏在战场按住拖动。拖动采用相对位移，飞机不会在按下时直接跳到手指位置。', '精密移动：按住 Shift，或切换界面中的精密移动按钮，用于密集弹幕间的小幅修正。', '技能：空格释放震荡炸弹，E 在满充能时启动雷霆爆发；手机可使用对应按钮。', '暂停：P、Esc 或暂停按钮；窗口失焦也会暂停，回来后主动继续。'] },
          { heading: '识别补给时，同时看字母和颜色', items: ['蓝色 P：扇形脉冲散射，适合覆盖分散的敌机。', '绿色 L：穿透光束，适合处理前后排列的目标。', '紫色 A：转向追踪弹，帮助覆盖不在正前方的敌人。', '金色 N：爆裂产生范围伤害，适合观察敌群聚集时的效果。'] },
          { heading: '补给是机会，不是必须立刻执行的指令', paragraphs: ['作者说明，同款补给可将武器升至五级，切换武器会保留已经获得的等级。补给会漂移，并在大约十秒有效战斗后消失，这段时间可以先判断路线，不必看到新颜色就横穿危险弹幕。', '机体中心的小光点才是受击核心。建议先练习注视这个点，配合短距离移动。散射强调覆盖，穿透强调对齐；根据眼前敌人的位置选武器，比把每次换色都理解为变强更有帮助。'] },
          { heading: '区分脱困技能和输出窗口', paragraphs: ['震荡炸弹能清除敌弹与激光、伤害敌人并提供短暂无敌。雷霆爆发持续八秒，只在启动时清弹；之后出现的弹幕仍然需要躲避，所以开启爆发并不等于可以停止移动。', '首领有入场保护和阶段屏障，在保护期间释放爆发可能浪费输出时间。观察预警与屏障状态，再选择可受伤时段进攻。这是根据机制提出的建议，并非经过竞速验证的最优路线。'] },
          { heading: '这份指南没有证明什么', paragraphs: ['作者公开说明了触屏与浏览器操作、程序绘制画面、合成声音和原创内容的 CC0 许可。这些说明仅适用于本项目，不能推导为其他游戏或品牌的授权。', '本指南没有测量真实手机帧率，也不声称完成过整场真人通关。具体实现以链接中的源码为依据，当前可玩版本以演示页为准；如果后续版本改动操作或规则，欢迎反馈差异。'] },
        ],
      },
    },
  },
  {
    slug: 'orbital-garden-compose-and-capture',
    published: '2026-09-17',
    kind: { en: 'Creative walkthrough', 'zh-CN': '交互创作指南' },
    basis: {
      en: 'Source documentation checked on 17 September 2026; form switching and pause were also spot-checked in a desktop browser. Export specifications come from the documentation, not a print-quality test.',
      'zh-CN': '2026 年 9 月 17 日核对作者文档，并在桌面浏览器抽查了形态切换与暂停。导出规格来自文档，不代表印刷质量测试。',
    },
    works: ['https://orbital-garden-one.vercel.app/'],
    sources: [{ label: 'ORBITAL GARDEN · controls, export and licence', href: 'https://github.com/jackroc/awesome-gpt-6-astra/blob/c928251/works/orbital-garden/README.md' }],
    copy: {
      en: {
        title: 'Orbital Garden: compose a frame you want to keep',
        description: 'Use form, viewpoint, motion and pause as separate creative controls in this particle-art sandbox.',
        intro: 'Orbital Garden is a small composition instrument: a particle sculpture, a viewpoint and a few controls for motion. There is no correct answer or score. Instead of rapidly trying every button, use a repeatable sequence to discover which changes make a composition clearer.',
        sections: [
          { heading: 'Start with a form, then give it time to settle', paragraphs: ['The three forms are a flower, a gravity ring and a spiral galaxy. Their particles move continuously between shapes. Choose one form and observe its silhouette before switching again; repeated switching is interesting, but makes comparisons harder.', 'The number keys 1, 2 and 3 select forms. You can also use the labelled buttons. The sculpture is an artistic system, not a physically accurate model of an orbit or fluid.'] },
          { heading: 'Change the viewpoint before changing the artwork', paragraphs: ['Drag the sculpture to rotate it. A small rotation may separate overlapping structures more effectively than a large change in animation speed. If the framing becomes confusing, use Reset view or R to return to the starting angle.', 'On touchscreens, the documented interaction keeps vertical page scrolling available and uses horizontal dragging for rotation. The keyboard alternative is to focus the canvas and use the arrow keys. Actual comfort and performance still depend on the device.'] },
          { heading: 'Treat vitality and speed as different controls', paragraphs: ['Vitality changes the breathing motion and light intensity. Time speed changes how quickly the system evolves, over a documented range from zero to twice the normal rate. Lower speed gives you more time to inspect a transitional shape; it is not the same as reducing particle count or image quality.', 'Try a sequence: choose a form, rotate a little, lower speed, then adjust vitality. Keep one setting stable while changing another. That produces a comparison you can explain rather than a result you cannot reproduce.'] },
          { heading: 'Use disruption, then pause with intention', paragraphs: ['Release gravity, double-click the sculpture or press B to disturb the particles. They disperse and regroup. You can observe the whole cycle or pause partway through it to study the temporary structure.', 'Pause stops motion, while the project documentation says view rotation, form selection and export remain available. Our desktop spot-check confirmed that changing a form updates the selected control and that Pause changes to Continue. Pausing during a transition can freeze an intermediate shape rather than the final silhouette.'] },
          { heading: 'Capture the composition, not the browser window', paragraphs: ['The “Capture this moment” control, labelled “收藏这一瞬” in the demo, exports a poster. The documented output is a 2000 × 2400 PNG with the form, UTC timestamp and parameter information. It is a purpose-built image rather than a screenshot of the surrounding page.', 'Make a calm composition first, export it, then change one parameter and compare another version. If download does not start, check the browser’s download permission or visible error before repeatedly pressing the button.'] },
          { heading: 'Sound, accessibility and reuse', paragraphs: ['Sound is optional and begins after a user interaction; the artwork remains usable without it. The project also documents a reduced-motion mode and a WebGL requirement. A missing WebGL context is an environment limitation, not evidence that the piece is a static image.', 'The original code, text and generated visuals are offered under CC0 in the linked repository. That can make this particular work useful for studying procedural artwork and its controls. It does not extend permission to third-party media you might combine with an exported image.'] },
        ],
      },
      'zh-CN': {
        title: '轨道花园：把一段粒子运动变成想收藏的画面',
        description: '把形态、视角、流速与暂停分开调整，在没有分数的交互艺术中找到自己的构图。',
        intro: '轨道花园可以看成一个小型构图工具：一件粒子雕塑、一个观察视角，以及几项运动控制。这里没有正确答案和分数。与其快速点遍所有按钮，不如用一套可以重复的顺序，观察每次调整究竟改变了什么。',
        sections: [
          { heading: '先选一种形态，给它一点变化时间', paragraphs: ['作品提供星之花、引力环和旋涡星系三种形态，粒子会连续移动到新的位置。先选一种，观察轮廓再切换；连续切换也有趣，但不容易比较两种形态的区别。', '数字键 1、2、3 可以切换，也可以点击带名称的按钮。这里的引力属于艺术表达，不是对真实轨道或流体的物理模拟。'] },
          { heading: '先改变看法，再改变画面本身', paragraphs: ['拖动雕塑可以旋转视角。有时只转动一点，就能把重叠的结构分开，不需要大幅调整动画。找不到合适角度时，点击重置视角或按 R，回到初始位置。', '作者说明，触屏操作保留纵向页面滚动，横向拖动用于旋转；键盘用户可聚焦画布后使用方向键。实际操作舒适度与性能仍取决于设备。'] },
          { heading: '生命力和时间流速，分开理解', paragraphs: ['生命力影响呼吸起伏与光点亮度；时间流速影响系统变化的速度，文档给出的范围是零到正常速度的两倍。降低流速是为了更从容地看变化，不等于减少粒子数量或降低画质。', '可以按这个顺序尝试：选形态，微调视角，放慢流速，再改生命力。每次固定其他参数，更容易解释画面为何变化，也便于回到刚才喜欢的状态。'] },
          { heading: '先扰动，再有意识地暂停', paragraphs: ['点击释放引力、双击雕塑或按 B，可以让粒子散开再聚拢。你可以看完整个过程，也可以在中间暂停，观察暂时形成的结构。', '文档说明暂停后仍可旋转、换形和导出。此次桌面浏览器抽查确认，切换形态会更新选中状态，暂停按钮会变为继续；在切换过程中立即暂停，可能停在过渡形态，而不是最终轮廓。'] },
          { heading: '收藏构图，而不是截下整个浏览器', paragraphs: ['演示页的“收藏这一瞬”用于导出海报。作者文档给出的规格是 2000 × 2400 PNG，包含形态、UTC 时间与参数信息；它不是把页面文字和按钮一起截进去的普通截图。', '先做一张稳定构图，再只改一个参数导出另一版，可以更清楚地比较。如果下载没有开始，先检查浏览器下载权限或可见错误，避免连续点击造成重复文件。'] },
          { heading: '声音、可访问性与复用', paragraphs: ['声音是可选的，需要用户交互后启动，静音不影响视觉操作。项目还提供减少动态效果的支持，并要求浏览器能够使用 WebGL；缺少 WebGL 上下文，不代表作品本来就是静态图。', '链接中的仓库将原创代码、文案和生成画面按 CC0 提供，适合研究程序艺术和控制方式。这个许可不自动覆盖你之后与导出图组合使用的第三方素材。'] },
        ],
      },
    },
  },
];

export function findGuide(slug: string): Guide | undefined {
  return GUIDES.find((guide) => guide.slug === slug);
}

export function guidesForWork(work: Pick<Work, 'demoUrl'>): Guide[] {
  const key = workIdentity(work.demoUrl);
  if (!key) return [];
  return GUIDES.filter((guide) => guide.works.some((url) => workIdentity(url) === key));
}
