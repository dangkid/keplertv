const axios = require('axios');
const cheerio = require('cheerio');

const BASE = 'https://pelisflix200.skin';
const HTTP_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': BASE + '/',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
};

async function test() {
  // Step 1: Search for a movie
  const searchUrl = `${BASE}/?s=Fight+Club`;
  console.log('Search URL:', searchUrl);
  try {
    const r = await axios.get(searchUrl, { timeout: 10000, headers: HTTP_HEADERS });
    const $ = cheerio.load(r.data);
    
    // Find movie links
    const links = [];
    $('article, .TPost, .item, .post, .movie-item, [class*="post"]').each((i, el) => {
      const link = $(el).find('a').first().attr('href');
      const title = $(el).find('.Title, h2, h3, .title, [class*="title"]').first().text().trim();
      if (link && link.includes('/pelicula/') && title) {
        links.push({ title, url: link.startsWith('http') ? link : BASE + link });
      }
    });
    
    console.log('Movie links found:', links.length);
    if (links.length > 0) {
      console.log('First result:', JSON.stringify(links[0], null, 2));
      
      // Step 2: Get the movie page
      const movieUrl = links[0].url;
      console.log('\nFetching movie page:', movieUrl);
      
      const r2 = await axios.get(movieUrl, { timeout: 10000, headers: HTTP_HEADERS });
      const $2 = cheerio.load(r2.data);
      
      // Find data-url attributes (base64 encoded)
      console.log('\n=== data-url entries ===');
      $2('[data-url]').each((i, el) => {
        const encoded = $2(el).attr('data-url');
        if (encoded) {
          try {
            const decoded = Buffer.from(encoded, 'base64').toString('utf8');
            console.log(i + ':', decoded);
          } catch(e) {
            console.log(i + ': invalid base64');
          }
        }
      });
      
      // Find iframes
      console.log('\n=== iframes ===');
      $2('iframe').each((i, el) => {
        const src = $2(el).attr('src');
        if (src) console.log(i + ':', src);
      });
      
      // Find links with nupload
      console.log('\n=== nupload links ===');
      $2('a[href*="nupload"]').each((i, el) => {
        const href = $2(el).attr('href');
        if (href) console.log(i + ':', href);
      });
    }
  } catch(e) {
    console.log('Error:', e.message);
    if (e.response) {
      console.log('Status:', e.response.status);
      console.log('Data:', typeof e.response.data === 'string' ? e.response.data.substring(0, 500) : 'binary');
    }
  }
}
test();
