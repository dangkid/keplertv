require('dotenv').config();

// ===== CUSTOM DNS RESOLVER (Cloudflare 1.1.1.1) =====
// El ISP en España bloquea sitios como futbol-libre.su mediante
// DNS poisoning (resuelve a 127.0.0.1). Sobrescribimos dns.lookup
// para usar Cloudflare DNS y resolver correctamente las IPs reales.
const dns = require('dns');
// Set custom DNS servers for the dns module
dns.setServers(['1.1.1.1', '1.0.0.1']);
const dnsPromises = dns.promises;
const origLookup = dns.lookup;
// Override dns.lookup to use custom DNS servers (affects http/https modules)
dns.lookup = (hostname, options, callback) => {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  dnsPromises.resolve4(hostname).then(addrs => {
    const addr = addrs[0];
    if (typeof options === 'number') {
      callback(null, addr, options);
    } else if (options.all) {
      callback(null, addrs.map(a => ({ address: a, family: 4 })));
    } else {
      callback(null, addr, 4);
    }
  }).catch(err => {
    // Fallback to original lookup on error
    origLookup(hostname, options, callback);
  });
};

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));

// ===== RUTAS MODULARES =====
const moviesRouter = require('./routes/movies');
const seriesRouter = require('./routes/series');
const tvRouter = require('./routes/tv');
const searchRouter = require('./routes/search');
const streamRouter = require('./routes/stream');
const sportsRouter = require('./routes/sports');
const animeRouter = require('./routes/anime');
const ofutbolRouter = require('./routes/ofutbol');

app.use('/api/movies', moviesRouter);
app.use('/api/series', seriesRouter);
app.use('/api/tv', tvRouter);
app.use('/api/search', searchRouter);
app.use('/api/stream', streamRouter);
app.use('/api/sports', sportsRouter);
app.use('/api/anime', animeRouter);
app.use('/api/ofutbol', ofutbolRouter);

// ===== RUTA: DISCOVER (legacy compatibility) =====
const { discoverByGenre, discoverByProvider } = require('./services/tmdb');

app.get('/api/discover/genre/:genreId', async (req, res) => {
  const { genreId } = req.params;
  const type = req.query.type || 'movie';
  try {
    const data = await discoverByGenre(genreId, type, req.query.page || 1);
    res.json({ success: true, data });
  } catch (e) {
    res.json({ success: true, data: [] });
  }
});

app.get('/api/discover/provider/:providerId', async (req, res) => {
  const { providerId } = req.params;
  const type = req.query.type || 'movie';
  try {
    const data = await discoverByProvider(providerId, type);
    res.json({ success: true, data });
  } catch (e) {
    res.json({ success: true, data: [] });
  }
});

// ===== PROXY DE STREAMS (ELIMINA CORS) =====

app.get('/api/stream-proxy', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send('url param required');

  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Referer': url
      },
      maxRedirects: 5
    });

    const ct = response.headers['content-type'] || '';

    // Siempre enviar CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.set('Access-Control-Allow-Headers', '*');

    // Detectar si es un M3U8 playlist (texto)
    const isPlaylist = ct.includes('mpegurl') || ct.includes('m3u') ||
      url.endsWith('.m3u8') || url.endsWith('.m3u');

    if (isPlaylist) {
      let content = Buffer.from(response.data).toString('utf8');
      const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);

      // Reescribir URIs en atributos (como EXT-X-KEY URI="...")
      content = content.replace(/URI="([^"]+)"/g, (match, uri) => {
        const abs = uri.startsWith('http') ? uri : baseUrl + uri;
        return `URI="/api/stream-proxy?url=${encodeURIComponent(abs)}"`;
      });

      // Reescribir líneas de URL (no comentarios, no vacías)
      content = content.split('\n').map(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return line;
        const abs = trimmed.startsWith('http') ? trimmed : baseUrl + trimmed;
        return `/api/stream-proxy?url=${encodeURIComponent(abs)}`;
      }).join('\n');

      res.set('Content-Type', 'application/vnd.apple.mpegurl');
      res.send(content);
    } else {
      // Contenido binario (segmentos .ts, claves, etc.)
      res.set('Content-Type', ct || 'application/octet-stream');
      if (response.headers['content-length']) {
        res.set('Content-Length', response.headers['content-length']);
      }
      res.send(Buffer.from(response.data));
    }
  } catch (e) {
    console.warn('Proxy error:', url, e.message);
    res.status(502).json({ error: 'Error de proxy: ' + e.message });
  }
});

// CORS preflight
app.options('/api/stream-proxy', (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', '*');
  res.sendStatus(204);
});

// ===== ENDPOINT: EXTRAER URL HLS DE CANAL DEPORTIVO =====
// Scrapea futbol-libre.su → obtiene iframe de latamvidz1.com →
// extrae la URL M3U8 del HTML del player → la devuelve como JSON
// para que el frontend la reproduzca con hls.js nativo.
const cheerio = require('cheerio');

app.get('/api/channel-player', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'url param required' });
  if (!url.includes('futbol-libre.su')) return res.status(400).json({ error: 'Only futbol-libre.su URLs allowed' });

  try {
    // Paso 1: Scrapear futbol-libre.su para obtener la URL del iframe
    const pageResponse = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
      }
    });

    const $ = cheerio.load(pageResponse.data);

    // Extraer el iframe del reproductor (el que apunta a latamvidz1.com)
    let iframeSrc = '';
    $('iframe').each((i, el) => {
      const src = $(el).attr('src') || '';
      if (src.includes('latamvidz1.com') || src.includes('canal.php')) {
        iframeSrc = src;
      }
    });

    if (!iframeSrc) {
      return res.status(404).json({ error: 'No se encontró el reproductor en la página' });
    }

    // Paso 2: Hacer proxy del contenido de latamvidz1.com (con Referer correcto)
    const proxyResponse = await axios.get(iframeSrc, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://futbol-libre.su/',
        'Origin': 'https://futbol-libre.su',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
      },
      responseType: 'text'
    });

    const playerHtml = proxyResponse.data;

    // Paso 3: Extraer la URL M3U8 del HTML del player
    let m3u8Url = '';

    // Buscar playbackURL = "..." (formato Clappr)
    const pbMatch = playerHtml.match(/playbackURL\s*=\s*["']([^"']+\.m3u8[^"']*)["']/);
    if (pbMatch) m3u8Url = pbMatch[1];

    // Si no, buscar source: "..." en config de Clappr
    if (!m3u8Url) {
      const srcMatch = playerHtml.match(/source:\s*["']([^"']+\.m3u8[^"']*)["']/);
      if (srcMatch) m3u8Url = srcMatch[1];
    }

    // Si no, buscar cualquier URL .m3u8 en el HTML
    if (!m3u8Url) {
      const anyMatch = playerHtml.match(/https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/);
      if (anyMatch) m3u8Url = anyMatch[0];
    }

    if (!m3u8Url) {
      return res.status(404).json({ error: 'No se pudo extraer la URL del stream' });
    }

    // Si la URL ya fue reescrita por el proxy anterior, extraer la original
    if (m3u8Url.includes('/api/stream-proxy')) {
      const origMatch = m3u8Url.match(/url=([^&]+)/);
      if (origMatch) m3u8Url = decodeURIComponent(origMatch[1]);
    }

    // Devolver la URL M3U8 para que el frontend la reproduzca con hls.js
    const channelName = url.split('/').filter(Boolean).pop() || 'Canal';
    res.json({
      success: true,
      channel: channelName,
      url: `/api/stream-proxy?url=${encodeURIComponent(m3u8Url)}`,
      isHls: true
    });
  } catch (e) {
    console.error('Error en channel-player:', e.message);
    res.status(502).json({ error: 'Error al obtener el stream: ' + e.message });
  }
});

// ===== ENDPOINT: PROXY GENÉRICO PARA EMBEDS =====
// Sirve contenido de servidores de streaming a través del backend
// para evitar bloqueos regionales (Cloudflare, etc.).
//
// Funciona con: nupload.me (HTTP 200 desde backend)
// No funciona con: supervideo.cc, mixdrop.ag, dood.to (HTTP 403 Cloudflare)
//
// Para los que no funcionan, se devuelve una página que intenta
// cargar el embed directamente (puede funcionar en algunos navegadores)
// o muestra un mensaje para abrir en nueva pestaña.
app.get('/api/embed-proxy', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send('url param required');

  const hostname = new URL(url).hostname;

  // Para dominios bloqueados por Cloudflare (supervideo, mixdrop, dood),
  // devolver una página que carga el iframe directamente o muestra fallback
  const BLOCKED_DOMAINS = ['supervideo.cc', 'mixdrop.ag', 'dood.to', 'doodstream.com', 'waaw.tv'];
  if (BLOCKED_DOMAINS.some(d => hostname.includes(d))) {
    return res.send(`<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { margin:0; padding:0; background:#000; overflow:hidden; display:flex; align-items:center; justify-content:center; height:100vh; font-family:sans-serif; }
  .fallback { text-align:center; color:#999; padding:20px; }
  .fallback h3 { color:#fff; margin-bottom:8px; }
  .fallback a { display:inline-block; margin-top:12px; padding:10px 24px; background:#6c5ce7; color:#fff; text-decoration:none; border-radius:6px; font-weight:600; }
  iframe { width:100%; height:100%; border:none; }
</style></head><body>
<iframe src="${url.replace(/"/g, '"')}" allowfullscreen allow="autoplay; encrypted-media" sandbox="allow-scripts allow-same-origin allow-forms allow-popups"></iframe>
<div class="fallback" style="position:absolute;bottom:10px;right:10px;background:rgba(0,0,0,.8);border-radius:8px;padding:8px 12px;font-size:12px">
  <a href="${url.replace(/"/g, '"')}" target="_blank" style="color:#6c5ce7;background:none;padding:0;margin:0">Abrir en nueva pestaña ↗</a>
</div>
</body></html>`);
  }

  try {
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Referer': new URL(url).origin + '/'
      },
      responseType: 'arraybuffer',
      maxRedirects: 5
    });

    const ct = response.headers['content-type'] || 'text/html';
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.set('Access-Control-Allow-Headers', '*');

    // Si es HTML, reescribir URLs para que pasen por el proxy
    if (ct.includes('text/html') || ct.includes('text/plain')) {
      let content = Buffer.from(response.data).toString('utf8');
      const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
      const originUrl = new URL(url).origin;

      // Reescribir src de iframes a URLs absolutas
      content = content.replace(/src=["']((?!https?:\/\/|data:|javascript:|#|\.js)[^"']+)["']/gi, (match, src) => {
        const abs = src.startsWith('http') ? src : (src.startsWith('//') ? 'https:' + src : baseUrl + src);
        return `src="${abs}"`;
      });

      // Reescribir href de CSS/recursos a URLs absolutas
      content = content.replace(/href=["']((?!https?:\/\/|data:|javascript:|#|mailto:)[^"']+)["']/gi, (match, href) => {
        if (href.endsWith('.css') || href.endsWith('.js') || href.includes('font')) {
          const abs = href.startsWith('http') ? href : (href.startsWith('//') ? 'https:' + href : baseUrl + href);
          return `href="${abs}"`;
        }
        return match;
      });

      // Asegurar que los scripts y recursos con rutas relativas se carguen con URLs absolutas
      content = content.replace(/(src|href)=["']\/(?!\/)[^"']*["']/gi, (match) => {
        return match.replace(/^\/(?!\/)/, originUrl + '/');
      });

      // === ELIMINAR TODO TIPO DE ANUNCIOS ===
      // Eliminar scripts de anuncios por src
      content = content.replace(/<script[^>]*src=["'][^"']*(?:doubleclick|googlead|googlesyndication|popads|adsterra|cpmstar|exoclick|acscdn|wpadmngr|admanager|vpb\.apptopia|ads\.js|banner)[^"']*["'][^>]*(?:><\/script>|\/?>)/gi, '');

      // Eliminar inline scripts maliciosos
      content = content.replace(/<script[^>]*>[\s\S]*?(?:window\.open|adsbygoogle|_gaq|analytics|adroll|ads\.js|popup|banner|aclibrunPop|interhs|onepopon|clickaab)[\s\S]*?<\/script>/gi, '');

      // Eliminar divs/iframes publicitarios
      content = content.replace(/<(?:div|span|iframe)[^>]*(?:id|class)=["'][^"']*(?:ads?|banner|advert|popup|modal|float|overlay|sticky|google|doubleclick|kahs|onepopon|adcla)[^"']*["'][^>]*>[\s\S]*?<\/(?:div|span|iframe)>/gi, '');

      // Eliminar noscript (fallback de anuncios)
      content = content.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '');

      // Inyectar meta viewport y estilos básicos para iframe
      content = content.replace('</head>', `
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body { margin: 0; padding: 0; background: #000; overflow: hidden; }
      video { width: 100% !important; height: 100% !important; }
      iframe { width: 100% !important; height: 100% !important; border: none; }
      * { max-width: 100vw; }
    </style>
    </head>`);

      res.set('Content-Type', 'text/html; charset=utf-8');
      res.set('X-Frame-Options', '');
      res.set('Content-Security-Policy', "frame-ancestors *");
      res.send(content);
    } else {
      // Contenido binario (JS, CSS, imágenes, etc.)
      res.set('Content-Type', ct);
      res.send(Buffer.from(response.data));
    }
  } catch (e) {
    console.warn('Embed proxy error:', url, e.message);
    // Si falla el proxy, intentar cargar el iframe directamente como fallback
    res.send(`<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { margin:0; padding:0; background:#000; overflow:hidden; display:flex; align-items:center; justify-content:center; height:100vh; font-family:sans-serif; }
  .fallback { text-align:center; color:#999; padding:20px; }
  .fallback h3 { color:#fff; margin-bottom:8px; }
  .fallback .error { color:#e74c3c; font-size:13px; margin-bottom:12px; }
  .fallback a { display:inline-block; margin-top:8px; padding:10px 24px; background:#6c5ce7; color:#fff; text-decoration:none; border-radius:6px; font-weight:600; }
</style></head><body>
<div class="fallback">
  <h3>Error al cargar el reproductor</h3>
  <div class="error">${e.message}</div>
  <a href="${url.replace(/"/g, '"')}" target="_blank">Abrir en nueva pestaña ↗</a>
</div>
</body></html>`);
  }
});

// CORS preflight for embed proxy
app.options('/api/embed-proxy', (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', '*');
  res.sendStatus(204);
});

// ===== ENDPOINT: NUUPLOAD CLEAN PROXY (strips ads & anti-devtools) =====
// Fetches nupload.me /watch/ pages from the backend, strips all ads,
// anti-devtools scripts, overlay divs, and serves a clean page with
// just JWPlayer + the obfuscated URL decoder + player setup.
// This allows the video to play in an iframe because JWPlayer runs
// on nupload.me's origin, which is whitelisted by ibra.lat CDN.
app.get('/api/nupload-clean', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ success: false, error: 'url param required' });

  try {
    const hostname = new URL(url).hostname;
    if (!hostname.includes('nupload.me')) {
      return res.status(400).json({ success: false, error: 'Only nupload.me URLs allowed' });
    }

    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://pelisflix200.skin/',
        'Origin': 'https://pelisflix200.skin',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
      },
      maxRedirects: 5,
      responseType: 'arraybuffer'
    });

    let html = typeof response.data === 'string' ? response.data : Buffer.from(response.data).toString('utf8');

    // === STRIP ALL AD SCRIPTS ===
    // Remove aclib popup script
    html = html.replace(/<script[^>]*src=["'][^"']*acscdn\.com[^"']*["'][^>]*><\/script>/gi, '');
    html = html.replace(/<script[^>]*src=["'][^"']*aclib\.js[^"']*["'][^>]*><\/script>/gi, '');
    html = html.replace(/aclib\.runPop[^;]*;/gi, '');

    // Remove adManager.js
    html = html.replace(/<script[^>]*src=["'][^"']*wpadmngr\.com[^"']*["'][^>]*><\/script>/gi, '');
    html = html.replace(/<script[^>]*src=["'][^"']*adManager\.js[^"']*["'][^>]*><\/script>/gi, '');

    // Remove any script block containing ad-related variables
    html = html.replace(/<script[^>]*>[\s\S]*?(?:interhs\s*=|onepopon\s*=|clickaab\s*=|nextaddsg|removecl|aclibrunPop)[\s\S]*?<\/script>/gi, '');

    // Remove overlay divs with high z-index
    html = html.replace(/<div[^>]*style=["'][^"']*(?:z-index\s*:\s*(?:9\d{2}|[1-9]\d{2,})|position\s*:\s*absolute[^"']*z-index\s*:\s*\d+)[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '');

    // Remove elements with ad-related classes
    html = html.replace(/<div[^>]*class=["'][^"']*onepopon[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '');
    html = html.replace(/<div[^>]*class=["'][^"']*adcla[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '');

    // Remove #kahs overlay div
    html = html.replace(/#kahs\s*\{[^}]*\}/gi, '');
    html = html.replace(/<div[^>]*id=["']kahs["'][^>]*>[\s\S]*?<\/div>/gi, '');

    // Remove anti-devtools: function check() { ... debugger ... } check()
    html = html.replace(/function\s+check\s*\(\s*\)\s*\{[^}]*debugger[^}]*\}\s*check\s*\(\s*\)\s*;?/gi, '');

    // Remove keyboard shortcut blocking (keydown listener)
    html = html.replace(/document\s*\[\s*(['"])addEventListener\1\s*\]\s*\(\s*(['"])keydown\2\s*,/gi, '// removed keydown: document.addEventListener("keydown",');

    // Remove contextmenu prevention
    html = html.replace(/document\s*\[\s*(['"])addEventListener\1\s*\]\s*\(\s*(['"])contextmenu\2\s*,/gi, '// removed contextmenu: document.addEventListener("contextmenu",');

    // Remove the setInterval that adds overlay divs
    html = html.replace(/interhs\s*=\s*setInterval\s*\([\s\S]*?clearInterval\s*\(\s*interhs\s*\)\s*;?\s*\}?\s*;?/gi, '// removed overlay interval');

    // Remove the setTimeout that calls nextaddsg and removecl
    html = html.replace(/setTimeout\s*\(\s*\(\s*\)\s*=>\s*\{[\s\S]*?nextaddsg\s*\(\s*\)\s*;?\s*removecl\s*\(\s*\)\s*;?\s*\}?\s*,\s*["']?\d+["']?\s*\)\s*;?/gi, '// removed ad timeout');

    // Remove any window.open() calls
    html = html.replace(/window\.open\s*\([^)]*\)/gi, '');

    // Remove all script tags with src attributes (except video players)
    html = html.replace(/<script[^>]*src=["'][^"']*(?:ad|pop|doubleclick|analytics|track|banner|googlead|syndication)[^"']*["'][^>]*><\/script>/gi, '');

    // Remove inline event handlers with suspicious code
    html = html.replace(/on(?:click|load|mouse\w+)=["'][^"']*(?:window\.open|popup|ad|banner|track)[^"']*["']/gi, '');

    // Inject minimal CSS to ensure clean full-screen video
    html = html.replace('</head>', `
    <style>
      body { margin:0; padding:0; background:#000; overflow:hidden; height:100vh; width:100vw; }
      #player { position:absolute; top:0; left:0; width:100% !important; height:100% !important; overflow:hidden; background:#000; }
      video { width:100% !important; height:100% !important; object-fit:contain; }
      iframe { width:100% !important; height:100% !important; border:none; }
      #kahs, .onepopon, .adcla, [style*="z-index:99"], [style*="z-index: 99"],
      [style*="z-index:100"], [style*="z-index: 100"],
      [style*="z-index:999"], [style*="z-index: 999"] { display:none !important; }
    </style>
    </head>`);

    // Set headers to allow iframe embedding
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.set('Access-Control-Allow-Origin', '*');
    res.set('X-Frame-Options', '');
    res.set('Content-Security-Policy', "frame-ancestors *");
    res.send(html);

  } catch (e) {
    console.warn('[NuploadClean] Error:', url, e.message);
    // Fallback: return a page that tries to load the original URL directly
    res.send(`<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { margin:0; padding:0; background:#000; overflow:hidden; display:flex; align-items:center; justify-content:center; height:100vh; font-family:sans-serif; }
  .fallback { text-align:center; color:#999; padding:20px; }
  .fallback h3 { color:#fff; margin-bottom:8px; }
  .fallback .error { color:#e74c3c; font-size:13px; margin-bottom:12px; }
  .fallback a { display:inline-block; margin-top:8px; padding:10px 24px; background:#6c5ce7; color:#fff; text-decoration:none; border-radius:6px; font-weight:600; }
</style></head><body>
<div class="fallback">
  <h3>Error al cargar el reproductor</h3>
  <div class="error">${e.message}</div>
  <a href="${url.replace(/"/g, '"')}" target="_blank">Abrir en nueva pestaña ↗</a>
</div>
</body></html>`);
  }
});

// CORS preflight for nupload-clean
app.options('/api/nupload-clean', (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', '*');
  res.sendStatus(204);
});

// ===== ENDPOINT: RESOLVER VIDEO (extrae URL HLS de páginas embed) =====
// Toma una URL de nupload.me, fetchea la página desde el backend,
// extrae la URL HLS del array ofuscado en Base64, y la devuelve como JSON.
// El frontend puede reproducir la URL con hls.js.
app.get('/api/resolve-video', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ success: false, error: 'url param required' });

  const hostname = new URL(url).hostname;

  try {
    // Solo procesamos nupload.me por ahora
    if (hostname.includes('nupload.me')) {
      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://pelisflix200.skin/',
          'Origin': 'https://pelisflix200.skin',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
        },
        maxRedirects: 5
      });

      const html = typeof response.data === 'string' ? response.data : Buffer.from(response.data).toString('utf8');

      // Buscar el array de strings Base64: var XXXX = ["base64...","base64...",...]
      const arrayMatch = html.match(/var\s+([A-Za-z]\w*)\s*=\s*\[\s*"([A-Za-z0-9+/=]+)"/);
      if (!arrayMatch) {
        return res.status(502).json({ success: false, error: 'No se encontró el array de video en la página' });
      }

      const varName = arrayMatch[1];

      // Extraer el array completo
      const arrayRegex = new RegExp('var\\s+' + varName + '\\s*=\\s*\\[([^\\]]+)\\]');
      const fullArrayMatch = html.match(arrayRegex);
      if (!fullArrayMatch) {
        return res.status(502).json({ success: false, error: 'No se pudo extraer el array de video' });
      }

      const items = fullArrayMatch[1].match(/"([^"]+)"/g);
      if (!items || items.length === 0) {
        return res.status(502).json({ success: false, error: 'Array de video vacío' });
      }

      // Extraer el número de substracción del forEach
      const forEachBody = html.match(new RegExp(varName + '\\.forEach\\(function\\s+\\w+\\s*\\(\\w+\\)\\s*\\{[^}]+\\}'));
      let subtractNum = 0;
      if (forEachBody) {
        const numMatch = forEachBody[0].match(/(\d{6,8})/);
        if (numMatch) subtractNum = parseInt(numMatch[1]);
      }

      if (subtractNum === 0) {
        return res.status(502).json({ success: false, error: 'No se encontró el número de decodificación' });
      }

      // Extraer sesz
      const seszMatch = html.match(/var\s+sesz\s*=\s*"([^"]+)"/);
      if (!seszMatch) {
        return res.status(502).json({ success: false, error: 'No se encontró el parámetro de sesión' });
      }
      const sesz = seszMatch[1];

      // Decodificar la URL
      let decodedUrl = '';
      items.forEach(item => {
        const b64 = item.replace(/"/g, '');
        const decodedStr = Buffer.from(b64, 'base64').toString('utf8');
        const num = parseInt(decodedStr.replace(/\D/g, ''));
        const charCode = num - subtractNum;
        decodedUrl += String.fromCharCode(charCode);
      });

      const videoUrl = decodedUrl + '?s=' + sesz;

      console.log(`[ResolveVideo] ${url} -> ${videoUrl.substring(0, 80)}...`);

      return res.json({
        success: true,
        url: videoUrl,
        type: 'hls',
        referer: 'https://nupload.me/'
      });
    }

    // Si no es un dominio conocido, devolver error
    return res.status(400).json({ success: false, error: 'Dominio no soportado: ' + hostname });

  } catch (e) {
    console.warn('[ResolveVideo] Error:', url, e.message);
    return res.status(502).json({ success: false, error: 'Error al resolver video: ' + e.message });
  }
});

// CORS preflight for resolve-video
app.options('/api/resolve-video', (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', '*');
  res.sendStatus(204);
});

// ===== ENDPOINT: VERIFICAR DISPONIBILIDAD DE STREAM =====
// Hace un HEAD request (o GET de 1 byte) para ver si el stream responde.
// Usado por el frontend para mostrar indicadores de estado en canales.
app.get('/api/check-stream', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.json({ alive: false });
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return res.json({ alive: false });
  }

  res.set('Access-Control-Allow-Origin', '*');

  try {
    const response = await axios.head(url, {
      timeout: 6000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': '*/*'
      },
      maxRedirects: 3,
      validateStatus: s => s < 500
    });
    return res.json({ alive: response.status >= 200 && response.status < 400 });
  } catch {
    // HEAD failed — try GET with small range
    try {
      const response = await axios.get(url, {
        timeout: 6000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Range': 'bytes=0-1023'
        },
        responseType: 'stream',
        maxRedirects: 3,
        validateStatus: s => s < 500
      });
      response.data.destroy();
      return res.json({ alive: response.status >= 200 && response.status < 400 });
    } catch {
      return res.json({ alive: false });
    }
  }
});

app.options('/api/check-stream', (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', '*');
  res.sendStatus(204);
});

// ===== SERVIR ESTÁTICOS =====

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Ruta no encontrada' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 KeplerTV API en http://localhost:${PORT}`);
  console.log(`📡 TMDB API Key: ${process.env.TMDB_API_KEY ? '✅ Configurada' : '❌ No configurada'}`);
});
