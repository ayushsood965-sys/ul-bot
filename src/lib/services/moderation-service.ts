import { recordAuditLog } from "./audit-log-service";

export interface ModerationResult {
  passed: boolean;
  flagReasons: string[];
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  sanitizedText: string;
  hasRedactions: boolean;
}

// Regex patterns for sensitive Indian PII and high-risk terms
const PHONE_REGEX = /(?:\+91[\-\s]?)?[6789]\d{9}\b/g;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const AADHAAR_REGEX = /\b\d{4}\s?\d{4}\s?\d{4}\b/g;
const SOCIAL_HANDLE_REGEX = /@([a-zA-Z0-9_.]{3,30})/g;
const FAKE_STATS_REGEX = /(?:99% of people|according to harvard|studies prove that 9\d%|research shows 100%|scientists confirmed that all)/gi;

const PROHIBITED_HARASSMENT_KEYWORDS = [
  "kill yourself", "die in a fire", "hang yourself", "doxx",
  "leaked mms", "rape", "slut", "randi", "bitch", "cunt",
  "whore", "terrorist", "chamar", "bhangi"
];

const DEFAMATION_TRIGGERS = [
  "is a rapist", "is a pedophile", "stole money from", "fraudster", "scammer", "embezzled"
];

export function runContentModeration(text: string, context?: { source?: string; contentId?: string }): ModerationResult {
  const flags: string[] = [];
  let sanitized = text;
  let hasRedactions = false;

  // 1. Phone number detection & redaction
  if (PHONE_REGEX.test(sanitized)) {
    flags.push("Contains unredacted personal phone numbers (PII)");
    sanitized = sanitized.replace(PHONE_REGEX, "[PHONE REDACTED]");
    hasRedactions = true;
  }

  // 2. Email address detection & redaction
  if (EMAIL_REGEX.test(sanitized)) {
    flags.push("Contains email address (PII)");
    sanitized = sanitized.replace(EMAIL_REGEX, "[EMAIL REDACTED]");
    hasRedactions = true;
  }

  // 3. Aadhaar card detection & redaction
  if (AADHAAR_REGEX.test(sanitized)) {
    flags.push("Contains national identification number (Aadhaar)");
    sanitized = sanitized.replace(AADHAAR_REGEX, "[ID REDACTED]");
    hasRedactions = true;
  }

  // 4. Social handle tagging in user confessions
  if (context?.source === "ANONYMOUS_CONFESSION" && SOCIAL_HANDLE_REGEX.test(sanitized)) {
    flags.push("Contains identifiable Instagram or social media handles in anonymous submission");
    sanitized = sanitized.replace(SOCIAL_HANDLE_REGEX, "@[USER REDACTED]");
    hasRedactions = true;
  }

  // 5. Fabricated statistics check
  if (FAKE_STATS_REGEX.test(sanitized)) {
    flags.push("Contains unverified or fabricated absolute statistical claims ('99% of people agree')");
  }

  // 6. Harassment & abusive slurs check
  const lower = sanitized.toLowerCase();
  for (const kw of PROHIBITED_HARASSMENT_KEYWORDS) {
    if (lower.includes(kw)) {
      flags.push(`Violates safety policy: harassment / hate speech pattern matched ('${kw}')`);
    }
  }

  // 7. Defamation check against individuals
  for (const trigger of DEFAMATION_TRIGGERS) {
    if (lower.includes(trigger)) {
      flags.push(`Contains potential unverified criminal allegation or defamatory claim ('${trigger}')`);
    }
  }

  const riskLevel: "LOW" | "MEDIUM" | "HIGH" =
    flags.some((f) => f.includes("harassment") || f.includes("defamatory") || f.includes("hate speech"))
      ? "HIGH"
      : flags.length > 0
      ? "MEDIUM"
      : "LOW";

  const passed = flags.length === 0;

  if (!passed) {
    recordAuditLog({
      action: "CONTENT_MODERATION_FLAGGED",
      category: "MODERATION",
      details: `Content flagged for [${flags.join("; ")}]. Risk level: ${riskLevel}.`,
      severity: riskLevel === "HIGH" ? "WARNING" : "INFO",
    });
  }

  return {
    passed,
    flagReasons: flags,
    riskLevel,
    sanitizedText: sanitized,
    hasRedactions,
  };
}
