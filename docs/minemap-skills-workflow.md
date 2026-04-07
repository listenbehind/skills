# 使用 `skills` CLI 安装 [ming1zhou88/minemap-skills](https://github.com/ming1zhou88/minemap-skills) 标准流程

面向：已在本地安装 **`skills`**（`npm install -g skills` / `npx skills` / 或 [listenbehind/skills Releases](https://github.com/listenbehind/skills/releases) 独立二进制）。技能源仓库：[**https://github.com/ming1zhou88/minemap-skills.git**](https://github.com/ming1zhou88/minemap-skills.git)。

---

## 1. 前置条件

- 可联网，本机已安装 **Git**（`skills add` 会克隆仓库）。
- 已能用终端执行：`skills` 或 `npx skills`（推荐 Node **20+**）。

---

## 2. 浏览仓库里有哪些技能（不安装）

```bash
npx skills add ming1zhou88/minemap-skills --list
```

会列出 `skills/` 下各子目录的 **name** 与 **description**（例如 `minemap-fundamentals`、`minemap-layer-system` 等）。

---

## 3. 版本策略：最新 vs 指定版本

该仓库技能位于 **`main`** 分支；若作者后续打了 **Git Tag**，可按 tag 固定版本。

### 3.1 跟随默认分支（当前即“最新 main”）

```bash
npx skills add ming1zhou88/minemap-skills --list
# 安装时同样不写 ref，即按默认克隆的最新 main
```

安装示例（见下一节）里使用 `ming1zhou88/minemap-skills` 即表示使用解析到的默认分支（一般为 `main`）。

### 3.2 固定到某个 Tag（推荐可复现）

将 `#标签名` 接在源后面（不要遗漏 `v` 若作者使用 `v1.0.0` 这种命名）：

```bash
npx skills add ming1zhou88/minemap-skills#v1.0.0 --list
```

或使用完整 URL（`tree/<ref>/...` 与片段可配合使用，以你环境里 `skills` 实际解析为准）：

```bash
npx skills add "https://github.com/ming1zhou88/minemap-skills/tree/v1.0.0/skills/minemap-fundamentals"
```

> **说明**：若仓库 **尚未发布 Tag**，则没有“指定发行版”一说，只能用 **`#main`** 或某次提交的 **commit SHA**（作为 git ref）锁定快照，例如：  
> `npx skills add ming1zhou88/minemap-skills#<commit-sha> --skill minemap-fundamentals -y`

---

## 4. 安装范围：项目 vs 全局

| 方式 | 命令特征 | 典型路径（以 Cursor 为例） |
|------|-----------|---------------------------|
| **项目内**（可随仓库提交，团队一致） | 不加 `-g` | 项目下 `.agents/skills/` 等（见下表） |
| **全局**（本机所有项目可用） | `-g` | 用户目录下 `~/.cursor/skills/` 等 |

多 Agent 并行时，同一技能可安装到多个 `--agent`。

---

## 5. 指定 Coding Agent 平台（`--agent` / `-a`）

以下为常用平台与 **`skills` 中使用的标识**（与上游 [skills 文档](https://github.com/vercel-labs/skills/blob/main/README.md#supported-agents) 一致）：

| 产品 | `--agent` 值 | 项目内技能目录（默认范围） | 全局技能目录（`-g`） |
|------|----------------|------------------------------|------------------------|
| **Cursor** | `cursor` | `.agents/skills/` | `~/.cursor/skills/` |
| **Codex** | `codex` | `.agents/skills/` | `~/.codex/skills/` |
| **Claude Code** | `claude-code` | `.claude/skills/` | `~/.claude/skills/` |
| **OpenCode** | `opencode` | `.agents/skills/` | `~/.config/opencode/skills/` |
| **GitHub Copilot** | `github-copilot` | `.agents/skills/` | `~/.copilot/skills/` |
| **OpenClaw** | `openclaw` | `skills/` | `~/.openclaw/skills/` |

使用 **多个** Agent 时重复 `-a`：

```bash
npx skills add ming1zhou88/minemap-skills -a cursor -a codex -y
```

仅给 **某一个** Agent 安装时，务必带 `-a`，避免装进其它已检测到 Agent 的目录。

---

## 6. 推荐命令模板（非交互 / CI 友好）

**安装单技能到 Cursor（项目内）：**

```bash
cd /path/to/your/project
npx skills add ming1zhou88/minemap-skills \
  --skill minemap-fundamentals \
  -a cursor \
  -y
```

**安装多个技能到 Cursor + Codex（全局）：**

```bash
npx skills add ming1zhou88/minemap-skills \
  --skill minemap-fundamentals \
  --skill minemap-layer-system \
  -g -a cursor -a codex \
  -y
```

**固定版本 + 仅 Cursor：**

```bash
npx skills add ming1zhou88/minemap-skills#v1.0.0 \
  --skill minemap-3d-tiles-runtime-control \
  -a cursor \
  -y
```

**一次性安装仓库内全部技能（体量较大，慎用）：**

```bash
npx skills add ming1zhou88/minemap-skills --skill '*' -a cursor -y
```

---

## 7. 安装后：在 Coding Agent 里如何“用上”

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

## 8. 更新已安装的技能

- **全局安装**（`-g`）且来源为 GitHub：可用 `skills check` / `skills update`（见上游 CLI 说明）。  
- **项目安装**或未使用全局锁：可在项目根 **再次执行相同 `add` 命令**（可改 `#tag`），或删除旧技能目录后重装。  
- 团队可复制 **`skills-lock.json`**（若使用项目级 lock）固定来源与 ref，便于统一环境。

---

## 9. 故障排查简要

| 现象 | 处理 |
|------|------|
| 克隆了全仓但只想要一个技能 | 使用 `--skill <name>` 或带 `tree/.../skills/具体目录` 的 URL |
| 技能名含空格 | PowerShell/bash 中对 `--skill` 参数加引号 |
| Windows 上无符号链接 | 使用 `skills add ... --copy` |
| `skills` 命令不存在 | 使用 `npx skills ...` 或 `npm install -g skills` / 安装 [listenbehind/skills 二进制](https://github.com/listenbehind/skills/releases) |

---

## 10. 一页纸速查

```text
列出技能:     npx skills add ming1zhou88/minemap-skills --list
最新 main:     npx skills add ming1zhou88/minemap-skills -a cursor --skill <名> -y
固定版本:      npx skills add ming1zhou88/minemap-skills#<tag> -a cursor --skill <名> -y
全局 + 多 Agent: 加 -g，多次 -a <agent>
```

技能库说明与能力表见上游仓库：[ming1zhou88/minemap-skills README](https://github.com/ming1zhou88/minemap-skills/blob/main/README.md)。
