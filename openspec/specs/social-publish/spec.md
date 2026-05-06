## ADDED Requirements

### Requirement: User can connect a social account from the ShareModal
The `ShareModal` SHALL display a "Conectar cuenta" button for each supported platform (LinkedIn, Facebook, Instagram, Pinterest). Clicking the button SHALL initiate a server-side OAuth 2.0 flow by opening `GET /social/:platform/connect` in a popup window. On successful OAuth callback, the popup SHALL close and the ShareModal SHALL reflect the connected state.

Supported platforms: `linkedin`, `facebook`, `instagram`, `pinterest`

#### Scenario: Connect button is shown for each platform
- **WHEN** the ShareModal is open
- **THEN** "Conectar cuenta" buttons are visible for LinkedIn, Facebook, Instagram, and Pinterest

#### Scenario: Clicking connect opens OAuth popup
- **WHEN** the user clicks "Conectar cuenta" for LinkedIn
- **THEN** a popup window opens to `GET /social/linkedin/connect` and the browser redirects to LinkedIn's OAuth authorization page

#### Scenario: Popup closes and state updates on successful auth
- **WHEN** the OAuth flow completes successfully and the server stores the token
- **THEN** the popup closes, the ShareModal shows "Conectado" for that platform, and "Compartir ahora" becomes available

### Requirement: API exposes OAuth connect and callback endpoints
The API SHALL expose `GET /social/:platform/connect` and `GET /social/:platform/callback` for all four platforms. The connect endpoint SHALL build the `redirect_uri` using the `API_URL` environment variable (not `API_BASE_URL`). Platform config (authUrl, tokenUrl, scopes, client credential env var names) is defined in `src/social/social-oauth.config.ts` and shared between the controller and token service.

Supported platforms and required scopes:
- `linkedin`: `w_member_social`, `r_liteprofile`
- `facebook`: `pages_manage_posts`, `pages_read_engagement`
- `instagram`: `instagram_content_publish`, `instagram_basic` (requires Meta App Review)
- `pinterest`: `boards:read`, `pins:write`

#### Scenario: Connect endpoint uses API_URL for redirect_uri
- **WHEN** `GET /social/linkedin/connect` is called
- **THEN** the `redirect_uri` in the OAuth request is `${API_URL}/social/linkedin/callback`

#### Scenario: Callback stores token and closes popup
- **WHEN** `GET /social/linkedin/callback?code=<code>&state=<state>` is called with a valid code
- **THEN** the server exchanges the code for tokens, stores them encrypted in Redis under `social:tokens:{userId}:linkedin`, and returns an HTML page that calls `window.close()`

#### Scenario: Callback rejects mismatched state
- **WHEN** the `state` parameter does not match the stored CSRF token
- **THEN** the response is HTTP 400 and no token is stored

### Requirement: Token storage is server-side and encrypted
The `SocialTokenService` stores OAuth tokens in Redis encrypted with AES-256-CBC using `SOCIAL_TOKEN_SECRET`. Keys: `social:tokens:{userId}:{platform}` (access token, TTL = expiresAt) and `social:tokens:{userId}:{platform}:refresh` (60-day TTL). The token refresh method performs a real `grant_type=refresh_token` HTTP call to the platform's token endpoint using credentials from `social-oauth.config.ts`. If the refresh fails, the original (non-expired) token is returned as fallback.

#### Scenario: SocialTokenService refreshes expired access token automatically
- **WHEN** `getToken(userId, platform)` is called and the access token expires within 5 minutes
- **THEN** the service calls the platform token endpoint with `grant_type=refresh_token`, stores the new tokens in Redis, and returns the refreshed token

#### Scenario: Refresh failure falls back to original token
- **WHEN** the platform refresh endpoint returns a non-200 response
- **THEN** `getToken` logs a warning and returns the original (still-valid) token

### Requirement: User can publish a generated card directly to a connected social platform
The API SHALL expose `POST /social/:platform/publish` (JWT-protected) accepting `{ imageUrl, caption? }`. It downloads the PNG from the presigned URL, uploads to the platform's media API, and returns `{ postUrl }`.

#### Scenario: Successful LinkedIn publish returns post URL
- **WHEN** `POST /social/linkedin/publish` is called with a valid imageUrl and connected account
- **THEN** returns `{ "postUrl": "https://www.linkedin.com/feed/..." }`

#### Scenario: Successful Pinterest publish returns pin URL
- **WHEN** `POST /social/pinterest/publish` is called with a valid imageUrl
- **THEN** returns `{ "postUrl": "https://www.pinterest.com/pin/..." }`

#### Scenario: Instagram publish blocked without App Review
- **WHEN** `INSTAGRAM_PUBLISH_ENABLED=false`
- **THEN** the response is HTTP 503 with `{ "error": "instagram_publish_unavailable" }`

#### Scenario: Publish with no connected account returns 401
- **WHEN** `POST /social/:platform/publish` is called for an unconnected platform
- **THEN** the response is HTTP 401 with `{ "error": "account_not_connected" }`

### Requirement: ShareModal offers "Compartir ahora" for connected platforms
The `ShareModal` shows "Compartir ahora" for connected platforms. The `SharePlatform` type is `'linkedin' | 'instagram' | 'facebook' | 'pinterest'`. `ShareFormat` values: `ig-post`, `ig-story`, `reel`, `fb-post`, `fb-story`, `li-post`, `pin-post`, `pin-square`. WhatsApp formats (`wa-pic`, `wa-story`) and `twitter-card` have been removed.

## REMOVED Requirements

### Requirement: WhatsApp as a supported publish platform
**Reason:** WhatsApp replaced by Pinterest as the fourth network. Pinterest's OAuth and publisher are implemented. WhatsApp did not have a publish API; sharing was image-only via the device share sheet.
