const labels = {
  DISABLED: 'Desactivado', SIMULATION: 'Simulación · sin envío real',
  UNCONFIGURED: 'Pendiente de configuración', CONFIGURED_REAL: 'Configurado para envío real',
  UNVERIFIED: 'No se pudo verificar',
};
export const channelStatusLabel = status => labels[status] || labels.UNVERIFIED;
export const projectChannels = ['WHATSAPP', 'APP'];
