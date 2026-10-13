export const VALID_STATUS_TRANSITIONS = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['UNDER_REVIEW', 'DRAFT'],
  UNDER_REVIEW: ['DOCUMENT_VERIFICATION', 'ADDITIONAL_INFORMATION_REQUIRED', 'APPROVED', 'REJECTED'],
  DOCUMENT_VERIFICATION: ['APPROVED', 'REJECTED', 'ADDITIONAL_INFORMATION_REQUIRED'],
  ADDITIONAL_INFORMATION_REQUIRED: ['UNDER_REVIEW'],
  APPROVED: [],
  REJECTED: [],
};

export const canTransitionApplication = (currentStatus, nextStatus) => {
  const allowed = VALID_STATUS_TRANSITIONS[currentStatus] || [];
  return allowed.includes(nextStatus);
};

export const buildReferenceNumber = () => {
  const suffix = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `CERI-${suffix}`;
};
