// Dominio de clientes y reglas de validación en frontend (HU-01)

export function calculateAge(birthDateString) {
  if (!birthDateString) return null;
  const birthDate = new Date(birthDateString);
  if (isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function isAdult(birthDateString) {
  const age = calculateAge(birthDateString);
  return age !== null && age >= 18;
}

export function formatDocument(type, number) {
  if (!type && !number) return '-';
  return `${type || 'DOC'}: ${number || '-'}`;
}
