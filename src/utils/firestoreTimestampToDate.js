// Utility to convert Firestore timestamp to JavaScript Date
export default function firestoreTimestampToDate(timestamp) {
  if (!timestamp) return null;
  return new Date(timestamp.seconds * 1000);
}
