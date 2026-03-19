import { ClinicProfile } from "./types";

export const DEFAULT_CLINIC_PROFILE: ClinicProfile = {
  id: "clinic-001",
  clinicName: "Sunrise Community Health Center",
  state: "Colorado",
  clinicType: "FQHC",
  focusAreas: [
    "behavioral health",
    "dental",
    "preventive care",
    "underserved populations",
    "Medicaid populations",
  ],
  patientPopulationNotes:
    "Primarily low-income, uninsured/underinsured patients in rural and semi-urban areas. High rates of diabetes, hypertension, and behavioral health needs.",
  orgSizeBand: "100-200 staff",
};
