# 发布流程（Release Guide）

本文档讲三件事：
1. 如何一次性准备签名 keystore（本机 + GitHub）
2. 本地如何手动打 release APK
3. 每次发新版本怎么做（推 tag → Actions 自动构建 → 用户端检查更新）

---

## 一、一次性准备

### 1.1 在本机生成 keystore

需要装了 JDK，`keytool` 命令自带。在 **`android/app/`** 目录下执行（`storeFile` 是相对该目录解析的）：

```powershell
cd e:\test\LightGlass\android\app
keytool -genkeypair -v `
  -keystore lightglass.jks `
  -alias lightglass `
  -keyalg RSA -keysize 2048 -validity 36500
```

> 如果 `keytool` 报错或 JVM 配置异常，直接用绝对路径：
> `& "C:\Program Files\Java\jdk-22\bin\keytool.exe" -genkeypair ...`

按提示：
- 输入 keystore 密码（至少 6 位，记牢！）
- 输入姓名 / 组织 / 城市 / 省 / 国家代码（可随意填，国家代码用 `CN`）
- 最后问「是否正确?」输入 **`y`** 确认
- **两次密码：建议 keystore 密码和 key 密码设成一样**（第二次提示 key 密码时直接回车即可）

产物：`android/app/lightglass.jks`（已在 `.gitignore` 中，不会被提交）

> 💡 如果你不小心生成在了别的目录，`Move-Item` 挪到 `android/app/` 下即可。

> ⚠️ **这个文件 + 密码丢了就永远无法更新旧用户的 App**（Android 强制同签名升级）。建议：
> - 用 1Password / Bitwarden / 备忘录保存密码
> - 把 `.jks` 文件上传到私人云盘 / 邮箱给自己留底

### 1.2 本地签名配置

复制样板并填密码：

```powershell
Copy-Item android\keystore.properties.example android\keystore.properties
```

用编辑器打开 `android\keystore.properties`，把 `请填…` 替换成真实密码：

```properties
storeFile=lightglass.jks
storePassword=你的密码
keyAlias=lightglass
keyPassword=你的密码
```

这个文件也被 gitignore，放心。

### 1.3 GitHub Actions 配置 secrets

本地 keystore 要让云端 CI 也能用，得把它编码成 Base64 存到 GitHub Secrets。

在项目根目录执行：

```powershell
# 把 jks 转 base64 字符串（一行）
[Convert]::ToBase64String([IO.File]::ReadAllBytes("android\lightglass.jks")) | Set-Clipboard
```

Base64 字符串已复制到剪贴板。然后去：

**GitHub 仓库 → Settings → Secrets and variables → Actions → New repository secret**

依次添加四个：

| Secret 名 | 值 |
| :-- | :-- |
| `ANDROID_KEYSTORE_BASE64` | 粘贴剪贴板里那串 Base64 |
| `ANDROID_KEYSTORE_PASSWORD` | 你的 keystore 密码 |
| `ANDROID_KEY_ALIAS` | `lightglass` |
| `ANDROID_KEY_PASSWORD` | 你的 key 密码（如果和 keystore 一样就填同一个） |

---

## 二、本地手动打 Release APK

适合快速测试签名是否正确。

```powershell
# 1. 构建 web
npm run build

# 2. 同步到 android
npx cap sync android

# 3. 跑 gradle
cd android
./gradlew assembleRelease
```

产物：
```
android/app/build/outputs/apk/release/app-release.apk
```

验证签名（SHA-1 应当和之后云端构建一致）：

```powershell
keytool -printcert -jarfile android\app\build\outputs\apk\release\app-release.apk
```

---

## 三、发布新版本

整个流程只需要两步：**改版本号 → 推 tag**。

### 3.1 提升版本号

修改两个文件：

**`package.json`**

```diff
-  "version": "0.1.0",
+  "version": "0.2.0",
```

**`android/app/build.gradle`**

```diff
-        versionCode 1
-        versionName "1.0"
+        versionCode 2
+        versionName "0.2.0"
```

> 🔔 `versionCode` **必须**每次递增（整数），否则 Android 拒绝升级。
> `versionName` 和 `package.json` 的 `version` 保持一致。

### 3.2 提交并推 tag

```powershell
git add -A
git commit -m "release: v0.2.0"
git tag v0.2.0
git push
git push origin v0.2.0
```

### 3.3 等 Actions 跑完

- 打开 GitHub 仓库 → **Actions** 页面
- 应能看到一条 `Release Android APK` 正在跑（约 3–5 分钟）
- 跑完后 **Releases** 页面会出现 `v0.2.0`，自动附带 `LightGlass.apk`

### 3.4 用户端自动提示

- **Web / PWA**：设置 → 检查更新 → 会看到 `发现新版本 v0.2.0`
- **APK**：App 内同样可检查更新；点「下载 APK」打开浏览器下载，Android 系统会识别为升级（因为签名一致）

---

## 四、常见问题

### Q: Gradle 报 "keystore was tampered with, or password was incorrect"

密码不对。检查 `android/keystore.properties` 里的 `storePassword` / `keyPassword` 是否和生成时输入的一致。

### Q: Actions 构建失败，说找不到 keystore

- 确认 4 个 Secret 都已在 GitHub 仓库里配置
- 确认 `ANDROID_KEYSTORE_BASE64` 是完整的单行字符串，没被换行打断

### Q: 我要换 keystore 怎么办

**不能换**。如果换了，所有已装用户都要卸载重装（数据会丢）。
只有在初次发布前才能重新生成。

### Q: 版本号不想手动改两个文件

可以在 `android/app/build.gradle` 里读 `package.json`，但配置麻烦容易出错。现阶段手动同步更稳。

### Q: 我只想打包、不想发 release

在 GitHub Actions 页面点「Run workflow」手动触发，不带 tag 的话只产出 artifact，不发 release。
