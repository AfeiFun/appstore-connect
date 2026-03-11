# appstore-connect

[English](README.md) | **中文**

一个 [Claude Code](https://claude.ai/code) 技能插件，通过 API 管理 Apple App Store Connect。在终端中即可读取和更新 App 元数据、上传截图、管理版本，还能分析 iOS 代码库自动填写 Connect 资料。

## 功能特性

- **零依赖** — 使用 Node.js 内置 `crypto` 实现 ES256 JWT 认证
- **全面的元数据管理** — App 名称、描述、关键词、推广文本、截图、年龄分级、审核信息
- **多语言支持** — 创建和更新任意语言的本地化版本
- **截图上传** — 自动处理"预留 → 上传 → 提交"三步流程
- **iOS 项目分析** — 从 Xcode 项目自动推断 Connect 元数据（权限、隐私标签、App 信息）
- **原始 API 访问** — 可调用任意 App Store Connect API 端点

## 安装

### 作为 Claude Code Skill（推荐）

```bash
# 个人级（所有项目可用）
cp -r appstore-connect ~/.claude/skills/

# 或项目级（仅当前项目可用）
cp -r appstore-connect .claude/skills/
```

重启 Claude Code 后，讨论 App Store Connect 相关话题时会自动触发该技能。

### 独立 CLI 工具

`scripts/asc-api.js` 脚本可独立使用，无需 Claude Code：

```bash
node scripts/asc-api.js --help
```

## 配置

### 1. 生成 API 密钥

1. 前往 [App Store Connect → 用户和访问 → 集成 → App Store Connect API](https://appstoreconnect.apple.com/access/integrations/api)
2. 点击 **生成 API 密钥**
3. 名称：随意（如 `Claude Code`）
4. 角色：**App 管理**
5. 下载 `.p8` 私钥文件（只能下载一次！）
6. 记下页面顶部的 **Issuer ID** 和密钥行中的 **Key ID**

### 2. 存放私钥

```bash
mkdir -p ~/.appstoreconnect
mv ~/Downloads/AuthKey_XXXXXXXX.p8 ~/.appstoreconnect/
```

### 3. 设置环境变量

添加到 `~/.zshrc` 或 `~/.bashrc`：

```bash
export ASC_ISSUER_ID="你的-issuer-id"           # 第 1 步获取的 UUID
export ASC_KEY_ID="你的-key-id"                  # 如 NYR7JGJMM5
export ASC_PRIVATE_KEY_PATH="~/.appstoreconnect/AuthKey_XXXXXXXX.p8"
```

### 4. 验证

```bash
source ~/.zshrc
node ~/.claude/skills/appstore-connect/scripts/asc-api.js test-auth
```

## 使用方式

### 配合 Claude Code

直接用自然语言对话：

```
> 帮我更新 App Store 的描述
> 准备我的 App 提交审核
> 分析我的 iOS 项目并自动填写 Connect 资料
> 把截图上传到 App Store Connect
```

或直接调用：

```
> /appstore-connect
```

### 独立 CLI

```bash
# 列出所有 App
node scripts/asc-api.js list-apps

# 查看版本
node scripts/asc-api.js get-versions <appId>

# 更新描述和关键词
node scripts/asc-api.js update-localization <locId> \
  --description="我的应用描述" \
  --keywords="关键词1,关键词2"

# 上传截图
node scripts/asc-api.js upload-screenshot <setId> ~/screenshots/home.png

# 通过 JSON 文件进行复杂更新
echo '{"data":{"type":"appStoreVersionLocalizations","id":"abc","attributes":{"description":"..."}}}' > /tmp/body.json
node scripts/asc-api.js raw PATCH /v1/appStoreVersionLocalizations/abc @/tmp/body.json
```

运行 `node scripts/asc-api.js --help` 查看完整命令参考。

## 项目结构

```
appstore-connect/
├── SKILL.md                          # 技能定义（触发条件 + 工作流）
├── README.md                         # 英文文档
├── README_CN.md                      # 中文文档（本文件）
├── LICENSE                           # MIT 开源协议
├── scripts/
│   └── asc-api.js                    # CLI 工具（JWT 认证 + 20+ API 命令）
└── references/
    ├── api-endpoints.md              # API 端点快速参考
    └── privacy-mapping.md            # iOS 权限 → 隐私标签映射
```

## 环境要求

- **Node.js 18+**（需要内置 `fetch`）
- **App Store Connect API 密钥**（App 管理角色）

## 字符限制

| 字段 | 最大长度 |
|------|---------|
| 关键词（Keywords） | 100 字符 |
| 副标题（Subtitle） | 30 字符 |
| 推广文本（Promotional Text） | 170 字符 |
| 描述（Description） | 4,000 字符 |
| 新功能（What's New） | 4,000 字符 |
| 审核备注（Review Notes） | 4,000 字符 |

## 开源协议

MIT
