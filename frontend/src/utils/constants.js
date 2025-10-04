export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
export const CLIENT_URL = import.meta.env.VITE_CLIENT_URL || 'http://localhost:3000';

export const API_ENDPOINTS = {
  REGISTER: '/authorize/register',
  LOGIN: '/authorize/login',
  LOGOUT: '/authorize/logout',
  ME: '/authorize/me',
  GOOGLE_AUTH: '/authorize/google',
  PROFILE: '/protected/profile',
  USER_DATA: '/protected/user-data',
};

export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Invalid credentials.',
  USER_NOT_FOUND: 'User not found.',
  USERNAME_TAKEN: 'Username already taken.',
  EMAIL_NOT_VERIFIED: 'Please verify your email first.',
  UNAUTHORIZED: 'Unauthorized access.',
  SERVER_ERROR: 'Server error. Please try again later.',
};

export const VALIDATION = {
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
  PASSWORD_MIN_LENGTH: 6,
};

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
};

export default {
  API_URL,
  CLIENT_URL,
  API_ENDPOINTS,
  AUTH_ERRORS,
  VALIDATION,
  ROUTES,
};