# Meta & Instagram Graph API Integration Guide

This document describes how to configure the official Meta Graph API v21.0 for **The Verdict Room Studio** to enable automated feed post and carousel publishing, readiness polling, and real-time insights synchronization.

---

## 1. Prerequisites

1. An **Instagram Professional Account** (Business or Creator account type). Personal accounts are **not supported** by the Meta Content Publishing API.
2. A **Facebook Page** linked to the Instagram Business Account where your Meta Developer account has admin management rights.
3. A **Meta Developer Account** registered at [developers.facebook.com](https://developers.facebook.com).

---

## 2. Step-by-Step Meta App Setup

### Step 1: Create a Meta Developer App
1. Go to [developers.facebook.com/apps](https://developers.facebook.com/apps).
2. Click **Create App**.
3. Select **Other** as the use case, then choose **Business** as the app type.
4. Name the application (e.g., `The Verdict Room Publishing`) and click **Create App**.

### Step 2: Add Instagram Products
1. In the App Dashboard, locate **Add Products to Your App**.
2. Add **Instagram Graph API**.
3. Add **Facebook Login for Business** (or Webhooks if comment auto-moderation is used).

### Step 3: Link Instagram Business Account to Facebook Page
1. Open your Facebook Page settings (via `web.facebook.com`).
2. Navigate to **Professional Dashboard -> Settings -> Linked Accounts -> Instagram**.
3. Click **Connect Account** and log in with `@theverdictroom`.
4. Ensure the connection status confirms "Page and Instagram Account Linked".

### Step 4: Required Graph API Permissions (Scopes)
When generating access tokens, grant the following scopes:
- `instagram_basic`: Reads profile data, media counts, and account ID.
- `instagram_content_publish`: Uploads single image containers, carousel containers, and publishes them.
- `instagram_manage_insights`: Fetches reach, impressions, shares, saves, and interaction metrics.
- `pages_show_list`: Discovers Facebook Pages connected to your Meta user.
- `pages_read_engagement`: Authorizes page token generation.

### Step 5: Generate a Permanent Page Access Token
Short-lived user tokens expire in 1-2 hours. To generate a permanent Page Token:
1. Open **Graph API Explorer** at [developers.facebook.com/tools/explorer](https://developers.facebook.com/tools/explorer).
2. Select your App, User Token, and grant the 5 scopes above.
3. Generate the User Token.
4. Convert to a Long-Lived Token using the Access Token Debugger:
   ```http
   GET https://graph.facebook.com/v21.0/oauth/access_token?
     grant_type=fb_exchange_token&
     client_id={YOUR_APP_ID}&
     client_secret={YOUR_APP_SECRET}&
     fb_exchange_token={SHORT_LIVED_TOKEN}
   ```
5. Use the long-lived token to request the permanent Page Token:
   ```http
   GET https://graph.facebook.com/v21.0/me/accounts?access_token={LONG_LIVED_TOKEN}
   ```
6. Copy the `access_token` returned in the response for your connected Page. This token does **not expire** unless the user revokes permissions or changes passwords.

### Step 6: Find Your Instagram Business Account ID
Query:
```http
GET https://graph.facebook.com/v21.0/{YOUR_PAGE_ID}?fields=instagram_business_account&access_token={PAGE_ACCESS_TOKEN}
```
Copy the 17-digit `id` returned under `instagram_business_account`.

---

## 3. Environment Variable Configuration

Paste the values into your `.env` file:
```ini
INSTAGRAM_ACCESS_TOKEN=EAAG...
INSTAGRAM_ACCOUNT_ID=17841400293849201
INSTAGRAM_HANDLE=@theverdictroom
META_GRAPH_VERSION=v21.0
```
Or configure them dynamically in the studio under **Instagram / Meta API** section.

---

## 4. API Endpoints Used by The Verdict Room

### 1. Single Image Publishing Container
```http
POST https://graph.facebook.com/v21.0/{ACCOUNT_ID}/media
  ?image_url={PUBLIC_HTTPS_IMAGE_URL}
  &caption={CAPTION_WITH_HASHTAGS}
  &access_token={ACCESS_TOKEN}
```

### 2. Readiness Polling
```http
GET https://graph.facebook.com/v21.0/{CONTAINER_ID}
  ?fields=status_code
  &access_token={ACCESS_TOKEN}
```
*Expected values: `FINISHED`, `IN_PROGRESS`, `ERROR`.*

### 3. Media Publish Dispatch
```http
POST https://graph.facebook.com/v21.0/{ACCOUNT_ID}/media_publish
  ?creation_id={CONTAINER_ID}
  &access_token={ACCESS_TOKEN}
```

### 4. Multi-Slide Carousel Flow
1. Create child items:
   ```http
   POST https://graph.facebook.com/v21.0/{ACCOUNT_ID}/media
     ?image_url={SLIDE_IMAGE_URL}
     &is_carousel_item=true
     &access_token={ACCESS_TOKEN}
   ```
2. Create parent container:
   ```http
   POST https://graph.facebook.com/v21.0/{ACCOUNT_ID}/media
     ?media_type=CAROUSEL
     &children={CHILD_ID_1},{CHILD_ID_2},...
     &caption={CAPTION}
     &access_token={ACCESS_TOKEN}
   ```
3. Poll parent container until `FINISHED`, then publish via `/media_publish`.

---

## 5. Rate Limits & Account Protection Guardrails

The Verdict Room includes built-in safeguards:
- **5-Minute Minimum Spacing**: Routine automated posts have a mandatory 300-second throttle to avoid Instagram spam filters.
- **Daily Publication Limit**: Configurable target (default: 5 feed posts per day).
- **Safe Mock Mode**: Automatically active when placeholders or development keys are present. Prevents false publications.
- **Emergency Stop**: Instantly pauses all dispatch jobs if Meta returns permission or rate-limit warnings.
