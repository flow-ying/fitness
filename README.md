# 姿态工坊

基于人体姿态估计的健身动作规范检测 Web 系统。用户将手动选择深蹲、俯卧撑或哑铃弯举，应用在浏览器本地完成关键点检测、动作计数和规范性反馈；云端只保存用户选择提交的训练汇总，不保存原始视频。

当前进度：T01 工程基线。

## 技术基线

- React 19.2 + TypeScript 6
- Vite 8
- ESLint 10 + Prettier 3
- Vitest 4 + Testing Library
- Playwright 1.62

Vite 8 要求 Node.js 20.19+ 或 22.12+。本项目当前使用 Node.js 24 验证。

## 快速开始

```bash
npm install
npm run dev
```

开发服务器默认运行在 `http://localhost:5173`。

## 质量命令

| 命令                   | 作用                       |
| ---------------------- | -------------------------- |
| `npm run dev`          | 启动开发服务器             |
| `npm run lint`         | 执行 ESLint，禁止警告      |
| `npm run format`       | 使用 Prettier 格式化       |
| `npm run format:check` | 检查格式但不改文件         |
| `npm run typecheck`    | 执行 TypeScript 类型检查   |
| `npm run test`         | 运行 Vitest 单元和组件测试 |
| `npm run test:e2e`     | 运行 Playwright 浏览器测试 |
| `npm run build`        | 生成生产构建               |
| `npm run preview`      | 本地预览生产构建           |

本地 E2E 测试默认调用已安装的稳定版 Google Chrome；CI 环境后续单独安装
Playwright 浏览器。

## 计划中的目录

```text
src/
  app/                 应用入口、路由和全局状态
  components/          通用界面组件
  features/auth/       登录与用户会话
  features/training/   摄像头、训练和结果页
  features/history/    云端历史和统计
  pose/                MediaPipe 适配与关键点处理
  exercises/           动作配置、状态机和规则
  services/            云端数据访问
  types/               公共类型
  test/                测试环境和夹具
e2e/                   Playwright 关键用户流程
```

目录在对应任务首次使用时加入代码，避免提前创建空抽象。

## 环境变量

复制 `.env.example` 为 `.env.local`，只在本机填写实际值。所有 `VITE_` 变量都会进入浏览器构建，不能放入服务端密钥、数据库密码或其他机密信息。

## 当前范围

T01 只提供工程基线和可访问的静态项目外壳。摄像头与 MediaPipe 属于 T02，登录和云端历史将在 T03 技术验证通过后接入。

## 官方依据

- [Vite Getting Started](https://vite.dev/guide/)
- [React 创建应用](https://react.dev/learn/creating-a-react-app)
- [typescript-eslint Quickstart](https://typescript-eslint.io/getting-started/)
- [Vitest Getting Started](https://vitest.dev/guide/)
- [Playwright Installation](https://playwright.dev/docs/intro)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Prettier Install](https://prettier.io/docs/install)
