/**
 * Generates a URL-friendly slug from a title with a unique short ID suffix
 * @param {string} title - The listing title to convert to a slug
 * @returns {string} - A URL-friendly slug like "dior-sauvage-edt-100ml-a4f3b2"
 */
export function generateSlug(title) {
  // Convert to lowercase and remove special characters
  const baseSlug = title
    .toLowerCase()
    .trim()
    // Replace spaces and underscores with hyphens
    .replace(/[\s_]+/g, "-")
    // Remove special characters except hyphens
    .replace(/[^\w\-]+/g, "")
    // Remove multiple consecutive hyphens
    .replace(/\-\-+/g, "-")
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, "")
    // Limit length to 50 characters for readability
    .substring(0, 50)
    // Remove trailing hyphen if substring cut mid-word
    .replace(/-+$/, "");

  // Generate a 6-character random ID for uniqueness
  const shortId = generateShortId();

  return `${baseSlug}-${shortId}`;
}

/**
 * Generates a random 6-character alphanumeric ID
 * @returns {string} - A 6-character random string like "a4f3b2"
 */
function generateShortId() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Checks if a string looks like a slug (contains hyphens and ends with short ID pattern)
 * @param {string} str - The string to check
 * @returns {boolean} - True if it looks like a slug
 */
export function isSlug(str) {
  // A slug should contain hyphens and end with a 6-character alphanumeric suffix
  // Pattern: anything-with-hyphens-abc123
  return /^.+\-[a-z0-9]{6}$/.test(str);
}
