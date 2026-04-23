---
description: 部署 LightGlass 到帽子云
---

1. 确保本地构建通过
// turbo
```
npm run build
```

2. 提交并推送代码到 GitHub
```
git add .
git commit -m "chore: deploy"
git push origin main
```

3. 打开帽子云控制台确认自动构建流水线已触发
4. 部署完成后，打开分配的域名验证：
   - 登录页可访问
   - 主题切换流畅
   - 若启用 Supabase，能正常注册登录并同步数据
