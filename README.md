# AI 技术学习中心 / AI Learning Hub

这是独立于 `ai-daily-hub` 的 GitHub Pages 学习站点。

- 主目录：**14 门课程入口**（包含原有 6 门完整教学 HTML，以及从历史档案精选的 8 个其他主题）。
- 历史归档：**12 个主题、17 个版本**，均有可直接打开的 HTML；可在 `study/` 中检索并切换版本。
- 总体覆盖 AI Agent、AI 应用开发、AQS、Redis、RocketMQ、Web 架构、URL 全流程、系统压测等。
- 历史版本已复制到本仓库的 `study/lessons/` 和 `reports/learning/`；归档页面不再依赖旧日报仓库。
- 课程搜索、收藏、完成标记使用当前浏览器的 localStorage，不是跨设备同步、也不能作为实际掌握知识的证据。

## 入口
- 网站首页：https://aisuperteacher.github.io/ai-learning-hub/
- 历史学习档案：https://aisuperteacher.github.io/ai-learning-hub/study/
- GitHub 仓库：https://github.com/aisuperteacher/ai-learning-hub

## 新增课程约定
1. 新的完整交互 HTML 放到 `lessons/`，不要覆盖不同的历史版本。
2. 更新 `index.html` 内嵌的 courses 数组，同时更新仓库根目录 `courses.json`。
3. 如果要保存多个历史版本，可增加到 `study/catalog.json` 并把对应 HTML 放到其 `file` 指定路径。
4. 合并后核对首页课程数、相关链接和 Pages 的 build/deploy 状态。
5. 未来课程**不会自动**写入 GitHub，除非相应任务具有执行和发布授权。

## GitHub Pages
公共仓库的 `main` 分支、`/(root)` 发布。原先 `ai-daily-hub` 仍独立托管日报。

## 界面样式

首页与课程页采用统一视觉：课程目录置于贴顶的平面导航内，按正文宽度居中，无顶部空隙、悬浮阴影或圆角外框；支持章节定位、当前章节提示和手机横向目录。分页式课程保留原有切页交互。

历史档案的阅读栏、搜索、版本选择与下载入口保留。这里是静态 GitHub Pages 站点，课程与历史版本仍以仓库文件为准。

更新于 2026-11-08。

