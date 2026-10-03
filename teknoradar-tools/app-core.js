/* app-core.js — TeknoRadar Tools
   Uygulama temel iş mantığı, depolama, araç motorları ve arayüz yöneticisi. */

const STORAGE_KEYS = {
  theme: 'technoradar_theme',
  favorites: 'technoradar_favorites',
  recentTools: 'technoradar_recent_tools',
  settings: 'technoradar_settings'
};

const MAX_RECENT_TOOLS = 5;

const DEFAULT_SETTINGS = {
  binaryUnits: false
};

function safeParse(raw, fallback) {
  if (raw === null || raw === undefined) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed === null || parsed === undefined ? fallback : parsed;
  } catch (err) {
    return fallback;
  }
}

function safeGet(key, fallback) {
  try {
    return safeParse(window.localStorage.getItem(key), fallback);
  } catch (err) {
    return fallback;
  }
}

function safeSet(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    return false;
  }
}

const Store = {
  getTheme() {
    const theme = safeGet(STORAGE_KEYS.theme, 'system');
    return ['dark', 'light', 'system'].includes(theme) ? theme : 'system';
  },
  setTheme(theme) {
    return safeSet(STORAGE_KEYS.theme, theme);
  },

  getFavorites() {
    const favs = safeGet(STORAGE_KEYS.favorites, []);
    return Array.isArray(favs) ? favs.filter(id => typeof id === 'string') : [];
  },
  setFavorites(list) {
    return safeSet(STORAGE_KEYS.favorites, list);
  },
  isFavorite(toolId) {
    return Store.getFavorites().includes(toolId);
  },
  toggleFavorite(toolId) {
    const favs = Store.getFavorites();
    const idx = favs.indexOf(toolId);
    if (idx === -1) {
      favs.unshift(toolId);
    } else {
      favs.splice(idx, 1);
    }
    Store.setFavorites(favs);
    return favs.includes(toolId);
  },
  clearFavorites() {
    return Store.setFavorites([]);
  },

  getRecentTools() {
    const recent = safeGet(STORAGE_KEYS.recentTools, []);
    return Array.isArray(recent) ? recent.filter(id => typeof id === 'string') : [];
  },
  addRecentTool(toolId) {
    let recent = Store.getRecentTools();
    recent = recent.filter(id => id !== toolId);
    recent.unshift(toolId);
    recent = recent.slice(0, MAX_RECENT_TOOLS);
    safeSet(STORAGE_KEYS.recentTools, recent);
    return recent;
  },
  clearRecentTools() {
    return safeSet(STORAGE_KEYS.recentTools, []);
  },

  getSettings() {
    const settings = safeGet(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
    return Object.assign({}, DEFAULT_SETTINGS, typeof settings === 'object' && settings ? settings : {});
  },
  setSettings(partial) {
    const merged = Object.assign({}, Store.getSettings(), partial);
    safeSet(STORAGE_KEYS.settings, merged);
    return merged;
  },

  clearAll() {
    try {
      window.localStorage.removeItem(STORAGE_KEYS.theme);
      window.localStorage.removeItem(STORAGE_KEYS.favorites);
      window.localStorage.removeItem(STORAGE_KEYS.recentTools);
      window.localStorage.removeItem(STORAGE_KEYS.settings);
      return true;
    } catch (err) {
      return false;
    }
  }
};

const UI = (() => {
  let toastContainer = null;
  let modalRoot = null;

  function ensureToastContainer() {
    if (!toastContainer) {
      toastContainer = document.getElementById('toastContainer');
    }
    return toastContainer;
  }

  function ensureModalRoot() {
    if (!modalRoot) {
      modalRoot = document.getElementById('modalRoot');
    }
    return modalRoot;
  }

  function toast(message, type = 'default') {
    const container = ensureToastContainer();
    if (!container) return;

    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    el.setAttribute('role', 'status');

    const icon = document.createElement('span');
    icon.className = 'toast__icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = type === 'success' ? '✓' : type === 'error' ? '!' : type === 'warning' ? '!' : 'i';

    const text = document.createElement('span');
    text.className = 'toast__text';
    text.textContent = message;

    el.appendChild(icon);
    el.appendChild(text);
    container.appendChild(el);

    requestAnimationFrame(() => el.classList.add('toast--visible'));

    window.setTimeout(() => {
      el.classList.remove('toast--visible');
      window.setTimeout(() => el.remove(), 250);
    }, 2600);
  }

  function confirmModal({ title, message, confirmText = 'Onayla', cancelText = 'Vazgeç', danger = false }) {
    return new Promise(resolve => {
      const root = ensureModalRoot();
      if (!root) {
        resolve(window.confirm(message));
        return;
      }

      root.innerHTML = '';

      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';

      const box = document.createElement('div');
      box.className = 'modal-box';
      box.setAttribute('role', 'dialog');
      box.setAttribute('aria-modal', 'true');

      const h = document.createElement('h3');
      h.className = 'modal-title';
      h.textContent = title;

      const p = document.createElement('p');
      p.className = 'modal-message';
      p.textContent = message;

      const actions = document.createElement('div');
      actions.className = 'modal-actions';

      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'btn btn--ghost';
      cancelBtn.textContent = cancelText;

      const confirmBtn = document.createElement('button');
      confirmBtn.type = 'button';
      confirmBtn.className = danger ? 'btn btn--danger' : 'btn btn--primary';
      confirmBtn.textContent = confirmText;

      function close(result) {
        overlay.classList.remove('modal-overlay--visible');
        window.setTimeout(() => { root.innerHTML = ''; }, 200);
        resolve(result);
      }

      cancelBtn.addEventListener('click', () => close(false));
      confirmBtn.addEventListener('click', () => close(true));
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close(false);
      });

      actions.appendChild(cancelBtn);
      actions.appendChild(confirmBtn);
      box.appendChild(h);
      box.appendChild(p);
      box.appendChild(actions);
      overlay.appendChild(box);
      root.appendChild(overlay);

      requestAnimationFrame(() => overlay.classList.add('modal-overlay--visible'));
      confirmBtn.focus();
    });
  }

  function applyTheme(theme) {
    const root = document.documentElement;
    let resolved = theme;
    if (theme === 'system') {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      resolved = prefersDark ? 'dark' : 'light';
    }
    root.setAttribute('data-theme', resolved);
  }

  async function copyToClipboard(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      throw new Error('clipboard-api-unavailable');
    } catch (err) {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        const ok = document.execCommand('copy');
        ta.remove();
        return ok;
      } catch (err2) {
        return false;
      }
    }
  }

  return { toast, confirmModal, applyTheme, copyToClipboard };
})();

/* Yerel QR Motoru */
const TeknoQR = (() => {
  const PAD0 = 0xEC;
  const PAD1 = 0x11;
  const EC_LEVELS = { L: 1, M: 0, Q: 3, H: 2 };
  const EXP_TABLE = new Array(256);
  const LOG_TABLE = new Array(256);
  for (let i = 0; i < 8; i++) EXP_TABLE[i] = 1 << i;
  for (let i = 8; i < 256; i++) {
    EXP_TABLE[i] = EXP_TABLE[i - 4] ^ EXP_TABLE[i - 5] ^ EXP_TABLE[i - 6] ^ EXP_TABLE[i - 8];
  }
  for (let i = 0; i < 255; i++) LOG_TABLE[EXP_TABLE[i]] = i;

  function gexp(n) {
    while (n < 0) n += 255;
    while (n >= 256) n -= 255;
    return EXP_TABLE[n];
  }
  function glog(n) {
    if (n < 1) throw new Error('glog(' + n + ')');
    return LOG_TABLE[n];
  }

  function Polynomial(num, shift) {
    let offset = 0;
    while (offset < num.length && num[offset] === 0) offset++;
    this.num = new Array(num.length - offset + shift).fill(0);
    for (let i = 0; i < num.length - offset; i++) this.num[i] = num[i + offset];
  }
  Polynomial.prototype.get = function (i) { return this.num[i]; };
  Polynomial.prototype.getLength = function () { return this.num.length; };
  Polynomial.prototype.multiply = function (e) {
    const num = new Array(this.getLength() + e.getLength() - 1).fill(0);
    for (let i = 0; i < this.getLength(); i++) {
      for (let j = 0; j < e.getLength(); j++) {
        num[i + j] ^= gexp(glog(this.get(i)) + glog(e.get(j)));
      }
    }
    return new Polynomial(num, 0);
  };
  Polynomial.prototype.mod = function (e) {
    if (this.getLength() - e.getLength() < 0) return this;
    const ratio = glog(this.get(0)) - glog(e.get(0));
    const num = this.num.slice();
    for (let i = 0; i < e.getLength(); i++) {
      num[i] ^= gexp(glog(e.get(i)) + ratio);
    }
    return new Polynomial(num, 0).mod(e);
  };

  function errorCorrectPolynomial(errorCorrectLength) {
    let a = new Polynomial([1], 0);
    for (let i = 0; i < errorCorrectLength; i++) {
      a = a.multiply(new Polynomial([1, gexp(i)], 0));
    }
    return a;
  }

  const RS_BLOCK_TABLE = {
    1: { L: [[7, 1, 19]], M: [[10, 1, 16]], Q: [[13, 1, 13]], H: [[17, 1, 9]] },
    2: { L: [[10, 1, 34]], M: [[16, 1, 28]], Q: [[22, 1, 22]], H: [[28, 1, 16]] },
    3: { L: [[15, 1, 55]], M: [[26, 1, 44]], Q: [[18, 2, 17]], H: [[22, 2, 13]] },
    4: { L: [[20, 1, 80]], M: [[18, 2, 32]], Q: [[26, 2, 24]], H: [[16, 4, 9]] },
    5: { L: [[26, 1, 108]], M: [[24, 2, 43]], Q: [[18, 2, 15], [18, 2, 16]], H: [[22, 2, 11], [22, 2, 12]] },
    6: { L: [[18, 2, 68]], M: [[16, 4, 27]], Q: [[24, 4, 19]], H: [[28, 4, 15]] },
    7: { L: [[20, 2, 78]], M: [[18, 4, 31]], Q: [[18, 2, 14], [18, 4, 15]], H: [[26, 4, 13], [26, 1, 14]] },
    8: { L: [[24, 2, 97]], M: [[22, 2, 38], [22, 2, 39]], Q: [[22, 4, 18], [22, 2, 19]], H: [[26, 4, 14], [26, 2, 15]] },
    9: { L: [[30, 2, 116]], M: [[22, 3, 36], [22, 2, 37]], Q: [[20, 4, 16], [20, 4, 17]], H: [[24, 4, 12], [24, 4, 13]] },
    10: { L: [[18, 2, 68], [18, 2, 69]], M: [[26, 4, 43], [26, 1, 44]], Q: [[24, 6, 19], [24, 2, 20]], H: [[28, 6, 15], [28, 2, 16]] }
  };

  function moduleCount(version) { return version * 4 + 17; }

  function getRSBlocks(version, ecLevel) {
    const spec = RS_BLOCK_TABLE[version][ecLevel];
    const blocks = [];
    spec.forEach(([ec, count, dataCount]) => {
      for (let i = 0; i < count; i++) blocks.push({ ec, dataCount });
    });
    return blocks;
  }

  function BitBuffer() {
    this.buffer = [];
    this.length = 0;
  }
  BitBuffer.prototype.put = function (num, length) {
    for (let i = 0; i < length; i++) this.putBit(((num >>> (length - i - 1)) & 1) === 1);
  };
  BitBuffer.prototype.putBit = function (bit) {
    const bufIndex = Math.floor(this.length / 8);
    if (this.buffer.length <= bufIndex) this.buffer.push(0);
    if (bit) this.buffer[bufIndex] |= (0x80 >>> (this.length % 8));
    this.length++;
  };

  function utf8Bytes(str) {
    return Array.from(new TextEncoder().encode(str));
  }

  function createData(version, ecLevel, dataBytes) {
    const rsBlocks = getRSBlocks(version, ecLevel);
    const buffer = new BitBuffer();

    buffer.put(4, 4);
    buffer.put(dataBytes.length, version <= 9 ? 8 : 16);
    dataBytes.forEach(b => buffer.put(b, 8));

    const totalDataCount = rsBlocks.reduce((sum, b) => sum + b.dataCount, 0);
    if (buffer.length > totalDataCount * 8) throw new Error('too-long');
    if (buffer.length + 4 <= totalDataCount * 8) buffer.put(0, 4);
    while (buffer.length % 8 !== 0) buffer.putBit(false);
    while (true) {
      if (buffer.length >= totalDataCount * 8) break;
      buffer.put(PAD0, 8);
      if (buffer.length >= totalDataCount * 8) break;
      buffer.put(PAD1, 8);
    }
    return createBytes(buffer, rsBlocks);
  }

  function createBytes(buffer, rsBlocks) {
    let offset = 0;
    const dcdata = [];
    const ecdata = [];
    let maxDcCount = 0;
    let maxEcCount = 0;

    rsBlocks.forEach(block => {
      const dcCount = block.dataCount;
      const ecCount = block.ec;
      maxDcCount = Math.max(maxDcCount, dcCount);
      maxEcCount = Math.max(maxEcCount, ecCount);

      const dc = new Array(dcCount);
      for (let i = 0; i < dcCount; i++) dc[i] = 0xff & buffer.buffer[i + offset];
      offset += dcCount;

      const rsPoly = errorCorrectPolynomial(ecCount);
      const rawPoly = new Polynomial(dc, rsPoly.getLength() - 1);
      const modPoly = rawPoly.mod(rsPoly);
      const ec = new Array(rsPoly.getLength() - 1);
      for (let i = 0; i < ec.length; i++) {
        const modIndex = i + modPoly.getLength() - ec.length;
        ec[i] = modIndex >= 0 ? modPoly.get(modIndex) : 0;
      }
      dcdata.push(dc);
      ecdata.push(ec);
    });

    const totalCodeCount = rsBlocks.reduce((sum, b) => sum + b.dataCount + b.ec, 0);
    const data = new Array(totalCodeCount);
    let index = 0;
    for (let i = 0; i < maxDcCount; i++) {
      dcdata.forEach(dc => { if (i < dc.length) data[index++] = dc[i]; });
    }
    for (let i = 0; i < maxEcCount; i++) {
      ecdata.forEach(ec => { if (i < ec.length) data[index++] = ec[i]; });
    }
    return data;
  }

  const G15 = (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0);
  const G18 = (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0);
  const G15_MASK = (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1);

  function getBCHDigit(data) {
    let digit = 0;
    while (data !== 0) { digit++; data >>>= 1; }
    return digit;
  }
  function getBCHTypeInfo(data) {
    let d = data << 10;
    while (getBCHDigit(d) - getBCHDigit(G15) >= 0) d ^= (G15 << (getBCHDigit(d) - getBCHDigit(G15)));
    return ((data << 10) | d) ^ G15_MASK;
  }
  function getBCHTypeNumber(data) {
    let d = data << 12;
    while (getBCHDigit(d) - getBCHDigit(G18) >= 0) d ^= (G18 << (getBCHDigit(d) - getBCHDigit(G18)));
    return (data << 12) | d;
  }

  function getMask(maskPattern, i, j) {
    switch (maskPattern) {
      case 0: return (i + j) % 2 === 0;
      case 1: return i % 2 === 0;
      case 2: return j % 3 === 0;
      case 3: return (i + j) % 3 === 0;
      case 4: return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0;
      case 5: return (i * j) % 2 + (i * j) % 3 === 0;
      case 6: return ((i * j) % 2 + (i * j) % 3) % 2 === 0;
      case 7: return ((i * j) % 3 + (i + j) % 2) % 2 === 0;
      default: throw new Error('bad-mask');
    }
  }

  function getAlignmentPositions(version) {
    if (version === 1) return [];
    const positionCounts = [0, 0, 2, 2, 2, 2, 2, 3, 3, 3, 3];
    const first = 6;
    const last = moduleCount(version) - 7;
    const count = positionCounts[version] || 2;
    if (count <= 1) return [first, last];
    const step = Math.ceil((last - first) / (count - 1) / 2) * 2;
    const positions = [];
    for (let pos = last; pos > first; pos -= step) positions.unshift(pos);
    positions.unshift(first);
    return positions;
  }

  function makeMatrix(version, ecLevel, data) {
    const n = moduleCount(version);
    const modules = Array.from({ length: n }, () => new Array(n).fill(null));

    function setupPositionProbePattern(row, col) {
      for (let r = -1; r <= 7; r++) {
        if (row + r <= -1 || n <= row + r) continue;
        for (let c = -1; c <= 7; c++) {
          if (col + c <= -1 || n <= col + c) continue;
          const dark = (0 <= r && r <= 6 && (c === 0 || c === 6)) ||
                       (0 <= c && c <= 6 && (r === 0 || r === 6)) ||
                       (2 <= r && r <= 4 && 2 <= c && c <= 4);
          modules[row + r][col + c] = dark;
        }
      }
    }
    setupPositionProbePattern(0, 0);
    setupPositionProbePattern(n - 7, 0);
    setupPositionProbePattern(0, n - 7);

    for (let r = 8; r < n - 8; r++) if (modules[r][6] === null) modules[r][6] = r % 2 === 0;
    for (let c = 8; c < n - 8; c++) if (modules[6][c] === null) modules[6][c] = c % 2 === 0;

    const positions = getAlignmentPositions(version);
    positions.forEach(row => {
      positions.forEach(col => {
        if (modules[row][col] !== null) return;
        for (let r = -2; r <= 2; r++) {
          for (let c = -2; c <= 2; c++) {
            const dark = r === -2 || r === 2 || c === -2 || c === 2 || (r === 0 && c === 0);
            modules[row + r][col + c] = dark;
          }
        }
      });
    });

    modules[n - 8][8] = true;

    let bestMask = 0;
    let bestScore = Infinity;
    let bestSnapshot = null;

    for (let mask = 0; mask < 8; mask++) {
      const snapshot = modules.map(row => row.slice());
      placeFormatInfo(snapshot, n, ecLevel, mask, version);
      placeData(snapshot, n, data, mask);
      const score = evaluateMask(snapshot, n);
      if (score < bestScore) { bestScore = score; bestMask = mask; bestSnapshot = snapshot; }
    }

    return bestSnapshot;
  }

  function placeFormatInfo(modules, n, ecLevel, maskPattern, version) {
    const typeInfo = (EC_LEVELS[ecLevel] << 3) | maskPattern;
    const bch = getBCHTypeInfo(typeInfo);

    for (let i = 0; i < 15; i++) {
      const mod = ((bch >> i) & 1) === 1;
      if (i < 6) modules[i][8] = mod;
      else if (i < 8) modules[i + 1][8] = mod;
      else modules[n - 15 + i][8] = mod;
    }
    for (let i = 0; i < 15; i++) {
      const mod = ((bch >> i) & 1) === 1;
      if (i < 8) modules[8][n - i - 1] = mod;
      else if (i < 9) modules[8][15 - i - 1 + 1] = mod;
      else modules[8][15 - i - 1] = mod;
    }

    if (version >= 7) {
      const bchVer = getBCHTypeNumber(version);
      for (let i = 0; i < 18; i++) {
        const mod = ((bchVer >> i) & 1) === 1;
        modules[Math.floor(i / 3)][i % 3 + n - 8 - 3] = mod;
        modules[i % 3 + n - 8 - 3][Math.floor(i / 3)] = mod;
      }
    }
  }

  function placeData(modules, n, data, maskPattern) {
    let inc = -1;
    let row = n - 1;
    let bitIndex = 7;
    let byteIndex = 0;

    for (let col = n - 1; col > 0; col -= 2) {
      if (col === 6) col--;
      while (true) {
        for (let c = 0; c < 2; c++) {
          const cc = col - c;
          if (modules[row][cc] === null) {
            let dark = false;
            if (byteIndex < data.length) {
              dark = ((data[byteIndex] >>> bitIndex) & 1) === 1;
            }
            if (getMask(maskPattern, row, cc)) dark = !dark;
            modules[row][cc] = dark;
            bitIndex--;
            if (bitIndex === -1) { byteIndex++; bitIndex = 7; }
          }
        }
        row += inc;
        if (row < 0 || n <= row) { row -= inc; inc = -inc; break; }
      }
    }
  }

  function evaluateMask(modules, n) {
    let score = 0;
    for (let r = 0; r < n; r++) {
      let count = 1;
      for (let c = 1; c < n; c++) {
        if (modules[r][c] === modules[r][c - 1]) count++;
        else count = 1;
        if (count === 5) score += 3;
        else if (count > 5) score += 1;
      }
    }
    for (let c = 0; c < n; c++) {
      let count = 1;
      for (let r = 1; r < n; r++) {
        if (modules[r][c] === modules[r - 1][c]) count++;
        else count = 1;
        if (count === 5) score += 3;
        else if (count > 5) score += 1;
      }
    }
    for (let r = 0; r < n - 1; r++) {
      for (let c = 0; c < n - 1; c++) {
        const v = modules[r][c];
        if (v === modules[r][c + 1] && v === modules[r + 1][c] && v === modules[r + 1][c + 1]) score += 3;
      }
    }
    let dark = 0;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (modules[r][c]) dark++;
    const ratio = Math.abs((100 * dark / (n * n)) - 50) / 5;
    score += Math.floor(ratio) * 10;
    return score;
  }

  function pickVersionAndLevel(byteLength) {
    const preferredOrder = ['L', 'M', 'Q'];
    for (let version = 1; version <= 10; version++) {
      for (const level of preferredOrder) {
        const rsBlocks = RS_BLOCK_TABLE[version][level];
        const totalData = rsBlocks.reduce((s, b) => s + b[1] * b[2], 0);
        const capacityBytes = totalData - (version <= 9 ? 2 : 3);
        if (capacityBytes >= byteLength) return { version, level };
      }
    }
    return null;
  }

  function generate(text) {
    const bytes = utf8Bytes(text);
    const picked = pickVersionAndLevel(bytes.length);
    if (!picked) throw new Error('data-too-long');
    const { version, level } = picked;
    const data = createData(version, level, bytes);
    const modules = makeMatrix(version, level, data);
    return { modules, size: moduleCount(version) };
  }

  return { generate };
})();

/* Araç Fonksiyonları */
const Tools = {};

Tools.qr = {
  buildPayload(type, fields) {
    switch (type) {
      case 'text':
        return fields.text || '';
      case 'url': {
        let url = (fields.url || '').trim();
        if (url && !/^https?:\/\//i.test(url)) url = 'https://' + url;
        return url;
      }
      case 'wifi': {
        const ssid = (fields.ssid || '').replace(/([\\;,:"])/g, '\\$1');
        const pass = (fields.pass || '').replace(/([\\;,:"])/g, '\\$1');
        const auth = fields.auth || 'WPA';
        const hidden = fields.hidden ? 'true' : 'false';
        return `WIFI:T:${auth};S:${ssid};P:${pass};H:${hidden};;`;
      }
      case 'phone':
        return 'tel:' + (fields.phone || '').replace(/[^\d+]/g, '');
      case 'email': {
        const to = (fields.to || '').trim();
        const subject = fields.subject ? '?subject=' + encodeURIComponent(fields.subject) : '';
        return `mailto:${to}${subject}`;
      }
      default:
        return '';
    }
  },

  generate(payload) {
    if (!payload || !payload.trim()) throw new Error('Lütfen bir değer girin.');
    try {
      return TeknoQR.generate(payload);
    } catch (err) {
      throw new Error('Girilen veri QR koduna sığmayacak kadar uzun.');
    }
  },

  toSVG(qrResult, opts = {}) {
    const { modules, size } = qrResult;
    const px = opts.pixelSize || 8;
    const quiet = 4;
    const total = (size + quiet * 2) * px;
    const dark = opts.darkColor || '#080B12';
    const light = opts.lightColor || '#FFFFFF';

    let rects = '';
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (modules[r][c]) {
          rects += `<rect x="${(c + quiet) * px}" y="${(r + quiet) * px}" width="${px}" height="${px}"/>`;
        }
      }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${total}" height="${total}" shape-rendering="crispEdges">` +
      `<rect width="${total}" height="${total}" fill="${light}"/>` +
      `<g fill="${dark}">${rects}</g>` +
      `</svg>`;
  }
};

Tools.json = {
  format(input, indent = 2) {
    if (!input || !input.trim()) throw new Error('Lütfen bir değer girin.');
    let parsed;
    try { parsed = JSON.parse(input); } catch (err) { throw new Error('Girilen veri geçerli bir JSON değil.'); }
    return JSON.stringify(parsed, null, indent);
  },
  minify(input) {
    if (!input || !input.trim()) throw new Error('Lütfen bir değer girin.');
    let parsed;
    try { parsed = JSON.parse(input); } catch (err) { throw new Error('Girilen veri geçerli bir JSON değil.'); }
    return JSON.stringify(parsed);
  },
  validate(input) {
    if (!input || !input.trim()) return { valid: false, message: '' };
    try {
      JSON.parse(input);
      return { valid: true, message: 'JSON geçerli' };
    } catch (err) {
      return { valid: false, message: 'JSON geçersiz: ' + err.message };
    }
  }
};

Tools.base64 = {
  encode(text) {
    if (!text) throw new Error('Lütfen bir değer girin.');
    try {
      const bytes = new TextEncoder().encode(text);
      let binary = '';
      bytes.forEach(b => { binary += String.fromCharCode(b); });
      return window.btoa(binary);
    } catch (err) {
      throw new Error('Metin Base64 formatına dönüştürülemedi.');
    }
  },
  decode(b64) {
    if (!b64) throw new Error('Lütfen bir değer girin.');
    try {
      const binary = window.atob(b64.trim());
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch (err) {
      throw new Error('Geçersiz Base64 verisi.');
    }
  }
};

Tools.color = {
  parseHex(hex) {
    let h = hex.trim().replace(/^#/, '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16)
    };
  },
  parseRgb(str) {
    const m = str.match(/rgba?\(?\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i);
    if (!m) return null;
    const r = Number(m[1]), g = Number(m[2]), b = Number(m[3]);
    if ([r, g, b].some(v => v < 0 || v > 255 || Number.isNaN(v))) return null;
    return { r, g, b };
  },
  parseHsl(str) {
    const m = str.match(/hsla?\(?\s*(\d{1,3})\s*,\s*(\d{1,3})%?\s*,\s*(\d{1,3})%?/i);
    if (!m) return null;
    const h = Number(m[1]), s = Number(m[2]), l = Number(m[3]);
    if (h < 0 || h > 360 || s < 0 || s > 100 || l < 0 || l > 100) return null;
    return Tools.color.hslToRgb(h, s, l);
  },
  toHex({ r, g, b }) {
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
  },
  toRgbString({ r, g, b }) {
    return `rgb(${r}, ${g}, ${b})`;
  },
  rgbToHsl({ r, g, b }) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s;
    const l = (max + min) / 2;
    if (max === min) { h = 0; s = 0; }
    else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        default: h = (r - g) / d + 4;
      }
      h /= 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  },
  hslToRgb(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    let r, g, b;
    if (s === 0) { r = g = b = l; }
    else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
  },
  toHslString({ h, s, l }) {
    return `hsl(${h}, ${s}%, ${l}%)`;
  },
  fromAny(value) {
    const v = value.trim();
    if (!v) throw new Error('Lütfen bir değer girin.');
    let rgb = null;
    if (v.startsWith('#') || /^[0-9a-fA-F]{3,6}$/.test(v)) rgb = Tools.color.parseHex(v);
    else if (/^rgb/i.test(v)) rgb = Tools.color.parseRgb(v);
    else if (/^hsl/i.test(v)) rgb = Tools.color.parseHsl(v);
    if (!rgb) throw new Error('Geçerli bir HEX/RGB/HSL değeri girin.');
    return {
      hex: Tools.color.toHex(rgb),
      rgb: Tools.color.toRgbString(rgb),
      hsl: Tools.color.toHslString(Tools.color.rgbToHsl(rgb)),
      raw: rgb
    };
  }
};

Tools.storageConvert = {
  decimalUnits: ['B', 'KB', 'MB', 'GB', 'TB'],
  binaryUnits: ['B', 'KiB', 'MiB', 'GiB', 'TiB'],
  toBytes(value, unitIndex, binary) {
    const base = binary ? 1024 : 1000;
    return value * Math.pow(base, unitIndex);
  },
  convert(value, unitIndex, binary) {
    if (Number.isNaN(value) || value < 0) throw new Error('Lütfen geçerli bir sayı girin.');
    const bytes = Tools.storageConvert.toBytes(value, unitIndex, binary);
    const base = binary ? 1024 : 1000;
    const units = binary ? Tools.storageConvert.binaryUnits : Tools.storageConvert.decimalUnits;
    return units.map((unit, i) => ({
      unit,
      value: bytes / Math.pow(base, i)
    }));
  }
};

Tools.device = {
  collect() {
    const nav = window.navigator;
    const notSupported = 'Desteklenmiyor';
    return [
      { label: 'İşletim Sistemi / Platform', value: nav.platform || notSupported },
      { label: 'Tarayıcı Bilgisi (User Agent)', value: nav.userAgent || notSupported },
      { label: 'Dil', value: nav.language || notSupported },
      { label: 'Zaman Dilimi', value: Intl.DateTimeFormat().resolvedOptions().timeZone || notSupported },
      { label: 'Çevrimiçi Durumu', value: nav.onLine ? 'Çevrimiçi' : 'Çevrimdışı' },
      { label: 'Dokunmatik Destek', value: (navigator.maxTouchPoints > 0 || 'ontouchstart' in window) ? 'Var' : 'Yok' },
      { label: 'CPU Çekirdek Sayısı', value: nav.hardwareConcurrency ? String(nav.hardwareConcurrency) : notSupported },
      { label: 'Yaklaşık Cihaz Belleği', value: nav.deviceMemory ? nav.deviceMemory + ' GB' : notSupported },
      { label: 'Çerez Etkin', value: nav.cookieEnabled ? 'Evet' : 'Hayır' }
    ];
  }
};

Tools.screen = {
  collect() {
    const s = window.screen;
    const notSupported = 'Desteklenmiyor';
    return [
      { label: 'Viewport Genişliği', value: window.innerWidth + ' px' },
      { label: 'Viewport Yüksekliği', value: window.innerHeight + ' px' },
      { label: 'CSS Çözünürlüğü (Ekran)', value: `${s.width} × ${s.height} px` },
      { label: 'Fiziksel Piksel Çözünürlüğü', value: `${Math.round(s.width * (window.devicePixelRatio || 1))} × ${Math.round(s.height * (window.devicePixelRatio || 1))} px` },
      { label: 'Device Pixel Ratio', value: window.devicePixelRatio ? String(window.devicePixelRatio) : notSupported },
      { label: 'Ekran Yönü', value: (s.orientation && s.orientation.type) || notSupported },
      { label: 'Dokunmatik Nokta Desteği', value: navigator.maxTouchPoints !== undefined ? String(navigator.maxTouchPoints) : notSupported },
      { label: 'Renk Derinliği', value: s.colorDepth ? s.colorDepth + ' bit' : notSupported }
    ];
  }
};

Tools.network = {
  collect() {
    const notSupported = 'Desteklenmiyor';
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const rows = [
      { label: 'Bağlantı Durumu', value: navigator.onLine ? 'Çevrimiçi' : 'Çevrimdışı' }
    ];
    if (conn) {
      rows.push({ label: 'Bağlantı Tipi', value: conn.type || notSupported });
      rows.push({ label: 'Etkin Bağlantı Türü', value: conn.effectiveType || notSupported });
      rows.push({ label: 'Downlink', value: conn.downlink !== undefined ? conn.downlink + ' Mbps' : notSupported });
      rows.push({ label: 'RTT (Gecikme)', value: conn.rtt !== undefined ? conn.rtt + ' ms' : notSupported });
      rows.push({ label: 'Veri Tasarrufu Modu', value: conn.saveData ? 'Açık' : 'Kapalı' });
    } else {
      rows.push({ label: 'Bağlantı Tipi', value: notSupported });
      rows.push({ label: 'Etkin Bağlantı Türü', value: notSupported });
      rows.push({ label: 'Downlink', value: notSupported });
      rows.push({ label: 'RTT (Gecikme)', value: notSupported });
    }
    return rows;
  }
};

Tools.timestamp = {
  fromTimestamp(value, unit) {
    if (value === '' || value === null || Number.isNaN(Number(value))) throw new Error('Lütfen geçerli bir sayı girin.');
    const num = Number(value);
    const ms = unit === 'seconds' ? num * 1000 : num;
    const date = new Date(ms);
    if (Number.isNaN(date.getTime())) throw new Error('Geçersiz zaman damgası.');
    return date;
  },
  fromDateString(dateStr) {
    if (!dateStr) throw new Error('Lütfen bir tarih girin.');
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) throw new Error('Geçersiz tarih değeri.');
    return date;
  },
  formatLocal(date) { return date.toLocaleString('tr-TR', { hour12: false }); },
  formatUTC(date) { return date.toUTCString(); }
};

Tools.cyber = {
  analyzeMessage(text) {
    if (!text || !text.trim()) throw new Error('Lütfen bir mesaj yapıştırın.');
    const t = text.toLocaleLowerCase('tr');
    const found = [];
    let score = 0;

    const urgencyWords = ['hemen', 'acil', 'derhal', 'son gün', 'saat içinde', 'bugün içinde', '24 saat', 'süre doluyor', 'hesabınız kapatılacak', 'son fırsat', 'hemen tıklayın'];
    if (urgencyWords.some(w => t.includes(w))) { found.push({ label: 'Aciliyet / baskı hissi yaratma', weight: 2 }); score += 2; }

    const credentialWords = ['şifre', 'şifrenizi', 'doğrulama kodu', 'sms kodu', 'otp', 'pin kodu', 'kodunuzu paylaşın', 'kart numarası', 'cvv', 'güvenlik kodu'];
    if (credentialWords.some(w => t.includes(w))) { found.push({ label: 'Şifre / doğrulama kodu isteme', weight: 3 }); score += 3; }

    const moneyWords = ['kazandınız', 'ödül', 'hediye çeki', 'ücretsiz', 'iban', 'para transferi', 'nakit', 'çekiliş', 'bakiye yükleme', 'yatırım fırsatı'];
    if (moneyWords.some(w => t.includes(w))) { found.push({ label: 'Para veya ödül vaadi', weight: 2 }); score += 2; }

    const institutionWords = ['bankanız', 'banka hesabınız', 'kargo', 'gib', 'vergi dairesi', 'e-devlet', 'resmi', 'müşteri hizmetleri', 'sosyal güvenlik'];
    if (institutionWords.some(w => t.includes(w))) { found.push({ label: 'Kurum / marka taklidi olabilecek ifadeler', weight: 1 }); score += 1; }

    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-z0-9-]+\.(com|net|org|tr|info|xyz|top|click|link)[^\s]*)/i;
    const linkMatch = t.match(urlRegex);
    if (linkMatch) { found.push({ label: 'Mesajda bağlantı (link) bulunuyor', weight: 2 }); score += 2; }

    const phoneMatch = t.match(/(\+?\d[\d\s()-]{7,}\d)/);
    if (phoneMatch) { found.push({ label: 'Telefon numarası içeriyor', weight: 1 }); score += 1; }

    const emailMatch = t.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/);
    if (emailMatch) { found.push({ label: 'E-posta adresi içeriyor', weight: 1 }); score += 1; }

    const socialEngWords = ['bu fırsatı kaçırmayın', 'kimseye söylemeyin', 'gizli tutun', 'sadece size özel', 'lütfen onaylayın', 'hesabınızı doğrulayın', 'bilgilerinizi güncelleyin'];
    if (socialEngWords.some(w => t.includes(w))) { found.push({ label: 'Sosyal mühendislik ifadeleri', weight: 2 }); score += 2; }

    let level, levelClass;
    if (score >= 5) { level = 'Yüksek Risk'; levelClass = 'bad'; }
    else if (score >= 2) { level = 'Dikkat'; levelClass = 'warn'; }
    else { level = 'Düşük Risk'; levelClass = 'ok'; }

    return { level, levelClass, score, found };
  },

  analyzeUrl(rawUrl) {
    if (!rawUrl || !rawUrl.trim()) throw new Error('Lütfen bir URL girin.');
    const url = rawUrl.trim();
    const checks = [];

    const isHttps = /^https:\/\//i.test(url);
    checks.push({ ok: isHttps, label: 'HTTPS kullanımı', detail: isHttps ? 'Bağlantı HTTPS kullanıyor.' : 'Bağlantı HTTPS kullanmıyor veya belirtilmemiş.' });

    const hostMatch = url.match(/^(?:https?:\/\/)?([^\/?#:]+)(?::(\d+))?/i);
    const host = hostMatch ? hostMatch[1] : '';
    const port = hostMatch ? hostMatch[2] : null;

    const isIp = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host);
    checks.push({ ok: !isIp, label: 'IP adresi kullanımı', detail: isIp ? 'Alan adı yerine doğrudan IP adresi kullanılmış.' : 'Alan adı normal bir domain.' });

    const tooLong = url.length > 75;
    checks.push({ ok: !tooLong, label: 'URL uzunluğu', detail: tooLong ? `URL çok uzun (${url.length} karakter).` : `URL uzunluğu normal (${url.length} karakter).` });

    const hasAt = url.includes('@');
    checks.push({ ok: !hasAt, label: '"@" karakteri', detail: hasAt ? 'URL içinde "@" karakteri var, gerçek adres gizlenmiş olabilir.' : '"@" karakteri bulunmuyor.' });

    const isPunycode = /xn--/i.test(host);
    checks.push({ ok: !isPunycode, label: 'Punycode kullanımı', detail: isPunycode ? 'Alan adı punycode (xn--) içeriyor, sahte karakterlerle taklit edilmiş olabilir.' : 'Punycode kullanımı tespit edilmedi.' });

    const suspiciousPort = port && !['80', '443'].includes(port);
    checks.push({ ok: !suspiciousPort, label: 'Port kullanımı', detail: suspiciousPort ? `Standart olmayan bir port kullanılıyor (:${port}).` : 'Standart olmayan bir port kullanılmıyor.' });

    const subdomainCount = host ? host.split('.').length - 2 : 0;
    const tooManySubdomains = subdomainCount >= 3;
    checks.push({ ok: !tooManySubdomains, label: 'Alt alan adı sayısı', detail: tooManySubdomains ? 'Çok fazla alt alan adı (subdomain) kullanılmış.' : 'Alt alan adı sayısı normal.' });

    const suspiciousParams = /[?&](login|verify|update|secure|account|password|confirm|reset)=?/i.test(url);
    checks.push({ ok: !suspiciousParams, label: 'Şüpheli parametreler', detail: suspiciousParams ? 'URL, kimlik doğrulama çağrıştıran şüpheli parametreler içeriyor.' : 'Şüpheli parametre tespit edilmedi.' });

    const failCount = checks.filter(c => !c.ok).length;
    let level, levelClass;
    if (failCount >= 3) { level = 'Yüksek Risk'; levelClass = 'bad'; }
    else if (failCount >= 1) { level = 'Dikkat'; levelClass = 'warn'; }
    else { level = 'Düşük Risk'; levelClass = 'ok'; }

    return { level, levelClass, checks };
  },

  checkPassword(pw) {
    if (!pw) return { score: 0, level: '', levelClass: '', checks: [] };
    const checks = [
      { ok: pw.length >= 8, label: 'En az 8 karakter' },
      { ok: pw.length >= 12, label: 'En az 12 karakter (önerilen)' },
      { ok: /[a-z]/.test(pw), label: 'Küçük harf içeriyor' },
      { ok: /[A-Z]/.test(pw), label: 'Büyük harf içeriyor' },
      { ok: /[0-9]/.test(pw), label: 'Rakam içeriyor' },
      { ok: /[^a-zA-Z0-9]/.test(pw), label: 'Özel karakter içeriyor' },
      { ok: !/(.)\1\1/.test(pw), label: 'Tekrarlanan karakter dizisi yok' },
      { ok: !/^(1234|12345|123456|abcd|abcdef|qwerty|password|şifre|parola)/i.test(pw), label: 'Basit/bilinen bir kalıpla başlamıyor' }
    ];
    const passCount = checks.filter(c => c.ok).length;
    let level, levelClass;
    if (passCount <= 3) { level = 'Zayıf'; levelClass = 'bad'; }
    else if (passCount <= 5) { level = 'Orta'; levelClass = 'warn'; }
    else if (passCount <= 7) { level = 'Güçlü'; levelClass = 'ok'; }
    else { level = 'Çok Güçlü'; levelClass = 'ok'; }
    return { score: passCount, level, levelClass, checks };
  },

  trainingExamples: [
    {
      text: 'Sayın müşterimiz, hesabınızda olağandışı bir hareket tespit edildi. Hesabınızın kapanmaması için 24 saat içinde şifrenizi ve doğrulama kodunuzu şu bağlantıdan onaylayın: banka-guvenlik-dogrula.xyz/giris',
      level: 'Yüksek Risk',
      explanation: 'Aciliyet baskısı ("24 saat içinde"), şifre/doğrulama kodu isteği ve resmi olmayan garip bir alan adı (.xyz) bir arada kullanılmış — klasik phishing belirtileri.'
    },
    {
      text: 'Tebrikler! Çekilişten 5.000 TL hediye çeki kazandınız. Ödülünüzü almak için IBAN bilgilerinizi ve kart CVV numaranızı bu forma girin: odul-kazandiniz-hemen.top',
      level: 'Yüksek Risk',
      explanation: 'Beklenmedik bir ödül vaadi, CVV/kart bilgisi isteği ve şüpheli bir alan adı uzantısı (.top) — hiçbir kurum bu şekilde kart bilgisi istemez.'
    },
    {
      text: 'Kargonuz adresinize teslim edilemedi. Teslimat tarihini güncellemek için lütfen şu bağlantıya tıklayın: kargotakip.com.tr/teslimat',
      level: 'Dikkat',
      explanation: 'Kargo temalı mesajlar sık kullanılan bir yöntemdir. Alan adı makul görünse de, gönderen numarası/e-postası ve bağlantı dikkatle incelenmeli; kargo takibini her zaman resmi uygulamadan yapmak daha güvenlidir.'
    },
    {
      text: 'Merhaba, yarınki toplantı saat 14:00\'e alındı, takviminizi güncelleyebilir misiniz?',
      level: 'Düşük Risk',
      explanation: 'Aciliyet, para, şifre veya şüpheli bağlantı içermiyor. Sıradan, günlük bir mesaj örneğidir.'
    },
    {
      text: 'BANKANIZ: Kartınız geçici olarak bloke edildi. Bloke kaldırmak için müşteri hizmetlerini aramak yerine hemen şu numaraya SMS ile PIN kodunuzu gönderin.',
      level: 'Yüksek Risk',
      explanation: 'Hiçbir banka SMS ile PIN kodu istemez; ayrıca kullanıcıyı resmi destek hattını aramaktan caydırması güçlü bir sosyal mühendislik belirtisidir.'
    }
  ],

  guideEntries: [
    { q: 'Phishing (oltalama) nedir?', a: 'Saldırganların; banka, kargo veya tanıdık bir kurum gibi görünerek sahte mesaj, e-posta veya web siteleriyle kişisel bilgilerinizi (şifre, kart bilgisi vb.) çalmaya çalışmasıdır.' },
    { q: 'Şüpheli bir linke tıkladıysam ne yapmalıyım?', a: 'Hiçbir bilgi girmeden sayfayı kapatın, cihazınızı bir güvenlik taramasından geçirin, ilgili hesabınızın şifresini resmi uygulama/siteden değiştirin ve varsa ilgili kurumu bilgilendirin.' },
    { q: 'Doğrulama kodu (SMS/OTP) paylaşılır mı?', a: 'Hayır. Banka, e-ticaret veya sosyal medya hiçbir zaman doğrulama kodunuzu telefonla veya mesajla sizden istemez. Bu kodu kimseyle paylaşmayın.' },
    { q: '2FA (iki adımlı doğrulama) nedir?', a: 'Şifrenize ek olarak telefonunuza gelen kod veya bir doğrulama uygulaması ile giriş yapmanızı sağlayan ekstra bir güvenlik katmanıdır. Hesabınız çalınsa bile ikinci adım olmadan giriş yapılamaz.' },
    { q: 'Güçlü bir şifre nasıl olmalı?', a: 'En az 12 karakter uzunluğunda, büyük/küçük harf, rakam ve özel karakter içeren, tahmin edilmesi zor ve her hesapta farklı olan bir şifre güçlü kabul edilir.' }
  ]
};

/* ---------------- İkonlar ---------------- */
const ICON = {
  regex: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v9M8.1 5.2l7.8 4.6M15.9 5.2l-7.8 4.6"/><circle cx="6.5" cy="18" r="1.5" fill="currentColor" stroke="none"/><path d="M12 15v6"/></svg>',
  jwt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3M14 9l2 2"/></svg>',
  hash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 9h14M5 15h14M10 4L8 20M16 4l-2 16"/></svg>',
  pkg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/></svg>',
  uuid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="12" rx="2.5"/><path d="M7 10h2M11 10h2M15 10h2M7 14h6"/></svg>',
  textstats: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 20V10M12 20V4M19 20v-7"/></svg>',
  texttools: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7V5h16v2M12 5v14M9 19h6"/></svg>',
  numbase: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7" cy="12" r="3.5"/><path d="M15.5 9.5L18 7.5V17"/></svg>',
  units: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17L17 3l4 4L7 21z"/><path d="M8 12l2 2M11 9l2 2M14 6l2 2"/></svg>',
  qr: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM14 20h3M20 14v3M20 20h.01"/></svg>',
  json: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3a3 3 0 00-3 3v3a2 2 0 01-2 2 2 2 0 012 2v3a3 3 0 003 3M17 3a3 3 0 013 3v3a2 2 0 002 2 2 2 0 00-2 2v3a3 3 0 01-3 3"/></svg>',
  base64: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h10M4 18h16"/></svg>',
  color: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r="0.5" fill="currentColor"/><circle cx="17.5" cy="10.5" r="0.5" fill="currentColor"/><circle cx="8.5" cy="7.5" r="0.5" fill="currentColor"/><circle cx="6.5" cy="12.5" r="0.5" fill="currentColor"/><path d="M12 2a10 10 0 100 20c1.4 0 2-1 2-2 0-.6-.2-1-.5-1.4-.3-.4-.5-.8-.5-1.3 0-1 .8-1.8 1.8-1.8H16a5 5 0 005-5C21 6.5 17 2 12 2z"/></svg>',
  storage: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/></svg>',
  timestamp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/></svg>',
  device: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/></svg>',
  screen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="14" rx="2"/><path d="M8 21h8M12 18v3"/></svg>',
  network: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5a11 11 0 0114 0M8.5 16a6 6 0 017 0M12 19.5h.01"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l8 3.5v5c0 5-3.4 8.7-8 11-4.6-2.3-8-6-8-11v-5z"/><path d="M9.2 12.2l1.9 1.9 3.7-3.9"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.1 6.6 7.2.9-5.3 5 1.4 7.2L12 18l-6.4 3.7 1.4-7.2-5.3-5 7.2-.9L12 2z"/></svg>',
  starOutline: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2l3.1 6.6 7.2.9-5.3 5 1.4 7.2L12 18l-6.4 3.7 1.4-7.2-5.3-5 7.2-.9L12 2z"/></svg>'
};

/* ---------------- Gelişmiş Arama Destekli Araç Kayıt Tablosu ---------------- */
const TOOLS = [
  { id: 'qr', name: 'QR Kod Oluşturucu', desc: 'Metin, URL, Wi-Fi, telefon ve e-posta için QR kod üret', category: 'quick', icon: ICON.qr, aliases: ['qr', 'karekod', 'barkod', 'wifi qr', 'link qr', 'vcard', 'url qr'] },
  { id: 'json', name: 'JSON Formatter', desc: 'JSON verisini biçimlendir, sıkıştır ve doğrula', category: 'quick', icon: ICON.json, aliases: ['json', 'format json', 'json düzenle', 'json validator', 'json beautifier', 'beautify', 'minify', 'sıkıştır'] },
  { id: 'base64', name: 'Base64 Encoder/Decoder', desc: 'Metni Base64 formatına dönüştür veya çöz', category: 'quick', icon: ICON.base64, aliases: ['base64', 'b64', 'encode', 'decode', 'atob', 'btoa', 'metin çevirici'] },
  { id: 'color', name: 'Renk Dönüştürücü', desc: 'HEX, RGB ve HSL arasında dönüştür', category: 'quick', icon: ICON.color, aliases: ['color', 'renk', 'hex', 'rgb', 'hsl', 'renk seçici', 'palet', 'picker'] },
  { id: 'device', name: 'Cihaz Bilgileri', desc: 'İşletim sistemi, tarayıcı ve donanım bilgileri', category: 'device', icon: ICON.device, aliases: ['cihaz', 'donanım', 'hardware', 'cpu', 'ram', 'user agent', 'işletim sistemi', 'platform'] },
  { id: 'screen', name: 'Ekran Bilgileri', desc: 'Çözünürlük, piksel oranı ve ekran yönü', category: 'device', icon: ICON.screen, aliases: ['ekran', 'çözünürlük', 'viewport', 'dpr', 'retina', 'piksel', 'resolution', 'display'] },
  { id: 'network', name: 'Ağ Bilgileri', desc: 'Bağlantı durumu ve ağ türü bilgileri', category: 'device', icon: ICON.network, aliases: ['ağ', 'internet', 'bağlantı', 'online', 'offline', 'rtt', 'downlink', 'ping', 'wifi'] },
  { id: 'storage', name: 'Depolama Dönüştürücü', desc: 'Byte, KB, MB, GB, TB arasında dönüştür', category: 'calc', icon: ICON.storage, aliases: ['depolama', 'storage', 'byte', 'kb', 'mb', 'gb', 'tb', 'kib', 'mib', 'gib', 'disk boyutu'] },
  { id: 'timestamp', name: 'Zaman Damgası Dönüştürücü', desc: 'Unix timestamp ile tarih arasında dönüştür', category: 'calc', icon: ICON.timestamp, aliases: ['zaman', 'timestamp', 'unix', 'epoch', 'tarih', 'saat', 'posix'] },
  { id: 'regex', name: 'Regex Tester', desc: 'Düzenli ifadeleri test et ve eşleşmeleri bul', category: 'dev', icon: ICON.regex, aliases: ['regex', 'regexp', 'düzenli ifade', 'pattern', 'test', 'match', 'kalıp', 'doğrulama'] },
  { id: 'jwt', name: 'JWT Decoder', desc: 'JWT tokenini decode et ve header/payload incele', category: 'dev', icon: ICON.jwt, aliases: ['jwt', 'token', 'jwt token', 'bearer', 'token decode', 'payload', 'claim', 'auth', 'yetki'] },
  { id: 'hash', name: 'Hash Hesaplayıcı', desc: 'MD5, SHA-1, SHA-256, SHA-512; metin veya dosya için', category: 'dev', icon: ICON.hash, aliases: ['hash', 'sha256', 'sha512', 'md5', 'sha1', 'checksum', 'sağlama', 'dosya hash', 'özet'] },
  { id: 'html2aab', name: 'HTML → AAB', desc: 'HTML dosyasından APK/AAB derlenebilir Android projesi üret', category: 'dev', icon: ICON.pkg, aliases: ['html2aab', 'apk', 'aab', 'android', 'uygulama yap', 'webview', 'gradle', 'play store', 'mobil'] },
  { id: 'uuid', name: 'UUID Üretici', desc: 'v4 ve v7 UUID üret, toplu kopyala', category: 'dev', icon: ICON.uuid, aliases: ['uuid', 'guid', 'v4', 'v7', 'benzersiz kimlik', 'unique id'] },
  { id: 'numbase', name: 'Sayı Sistemi', desc: 'İkili, sekizli, onlu, onaltılı ve 36 tabanı dönüştür', category: 'dev', icon: ICON.numbase, aliases: ['sayı sistemi', 'binary', 'ikili', 'hex', 'onaltılı', 'octal', 'sekizli', 'taban', 'radix'] },
  { id: 'textstats', name: 'Metin İstatistikleri', desc: 'Karakter, kelime, cümle sayısı ve okuma süresi', category: 'text', icon: ICON.textstats, aliases: ['metin istatistikleri', 'kelime sayısı', 'karakter sayacı', 'okuma süresi', 'frekans', 'cümle'] },
  { id: 'texttools', name: 'Metin İşlemleri', desc: 'Büyük/küçük harf, sıralama, slug, URL encode ve daha fazlası', category: 'text', icon: ICON.texttools, aliases: ['metin işlemleri', 'büyük harf', 'küçük harf', 'slug', 'url encode', 'sıralama', 'tekil', 'ascii'] },
  { id: 'units', name: 'Birim Dönüştürücü', desc: 'Uzunluk, ağırlık, sıcaklık, hız, alan, hacim, zaman', category: 'calc', icon: ICON.units, aliases: ['birim dönüştürücü', 'uzunluk', 'ağırlık', 'sıcaklık', 'hız', 'dönüştür', 'converter', 'metre', 'kilo'] },
  { id: 'cyber', name: 'Siber Koruma', desc: 'Mesaj/URL analizi, şifre kontrolü ve üretici, phishing eğitimi', category: 'security', icon: ICON.shield, aliases: ['siber koruma', 'güvenlik', 'şifre kontrol', 'şifre üretici', 'phishing', 'oltalama', 'url kontrol', 'antivirus'] }
];

const TOOLS_BY_ID = Object.fromEntries(TOOLS.map(t => [t.id, t]));
const CATEGORY_LABEL = { all: 'Tümü', quick: 'Hızlı Araçlar', device: 'Cihaz & Sistem', calc: 'Hesaplama', dev: 'Geliştirici', text: 'Metin', security: 'Siber Güvenlik' };

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ---------------- Hash & Kripto Motoru ---------------- */
const HashLib = (() => {
  const rotl = (x, n) => (x << n) | (x >>> (32 - n));
  const rotr = (x, n) => (x >>> n) | (x << (32 - n));

  function padBlocks(bytes, blockSize, lenBytes, bigEndian) {
    const len = bytes.length;
    const total = (Math.floor((len + lenBytes) / blockSize) + 1) * blockSize;
    const buf = new Uint8Array(total);
    buf.set(bytes);
    buf[len] = 0x80;
    const dv = new DataView(buf.buffer);
    const bits = len * 8;
    if (bigEndian) {
      dv.setUint32(total - 8, Math.floor(bits / 4294967296));
      dv.setUint32(total - 4, bits >>> 0);
    } else {
      dv.setUint32(total - 8, bits >>> 0, true);
      dv.setUint32(total - 4, Math.floor(bits / 4294967296), true);
    }
    return { buf, dv, total };
  }

  function md5(bytes) {
    const S = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21];
    const K = [];
    for (let i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) >>> 0;
    const { dv, total } = padBlocks(bytes, 64, 8, false);
    let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
    const M = new Array(16);
    for (let off = 0; off < total; off += 64) {
      for (let i = 0; i < 16; i++) M[i] = dv.getUint32(off + i * 4, true);
      let A = a0, B = b0, C = c0, D = d0;
      for (let i = 0; i < 64; i++) {
        let F, g;
        if (i < 16) { F = (B & C) | (~B & D); g = i; }
        else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
        else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; }
        else { F = C ^ (B | ~D); g = (7 * i) % 16; }
        F = (F + A + K[i] + M[g]) >>> 0;
        A = D; D = C; C = B;
        B = (B + rotl(F, S[i])) >>> 0;
      }
      a0 = (a0 + A) >>> 0; b0 = (b0 + B) >>> 0; c0 = (c0 + C) >>> 0; d0 = (d0 + D) >>> 0;
    }
    const out = new Uint8Array(16);
    const odv = new DataView(out.buffer);
    [a0, b0, c0, d0].forEach((v, i) => odv.setUint32(i * 4, v, true));
    return hex(out);
  }

  function sha1(bytes) {
    const { dv, total } = padBlocks(bytes, 64, 8, true);
    let h0 = 0x67452301, h1 = 0xefcdab89, h2 = 0x98badcfe, h3 = 0x10325476, h4 = 0xc3d2e1f0;
    const w = new Array(80);
    for (let off = 0; off < total; off += 64) {
      for (let i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4);
      for (let i = 16; i < 80; i++) w[i] = rotl(w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16], 1);
      let a = h0, b = h1, c = h2, d = h3, e = h4;
      for (let i = 0; i < 80; i++) {
        let f, k;
        if (i < 20) { f = (b & c) | (~b & d); k = 0x5a827999; }
        else if (i < 40) { f = b ^ c ^ d; k = 0x6ed9eba1; }
        else if (i < 60) { f = (b & c) | (b & d) | (c & d); k = 0x8f1bbcdc; }
        else { f = b ^ c ^ d; k = 0xca62c1d6; }
        const t = (rotl(a, 5) + f + e + k + w[i]) >>> 0;
        e = d; d = c; c = rotl(b, 30) >>> 0; b = a; a = t;
      }
      h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0; h4 = (h4 + e) >>> 0;
    }
    const out = new Uint8Array(20);
    const odv = new DataView(out.buffer);
    [h0, h1, h2, h3, h4].forEach((v, i) => odv.setUint32(i * 4, v));
    return hex(out);
  }

  function primes(n) {
    const list = [];
    for (let c = 2; list.length < n; c++) if (list.every(p => c % p !== 0)) list.push(c);
    return list;
  }
  function iroot(n, k) {
    let x = 1n << BigInt(Math.ceil(n.toString(2).length / k) + 1);
    const K = BigInt(k);
    for (;;) {
      const y = ((K - 1n) * x + n / (x ** (K - 1n))) / K;
      if (y >= x) return x;
      x = y;
    }
  }
  let c256 = null, c512 = null;
  function consts256() {
    if (c256) return c256;
    const p = primes(64);
    c256 = {
      K: p.map(v => Number(iroot(BigInt(v) << 96n, 3) & 0xffffffffn)),
      H: p.slice(0, 8).map(v => Number(iroot(BigInt(v) << 64n, 2) & 0xffffffffn))
    };
    return c256;
  }
  function consts512() {
    if (c512) return c512;
    const p = primes(80);
    const M = (1n << 64n) - 1n;
    c512 = {
      K: p.map(v => iroot(BigInt(v) << 192n, 3) & M),
      H: p.slice(0, 8).map(v => iroot(BigInt(v) << 128n, 2) & M)
    };
    return c512;
  }

  function sha256(bytes) {
    const { K, H } = consts256();
    const { dv, total } = padBlocks(bytes, 64, 8, true);
    const h = H.slice();
    const w = new Array(64);
    for (let off = 0; off < total; off += 64) {
      for (let i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4);
      for (let i = 16; i < 64; i++) {
        const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
      }
      let [a, b, c, d, e, f, g, hh] = h;
      for (let i = 0; i < 64; i++) {
        const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        const ch = (e & f) ^ (~e & g);
        const t1 = (hh + S1 + ch + K[i] + w[i]) >>> 0;
        const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (S0 + maj) >>> 0;
        hh = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      h[0] = (h[0] + a) >>> 0; h[1] = (h[1] + b) >>> 0; h[2] = (h[2] + c) >>> 0; h[3] = (h[3] + d) >>> 0;
      h[4] = (h[4] + e) >>> 0; h[5] = (h[5] + f) >>> 0; h[6] = (h[6] + g) >>> 0; h[7] = (h[7] + hh) >>> 0;
    }
    const out = new Uint8Array(32);
    const odv = new DataView(out.buffer);
    h.forEach((v, i) => odv.setUint32(i * 4, v));
    return hex(out);
  }

  function sha512(bytes) {
    const { K, H } = consts512();
    const M = (1n << 64n) - 1n;
    const rr = (x, n) => ((x >> n) | (x << (64n - n))) & M;
    const { dv, total } = padBlocks(bytes, 128, 16, true);
    dv.setUint32(total - 16, 0); dv.setUint32(total - 12, 0);
    const h = H.slice();
    const w = new Array(80);
    for (let off = 0; off < total; off += 128) {
      for (let i = 0; i < 16; i++) w[i] = dv.getBigUint64(off + i * 8);
      for (let i = 16; i < 80; i++) {
        const s0 = rr(w[i - 15], 1n) ^ rr(w[i - 15], 8n) ^ (w[i - 15] >> 7n);
        const s1 = rr(w[i - 2], 19n) ^ rr(w[i - 2], 61n) ^ (w[i - 2] >> 6n);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) & M;
      }
      let [a, b, c, d, e, f, g, hh] = h;
      for (let i = 0; i < 80; i++) {
        const S1 = rr(e, 14n) ^ rr(e, 18n) ^ rr(e, 41n);
        const ch = (e & f) ^ ((e ^ M) & g);
        const t1 = (hh + S1 + ch + K[i] + w[i]) & M;
        const S0 = rr(a, 28n) ^ rr(a, 34n) ^ rr(a, 39n);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (S0 + maj) & M;
        hh = g; g = f; f = e; e = (d + t1) & M; d = c; c = b; b = a; a = (t1 + t2) & M;
      }
      [a, b, c, d, e, f, g, hh].forEach((v, i) => { h[i] = (h[i] + v) & M; });
    }
    return h.map(v => v.toString(16).padStart(16, '0')).join('');
  }

  async function subtle(name, bytes) {
    const buf = await window.crypto.subtle.digest(name, bytes);
    return hex(new Uint8Array(buf));
  }
  async function compute(bytes) {
    const canSubtle = !!(window.crypto && window.crypto.subtle);
    const via = async (name, js) => {
      if (canSubtle) { try { return await subtle(name, bytes); } catch (e) {} }
      return js(bytes);
    };
    return {
      'MD5': md5(bytes),
      'SHA-1': await via('SHA-1', sha1),
      'SHA-256': await via('SHA-256', sha256),
      'SHA-512': await via('SHA-512', sha512)
    };
  }
  return { md5, sha1, sha256, sha512, compute };
})();

/* ---------------- Zip Motoru ---------------- */
const ZipLib = (() => {
  let table = null;
  function crc32(bytes) {
    if (!table) {
      table = new Uint32Array(256);
      for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        table[n] = c >>> 0;
      }
    }
    let crc = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) crc = table[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }
  function make(files) {
    const enc = new TextEncoder();
    const now = new Date();
    const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
    const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
    const parts = [];
    const central = [];
    let offset = 0;
    files.forEach(f => {
      const name = enc.encode(f.name);
      const data = f.data instanceof Uint8Array ? f.data : enc.encode(String(f.data));
      const crc = crc32(data);
      const local = new DataView(new ArrayBuffer(30));
      local.setUint32(0, 0x04034b50, true); local.setUint16(4, 20, true); local.setUint16(6, 0x0800, true);
      local.setUint16(8, 0, true); local.setUint16(10, dosTime, true); local.setUint16(12, dosDate, true);
      local.setUint32(14, crc, true); local.setUint32(18, data.length, true); local.setUint32(22, data.length, true);
      local.setUint16(26, name.length, true); local.setUint16(28, 0, true);
      parts.push(local.buffer, name, data);
      const cd = new DataView(new ArrayBuffer(46));
      cd.setUint32(0, 0x02014b50, true); cd.setUint16(4, 20, true); cd.setUint16(6, 20, true); cd.setUint16(8, 0x0800, true);
      cd.setUint10 = 0; cd.setUint12 = dosTime; cd.setUint14 = dosDate;
      cd.setUint32(10, 0, true); cd.setUint16(12, dosTime, true); cd.setUint16(14, dosDate, true);
      cd.setUint32(16, crc, true); cd.setUint32(20, data.length, true); cd.setUint32(24, data.length, true);
      cd.setUint16(28, name.length, true); cd.setUint32(42, offset, true);
      central.push(cd.buffer, name);
      offset += 30 + name.length + data.length;
    });
    const cdSize = central.reduce((s, p) => s + (p.byteLength !== undefined ? p.byteLength : p.length), 0);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
    end.setUint32(12, cdSize, true); end.setUint32(16, offset, true);
    return new Blob([...parts, ...central, end.buffer], { type: 'application/zip' });
  }
  return { make, crc32 };
})();

/* ---------------- Yardımcılar ---------------- */
function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}
function fillInfo(container, rows) {
  container.textContent = '';
  rows.forEach(([label, value]) => {
    const row = el('div', 'info-row');
    row.appendChild(el('span', 'info-row__label', label));
    row.appendChild(el('span', 'info-row__value', value));
    container.appendChild(row);
  });
}
function makeCopyable(container) {
  container.addEventListener('click', (e) => {
    const v = e.target.closest('.info-row') && e.target.closest('.info-row').querySelector('.info-row__value');
    if (v) copyBtnHandler(() => v.textContent)();
  });
}
function randomBytes(n) {
  const b = new Uint8Array(n);
  if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(b);
  else for (let i = 0; i < n; i++) b[i] = Math.floor(Math.random() * 256);
  return b;
}
function randInt(max) {
  const limit = Math.floor(4294967296 / max) * max;
  const buf = new Uint32Array(1);
  for (;;) {
    if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(buf);
    else buf[0] = Math.floor(Math.random() * 4294967296);
    if (buf[0] < limit) return buf[0] % max;
  }
}
function hex(bytes) { return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join(''); }

/* ---------------- Navigasyon ve Rota ---------------- */
const mainEl = document.getElementById('mainContent');
const headerEl = document.getElementById('appHeader');
const headerTitleEl = document.getElementById('headerTitle');
const headerLogoEl = document.getElementById('headerLogo');
const backBtn = document.getElementById('backBtn');
const bottomNav = document.getElementById('bottomNav');

let currentToolId = null;
let activeLiveCleanup = null;

function parseHash() {
  const raw = window.location.hash.replace(/^#\/?/, '');
  if (!raw || raw === 'home') return { view: 'home' };
  if (raw.startsWith('tool/')) return { view: 'tool-detail', toolId: raw.slice(5) };
  if (['tools', 'favorites', 'settings', 'about'].includes(raw)) return { view: raw };
  return { view: 'home' };
}

function navigateTo(hash, replace) {
  if (replace) {
    const url = window.location.pathname + window.location.search + '#' + hash;
    window.history.replaceState(null, '', url);
    renderRoute();
  } else {
    window.location.hash = hash;
  }
}

function showView(viewName) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('view--active'));
  const target = document.getElementById('view-' + viewName);
  if (target) target.classList.add('view--active');

  const isSub = viewName === 'tool-detail' || viewName === 'about';
  headerEl.classList.toggle('app-header--sub', isSub);
  headerLogoEl.style.display = isSub ? 'none' : 'flex';
  headerTitleEl.style.display = isSub ? 'block' : 'none';

  bottomNav.style.display = isSub ? 'none' : 'flex';

  const NAV_ORDER = ['home', 'tools', 'favorites', 'settings'];
  const navIndex = NAV_ORDER.indexOf(viewName);
  if (navIndex !== -1) {
    const prev = Number(bottomNav.style.getPropertyValue('--nav-index') || 0);
    bottomNav.style.setProperty('--nav-dist', Math.max(1, Math.abs(navIndex - prev)));
    bottomNav.style.setProperty('--nav-index', navIndex);
    const ind = document.getElementById('bottomNavIndicator');
    if (ind && navIndex !== prev) {
      ind.classList.remove('is-moving');
      void ind.offsetWidth;
      ind.classList.add('is-moving');
    }
  }

  document.querySelectorAll('.bottom-nav__item').forEach(btn => {
    btn.classList.toggle('is-active', btn.dataset.nav === viewName);
  });

  mainEl.scrollTop = 0;
}

function renderRoute() {
  const route = parseHash();
  if (route.view === 'tool-detail') {
    const tool = TOOLS_BY_ID[route.toolId];
    if (!tool) { navigateTo('home', true); return; }
    if (activeLiveCleanup) { activeLiveCleanup(); activeLiveCleanup = null; }
    currentToolId = tool.id;
    headerTitleEl.textContent = tool.name;
    renderToolDetail(tool);
    showView('tool-detail');
    Store.addRecentTool(tool.id);
  } else if (route.view === 'about') {
    if (activeLiveCleanup) { activeLiveCleanup(); activeLiveCleanup = null; }
    headerTitleEl.textContent = 'Hakkında';
    showView('about');
  } else {
    if (activeLiveCleanup) { activeLiveCleanup(); activeLiveCleanup = null; }
    currentToolId = null;
    if (route.view === 'home') renderHome();
    else if (route.view === 'tools') renderToolsView();
    else if (route.view === 'favorites') renderFavoritesView();
    else if (route.view === 'settings') renderSettingsView();
    showView(route.view);
  }
}

window.addEventListener('hashchange', renderRoute);
backBtn.addEventListener('click', () => window.history.back());
let navSuppressClick = false;
bottomNav.addEventListener('click', (e) => {
  const btn = e.target.closest('.bottom-nav__item');
  if (btn && !navSuppressClick) navigateTo(btn.dataset.nav);
});

/* ---------------- Kart Oluşturma (Öğren Rozeti Dahil) ---------------- */
function toolCardHTML(tool, { showFav = true, index = 0 } = {}) {
  const isFav = Store.isFavorite(tool.id);
  return `
    <div class="tool-card" role="button" tabindex="0" data-open-tool="${tool.id}" data-cat="${tool.category}" style="--stagger-i:${Math.min(index, 10)};">
      <div class="tool-card__header-row">
        <div class="tool-card__icon">${tool.icon}</div>
        <span class="tool-card__learn-badge">📖 Öğren</span>
      </div>
      <div class="tool-card__body">
        <div class="tool-card__name">${escapeHtml(tool.name)}</div>
        <div class="tool-card__desc">${escapeHtml(tool.desc)}</div>
      </div>
      ${showFav ? `<button class="tool-card__fav ${isFav ? 'is-fav' : ''}" data-fav-toggle="${tool.id}" aria-label="Favori">${isFav ? ICON.star : ICON.starOutline}</button>` : ''}
    </div>`;
}

function wireToolCards() {}

/* ---------------- Ana Sayfa ---------------- */
function renderHome() {
  const favIds = Store.getFavorites();
  const favBox = document.getElementById('homeFavorites');
  if (favIds.length === 0) {
    favBox.innerHTML = `<div class="empty-inline">${ICON.starOutline}<span>Henüz favori aracın yok.</span></div>`;
  } else {
    favBox.innerHTML = `<div class="tool-list">${favIds.map(id => TOOLS_BY_ID[id]).filter(Boolean).map((t, i) => toolCardHTML(t, { index: i })).join('')}</div>`;
  }
  wireToolCards(favBox);

  const recentIds = Store.getRecentTools();
  const recentBox = document.getElementById('homeRecent');
  if (recentIds.length === 0) {
    recentBox.innerHTML = `<div class="empty-inline">${ICON.timestamp}<span>Henüz araç kullanılmadı.</span></div>`;
  } else {
    recentBox.innerHTML = `<div class="tool-list">${recentIds.map(id => TOOLS_BY_ID[id]).filter(Boolean).map((t, i) => toolCardHTML(t, { index: i })).join('')}</div>`;
  }
  wireToolCards(recentBox);

  document.getElementById('homeQuick').innerHTML = TOOLS.filter(t => t.category === 'quick').map((t, i) => toolCardHTML(t, { index: i })).join('');
  document.getElementById('homeSecurity').innerHTML = TOOLS.filter(t => t.category === 'security').map((t, i) => toolCardHTML(t, { index: i })).join('');
  document.getElementById('homeDev').innerHTML = TOOLS.filter(t => t.category === 'dev').map((t, i) => toolCardHTML(t, { index: i })).join('');
  document.getElementById('homeText').innerHTML = TOOLS.filter(t => t.category === 'text').map((t, i) => toolCardHTML(t, { index: i })).join('');
  document.getElementById('homeDevice').innerHTML = TOOLS.filter(t => t.category === 'device').map((t, i) => toolCardHTML(t, { index: i })).join('');
  document.getElementById('homeCalc').innerHTML = TOOLS.filter(t => t.category === 'calc').map((t, i) => toolCardHTML(t, { index: i })).join('');
}

/* ---------------- Gelişmiş Arama Destekli Araçlar Ekranı ---------------- */
let toolsActiveCategory = 'all';
let toolsSearchTerm = '';

function renderCategoryChips() {
  const box = document.getElementById('categoryChips');
  box.innerHTML = Object.keys(CATEGORY_LABEL).map(cat =>
    `<button class="chip ${toolsActiveCategory === cat ? 'is-active' : ''}" data-cat="${cat}">${CATEGORY_LABEL[cat]}</button>`
  ).join('');
  box.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      toolsActiveCategory = chip.dataset.cat;
      renderToolsView();
    });
  });
}

function renderToolsView() {
  renderCategoryChips();
  const searchInput = document.getElementById('toolSearchInput');
  if (document.activeElement !== searchInput) searchInput.value = toolsSearchTerm;

  const listBox = document.getElementById('toolsListContainer');
  const emptyBox = document.getElementById('toolsEmptyState');

  const term = toolsSearchTerm.trim().toLocaleLowerCase('tr');
  const filtered = TOOLS.filter(t => {
    const matchesCategory = toolsActiveCategory === 'all' || t.category === toolsActiveCategory;
    const matchesName = t.name.toLocaleLowerCase('tr').includes(term);
    const matchesDesc = t.desc.toLocaleLowerCase('tr').includes(term);
    const matchesAlias = t.aliases && t.aliases.some(a => a.toLocaleLowerCase('tr').includes(term));
    return matchesCategory && (!term || matchesName || matchesDesc || matchesAlias);
  });

  if (filtered.length === 0) {
    listBox.innerHTML = '';
    emptyBox.style.display = 'flex';
  } else {
    emptyBox.style.display = 'none';
    listBox.innerHTML = filtered.map((t, i) => toolCardHTML(t, { index: i })).join('');
    wireToolCards(listBox);
  }
}

document.getElementById('toolSearchInput').addEventListener('input', (e) => {
  toolsSearchTerm = e.target.value;
  renderToolsView();
});

/* ---------------- Favoriler Ekranı ---------------- */
function renderFavoritesView() {
  const favIds = Store.getFavorites();
  const listBox = document.getElementById('favoritesListContainer');
  const emptyBox = document.getElementById('favoritesEmptyState');
  const tools = favIds.map(id => TOOLS_BY_ID[id]).filter(Boolean);
  if (tools.length === 0) {
    listBox.innerHTML = '';
    emptyBox.style.display = 'flex';
  } else {
    emptyBox.style.display = 'none';
    listBox.innerHTML = tools.map((t, i) => toolCardHTML(t, { index: i })).join('');
    wireToolCards(listBox);
  }
}

/* ---------------- Ayarlar Ekranı ---------------- */
function renderSettingsView() {
  syncFxButtons();
  const theme = Store.getTheme();
  document.querySelectorAll('#themeSegmented button').forEach(b => {
    b.classList.toggle('is-active', b.dataset.themeChoice === theme);
  });
  const settings = Store.getSettings();
  document.querySelectorAll('#unitSegmented button').forEach(b => {
    const isBinary = b.dataset.unitChoice === 'binary';
    b.classList.toggle('is-active', isBinary === settings.binaryUnits);
  });
}

document.getElementById('themeSegmented').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const theme = btn.dataset.themeChoice;
  Store.setTheme(theme);
  UI.applyTheme(theme);
  renderSettingsView();
});

document.getElementById('unitSegmented').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  Store.setSettings({ binaryUnits: btn.dataset.unitChoice === 'binary' });
  renderSettingsView();
});

document.getElementById('clearRecentBtn').addEventListener('click', async () => {
  const ok = await UI.confirmModal({ title: 'Son kullanılanları temizle', message: 'Son kullanılan araçlar listesi temizlenecek. Onaylıyor musun?' });
  if (ok) { Store.clearRecentTools(); UI.toast('Son kullanılanlar temizlendi', 'success'); }
});
document.getElementById('clearFavoritesBtn').addEventListener('click', async () => {
  const ok = await UI.confirmModal({ title: 'Favorileri temizle', message: 'Tüm favori araçların kaldırılacak. Onaylıyor musun?' });
  if (ok) { Store.clearFavorites(); UI.toast('Favoriler temizlendi', 'success'); }
});
document.getElementById('clearAllBtn').addEventListener('click', async () => {
  const ok = await UI.confirmModal({ title: 'Tüm verileri temizle', message: 'Tema, favoriler, son kullanılanlar ve ayarlar dahil tüm uygulama verileri silinecek. Bu işlem geri alınamaz.', danger: true, confirmText: 'Temizle' });
  if (ok) {
    Store.clearAll();
    UI.applyTheme('system');
    UI.toast('Tüm veriler temizlendi', 'success');
    renderRoute();
  }
});
document.getElementById('aboutBtn').addEventListener('click', () => navigateTo('about'));

/* ================================================================
   ARAÇ DETAY EKRANLARI VE EĞİTİM KATMANI ENTEGRASYONU
   ================================================================ */

function renderToolDetail(tool) {
  document.getElementById('toolDetailDesc').textContent = tool.desc;
  const body = document.getElementById('toolDetailBody');
  body.innerHTML = '';
  const renderer = TOOL_RENDERERS[tool.id];
  if (renderer) renderer(body);

  // Eğitim ve Çalışma Mantığı Katmanı
  const eduContainer = document.getElementById('toolEducationContainer');
  if (window.EducationUI && eduContainer) {
    window.EducationUI.renderToolEducation(tool.id, eduContainer);
  }
}

function copyBtnHandler(getText) {
  return async () => {
    const text = getText();
    if (!text) { UI.toast('Kopyalanacak bir sonuç yok', 'warning'); return; }
    const ok = await UI.copyToClipboard(text);
    UI.toast(ok ? 'Panoya kopyalandı' : 'Kopyalama başarısız oldu', ok ? 'success' : 'error');
  };
}

/* 1. QR Kod Oluşturucu */
function renderQRTool(body) {
  body.innerHTML = `
    <div class="field">
      <label for="qrType">Veri Türü</label>
      <select id="qrType">
        <option value="text">Metin</option>
        <option value="url">URL</option>
        <option value="wifi">Wi-Fi</option>
        <option value="phone">Telefon Numarası</option>
        <option value="email">E-posta</option>
      </select>
    </div>
    <div id="qrFields"></div>
    <div class="btn-row">
      <button class="btn btn--primary" id="qrGenerateBtn">Oluştur</button>
      <button class="btn btn--ghost" id="qrClearBtn">Temizle</button>
    </div>
    <div id="qrResultArea"></div>
  `;

  const fieldsBox = body.querySelector('#qrFields');
  const typeSelect = body.querySelector('#qrType');
  const resultArea = body.querySelector('#qrResultArea');

  const FIELD_TEMPLATES = {
    text: `<div class="field"><label for="f_text">Metin</label><textarea id="f_text" placeholder="QR koduna eklenecek metni yaz"></textarea></div>`,
    url: `<div class="field"><label for="f_url">URL</label><input type="text" id="f_url" placeholder="ornek.com" inputmode="url"></div>`,
    wifi: `
      <div class="field"><label for="f_ssid">Ağ Adı (SSID)</label><input type="text" id="f_ssid"></div>
      <div class="field"><label for="f_pass">Şifre</label><input type="text" id="f_pass"></div>
      <div class="field"><label for="f_auth">Güvenlik Türü</label>
        <select id="f_auth"><option value="WPA">WPA/WPA2</option><option value="WEP">WEP</option><option value="nopass">Şifresiz</option></select>
      </div>
      <div class="field field-checkbox"><input type="checkbox" id="f_hidden"><label for="f_hidden" style="margin:0;">Gizli ağ</label></div>`,
    phone: `<div class="field"><label for="f_phone">Telefon Numarası</label><input type="tel" id="f_phone" placeholder="+90 5xx xxx xx xx" inputmode="tel"></div>`,
    email: `
      <div class="field"><label for="f_to">Alıcı E-posta</label><input type="email" id="f_to" inputmode="email"></div>
      <div class="field"><label for="f_subject">Konu (opsiyonel)</label><input type="text" id="f_subject"></div>`
  };

  function renderFields() { fieldsBox.innerHTML = FIELD_TEMPLATES[typeSelect.value]; }
  renderFields();
  typeSelect.addEventListener('change', renderFields);

  let lastSvg = null;

  body.querySelector('#qrGenerateBtn').addEventListener('click', () => {
    try {
      const type = typeSelect.value;
      const fields = {
        text: fieldsBox.querySelector('#f_text')?.value,
        url: fieldsBox.querySelector('#f_url')?.value,
        ssid: fieldsBox.querySelector('#f_ssid')?.value,
        pass: fieldsBox.querySelector('#f_pass')?.value,
        auth: fieldsBox.querySelector('#f_auth')?.value,
        hidden: fieldsBox.querySelector('#f_hidden')?.checked,
        phone: fieldsBox.querySelector('#f_phone')?.value,
        to: fieldsBox.querySelector('#f_to')?.value,
        subject: fieldsBox.querySelector('#f_subject')?.value
      };
      const payload = Tools.qr.buildPayload(type, fields);
      const result = Tools.qr.generate(payload);
      const svg = Tools.qr.toSVG(result, { pixelSize: 8 });
      lastSvg = svg;
      resultArea.innerHTML = `
        <div class="qr-result">
          <div class="qr-result__canvas">${svg}</div>
          <div class="btn-row">
            <button class="btn btn--secondary" id="qrDownloadPng">PNG İndir</button>
            <button class="btn btn--ghost" id="qrDownloadSvg">SVG İndir</button>
          </div>
        </div>`;
      resultArea.querySelector('#qrDownloadSvg').addEventListener('click', () => downloadSvg(lastSvg, 'teknoradar-qr.svg'));
      resultArea.querySelector('#qrDownloadPng').addEventListener('click', () => downloadSvgAsPng(lastSvg, 'teknoradar-qr.png'));
      UI.toast('QR kod oluşturuldu', 'success');
    } catch (err) {
      UI.toast(err.message, 'error');
    }
  });

  body.querySelector('#qrClearBtn').addEventListener('click', () => {
    renderFields();
    resultArea.innerHTML = '';
    lastSvg = null;
  });
}

function downloadSvg(svgString, filename) {
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, filename);
  UI.toast('SVG indiriliyor', 'success');
}

function downloadSvgAsPng(svgString, filename) {
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(svgBlob);
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width || 512;
    canvas.height = img.height || 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
    canvas.toBlob(blob => {
      if (!blob) { UI.toast('PNG oluşturulamadı', 'error'); return; }
      const pngUrl = URL.createObjectURL(blob);
      triggerDownload(pngUrl, filename);
      UI.toast('PNG indiriliyor', 'success');
    }, 'image/png');
  };
  img.onerror = () => { UI.toast('PNG oluşturulamadı', 'error'); URL.revokeObjectURL(url); };
  img.src = url;
}

function triggerDownload(url, filename) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/* 2. JSON Formatter */
function renderJSONTool(body) {
  body.innerHTML = `
    <div class="field">
      <label for="jsonInput">JSON Verisi</label>
      <textarea id="jsonInput" placeholder='{"ornek": true}' style="min-height:160px;"></textarea>
    </div>
    <div class="status-line" id="jsonStatus"></div>
    <div class="btn-row">
      <button class="btn btn--primary" id="jsonFormatBtn">Formatla</button>
      <button class="btn btn--secondary" id="jsonMinifyBtn">Sıkıştır</button>
      <button class="btn btn--ghost" id="jsonCopyBtn">Kopyala</button>
      <button class="btn btn--ghost" id="jsonClearBtn">Temizle</button>
    </div>
    <div class="result-box"><pre id="jsonOutput"></pre></div>
  `;
  const input = body.querySelector('#jsonInput');
  const output = body.querySelector('#jsonOutput');
  const status = body.querySelector('#jsonStatus');

  function updateStatus() {
    const res = Tools.json.validate(input.value);
    if (!input.value.trim()) { status.textContent = ''; status.className = 'status-line'; return; }
    status.textContent = res.valid ? 'JSON geçerli' : 'JSON geçersiz';
    status.className = 'status-line ' + (res.valid ? 'status-line--ok' : 'status-line--bad');
  }
  input.addEventListener('input', updateStatus);

  body.querySelector('#jsonFormatBtn').addEventListener('click', () => {
    try {
      output.textContent = Tools.json.format(input.value);
      UI.toast('JSON formatlandı', 'success');
    } catch (err) { UI.toast(err.message, 'error'); }
    updateStatus();
  });
  body.querySelector('#jsonMinifyBtn').addEventListener('click', () => {
    try {
      output.textContent = Tools.json.minify(input.value);
      UI.toast('JSON sıkıştırıldı', 'success');
    } catch (err) { UI.toast(err.message, 'error'); }
    updateStatus();
  });
  body.querySelector('#jsonCopyBtn').addEventListener('click', copyBtnHandler(() => output.textContent));
  body.querySelector('#jsonClearBtn').addEventListener('click', () => {
    input.value = ''; output.textContent = ''; updateStatus();
  });
}

/* 3. Base64 Encoder / Decoder */
function renderBase64Tool(body) {
  body.innerHTML = `
    <div class="field">
      <label for="b64Input">Metin</label>
      <textarea id="b64Input" placeholder="Dönüştürülecek metni yaz"></textarea>
    </div>
    <div class="field">
      <label for="b64Output">Base64</label>
      <textarea id="b64Output" placeholder="Sonuç burada görünecek"></textarea>
    </div>
    <div class="btn-row">
      <button class="btn btn--primary" id="b64EncodeBtn">Encode</button>
      <button class="btn btn--secondary" id="b64DecodeBtn">Decode</button>
      <button class="btn btn--ghost" id="b64SwapBtn">Alanları Değiştir</button>
      <button class="btn btn--ghost" id="b64CopyBtn">Kopyala</button>
      <button class="btn btn--ghost" id="b64ClearBtn">Temizle</button>
    </div>
  `;
  const input = body.querySelector('#b64Input');
  const output = body.querySelector('#b64Output');

  body.querySelector('#b64EncodeBtn').addEventListener('click', () => {
    try { output.value = Tools.base64.encode(input.value); UI.toast('Encode edildi', 'success'); }
    catch (err) { UI.toast(err.message, 'error'); }
  });
  body.querySelector('#b64DecodeBtn').addEventListener('click', () => {
    try { output.value = Tools.base64.decode(input.value); UI.toast('Decode edildi', 'success'); }
    catch (err) { UI.toast(err.message, 'error'); }
  });
  body.querySelector('#b64SwapBtn').addEventListener('click', () => {
    const tmp = input.value; input.value = output.value; output.value = tmp;
  });
  body.querySelector('#b64CopyBtn').addEventListener('click', copyBtnHandler(() => output.value));
  body.querySelector('#b64ClearBtn').addEventListener('click', () => { input.value = ''; output.value = ''; });
}

/* 4. Renk Dönüştürücü */
function renderColorTool(body) {
  body.innerHTML = `
    <div class="field">
      <label for="colorInput">HEX / RGB / HSL</label>
      <div class="field-row">
        <input type="text" id="colorInput" placeholder="#00D4FF veya rgb(0,212,255)" style="flex:1;">
        <input type="color" id="colorPicker" value="#00D4FF" style="width:50px;height:44px;padding:2px;border-radius:10px;border:1px solid var(--border);background:var(--surface);">
      </div>
    </div>
    <div class="status-line" id="colorStatus"></div>
    <div class="color-preview" id="colorPreview"></div>
    <div class="info-list" id="colorResults"></div>
  `;
  const input = body.querySelector('#colorInput');
  const picker = body.querySelector('#colorPicker');
  const status = body.querySelector('#colorStatus');
  const preview = body.querySelector('#colorPreview');
  const results = body.querySelector('#colorResults');

  function renderResult(res) {
    preview.style.background = res.hex;
    results.innerHTML = `
      <div class="info-row"><span class="info-row__label">HEX</span><span class="info-row__value">${res.hex}</span></div>
      <div class="info-row"><span class="info-row__label">RGB</span><span class="info-row__value">${res.rgb}</span></div>
      <div class="info-row"><span class="info-row__label">HSL</span><span class="info-row__value">${res.hsl}</span></div>
    `;
    status.textContent = ''; status.className = 'status-line';
    picker.value = res.hex;
  }

  function handleInput() {
    if (!input.value.trim()) { status.textContent = ''; results.innerHTML = ''; preview.style.background = 'transparent'; return; }
    try {
      renderResult(Tools.color.fromAny(input.value));
    } catch (err) {
      status.textContent = err.message;
      status.className = 'status-line status-line--bad';
    }
  }
  input.addEventListener('input', handleInput);
  picker.addEventListener('input', () => { input.value = picker.value; handleInput(); });

  input.value = '#00D4FF';
  handleInput();

  results.addEventListener('click', (e) => {
    const row = e.target.closest('.info-row');
    if (row) copyBtnHandler(() => row.querySelector('.info-row__value').textContent)();
  });
}

/* 5. Depolama Dönüştürücü */
function renderStorageTool(body) {
  const settings = Store.getSettings();
  body.innerHTML = `
    <div class="field-row">
      <div class="field" style="flex:2;">
        <label for="storageValue">Değer</label>
        <input type="number" id="storageValue" inputmode="decimal" placeholder="5">
      </div>
      <div class="field" style="flex:1;">
        <label for="storageUnit">Birim</label>
        <select id="storageUnit"></select>
      </div>
    </div>
    <div class="field">
      <label>Hesaplama Sistemi</label>
      <div class="segmented" id="storageSystemSegmented">
        <button data-sys="decimal">Decimal (1000)</button>
        <button data-sys="binary">Binary (1024)</button>
      </div>
    </div>
    <div class="storage-results" id="storageResults"></div>
  `;
  const valueInput = body.querySelector('#storageValue');
  const unitSelect = body.querySelector('#storageUnit');
  const sysSegmented = body.querySelector('#storageSystemSegmented');
  const resultsBox = body.querySelector('#storageResults');

  let binary = settings.binaryUnits;

  function refreshUnitOptions() {
    const units = binary ? Tools.storageConvert.binaryUnits : Tools.storageConvert.decimalUnits;
    const currentIndex = Number(unitSelect.dataset.index || 0);
    unitSelect.innerHTML = units.map((u, i) => `<option value="${i}">${u}</option>`).join('');
    unitSelect.value = String(Math.min(currentIndex, units.length - 1));
  }

  function updateSegmented() {
    sysSegmented.querySelectorAll('button').forEach(b => b.classList.toggle('is-active', (b.dataset.sys === 'binary') === binary));
  }

  function compute() {
    const value = Number(valueInput.value);
    const unitIndex = Number(unitSelect.value);
    unitSelect.dataset.index = String(unitIndex);
    if (!valueInput.value.trim()) { resultsBox.innerHTML = ''; return; }
    try {
      const rows = Tools.storageConvert.convert(value, unitIndex, binary);
      resultsBox.innerHTML = rows.map(r => `<div class="storage-row"><span>${r.unit}</span><span>${r.value.toLocaleString('tr-TR', { maximumFractionDigits: 6 })}</span></div>`).join('');
    } catch (err) {
      UI.toast(err.message, 'error');
    }
  }

  refreshUnitOptions();
  updateSegmented();
  valueInput.addEventListener('input', compute);
  unitSelect.addEventListener('change', compute);
  sysSegmented.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    binary = btn.dataset.sys === 'binary';
    Store.setSettings({ binaryUnits: binary });
    refreshUnitOptions();
    updateSegmented();
    compute();
  });
}

/* 6. Zaman Damgası Dönüştürücü */
function renderTimestampTool(body) {
  body.innerHTML = `
    <div class="field">
      <label>Yön</label>
      <div class="segmented" id="tsDirection">
        <button data-dir="toDate" class="is-active">Timestamp → Tarih</button>
        <button data-dir="toTimestamp">Tarih → Timestamp</button>
      </div>
    </div>

    <div id="tsToDateFields">
      <div class="field-row">
        <div class="field" style="flex:2;">
          <label for="tsInput">Unix Timestamp</label>
          <input type="number" id="tsInput" inputmode="numeric" placeholder="1735689600">
        </div>
        <div class="field" style="flex:1;">
          <label for="tsUnit">Birim</label>
          <select id="tsUnit"><option value="seconds">saniye</option><option value="milliseconds">milisaniye</option></select>
        </div>
      </div>
    </div>

    <div id="tsToTimestampFields" style="display:none;">
      <div class="field">
        <label for="tsDateInput">Tarih ve Saat</label>
        <input type="datetime-local" id="tsDateInput" step="1">
      </div>
    </div>

    <div class="btn-row">
      <button class="btn btn--ghost" id="tsNowBtn">Şimdi</button>
      <button class="btn btn--primary" id="tsConvertBtn">Dönüştür</button>
      <button class="btn btn--ghost" id="tsCopyBtn">Kopyala</button>
      <button class="btn btn--ghost" id="tsClearBtn">Temizle</button>
    </div>

    <div class="info-list" id="tsResults"></div>
  `;

  const dirBox = body.querySelector('#tsDirection');
  const toDateFields = body.querySelector('#tsToDateFields');
  const toTimestampFields = body.querySelector('#tsToTimestampFields');
  const tsInput = body.querySelector('#tsInput');
  const tsUnit = body.querySelector('#tsUnit');
  const tsDateInput = body.querySelector('#tsDateInput');
  const results = body.querySelector('#tsResults');
  let direction = 'toDate';
  let lastCopyText = '';

  function toLocalInputValue(date) {
    const pad = n => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  dirBox.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    direction = btn.dataset.dir;
    dirBox.querySelectorAll('button').forEach(b => b.classList.toggle('is-active', b === btn));
    toDateFields.style.display = direction === 'toDate' ? 'block' : 'none';
    toTimestampFields.style.display = direction === 'toTimestamp' ? 'block' : 'none';
    results.innerHTML = '';
  });

  body.querySelector('#tsNowBtn').addEventListener('click', () => {
    const now = new Date();
    if (direction === 'toDate') {
      tsInput.value = tsUnit.value === 'seconds' ? Math.floor(now.getTime() / 1000) : now.getTime();
    } else {
      tsDateInput.value = toLocalInputValue(now);
    }
  });

  body.querySelector('#tsConvertBtn').addEventListener('click', () => {
    try {
      let date;
      if (direction === 'toDate') {
        date = Tools.timestamp.fromTimestamp(tsInput.value, tsUnit.value);
      } else {
        date = Tools.timestamp.fromDateString(tsDateInput.value);
      }
      const local = Tools.timestamp.formatLocal(date);
      const utc = Tools.timestamp.formatUTC(date);
      const seconds = Math.floor(date.getTime() / 1000);
      const millis = date.getTime();
      results.innerHTML = `
        <div class="info-row"><span class="info-row__label">Yerel Saat</span><span class="info-row__value">${local}</span></div>
        <div class="info-row"><span class="info-row__label">UTC</span><span class="info-row__value">${utc}</span></div>
        <div class="info-row"><span class="info-row__label">Timestamp (sn)</span><span class="info-row__value">${seconds}</span></div>
        <div class="info-row"><span class="info-row__label">Timestamp (ms)</span><span class="info-row__value">${millis}</span></div>
      `;
      lastCopyText = `${local} | UTC: ${utc} | ${seconds}s / ${millis}ms`;
      UI.toast('Dönüştürüldü', 'success');
    } catch (err) {
      UI.toast(err.message, 'error');
    }
  });

  body.querySelector('#tsCopyBtn').addEventListener('click', copyBtnHandler(() => lastCopyText));
  body.querySelector('#tsClearBtn').addEventListener('click', () => {
    tsInput.value = ''; tsDateInput.value = ''; results.innerHTML = ''; lastCopyText = '';
  });
}

/* 7, 8, 9. Cihaz / Ekran / Ağ Bilgileri */
function renderInfoTool(body, collector, { live = false } = {}) {
  body.innerHTML = `
    <div class="btn-row"><button class="btn btn--ghost" id="infoRefreshBtn">Yenile</button></div>
    <div class="info-list" id="infoList"></div>
  `;
  const list = body.querySelector('#infoList');

  function render() {
    const rows = collector();
    list.innerHTML = rows.map(r => `<div class="info-row"><span class="info-row__label">${escapeHtml(r.label)}</span><span class="info-row__value">${escapeHtml(r.value)}</span></div>`).join('');
  }
  render();
  body.querySelector('#infoRefreshBtn').addEventListener('click', () => { render(); UI.toast('Bilgiler güncellendi', 'success'); });

  if (live) {
    const handler = () => render();
    window.addEventListener('resize', handler);
    window.addEventListener('orientationchange', handler);
    window.addEventListener('online', handler);
    window.addEventListener('offline', handler);
    activeLiveCleanup = () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('orientationchange', handler);
      window.removeEventListener('online', handler);
      window.removeEventListener('offline', handler);
    };
  }
}

/* 10. Siber Koruma */
function renderCyberTool(body) {
  const SUB_TABS = [
    { id: 'message', label: 'Mesaj' },
    { id: 'url', label: 'URL' },
    { id: 'password', label: 'Şifre' },
    { id: 'training', label: 'Eğitim' },
    { id: 'generator', label: 'Üretici' },
    { id: 'guide', label: 'Rehber' }
  ];
  let activeSub = 'message';

  body.innerHTML = `
    <div class="chip-row" id="cyberTabs"></div>
    <div id="cyberSubBody" style="margin-top:14px;"></div>
  `;
  const tabsBox = body.querySelector('#cyberTabs');
  const subBody = body.querySelector('#cyberSubBody');

  function renderTabs() {
    tabsBox.innerHTML = SUB_TABS.map(t => `<button class="chip ${activeSub === t.id ? 'is-active' : ''}" data-sub="${t.id}">${t.label}</button>`).join('');
    tabsBox.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => { activeSub = chip.dataset.sub; renderTabs(); renderSub(); });
    });
  }

  function riskBadge(level, levelClass) {
    return `<div class="status-line status-line--${levelClass}">${escapeHtml(level)}</div>`;
  }

  function renderSub() {
    if (activeSub === 'message') renderMessageSub();
    else if (activeSub === 'url') renderUrlSub();
    else if (activeSub === 'password') renderPasswordSub();
    else if (activeSub === 'training') renderTrainingSub();
    else if (activeSub === 'generator') renderGeneratorSub();
    else renderGuideSub();
  }

  function renderMessageSub() {
    subBody.innerHTML = `
      <div class="field"><label for="cyberMsgInput">Mesaj (SMS / DM / E-posta)</label><textarea id="cyberMsgInput" placeholder="Şüphelendiğin mesajı buraya yapıştır" style="min-height:140px;"></textarea></div>
      <div class="btn-row">
        <button class="btn btn--primary" id="cyberMsgAnalyzeBtn">Analiz Et</button>
        <button class="btn btn--ghost" id="cyberMsgClearBtn">Temizle</button>
      </div>
      <div id="cyberMsgResult"></div>
      <p class="field-hint">Bu analiz yerel sezgisel kontrollere dayanır, kesin bir güvenlik garantisi vermez.</p>
    `;
    const input = subBody.querySelector('#cyberMsgInput');
    const resultBox = subBody.querySelector('#cyberMsgResult');
    subBody.querySelector('#cyberMsgAnalyzeBtn').addEventListener('click', () => {
      try {
        const res = Tools.cyber.analyzeMessage(input.value);
        const items = res.found.length
          ? `<div class="info-list">${res.found.map(f => `<div class="info-row"><span class="info-row__label">${escapeHtml(f.label)}</span></div>`).join('')}</div>`
          : `<p class="field-hint">Belirgin bir risk göstergesi bulunamadı.</p>`;
        resultBox.innerHTML = riskBadge(res.level, res.levelClass) + items;
      } catch (err) { UI.toast(err.message, 'error'); }
    });
    subBody.querySelector('#cyberMsgClearBtn').addEventListener('click', () => { input.value = ''; resultBox.innerHTML = ''; });
  }

  function renderUrlSub() {
    subBody.innerHTML = `
      <div class="field"><label for="cyberUrlInput">URL</label><input type="text" id="cyberUrlInput" placeholder="https://ornek.com/giris" inputmode="url"></div>
      <div class="btn-row">
        <button class="btn btn--primary" id="cyberUrlAnalyzeBtn">Analiz Et</button>
        <button class="btn btn--ghost" id="cyberUrlClearBtn">Temizle</button>
      </div>
      <div id="cyberUrlResult"></div>
    `;
    const input = subBody.querySelector('#cyberUrlInput');
    const resultBox = subBody.querySelector('#cyberUrlResult');
    subBody.querySelector('#cyberUrlAnalyzeBtn').addEventListener('click', () => {
      try {
        const res = Tools.cyber.analyzeUrl(input.value);
        const rows = res.checks.map(c => `<div class="info-row"><span class="info-row__label">${c.ok ? '✅' : '⚠️'} ${escapeHtml(c.label)}</span></div><div class="field-hint" style="padding:0 14px 10px;">${escapeHtml(c.detail)}</div>`).join('');
        resultBox.innerHTML = riskBadge(res.level, res.levelClass) + `<div class="info-list">${rows}</div>`;
      } catch (err) { UI.toast(err.message, 'error'); }
    });
    subBody.querySelector('#cyberUrlClearBtn').addEventListener('click', () => { input.value = ''; resultBox.innerHTML = ''; });
  }

  function renderPasswordSub() {
    subBody.innerHTML = `
      <div class="field">
        <label for="cyberPwInput">Şifre</label>
        <div class="field-row">
          <input type="password" id="cyberPwInput" style="flex:1;" placeholder="Şifreni yaz" autocomplete="off">
          <button class="btn btn--ghost" id="cyberPwToggle" type="button" style="width:52px;">👁</button>
        </div>
      </div>
      <div id="cyberPwResult"></div>
      <p class="field-hint">Şifren hiçbir yere kaydedilmez veya gönderilmez; kontrol tamamen cihazında yapılır.</p>
    `;
    const input = subBody.querySelector('#cyberPwInput');
    const toggle = subBody.querySelector('#cyberPwToggle');
    const resultBox = subBody.querySelector('#cyberPwResult');
    toggle.addEventListener('click', () => { input.type = input.type === 'password' ? 'text' : 'password'; });
    input.addEventListener('input', () => {
      const res = Tools.cyber.checkPassword(input.value);
      if (!input.value) { resultBox.innerHTML = ''; return; }
      const rows = res.checks.map(c => `<div class="info-row"><span class="info-row__label">${c.ok ? '✅' : '❌'} ${escapeHtml(c.label)}</span></div>`).join('');
      resultBox.innerHTML = riskBadge(res.level, res.levelClass) + `<div class="info-list">${rows}</div>`;
    });
  }

  function renderTrainingSub() {
    let idx = 0;
    let revealed = false;
    function draw() {
      const ex = Tools.cyber.trainingExamples[idx];
      subBody.innerHTML = `
        <div class="result-box"><pre style="white-space:pre-wrap;font-family:var(--font);font-size:13px;">${escapeHtml(ex.text)}</pre></div>
        <p class="field-hint">Bu mesajın risk seviyesi ne olurdu?</p>
        <div class="btn-row">
          <button class="btn btn--ghost" data-guess="Düşük Risk">Düşük Risk</button>
          <button class="btn btn--ghost" data-guess="Dikkat">Dikkat</button>
          <button class="btn btn--ghost" data-guess="Yüksek Risk">Yüksek Risk</button>
        </div>
        <div id="cyberTrainResult"></div>
        <div class="btn-row">
          <button class="btn btn--secondary" id="cyberTrainNextBtn">Sonraki Örnek</button>
        </div>
      `;
      const resultBox = subBody.querySelector('#cyberTrainResult');
      subBody.querySelectorAll('[data-guess]').forEach(btn => {
        btn.addEventListener('click', () => {
          if (revealed) return;
          revealed = true;
          const correct = btn.dataset.guess === ex.level;
          resultBox.innerHTML = `
            <div class="status-line status-line--${correct ? 'ok' : 'warn'}">${correct ? 'Doğru tahmin! ' : 'Doğru cevap: '}${escapeHtml(ex.level)}</div>
            <p class="field-hint">${escapeHtml(ex.explanation)}</p>
          `;
        });
      });
      subBody.querySelector('#cyberTrainNextBtn').addEventListener('click', () => {
        idx = (idx + 1) % Tools.cyber.trainingExamples.length;
        revealed = false;
        draw();
      });
    }
    draw();
  }

  function renderGeneratorSub() {
    subBody.innerHTML = `
      <div class="field"><label for="cyberGenLen">Uzunluk: <span id="cyberGenLenVal">20</span></label><input type="range" id="cyberGenLen" min="8" max="64" value="20"></div>
      <div class="field"><div class="flag-row">
        <label class="flag"><input type="checkbox" id="cgUpper" checked><span>Büyük harf</span></label>
        <label class="flag"><input type="checkbox" id="cgLower" checked><span>Küçük harf</span></label>
        <label class="flag"><input type="checkbox" id="cgDigit" checked><span>Rakam</span></label>
        <label class="flag"><input type="checkbox" id="cgSym" checked><span>Sembol</span></label>
        <label class="flag"><input type="checkbox" id="cgAmb"><span>Benzer karakterleri çıkar (0 O l 1 I)</span></label>
      </div></div>
      <div class="btn-row"><button class="btn btn--primary" id="cyberGenBtn">Yeni şifre üret</button><button class="btn btn--ghost" id="cyberGenCopy">Kopyala</button></div>
      <div class="result-box"><div class="pw-out" id="cyberGenOut"></div></div>
      <div id="cyberGenStrength"></div>
      <p class="field-hint">Şifre cihazında güvenli rastgele sayı üreteciyle oluşturulur; hiçbir yere kaydedilmez veya gönderilmez.</p>
    `;
    const q = (s) => subBody.querySelector(s);
    const out = q('#cyberGenOut');
    function generate() {
      const amb = q('#cgAmb').checked;
      const pools = [];
      const strip = (s) => amb ? s.replace(/[0OlI1|]/g, '') : s;
      if (q('#cgUpper').checked) pools.push(strip('ABCDEFGHIJKLMNOPQRSTUVWXYZ'));
      if (q('#cgLower').checked) pools.push(strip('abcdefghijklmnopqrstuvwxyz'));
      if (q('#cgDigit').checked) pools.push(strip('0123456789'));
      if (q('#cgSym').checked) pools.push('!@#$%^&*()-_=+[]{};:,.?/');
      if (!pools.length) { UI.toast('En az bir karakter türü seç.', 'error'); return; }
      const len = Number(q('#cyberGenLen').value);
      const all = pools.join('');
      const chars = pools.map(p => p[randInt(p.length)]);
      while (chars.length < len) chars.push(all[randInt(all.length)]);
      for (let i = chars.length - 1; i > 0; i--) { const j = randInt(i + 1); [chars[i], chars[j]] = [chars[j], chars[i]]; }
      const pw = chars.join('');
      out.textContent = pw;
      const res = Tools.cyber.checkPassword(pw);
      q('#cyberGenStrength').innerHTML = riskBadge('Güç: ' + res.level, res.levelClass);
    }
    q('#cyberGenLen').addEventListener('input', () => { q('#cyberGenLenVal').textContent = q('#cyberGenLen').value; generate(); });
    subBody.querySelectorAll('input[type=checkbox]').forEach(c => c.addEventListener('change', generate));
    q('#cyberGenBtn').addEventListener('click', generate);
    q('#cyberGenCopy').addEventListener('click', copyBtnHandler(() => out.textContent));
    generate();
  }

  function renderGuideSub() {
    subBody.innerHTML = Tools.cyber.guideEntries.map(g => `
      <details class="settings-group" style="padding:0 14px;margin-bottom:10px;">
        <summary style="padding:14px 0;font-weight:600;color:var(--heading);cursor:pointer;">${escapeHtml(g.q)}</summary>
        <p class="field-hint" style="padding-bottom:14px;">${escapeHtml(g.a)}</p>
      </details>
    `).join('');
  }

  renderTabs();
  renderSub();
}

/* 11. Regex Tester */
function renderRegexTool(body) {
  const flagDefs = [['g', 'Global'], ['i', 'Büyük/küçük'], ['m', 'Çok satır'], ['s', 'Nokta \\n'], ['u', 'Unicode']];
  body.innerHTML = `
    <div class="field"><label for="rxPattern">Desen</label><input type="text" id="rxPattern" placeholder="\\b\\w+@\\w+\\.\\w+" autocomplete="off" autocapitalize="off" spellcheck="false"></div>
    <div class="field"><label>Bayraklar</label><div class="flag-row" id="rxFlags">${flagDefs.map(([f, l]) => `<label class="flag"><input type="checkbox" value="${f}" ${f === 'g' ? 'checked' : ''}><span>${f} · ${escapeHtml(l)}</span></label>`).join('')}</div></div>
    <div class="field"><label for="rxText">Test metni</label><textarea id="rxText" placeholder="ornek@email.com&#10;hata@.com&#10;valid@test.org" style="min-height:120px;"></textarea></div>
    <div class="btn-row"><button class="btn btn--primary" id="rxRun">Test Et</button><button class="btn btn--ghost" id="rxClear">Temizle</button></div>
    <div class="status-line" id="rxStatus"></div>
    <div class="result-box" id="rxPreview" style="display:none;"><pre id="rxPreviewText"></pre></div>
    <div class="info-list" id="rxList" style="margin-top:12px;"></div>
    <p class="field-hint">Karmaşık ve iç içe tekrar eden desenler uzun metinlerde tarayıcıyı yavaşlatabilir.</p>`;
  const q = (s) => body.querySelector(s);
  const pattern = q('#rxPattern'), text = q('#rxText'), status = q('#rxStatus');
  const preview = q('#rxPreview'), previewText = q('#rxPreviewText'), list = q('#rxList');
  const MAX_MATCHES = 500, MAX_TEXT = 100000;

  function run(fromButton) {
    status.textContent = ''; status.className = 'status-line';
    list.textContent = ''; preview.style.display = 'none';
    if (!pattern.value) { if (fromButton) UI.toast('Lütfen bir desen girin.', 'error'); return; }
    const flagsChecked = Array.from(body.querySelectorAll('#rxFlags input:checked')).map(i => i.value);
    const wantGlobal = flagsChecked.includes('g');
    const flags = wantGlobal ? flagsChecked.join('') : flagsChecked.join('') + 'g';
    let re;
    try { re = new RegExp(pattern.value, flags); }
    catch (err) {
      status.textContent = 'Geçersiz desen: ' + err.message;
      status.className = 'status-line status-line--bad';
      return;
    }
    let subject = text.value;
    let truncated = false;
    if (subject.length > MAX_TEXT) { subject = subject.slice(0, MAX_TEXT); truncated = true; }
    let matches = [];
    for (const m of subject.matchAll(re)) {
      matches.push(m);
      if (!wantGlobal || matches.length >= MAX_MATCHES) break;
    }
    if (!matches.length) {
      status.textContent = 'Eşleşme bulunamadı';
      status.className = 'status-line status-line--warn';
      return;
    }
    status.textContent = matches.length + ' eşleşme bulundu' + (matches.length >= MAX_MATCHES ? ' (ilk ' + MAX_MATCHES + ' gösteriliyor)' : '') + (truncated ? ' · metin sınırlandı' : '');
    status.className = 'status-line status-line--ok';

    const frag = document.createDocumentFragment();
    let last = 0;
    matches.forEach(m => {
      if (m[0] === '') return;
      if (m.index > last) frag.appendChild(document.createTextNode(subject.slice(last, m.index)));
      frag.appendChild(el('mark', 'rx', m[0]));
      last = m.index + m[0].length;
    });
    frag.appendChild(document.createTextNode(subject.slice(last)));
    previewText.textContent = '';
    previewText.appendChild(frag);
    preview.style.display = 'block';

    const rows = [];
    matches.forEach((m, i) => {
      rows.push(['#' + (i + 1) + ' · konum ' + m.index, m[0] === '' ? '(boş eşleşme)' : m[0]]);
      for (let g = 1; g < m.length; g++) rows.push(['   grup ' + g, m[g] === undefined ? '(eşleşmedi)' : m[g]]);
      if (m.groups) Object.keys(m.groups).forEach(n => rows.push(['   ad: ' + n, m.groups[n] === undefined ? '(eşleşmedi)' : m.groups[n]]));
    });
    fillInfo(list, rows);
  }
  const live = debounce(() => run(false), 220);
  pattern.addEventListener('input', live);
  text.addEventListener('input', live);
  body.querySelector('#rxFlags').addEventListener('change', live);
  q('#rxRun').addEventListener('click', () => run(true));
  q('#rxClear').addEventListener('click', () => { pattern.value = ''; text.value = ''; run(false); });
  makeCopyable(list);
}

/* 12. JWT Decoder */
function b64urlToBytes(s) {
  let t = s.replace(/-/g, '+').replace(/_/g, '/');
  t += '='.repeat((4 - (t.length % 4)) % 4);
  const bin = atob(t);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function decodeJwtPart(s) {
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(b64urlToBytes(s)));
}
function relTime(sec) {
  const abs = Math.abs(sec);
  const units = [['yıl', 31557600], ['gün', 86400], ['saat', 3600], ['dakika', 60], ['saniye', 1]];
  for (const [name, s] of units) if (abs >= s) return Math.floor(abs / s) + ' ' + name;
  return '0 saniye';
}

function renderJWTTool(body) {
  body.innerHTML = `
    <div class="field"><label for="jwtInput">JWT Token</label><textarea id="jwtInput" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." style="min-height:100px;" spellcheck="false"></textarea></div>
    <div class="btn-row"><button class="btn btn--primary" id="jwtDecodeBtn">Decode Et</button><button class="btn btn--ghost" id="jwtSample">Örnek</button><button class="btn btn--ghost" id="jwtClearBtn">Temizle</button></div>
    <div class="status-line" id="jwtStatus"></div>
    <div id="jwtResult"></div>
    <p class="field-hint">Token yalnızca cihazında çözülür. İmza gizli anahtar olmadan doğrulanamaz.</p>`;
  const input = body.querySelector('#jwtInput');
  const status = body.querySelector('#jwtStatus');
  const result = body.querySelector('#jwtResult');

  function block(title, content, copyText) {
    const h = el('h2', 'section-title', title);
    const box = el('div', 'result-box');
    const pre = el('pre', '', content);
    box.appendChild(pre);
    result.appendChild(h);
    result.appendChild(box);
    if (copyText) {
      const row = el('div', 'btn-row');
      const b = el('button', 'btn btn--ghost', 'Kopyala');
      b.addEventListener('click', copyBtnHandler(() => copyText));
      row.appendChild(b);
      result.appendChild(row);
    }
  }

  function decode(fromButton) {
    result.textContent = ''; status.textContent = ''; status.className = 'status-line';
    let token = input.value.trim().replace(/^bearer\s+/i, '').replace(/\s+/g, '');
    if (!token) { if (fromButton) UI.toast('Lütfen bir değer girin.', 'error'); return; }
    const parts = token.split('.');
    if (parts.length !== 3) { status.textContent = 'Geçersiz JWT: nokta ile ayrılmış 3 bölüm gerekir.'; status.className = 'status-line status-line--bad'; return; }
    let header, payload;
    try { header = decodeJwtPart(parts[0]); payload = decodeJwtPart(parts[1]); }
    catch (err) { status.textContent = 'Token çözülemedi: header/payload geçerli Base64URL JSON değil.'; status.className = 'status-line status-line--bad'; return; }

    const now = Math.floor(Date.now() / 1000);
    let expInfo = 'Süre (exp) bilgisi yok';
    let cls = 'status-line--warn';
    if (typeof payload.exp === 'number') {
      if (payload.exp < now) { expInfo = 'Süresi ' + relTime(now - payload.exp) + ' önce doldu'; cls = 'status-line--bad'; }
      else { expInfo = 'Geçerlilik süresi ' + relTime(payload.exp - now) + ' sonra doluyor'; cls = 'status-line--ok'; }
    }
    status.textContent = 'Alg: ' + (header.alg || '?') + ' · ' + expInfo;
    status.className = 'status-line ' + cls;

    block('Header', JSON.stringify(header, null, 2), JSON.stringify(header, null, 2));
    block('Payload', JSON.stringify(payload, null, 2), JSON.stringify(payload, null, 2));

    const claims = [['iat', 'Oluşturulma'], ['nbf', 'Başlangıç'], ['exp', 'Bitiş']]
      .filter(([k]) => typeof payload[k] === 'number')
      .map(([k, l]) => { const d = new Date(payload[k] * 1000); return [l + ' (' + k + ')', d.toLocaleString('tr-TR', { hour12: false }) + ' · UTC ' + d.toISOString()]; });
    if (claims.length) {
      result.appendChild(el('h2', 'section-title', 'Zaman bilgileri'));
      const l = el('div', 'info-list'); fillInfo(l, claims); result.appendChild(l);
    }
    result.appendChild(el('h2', 'section-title', 'İmza'));
    const sigBox = el('div', 'result-box');
    const sigPre = el('pre', '', parts[2] || '(imza yok)');
    sigBox.appendChild(sigPre); result.appendChild(sigBox);
  }

  input.addEventListener('input', debounce(() => decode(false), 250));
  body.querySelector('#jwtDecodeBtn').addEventListener('click', () => decode(true));
  body.querySelector('#jwtClearBtn').addEventListener('click', () => { input.value = ''; decode(false); });
  body.querySelector('#jwtSample').addEventListener('click', () => {
    const enc = (o) => btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(o)))).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
    const t = Math.floor(Date.now() / 1000);
    input.value = enc({ alg: 'HS256', typ: 'JWT' }) + '.' + enc({ sub: '1234567890', name: 'Kaan Şahin', iat: t, exp: t + 3600 }) + '.imza-ornegi';
    decode(false);
  });
}

/* 13. Hash Hesaplayıcı */
function renderHashTool(body) {
  body.innerHTML = `
    <div class="field"><label>Kaynak</label><div class="segmented" id="hashMode"><button data-mode="text" class="is-active">Metin</button><button data-mode="file">Dosya</button></div></div>
    <div class="field" id="hashTextField"><label for="hashInput">Metin</label><textarea id="hashInput" placeholder="Hash hesaplanacak metni gir" style="min-height:110px;" spellcheck="false"></textarea></div>
    <div class="field" id="hashFileField" style="display:none;"><label for="hashFile">Dosya</label><input type="file" id="hashFile" style="padding:12px 14px;"><p class="field-hint">Dosya cihazından çıkmaz; hash tamamen yerelde hesaplanır.</p></div>
    <div class="field"><label for="hashCompare">Karşılaştır (opsiyonel)</label><input type="text" id="hashCompare" placeholder="Beklenen hash değerini yapıştır" autocomplete="off" spellcheck="false"></div>
    <div class="btn-row"><button class="btn btn--primary" id="hashCalcBtn">Hesapla</button><button class="btn btn--ghost" id="hashClearBtn">Temizle</button></div>
    <div class="status-line" id="hashStatus"></div>
    <div class="info-list" id="hashResult"></div>`;
  const q = (s) => body.querySelector(s);
  let mode = 'text';
  const result = q('#hashResult'), status = q('#hashStatus');
  let lastHashes = null;

  function showMatch() {
    const cmp = q('#hashCompare').value.trim().toLowerCase();
    result.querySelectorAll('.info-row').forEach(r => r.classList.remove('is-match'));
    if (!lastHashes || !cmp) { if (lastHashes) { status.textContent = ''; status.className = 'status-line'; } return; }
    const hit = Object.keys(lastHashes).find(k => lastHashes[k] === cmp);
    if (hit) {
      status.textContent = 'Eşleşti: ' + hit; status.className = 'status-line status-line--ok';
      Array.from(result.querySelectorAll('.info-row')).forEach(r => { if (r.querySelector('.info-row__label').textContent === hit) r.classList.add('is-match'); });
    } else { status.textContent = 'Hiçbir hash ile eşleşmedi'; status.className = 'status-line status-line--bad'; }
  }

  q('#hashMode').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    mode = b.dataset.mode;
    q('#hashMode').querySelectorAll('button').forEach(x => x.classList.toggle('is-active', x === b));
    q('#hashTextField').style.display = mode === 'text' ? 'block' : 'none';
    q('#hashFileField').style.display = mode === 'file' ? 'block' : 'none';
  });

  q('#hashCalcBtn').addEventListener('click', async () => {
    try {
      let bytes;
      if (mode === 'text') {
        const v = q('#hashInput').value;
        if (!v) { UI.toast('Lütfen bir değer girin.', 'error'); return; }
        bytes = new TextEncoder().encode(v);
      } else {
        const f = q('#hashFile').files[0];
        if (!f) { UI.toast('Önce bir dosya seç.', 'error'); return; }
        if (f.size > 100 * 1024 * 1024) { UI.toast('Dosya çok büyük (en fazla 100 MB).', 'error'); return; }
        bytes = new Uint8Array(await f.arrayBuffer());
      }
      status.textContent = 'Hesaplanıyor…'; status.className = 'status-line';
      await new Promise(r => setTimeout(r, 30));
      const hashes = await HashLib.compute(bytes);
      lastHashes = hashes;
      const rows = Object.keys(hashes).map(k => [k, hashes[k]]);
      rows.push(['Boyut', bytes.length.toLocaleString('tr-TR') + ' bayt']);
      fillInfo(result, rows);
      status.textContent = ''; status.className = 'status-line';
      showMatch();
    } catch (err) { UI.toast('Hash hesaplanamadı.', 'error'); status.textContent = ''; }
  });
  q('#hashCompare').addEventListener('input', showMatch);
  q('#hashClearBtn').addEventListener('click', () => { q('#hashInput').value = ''; q('#hashCompare').value = ''; q('#hashFile').value = ''; result.textContent = ''; status.textContent = ''; lastHashes = null; });
  makeCopyable(result);
}

/* 14. HTML → AAB */
function renderHTML2AABTool(body) {
  body.innerHTML = `
    <div class="status-line status-line--warn">Bu araç derlenebilir bir Android projesi (ZIP) üretir; APK/AAB dosyasını GitHub Actions veya Android Studio oluşturur.</div>
    <div class="field"><label for="aabPackageName">Paket adı</label><input type="text" id="aabPackageName" value="com.teknoradar.htmlapp" autocomplete="off" autocapitalize="off" spellcheck="false"></div>
    <div class="field"><label for="aabAppName">Uygulama adı</label><input type="text" id="aabAppName" value="TeknoRadar App" maxlength="40"></div>
    <div class="field-row"><div class="field"><label for="aabVersionCode">Sürüm kodu</label><input type="number" id="aabVersionCode" min="1" value="1" inputmode="numeric"></div><div class="field"><label for="aabVersionName">Sürüm adı</label><input type="text" id="aabVersionName" value="1.0.0"></div></div>
    <div class="field"><label for="aabHtmlFile">HTML dosyası (index.html olarak eklenir)</label><input type="file" id="aabHtmlFile" accept=".html,.htm,text/html" style="padding:12px 14px;"></div>
    <div class="field"><label for="aabExtraFiles">Ek dosyalar (opsiyonel: CSS, JS, görsel…)</label><input type="file" id="aabExtraFiles" multiple style="padding:12px 14px;"><p class="field-hint" id="aabRefHint">HTML içinde yerel göreli dosyalar varsa onları buradan ekle.</p></div>
    <div class="field field-checkbox"><input type="checkbox" id="aabInternet"><label for="aabInternet" style="margin:0;">Uygulama internet erişimi istesin (INTERNET izni)</label></div>
    <div class="btn-row"><button class="btn btn--primary btn--block" id="aabGenerateBtn">Android Projesi Oluştur</button></div>
    <div id="aabResult"></div>`;
  const $ = (id) => body.querySelector('#' + id);
  const JAVA_KW = new Set(['abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class', 'const', 'continue', 'default', 'do', 'double', 'else', 'enum', 'extends', 'final', 'finally', 'float', 'for', 'goto', 'if', 'implements', 'import', 'instanceof', 'int', 'interface', 'long', 'native', 'new', 'package', 'private', 'protected', 'public', 'return', 'short', 'static', 'strictfp', 'super', 'switch', 'synchronized', 'this', 'throw', 'throws', 'transient', 'try', 'void', 'volatile', 'while', 'true', 'false', 'null']);

  $('aabGenerateBtn').addEventListener('click', async () => {
    const file = $('aabHtmlFile').files[0];
    const packageName = $('aabPackageName').value.trim();
    const appName = $('aabAppName').value.trim();
    const code = Number($('aabVersionCode').value);
    const version = $('aabVersionName').value.trim();
    const internet = $('aabInternet').checked;
    if (!file) return UI.toast('Önce bir HTML dosyası seç.', 'error');
    if (!/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/i.test(packageName) || packageName.split('.').some(s => JAVA_KW.has(s.toLowerCase()))) return UI.toast('Paket adı com.ornek.uygulama biçiminde olmalı.', 'error');
    if (!appName || !version || !Number.isInteger(code) || code < 1) return UI.toast('Uygulama adı ve geçerli sürüm bilgileri gir.', 'error');
    try {
      const html = await file.text();
      if (!html.trim()) throw new Error('Seçilen HTML dosyası boş.');
      const extra = Array.from($('aabExtraFiles').files);
      const extraSize = extra.reduce((s, f) => s + f.size, 0);
      if (extraSize > 40 * 1024 * 1024) throw new Error('Ek dosyalar çok büyük (en fazla 40 MB).');

      const xml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const androidStr = (s) => xml(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/^([@?])/, '\\$1');
      const gradleStr = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      const safeName = appName.replace(/[^a-zA-Z0-9_-]/g, '_') || 'app';
      const pkgPath = packageName.replace(/\./g, '/');

      const manifest = '<?xml version="1.0" encoding="utf-8"?>\n<manifest xmlns:android="http://schemas.android.com/apk/res/android">\n' +
        (internet ? '    <uses-permission android:name="android.permission.INTERNET"/>\n' : '') +
        '    <application\n        android:allowBackup="true"\n        android:label="@string/app_name"\n        android:supportsRtl="true"\n' +
        (internet ? '        android:usesCleartextTraffic="true"\n' : '') +
        '        android:theme="@android:style/Theme.Material.Light.NoActionBar">\n' +
        '        <activity\n            android:name=".MainActivity"\n            android:exported="true"\n            android:configChanges="orientation|screenSize|smallestScreenSize|screenLayout|keyboardHidden">\n' +
        '            <intent-filter>\n                <action android:name="android.intent.action.MAIN"/>\n                <category android:name="android.intent.category.LAUNCHER"/>\n            </intent-filter>\n        </activity>\n    </application>\n</manifest>\n';

      const appGradle = "plugins { id 'com.android.application' }\n\nandroid {\n    namespace '" + packageName + "'\n    compileSdk 35\n    defaultConfig {\n        applicationId '" + packageName + "'\n        minSdk 23\n        targetSdk 35\n        versionCode " + code + "\n        versionName '" + gradleStr(version) + "'\n    }\n    buildTypes { release { minifyEnabled false } }\n    compileOptions {\n        sourceCompatibility JavaVersion.VERSION_17\n        targetCompatibility JavaVersion.VERSION_17\n    }\n}\n";

      const activity = 'package ' + packageName + ';\n\nimport android.app.Activity;\nimport android.os.Bundle;\nimport android.webkit.WebChromeClient;\nimport android.webkit.WebSettings;\nimport android.webkit.WebView;\nimport android.webkit.WebViewClient;\n\npublic class MainActivity extends Activity {\n    private WebView web;\n\n    @Override\n    protected void onCreate(Bundle state) {\n        super.onCreate(state);\n        web = new WebView(this);\n        WebSettings s = web.getSettings();\n        s.setJavaScriptEnabled(true);\n        s.setDomStorageEnabled(true);\n        s.setAllowFileAccess(true);\n        s.setAllowContentAccess(false);\n        web.setWebViewClient(new WebViewClient());\n        web.setWebChromeClient(new WebChromeClient());\n        setContentView(web);\n        if (state != null) web.restoreState(state);\n        else web.loadUrl("file:///android_asset/index.html");\n    }\n\n    @Override\n    protected void onSaveInstanceState(Bundle out) {\n        super.onSaveInstanceState(out);\n        web.saveState(out);\n    }\n\n    @Override\n    public void onBackPressed() {\n        if (web.canGoBack()) web.goBack();\n        else super.onBackPressed();\n    }\n}\n';

      const readme = '# ' + appName + '\n\nHTML dosyan `app/src/main/assets/index.html` olarak eklendi.\n\n## GitHub Actions ile derleme\n1. ZIP içeriğini bir GitHub deposuna yükle.\n2. Actions sekmesinden "Android Build" iş akışını çalıştır.\n3. APK ve AAB dosyaları iş akışının Artifacts bölümünde oluşur.\n';
      const workflow = "name: Android Build\non:\n  workflow_dispatch:\n  push:\n    branches: [ main, master ]\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-java@v4\n        with:\n          distribution: temurin\n          java-version: '17'\n      - uses: android-actions/setup-android@v3\n      - uses: gradle/actions/setup-gradle@v4\n        with:\n          gradle-version: '8.9'\n      - name: Build debug APK and release AAB\n        run: gradle assembleDebug bundleRelease\n      - uses: actions/upload-artifact@v4\n        with:\n          name: android-builds\n          path: |\n            app/build/outputs/apk/debug/*.apk\n            app/build/outputs/bundle/release/*.aab\n          if-no-files-found: error\n";

      const files = [
        { name: 'settings.gradle', data: "pluginManagement { repositories { google(); mavenCentral(); gradlePluginPortal() } }\ndependencyResolutionManagement { repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS); repositories { google(); mavenCentral() } }\nrootProject.name = '" + gradleStr(safeName) + "'\ninclude ':app'\n" },
        { name: 'build.gradle', data: "plugins { id 'com.android.application' version '8.6.1' apply false }\n" },
        { name: 'gradle.properties', data: 'org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8\nandroid.useAndroidX=true\nandroid.nonTransitiveRClass=true\n' },
        { name: '.gitignore', data: '.gradle/\nbuild/\nlocal.properties\n*.jks\n*.keystore\n' },
        { name: 'README.md', data: readme },
        { name: '.github/workflows/android-build.yml', data: workflow },
        { name: 'app/build.gradle', data: appGradle },
        { name: 'app/src/main/AndroidManifest.xml', data: manifest },
        { name: 'app/src/main/java/' + pkgPath + '/MainActivity.java', data: activity },
        { name: 'app/src/main/res/values/strings.xml', data: '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <string name="app_name">' + androidStr(appName) + '</string>\n</resources>\n' },
        { name: 'app/src/main/assets/index.html', data: html }
      ];
      for (const f of extra) {
        const name = f.name.replace(/[\\/]/g, '_');
        if (name === 'index.html') continue;
        files.push({ name: 'app/src/main/assets/' + name, data: new Uint8Array(await f.arrayBuffer()) });
      }
      const blob = ZipLib.make(files);
      const outName = safeName + '-android-project.zip';

      const res = $('aabResult');
      res.textContent = '';
      const st = el('div', 'status-line status-line--ok', 'Android projesi hazır (' + files.length + ' dosya, ' + Math.ceil(blob.size / 1024).toLocaleString('tr-TR') + ' KB)');
      const dl = el('button', 'btn btn--secondary btn--block', 'ZIP indir');
      dl.addEventListener('click', () => { triggerDownload(URL.createObjectURL(blob), outName); UI.toast('Proje ZIP dosyası indiriliyor', 'success'); });
      res.appendChild(st); res.appendChild(dl);
      UI.toast('Android projesi oluşturuldu', 'success');
    } catch (e) { UI.toast(e.message || 'Proje oluşturulamadı.', 'error'); }
  });
}

/* 15. UUID Üretici */
function uuidFormat(b) {
  const h = hex(b);
  return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
}
function uuidV4() {
  const b = randomBytes(16);
  b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
  return uuidFormat(b);
}
function uuidV7() {
  const b = randomBytes(16);
  const ts = Date.now();
  b[0] = Math.floor(ts / 1099511627776) & 255; b[1] = Math.floor(ts / 4294967296) & 255;
  b[2] = (ts >>> 24) & 255; b[3] = (ts >>> 16) & 255; b[4] = (ts >>> 8) & 255; b[5] = ts & 255;
  b[6] = (b[6] & 0x0f) | 0x70; b[8] = (b[8] & 0x3f) | 0x80;
  return uuidFormat(b);
}

function renderUuidTool(body) {
  body.innerHTML = `
    <div class="field"><label>Sürüm</label><div class="segmented" id="uuidVer"><button data-v="4" class="is-active">v4 · rastgele</button><button data-v="7">v7 · zaman sıralı</button></div></div>
    <div class="field-row">
      <div class="field"><label for="uuidCount">Adet (1-50)</label><input type="number" id="uuidCount" min="1" max="50" value="5" inputmode="numeric"></div>
    </div>
    <div class="field"><div class="flag-row"><label class="flag"><input type="checkbox" id="uuidUpper"><span>Büyük harf</span></label><label class="flag"><input type="checkbox" id="uuidNoDash"><span>Tire olmadan</span></label></div></div>
    <div class="btn-row"><button class="btn btn--primary" id="uuidGen">Üret</button><button class="btn btn--ghost" id="uuidCopyAll">Tümünü kopyala</button><button class="btn btn--ghost" id="uuidClear">Temizle</button></div>
    <div class="info-list" id="uuidList"></div>`;
  const q = (s) => body.querySelector(s);
  let version = '4', current = [];
  const list = q('#uuidList');
  function gen() {
    const n = Math.max(1, Math.min(50, parseInt(q('#uuidCount').value, 10) || 1));
    q('#uuidCount').value = n;
    const up = q('#uuidUpper').checked, nd = q('#uuidNoDash').checked;
    current = Array.from({ length: n }, () => {
      let u = version === '7' ? uuidV7() : uuidV4();
      if (nd) u = u.replace(/-/g, '');
      return up ? u.toUpperCase() : u;
    });
    fillInfo(list, current.map((u, i) => ['#' + (i + 1), u]));
  }
  q('#uuidVer').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    version = b.dataset.v;
    q('#uuidVer').querySelectorAll('button').forEach(x => x.classList.toggle('is-active', x === b));
    gen();
  });
  q('#uuidGen').addEventListener('click', gen);
  q('#uuidUpper').addEventListener('change', gen);
  q('#uuidNoDash').addEventListener('change', gen);
  q('#uuidCopyAll').addEventListener('click', copyBtnHandler(() => current.join('\n')));
  q('#uuidClear').addEventListener('click', () => { current = []; list.textContent = ''; });
  makeCopyable(list);
  gen();
}

/* 16. Metin İstatistikleri */
function renderTextStatsTool(body) {
  body.innerHTML = `
    <div class="field"><label for="txsText">Metin</label><textarea id="txsText" placeholder="Metni buraya yaz veya yapıştır" style="min-height:160px;"></textarea></div>
    <div class="btn-row"><button class="btn btn--ghost" id="txsPaste">Panodan yapıştır</button><button class="btn btn--ghost" id="txsClear">Temizle</button></div>
    <div class="info-list" id="txsRes"></div>
    <h2 class="section-title">En sık kelimeler</h2>
    <div class="info-list" id="txsTop"></div>`;
  const q = (s) => body.querySelector(s);
  const input = q('#txsText');
  function compute() {
    const t = input.value;
    const chars = Array.from(t).length;
    const noSpace = Array.from(t.replace(/\s/g, '')).length;
    const words = t.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || [];
    const sentences = (t.match(/[^.!?…]+[.!?…]+|[^.!?…]+$/g) || []).filter(s => s.trim()).length;
    const paragraphs = t.split(/\n\s*\n/).filter(s => s.trim()).length;
    const lines = t ? t.split('\n').length : 0;
    const bytes = new TextEncoder().encode(t).length;
    const fmt = (n) => n.toLocaleString('tr-TR');
    fillInfo(q('#txsRes'), [
      ['Karakter (boşluklu)', fmt(chars)], ['Karakter (boşluksuz)', fmt(noSpace)], ['Kelime', fmt(words.length)],
      ['Cümle', fmt(sentences)], ['Paragraf', fmt(paragraphs)], ['Satır', fmt(lines)], ['Boyut (UTF-8)', fmt(bytes) + ' bayt'],
      ['Okuma süresi', words.length ? Math.max(1, Math.ceil(words.length / 200)) + ' dk' : '0 dk'],
      ['Konuşma süresi', words.length ? Math.max(1, Math.ceil(words.length / 130)) + ' dk' : '0 dk']
    ]);
    const counts = new Map();
    words.forEach(w => { const k = w.toLocaleLowerCase('tr'); if (k.length >= 3) counts.set(k, (counts.get(k) || 0) + 1); });
    const top = Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'tr')).slice(0, 8);
    if (top.length) fillInfo(q('#txsTop'), top.map(([w, c]) => [w, c + ' kez'])); else q('#txsTop').textContent = '';
  }
  input.addEventListener('input', debounce(compute, 120));
  q('#txsClear').addEventListener('click', () => { input.value = ''; compute(); });
  q('#txsPaste').addEventListener('click', async () => {
    try { input.value = await navigator.clipboard.readText(); compute(); }
    catch (e) { UI.toast('Panoya erişilemedi; metni elle yapıştır.', 'error'); }
  });
  compute();
}

/* 17. Metin İşlemleri */
const TR_MAP = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u', 'Ç': 'C', 'Ğ': 'G', 'İ': 'I', 'Ö': 'O', 'Ş': 'S', 'Ü': 'U' };
const toAscii = (s) => s.replace(/[çğıöşüÇĞİÖŞÜ]/g, c => TR_MAP[c]).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const TEXT_OPS = [
  ['BÜYÜK HARF', (s) => s.toLocaleUpperCase('tr')],
  ['küçük harf', (s) => s.toLocaleLowerCase('tr')],
  ['Başlık Düzeni', (s) => s.replace(/(\S+)/g, w => w.charAt(0).toLocaleUpperCase('tr') + w.slice(1).toLocaleLowerCase('tr'))],
  ['Ters çevir', (s) => Array.from(s).reverse().join('')],
  ['Boşlukları temizle', (s) => s.split('\n').map(l => l.trim().replace(/[ \t]+/g, ' ')).join('\n').trim()],
  ['Boş satırları sil', (s) => s.split('\n').filter(l => l.trim()).join('\n')],
  ['Tekrar edenleri sil', (s) => Array.from(new Set(s.split('\n'))).join('\n')],
  ['A → Z sırala', (s) => s.split('\n').sort((a, b) => a.localeCompare(b, 'tr')).join('\n')],
  ['Z → A sırala', (s) => s.split('\n').sort((a, b) => b.localeCompare(a, 'tr')).join('\n')],
  ['Satır numarası', (s) => s.split('\n').map((l, i) => (i + 1) + '. ' + l).join('\n')],
  ['ASCII\'ye çevir', (s) => toAscii(s)],
  ['Slug', (s) => toAscii(s.toLocaleLowerCase('tr')).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')],
  ['URL encode', (s) => encodeURIComponent(s)],
  ['URL decode', (s) => { try { return decodeURIComponent(s); } catch (e) { throw new Error('Geçersiz kodlanmış metin.'); } }]
];

function renderTextToolsTool(body) {
  body.innerHTML = `
    <div class="field"><label for="txtIn">Metin</label><textarea id="txtIn" placeholder="İşlenecek metni yaz veya yapıştır" style="min-height:130px;"></textarea></div>
    <div class="field"><label>İşlem seç</label><div class="flag-row" id="txtOps">${TEXT_OPS.map((o, i) => `<button class="chip" data-op="${i}">${escapeHtml(o[0])}</button>`).join('')}</div></div>
    <div class="field"><label for="txtOut">Sonuç</label><textarea id="txtOut" readonly placeholder="Sonuç burada görünecek" style="min-height:130px;"></textarea></div>
    <div class="btn-row"><button class="btn btn--primary" id="txtCopy">Kopyala</button><button class="btn btn--secondary" id="txtUse">Sonucu girdiye taşı</button><button class="btn btn--ghost" id="txtClear">Temizle</button></div>`;
  const q = (s) => body.querySelector(s);
  const input = q('#txtIn'), out = q('#txtOut');
  q('#txtOps').addEventListener('click', (e) => {
    const b = e.target.closest('[data-op]'); if (!b) return;
    if (!input.value) { UI.toast('Lütfen bir değer girin.', 'error'); return; }
    try { out.value = TEXT_OPS[Number(b.dataset.op)][1](input.value); }
    catch (err) { UI.toast(err.message, 'error'); }
  });
  q('#txtCopy').addEventListener('click', copyBtnHandler(() => out.value));
  q('#txtUse').addEventListener('click', () => { if (out.value) { input.value = out.value; out.value = ''; } });
  q('#txtClear').addEventListener('click', () => { input.value = ''; out.value = ''; });
}

/* 18. Sayı Sistemi */
function parseBig(str, base) {
  let s = str.trim().replace(/[\s_]/g, '').toLowerCase();
  let neg = false;
  if (s[0] === '-') { neg = true; s = s.slice(1); } else if (s[0] === '+') s = s.slice(1);
  if (base === 16 && s.startsWith('0x')) s = s.slice(2);
  if (base === 2 && s.startsWith('0b')) s = s.slice(2);
  if (base === 8 && s.startsWith('0o')) s = s.slice(2);
  if (!s) throw new Error('Lütfen bir değer girin.');
  if (s.length > 2000) throw new Error('Değer çok uzun.');
  let r = 0n;
  const B = BigInt(base);
  for (const ch of s) {
    const d = parseInt(ch, 36);
    if (Number.isNaN(d) || d >= base) throw new Error('"' + ch + '" karakteri ' + base + ' tabanında geçersiz.');
    r = r * B + BigInt(d);
  }
  return neg ? -r : r;
}

function renderNumBaseTool(body) {
  const common = { 2: 'İkili (2)', 8: 'Sekizli (8)', 10: 'Onlu (10)', 16: 'Onaltılı (16)' };
  let opts = '';
  for (let b = 2; b <= 36; b++) opts += `<option value="${b}" ${b === 10 ? 'selected' : ''}>${common[b] || 'Taban ' + b}</option>`;
  body.innerHTML = `
    <div class="field-row">
      <div class="field" style="flex:2;"><label for="nbValue">Değer</label><input type="text" id="nbValue" placeholder="255" autocomplete="off" autocapitalize="off" spellcheck="false"></div>
      <div class="field" style="flex:1.4;"><label for="nbBase">Taban</label><select id="nbBase">${opts}</select></div>
    </div>
    <div class="status-line" id="nbStatus"></div>
    <div class="info-list" id="nbRes"></div>`;
  const q = (s) => body.querySelector(s);
  const res = q('#nbRes'), status = q('#nbStatus');
  function group(s, n) { const neg = s[0] === '-'; const d = neg ? s.slice(1) : s; const g = d.replace(new RegExp('\\B(?=([0-9a-z]{' + n + '})+(?![0-9a-z]))', 'g'), ' '); return (neg ? '-' : '') + g; }
  function compute() {
    status.textContent = ''; status.className = 'status-line';
    if (!q('#nbValue').value.trim()) { res.textContent = ''; return; }
    try {
      const n = parseBig(q('#nbValue').value, Number(q('#nbBase').value));
      const bits = n === 0n ? 1 : (n < 0n ? -n : n).toString(2).length;
      const rows = [
        ['İkili (2)', group(n.toString(2), 4)], ['Sekizli (8)', n.toString(8)],
        ['Onlu (10)', n.toString(10)], ['Onaltılı (16)', n.toString(16).toUpperCase()], ['Taban 36', n.toString(36).toUpperCase()],
        ['Bit uzunluğu', String(bits)]
      ];
      if (n >= 32n && n <= 0x10ffffn && !(n >= 0xd800n && n <= 0xdfffn)) rows.push(['Unicode karakter', String.fromCodePoint(Number(n))]);
      fillInfo(res, rows);
    } catch (err) {
      res.textContent = '';
      status.textContent = err.message; status.className = 'status-line status-line--bad';
    }
  }
  q('#nbValue').addEventListener('input', debounce(compute, 100));
  q('#nbBase').addEventListener('change', compute);
  makeCopyable(res);
}

/* 19. Birim Dönüştürücü */
const UNIT_SETS = {
  length: { label: 'Uzunluk', units: { mm: ['Milimetre', 0.001], cm: ['Santimetre', 0.01], m: ['Metre', 1], km: ['Kilometre', 1000], in: ['İnç', 0.0254], ft: ['Fit', 0.3048], yd: ['Yard', 0.9144], mi: ['Mil', 1609.344] } },
  mass: { label: 'Ağırlık', units: { mg: ['Miligram', 0.000001], g: ['Gram', 0.001], kg: ['Kilogram', 1], t: ['Ton', 1000], oz: ['Ons', 0.028349523125], lb: ['Libre', 0.45359237] } },
  temp: { label: 'Sıcaklık', units: { C: ['Celsius (°C)'], F: ['Fahrenheit (°F)'], K: ['Kelvin (K)'] } },
  speed: { label: 'Hız', units: { ms: ['Metre/saniye', 1], kmh: ['Kilometre/saat', 1 / 3.6], mph: ['Mil/saat', 0.44704], kn: ['Deniz mili/saat (knot)', 1852 / 3600] } },
  area: { label: 'Alan', units: { cm2: ['cm²', 0.0001], m2: ['m²', 1], ha: ['Hektar', 10000], donum: ['Dönüm (1000 m²)', 1000], km2: ['km²', 1000000], ft2: ['ft²', 0.09290304], ac: ['Akre', 4046.8564224] } },
  volume: { label: 'Hacim', units: { ml: ['Mililitre', 0.001], l: ['Litre', 1], m3: ['m³', 1000], gal: ['Galon (ABD)', 3.785411784], floz: ['fl oz (ABD)', 0.0295735295625], cup: ['Bardak (ABD)', 0.2365882365] } },
  time: { label: 'Zaman', units: { ms: ['Milisaniye', 0.001], s: ['Saniye', 1], min: ['Dakika', 60], h: ['Saat', 3600], d: ['Gün', 86400], w: ['Hafta', 604800], y: ['Yıl (365,25 gün)', 31557600] } }
};
function unitConvert(cat, from, to, v) {
  if (cat === 'temp') {
    const c = from === 'C' ? v : from === 'F' ? (v - 32) * 5 / 9 : v - 273.15;
    return to === 'C' ? c : to === 'F' ? c * 9 / 5 + 32 : c + 273.15;
  }
  const u = UNIT_SETS[cat].units;
  return v * u[from][1] / u[to][1];
}
function fmtNum(n) {
  if (!Number.isFinite(n)) return '—';
  if (n !== 0 && (Math.abs(n) >= 1e12 || Math.abs(n) < 1e-6)) return n.toExponential(6);
  return n.toLocaleString('tr-TR', { maximumSignificantDigits: 10 });
}

function renderUnitsTool(body) {
  let cat = 'length';
  body.innerHTML = `
    <div class="chip-row" id="unCats">${Object.keys(UNIT_SETS).map(k => `<button class="chip" data-cat="${k}">${UNIT_SETS[k].label}</button>`).join('')}</div>
    <div class="field" style="margin-top:14px;"><label for="unValue">Değer</label><input type="text" id="unValue" inputmode="decimal" placeholder="1" value="1" autocomplete="off"></div>
    <div class="field-row"><div class="field"><label for="unFrom">Kaynak birim</label><select id="unFrom"></select></div><div class="field"><label for="unTo">Hedef birim</label><select id="unTo"></select></div></div>
    <div class="btn-row"><button class="btn btn--ghost" id="unSwap">Birimleri değiştir</button></div>
    <div class="status-line" id="unStatus"></div>
    <div class="result-box"><pre id="unBig" style="font-size:20px;"></pre></div>
    <h2 class="section-title">Tüm birimler</h2>
    <div class="info-list" id="unAll"></div>`;
  const q = (s) => body.querySelector(s);
  function fillSelects() {
    const keys = Object.keys(UNIT_SETS[cat].units);
    const optHtml = keys.map(k => `<option value="${k}">${escapeHtml(UNIT_SETS[cat].units[k][0])}</option>`).join('');
    q('#unFrom').innerHTML = optHtml; q('#unTo').innerHTML = optHtml;
    q('#unFrom').value = keys[0]; q('#unTo').value = keys[Math.min(2, keys.length - 1)];
    q('#unCats').querySelectorAll('.chip').forEach(c => c.classList.toggle('is-active', c.dataset.cat === cat));
  }
  function compute() {
    const st = q('#unStatus');
    st.textContent = ''; st.className = 'status-line';
    const raw = q('#unValue').value.trim().replace(',', '.');
    if (!raw) { q('#unBig').textContent = ''; q('#unAll').textContent = ''; return; }
    const v = Number(raw);
    if (!Number.isFinite(v)) { st.textContent = 'Lütfen geçerli bir sayı girin.'; st.className = 'status-line status-line--bad'; return; }
    const from = q('#unFrom').value, to = q('#unTo').value;
    const units = UNIT_SETS[cat].units;
    q('#unBig').textContent = fmtNum(v) + ' ' + units[from][0] + '  =  ' + fmtNum(unitConvert(cat, from, to, v)) + ' ' + units[to][0];
    fillInfo(q('#unAll'), Object.keys(units).map(k => [units[k][0], fmtNum(unitConvert(cat, from, k, v))]));
  }
  q('#unCats').addEventListener('click', (e) => { const b = e.target.closest('[data-cat]'); if (!b) return; cat = b.dataset.cat; fillSelects(); compute(); });
  q('#unValue').addEventListener('input', debounce(compute, 80));
  q('#unFrom').addEventListener('change', compute);
  q('#unTo').addEventListener('change', compute);
  q('#unSwap').addEventListener('click', () => { const a = q('#unFrom').value; q('#unFrom').value = q('#unTo').value; q('#unTo').value = a; compute(); });
  makeCopyable(q('#unAll'));
  fillSelects(); compute();
}

const TOOL_RENDERERS = {
  qr: renderQRTool,
  json: renderJSONTool,
  base64: renderBase64Tool,
  color: renderColorTool,
  storage: renderStorageTool,
  timestamp: renderTimestampTool,
  device: (body) => renderInfoTool(body, Tools.device.collect),
  screen: (body) => renderInfoTool(body, Tools.screen.collect, { live: true }),
  network: (body) => renderInfoTool(body, Tools.network.collect, { live: true }),
  regex: renderRegexTool,
  jwt: renderJWTTool,
  hash: renderHashTool,
  html2aab: renderHTML2AABTool,
  uuid: renderUuidTool,
  numbase: renderNumBaseTool,
  textstats: renderTextStatsTool,
  texttools: renderTextToolsTool,
  units: renderUnitsTool,
  cyber: renderCyberTool
};

/* ---------------- Performans ve Efekt Yönetimi ---------------- */
const FX_LABEL = { auto: 'Otomatik', full: 'Tam', lite: 'Hafif' };
function resolveFx(mode) {
  if (mode === 'full' || mode === 'lite') return mode;
  const mem = navigator.deviceMemory, cores = navigator.hardwareConcurrency;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return (reduce || (mem && mem <= 3) || (cores && cores <= 4)) ? 'lite' : 'full';
}
function applyFx() {
  const mode = Store.getSettings().glass || 'auto';
  const resolved = resolveFx(mode);
  const root = document.documentElement;
  root.setAttribute('data-fx', resolved);
  const chrome = /Chrome\/(\d+)/.exec(navigator.userAgent);
  root.classList.toggle('has-refract', resolved === 'full' && !!chrome && Number(chrome[1]) >= 100);
}
function syncFxButtons() {
  const mode = Store.getSettings().glass || 'auto';
  document.querySelectorAll('#fxSegmented button').forEach(b => b.classList.toggle('is-active', b.dataset.fxChoice === mode));
}
document.getElementById('fxSegmented').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  Store.setSettings({ glass: b.dataset.fxChoice });
  applyFx(); syncFxButtons();
  UI.toast('Cam efekti: ' + FX_LABEL[b.dataset.fxChoice], 'success');
});

/* Kart ve Menü Etkileşimleri */
(function glassInteractions() {
  let raf = 0, tx = 0, ty = 0, target = null;
  function paint() {
    raf = 0;
    if (!target) return;
    const r = target.getBoundingClientRect();
    target.style.setProperty('--mx', (tx - r.left) + 'px');
    target.style.setProperty('--my', (ty - r.top) + 'px');
  }
  function onPointer(e) {
    if (document.documentElement.getAttribute('data-fx') !== 'full') return;
    const card = e.target.closest && e.target.closest('.tool-card');
    if (!card) return;
    target = card; tx = e.clientX; ty = e.clientY;
    if (!raf) raf = requestAnimationFrame(paint);
  }
  mainEl.addEventListener('pointermove', onPointer, { passive: true });
  mainEl.addEventListener('pointerdown', onPointer, { passive: true });

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { headerEl.classList.toggle('is-scrolled', window.scrollY > 4); ticking = false; });
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    document.documentElement.classList.toggle('is-hidden', document.hidden);
  });
})();

/* Menü Sürükleme */
(function navDrag() {
  const order = ['home', 'tools', 'favorites', 'settings'];
  const pad = 6;
  let pressed = false, dragging = false, startX = 0, pid = null;
  function idxFromX(x) {
    const r = bottomNav.getBoundingClientRect();
    const w = (r.width - pad * 2) / 4;
    return Math.max(0, Math.min(3, (x - r.left - pad) / w - 0.5));
  }
  function activeIndex() {
    const a = bottomNav.querySelector('.bottom-nav__item.is-active');
    const i = a ? order.indexOf(a.dataset.nav) : 0;
    return i < 0 ? 0 : i;
  }
  bottomNav.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return;
    pressed = true; dragging = false; startX = e.clientX; pid = e.pointerId;
    bottomNav.classList.add('is-pressed');
  });
  bottomNav.addEventListener('pointermove', (e) => {
    if (!pressed || e.pointerId !== pid) return;
    if (!dragging && Math.abs(e.clientX - startX) > 8) {
      dragging = true;
      bottomNav.classList.add('is-dragging');
      try { bottomNav.setPointerCapture(pid); } catch (err) {}
    }
    if (dragging) bottomNav.style.setProperty('--nav-index', idxFromX(e.clientX).toFixed(3));
  });
  function finish(e, cancelled) {
    if (!pressed) return;
    pressed = false;
    bottomNav.classList.remove('is-pressed', 'is-dragging');
    if (!dragging) return;
    dragging = false;
    navSuppressClick = true;
    window.setTimeout(() => { navSuppressClick = false; }, 350);
    const t = cancelled ? activeIndex() : Math.round(idxFromX(e.clientX));
    if (t === activeIndex()) bottomNav.style.setProperty('--nav-index', t);
    else navigateTo(order[t]);
  }
  bottomNav.addEventListener('pointerup', (e) => finish(e, false));
  bottomNav.addEventListener('pointercancel', (e) => finish(e, true));
})();

function onCardActivate(e) {
  const fav = e.target.closest('[data-fav-toggle]');
  if (fav) {
    e.stopPropagation();
    const nowFav = Store.toggleFavorite(fav.dataset.favToggle);
    UI.toast(nowFav ? 'Favorilere eklendi' : 'Favorilerden çıkarıldı', 'success');
    renderRoute();
    return;
  }
  const card = e.target.closest('[data-open-tool]');
  if (card) navigateTo('tool/' + card.dataset.openTool);
}
mainEl.addEventListener('click', onCardActivate);
mainEl.addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('.tool-card')) {
    e.preventDefault();
    onCardActivate(e);
  }
});

let lastErrToast = 0;
function reportError(err) {
  if (window.console) console.error(err);
  const now = Date.now();
  if (now - lastErrToast < 4000) return;
  lastErrToast = now;
  UI.toast('Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.', 'error');
}
window.addEventListener('error', (e) => reportError(e.error || e.message));
window.addEventListener('unhandledrejection', (e) => reportError(e.reason));

function init() {
  UI.applyTheme(Store.getTheme());
  applyFx();
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (Store.getTheme() === 'system') UI.applyTheme('system');
    });
  }
  renderRoute();
}

document.addEventListener('DOMContentLoaded', init);
