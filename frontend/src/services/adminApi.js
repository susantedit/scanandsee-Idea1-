import axios from 'axios';

const API_BASE = '/api/admin';

const adminApi = axios.create({
  baseURL: API_BASE,
});

// Dashboard
export const getDashboard = () => adminApi.get('/dashboard');

// Users
export const getUsers = (page = 1, limit = 20, search = '') =>
  adminApi.get('/users', { params: { page, limit, search } });
export const getUserDetail = (userId) => adminApi.get(`/users/${userId}`);
export const updateUserStatus = (userId, status, reason) =>
  adminApi.put(`/users/${userId}/status`, { status, reason });
export const deleteUser = (userId, reason) =>
  adminApi.delete(`/users/${userId}`, { data: { reason } });

// Moderation
export const getFlaggedContent = () => adminApi.get('/moderation/flagged');
export const reviewFlaggedContent = (flagId, action, reason) =>
  adminApi.post('/moderation/review', { flagId, action, reason });

// Badges
export const getBadges = () => adminApi.get('/badges');
export const createBadge = (badge) => adminApi.post('/badges', badge);
export const updateBadge = (badgeId, badge) =>
  adminApi.put(`/badges/${badgeId}`, badge);
export const deleteBadge = (badgeId) =>
  adminApi.delete(`/badges/${badgeId}`);

// Challenges
export const getChallenges = () => adminApi.get('/challenges');
export const createChallenge = (challenge) => adminApi.post('/challenges', challenge);
export const updateChallenge = (challengeId, challenge) =>
  adminApi.put(`/challenges/${challengeId}`, challenge);
export const deleteChallenge = (challengeId) =>
  adminApi.delete(`/challenges/${challengeId}`);

// System
export const getSystemHealth = () => adminApi.get('/system/health');
export const getSystemLogs = (limit = 50) =>
  adminApi.get('/system/logs', { params: { limit } });

// Billing
export const getPremiumUsers = () => adminApi.get('/billing/premium-users');
export const getRevenue = () => adminApi.get('/billing/revenue');

// Notifications
export const broadcastNotification = (notification) =>
  adminApi.post('/notifications/broadcast', notification);

// Admins
export const getAdmins = () => adminApi.get('/admins');
export const createAdmin = (admin) => adminApi.post('/admins', admin);
export const deleteAdmin = (adminId) =>
  adminApi.delete(`/admins/${adminId}`);

export default adminApi;
