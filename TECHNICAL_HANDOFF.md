# HelloCarCar 首页技术交付说明

## 项目内容

本压缩包包含 HelloCarCar 多语言展示首页的完整源码，支持中文、英文、法语和阿拉伯语，并包含首页动态背景、功能预览、车型配置、车辆报价、海运运价、企业调查报告、交付纠纷及政策资讯等展示模块。

## 本地运行

环境要求：Node.js 20 或更高版本、pnpm 11。

```bash
pnpm install --frozen-lockfile
pnpm --filter @hellocarcar/ui build
pnpm --filter @hellocarcar/contracts build
pnpm --filter @hellocarcar/web dev
```

浏览器打开 `http://localhost:4173`。

## 生产构建

```bash
pnpm install --frozen-lockfile
pnpm --filter @hellocarcar/ui build
pnpm --filter @hellocarcar/contracts build
pnpm --filter @hellocarcar/web build
```

启动生产版本：

```bash
pnpm --filter @hellocarcar/web start
```

## Vercel 部署设置

- Framework Preset：Next.js
- Root Directory：仓库根目录
- Install Command：`pnpm install --frozen-lockfile`
- Build Command：`pnpm --filter @hellocarcar/ui build && pnpm --filter @hellocarcar/contracts build && pnpm --filter @hellocarcar/web build`
- Output Directory：保持为空，由 Next.js 自动识别
- Node.js：20.x 或更高版本

当前生产地址：<https://hellocarcar.vercel.app>

GitHub 仓库：<https://github.com/nn554/hellocarcar>

## 主要目录

- `apps/web`：首页与 Web 页面
- `apps/api`：API 服务
- `apps/admin`：管理端
- `packages/ui`：共享 UI 组件
- `packages/contracts`：共享类型与接口约定
- `assets`：设计与图片资源
- `scripts`：项目辅助脚本

压缩包已排除 `.git`、`node_modules`、构建缓存以及本地环境变量，不包含账号密码或部署令牌。
