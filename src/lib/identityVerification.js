function readSafeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function readSafeNumber(value, fallback = 0) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return numericValue;
}

export const NON_FRAUD_RETRY_CAP = 2;
export const MAX_NON_FRAUD_FAILURES = NON_FRAUD_RETRY_CAP + 1;
export const FRAUD_SIGNAL_ERROR_CODES = new Set([
  "selfie_face_mismatch",
  "selfie_manipulated",
]);

export function normalizeIdentityStatus(status) {
  const normalized = readSafeString(status).toLowerCase();
  const validStatuses = new Set([
    "unverified",
    "requires_input",
    "processing",
    "verified",
    "canceled",
    "locked",
  ]);

  if (validStatuses.has(normalized)) {
    return normalized;
  }

  return "unverified";
}

export function isFraudSignalErrorCode(errorCode) {
  return FRAUD_SIGNAL_ERROR_CODES.has(readSafeString(errorCode).toLowerCase());
}

export function calculateRetriesRemainingNonFraud(nonFraudFailures) {
  const safeFailures = Math.max(0, readSafeNumber(nonFraudFailures, 0));
  return Math.max(0, MAX_NON_FRAUD_FAILURES - safeFailures);
}

export function isLegacyVeriffApproved(data = {}) {
  return readSafeString(data?.veriff?.decision).toLowerCase() === "approved";
}

export function buildIdentityVerificationState(data = {}) {
  const identityVerification =
    data?.identityVerification && typeof data.identityVerification === "object"
      ? data.identityVerification
      : {};

  const legacyVeriffApproved = isLegacyVeriffApproved(data);
  const isIdVerified =
    Boolean(data?.isIdVerified) || Boolean(identityVerification.verified);
  const attemptsTotal = Math.max(
    0,
    readSafeNumber(identityVerification.attemptsTotal, 0)
  );
  const nonFraudFailures = Math.max(
    0,
    readSafeNumber(identityVerification.nonFraudFailures, 0)
  );
  const fraudFailures = Math.max(
    0,
    readSafeNumber(identityVerification.fraudFailures, 0)
  );
  const retriesRemainingNonFraud = Number.isFinite(
    Number(identityVerification.retriesRemainingNonFraud)
  )
    ? Math.max(0, Number(identityVerification.retriesRemainingNonFraud))
    : calculateRetriesRemainingNonFraud(nonFraudFailures);
  const provider = readSafeString(identityVerification.provider) || "";
  const locked = Boolean(identityVerification.locked);
  const verified = isIdVerified || legacyVeriffApproved;
  const status = locked
    ? "locked"
    : verified
      ? "verified"
      : normalizeIdentityStatus(identityVerification.status);

  return {
    provider:
      provider ||
      (legacyVeriffApproved ? "veriff_legacy" : "stripe_identity"),
    status,
    verified,
    locked,
    lockReason: readSafeString(identityVerification.lockReason),
    lastSessionId: readSafeString(identityVerification.lastSessionId),
    lastSessionUrl: readSafeString(identityVerification.lastSessionUrl),
    lastErrorCode: readSafeString(identityVerification.lastErrorCode),
    lastErrorReason: readSafeString(identityVerification.lastErrorReason),
    attemptsTotal,
    nonFraudFailures,
    fraudFailures,
    retryCapNonFraud: NON_FRAUD_RETRY_CAP,
    retriesRemainingNonFraud,
    verifiedAt: identityVerification.verifiedAt || null,
    lastEventType: readSafeString(identityVerification.lastEventType),
    lastEventAt: identityVerification.lastEventAt || null,
    updatedAt: identityVerification.updatedAt || null,
    isLegacyVeriffApproved: legacyVeriffApproved,
  };
}

export function resolveIdentityVerification(data = {}) {
  return buildIdentityVerificationState(data);
}

export function mergeIdentityDocuments(userData = {}, profileData = {}) {
  return {
    ...userData,
    ...profileData,
    isIdVerified: Boolean(userData?.isIdVerified || profileData?.isIdVerified),
    identityVerification: {
      ...(userData?.identityVerification || {}),
      ...(profileData?.identityVerification || {}),
    },
    veriff: profileData?.veriff || userData?.veriff || {},
  };
}
