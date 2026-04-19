const ACTIVE_SWAP_STATUSES = new Set([
  "swap_request",
  "swap_accepted",
  "pending_shipment",
]);

const SWAP_INACTIVITY_DAYS = 30;
const SWAP_DELETION_WARNING_DAYS = 7;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

function toDate(value) {
  if (!value) return null;

  if (value instanceof Date) {
    return value;
  }

  if (typeof value.toDate === "function") {
    return value.toDate();
  }

  if (typeof value.seconds === "number") {
    return new Date(value.seconds * 1000);
  }

  if (typeof value._seconds === "number") {
    return new Date(value._seconds * 1000);
  }

  return null;
}

export function getSwapLastActivityDate(swapRequest) {
  return (
    toDate(swapRequest?.lastActivityAt) ||
    toDate(swapRequest?.updatedAt) ||
    toDate(swapRequest?.createdAt)
  );
}

export function getSwapDeletionInfo(swapRequest, now = new Date()) {
  if (!ACTIVE_SWAP_STATUSES.has(swapRequest?.status)) {
    return null;
  }

  const lastActivityAt = getSwapLastActivityDate(swapRequest);
  if (!lastActivityAt) {
    return null;
  }

  const deletionDate = new Date(
    lastActivityAt.getTime() + SWAP_INACTIVITY_DAYS * DAY_IN_MS
  );
  const msUntilDeletion = deletionDate.getTime() - now.getTime();
  const isOverdue = msUntilDeletion < 0;
  const daysUntilDeletion = isOverdue
    ? 0
    : Math.ceil(msUntilDeletion / DAY_IN_MS);

  return {
    lastActivityAt,
    deletionDate,
    daysUntilDeletion,
    isOverdue,
    shouldWarn: isOverdue || daysUntilDeletion <= SWAP_DELETION_WARNING_DAYS,
  };
}

export {
  ACTIVE_SWAP_STATUSES,
  SWAP_INACTIVITY_DAYS,
  SWAP_DELETION_WARNING_DAYS,
};
