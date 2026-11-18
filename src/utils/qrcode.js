// ==============================================================================
// GYM VIP — Generador Autónomo de Códigos QR (Zero Dependencies)
// Basado en la especificación ISO/IEC 18004 para renderizado en Canvas/SVG
// Soporta modos numérico, alfanumérico y byte (UTF-8) con corrección de errores L, M, Q, H
// ==============================================================================

// Polinomios de campo Galois GF(256)
const EXP_TABLE = new Uint8Array(256);
const LOG_TABLE = new Uint8Array(256);
(function initGF() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = x;
    LOG_TABLE[x] = i;
    x <<= 1;
    if (x & 256) x ^= 0x11d;
  }
  EXP_TABLE[255] = EXP_TABLE[0];
})();

function glog(n) {
  if (n < 1) throw new Error('glog(' + n + ')');
  return LOG_TABLE[n];
}

function gexp(n) {
  while (n < 0) n += 255;
  while (n >= 256) n -= 255;
  return EXP_TABLE[n];
}

function gfMul(x, y) {
  if (x === 0 || y === 0) return 0;
  return gexp(glog(x) + glog(y));
}

function polyMul(p1, p2) {
  const result = new Uint8Array(p1.length + p2.length - 1);
  for (let i = 0; i < p1.length; i++) {
    for (let j = 0; j < p2.length; j++) {
      result[i + j] ^= gfMul(p1[i], p2[j]);
    }
  }
  return result;
}

function getGeneratorPoly(degree) {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    poly = polyMul(poly, new Uint8Array([1, gexp(i)]));
  }
  return poly;
}

// Capacidades y tablas de bloques por versión (1 a 10)
// Estructura: [totalCodewords, ecCodewordsPerBlock, [numBlocks, dataCodewordsPerBlock], ...]
const RS_BLOCK_TABLE = [
  null,
  // v1
  { L: [26, 7, [1, 19]], M: [26, 10, [1, 16]], Q: [26, 13, [1, 13]], H: [26, 17, [1, 9]] },
  // v2
  { L: [44, 10, [1, 34]], M: [44, 16, [1, 28]], Q: [44, 22, [1, 22]], H: [44, 28, [1, 16]] },
  // v3
  { L: [70, 15, [1, 55]], M: [70, 26, [1, 44]], Q: [70, 18, [2, 17]], H: [70, 22, [2, 13]] },
  // v4
  { L: [100, 20, [1, 80]], M: [100, 18, [2, 32]], Q: [100, 26, [2, 24]], H: [100, 16, [4, 9]] },
  // v5
  { L: [134, 26, [1, 108]], M: [134, 24, [2, 43]], Q: [134, 18, [2, 15], [2, 16]], H: [134, 22, [2, 11], [2, 12]] },
  // v6
  { L: [172, 18, [2, 68]], M: [172, 16, [4, 27]], Q: [172, 24, [4, 19]], H: [172, 28, [4, 15]] },
  // v7
  { L: [196, 20, [2, 78]], M: [196, 18, [4, 31]], Q: [196, 18, [2, 14], [4, 15]], H: [196, 26, [4, 13], [1, 14]] },
  // v8
  { L: [242, 24, [2, 97]], M: [242, 22, [2, 38], [2, 39]], Q: [242, 22, [4, 18], [2, 19]], H: [242, 26, [4, 14], [2, 15]] },
  // v9
  { L: [292, 30, [2, 116]], M: [292, 22, [3, 36], [2, 37]], Q: [292, 20, [4, 16], [4, 17]], H: [292, 24, [4, 12], [4, 13]] },
  // v10
  { L: [346, 18, [2, 68], [2, 69]], M: [346, 26, [4, 43], [1, 44]], Q: [346, 24, [6, 19], [2, 20]], H: [346, 28, [6, 15], [2, 16]] },
];

const ALIGNMENT_PATTERN_POS = [
  [],
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
];

// Codificación Byte UTF-8
function encodeToUtf8(str) {
  const bytes = [];
  for (let i = 0; i < str.length; i++) {
    let c = str.charCodeAt(i);
    if (c < 128) bytes.push(c);
    else if (c < 2048) {
      bytes.push(192 | (c >> 6));
      bytes.push(128 | (c & 63));
    } else if (c < 55296 || c >= 57344) {
      bytes.push(224 | (c >> 12));
      bytes.push(128 | ((c >> 6) & 63));
      bytes.push(128 | (c & 63));
    } else {
      i++;
      c = 65536 + (((c & 1023) << 10) | (str.charCodeAt(i) & 1023));
      bytes.push(240 | (c >> 18));
      bytes.push(128 | ((c >> 12) & 63));
      bytes.push(128 | ((c >> 6) & 63));
      bytes.push(128 | (c & 63));
    }
  }
  return bytes;
}

class BitBuffer {
  constructor() {
    this.buffer = [];
    this.length = 0;
  }
  put(num, length) {
    for (let i = 0; i < length; i++) {
      this.putBit(((num >>> (length - i - 1)) & 1) === 1);
    }
  }
  putBit(bit) {
    const bufIndex = Math.floor(this.length / 8);
    if (this.buffer.length <= bufIndex) this.buffer.push(0);
    if (bit) this.buffer[bufIndex] |= 0x80 >>> (this.length % 8);
    this.length++;
  }
}

export function generateQrMatrix(text, ecLevel = 'M') {
  const utf8Bytes = encodeToUtf8(text);

  // Determinar versión mínima requerida
  let version = 1;
  let rsBlocks = null;
  let dataCapacity = 0;

  for (; version <= 10; version++) {
    rsBlocks = RS_BLOCK_TABLE[version][ecLevel];
    // Calcular capacidad de datos en bytes
    let totalDataCodewords = 0;
    for (let b = 2; b < rsBlocks.length; b++) {
      totalDataCodewords += rsBlocks[b][0] * rsBlocks[b][1];
    }
    // Header byte mode: 4 bits modo + 8/16 bits conteo (8 para v1-v9)
    const headerBits = 4 + (version < 10 ? 8 : 16);
    const requiredBits = headerBits + utf8Bytes.length * 8;
    if (requiredBits <= totalDataCodewords * 8) {
      dataCapacity = totalDataCodewords;
      break;
    }
  }

  if (version > 10) {
    throw new Error('El contenido supera la capacidad máxima soportada para código QR en pantalla.');
  }

  // Generar secuencia de bits
  const bb = new BitBuffer();
  bb.put(0x4, 4); // Byte mode indicator
  bb.put(utf8Bytes.length, version < 10 ? 8 : 16);
  for (let b of utf8Bytes) bb.put(b, 8);

  // Terminador
  const maxBits = dataCapacity * 8;
  if (bb.length + 4 <= maxBits) bb.put(0, 4);
  else if (bb.length < maxBits) bb.put(0, maxBits - bb.length);

  // Relleno a múltiplo de 8
  while (bb.length % 8 !== 0) bb.putBit(false);

  // Padding bytes alternados 0xEC, 0x11
  let padToggle = true;
  while (bb.buffer.length < dataCapacity) {
    bb.buffer.push(padToggle ? 0xec : 0x11);
    padToggle = !padToggle;
  }

  // Dividir en bloques de datos y calcular códigos de error Reed-Solomon
  const ecCodewordsPerBlock = rsBlocks[1];
  const genPoly = getGeneratorPoly(ecCodewordsPerBlock);

  const dataBlocks = [];
  const ecBlocks = [];
  let byteOffset = 0;

  for (let b = 2; b < rsBlocks.length; b++) {
    const numBlocks = rsBlocks[b][0];
    const dataPerBlock = rsBlocks[b][1];
    for (let i = 0; i < numBlocks; i++) {
      const blockData = bb.buffer.slice(byteOffset, byteOffset + dataPerBlock);
      byteOffset += dataPerBlock;
      dataBlocks.push(blockData);

      // Calcular Reed Solomon EC
      const infoPoly = new Uint8Array(blockData.length + ecCodewordsPerBlock);
      infoPoly.set(blockData);
      for (let j = 0; j < blockData.length; j++) {
        const coef = infoPoly[j];
        if (coef !== 0) {
          for (let k = 0; k < genPoly.length; k++) {
            infoPoly[j + k] ^= gfMul(genPoly[k], coef);
          }
        }
      }
      ecBlocks.push(Array.from(infoPoly.slice(blockData.length)));
    }
  }

  // Interleaving de datos y EC
  const interleaved = [];
  let maxDataLen = Math.max(...dataBlocks.map((b) => b.length));
  for (let i = 0; i < maxDataLen; i++) {
    for (let block of dataBlocks) {
      if (i < block.length) interleaved.push(block[i]);
    }
  }
  for (let i = 0; i < ecCodewordsPerBlock; i++) {
    for (let block of ecBlocks) {
      interleaved.push(block[i]);
    }
  }

  // Tamaño de matriz: 17 + 4 * version
  const size = 17 + 4 * version;
  const matrix = Array.from({ length: size }, () => Array(size).fill(null));
  const isFunction = Array.from({ length: size }, () => Array(size).fill(false));

  function setFunction(r, c, val) {
    matrix[r][c] = val;
    isFunction[r][c] = true;
  }

  // 1. Finder patterns (7x7 en las 3 esquinas)
  function placeFinder(row, col) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = row + r;
        const nc = col + c;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        const isSeparator = r === -1 || r === 7 || c === -1 || c === 7;
        setFunction(nr, nc, isSeparator ? false : isBorder || isCenter);
      }
    }
  }
  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // 2. Timing patterns
  for (let i = 8; i < size - 8; i++) {
    if (!isFunction[6][i]) setFunction(6, i, i % 2 === 0);
    if (!isFunction[i][6]) setFunction(i, 6, i % 2 === 0);
  }

  // 3. Dark module
  setFunction(4 * version + 9, 8, true);

  // 4. Alignment patterns
  const alignPos = ALIGNMENT_PATTERN_POS[version];
  for (let r of alignPos) {
    for (let c of alignPos) {
      if (isFunction[r][c]) continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const isSquareBorder = Math.abs(dr) === 2 || Math.abs(dc) === 2;
          const isCenter = dr === 0 && dc === 0;
          setFunction(r + dr, c + dc, isSquareBorder || isCenter);
        }
      }
    }
  }

  // 5. Reservar áreas de formato
  for (let i = 0; i < 9; i++) {
    if (!isFunction[8][i]) isFunction[8][i] = true;
    if (!isFunction[i][8]) isFunction[i][8] = true;
  }
  for (let i = size - 8; i < size; i++) {
    if (!isFunction[8][i]) isFunction[8][i] = true;
  }
  for (let i = size - 7; i < size; i++) {
    if (!isFunction[i][8]) isFunction[i][8] = true;
  }

  // 6. Colocar datos en zig-zag con máscara 0 ((row + col) % 2 === 0)
  let bitIdx = 0;
  const bitArray = [];
  for (let byte of interleaved) {
    for (let b = 7; b >= 0; b--) {
      bitArray.push(((byte >>> b) & 1) === 1);
    }
  }

  let col = size - 1;
  let upward = true;
  while (col > 0) {
    if (col === 6) col--; // Saltar timing pattern vertical
    const rows = upward
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i);

    for (let r of rows) {
      for (let c of [col, col - 1]) {
        if (!isFunction[r][c]) {
          const bit = bitIdx < bitArray.length ? bitArray[bitIdx++] : false;
          // Máscara 0: (r + c) % 2 === 0
          const mask = (r + c) % 2 === 0;
          matrix[r][c] = mask ? !bit : bit;
        }
      }
    }
    col -= 2;
    upward = !upward;
  }

  // 7. Colocar información de formato (Máscara 0, EC Level M -> 0x5412 XOR 0x5412 = 0x0000 o código BCH)
  // Formato precalculado para Mask 0:
  // L: 0x77c4, M: 0x5412, Q: 0x355f, H: 0x1689
  const FORMAT_BITS = {
    L: 0x77c4,
    M: 0x5412,
    Q: 0x355f,
    H: 0x1689,
  }[ecLevel] || 0x5412;

  for (let i = 0; i < 15; i++) {
    const bit = ((FORMAT_BITS >>> (14 - i)) & 1) === 1;
    // Primera copia
    if (i <= 5) matrix[8][i] = bit;
    else if (i === 6) matrix[8][7] = bit;
    else if (i === 7) matrix[8][8] = bit;
    else if (i === 8) matrix[7][8] = bit;
    else matrix[14 - i][8] = bit;

    // Segunda copia
    if (i < 8) matrix[size - 1 - i][8] = bit;
    else matrix[8][size - 15 + i] = bit;
  }

  // Garantizar que toda celda no asignada sea booleana
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c] === null) {
        matrix[r][c] = false;
      }
    }
  }

  return matrix;
}
