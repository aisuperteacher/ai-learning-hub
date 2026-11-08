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
2. 增量更新仓库根目录 `courses.json`，首页会直接读取它；保留已有课程的 `status`、`priorStatus`、`revision` 等管理字段，不再维护首页内嵌数组。
3. 如果要保存多个历史版本，可增加到 `study/catalog.json` 并把对应 HTML 放到其 `file` 指定路径。
4. 合并后核对首页课程数、相关链接和 Pages 的 build/deploy 状态。
5. 未来课程**不会自动**写入 GitHub，除非相应任务具有执行和发布授权。

## GitHub Pages
公共仓库的 `main` 分支、`/(root)` 发布。原先 `ai-daily-hub` 仍独立托管日报。

## 界面样式

首页与课程页采用统一视觉：课程目录置于贴顶的平面导航内，按正文宽度居中，无顶部空隙、悬浮阴影或圆角外框；支持章节定位、当前章节提示和手机横向目录。分页式课程保留原有切页交互。

历史档案的阅读栏、搜索、版本选择与下载入口保留。这里是静态 GitHub Pages 站点，课程与历史版本仍以仓库文件为准。

更新于 2026-11-08。


## 课程管理

入口：`manage.html`，桌面与手机首页均有「课程管理」。支持搜索、隐藏/恢复显示、移入回收站、恢复课程、删除当前发布的课程文件。课程管理状态保存在仓库，Pages 部署成功后对其他设备生效；收藏、阅读完成和练习仍保存在当前浏览器。

管理页默认只读。使用拥有者的 GitHub fine-grained token 连接，仅选择此仓库并授予 Contents 读写权限。令牌只保存在当前页面内存中，刷新、关闭或断开后清除；不会写入仓库、URL、浏览器本地存储，也不会发送给第三方服务。管理页中的连接可用于当前 GitHub 学习中心，不与 ChatGPT Sites 的私有后台互通。

`courses.json` 是唯一的主课程目录。没有 `status` 的旧条目按 `active` 处理，其他状态为 `hidden`、`deleted`。回收站将原 HTML 暂存到 `course-trash/<course-id>.json`，原课程路径显示回收站提示。恢复会还原原文件及其先前的展示状态。历史归档课程还会同步调整 `study/catalog.json` 中的 `hub_status`，并处理该主题的全部版本。

删除仅限回收站课程，并需输入「永久删除」确认；删除本课程当前发布文件、目录入口及回收站备份。独立归档副本和 Git 提交历史仍保留。仓库及回收站备份是公开内容，隐藏与回收站用于整理，不是隐私访问控制，也不表示从所有历史中擦除。

所有相关文件变动使用一个提交并以非强制方式更新分支；出现并发修改时停止并提示刷新。管理页会区分已保存到仓库与 Pages 部署完成。连接令牌后实际写入由用户在管理页操作；实现已使用测试数据检查状态转换、文件恢复、删除和并发冲突，未拿现有课程做删除测试。
