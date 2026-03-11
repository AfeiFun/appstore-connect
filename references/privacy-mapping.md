# iOS Permissions → App Store Privacy Label Mapping

## Info.plist Permissions → Data Collection Types

| Info.plist Key | Data Type | Purpose |
|---------------|-----------|---------|
| NSPhotoLibraryUsageDescription | Photos or Videos | App Functionality |
| NSPhotoLibraryAddUsageDescription | Photos or Videos | App Functionality |
| NSCameraUsageDescription | Photos or Videos | App Functionality |
| NSMicrophoneUsageDescription | Audio Data | App Functionality |
| NSLocationWhenInUseUsageDescription | Precise Location | App Functionality |
| NSLocationAlwaysUsageDescription | Precise Location | App Functionality |
| NSContactsUsageDescription | Contacts | App Functionality |
| NSCalendarsUsageDescription | — | Usually not considered data collection |
| NSFaceIDUsageDescription | — | Not data collection (local processing) |
| NSHealthShareUsageDescription | Health | App Functionality |
| NSMotionUsageDescription | — | Usually not considered data collection |

## Common SDKs → Privacy Impact

### RevenueCat
- **Data collected**: Purchase History, Product Interaction
- **Purpose**: App Functionality
- **Linked to user**: Yes (for subscription management)
- **Used for tracking**: No

### Firebase Analytics
- **Data collected**: Product Interaction, Advertising Data, Device ID
- **Purpose**: Analytics, Developer's Advertising
- **Linked to user**: Possibly
- **Used for tracking**: Possibly

### SDWebImage / SDWebImageSwiftUI
- **Data collected**: None (local caching only)
- **Privacy impact**: No direct privacy impact

### Supabase (self-hosted backend)
- **Data collected**: Depends on your implementation
- **Common**: User ID, Email, Usage Data
- **Purpose**: App Functionality

## Age Rating Auto-Inference Rules

| App Characteristics | Suggested Age Rating |
|--------------------|---------------------|
| No IAP, no user content | 4+ |
| Has IAP (subscriptions/consumables) | 4+ (IAP doesn't affect age rating) |
| User-generated content (unfiltered) | 12+ or 17+ |
| Mild horror/fantasy violence | 9+ |
| Simulated gambling | 12+ |
| Frequent/intense mature content | 17+ |
| Unrestricted web access | 17+ |

## App Store Privacy Label Categories

### Data Types

**Contact Info**
- Name, Email Address, Phone Number, Physical Address, Other User Contact Info

**Health & Fitness**
- Health, Fitness

**Financial Info**
- Payment Info, Credit Info, Other Financial Info

**Location**
- Precise Location, Coarse Location

**Sensitive Info**
- Sensitive Info

**Contacts**
- Contacts

**User Content**
- Emails or Text Messages, Photos or Videos, Audio Data, Gameplay Content, Customer Support, Other User Content

**Browsing History**
- Browsing History

**Search History**
- Search History

**Identifiers**
- User ID, Device ID

**Purchases**
- Purchase History

**Usage Data**
- Product Interaction, Advertising Data, Other Usage Data

**Diagnostics**
- Crash Data, Performance Data, Other Diagnostic Data

### Data Purposes

- **Third-Party Advertising**: Used to display third-party ads
- **Developer's Advertising**: Used to display first-party ads
- **Analytics**: Used for analytics
- **Product Personalization**: Used for personalization
- **App Functionality**: Required for core app functionality
- **Other Purposes**: Other purposes
