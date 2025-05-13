/**
 * Generates a unique ID
 * @returns A random unique string ID
 */
export function generateUniqueId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Formats a date string to a more readable format
 * @param dateString Date string in YYYY-MM-DD format
 * @returns Formatted date string (e.g., "Jan 15, 2025")
 */
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Calculates the attendance rate
 * @param present Number of present sessions
 * @param total Total number of sessions
 * @returns Attendance rate as a percentage
 */
export function calculateAttendanceRate(present: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((present / total) * 100);
}