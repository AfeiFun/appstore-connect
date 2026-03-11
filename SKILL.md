---
name: appstore-connect
description: |
  Manage Apple App Store Connect via API — read and update app metadata (name, description, keywords, screenshots, age rating, review info, etc.), and auto-fill Connect metadata by analyzing your iOS codebase.
  Use this skill whenever the user mentions any of the following:
  - App Store Connect, ASC, Connect metadata, app submission, app review
  - Updating app description, keywords, screenshots, release notes, promotional text
  - Setting age rating, privacy declarations, data collection
  - Filling in review info (contact details, demo account, review notes)
  - Analyzing an iOS project to auto-generate Connect metadata
  - Creating new versions, submitting for review
  - "update my App Store listing", "prepare for submission", "fill in Connect"
  Even if the user doesn't explicitly say "App Store Connect", use this skill for any task involving iOS app publishing, metadata management, or app review.
---

# App Store Connect Manager

Manage your iOS app's entire App Store lifecycle through the App Store Connect API.

## Prerequisites

### API Key Setup

Three environment variables are required (add to `~/.zshrc` or `~/.bashrc`):

```bash
export ASC_ISSUER_ID="your-issuer-id"
export ASC_KEY_ID="your-key-id"
export ASC_PRIVATE_KEY_PATH="~/.appstoreconnect/AuthKey_XXXX.p8"
```

**How to get these**: App Store Connect → Users and Access → Integrations → App Store Connect API → Generate API Key (choose "App Manager" role).

If the user hasn't configured these yet, guide them through the setup. Run `test-auth` to verify once done.

### Verify Connection

```bash
node ${CLAUDE_SKILL_DIR}/scripts/asc-api.js test-auth
```

## Core Script

All API calls go through `${CLAUDE_SKILL_DIR}/scripts/asc-api.js`:
- Zero external dependencies — uses Node.js built-in `crypto` for ES256 JWT
- All output is JSON for easy parsing
- Supports `@file.json` syntax for complex request bodies
- Run `--help` for full command reference

## Workflows

### Workflow 1: Check Current App State

This is the starting point for most operations. Get the app list and current version info.

```bash
# List all apps (get appId)
node ${CLAUDE_SKILL_DIR}/scripts/asc-api.js list-apps

# Get version list (get versionId)
node ${CLAUDE_SKILL_DIR}/scripts/asc-api.js get-versions <appId>

# Get version localizations (get localizationId, see current description/keywords)
node ${CLAUDE_SKILL_DIR}/scripts/asc-api.js get-localizations <versionId>
```

Each step's output ID feeds into the next, so execute in order. Record all IDs for later use.

### Workflow 2: Update App Metadata

There are two layers of localization to distinguish:

**Version-level localization** (per-version) — description, keywords, release notes:
```bash
node ${CLAUDE_SKILL_DIR}/scripts/asc-api.js update-localization <localizationId> \
  --description="App description" \
  --keywords="keyword1,keyword2" \
  --whatsNew="What's new in this version" \
  --promotionalText="Promotional text"
```

For long or multi-line content, write a JSON file and use `raw` with `@file.json`:
```bash
node ${CLAUDE_SKILL_DIR}/scripts/asc-api.js raw PATCH /v1/appStoreVersionLocalizations/<id> @/tmp/body.json
```

**App-level localization** (shared across versions) — name, subtitle, privacy URL:
```bash
# Get appInfoId
node ${CLAUDE_SKILL_DIR}/scripts/asc-api.js get-app-info <appId>

# List localizations
node ${CLAUDE_SKILL_DIR}/scripts/asc-api.js get-app-info-localizations <appInfoId>

# Update existing
node ${CLAUDE_SKILL_DIR}/scripts/asc-api.js update-app-info-localization <locId> \
  --name="App Name" --subtitle="Subtitle" --privacyPolicyUrl="https://..."

# Create new locale
node ${CLAUDE_SKILL_DIR}/scripts/asc-api.js create-app-info-localization <appInfoId> zh-Hans \
  --name="应用名" --subtitle="副标题"
```

**Important limits**: keywords max 100 characters, promotional text max 170 characters, subtitle max 30 characters, description max 4000 characters.

### Workflow 3: Age Rating

```bash
# Get current rating
node ${CLAUDE_SKILL_DIR}/scripts/asc-api.js get-age-rating <versionId>

# Update (values: NONE / INFREQUENT_OR_MILD / FREQUENT_OR_INTENSE)
node ${CLAUDE_SKILL_DIR}/scripts/asc-api.js update-age-rating <declarationId> \
  --violenceCartoonOrFantasy=NONE \
  --sexualContentOrNudity=NONE \
  --gamblingSimulated=NONE \
  --horrorOrFearThemes=NONE \
  --matureOrSuggestiveThemes=NONE \
  --profanityOrCrudeHumor=NONE \
  --alcoholTobaccoOrDrugUseOrReferences=NONE
```

### Workflow 4: Review Information

```bash
# Get current review detail
node ${CLAUDE_SKILL_DIR}/scripts/asc-api.js get-review-detail <versionId>

# Update (all contact fields are required together)
node ${CLAUDE_SKILL_DIR}/scripts/asc-api.js update-review-detail <detailId> \
  --contactFirstName="First" --contactLastName="Last" \
  --contactPhone="+1234567890" --contactEmail="email@example.com" \
  --demoAccountRequired=false --notes="Review notes"
```

If review detail doesn't exist (404), use `create-review-detail <versionId>` with the same flags.

### Workflow 5: Screenshot Management

```bash
# List existing screenshot sets
node ${CLAUDE_SKILL_DIR}/scripts/asc-api.js get-screenshot-sets <localizationId>

# Create a screenshot set for a device type
node ${CLAUDE_SKILL_DIR}/scripts/asc-api.js create-screenshot-set <localizationId> APP_IPHONE_67

# Upload a screenshot (handles reserve → upload → commit automatically)
node ${CLAUDE_SKILL_DIR}/scripts/asc-api.js upload-screenshot <setId> /path/to/screenshot.png

# Delete a screenshot
node ${CLAUDE_SKILL_DIR}/scripts/asc-api.js delete-screenshot <screenshotId>
```

Common display types: `APP_IPHONE_67` (6.7"), `APP_IPHONE_65` (6.5"), `APP_IPAD_PRO_3GEN_129` (12.9" iPad)

### Workflow 6: Create Version & Submit

```bash
# Create new version
node ${CLAUDE_SKILL_DIR}/scripts/asc-api.js create-version <appId> IOS 1.1

# Create localization for the version
node ${CLAUDE_SKILL_DIR}/scripts/asc-api.js create-localization <versionId> zh-Hans \
  --description="Description" --keywords="keywords"

# ... upload screenshots, set review info using workflows above ...

# Submit for review (irreversible — always confirm with user first!)
node ${CLAUDE_SKILL_DIR}/scripts/asc-api.js submit-for-review <versionId>
```

### Workflow 7: Raw API Call

For endpoints not built into the script, use `raw`:

```bash
# GET
node ${CLAUDE_SKILL_DIR}/scripts/asc-api.js raw GET /v1/apps

# POST/PATCH with inline JSON
node ${CLAUDE_SKILL_DIR}/scripts/asc-api.js raw PATCH /v1/appStoreVersionLocalizations/abc '{"data":{...}}'

# POST/PATCH with JSON file (recommended for complex bodies)
node ${CLAUDE_SKILL_DIR}/scripts/asc-api.js raw PATCH /v1/appStoreVersionLocalizations/abc @/tmp/body.json
```

See [api-endpoints.md](references/api-endpoints.md) for the full endpoint reference.

## Auto-Analyze iOS Project

When the user wants Connect metadata auto-filled, analyze the codebase to infer field values. This saves significant manual effort since most Connect fields can be derived from code.

### Step 1: Extract Basic Info

Read from the Xcode project:
1. **project.pbxproj** — Bundle ID, version, build number, deployment target, supported devices
2. **Info.plist / InfoPlist.xcstrings** — Display name, permission descriptions
3. **Assets.xcassets/AppIcon.appiconset** — Verify app icon readiness

### Step 2: Privacy & Permissions Analysis

1. Read all `NS*UsageDescription` keys from **Info.plist**
2. Check for **PrivacyInfo.xcprivacy**
3. Scan code for actual API usage:
   - `PHPhotoLibrary` → Photos
   - `CLLocationManager` → Location
   - `AVCaptureDevice` → Camera/Microphone
   - `CNContactStore` → Contacts
   - `HealthKit` → Health
4. Check **SPM dependencies** (Package.resolved / project.pbxproj) for third-party SDK privacy impact

See [privacy-mapping.md](references/privacy-mapping.md) for the permission-to-privacy-label mapping.

### Step 3: Generate Metadata

Based on analysis, generate:

| Field | Source |
|-------|--------|
| App Name / Subtitle | CFBundleDisplayName from InfoPlist.xcstrings |
| Description | README, CLAUDE.md, code comments |
| Keywords | App features, class names, UI strings |
| Privacy Declarations | Info.plist permissions + SDK analysis |
| Age Rating | App content type (no violence/gambling → 4+) |
| Data Collection | Permission usage + SDK data collection |

### Step 4: Confirm & Write

Present generated content to the user for review. After confirmation, write via API:
1. `list-apps` and `get-versions` to get required IDs
2. Update using Workflows 2-4 above
3. Print results after each write for user verification

## Important Notes

- **Rate limits**: ~3600 requests/hour. Monitor `X-Rate-Limit` header for batch operations.
- **Token lifetime**: JWT auto-generated per call, valid 19 minutes. No manual refresh needed.
- **Screenshot upload**: Each screenshot takes 3 API calls (reserve → upload → commit).
- **submit-for-review is irreversible**: Always confirm with the user before executing.
- **.p8 key security**: The private key can only be downloaded once from Apple. Keep it safe, never commit to Git.
- **Character limits**: keywords ≤ 100, subtitle ≤ 30, promotional text ≤ 170, description ≤ 4000.
