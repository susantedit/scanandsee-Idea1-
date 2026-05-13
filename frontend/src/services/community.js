/**
 * Community API service.
 * Uses the same secure request wrapper as api.js.
 */
import { getAuthToken } from './firebase.js';

const BASE = import.meta.env.VITE_API_URL || '';

class CommunityError extends Error {
  constructor(message, status) {
    super(message);
    this.name   = 'CommunityError';
    this.status = status;
  }
}

async function request(method, path, body = null) {
  let token;
  try { token = await getAuthToken(); } catch {
    throw new CommunityError('Session expired. Please sign in again.', 401);
  }

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      credentials: 'same-origin',
      headers: {
        Authorization:  `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : null,
    });
  } catch {
    throw new CommunityError('Network error. Check your connection.', 0);
  }

  const data = await res.json().catch(() => ({ error: `Server error (${res.status})` }));
  if (!res.ok) throw new CommunityError(data.error || `Request failed (${res.status})`, res.status);
  return data;
}

/**
 * Share a scan to the community feed.
 * @param {string} scanId - must be 32-char hex
 * @param {string} caption - optional caption (max 200 chars)
 */
export async function shareScan(scanId, caption = '') {
  if (!/^[a-f0-9]{32}$/.test(scanId)) throw new CommunityError('Invalid scan ID', 400);
  return request('POST', '/api/community/share', {
    scanId,
    caption: caption.slice(0, 200),
  });
}

export async function getCommunityFeed(limit = 20) {
  const l = Math.min(Math.max(parseInt(limit) || 20, 1), 50);
  return request('GET', `/api/community/feed?limit=${l}`);
}

export async function getLeaderboard() {
  return request('GET', '/api/community/leaderboard');
}

export async function likePost(postId) {
  if (!/^[a-f0-9]{32}$/.test(postId)) throw new CommunityError('Invalid post ID', 400);
  return request('POST', `/api/community/${postId}/like`);
}

export async function deletePost(postId) {
  if (!/^[a-f0-9]{32}$/.test(postId)) throw new CommunityError('Invalid post ID', 400);
  return request('DELETE', `/api/community/${postId}`);
}
