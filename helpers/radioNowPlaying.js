const https = require('https');
const http = require('http');

// Список станций (синхронизирован с фронтом radioData).
// id используется для сопоставления с клиентом.
const STATIONS = [
  { id: 'rock181', name: 'Rock 181', url: 'https://listen.181fm.com/181-rock_128k.mp3' },
  { id: 'spdeep', name: 'SOUNDPARK DEEP', url: 'https://getradio.me/spdeep/hls.m3u8' },
  { id: 'energy', name: 'Радио Energy', url: 'https://pub0202.101.ru:8443/stream/air/aac/64/99' },
  { id: 'europaplus', name: 'Europa Plus', url: 'https://ep256.hostingradio.ru:8052/europaplus256.mp3' },
  { id: 'radio7', name: 'Радио 7', url: 'https://radio7.hostingradio.ru:8040/radio7256.mp3' },
  { id: 'radio7-hi', name: 'Радио 7 (hi)', url: 'https://stream05.pcradio.ru/radio7_ru-hi' },
  { id: 'radio7-med', name: 'Радио 7 (med)', url: 'https://stream05.pcradio.ru/radio7_ru-med' },
  { id: 'radio7-low', name: 'Радио 7 (low)', url: 'https://stream.pcradio.ru/radio7_ru-low' },
  { id: 'rusrock', name: 'Русский Рок', url: 'https://rock.amgradio.ru/RusRock?r_bells' },
  { id: 'recordrock', name: 'Record Rock', url: 'https://radiorecord.hostingradio.ru/rock96.aacp' },
  { id: 'rockradio', name: 'Rock Radio', url: 'https://cast2.my-control-panel.com/proxy/vladas/stream' },
  { id: 'maximum', name: 'Радио Максимум', url: 'https://maximum.hostingradio.ru/maximum96.aacp' },
  { id: 'dfm', name: 'DFM', url: 'https://dfm.hostingradio.ru/dfm96.aacp' },
  { id: 'kissfmdeep', name: 'Kiss FM Deep', url: 'https://www.liveradio.es/http://online.kissfm.ua/KissFM_Deep_HD' },
];

// Кеш «что играет»: id -> { title, artist, track, updatedAt }
const cache = new Map();
STATIONS.forEach(s => cache.set(s.id, { title: '', artist: '', track: '', cover: '', updatedAt: 0 }));

const parseStreamTitle = raw => {
  if (!raw) return { artist: '', track: '' };
  // Формат обычно "Artist - Title" / "Artist — Title" или просто "Title"
  const clean = raw.replace(/\s*-\s*Radio.*$/i, '').trim();
  const sep = clean.indexOf(' — ') !== -1 ? clean.indexOf(' — ') : clean.indexOf(' - ');
  if (sep === -1) return { artist: '', track: clean };
  return {
    artist: clean.slice(0, sep).trim(),
    track: clean.slice(sep + 3).trim(),
  };
};

// Забирает ICY-метаданные (StreamTitle) одного потока.
const fetchNowPlaying = url =>
  new Promise(resolve => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(
      url,
      { headers: { 'Icy-MetaData': '1', 'User-Agent': 'radio-nowplaying' }, timeout: 8000 },
      res => {
        const metaint = parseInt(res.headers['icy-metaint'] || '0', 10);
        if (!metaint) {
          req.destroy();
          return resolve(null);
        }

        let audioBytes = 0;
        let state = 'audio';
        let metaTotal = 0;
        let metaBytes = 0;
        let metaChunks = [];
        let finished = false;

        const finish = raw => {
          if (finished) return;
          finished = true;
          req.destroy();
          if (!raw) return resolve(null);
          const m = /StreamTitle='([^']*)'/i.exec(raw);
          resolve(m ? m[1] : null);
        };

        res.on('data', chunk => {
          if (finished) return;
          let i = 0;
          while (i < chunk.length) {
            if (state === 'audio') {
              const need = metaint - audioBytes;
              const take = Math.min(need, chunk.length - i);
              audioBytes += take;
              i += take;
              if (audioBytes >= metaint) state = 'metaLen';
            } else if (state === 'metaLen') {
              const lenByte = chunk[i];
              i += 1;
              if (lenByte === 0) return finish(null);
              metaTotal = lenByte * 16;
              metaBytes = 0;
              metaChunks = [];
              state = 'meta';
            } else if (state === 'meta') {
              const need = metaTotal - metaBytes;
              const take = Math.min(need, chunk.length - i);
              metaChunks.push(chunk.slice(i, i + take));
              metaBytes += take;
              i += take;
              if (metaBytes >= metaTotal) {
                const raw = Buffer.concat(metaChunks).toString('utf8');
                return finish(raw);
              }
            }
          }
        });

        res.on('error', () => finish(null));
        res.on('end', () => finish(null));
      }
    );

    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
  });

// Забирает название трека через Icecast status-json.xsl (для серверов, что его отдают,
// например hostingradio.ru). Возвращает StreamTitle или null.
const fetchNowPlayingIcecast = url =>
  new Promise(resolve => {
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      return resolve(null);
    }

    const mount = parsed.pathname || '';
    const statusUrl = `${parsed.protocol}//${parsed.host}/status-json.xsl`;
    const lib = parsed.protocol === 'https:' ? https : http;

    const req = lib.get(
      statusUrl,
      { timeout: 8000, headers: { 'User-Agent': 'radio-nowplaying', Accept: 'application/json' } },
      res => {
        let buf = '';
        res.on('data', chunk => {
          buf += chunk;
          if (buf.length > 1000000) req.destroy();
        });
        res.on('end', () => {
          try {
            const json = JSON.parse(buf);
            const sources = json?.icestats?.source;
            const list = Array.isArray(sources) ? sources : sources ? [sources] : [];
            const hit = list.find(
              s => s && (s.mount === mount || (s.listenurl && s.listenurl.includes(mount)))
            );
            resolve(hit?.title || null);
          } catch {
            resolve(null);
          }
        });
        res.on('error', () => resolve(null));
      }
    );

    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
  });

// Карта станций -> slug на radiobells.com (там отдаётся история эфира,
// первый элемент .lasttrack_item = текущий трек).
const RADIOBELLS_SLUGS = {
  europaplus: 'europaplus',
  energy: 'nrj',
  radio7: 'radio7',
  'radio7-hi': 'radio7',
  'radio7-med': 'radio7',
  'radio7-low': 'radio7',
  recordrock: 'recordrock',
  maximum: 'maximum',
  dfm: 'dfm',
};

const decodeEntities = s =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(parseInt(n, 10)));

// Текущий трек через radiobells.com (для станций, где нет ICY/status-json).
const fetchNowPlayingRadiobells = slug =>
  new Promise(resolve => {
    const url = `https://www.radiobells.com/pop/${slug}/`;
    const req = https.get(
      url,
      { timeout: 9000, headers: { 'User-Agent': 'Mozilla/5.0' } },
      res => {
        let buf = '';
        res.on('data', chunk => {
          buf += chunk;
          if (buf.length > 2000000) req.destroy();
        });
        res.on('end', () => {
          try {
            const m = buf.match(
              /<div class="lasttrack">[\s\S]*?<p class="lasttrack_item">\s*<b>[^<]*<\/b>\s*<span>([^<]+)<\/span>/
            );
            if (!m) {
              console.log('[rb]', slug, '| status', res.statusCode, '| no-match len', buf.length);
              return resolve(null);
            }
            resolve(decodeEntities(m[1].trim()));
          } catch {
            resolve(null);
          }
        });
        res.on('error', () => resolve(null));
      }
    );
    req.on('error', e => {
      console.log('[rb]', slug, '| ERR', e.message);
      resolve(null);
    });
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
  });

// Живой ICY-лисенер: держит постоянное соединение со стримом и обновляет кэш
// сразу при каждом StreamTitle (обновление ровно в момент смены песни, задержка ~0).
// Для станций, которые реально отдают метаданные, это точнее опроса по расписанию.
//
// ВНИМАНИЕ: держать постоянное соединение для ВСЕХ станций нельзя — 17 параллельных
// стримов «душат» канал, и метаданные (особенно europaplus, чей сервер и так их
// отдаёт с задержкой) приходят слишком поздно. Поэтому live-ICY включаем только для
// ограниченного списка LIVE_ICY_IDS; остальные обслуживаются опросом (radiobells и т.п.).
const LIVE_ICY_IDS = new Set(['rock181', 'dfm', 'maximum', 'recordrock']);
const liveIcyIds = new Set();
const liveSockets = new Map(); // id -> req (чтобы не плодить дубли)

const startLiveIcy = station => {
  if (liveSockets.has(station.id)) return;
  const lib = station.url.startsWith('https') ? https : http;

  const connect = () => {
    const req = lib.get(
      station.url,
      { headers: { 'Icy-MetaData': '1', 'User-Agent': 'radio-nowplaying' } },
      res => {
        const metaInt = parseInt(res.headers['icy-metaint'] || '0', 10);
        if (!metaInt) {
          // поток не отдаёт ICY-метаданные — не держим соединение
          res.resume();
          liveSockets.delete(station.id);
          return;
        }

        let bytesRead = 0;
        let readingMeta = false;
        let metaLength = 0;
        let metaBuffer = Buffer.alloc(0);
        let gotTitle = false;

        // страховка: если за 30с ни одного нормального StreamTitle не пришло,
        // считаем, что поток шлёт пустые метаданные — закрываем, отдаём станцию опросу.
        const watchdog = setTimeout(() => {
          if (!gotTitle) {
            req.destroy();
            liveSockets.delete(station.id);
            liveIcyIds.delete(station.id);
          }
        }, 30000);

        res.on('data', chunk => {
          let offset = 0;
          while (offset < chunk.length) {
            if (!readingMeta) {
              const needed = metaInt - bytesRead;
              const take = Math.min(needed, chunk.length - offset);
              bytesRead += take;
              offset += take;
              if (bytesRead === metaInt) {
                readingMeta = true;
                bytesRead = 0;
              }
            } else {
              if (metaLength === 0) {
                metaLength = chunk[offset] * 16;
                offset += 1;
                if (metaLength === 0) {
                  readingMeta = false;
                  continue;
                }
              }
              const needed = metaLength - metaBuffer.length;
              const take = Math.min(needed, chunk.length - offset);
              metaBuffer = Buffer.concat([metaBuffer, chunk.slice(offset, offset + take)]);
              offset += take;
              if (metaBuffer.length === metaLength) {
                const m = /StreamTitle='(.*?)';/.exec(metaBuffer.toString('utf8'));
                const raw = m && m[1] ? m[1].trim() : '';
                if (raw) {
                  gotTitle = true;
                  const { artist, track } = parseStreamTitle(raw);
                  cache.set(station.id, { title: raw, artist, track, updatedAt: Date.now() });
                  liveIcyIds.add(station.id);
                  console.log('[icy-live]', station.id, '|', JSON.stringify(raw));
                }
                readingMeta = false;
                metaLength = 0;
                metaBuffer = Buffer.alloc(0);
              }
            }
          }
        });

        res.on('error', () => {
          clearTimeout(watchdog);
          liveSockets.delete(station.id);
          liveIcyIds.delete(station.id);
          setTimeout(connect, 10000); // переподключаемся
        });
        req.on('error', () => {
          clearTimeout(watchdog);
          liveSockets.delete(station.id);
          liveIcyIds.delete(station.id);
          setTimeout(connect, 10000);
        });

        liveSockets.set(station.id, req);
      }
    );
    req.on('error', () => {
      liveSockets.delete(station.id);
      liveIcyIds.delete(station.id);
      setTimeout(connect, 10000);
    });
  };

  connect();
};

// Живой источник «что играет» через WebSocket сайта europaplus.ru (meta.hostingradio.ru).
// Это РЕАЛЬНО текущий трек (обновляется в момент старта песни, без отставания на трек,
// в отличие от ICY/radiobells, которые отдают название только что ЗАКОНЧИВШЕЙСЯ песни).
// Работает для станций EMG: europaplus и radio7 (их битрейт-варианты показывают то же).
const liveMetaIds = new Set(); // id станций, которые сейчас кормит WS
const WS_ID_TO_MYIDS = {
  europaplus: ['europaplus'],
  radio7: ['radio7', 'radio7-hi', 'radio7-med', 'radio7-low'],
};

const getWsImpl = () => {
  try {
    return require('ws');
  } catch {
    return typeof globalThis.WebSocket === 'function' ? globalThis.WebSocket : null;
  }
};

const startLiveMetaWs = () => {
  const WS = getWsImpl();
  if (!WS) {
    console.log('[meta-ws] WebSocket недоступен — пропускаем (будет radiobells/icy)');
    return;
  }
  const wsIds = Object.keys(WS_ID_TO_MYIDS);
  let ws;
  const connect = () => {
    try {
      ws = new WS('wss://meta.hostingradio.ru/emg/ws?format=native');
    } catch (e) {
      console.log('[meta-ws] ошибка подключения:', e.message);
      setTimeout(connect, 5000);
      return;
    }
    ws.onopen = () => {
      console.log('[meta-ws] открыт');
      ws.send(JSON.stringify({ fetch: { current: wsIds }, subscribe: { current: wsIds } }));
    };
    ws.onmessage = ev => {
      let c;
      try {
        c = JSON.parse(typeof ev.data === 'string' ? ev.data : ev.data.toString());
      } catch {
        return;
      }
      for (const k of Object.keys(c)) {
        if (k === 'error') continue;
        const myIds = WS_ID_TO_MYIDS[k];
        if (!myIds) continue;
        const cur = c[k] && c[k].current;
        if (!cur || !cur.title) continue;
        const raw = (cur.artist ? `${cur.artist} — ` : '') + cur.title;
        const { artist, track } = parseStreamTitle(raw);
        const cover = cur.coverImageUrl300 || cur.coverImageWebp300 || cur.coverImageWebpUrl300 || '';
        for (const id of myIds) {
          cache.set(id, { title: raw, artist, track, cover, updatedAt: Date.now() });
          liveMetaIds.add(id);
        }
        console.log('[meta-ws]', k, '|', JSON.stringify(raw));
      }
    };
    ws.onerror = e => console.log('[meta-ws] ошибка', e.message || '');
    ws.onclose = () => {
      console.log('[meta-ws] закрыт, переподключение через 3с');
      setTimeout(connect, 3000);
    };
  };
  connect();
};

const pollStation = async station => {
  // станции с живым источником (ICY-лисенер или WS) обновляются сами — опрос не трогаем,
  // иначе перезапишем свежие данные устаревшим radiobells/icy
  if (liveIcyIds.has(station.id) || liveMetaIds.has(station.id)) return;
  // 1) radiobells.com (история эфира, первый элемент — текущий трек)
  const rbSlug = RADIOBELLS_SLUGS[station.id];
  let raw = rbSlug ? await fetchNowPlayingRadiobells(rbSlug) : null;
  let source = raw ? 'radiobells' : null;
  // 2) Icecast status-json.xsl (hostingradio.ru)
  if (!raw) {
    const useIcecast = station.url.includes('hostingradio.ru');
    raw = useIcecast ? await fetchNowPlayingIcecast(station.url) : null;
    if (raw) source = 'status-json';
  }
  // 3) штатный ICY-парсинг
  if (!raw) {
    raw = await fetchNowPlaying(station.url);
    if (raw) source = 'icy';
  }

  const prev = cache.get(station.id);
  if (!raw) {
    console.log(
      '[nowplaying]',
      station.id,
      '| source: NONE (throttled/empty) -> keeping prev title:',
      JSON.stringify(prev.title)
    );
    cache.set(station.id, { ...prev, updatedAt: Date.now() });
    return;
  }
  const { artist, track } = parseStreamTitle(raw);
  console.log('[nowplaying]', station.id, '| source:', source, '| title:', JSON.stringify(raw));
  cache.set(station.id, {
    title: raw,
    artist,
    track,
    cover: '',
    updatedAt: Date.now(),
  });
};

let timer = null;

const startRadioPolling = (intervalMs = 20000) => {
  if (timer) clearInterval(timer);
  // первый опрос сразу (наполняем кэш начальными значениями)
  STATIONS.forEach(pollStation);
  timer = setInterval(() => {
    STATIONS.forEach(pollStation);
  }, intervalMs);
  // живые ICY-лисенеры: обновляют кэш в момент смены песни (без задержки опроса).
  // Только для станций из LIVE_ICY_IDS — чтобы не «душить» канал параллельными стримами.
  STATIONS.filter(s => LIVE_ICY_IDS.has(s.id)).forEach(startLiveIcy);
  // живой WebSocket (europaplus/radio7) — РЕАЛЬНО текущий трек без отставания на трек.
  startLiveMetaWs();
  return timer;
};

const getStationList = () => STATIONS.map(({ id, name }) => ({ id, name }));

const getNowPlaying = () =>
  STATIONS.map(({ id, name }) => ({
    id,
    name,
    ...cache.get(id),
  }));

const getNowPlayingById = id => {
  const station = STATIONS.find(s => s.id === id);
  if (!station) return null;
  return { id, name: station.name, ...cache.get(id) };
};

module.exports = {
  STATIONS,
  startRadioPolling,
  getStationList,
  getNowPlaying,
  getNowPlayingById,
  fetchNowPlayingIcecast,
  fetchNowPlayingRadiobells,
};
