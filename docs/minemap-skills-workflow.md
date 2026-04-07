# 使用 `skills` CLI 安装 [ming1zhou88/minemap-skills](https://github.com/ming1zhou88/minemap-skills) 标准流程

面向：已通过 **独立二进制** 安装 **`skills`**，并把 [minemap-skills](https://github.com/ming1zhou88/minemap-skills) 装进指定 Coding Agent。技能源：**https://github.com/ming1zhou88/minemap-skills.git**。

下文命令均写作 **`skills`**；请确保可执行文件在 **PATH** 中（或写全路径，如 Windows 上 `%USERPROFILE%\.local\bin\skills.exe`）。

---

## 1. 安装 `skills`（独立二进制）

从 [listenbehind/skills Releases](https://github.com/listenbehind/skills/releases) 安装已发布的 **`skills-*`** 预编译文件（CI 构建的 [Node SEA](https://nodejs.org/api/single-executable-applications.html) 产物，**运行时不依赖本机安装 Node**）。

**macOS / Linux**（一键脚本，默认安装到 `$HOME/.local/bin`）：

```bash
curl -fsSL https://raw.githubusercontent.com/listenbehind/skills/main/scripts/install.sh | sh
```

**固定某一 Release 标签**（与脚本里解析的 tag 一致，通常带 `v` 前缀）：

```bash
SKILLS_VERSION=v1.4.13 curl -fsSL https://raw.githubusercontent.com/listenbehind/skills/main/scripts/install.sh | sh
```

**环境变量（可选）**：

| 变量                 | 含义                                             |
| -------------------- | ------------------------------------------------ |
| `SKILLS_GITHUB_REPO` | 默认 `listenbehind/skills`；fork 时可改。        |
| `SKILLS_VERSION`     | `latest` 或 `v1.4.13` 等 tag。                   |
| `SKILLS_INSTALL_DIR` | 安装目录，默认 `$HOME/.local/bin`。              |
| `GITHUB_TOKEN`       | 可选；提高 GitHub API 额度（解析 `latest` 时）。 |

**Windows**：

- 从仓库下载 [`scripts/install.bat`](https://github.com/listenbehind/skills/blob/main/scripts/install.bat) 与同目录 [`install.ps1`](https://github.com/listenbehind/skills/blob/main/scripts/install.ps1)，执行 `install.bat`。
- 默认将 **`skills.exe`** 装到 **`%USERPROFILE%\.local\bin`**；请把该目录加入用户 **PATH**。若已打开的 PowerShell 找不到 `skills`，开新终端或刷新 `Path` 环境变量。
- 默认下载 **`skills-windows-amd64.exe`**；ARM64 Windows 通常走 x64 模拟；仅当你的 Release 里提供了 `skills-windows-arm64.exe` 时才设置 `SKILLS_WINDOWS_ARCH=arm64`。

**验证**：

```bash
skills --version
```

> **当前 CI 发布说明**：[listenbehind/skills](https://github.com/listenbehind/skills) 的 release-sea 工作流主要发布 **`skills-linux-amd64`、`skills-darwin-arm64`、`skills-windows-amd64.exe`**。若你的平台与上述不符，请到 [Releases](https://github.com/listenbehind/skills/releases) 查看是否有新增资产，或使用源码仓库自行构建 SEA 后再安装。

---

## 2. 前置条件（使用 minemap-skills 时）

- 可联网，本机已安装 **Git**（`skills add` 会克隆仓库）。
- 已完成 **§1**，且终端中 `skills --version` 可用。

---

## 3. 浏览仓库里有哪些技能（不安装）

```bash
skills add ming1zhou88/minemap-skills --list
```

会列出 `skills/` 下各子目录的 **name** 与 **description**（例如 `minemap-fundamentals`、`minemap-layer-system` 等）。

---

## 4. 版本策略：最新 vs 指定版本

该仓库技能位于 **`main`** 分支；若作者后续打了 **Git Tag**，可按 tag 固定版本。

### 4.1 跟随默认分支（当前即“最新 main”）

```bash
skills add ming1zhou88/minemap-skills --list
# 安装时同样不写 ref，即按默认克隆的最新 main
```

安装示例里使用 `ming1zhou88/minemap-skills` 即表示使用解析到的默认分支（一般为 `main`）。

### 4.2 固定到某个 Tag（推荐可复现）

将 `#标签名` 接在源后面（必须为该仓库 **真实存在** 的 tag 或分支名；下面用 **`main`** 作为可立刻复现的示例）：

```bash
skills add ming1zhou88/minemap-skills#main --list
```

若作者发布了例如 `v1.0.0` 的 tag，则写成 `ming1zhou88/minemap-skills#v1.0.0`；**没有该 tag 时 git 会报错**，请先 `git ls-remote --tags https://github.com/ming1zhou88/minemap-skills.git` 核对。

或使用完整 URL（`tree/<ref>/...` 与片段可配合使用，以你环境里 `skills` 实际解析为准）：

```bash
skills add "https://github.com/ming1zhou88/minemap-skills/tree/main/skills/minemap-fundamentals" --list
```

> **说明**：若仓库 **尚未发布 Tag**，则没有“指定发行版”一说，只能用 **`#main`** 或某次提交的 **commit SHA**（作为 git ref）锁定快照，例如：  
> `skills add ming1zhou88/minemap-skills#<commit-sha> --skill minemap-fundamentals -y`

---

## 5. 安装范围：项目 vs 全局

| 方式                                 | 命令特征  | 典型路径（以 Cursor 为例）            |
| ------------------------------------ | --------- | ------------------------------------- |
| **项目内**（可随仓库提交，团队一致） | 不加 `-g` | 项目下 `.agents/skills/` 等（见下表） |
| **全局**（本机所有项目可用）         | `-g`      | 用户目录下 `~/.cursor/skills/` 等     |

多 Agent 并行时，同一技能可安装到多个 `--agent`。

---

## 6. 指定 Coding Agent 平台（`--agent` / `-a`）

以下为常用平台与 **`skills` 中使用的标识**（与上游 [skills 文档](https://github.com/vercel-labs/skills/blob/main/README.md#supported-agents) 一致）：

| 产品               | `--agent` 值     | 项目内技能目录（默认范围） | 全局技能目录（`-g`）         |
| ------------------ | ---------------- | -------------------------- | ---------------------------- |
| **Cursor**         | `cursor`         | `.agents/skills/`          | `~/.cursor/skills/`          |
| **Codex**          | `codex`          | `.agents/skills/`          | `~/.codex/skills/`           |
| **Claude Code**    | `claude-code`    | `.claude/skills/`          | `~/.claude/skills/`          |
| **OpenCode**       | `opencode`       | `.agents/skills/`          | `~/.config/opencode/skills/` |
| **GitHub Copilot** | `github-copilot` | `.agents/skills/`          | `~/.copilot/skills/`         |
| **OpenClaw**       | `openclaw`       | `skills/`                  | `~/.openclaw/skills/`        |

使用 **多个** Agent 时重复 `-a`：

```bash
skills add ming1zhou88/minemap-skills -a cursor -a codex -y
```

仅给 **某一个** Agent 安装时，务必带 `-a`，避免装进其它已检测到 Agent 的目录。

---

## 7. 推荐命令模板（非交互 / CI 友好）

**安装单技能到 Cursor（项目内）：**

```bash
cd /path/to/your/project
skills add ming1zhou88/minemap-skills \
  --skill minemap-fundamentals \
  -a cursor \
  -y
```

**安装多个技能到 Cursor + Codex（全局）：**

```bash
skills add ming1zhou88/minemap-skills \
  --skill minemap-fundamentals \
  --skill minemap-layer-system \
  -g -a cursor -a codex \
  -y
```

**固定到某 ref + 仅 Cursor**（将 `#main` 换成真实 **tag** 或 **commit SHA**）：

```bash
skills add ming1zhou88/minemap-skills#main \
  --skill minemap-3d-tiles-runtime-control \
  -a cursor \
  -y
```

**一次性安装仓库内全部技能（体量较大，慎用）：**

```bash
skills add ming1zhou88/minemap-skills --skill '*' -a cursor -y
```

---

## 8. 技能管理

### 8.1 查看已安装技能

```bash
skills list
skills ls

# 仅全局
skills ls -g

# 按 Agent 过滤
skills ls -a cursor -a codex
```

### 8.2 搜索可安装技能（交互 / 关键词）

```bash
skills find
skills find minemap
```

### 8.3 检查与更新（适合 GitHub 来源且锁文件中有 folder hash 的安装）

```bash
skills check
skills update
```

> **说明**：`check` / `update` 依赖全局锁 `~/.agents/.skill-lock.json` 等与 GitHub 相关的元数据；具体行为以当前 CLI 版本为准。

### 8.4 卸载

```bash
skills remove
skills remove minemap-fundamentals

skills remove --global minemap-fundamentals
skills remove --agent cursor minemap-fundamentals
skills remove --all
```

### 8.5 与 minemap-skills 配套的常见节奏

| 目的                 | 命令示例                                       |
| -------------------- | ---------------------------------------------- |
| 先看仓库有哪些 skill | `skills add ming1zhou88/minemap-skills --list` |
| 装进 Cursor（项目）  | `skills add … -a cursor --skill <name> -y`     |
| 装进 Cursor（全局）  | `skills add … -g -a cursor --skill <name> -y`  |
| 确认是否装上         | `skills ls -a cursor`                          |
| 升级                 | `skills check`，再 `skills update`             |

---

## 9. 安装后：在 Coding Agent 里如何“用上”

1. **确认目录里已有技能**  
   例如 Cursor：查看项目下 `.agents/skills/<技能名>/SKILL.md`（项目安装）或用户目录 `~/.cursor/skills/`（全局）。

2. **重启或刷新 Agent**  
   多数 Agent 在启动时加载技能；若刚装完未被识别，重启 IDE / Agent 或重新打开对话。

3. **在对话中引用**  
   按各产品说明使用 Skills（名称通常与 `SKILL.md` frontmatter 的 `name` 一致），例如让助手“按 `minemap-fundamentals` 规范初始化地图”。

4. **`SKILL.md` 结构**  
   每个技能是独立目录 + `SKILL.md`，内含 YAML frontmatter（`name`、`description`）与正文说明；Agent 通过加载这些文件获得 MineMap 相关约束与示例。

5. **与引擎版本对齐**  
   minemap-skills README 写明校验基线（如 `minemap-3d-engine@4.22.1`）；若你用的引擎版本不同，以仓库说明为准自行核对。

---

## 10. 更新已安装的技能（minemap-skills）

- **全局安装**（`-g`）且来源为 GitHub：可用 **`skills check`** / **`skills update`**。
- **项目安装**或未使用全局锁：可在项目根 **再次执行相同 `add` 命令**（可改 `#tag`），或删除旧技能目录后重装。
- 团队可复制 **`skills-lock.json`**（若使用项目级 lock）固定来源与 ref，便于统一环境。

---

## 11. 故障排查简要

| 现象                            | 处理                                                                                                                                            |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 克隆了全仓但只想要一个技能      | 使用 `--skill <name>` 或带 `tree/.../skills/具体目录` 的 URL                                                                                    |
| 技能名含空格                    | PowerShell/bash 中对 `--skill` 参数加引号                                                                                                       |
| Windows 上无符号链接            | 使用 `skills add ... --copy`                                                                                                                    |
| `skills` 命令不存在             | 完成 **§1**，确认 **`%USERPROFILE%\.local\bin`**（Windows）或 **`$HOME/.local/bin`**（Unix）已加入 PATH，并新开终端；必要时使用可执行文件全路径 |
| 二进制下载失败 / 不是有效 exe   | 打开对应 [Release](https://github.com/listenbehind/skills/releases) 确认资产名；Windows 默认拉取 `skills-windows-amd64.exe`                     |
| 克隆超时（提示里含 `Clone timed out`） | 默认约 **300s**；可在运行前设置毫秒环境变量 **`SKILLS_GIT_CLONE_TIMEOUT_MS`**（例如 `600000` 表示 10 分钟，合法范围 **5000–1800000**）。仍失败可换网络/代理或先试 `git clone --depth 1` |
| `Remote branch <ref> not found` | `#ref` 或 URL 里的分支/tag 在远端不存在；改用 **`main`** 或仓库已存在的 tag                                                                     |

---

## 12. 一页纸速查

```text
安装 CLI:              见 §1（install.sh / install.bat）
列出 minemap 技能:     skills add ming1zhou88/minemap-skills --list
最新 main:             skills add ming1zhou88/minemap-skills -a cursor --skill <名> -y
固定版本:              skills add ming1zhou88/minemap-skills#<tag> -a cursor --skill <名> -y
全局 + 多 Agent:       加 -g，多次 -a <agent>
已安装列表:            skills ls [-g] [-a cursor]
检查/更新:             skills check && skills update
```

技能库说明与能力表见上游仓库：[ming1zhou88/minemap-skills README](https://github.com/ming1zhou88/minemap-skills/blob/main/README.md)。
