/**
 * Short labels for long federal agency names (list + detail tooltips).
 */
const ABBREVIATIONS: { pattern: RegExp; short: string }[] = [
  { pattern: /substance abuse and mental health services administration/i, short: "SAMHSA" },
  { pattern: /health resources and services administration/i, short: "HRSA" },
  { pattern: /centers for disease control and prevention/i, short: "CDC" },
  { pattern: /centers for medicare/i, short: "CMS" },
  { pattern: /national institutes of health/i, short: "NIH" },
  { pattern: /administration for children and families/i, short: "ACF" },
  { pattern: /indian health service/i, short: "IHS" },
  { pattern: /agency for healthcare research and quality/i, short: "AHRQ" },
  { pattern: /food and drug administration/i, short: "FDA" },
  { pattern: /department of health and human services/i, short: "HHS" },
  { pattern: /health care financing administration/i, short: "HCFA" },
];

export function formatAgencyDisplay(agency: string): { label: string; title: string } {
  const trimmed = agency.trim();
  if (!trimmed) return { label: "", title: "" };

  for (const { pattern, short } of ABBREVIATIONS) {
    if (pattern.test(trimmed)) {
      return { label: short, title: trimmed };
    }
  }

  return { label: trimmed, title: trimmed };
}
