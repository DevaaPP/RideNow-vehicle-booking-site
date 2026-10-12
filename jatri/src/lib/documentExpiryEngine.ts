export interface DocumentExpiryAlert {
  documentType: "insurance" | "license" | "rc" | "puc" | "fitness" | "permit";
  label: string;
  expiryDate: Date;
  daysRemaining: number;
  status: "expired" | "urgent_7_days" | "warning_30_days" | "valid";
  severity: "critical" | "high" | "medium" | "none";
  message: string;
  isBlocking: boolean;
}

export interface ExpiryEvaluationResult {
  hasCriticalExpiry: boolean; // true if any document is already expired
  hasUrgentWarning: boolean;   // true if any document expires within <= 7 days
  hasAdvanceWarning: boolean;  // true if any document expires within <= 30 days
  alerts: DocumentExpiryAlert[];
  blockingReasons: string[];
}

const DOCUMENT_DEFINITIONS = [
  {
    field: "insuranceExpiry",
    type: "insurance" as const,
    label: "Commercial Vehicle Insurance",
    isMandatoryBlocking: true,
  },
  {
    field: "licenseExpiry",
    type: "license" as const,
    label: "Commercial Driving Licence",
    isMandatoryBlocking: true,
  },
  {
    field: "fitnessExpiry",
    type: "fitness" as const,
    label: "Vehicle Fitness Certificate",
    isMandatoryBlocking: true,
  },
  {
    field: "pucExpiry",
    type: "puc" as const,
    label: "Pollution Under Control (PUC)",
    isMandatoryBlocking: true,
  },
  {
    field: "permitExpiry",
    type: "permit" as const,
    label: "Commercial Road Permit",
    isMandatoryBlocking: true,
  },
  {
    field: "rcExpiry",
    type: "rc" as const,
    label: "Vehicle Registration Certificate (RC)",
    isMandatoryBlocking: true,
  },
];

/**
 * Evaluates document expiry dates against current timestamp.
 * Flags expired documents (critical/blocking) as well as proactive warnings
 * for documents expiring within 7 days (urgent) and 30 days (advance warning).
 */
export function evaluateDocumentExpirations(doc: any): ExpiryEvaluationResult {
  const alerts: DocumentExpiryAlert[] = [];
  const blockingReasons: string[] = [];

  let hasCriticalExpiry = false;
  let hasUrgentWarning = false;
  let hasAdvanceWarning = false;

  if (!doc) {
    return {
      hasCriticalExpiry: false,
      hasUrgentWarning: false,
      hasAdvanceWarning: false,
      alerts: [],
      blockingReasons: [],
    };
  }

  const now = new Date();

  for (const def of DOCUMENT_DEFINITIONS) {
    const rawDate = doc[def.field];
    if (!rawDate) continue;

    const expiryDate = new Date(rawDate);
    if (isNaN(expiryDate.getTime())) continue;

    // Calculate whole calendar days remaining
    const diffMs = expiryDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const formattedDate = expiryDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    if (daysRemaining < 0) {
      hasCriticalExpiry = true;
      if (def.isMandatoryBlocking) {
        blockingReasons.push(
          `${def.label} expired on ${formattedDate}. Renewal required before accepting rides.`
        );
      }
      alerts.push({
        documentType: def.type,
        label: def.label,
        expiryDate,
        daysRemaining,
        status: "expired",
        severity: "critical",
        message: `${def.label} expired on ${formattedDate}. Online dispatch is blocked.`,
        isBlocking: def.isMandatoryBlocking,
      });
    } else if (daysRemaining <= 7) {
      hasUrgentWarning = true;
      alerts.push({
        documentType: def.type,
        label: def.label,
        expiryDate,
        daysRemaining,
        status: "urgent_7_days",
        severity: "high",
        message: `${def.label} expires in ${daysRemaining} day(s) on ${formattedDate}. Renew immediately to avoid service disruption.`,
        isBlocking: false,
      });
    } else if (daysRemaining <= 30) {
      hasAdvanceWarning = true;
      alerts.push({
        documentType: def.type,
        label: def.label,
        expiryDate,
        daysRemaining,
        status: "warning_30_days",
        severity: "medium",
        message: `${def.label} expires in ${daysRemaining} days on ${formattedDate}. Please initiate renewal with the transport authority.`,
        isBlocking: false,
      });
    }
  }

  // Sort alerts: critical first, then urgent, then advance warning
  alerts.sort((a, b) => a.daysRemaining - b.daysRemaining);

  return {
    hasCriticalExpiry,
    hasUrgentWarning,
    hasAdvanceWarning,
    alerts,
    blockingReasons,
  };
}
