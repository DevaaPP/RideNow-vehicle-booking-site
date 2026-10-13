/**
 * RideNow Student Verification Engine
 * Validates institutional educational domains, college email formats,
 * and maintains whitelist patterns for Indian & global universities,
 * colleges, institutes of national importance (IIT, NIT, IIIT, IIM, AIIMS, Central/State universities),
 * polytechnics, and research organizations.
 */

export interface StudentDomainValidationResult {
  isValid: boolean;
  domain: string;
  matchedPattern?: string;
  institutionCategory?: string;
  reason?: string;
}

/**
 * Standard accredited Top-Level Domains (TLDs) and Country-Code Second-Level Domains (ccSLDs)
 * dedicated to educational and research institutions globally and across India.
 */
export const ACCREDITED_EDU_SUFFIXES = [
  // India
  ".ac.in",
  ".edu.in",
  ".res.in",
  ".ernet.in",

  // Global / North America
  ".edu",
  ".edu.ca",
  ".ac.uk",
  ".edu.au",
  ".edu.sg",
  ".edu.my",
  ".edu.hk",
  ".edu.cn",
  ".edu.tw",
  ".edu.pk",
  ".edu.bd",
  ".edu.np",
  ".edu.lk",
  ".ac.nz",
  ".ac.za",
  ".ac.jp",
  ".ac.kr",
  ".ac.th",
  ".edu.ph",
  ".edu.vn",
  ".edu.ng",
  ".edu.gh",
  ".edu.eg",
  ".edu.sa",
  ".edu.ae",
] as const;

/**
 * Major Indian educational institutions that use specialized subdomains or custom domains.
 * Matches domain suffixes or exact hostnames.
 */
export const RECOGNIZED_INSTITUTION_PATTERNS = [
  // IITs (Indian Institutes of Technology)
  /iit[a-z0-9-]*\.(?:ac|edu)\.in$/i,
  /iit[a-z0-9-]*\.ernet\.in$/i,
  /iit[a-z0-9-]*\.in$/i,

  // NITs (National Institutes of Technology)
  /nit[a-z0-9-]*\.(?:ac|edu)\.in$/i,
  /nit[a-z0-9-]*\.in$/i,

  // IIITs (Indian Institutes of Information Technology)
  /iiit[a-z0-9-]*\.(?:ac|edu)\.in$/i,
  /iiit[a-z0-9-]*\.in$/i,

  // IIMs (Indian Institutes of Management)
  /iim[a-z0-9-]*\.(?:ac|edu)\.in$/i,
  /iim[a-z0-9-]*\.in$/i,

  // AIIMS (All India Institutes of Medical Sciences)
  /aiims[a-z0-9-]*\.(?:edu|ac)\.in$/i,
  /aiims[a-z0-9-]*\.in$/i,

  // Central, State, and Deemed Universities
  /du\.ac\.in$/i,
  /jnu\.ac\.in$/i,
  /bhu\.ac\.in$/i,
  /amu\.ac\.in$/i,
  /uohyd\.ac\.in$/i,
  /tezu\.ernet\.in$/i,
  /gauhati\.ac\.in$/i,
  /dibru\.ac\.in$/i,
  /aus\.ac\.in$/i,
  /nehu\.ac\.in$/i,
  /manipuruniv\.ac\.in$/i,
  /mzu\.edu\.in$/i,
  /nagalanduniversity\.ac\.in$/i,
  /rgu\.ac\.in$/i,
  /cus\.ac\.in$/i,
  /nits\.ac\.in$/i,
  /iitg\.ac\.in$/i,
  /iitg\.ernet\.in$/i,
  /aec\.ac\.in$/i,
  /jist\.ac\.in$/i,
  /cottonuniversity\.ac\.in$/i,
  /nlu[a-z0-9-]*\.(?:ac|edu)\.in$/i,
  /bits-pilani\.ac\.in$/i,
  /vit\.ac\.in$/i,
  /manipal\.edu$/i,
  /srmist\.edu\.in$/i,
  /thapar\.edu$/i,
  /amrita\.edu$/i,
] as const;

/**
 * Validates whether an email address belongs to a genuine accredited educational institution.
 */
export function validateStudentEmail(email: string): StudentDomainValidationResult {
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return {
      isValid: false,
      domain: "",
      reason: "Please provide a valid email address.",
    };
  }

  const cleanEmail = email.toLowerCase().trim();
  const parts = cleanEmail.split("@");
  if (parts.length !== 2) {
    return {
      isValid: false,
      domain: "",
      reason: "Malformed email format.",
    };
  }

  const domain = parts[1].trim();
  if (!domain || domain.length < 4 || !domain.includes(".")) {
    return {
      isValid: false,
      domain,
      reason: "Invalid email domain structure.",
    };
  }

  // Common public / personal email providers blacklist
  const publicWebmailBlacklist = [
    "gmail.com",
    "googlemail.com",
    "yahoo.com",
    "yahoo.co.in",
    "yahoo.in",
    "outlook.com",
    "hotmail.com",
    "live.com",
    "icloud.com",
    "protonmail.com",
    "proton.me",
    "rediffmail.com",
    "zoho.com",
    "mail.com",
    "gmx.com",
    "aol.com",
    "yandex.com",
  ];

  if (publicWebmailBlacklist.includes(domain)) {
    return {
      isValid: false,
      domain,
      reason: "Public email domains (Gmail, Yahoo, Outlook, etc.) are not eligible for student verification. Please use your official university/college email.",
    };
  }

  // 1. Check direct accredited suffixes (.ac.in, .edu.in, .edu, .res.in, etc.)
  for (const suffix of ACCREDITED_EDU_SUFFIXES) {
    if (domain.endsWith(suffix)) {
      return {
        isValid: true,
        domain,
        matchedPattern: suffix,
        institutionCategory: suffix.includes(".in") ? "Indian Accredited Institution" : "Global Accredited Institution",
      };
    }
  }

  // 2. Check compound educational tokens anywhere in the host domain (e.g. .edu. or .ac.)
  if (domain.includes(".edu.") || domain.includes(".ac.") || domain.includes(".res.")) {
    return {
      isValid: true,
      domain,
      matchedPattern: "compound_edu_token",
      institutionCategory: "Educational / Research Subdomain",
    };
  }

  // 3. Check regex pattern list for premier Indian universities and institutes
  for (const pattern of RECOGNIZED_INSTITUTION_PATTERNS) {
    if (pattern.test(domain)) {
      return {
        isValid: true,
        domain,
        matchedPattern: pattern.toString(),
        institutionCategory: "Recognized Institute / University",
      };
    }
  }

  return {
    isValid: false,
    domain,
    reason:
      "Unrecognized educational domain. Email must end with .edu, .ac.in, .edu.in, .res.in, or an accredited university domain.",
  };
}

/**
 * Backward compatibility helper for existing callers.
 */
export function isValidStudentEmail(email: string): boolean {
  return validateStudentEmail(email).isValid;
}
