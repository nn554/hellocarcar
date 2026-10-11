# HelloCarCar

HelloCarCar 是面向海外采购商的中国汽车采购决策平台。阿尔及利亚是首个启用市场，底层按多国家隔离设计；伊朗目前只提供计划状态，不复用阿尔及利亚政策或供应商结论。

## Workspace

- `apps/web`: Next.js 多语言客户站，支持 Arabic/Persian RTL。
- `apps/admin`: Refine 中文运营后台，支持 OTP 会话、可信数据台账/表单、草稿编辑、状态流转和审核任务处理。
- `apps/api`: NestJS REST API、邮箱 OTP、服务端会话和资源权限。
- `apps/worker`: BullMQ worker 与只读 Feishu/NBS connector 边界。
- `packages/db`: Prisma/PostgreSQL schema、迁移和种子。
- `packages/contracts`: 共享 Zod 契约、状态和 API 类型。
- `packages/ui`: 客户端共享 UI 基础组件。

## Local Setup

```powershell
$node = "C:\Users\34334\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
$pnpm = "C:\Users\34334\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd"
$env:Path = "C:\Users\34334\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;C:\Users\34334\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback;" + $env:Path

docker compose up -d
& $pnpm install --frozen-lockfile
& $pnpm db:generate
& $pnpm --filter @hellocarcar/db migrate:deploy
& $pnpm db:seed
```

Start each process in its own terminal:

```powershell
& $pnpm dev:web
& $pnpm dev:api
& $pnpm dev:admin
& $pnpm dev:worker
```

- Customer Web: `http://127.0.0.1:4173/dz/ar`
- Operations Admin: `http://127.0.0.1:4174`
- API: `http://127.0.0.1:8787`
- Swagger: `http://127.0.0.1:8787/docs`
- Mailpit: `http://127.0.0.1:8025`
- MinIO console: `http://127.0.0.1:9001`

## Verification

```powershell
& $pnpm check
& $pnpm --filter @hellocarcar/api test
& $pnpm build
```

## Product Boundary

MVP 支持车型与证据价格、市场隔离、AI 决策工作流、脱敏报告、手工 T/T 边界及 PI/VIN 归属查询。它不是车辆商城，不提供购物车、库存锁定、在线卖车或供应商自助入驻。

See `outputs/hellocarcar_implementation_plan.md` and `outputs/hellocarcar_codex_handoff.md` for current scope and the next milestone.
