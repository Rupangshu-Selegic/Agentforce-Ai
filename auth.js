
import fetch from 'node-fetch';

// Token cache — lives in memory for the duration of the process
let cachedToken = null;
let tokenExpiresAt = null;

const TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Returns a valid access token.
 * Fetches a new one if none is cached or the cached one is expired.
 *
 * @returns {Promise<{ accessToken: string, instanceUrl: string }>}
 */
export async function getAccessToken() {
  const now = Date.now();

  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && tokenExpiresAt && now < tokenExpiresAt - 60_000) {
    console.log('[auth] Using cached token');
    return cachedToken;
  }

  console.log('[auth] Fetching new access token...');

  const { SF_ORG_DOMAIN, SF_CLIENT_ID, SF_CLIENT_SECRET } = process.env;

  if (!SF_ORG_DOMAIN || !SF_CLIENT_ID || !SF_CLIENT_SECRET) {
    throw new Error(
      'Missing required env vars: SF_ORG_DOMAIN, SF_CLIENT_ID, SF_CLIENT_SECRET\n' +
      'Copy .env.example → .env and fill in your credentials.'
    );
  }

  const tokenUrl = `${SF_ORG_DOMAIN}/services/oauth2/token`;

  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: SF_CLIENT_ID,
    client_secret: SF_CLIENT_SECRET,
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `[auth] Token fetch failed — HTTP ${response.status}\n` +
      `URL: ${tokenUrl}\n` +
      `Response: ${errorText}`
    );
  }

  const data = await response.json();

  // Log the FULL token response — we need to see api_instance_url
  console.log('[auth] Full token response:', JSON.stringify(data, null, 2));

  if (!data.access_token) {
    throw new Error(
      `[auth] Token response missing access_token.\nFull response: ${JSON.stringify(data, null, 2)}`
    );
  }

  // api_instance_url is the correct host for Models API calls It's different from instance_url (org domain) for Hyperforce orgs

  cachedToken = {
    accessToken: data.access_token,
    instanceUrl: data.instance_url || SF_ORG_DOMAIN,
    apiInstanceUrl: data.api_instance_url || data.instance_url || SF_ORG_DOMAIN,
  };
  tokenExpiresAt = now + TOKEN_TTL_MS;

  console.log('[auth] Token fetched successfully');
  console.log('[auth] instanceUrl:', cachedToken.instanceUrl);
  console.log('[auth] apiInstanceUrl:', cachedToken.apiInstanceUrl);
  return cachedToken;
}
