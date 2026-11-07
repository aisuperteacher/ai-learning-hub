# AI 技术学习中心 / AI Learning Hub

面向零基础的中文 AI 和软件工程交互式学习知识库，当前收录 **6 门完整 HTML 课程**。

## 课程

- AI Agent 入门与动手练习：`lessons/ai_agent_unit_01.html`
- Redis 双写一致性 · ELI5 图解：`lessons/redis_double_write_eli5.html`
- Redis 缓存一致性 · 学以致用：`lessons/redis_cache_consistency_unit_01.html`
- RocketMQ 消费机制实验室：`lessons/rocketmq_learn_deep_lab.html`
- 压测：从请求到瓶颈 · ELI5：`lessons/eli5-performance-load-testing.html`
- 系统压测知识体系 · 核心原理：`lessons/system_load_testing_knowledge.html`

## 站点功能

响应式课程目录、搜索、分类、收藏和学习完成标记。进度仅保存在当前浏览器 `localStorage`，不会跨设备同步，也不能作为已掌握知识的证据。

项目为纯静态文件。所有课程正文、CSS 和 JavaScript 都在本地 HTML 中，保留已有课程的交互演示。`courses.json` 是可编辑课程索引；当前首页使用 `index.html` 内置的课程数组，新增课程时应同步修改两处。

## 本地查看

解压后直接使用浏览器打开 `index.html`；点击课程卡片打开 `lessons/` 下的原始 HTML。

## GitHub Pages 部署

目标仓库：`aisuperteacher/ai-learning-hub`（public）。建议在该仓库单独部署，不要占用 `ai-daily-hub` 日报仓库。

1. 在 GitHub 新建公开仓库 `ai-learning-hub`，初始化 README 以创建 `main` 分支。
2. 将本发布包中的 `index.html`、`courses.json`、`lessons/`、`.nojekyll` 等文件上传到仓库根目录，确保不是嵌套在 `ai-learning-hub/` 文件夹下。
3. 打开仓库 `Settings > Pages`，选择 `Deploy from a branch`，分支 `main`，文件夹 `/(root)`，保存。
4. 等待 GitHub Pages 部署成功后访问 `https://aisuperteacher.github.io/ai-learning-hub/`。
5. 检查 6 门课程的链接、搜索/筛选、收藏与响应式布局。若 Pages 未启用或发布失败，不要把预期网址当作已上线网址。

所有路径都使用仓库内相对地址，适用于 GitHub Pages 的项目子路径形式。`.nojekyll` 用于禁用 Jekyll 处理。

## 后续更新

新增 HTML 到 `lessons/`，同步在 `index.html` 内置课程数组和 `courses.json` 中登记并提交。GitHub Pages 根据分支设置更新站点。旧的学习 HTML 不应在未确认版本的情况下被新课程覆盖。

## ChatGPT Sites

本发布包也可供 ChatGPT Sites 从现有静态项目导入或重建；导入与发布是单独的步骤，未因生成本包而自动完成。

更新日期：2026-11-07。
