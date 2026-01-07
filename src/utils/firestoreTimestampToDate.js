// Utility to convert Firestore timestamp to JavaScript Date
// Handles both client SDK format (seconds) and Admin SDK JSON serialized format (_seconds)
export default function firestoreTimestampToDate(timestamp) {
  if (!timestamp) return null;

  // Handle Admin SDK serialized format (has _seconds with underscore)
  const seconds = timestamp.seconds ?? timestamp._seconds;
  if (seconds === undefined) return null;

  return new Date(seconds * 1000);
}
