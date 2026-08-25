const https = require('https');
const http = require('http');

// Список станций (синхронизирован с фронтом radioData).
// id используется для сопоставления с клиентом.
const STATIONS = [
  { id: 'rock181', name: 'Rock 181', url: 'https://listen.181fm.com/181-rock_128k.mp3' },
  { id: 'spdeep', name: 'SOUNDPARK DEEP', url: 'https://getradio.me/spdeep' },
  { id: 'spdeep-hi', name: 'SOUNDPARK DEEP (hi)', url: 'https://stream05.pcradio.ru/sp_deep-hi' },
  { id: 'spdeep-med', name: 'SOUNDPARK DEEP (med)', url: 'https://stream.pcradio.ru/sp_deep-med' },
  { id: 'spdeep-low', name: 'SOUNDPARK DEEP (low)', url: 'https://stream.pcradio.ru/sp_deep-low' },
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
STATIONS.forEach(s => cache.set(s.id, { title: '', artist: '', track: '', updatedAt: 0 }));

const parseStreamTitle = raw => {
  if (!raw) return { artist: '', track: '' };
  // Формат обычно "Artist - Title" или "Title"
  const clean = raw.replace(/\s*-\s*Radio.*$/i, '').trim();
  const sep = clean.indexOf(' - ');
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

const pollStation = async station => {
  const raw = await fetchNowPlaying(station.url);
  const prev = cache.get(station.id);
  if (!raw) {
    // оставляем предыдущее значение, но обновляем время опроса
    cache.set(station.id, { ...prev, updatedAt: Date.now() });
    return;
  }
  const { artist, track } = parseStreamTitle(raw);
  cache.set(station.id, {
    title: raw,
    artist,
    track,
    updatedAt: Date.now(),
  });
};

let timer = null;

const startRadioPolling = (intervalMs = 20000) => {
  if (timer) clearInterval(timer);
  // первый опрос сразу
  STATIONS.forEach(pollStation);
  timer = setInterval(() => {
    STATIONS.forEach(pollStation);
  }, intervalMs);
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
};
