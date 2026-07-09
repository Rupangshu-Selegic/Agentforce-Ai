/**
 * modelsApi.js
 * ------------
 * Calls the Salesforce Agentforce Models API.
 * Fixed for orgs where api_instance_url = https://api.salesforce.com
 */

import fetch from 'node-fetch';
import { getAccessToken } from './auth.js';

export async function chatCompletion(systemPrompt, userMessage, modelName) {
  const model = modelName || process.env.SF_MODEL;

  console.log(`\n[modelsApi] Model   : ${model}`);
  console.log(`[modelsApi] Message : "${userMessage}"`);

  const { accessToken, instanceUrl, apiInstanceUrl } = await getAccessToken();

  // ─────────────────────────────────────────────────────────────────
  // The correct URL for Agentforce Models API when called from Node:
  //
  //   POST {apiInstanceUrl}/einstein/platform/v1/models/{model}/chat-generations
  //
  // With these REQUIRED headers:
  //   Authorization      : Bearer {accessToken}
  //   x-sfdc-instance-url: {instanceUrl}   ← THIS is what routes to your org
  //   x-sfdc-app-context : EinsteinGPT
  //   x-client-feature-id: ai-platform-models-connected-app
  // ─────────────────────────────────────────────────────────────────

  const url = `${apiInstanceUrl}/einstein/platform/v1/models/${model}/chat-generations`;

  const headers = {
    'Authorization'       : `Bearer ${accessToken}`,
    'Content-Type'        : 'application/json',
    'x-sfdc-instance-url' : instanceUrl,          // ← THE FIX — org routing header
    'x-sfdc-app-context'  : 'EinsteinGPT',
    'x-client-feature-id' : 'ai-platform-models-connected-app',
  };

  const body = {
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userMessage  },
    ],
  };

  console.log(`[modelsApi] POST ${url}`);
  console.log(`[modelsApi] x-sfdc-instance-url: ${instanceUrl}`);

  const response = await fetch(url, {
    method : 'POST',
    headers,
    body   : JSON.stringify(body),
  });

  const rawText = await response.text();
  console.log(`[modelsApi] HTTP ${response.status} ${response.statusText}`);
  console.log(`[modelsApi] Raw response: ${rawText}`);

  if (!response.ok) {
    throw new Error(
      `[modelsApi] API call failed — HTTP ${response.status}\n` +
      `URL: ${url}\n` +
      `Response: ${rawText}`
    );
  }

  let data;
  try {
    data = JSON.parse(rawText);
  } catch {
    throw new Error(`[modelsApi] Non-JSON response: ${rawText}`);
  }

  // Extract text — handle all known Salesforce response shapes
  const content =
    data?.generation?.generatedText                    ||  // shape A
    data?.generationDetails?.generations?.[0]?.content ||  // shape B
    data?.generations?.[0]?.content;                       // shape C

  if (!content) {
    throw new Error(
      `[modelsApi] 200 OK but no content found.\n` +
      `Full response: ${JSON.stringify(data, null, 2)}`
    );
  }

  return content.trim();
}