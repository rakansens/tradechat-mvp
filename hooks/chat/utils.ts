/** Helper utilities for chat hooks */

// Retrieve current user id from localStorage or fallback
export const getCurrentUserId = () => {
  return localStorage.getItem('userId') || 'current-user-id'
}
