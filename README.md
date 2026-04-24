<div align="center">

# ✨ LightGlass · 轻玻璃

**一款以 iOS 26 「液态玻璃」美学打造的极简生活 Web / Android 应用。**

<p>
  <img alt="React" src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white">
  <img alt="TailwindCSS" src="https://img.shields.io/badge/Tailwind-3-38BDF8?logo=tailwindcss&logoColor=white">
  <img alt="Capacitor" src="https://img.shields.io/badge/Capacitor-7-119EFF?logo=capacitor&logoColor=white">
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-optional-3ECF8E?logo=supabase&logoColor=white">
  <img alt="License" src="https://img.shields.io/badge/license-MIT-blue">
  <img alt="PWA" src="https://img.shields.io/badge/PWA-ready-5A0FC8">
</p>

随手记 · 节气 · 光锥时钟 · 番茄钟 · 全局墙纸 · 内置 DeepSeek AI 助手 —— 全部玻璃化呈现。

</div>

---

## 📖 目录

- [亮点一览](#-亮点一览)
- [功能模块](#-功能模块)
- [技术栈](#-技术栈)
- [快速开始](#-快速开始)
- [运行模式](#-运行模式)
- [Supabase 云同步](#-supabase-云同步可选)
- [DeepSeek AI 助手](#-deepseek-ai-助手)
- [Android 打包](#-android-打包capacitor)
- [部署到帽子云](#-部署到帽子云)
- [目录结构](#-目录结构)
- [浏览器兼容性](#-浏览器兼容性)
- [Roadmap](#-roadmap)
- [License](#-license)

---

## ✨ 亮点一览

- 🫧 **原生 CSS 实现的液态玻璃**：折射高光、底部阴影、可切换 4 种玻璃风格
- 🎨 **主题圆形扩散**：基于 [View Transitions API](https://developer.chrome.com/docs/web-platform/view-transitions/) 从点击位置晕染明暗切换
- 🖼️ **全局自定义墙纸**：上传图片作为整个 App 的背景层，自适应宽高比 + 大圆角预览
- 🤖 **DeepSeek AI 助手**：灵动岛式悬浮按钮，SSE 流式输出、历史持久化、Markdown 渲染、跨页触发
- 📱 **同一份代码多平台**：Web / PWA / Android APK，通过 Capacitor 打包
- ☁️ **可选云同步**：Supabase Auth + Postgres 多设备同步；不配置则自动降级为纯本地模式

---

## 🧩 功能模块

| 模块 | 说明 |
| :-- | :-- |
| 📝 **随手记** | 纸条式玻璃卡片，置顶 / 删除 / AI 润色 · 翻译 · 总结 · 展开 |
| 🗓️ **二十四节气** | 本地算法计算当前与下一节气，附三候与习俗提醒 |
| 🕰️ **光锥时钟** | 闵可夫斯基光锥可视化 + 大数字时间 |
| 🍅 **番茄时钟** | 专注 / 休息循环，后台也计时，AI 小建议，通知权限 |
| 🖼️ **墙纸** | 上传本地图片作为全局背景，自动保存 |
| 🤖 **AI 对话** | 灵动岛式 FAB，DeepSeek 流式、持久化、快捷提示词、Markdown |
| ⚙️ **设置** | 主题模式、玻璃风格、强调色 / 背景色、头像昵称、API Key |

---

## 🛠 技术栈

| 层 | 选择 |
| :-- | :-- |
| UI 框架 | **React 18** + **TypeScript** |
| 构建 | **Vite 5** · `vite-plugin-pwa` 生成 Service Worker |
| 样式 | **TailwindCSS 3** + 原生 CSS（液态玻璃） |
| 图标 | **lucide-react** |
| 路由 | **react-router-dom v6**（HashRouter，APK 友好） |
| 状态 | React Context（Theme / Auth / Profile / Wallpaper / Pomodoro） |
| 后端（可选） | **Supabase** Auth + Postgres |
| AI | **DeepSeek** Chat API（OpenAI 兼容 SSE） |
| 移动端 | **Capacitor 7**（Android WebView 壳） |
| Markdown | `react-markdown` + `remark-gfm` |

---

## 🚀 快速开始

```bash
# 克隆
git clone https://github.com/<your-username>/LightGlass.git
cd LightGlass

# 安装依赖
npm install

# 本地开发
npm run dev          # http://localhost:5173

# 生产构建
npm run build

# 本地预览构建产物
npm run preview
```

> **Node 18+** 推荐。Windows / macOS / Linux 均可。

---

## 🔐 运行模式

App 根据有没有配置 Supabase 自动切换：

| 模式 | 触发条件 | 登录行为 | 数据落点 |
| :-- | :-- | :-- | :-- |
| **本地模式** | 未配置 Supabase 环境变量 | ⚠️ 任意邮箱 + 任意 6 位密码都能进（仅演示） | 本机 `localStorage` |
| **云同步模式** | 配置了 `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` | 必须注册 → 邮箱验证 → 登录 | Supabase Postgres，多设备同步 |

> 📌 **生产环境必须使用云同步模式**。否则任何人都能登录，且每个人只看到自己本地数据，体验会很怪。

---

## ☁️ Supabase 云同步（可选）

<details>
<summary><b>点击展开完整步骤</b></summary>

### 1. 创建项目

- 访问 [supabase.com](https://supabase.com) → 免费注册 → `New Project`
- 区域推荐 **Singapore**（国内访问较友好）
- 设置数据库密码 → 等待 1–2 分钟初始化

### 2. 建表

- 打开 **SQL Editor** → `New query`
- 粘贴 [`supabase/schema.sql`](./supabase/schema.sql) 全部内容 → `Run`

### 3. 确认邮箱认证已启用

- **Authentication → Providers**
- `Email` 保持启用；第三方登录保持关闭即可

### 4. 获取连接信息

**方法 A（推荐）**

- 任意页面顶部的 **`Connect`** 按钮 → **App Frameworks** 标签 → 框架选 **Vite / React**
- 会直接显示完整的 `VITE_SUPABASE_URL` 与 `VITE_SUPABASE_ANON_KEY`，整段复制

**方法 B**

- ⚙️ `Project Settings` → **Data API**：复制 `Project URL`
- **API Keys**：复制带 `anon` / `public` / `Publishable` 标签的那一个
- ⛔ **绝对不要用 `service_role` / secret key**（会泄露整库权限）

> 新项目如果只看到 `sb_publishable_...` 开头的 key，那就是新版 anon key，代码兼容，照填 `VITE_SUPABASE_ANON_KEY` 即可。

### 5. 本地启用

复制 `.env.example` → `.env.local`：

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

`npm run dev` 后登录页"本地模式"黄色提示应当消失，即可用真实邮箱注册。

</details>

---

## 🤖 DeepSeek AI 助手

LightGlass 内置了一个**灵动岛式**的 AI 对话窗口，固定在底部导航栏右侧，随时唤起。

### 配置 API Key

1. 前往 [platform.deepseek.com](https://platform.deepseek.com) → `API keys` → 创建 key（`sk-` 开头）
2. 打开 App → **设置 → AI 对话** → 粘贴 key → 保存
3. key 只保存在**当前浏览器的 `localStorage`**，不会上传到任何服务器

> 💡 App 不内置默认 key。没配置时 AI 对话按钮仍可见，但会弹出友好的"去设置填 Key"引导页。

### AI 能力矩阵

| 特性 | 说明 |
| :-- | :-- |
| 🌊 **流式输出** | DeepSeek SSE 逐 token 返回，UI 像打字机一样展示 |
| 💾 **对话持久化** | 本地 `localStorage`，最多保留 50 条，刷新/重开不丢失 |
| 🎯 **快捷提示词** | 空态直接点：今天做什么 / 翻译 / 润色 / 写邮件 |
| ✍️ **Markdown 渲染** | 加粗、列表、代码块、表格、引用、链接均支持（GFM） |
| ⏹️ **可中断** | 生成期间发送按钮变为红色停止键，`AbortController` 立刻结束流 |
| 📝 **随手记 AI 动作** | 任意笔记右下角 ✨ → 润色 / 翻译 / 总结 / 展开 自动发送到聊天 |
| 🍅 **番茄钟小建议** | 完成番茄或专注失败时，一键向 AI 求鼓励 / 建议 |
| 🔌 **跨页触发 API** | `openChatWithPrompt(prompt, autoSend)` 自定义事件接入任意组件 |

```ts
// src/lib/deepseek.ts
import { openChatWithPrompt } from '@/lib/deepseek'

// 任何组件都可以一行触发 AI 对话
openChatWithPrompt('帮我想一个周末的 3 日行程', true) // autoSend = true
```

---

## 📱 Android 打包（Capacitor）

<details>
<summary><b>点击展开打包步骤</b></summary>

```bash
# 初次：Android Studio 已安装 + 配置 ANDROID_HOME
npm run build
npx cap sync android
npx cap open android     # 在 Android Studio 中打开
```

在 Android Studio 里 **Build → Build Bundle(s) / APK(s) → Build APK(s)** 即可产出 `.apk`。

> APK 内部通过 WebView 加载 `file:///android_asset/public/index.html`，使用 `HashRouter` 避免路径问题；底部导航 / AI FAB 均兼容系统手势区。

</details>

---

## 🌐 部署到帽子云

<details>
<summary><b>点击展开部署步骤</b></summary>

[帽子云](https://maoziyun.com/) 是国内静态站点托管平台，免备案、深度集成 GitHub。

### 1. 推送到 GitHub

```bash
git init
git add .
git commit -m "init: LightGlass"
git branch -M main
git remote add origin https://github.com/<user>/<repo>.git
git push -u origin main
```

### 2. 帽子云项目设置

| 项 | 值 |
| :-- | :-- |
| Framework | `Vite / React`（自动识别） |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Node 版本 | `18` 或 `20` |

### 3. ⚠️ 填环境变量

在项目 **环境变量** 中添加：

```
VITE_SUPABASE_URL       = https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY  = eyJhbGciOi...
```

未填则部署出来仍是本地模式，**任意邮箱可登录，不安全**。

### 4. 让 Supabase 认识你的域名

- 部署后会拿到类似 `xxx.maocloud.cn` 的域名
- 回 Supabase → **Authentication → URL Configuration**
  - `Site URL` 填这个域名
  - `Redirect URLs` 同样加一条

否则邮件验证链接会跳到本地 `localhost`。

### 5. 持续部署

之后每次 `git push`，帽子云自动拉代码构建上线。

</details>

---

## 📂 目录结构

```
LightGlass/
├─ android/                    Capacitor Android 壳
├─ public/                     静态资源 + PWA manifest
├─ src/
│  ├─ components/              液态玻璃组件（GlassCard / Button / Avatar / ChatFab ...）
│  ├─ contexts/                Theme · Auth · Profile · Wallpaper · Pomodoro
│  ├─ layouts/
│  │  └─ AppShell.tsx          主壳 + 底部灵动岛导航 + ChatFab
│  ├─ lib/
│  │  ├─ solarTerms.ts         二十四节气本地计算
│  │  ├─ supabase.ts           云端客户端（可为 null）
│  │  ├─ storage.ts            本地 / 云端统一存储抽象
│  │  └─ deepseek.ts           DeepSeek chat（普通 + 流式 + 跨页事件）
│  ├─ pages/                   HomePage / NotesPage / ClockPage / ...
│  ├─ App.tsx                  路由根
│  ├─ main.tsx                 入口
│  └─ index.css                全局 CSS + Tailwind + 液态玻璃 + Markdown
├─ supabase/
│  └─ schema.sql               云同步表结构
└─ package.json
```

---

## 🌍 浏览器兼容性

| 浏览器 | 体验 |
| :-- | :-- |
| Chrome / Edge **111+** | ✅ 完整：圆形扩散主题切换 + 液态玻璃 + PWA |
| Safari **18+**（macOS / iOS） | ✅ 完整，`-webkit-backdrop-filter` 已兼容 |
| Firefox | ⚠️ 主题切换降级为普通过渡，其它功能正常 |
| 低端安卓机 | ⚠️ `backdrop-filter` 开销较大，建议减少模糊强度 |

---

## 🗺 Roadmap

- [x] 液态玻璃基础组件与主题
- [x] 随手记 + 云同步
- [x] 二十四节气 / 光锥时钟 / 番茄钟
- [x] 全局墙纸
- [x] Android APK（Capacitor）
- [x] DeepSeek AI 对话（流式 / 持久化 / Markdown）
- [x] 各页面 AI 快捷动作
- [ ] AI 对话对单条笔记做二次编辑（润色后一键替换原文）
- [ ] 锁屏小组件（Android widget / iOS WidgetKit）
- [ ] 多会话管理

---

## 📜 License

[MIT](./LICENSE) © LightGlass Contributors

<div align="center">

用玻璃承载日常 · _made with ☕ and a lot of `backdrop-filter`_

</div>
