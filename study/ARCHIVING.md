# 学习中心归档约定

发布目的地：`aisuperteacher/ai-learning-hub` 的 `main` 分支。学习入口为 `https://aisuperteacher.github.io/ai-daily-hub/study/`。

本目录汇总用户要求保存的公开学习 HTML，包括学以致用、learn-by-doing、ELI5 教学页、机制图解、动手实验及知识地图。每日 AI 五词精讲仍保留 `reports/learning/` 独立来源，并在学习中心提供阅读入口；其他日报、新闻、政策周报和活动监测不归入课程。

## 取得和检查原文

1. 从 ChatGPT Library 的最新 HTML 列表查找新增或修改的学习页。先用名称与所在目录识别候选，再读取完整内容确认它是课程。不能只凭“AI”或“架构”关键词归档资讯。
2. 已知学习页可在 `/study/` 文件夹，也可在根目录；根目录候选常含 `lesson`、`learning`、`unit`、`eli5`、`learn_deep`、`学以致用`、`交互讲解`。这些仅是线索，需要内容核对。
3. 只归档完整原始 HTML，不用摘要、过期 sandbox 链接或执行通知代替原文。确认资源自包含，或同时取得必需资源。不得公开私人笔记、内部业务资料、账户数据、访问凭据或需权限的文件链接；含此类内容的候选等待用户明确选择。
4. 与 `catalog.json` 里的 SHA-256 和来源文件名比较。字节相同的文件仅补充来源别名，不增加重复卡片；同主题的不同内容保留为版本。保留原始日期，不把补档日期当作授课日期。

## 增量导入

在可运行 Python 的源代码工作区中使用：

```bash
python3 scripts/add_lesson.py --input /absolute/path/lesson.html \
  --topic stable-topic-slug --title '课程主题' --summary '实际涵盖内容' \
  --category ai --tags '关键词一' '关键词二' \
  --edition-label '本版本名称' --date YYYY-MM-DD --recommend
python3 scripts/build_learning_index.py --write
python3 scripts/build_learning_index.py
```

分类为 `ai`（AI 与 Agent）、`backend`（缓存与消息）、`web`（网络与架构）、`java`（Java 并发）、`thinking`（思维与行动）。其他学习方向可在目录中新增合适分类，不限定学习范围。

导入脚本按内容哈希保存完整文件并合并目录。推荐入口由 `recommended` 指向；修订后的课程可成为推荐，已有版本保留。构建脚本会追加 `manifest.json` 中已发布的每日 AI 五词精讲，校验所有路径和哈希，并生成正文搜索索引。

如果自动化环境只能使用 GitHub 连接器，可按相同 JSON schema 增量写入原文和目录；之后 GitHub Actions 会刷新搜索索引并校验。不得为省事覆盖整个目录或其他任务的 `manifest.json`。

## 提交和发布

1. 读取最新分支 head、现有目录和将修改文件的 SHA。在最新树上建立包含本次课程与目录变更的单个提交；更新分支时带 `expected_sha`，不使用强制覆盖。
2. 如果同时有其他任务提交，重新读取最新目录和 head 后合并，最多重试三次。已成功上传相同哈希的课程不重复创建。
3. 本次通常只修改 `study/catalog.json` 与 `study/lessons/`；只有归档实现确需改变时才改对应脚本。保留其他栏目与任务的内容。
4. 等待本仓库 Pages 的对应提交部署成功。回读目录与新课程路径，确认文件可打开后才报告发布完成。
5. 没有新增或更新课程时，不做空提交，不向用户反复推送“无更新”。失败要如实说明，不把计划或已提交代码当作已部署。

目录中的正文、来源文件名与哈希均来自实际课程；不在公开目录保存 Library 私有访问地址或凭据。站点访问记录只保存在读者当前浏览器，不用于声称已经掌握知识。

归档增量更新须保留各主题的 `hub_status` 管理字段；不要重新显示已隐藏或移入回收站的主题。主目录在根 `courses.json`，首页直接读取；不再维护内嵌课程数组。`course-trash/` 保存公开仓库中的回收站备份，不作为新课程来源，也不自动重新导入已删除内容。

