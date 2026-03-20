# appstore-connect

**English** | [中文](README_CN.md)

A [Claude Code](https://claude.ai/code) skill for managing Apple App Store Connect via API. Read and update app metadata, upload screenshots, manage versions, and auto-fill Connect metadata by analyzing your iOS codebase — all from your terminal.

## Features

- **Zero dependencies** — Uses Node.js built-in `crypto` for ES256 JWT authentication
- **Full metadata management** — App name, description, keywords, promotional text, screenshots, age rating, review info
- **Multi-language support** — Create and update localizations for any locale
- **Screenshot upload** — Handles the 3-step reserve → upload → commit flow automatically
- **iOS project analysis** — Auto-infer Connect metadata from your Xcode project (permissions, privacy labels, app info)
- **Raw API access** — Escape hatch for any App Store Connect API endpoint

## Installation

### As a Claude Code Skill (recommended)

```bash
# Personal (available across all projects)
cp -r appstore-connect ~/.claude/skills/

# Or project-level (only for current project)
cp -r appstore-connect .claude/skills/
```

Then restart Claude Code. The skill will automatically trigger when you discuss App Store Connect topics.

### Standalone CLI

The `scripts/asc-api.js` script works independently without Claude Code:

```bash
node scripts/asc-api.js --help
```

## Setup

### 1. Generate an API Key

1. Go to [App Store Connect → Users and Access → Integrations → App Store Connect API](https://appstoreconnect.apple.com/access/integrations/api)
2. Click **Generate API Key**
3. Name: anything you like (e.g., `Claude Code`)
4. Role: **App Manager**
5. Download the `.p8` private key file (you can only download it once!)
6. Note the **Issuer ID** (top of the page) and **Key ID** (in the key row)

### 2. Store the Private Key

```bash
mkdir -p ~/.appstoreconnect
mv ~/Downloads/AuthKey_XXXXXXXX.p8 ~/.appstoreconnect/
```

### 3. Set Environment Variables

Add to `~/.zshrc` or `~/.bashrc`:

```bash
export ASC_ISSUER_ID="your-issuer-id"           # UUID from step 1
export ASC_KEY_ID="your-key-id"                  # e.g., NYR7JGJMM5
export ASC_PRIVATE_KEY_PATH="~/.appstoreconnect/AuthKey_XXXXXXXX.p8"
```

### 4. Verify

```bash
source ~/.zshrc
node ~/.claude/skills/appstore-connect/scripts/asc-api.js test-auth
```

## Usage

### With Claude Code

Just talk naturally:

```
> Help me update my App Store description
> Prepare my app for submission
> Analyze my iOS project and fill in Connect metadata
> Upload these screenshots to App Store Connect
```

Or invoke directly:

```
> /appstore-connect
```

### Standalone CLI

```bash
# List all apps
node scripts/asc-api.js list-apps

# Get versions
node scripts/asc-api.js get-versions <appId>

# Update description and keywords
node scripts/asc-api.js update-localization <locId> \
  --description="My app does amazing things" \
  --keywords="amazing,app,cool"

# Upload a screenshot
node scripts/asc-api.js upload-screenshot <setId> ~/screenshots/home.png

# Complex update with JSON file
echo '{"data":{"type":"appStoreVersionLocalizations","id":"abc","attributes":{"description":"..."}}}' > /tmp/body.json
node scripts/asc-api.js raw PATCH /v1/appStoreVersionLocalizations/abc @/tmp/body.json
```

Run `node scripts/asc-api.js --help` for the full command reference.

## Project Structure

```
appstore-connect/
├── SKILL.md                          # Skill definition (triggers + workflows)
├── README.md                         # English documentation
├── README_CN.md                      # Chinese documentation
├── LICENSE                           # MIT License
├── scripts/
│   └── asc-api.js                    # CLI tool (JWT auth + 20+ API commands)
└── references/
    ├── api-endpoints.md              # API endpoint quick reference
    └── privacy-mapping.md            # iOS permission → privacy label mapping
```

## Requirements

- **Node.js 18+** (for built-in `fetch`)
- **App Store Connect API Key** with App Manager role

## Character Limits

| Field | Max Length |
|-------|-----------|
| Keywords | 100 characters |
| Subtitle | 30 characters |
| Promotional Text | 170 characters |
| Description | 4,000 characters |
| What's New | 4,000 characters |
| Review Notes | 4,000 characters |

## Related Projects

- **[ASO Pro Max](https://github.com/AfeiFun/aso-pro-max)** — A Claude Code skill for professional App Store Optimization. Audit, optimize, and expand your App Store metadata for maximum search visibility. Works great with this skill for automated ASO workflows.

## License

MIT
