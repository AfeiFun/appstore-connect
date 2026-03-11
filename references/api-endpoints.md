# App Store Connect API Endpoint Reference

## Base URL

```
https://api.appstoreconnect.apple.com
```

## Apps

| Action | Method | Path |
|--------|--------|------|
| List all apps | GET | `/v1/apps` |
| Get an app | GET | `/v1/apps/{id}` |

## Versions

| Action | Method | Path |
|--------|--------|------|
| List versions | GET | `/v1/apps/{id}/appStoreVersions` |
| Create version | POST | `/v1/appStoreVersions` |
| Update version | PATCH | `/v1/appStoreVersions/{id}` |
| Submit for review | POST | `/v1/appStoreVersionSubmissions` |

## Version Localizations (description, keywords, screenshots, etc.)

| Action | Method | Path |
|--------|--------|------|
| List localizations | GET | `/v1/appStoreVersions/{id}/appStoreVersionLocalizations` |
| Create localization | POST | `/v1/appStoreVersionLocalizations` |
| Update localization | PATCH | `/v1/appStoreVersionLocalizations/{id}` |

**Editable fields**: `description`, `keywords`, `marketingUrl`, `promotionalText`, `supportUrl`, `whatsNew`

## App Info (app-level metadata)

| Action | Method | Path |
|--------|--------|------|
| Get app info | GET | `/v1/apps/{id}/appInfos` |
| Get info localizations | GET | `/v1/appInfos/{id}/appInfoLocalizations` |
| Create info localization | POST | `/v1/appInfoLocalizations` |
| Update info localization | PATCH | `/v1/appInfoLocalizations/{id}` |

**Editable fields**: `name`, `subtitle`, `privacyPolicyUrl`, `privacyChoicesUrl`, `privacyPolicyText`

## Age Rating

| Action | Method | Path |
|--------|--------|------|
| Get age rating | GET | `/v1/appStoreVersions/{id}/ageRatingDeclaration` |
| Update age rating | PATCH | `/v1/ageRatingDeclarations/{id}` |

**Fields (values: NONE / INFREQUENT_OR_MILD / FREQUENT_OR_INTENSE)**:
- `alcoholTobaccoOrDrugUseOrReferences`
- `contests`
- `gambling`
- `gamblingSimulated`
- `horrorOrFearThemes`
- `matureOrSuggestiveThemes`
- `medicalOrTreatmentInformation`
- `profanityOrCrudeHumor`
- `sexualContentGraphicAndNudity`
- `sexualContentOrNudity`
- `violenceCartoonOrFantasy`
- `violenceRealistic`
- `violenceRealisticProlonged`
- `kidsAgeBand` (null / FIVE_AND_UNDER / SIX_TO_EIGHT / NINE_TO_ELEVEN)
- `seventeenPlus` (boolean)
- `unrestrictedWebAccess` (boolean)

## Review Information

| Action | Method | Path |
|--------|--------|------|
| Get review detail | GET | `/v1/appStoreVersions/{id}/appStoreReviewDetail` |
| Create review detail | POST | `/v1/appStoreReviewDetails` |
| Update review detail | PATCH | `/v1/appStoreReviewDetails/{id}` |

**Editable fields**: `contactFirstName`, `contactLastName`, `contactPhone`, `contactEmail`, `demoAccountName`, `demoAccountPassword`, `demoAccountRequired`, `notes`

## Screenshots

| Action | Method | Path |
|--------|--------|------|
| Get screenshot sets | GET | `/v1/appStoreVersionLocalizations/{id}/appScreenshotSets` |
| Create screenshot set | POST | `/v1/appScreenshotSets` |
| Reserve screenshot | POST | `/v1/appScreenshots` |
| Commit screenshot | PATCH | `/v1/appScreenshots/{id}` |
| Delete screenshot | DELETE | `/v1/appScreenshots/{id}` |

**Common screenshotDisplayType values**:
- `APP_IPHONE_67` — iPhone 6.7" (Pro Max)
- `APP_IPHONE_65` — iPhone 6.5"
- `APP_IPHONE_61` — iPhone 6.1"
- `APP_IPAD_PRO_3GEN_129` — iPad Pro 12.9"
- `APP_IPAD_PRO_3GEN_11` — iPad Pro 11"

## Query Parameters

- `fields[type]=f1,f2` — Limit returned fields
- `filter[key]=value` — Filter results
- `include=relationship` — Include related objects
- `limit=N` — Limit number of results (max 200)
- `sort=field` — Sort results (prefix `-` for descending)

## Rate Limits

- ~3600 requests/hour
- Check `X-Rate-Limit` response header
- Returns HTTP 429 when exceeded
