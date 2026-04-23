# LightGlass · 轻玻璃

一款用 **iOS 26 液态玻璃** 美学打造的极简生活应用，内置：

- 📝 **随手记** —— 快速记下此刻
- 🗓️ **二十四节气** —— 自动计算与提醒
- 🕰️ **光锥时钟** —— 闵可夫斯基光锥视觉化的时钟
- 🍅 **番茄时钟** —— 25 + 5 的专注节奏
- 🌓 **黑白主题平滑切换** —— 基于 View Transitions API 的圆形扩散动画

## 技术栈

- **React 18 + Vite + TypeScript**
- **TailwindCSS** · 原生 CSS 实现液态玻璃效果
- **Supabase**（可选）· 登录注册 + 数据云同步
- **lucide-react** 图标

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 本地预览构建结果
npm run preview
```

### 两种运行模式

| 模式 | 条件 | 登录行为 | 数据 |
|---|---|---|---|
| **本地模式** | 未配置 Supabase 环境变量 | ⚠️ **任何邮箱+任意6位密码都能进**（无真实鉴权，只为演示） | 仅本机 `localStorage` |
| **云同步模式** | 配置了 `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` | 必须注册 → 邮箱验证 → 登录 | Supabase Postgres，多设备同步 |

> **生产部署务必使用云同步模式**，否则任何人都可以访问，且每个人只看到自己本地的数据（互不相通），体验会很怪。

## 启用 Supabase 云同步（邮箱密码）

### 1. 创建 Supabase 项目
- 访问 [supabase.com](https://supabase.com) → 免费注册 → `New Project`
- 选择区域（建议 **Singapore** 对国内友好）
- 设置数据库密码并等待 1-2 分钟初始化

### 2. 建表
- 打开 **SQL Editor** → `New query`
- 复制粘贴 `supabase/schema.sql` 的全部内容 → `Run`

### 3. 配置邮箱认证（默认就是开的，你只需要确认）
- 左侧菜单 **Authentication → Providers**
- `Email` 保持启用，**GitHub / Google 等全部保持禁用**即可

### 4. 获取连接信息

Supabase 2024 底改版后有两种方法，任选其一：

**方法 A（最快）：顶部 `Connect` 按钮**
- 项目任意页面顶部有 **`Connect`** 按钮 → 点开 → 选 **App Frameworks** 标签 → 框架选 **Vite** / **React**
- 直接显示完整的 `VITE_SUPABASE_URL=...` 和 `VITE_SUPABASE_ANON_KEY=...`，整段复制即可

**方法 B：设置页手动找**
- 左下 ⚙️ `Project Settings` → 左菜单 **Data API** → 顶部就是 `Project URL`
- 再到左菜单 **API Keys** → 复制带 `anon` / `public` 或 `Publishable key` 标签的那一个
- **千万别用 `service_role` / `secret key`**，那是后端专用会泄露数据库全部权限

> 新项目如果只看到 `sb_publishable_...` 开头的 key 也没关系，它就是新版 anon key，代码完全兼容，照样填进 `VITE_SUPABASE_ANON_KEY`。

### 5. 本地测试
复制 `.env.example` 为 `.env.local`：
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```
`npm run dev` → 登录页上方的"本地模式"黄色提示应该消失 → 用真实邮箱注册 → 查收验证邮件 → 点链接激活 → 回应用登录。

## 部署到帽子云

[帽子云](https://maoziyun.com/) 是国内静态站点托管平台，免备案、深度集成 GitHub。

### 1. 推送代码到 GitHub
```bash
git init
git add .
git commit -m "init: LightGlass"
git branch -M main
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git push -u origin main
```

### 2. 帽子云配置
- 登录帽子云 → 新建项目 → 授权 GitHub → 选择本仓库
- **Framework**：`Vite / React`（自动识别即可）
- **Build Command**：`npm run build`
- **Output Directory**：`dist`
- **Node 版本**：18 或 20

### 3. ⚠️ 关键：填环境变量
在帽子云项目设置的 **环境变量** 栏添加：
```
VITE_SUPABASE_URL       = https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY  = eyJhbGciOi...
```
没填这两个，部署后就是"本地模式"，**任意邮箱都能登录**（不安全）。

### 4. 让 Supabase 认识你的域名
部署成功后，帽子云会给你一个类似 `xxx.maocloud.cn` 的域名：
- 回 Supabase → **Authentication → URL Configuration**
- `Site URL` 填上这个域名
- `Redirect URLs` 也加一条同样的

没做这步的话，邮件验证链接会跳到本地 localhost。

### 5. 触发部署
之后每次 `git push`，帽子云会自动拉取代码并重新构建上线。

## 目录结构

```
src/
├─ components/        液态玻璃组件 (GlassCard, GlassButton, ThemeToggle)
├─ contexts/          React Context (Theme, Auth)
├─ layouts/           AppShell 主壳
├─ lib/               solarTerms 节气算法、supabase 客户端、storage 存储
├─ pages/             各功能页面
├─ App.tsx            路由根
├─ main.tsx           入口
└─ index.css          全局样式 + Tailwind
```

## 浏览器兼容性

- **Chrome/Edge 111+**、**Safari 18+**：完整体验（含 View Transitions 圆形扩散动画）
- **Firefox**：主题切换自动降级为普通过渡，其它功能正常
- **低端移动设备**：`backdrop-filter` 开销较大，考虑在低端机减少模糊强度

## 许可

MIT
