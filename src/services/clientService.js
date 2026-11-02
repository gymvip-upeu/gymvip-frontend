// ==============================================================================
// GYM VIP — Servicio de Gestión de Clientes / Socios (HU-01)
// ==============================================================================

import { searchClientsApi, getClientByIdApi, registerClientApi } from '../api/clientApi';
import { validateClientRegistration } from '../validators/clientValidator';

export async function fetchClients(query = '', page = 0, size = 20, token = null) {
  return await searchClientsApi(query, page, size, token);
}

export async function fetchClientById(id, token = null) {
  return await getClientByIdApi(id, token);
}

export async function registerNewClient(clientData, token = null) {
  const errors = validateClientRegistration(clientData);
  if (errors.length > 0) {
    throw new Error(errors.join(' '));
  }

  const payload = {
    firstName: clientData.firstName.trim(),
    lastName: clientData.lastName.trim(),
    documentType: clientData.documentType,
    documentNumber: clientData.documentNumber.trim(),
    birthDate: clientData.birthDate,
    phone: clientData.phone && clientData.phone.trim() ? clientData.phone.trim() : null,
    email: clientData.email && clientData.email.trim() ? clientData.email.trim() : null,
  };

  return await registerClientApi(payload, token);
}
