import { GrantOpportunity } from "./types";

// Realistic fallback data for when Grants.gov API is unavailable
export const FALLBACK_GRANTS: GrantOpportunity[] = [
  {
    id: "fb-001",
    title: "Community Health Center Expanded Services Grant",
    agency: "Health Resources and Services Administration (HRSA)",
    deadline: "2026-05-15",
    amountMin: 250000,
    amountMax: 750000,
    eligibilityText:
      "Federally Qualified Health Centers (FQHCs), FQHC Look-Alikes, community-based nonprofit organizations providing primary care",
    summary:
      "Funding to expand behavioral health, dental, and preventive care services at community health centers serving underserved populations. Priority given to centers demonstrating high need in rural or medically underserved areas.",
    url: "https://www.grants.gov",
    source: "fallback",
    rawTags: ["Health", "Community Development"],
  },
  {
    id: "fb-002",
    title: "Behavioral Health Integration in Primary Care",
    agency: "Substance Abuse and Mental Health Services Administration (SAMHSA)",
    deadline: "2026-04-30",
    amountMin: 400000,
    amountMax: 1000000,
    eligibilityText:
      "Community health centers, nonprofit healthcare organizations, state and local government health departments",
    summary:
      "Supports integration of behavioral health services into primary care settings. Targets opioid use disorder, substance abuse treatment, and mental health screening in community-based health centers serving low-income and Medicaid populations.",
    url: "https://www.grants.gov",
    source: "fallback",
    rawTags: ["Health", "Mental Health"],
  },
  {
    id: "fb-003",
    title: "Rural Health Network Development Planning Grant",
    agency: "Health Resources and Services Administration (HRSA)",
    deadline: "2026-06-01",
    amountMin: 100000,
    amountMax: 300000,
    eligibilityText:
      "Rural nonprofit organizations, rural health clinics, federally qualified health centers in rural areas",
    summary:
      "Planning grants for rural health networks to develop integrated healthcare delivery systems. Focus on maternal health, chronic disease management, and preventive care access in underserved rural communities.",
    url: "https://www.grants.gov",
    source: "fallback",
    rawTags: ["Health", "Rural Development"],
  },
  {
    id: "fb-004",
    title: "Maternal and Child Health Services Block Grant",
    agency: "Health Resources and Services Administration (HRSA)",
    deadline: "2026-07-15",
    amountMin: 500000,
    amountMax: 2000000,
    eligibilityText: "State health departments, tribal organizations, territories",
    summary:
      "Block grant supporting maternal and child health programs including prenatal care, well-child visits, and pediatric dental services. State agencies distribute to local providers including community health centers.",
    url: "https://www.grants.gov",
    source: "fallback",
    rawTags: ["Health", "Maternal Health"],
  },
  {
    id: "fb-005",
    title: "Health Disparities Research and Education Grant",
    agency: "National Institutes of Health (NIH)",
    deadline: "2026-04-01",
    amountMin: 200000,
    amountMax: 500000,
    eligibilityText:
      "Universities, research institutions, nonprofit health organizations with research capacity",
    summary:
      "Research grants focused on understanding and reducing health disparities in minority and low-income populations. Emphasis on diabetes, cardiovascular disease, and chronic conditions in medically underserved communities.",
    url: "https://www.grants.gov",
    source: "fallback",
    rawTags: ["Health", "Research"],
  },
  {
    id: "fb-006",
    title: "Emergency Preparedness for Community Health Centers",
    agency: "Assistant Secretary for Preparedness and Response (ASPR)",
    deadline: "2026-08-30",
    amountMin: 50000,
    amountMax: 150000,
    eligibilityText:
      "FQHCs, community health centers, nonprofit primary care organizations",
    summary:
      "Funding for community health centers to develop or improve emergency preparedness plans, acquire emergency medical supplies, and train staff in disaster response protocols.",
    url: "https://www.grants.gov",
    source: "fallback",
    rawTags: ["Health", "Emergency Preparedness"],
  },
  {
    id: "fb-007",
    title: "Oral Health Workforce Development Program",
    agency: "Health Resources and Services Administration (HRSA)",
    deadline: "2026-03-25",
    amountMin: 300000,
    amountMax: 600000,
    eligibilityText:
      "Dental schools, community health centers with dental programs, state dental associations, nonprofit dental organizations",
    summary:
      "Supports dental workforce expansion in underserved areas. Funding for dental residency programs, community dental clinics, and mobile dental units serving low-income and Medicaid populations.",
    url: "https://www.grants.gov",
    source: "fallback",
    rawTags: ["Health", "Dental", "Workforce"],
  },
  {
    id: "fb-008",
    title: "Technology Modernization for Healthcare Providers",
    agency: "Office of the National Coordinator for Health IT (ONC)",
    deadline: "2026-09-15",
    amountMin: 100000,
    amountMax: 400000,
    eligibilityText:
      "Healthcare providers, health IT vendors, nonprofit health organizations, state health agencies",
    summary:
      "Grants to modernize health information technology infrastructure at community health centers and safety-net providers. Focus on EHR interoperability, telehealth expansion, and data analytics capabilities.",
    url: "https://www.grants.gov",
    source: "fallback",
    rawTags: ["Health", "Technology"],
  },
  {
    id: "fb-009",
    title: "Chronic Disease Prevention and Health Promotion",
    agency: "Centers for Disease Control and Prevention (CDC)",
    deadline: "2026-05-30",
    amountMin: 150000,
    amountMax: 800000,
    eligibilityText:
      "State and local health departments, tribal organizations, nonprofit community health organizations",
    summary:
      "Cooperative agreements to implement evidence-based chronic disease prevention programs. Focus on diabetes, hypertension, and obesity prevention in vulnerable populations through community health center partnerships.",
    url: "https://www.grants.gov",
    source: "fallback",
    rawTags: ["Health", "Prevention"],
  },
  {
    id: "fb-010",
    title: "Substance Use Prevention and Treatment Block Grant",
    agency: "Substance Abuse and Mental Health Services Administration (SAMHSA)",
    deadline: "2026-06-15",
    amountMin: 1000000,
    amountMax: 5000000,
    eligibilityText: "State substance abuse agencies, tribal organizations",
    summary:
      "Block grant funding for substance use disorder prevention, treatment, and recovery support services. States distribute to community providers including FQHCs and community mental health centers.",
    url: "https://www.grants.gov",
    source: "fallback",
    rawTags: ["Health", "Substance Abuse"],
  },
];
