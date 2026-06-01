// ============ EJEMPLOS DE WEB SCRAPING ============
// Este archivo muestra cómo hacer web scraping con Cheerio

const axios = require('axios');
const cheerio = require('cheerio');

// ========== EJEMPLO 1: Raspar IMDb ==========
// NOTA: Verifica los ToS de IMDb antes de usar en producción

async function scrapeMoviesFromIMDB() {
  try {
    // Obtener el HTML de una página
    const response = await axios.get('https://www.imdb.com/chart/top250/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const movies = [];

    // Seleccionar cada elemento de película
    $('.titleColumn a').each((index, element) => {
      if (index < 10) { // Limitar a 10
        const title = $(element).text();
        const url = 'https://imdb.com' + $(element).attr('href');
        
        movies.push({ title, url });
      }
    });

    return movies;
  } catch (error) {
    console.error('Error scraping IMDb:', error.message);
    throw error;
  }
}

// ========== EJEMPLO 2: Raspar Rotten Tomatoes ==========

async function scrapeRottenTomatoes() {
  try {
    const response = await axios.get('https://www.rottentomatoes.com/browse/movies_at_home', {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    const $ = cheerio.load(response.data);
    const movies = [];

    // Buscar elemento que contenga películas
    $('.moviePosterContainer').each((index, element) => {
      const title = $(element).find('.p--small').text();
      const rating = $(element).find('.mop-ratings-wrap__percentage').text();

      movies.push({ title, rating });
    });

    return movies;
  } catch (error) {
    console.error('Error scraping Rotten Tomatoes:', error.message);
    throw error;
  }
}

// ========== EJEMPLO 3: Raspar Netflix (Más difícil - requiere Selenium) ==========
// Netflix usa JavaScript para renderizar contenido, por lo que cheerio no funciona
// Necesitarías Selenium o Puppeteer

async function scrapeNetflixWithPuppeteer() {
  // Esto requiere: npm install puppeteer
  const puppeteer = require('puppeteer');

  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Navegar a Netflix (requiere estar logeado)
    await page.goto('https://www.netflix.com');
    
    // Esperar que cargue el contenido
    await page.waitForSelector('.title-card');
    
    // Extraer películas
    const movies = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.title-card')).map(el => ({
        title: el.textContent,
        url: el.href
      }));
    });

    await browser.close();
    return movies;
  } catch (error) {
    console.error('Error scraping Netflix:', error.message);
    throw error;
  }
}

// ========== EJEMPLO 4: Raspar Información de TV (Simple HTML) ==========

async function scrapeTVChannels() {
  try {
    const response = await axios.get('https://ejemplo-tv.com/channels');
    const $ = cheerio.load(response.data);
    const channels = [];

    $('div.channel').each((index, element) => {
      const name = $(element).find('.channel-name').text().trim();
      const logo = $(element).find('img').attr('src');
      const category = $(element).find('.category').text().trim();

      channels.push({
        id: index + 1,
        name,
        logo,
        category
      });
    });

    return channels;
  } catch (error) {
    console.error('Error scraping channels:', error.message);
    throw error;
  }
}

// ========== EJEMPLO 5: Raspar con Manejo de Errores y Retry ==========

async function scrapeWithRetry(url, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      });

      const $ = cheerio.load(response.data);
      return $;
    } catch (error) {
      console.warn(`Intento ${attempt} falló:`, error.message);
      
      if (attempt === maxRetries) {
        throw new Error(`Falló después de ${maxRetries} intentos`);
      }
      
      // Esperar antes de reintentar (backoff exponencial)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

// ========== CÓMO USAR EN EL SERVIDOR EXPRESS ==========

/*
// Agregar a server.js:

app.get('/api/scraped-movies', async (req, res) => {
  try {
    const movies = await scrapeMoviesFromIMDB();
    res.json({
      success: true,
      data: movies
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
*/

// ========== COMPARACIÓN: API vs WEB SCRAPING ==========

/*
┌─────────────────┬────────────────────────┬──────────────────────────┐
│ Característica  │ API (TMDB)             │ Web Scraping (Cheerio)    │
├─────────────────┼────────────────────────┼──────────────────────────┤
│ Legalidad       │ ✅ Legal (con ToS)     │ ⚠️ Depende del sitio      │
│ Velocidad       │ ✅ Rápida              │ ❌ Lenta                  │
│ Confiabilidad   │ ✅ Estable             │ ❌ Frágil                 │
│ Estructura      │ ✅ JSON limpio         │ ⚠️ HTML desordenado       │
│ Autenticación   │ ⚠️ Key necesaria       │ ✅ A veces ninguna        │
│ Rate Limit      │ ⚠️ Sí                  │ ❌ Fácil banear IP        │
│ Mantenimiento   │ ✅ No requiere         │ ❌ Requiere cambios       │
└─────────────────┴────────────────────────┴──────────────────────────┘
*/

// ========== MEJORES PRÁCTICAS ==========

/*
1. SIEMPRE respetar los ToS del sitio
2. Usar User-Agent realista
3. Implementar backoff exponencial
4. Cachear resultados (no raspar cada vez)
5. Usar try-catch y manejo de errores
6. Limitar request rate
7. Detectar cambios en estructura HTML
8. Considerar usar APIs primero

EJEMPLOS DE BUENAS PRÁCTICAS:

✅ Bien:
const $ = await scrapeWithRetry(url);
// Cachear resultado
cache.set(cacheKey, data, 3600); // 1 hora

❌ Mal:
for (let i = 0; i < 1000; i++) {
  await axios.get(url); // Spam de requests!
}
*/

module.exports = {
  scrapeMoviesFromIMDB,
  scrapeRottenTomatoes,
  scrapeTVChannels,
  scrapeWithRetry
};
