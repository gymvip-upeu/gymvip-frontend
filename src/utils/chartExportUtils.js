// ==============================================================================
// GYM VIP — Utilidades Nativas de Exportación y Copia de Gráficos
// Soporte PNG Retina (2x), Portapapeles (ClipboardItem) y CSV Sanitizado
// ==============================================================================

/**
 * Sanitiza valores de texto para evitar ataques de inyección de fórmulas en CSV/Excel (CSV Injection)
 * Previene fórmulas ejecutables que inician con '=', '+', '-', '@'
 */
export function sanitizeCsvCell(value) {
  if (value === null || value === undefined) return '';
  const str = String(value).trim();
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Exporta un conjunto de datos tabular a un archivo CSV descargable
 */
export function exportDataToCsv(filename, headers, rows) {
  const headerLine = headers.map(sanitizeCsvCell).join(',');
  const rowLines = rows.map((row) => row.map(sanitizeCsvCell).join(','));
  const csvContent = '\uFEFF' + [headerLine, ...rowLines].join('\r\n'); // BOM UTF-8

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename.replace(/\.csv$/i, '')}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Renderiza el contenedor de un gráfico SVG hacia un canvas HTML5 con marca de agua y cabecera
 */
async function renderChartToCanvas(containerElement, title, theme = 'dark', scale = 2) {
  if (!containerElement) throw new Error('Contenedor del gráfico no encontrado');

  const svgElement = containerElement.querySelector('svg');
  if (!svgElement) throw new Error('Elemento SVG del gráfico no encontrado');

  const rect = svgElement.getBoundingClientRect();
  const width = Math.max(rect.width, 400);
  const height = Math.max(rect.height, 260);

  const headerHeight = 70;
  const footerHeight = 35;
  const totalWidth = width + 40;
  const totalHeight = height + headerHeight + footerHeight;

  const canvas = document.createElement('canvas');
  canvas.width = totalWidth * scale;
  canvas.height = totalHeight * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);

  const isDark = theme === 'dark';
  ctx.fillStyle = isDark ? '#0B1320' : '#FFFFFF';
  ctx.fillRect(0, 0, totalWidth, totalHeight);

  // Borde decorativo
  ctx.strokeStyle = isDark ? 'rgba(212, 175, 55, 0.3)' : 'rgba(0, 0, 0, 0.1)';
  ctx.lineWidth = 1;
  ctx.strokeRect(1, 1, totalWidth - 2, totalHeight - 2);

  // Cabecera institucional
  ctx.fillStyle = isDark ? '#D4AF37' : '#9A7B1C';
  ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(title || 'Métrica Analítica GYM VIP', 20, 32);

  ctx.fillStyle = isDark ? '#94A3B8' : '#64748B';
  ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const fechaStr = new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/Lima' });
  ctx.fillText(`VIP CENTER FIT · LUXURY FITNESS  |  Generado: ${fechaStr} (America/Lima)`, 20, 52);

  // Línea divisoria
  ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
  ctx.beginPath();
  ctx.moveTo(20, 62);
  ctx.lineTo(totalWidth - 20, 62);
  ctx.stroke();

  // Pie institucional
  ctx.fillStyle = isDark ? '#64748B' : '#94A3B8';
  ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('Confidencial · Uso interno exclusivo · https://gymvip.vercel.app', 20, totalHeight - 14);

  // Clonar y serializar SVG
  const clonedSvg = svgElement.cloneNode(true);
  clonedSvg.setAttribute('width', width);
  clonedSvg.setAttribute('height', height);

  const serializer = new window.XMLSerializer();
  let svgString = serializer.serializeToString(clonedSvg);
  if (!svgString.includes('xmlns="http://www.w3.org/2000/svg"')) {
    svgString = svgString.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);

  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.drawImage(img, 20, headerHeight, width, height);
      URL.revokeObjectURL(svgUrl);
      resolve(canvas);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(svgUrl);
      reject(err);
    };
    img.src = svgUrl;
  });
}

/**
 * Descarga el gráfico en formato PNG
 */
export async function downloadChartAsPng(containerElement, filename, title, theme = 'dark') {
  const canvas = await renderChartToCanvas(containerElement, title, theme, 2);
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = `${filename.replace(/\.png$/i, '')}_${new Date().toISOString().slice(0, 10)}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Copia el gráfico al portapapeles del sistema
 */
export async function copyChartToClipboard(containerElement, title, theme = 'dark') {
  const canvas = await renderChartToCanvas(containerElement, title, theme, 2);

  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        reject(new Error('No se pudo generar el mapa de bits del gráfico'));
        return;
      }
      try {
        if (navigator.clipboard && typeof window.ClipboardItem !== 'undefined') {
          await navigator.clipboard.write([
            new window.ClipboardItem({ 'image/png': blob })
          ]);
          resolve({ success: true, method: 'clipboard' });
        } else {
          // Fallback a descarga directa
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `${(title || 'grafico').toLowerCase().replace(/\s+/g, '_')}.png`;
          link.href = url;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          resolve({ success: true, method: 'download_fallback' });
        }
      } catch (err) {
        reject(err);
      }
    }, 'image/png');
  });
}
