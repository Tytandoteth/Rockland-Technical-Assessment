import { ClinicProfile as ClinicProfileType } from "@/lib/types";

interface ClinicProfileProps {
  profile: ClinicProfileType;
}

export default function ClinicProfile({ profile }: ClinicProfileProps) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-bold text-gray-900">{profile.clinicName}</h3>
        <p className="text-xs text-gray-500">
          {profile.clinicType} · {profile.state}
          {profile.orgSizeBand && ` · ${profile.orgSizeBand}`}
        </p>
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold mb-1.5">
          Focus Areas
        </p>
        <div className="flex flex-wrap gap-1.5">
          {profile.focusAreas.map((area) => (
            <span
              key={area}
              className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded-full border border-blue-100"
            >
              {area}
            </span>
          ))}
        </div>
      </div>

      {profile.patientPopulationNotes && (
        <div>
          <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold mb-1">
            Patient Population
          </p>
          <p className="text-xs text-gray-600 leading-relaxed">
            {profile.patientPopulationNotes}
          </p>
        </div>
      )}
    </div>
  );
}
