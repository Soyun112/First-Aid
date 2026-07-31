/** 환자·입력 요약 라벨 */

export function summarizePatient(patient) {
  if (!patient) return null;
  return {
    name: patient.name,
    age: patient.ageLabel,
    from: patient.from,
    to: patient.to,
    bed: patient.bed,
  };
}
