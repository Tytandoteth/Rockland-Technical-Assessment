-- Rockland Grant Discovery — Seed Synthetic Data
-- Run: psql $DATABASE_URL -f seed.sql

-- Clear existing synthetic data
DELETE FROM grants WHERE source = 'synthetic';

INSERT INTO grants (id, title, agency, deadline, amount_min, amount_max, eligibility_text, summary, url, source, raw_tags) VALUES
(
  'fb-001',
  'Community Health Center Expanded Services Grant',
  'Health Resources and Services Administration (HRSA)',
  '2026-05-15',
  250000, 750000,
  'Federally Qualified Health Centers (FQHCs), FQHC Look-Alikes, community-based nonprofit organizations providing primary care',
  'Funding to expand behavioral health, dental, and preventive care services at community health centers serving underserved populations. Priority given to centers demonstrating high need in rural or medically underserved areas.',
  'https://www.grants.gov',
  'synthetic',
  ARRAY['Health', 'Community Development']
),
(
  'fb-002',
  'Behavioral Health Integration in Primary Care',
  'Substance Abuse and Mental Health Services Administration (SAMHSA)',
  '2026-04-30',
  400000, 1000000,
  'Community health centers, nonprofit healthcare organizations, state and local government health departments',
  'Supports integration of behavioral health services into primary care settings. Targets opioid use disorder, substance abuse treatment, and mental health screening in community-based health centers serving low-income and Medicaid populations.',
  'https://www.grants.gov',
  'synthetic',
  ARRAY['Health', 'Mental Health']
),
(
  'fb-003',
  'Rural Health Network Development Planning Grant',
  'Health Resources and Services Administration (HRSA)',
  '2026-06-01',
  100000, 300000,
  'Rural nonprofit organizations, rural health clinics, federally qualified health centers in rural areas',
  'Planning grants for rural health networks to develop integrated healthcare delivery systems. Focus on maternal health, chronic disease management, and preventive care access in underserved rural communities.',
  'https://www.grants.gov',
  'synthetic',
  ARRAY['Health', 'Rural Development']
),
(
  'fb-004',
  'Maternal and Child Health Services Block Grant',
  'Health Resources and Services Administration (HRSA)',
  '2026-07-15',
  500000, 2000000,
  'State health departments, tribal organizations, territories',
  'Block grant supporting maternal and child health programs including prenatal care, well-child visits, and pediatric dental services. State agencies distribute to local providers including community health centers.',
  'https://www.grants.gov',
  'synthetic',
  ARRAY['Health', 'Maternal Health']
),
(
  'fb-005',
  'Health Disparities Research and Education Grant',
  'National Institutes of Health (NIH)',
  '2026-04-01',
  200000, 500000,
  'Universities, research institutions, nonprofit health organizations with research capacity',
  'Research grants focused on understanding and reducing health disparities in minority and low-income populations. Emphasis on diabetes, cardiovascular disease, and chronic conditions in medically underserved communities.',
  'https://www.grants.gov',
  'synthetic',
  ARRAY['Health', 'Research']
),
(
  'fb-006',
  'Emergency Preparedness for Community Health Centers',
  'Assistant Secretary for Preparedness and Response (ASPR)',
  '2026-08-30',
  50000, 150000,
  'FQHCs, community health centers, nonprofit primary care organizations',
  'Funding for community health centers to develop or improve emergency preparedness plans, acquire emergency medical supplies, and train staff in disaster response protocols.',
  'https://www.grants.gov',
  'synthetic',
  ARRAY['Health', 'Emergency Preparedness']
),
(
  'fb-007',
  'Oral Health Workforce Development Program',
  'Health Resources and Services Administration (HRSA)',
  '2026-03-25',
  300000, 600000,
  'Dental schools, community health centers with dental programs, state dental associations, nonprofit dental organizations',
  'Supports dental workforce expansion in underserved areas. Funding for dental residency programs, community dental clinics, and mobile dental units serving low-income and Medicaid populations.',
  'https://www.grants.gov',
  'synthetic',
  ARRAY['Health', 'Dental', 'Workforce']
),
(
  'fb-008',
  'Technology Modernization for Healthcare Providers',
  'Office of the National Coordinator for Health IT (ONC)',
  '2026-09-15',
  100000, 400000,
  'Healthcare providers, health IT vendors, nonprofit health organizations, state health agencies',
  'Grants to modernize health information technology infrastructure at community health centers and safety-net providers. Focus on EHR interoperability, telehealth expansion, and data analytics capabilities.',
  'https://www.grants.gov',
  'synthetic',
  ARRAY['Health', 'Technology']
),
(
  'fb-009',
  'Chronic Disease Prevention and Health Promotion',
  'Centers for Disease Control and Prevention (CDC)',
  '2026-05-30',
  150000, 800000,
  'State and local health departments, tribal organizations, nonprofit community health organizations',
  'Cooperative agreements to implement evidence-based chronic disease prevention programs. Focus on diabetes, hypertension, and obesity prevention in vulnerable populations through community health center partnerships.',
  'https://www.grants.gov',
  'synthetic',
  ARRAY['Health', 'Prevention']
),
(
  'fb-010',
  'Substance Use Prevention and Treatment Block Grant',
  'Substance Abuse and Mental Health Services Administration (SAMHSA)',
  '2026-06-15',
  1000000, 5000000,
  'State substance abuse agencies, tribal organizations',
  'Block grant funding for substance use disorder prevention, treatment, and recovery support services. States distribute to community providers including FQHCs and community mental health centers.',
  'https://www.grants.gov',
  'synthetic',
  ARRAY['Health', 'Substance Abuse']
);

-- Seed a sample clinic profile
INSERT INTO clinic_profiles (id, clinic_name, state, clinic_type, focus_areas, patient_population_notes, org_size_band)
VALUES (
  'clinic-demo',
  'Sunrise Community Health Center',
  'Colorado',
  'FQHC',
  ARRAY['behavioral health', 'dental', 'preventive care', 'chronic disease management'],
  'Low-income, uninsured/underinsured patients in rural and semi-urban areas. High rates of diabetes, hypertension, and behavioral health needs.',
  '100-200 staff'
) ON CONFLICT (id) DO NOTHING;

-- Verify
SELECT 'Grants seeded: ' || COUNT(*) FROM grants WHERE source = 'synthetic';
SELECT 'Profiles seeded: ' || COUNT(*) FROM clinic_profiles;
