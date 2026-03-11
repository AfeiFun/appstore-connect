#!/usr/bin/env node

/**
 * App Store Connect API Client
 * Zero-dependency CLI for managing App Store Connect via REST API.
 * Uses Node.js built-in crypto for ES256 JWT generation.
 *
 * Usage:
 *   node asc-api.js <command> [options]
 *
 * Commands:
 *   test-auth                              Test API authentication
 *   list-apps                              List all apps
 *   get-app <appId>                        Get app details
 *   get-versions <appId>                   List app versions
 *   create-version <appId> <platform> <version>  Create a new version
 *   get-localizations <versionId>          List version localizations
 *   update-localization <locId> --field=value     Update version localization
 *   create-localization <versionId> <locale> --field=value  Create version localization
 *   get-app-info <appId>                   Get app info (with localizations)
 *   get-app-info-localizations <appInfoId> List app info localizations
 *   update-app-info-localization <locId> --field=value  Update app info localization
 *   create-app-info-localization <appInfoId> <locale> --field=value  Create app info localization
 *   get-age-rating <versionId>             Get age rating declaration
 *   update-age-rating <declarationId> --field=value  Update age rating
 *   get-review-detail <versionId>          Get review detail
 *   update-review-detail <detailId> --field=value  Update review detail
 *   create-review-detail <versionId> --field=value  Create review detail
 *   get-screenshot-sets <locId>            List screenshot sets
 *   create-screenshot-set <locId> <displayType>  Create screenshot set
 *   upload-screenshot <setId> <filePath>   Upload a screenshot
 *   delete-screenshot <screenshotId>       Delete a screenshot
 *   submit-for-review <versionId>          Submit version for review
 *   raw <method> <path> [jsonBody]         Raw API call (supports @file.json)
 *
 * Environment Variables:
 *   ASC_ISSUER_ID        - App Store Connect Issuer ID
 *   ASC_KEY_ID           - API Key ID
 *   ASC_PRIVATE_KEY_PATH - Path to .p8 private key file
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ============================================================
// JWT Token Generation (ES256)
// ============================================================

function generateJWT() {
  const issuerId = process.env.ASC_ISSUER_ID;
  const keyId = process.env.ASC_KEY_ID;
  const privateKeyPath = process.env.ASC_PRIVATE_KEY_PATH;

  if (!issuerId || !keyId || !privateKeyPath) {
    console.error(JSON.stringify({
      error: 'Missing environment variables',
      required: ['ASC_ISSUER_ID', 'ASC_KEY_ID', 'ASC_PRIVATE_KEY_PATH'],
      hint: 'Run /appstore-connect to set up credentials, or configure them in ~/.zshrc'
    }));
    process.exit(1);
  }

  const resolvedPath = privateKeyPath.replace(/^~/, process.env.HOME);
  if (!fs.existsSync(resolvedPath)) {
    console.error(JSON.stringify({
      error: `Private key file not found: ${resolvedPath}`,
      hint: 'Check ASC_PRIVATE_KEY_PATH environment variable'
    }));
    process.exit(1);
  }

  const privateKey = fs.readFileSync(resolvedPath, 'utf8');
  const now = Math.floor(Date.now() / 1000);

  const header = { alg: 'ES256', kid: keyId, typ: 'JWT' };
  // Token valid for 19 minutes (Apple max is 20, leaving 1 min buffer)
  const payload = { iss: issuerId, iat: now, exp: now + 19 * 60, aud: 'appstoreconnect-v1' };

  const encHeader = base64url(JSON.stringify(header));
  const encPayload = base64url(JSON.stringify(payload));
  const signingInput = `${encHeader}.${encPayload}`;

  const sign = crypto.createSign('SHA256');
  sign.update(signingInput);
  const signature = sign.sign(privateKey);

  // ES256 signature is DER-encoded, convert to raw R+S format for JWT
  const rawSig = derToRaw(signature);
  return `${signingInput}.${base64url(rawSig)}`;
}

function base64url(input) {
  const buf = typeof input === 'string' ? Buffer.from(input) : input;
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function derToRaw(derSig) {
  // DER format: 30 <len> 02 <rLen> <R> 02 <sLen> <S>
  let offset = 2;
  if (derSig[1] & 0x80) offset += (derSig[1] & 0x7f);

  offset += 1; // skip 02
  const rLen = derSig[offset]; offset += 1;
  let r = derSig.subarray(offset, offset + rLen); offset += rLen;

  offset += 1; // skip 02
  const sLen = derSig[offset]; offset += 1;
  let s = derSig.subarray(offset, offset + sLen);

  // Strip leading zero padding
  if (r.length === 33 && r[0] === 0) r = r.subarray(1);
  if (s.length === 33 && s[0] === 0) s = s.subarray(1);

  // Pad to 32 bytes each
  const raw = Buffer.alloc(64);
  r.copy(raw, 32 - r.length);
  s.copy(raw, 64 - s.length);
  return raw;
}

// ============================================================
// API Client
// ============================================================

const BASE_URL = 'https://api.appstoreconnect.apple.com';

async function apiCall(method, apiPath, body = null) {
  const token = generateJWT();
  const url = apiPath.startsWith('http') ? apiPath : `${BASE_URL}${apiPath}`;

  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  if (body && (method === 'POST' || method === 'PATCH')) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (response.status === 204) {
    return { success: true, status: 204 };
  }

  const data = await response.json();

  if (!response.ok) {
    const rateLimit = response.headers.get('x-rate-limit');
    console.error(JSON.stringify({
      error: `API error (${response.status})`,
      details: data.errors || data,
      rateLimit,
    }, null, 2));
    process.exit(1);
  }

  return data;
}

// ============================================================
// Commands
// ============================================================

async function testAuth() {
  const data = await apiCall('GET', '/v1/apps?limit=1');
  console.log(JSON.stringify({
    success: true,
    message: 'Authentication successful',
    appCount: data.meta?.paging?.total || 'unknown',
  }, null, 2));
}

async function listApps() {
  const data = await apiCall('GET', '/v1/apps?fields[apps]=name,bundleId,sku,primaryLocale');
  console.log(JSON.stringify(data, null, 2));
}

async function getApp(appId) {
  const data = await apiCall('GET', `/v1/apps/${appId}?include=appInfos,appStoreVersions`);
  console.log(JSON.stringify(data, null, 2));
}

async function getVersions(appId) {
  const data = await apiCall('GET',
    `/v1/apps/${appId}/appStoreVersions?fields[appStoreVersions]=versionString,appStoreState,platform,createdDate&limit=10`
  );
  console.log(JSON.stringify(data, null, 2));
}

async function createVersion(appId, platform, versionString) {
  const body = {
    data: {
      type: 'appStoreVersions',
      attributes: { versionString, platform },
      relationships: { app: { data: { type: 'apps', id: appId } } }
    }
  };
  const data = await apiCall('POST', '/v1/appStoreVersions', body);
  console.log(JSON.stringify(data, null, 2));
}

async function getLocalizations(versionId) {
  const data = await apiCall('GET',
    `/v1/appStoreVersions/${versionId}/appStoreVersionLocalizations`
  );
  console.log(JSON.stringify(data, null, 2));
}

async function updateLocalization(locId, fields) {
  const body = { data: { type: 'appStoreVersionLocalizations', id: locId, attributes: fields } };
  const data = await apiCall('PATCH', `/v1/appStoreVersionLocalizations/${locId}`, body);
  console.log(JSON.stringify(data, null, 2));
}

async function createLocalization(versionId, locale, fields) {
  const body = {
    data: {
      type: 'appStoreVersionLocalizations',
      attributes: { locale, ...fields },
      relationships: { appStoreVersion: { data: { type: 'appStoreVersions', id: versionId } } }
    }
  };
  const data = await apiCall('POST', '/v1/appStoreVersionLocalizations', body);
  console.log(JSON.stringify(data, null, 2));
}

async function getAppInfo(appId) {
  const data = await apiCall('GET', `/v1/apps/${appId}/appInfos?include=appInfoLocalizations`);
  console.log(JSON.stringify(data, null, 2));
}

async function getAppInfoLocalizations(appInfoId) {
  const data = await apiCall('GET', `/v1/appInfos/${appInfoId}/appInfoLocalizations`);
  console.log(JSON.stringify(data, null, 2));
}

async function updateAppInfoLocalization(locId, fields) {
  const body = { data: { type: 'appInfoLocalizations', id: locId, attributes: fields } };
  const data = await apiCall('PATCH', `/v1/appInfoLocalizations/${locId}`, body);
  console.log(JSON.stringify(data, null, 2));
}

async function createAppInfoLocalization(appInfoId, locale, fields) {
  const body = {
    data: {
      type: 'appInfoLocalizations',
      attributes: { locale, ...fields },
      relationships: { appInfo: { data: { type: 'appInfos', id: appInfoId } } }
    }
  };
  const data = await apiCall('POST', '/v1/appInfoLocalizations', body);
  console.log(JSON.stringify(data, null, 2));
}

async function getAgeRating(versionId) {
  const data = await apiCall('GET', `/v1/appStoreVersions/${versionId}/ageRatingDeclaration`);
  console.log(JSON.stringify(data, null, 2));
}

async function updateAgeRating(declarationId, fields) {
  const body = { data: { type: 'ageRatingDeclarations', id: declarationId, attributes: fields } };
  const data = await apiCall('PATCH', `/v1/ageRatingDeclarations/${declarationId}`, body);
  console.log(JSON.stringify(data, null, 2));
}

async function getReviewDetail(versionId) {
  const data = await apiCall('GET', `/v1/appStoreVersions/${versionId}/appStoreReviewDetail`);
  console.log(JSON.stringify(data, null, 2));
}

async function updateReviewDetail(detailId, fields) {
  const body = { data: { type: 'appStoreReviewDetails', id: detailId, attributes: fields } };
  const data = await apiCall('PATCH', `/v1/appStoreReviewDetails/${detailId}`, body);
  console.log(JSON.stringify(data, null, 2));
}

async function createReviewDetail(versionId, fields) {
  const body = {
    data: {
      type: 'appStoreReviewDetails',
      attributes: fields,
      relationships: { appStoreVersion: { data: { type: 'appStoreVersions', id: versionId } } }
    }
  };
  const data = await apiCall('POST', '/v1/appStoreReviewDetails', body);
  console.log(JSON.stringify(data, null, 2));
}

async function getScreenshotSets(locId) {
  const data = await apiCall('GET',
    `/v1/appStoreVersionLocalizations/${locId}/appScreenshotSets?include=appScreenshots`
  );
  console.log(JSON.stringify(data, null, 2));
}

async function createScreenshotSet(locId, displayType) {
  const body = {
    data: {
      type: 'appScreenshotSets',
      attributes: { screenshotDisplayType: displayType },
      relationships: {
        appStoreVersionLocalization: { data: { type: 'appStoreVersionLocalizations', id: locId } }
      }
    }
  };
  const data = await apiCall('POST', '/v1/appScreenshotSets', body);
  console.log(JSON.stringify(data, null, 2));
}

async function uploadScreenshot(setId, filePath) {
  const resolvedPath = filePath.replace(/^~/, process.env.HOME);
  if (!fs.existsSync(resolvedPath)) {
    console.error(JSON.stringify({ error: `File not found: ${resolvedPath}` }));
    process.exit(1);
  }

  const fileBuffer = fs.readFileSync(resolvedPath);
  const fileName = path.basename(resolvedPath);
  const fileSize = fileBuffer.length;

  // Step 1: Reserve screenshot slot
  const reserveBody = {
    data: {
      type: 'appScreenshots',
      attributes: { fileName, fileSize },
      relationships: { appScreenshotSet: { data: { type: 'appScreenshotSets', id: setId } } }
    }
  };
  const reserveData = await apiCall('POST', '/v1/appScreenshots', reserveBody);
  const screenshotId = reserveData.data.id;
  const uploadOps = reserveData.data.attributes.uploadOperations;

  // Step 2: Upload chunks to Apple's storage
  for (const op of uploadOps) {
    const headers = {};
    for (const h of op.requestHeaders) headers[h.name] = h.value;

    const chunk = fileBuffer.subarray(op.offset, op.offset + op.length);
    const uploadRes = await fetch(op.url, { method: op.method, headers, body: chunk });

    if (!uploadRes.ok) {
      console.error(JSON.stringify({ error: `Upload chunk failed: ${uploadRes.status}` }));
      process.exit(1);
    }
  }

  // Step 3: Commit upload
  const commitBody = {
    data: {
      type: 'appScreenshots',
      id: screenshotId,
      attributes: {
        uploaded: true,
        sourceFileChecksum: crypto.createHash('md5').update(fileBuffer).digest('hex'),
      }
    }
  };
  const commitData = await apiCall('PATCH', `/v1/appScreenshots/${screenshotId}`, commitBody);
  console.log(JSON.stringify({ success: true, screenshotId, fileName, fileSize, data: commitData }, null, 2));
}

async function deleteScreenshot(screenshotId) {
  const data = await apiCall('DELETE', `/v1/appScreenshots/${screenshotId}`);
  console.log(JSON.stringify({ success: true, deleted: screenshotId, ...data }, null, 2));
}

async function submitForReview(versionId) {
  const body = {
    data: {
      type: 'appStoreVersionSubmissions',
      relationships: { appStoreVersion: { data: { type: 'appStoreVersions', id: versionId } } }
    }
  };
  const data = await apiCall('POST', '/v1/appStoreVersionSubmissions', body);
  console.log(JSON.stringify(data, null, 2));
}

async function rawCall(method, apiPath, jsonBodyOrFile) {
  let body = null;
  if (jsonBodyOrFile) {
    // Support @file.json syntax for reading body from file
    if (jsonBodyOrFile.startsWith('@')) {
      const filePath = jsonBodyOrFile.slice(1).replace(/^~/, process.env.HOME);
      body = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } else {
      body = JSON.parse(jsonBodyOrFile);
    }
  }
  const data = await apiCall(method, apiPath, body);
  console.log(JSON.stringify(data, null, 2));
}

// ============================================================
// CLI Argument Parser
// ============================================================

function parseFlags(args) {
  const fields = {};
  for (const arg of args) {
    const match = arg.match(/^--([a-zA-Z_]\w*)=(.*)$/);
    if (match) {
      const [, key, val] = match;
      // Handle booleans
      if (val === 'true') fields[key] = true;
      else if (val === 'false') fields[key] = false;
      // Handle numbers (only pure integers/decimals)
      else if (/^\d+(\.\d+)?$/.test(val)) fields[key] = Number(val);
      else fields[key] = val;
    }
  }
  return fields;
}

function printHelp() {
  const help = `
App Store Connect API Client
Zero-dependency CLI for managing App Store Connect.

USAGE
  node asc-api.js <command> [arguments] [--flags]

COMMANDS
  Auth
    test-auth                                     Test API connection

  Apps
    list-apps                                     List all apps
    get-app <appId>                               Get app details with relationships

  Versions
    get-versions <appId>                          List versions (newest first)
    create-version <appId> <IOS|MACOS> <version>  Create a new app store version

  Version Localizations (per-version: description, keywords, whatsNew)
    get-localizations <versionId>                 List all localizations for a version
    update-localization <locId> --field=value      Update localization fields
    create-localization <versionId> <locale> --field=value  Create a new localization

  App Info Localizations (cross-version: name, subtitle, privacyPolicyUrl)
    get-app-info <appId>                          Get app info with localizations
    get-app-info-localizations <appInfoId>        List app info localizations
    update-app-info-localization <locId> --field=value  Update app info localization
    create-app-info-localization <appInfoId> <locale> --field=value  Create app info localization

  Age Rating
    get-age-rating <versionId>                    Get age rating declaration
    update-age-rating <declarationId> --field=value  Update age rating fields

  Review
    get-review-detail <versionId>                 Get review detail
    update-review-detail <detailId> --field=value  Update review detail
    create-review-detail <versionId> --field=value  Create review detail

  Screenshots
    get-screenshot-sets <locId>                   List screenshot sets
    create-screenshot-set <locId> <displayType>   Create screenshot set
    upload-screenshot <setId> <filePath>           Upload a screenshot file
    delete-screenshot <screenshotId>              Delete a screenshot

  Submission
    submit-for-review <versionId>                 Submit version for App Review

  Advanced
    raw <GET|POST|PATCH|DELETE> <path> [body]     Raw API call
                                                  Body can be JSON string or @file.json

ENVIRONMENT
  ASC_ISSUER_ID         App Store Connect Issuer ID
  ASC_KEY_ID            API Key ID
  ASC_PRIVATE_KEY_PATH  Path to AuthKey_XXXX.p8 private key file

EXAMPLES
  node asc-api.js test-auth
  node asc-api.js list-apps
  node asc-api.js get-versions 6760102246
  node asc-api.js update-localization abc123 --description="New description" --keywords="a,b,c"
  node asc-api.js raw PATCH /v1/appInfoLocalizations/abc @/tmp/body.json
  node asc-api.js upload-screenshot setId123 ~/screenshots/home.png
`.trim();

  console.log(help);
}

// ============================================================
// Main
// ============================================================

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === '--help' || command === '-h' || command === 'help') {
    printHelp();
    process.exit(command ? 0 : 1);
  }

  switch (command) {
    case 'test-auth': return testAuth();
    case 'list-apps': return listApps();
    case 'get-app': return getApp(args[1]);
    case 'get-versions': return getVersions(args[1]);
    case 'create-version': return createVersion(args[1], args[2], args[3]);
    case 'get-localizations': return getLocalizations(args[1]);
    case 'update-localization': return updateLocalization(args[1], parseFlags(args.slice(2)));
    case 'create-localization': return createLocalization(args[1], args[2], parseFlags(args.slice(3)));
    case 'get-app-info': return getAppInfo(args[1]);
    case 'get-app-info-localizations': return getAppInfoLocalizations(args[1]);
    case 'update-app-info-localization': return updateAppInfoLocalization(args[1], parseFlags(args.slice(2)));
    case 'create-app-info-localization': return createAppInfoLocalization(args[1], args[2], parseFlags(args.slice(3)));
    case 'get-age-rating': return getAgeRating(args[1]);
    case 'update-age-rating': return updateAgeRating(args[1], parseFlags(args.slice(2)));
    case 'get-review-detail': return getReviewDetail(args[1]);
    case 'update-review-detail': return updateReviewDetail(args[1], parseFlags(args.slice(2)));
    case 'create-review-detail': return createReviewDetail(args[1], parseFlags(args.slice(2)));
    case 'get-screenshot-sets': return getScreenshotSets(args[1]);
    case 'create-screenshot-set': return createScreenshotSet(args[1], args[2]);
    case 'upload-screenshot': return uploadScreenshot(args[1], args[2]);
    case 'delete-screenshot': return deleteScreenshot(args[1]);
    case 'submit-for-review': return submitForReview(args[1]);
    case 'raw': return rawCall(args[1], args[2], args[3]);
    default:
      console.error(`Unknown command: ${command}\nRun with --help for usage.`);
      process.exit(1);
  }
}

main().catch(err => {
  console.error(JSON.stringify({ error: err.message, stack: err.stack?.split('\n').slice(0, 3) }));
  process.exit(1);
});
