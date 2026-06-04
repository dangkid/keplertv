# Plan Integral: Arreglar Todos los Problemas Reportados

## Resumen de Problemas

Basado en el feedback del usuario después de probar la aplicación:

1. **Películas/Series rotas**: "SANDBOX EMBED NOT ALLOWED" — solo nupload.me funciona (via `/api/resolve-video`), pero verhdlink devuelve URLs de miixdrop/doodstream/supervideo que están bloqueadas
2. **Servidores malos**: "malos servidores, todos anuncios" — verhdlink tiene demasiados anuncios y servidores que no funcionan
3. **Lista de servidores fea**: "la lista que pones abajo del reproductor toda fea" — el UI de la lista de servidores necesita mejor estilo
4. **Solo 8 canales deportivos**: "los canales de deportes solo hay 8" — necesitamos más canales
5. **Datos deportivos rotos**: "en inicio sale todo mal de partidos en vivo, no estan sincronizados con nada" — scores null, nombres de equipos duplicados con prefijo de liga
6. **Al hacer clic en un partido, debe llevar al canal específico**: El usuario quiere que al seleccionar un evento deportivo, lo lleve directamente al canal donde se transmite (usando `item.canales` de jjfutbol2.lat), no mostrar una lista genérica de todos los canales

---

## Issue 1: Filtrar verhdlink para solo mostrar nupload.me

### Diagnóstico
- [`backend/sources/verhdlink.js`](backend/sources/verhdlink.js:47) scrapea verhdlink.cam y devuelve URLs de **supervideo.cc, mixdrop.ag, dood.to** — todos bloquean iframes con "SANDBOX EMBED NOT ALLOWED"
- [`backend/sources/index.js`](backend/sources/index.js:33) combina resultados de verhdlink + pelisflix, mostrando servidores rotos al usuario
- [`backend/services/pelisflix.js`](backend/services/pelisflix.js:47) solo devuelve URLs de **nupload.me** (que sí podemos resolver via `/api/resolve-video`)

### Solución
**Archivo**: [`backend/sources/verhdlink.js`](backend/sources/verhdlink.js:47)

Modificar `getMovieStreams()` para que **filtre los resultados** y solo devuelva URLs de nupload.me. Verhdlink.cam a veces también tiene enlaces a nupload.me entre sus mirrors.

**Cambios específicos**:
1. En el loop de extracción de mirrors (líneas 60-87), añadir filtro: solo incluir servidores cuya URL contenga `nupload.me`
2. En el fallback (líneas 114-124), cambiar el fallback para que devuelva array vacío en lugar de un iframe directo de verhdlink
3. Si no se encuentra ningún mirror nupload.me, devolver array vacío

**Código clave a cambiar**:
```javascript
// En lugar de:
servers.push({
    name: name || `Server ${i + 1}`,
    url: fullUrl,
    type: 'iframe',
    quality: quality,
    alive: true,
    lang: 'es',
    source: 'verhdlink'
});

// Hacer:
if (fullUrl.includes('nupload.me')) {
    servers.push({
        name: name || `Nupload ${servers.length + 1}`,
        url: fullUrl,
        type: 'iframe',
        quality: quality,
        alive: true,
        lang: 'es',
        source: 'verhdlink'
    });
}
```

---

## Issue 2: Mejorar UI de la Lista de Servidores

### Diagnóstico
- [`index.html`](index.html:3668) — la lista de servidores usa inline styles y diseño básico
- Los botones de servidor son genéricos, sin diferenciación visual clara entre fuentes

### Solución
**Archivo**: [`index.html`](index.html:3668)

Mejorar el HTML generado en `loadDynamicServers()`:

1. **Tarjetas de servidor con más estilo**: Añadir bordes redondeados, sombras suaves, iconos más grandes
2. **Indicador de calidad visual**: Mostrar la calidad (FHD/HD/SD) como un badge colorido
3. **Animación de carga**: Mejorar el spinner de "Buscando servidores..."
4. **Mensaje cuando no hay servidores**: Mostrar un mensaje amigable en lugar de solo "No hay servidores"

---

## Issue 3: Arreglar Datos Deportivos (jjfutbol2.lat)

### Diagnóstico
- [`backend/services/sports.js`](backend/services/sports.js:243) — `fetchJJFutbolAgenda()` parsea mal los nombres de equipos
- El regex en línea 260: `title.match(/(?:\w+:\s*)?\n?\s*(.+?)\s*(?:vs\.?|vs|VS|Vs|[-–—])\s*(.+)/)` no maneja nombres de equipo con prefijo de liga (ej: "LaLiga SmartBank: Córdoba" se interpreta como "Córdoba" es el equipo local pero "LaLiga SmartBank" se pierde como liga)
- `homeScore` y `awayScore` siempre son `null` porque jjfutbol2.lat NO devuelve scores
- El frontend muestra "null - null" en lugar de "vs"

### Solución

#### Parte A: Backend — Mejorar parsing de equipos
**Archivo**: [`backend/services/sports.js`](backend/services/sports.js:243)

1. Mejorar el regex para extraer equipos: usar un enfoque más robusto que primero quite el prefijo de liga, luego busque el separador "vs"
2. Añadir lógica para detectar cuando el título tiene formato "Liga: EquipoA vs EquipoB" vs "EquipoA vs EquipoB"
3. Normalizar nombres de equipos (quitar saltos de línea, espacios extras)

**Código clave**:
```javascript
// Nuevo enfoque de parsing:
// 1. Primero extraer liga del prefijo (todo antes de ": \n" o ":\n")
const leaguePrefixMatch = title.match(/^(.+?):\s*\n/);
let league = leaguePrefixMatch ? leaguePrefixMatch[1].trim() : category;

// 2. Remover el prefijo de liga para quedarnos solo con los equipos
let teamsPart = title;
if (leaguePrefixMatch) {
    teamsPart = title.substring(leaguePrefixMatch[0].length).trim();
}

// 3. Buscar el separador "vs" en la parte de equipos
const vsMatch = teamsPart.match(/(.+?)\s*(?:vs\.?|VS|Vs|[-–—])\s*(.+)/);
let homeTeam = teamsPart;
let awayTeam = 'Por definir';
if (vsMatch) {
    homeTeam = vsMatch[1].trim();
    awayTeam = vsMatch[2].trim();
}
```

#### Parte B: Frontend — Mostrar "vs" en lugar de "null - null"
**Archivo**: [`index.html`](index.html:2750, 3010, 3057)

En las 3 funciones que muestran scores, cambiar la comprobación para usar `!= null` en lugar de `!== null`:
```javascript
const score = (m.homeScore != null && m.awayScore != null) ? `${m.homeScore} - ${m.awayScore}` : 'vs';
```

---

## Issue 4: Agregar Más Canales Deportivos

### Diagnóstico
- [`backend/services/sports.js`](backend/services/sports.js:16) — `SPORTS_CHANNELS` tiene solo 8 canales hardcodeados
- futbol-libre.su tiene muchos más canales disponibles

### Solución
**Archivo**: [`backend/services/sports.js`](backend/services/sports.js:16)

Añadir más canales al array `SPORTS_CHANNELS`:

```javascript
// Canales adicionales:
{ id: 'azteca-7', name: 'Azteca 7', slug: 'azteca-7', logo: '...', url: '...', country: 'México', bgColor: '#c41230' },
{ id: 'canal-5', name: 'Canal 5', slug: 'canal-5', logo: '...', url: '...', country: 'México', bgColor: '#003b6f' },
{ id: 'imagen-tv', name: 'Imagen TV', slug: 'imagen-tv', logo: '...', url: '...', country: 'México', bgColor: '#004b87' },
{ id: 'multimedios', name: 'Multimedios', slug: 'multimedios', logo: '...', url: '...', country: 'México', bgColor: '#ed1c24' },
{ id: 'tv-azteca', name: 'TV Azteca', slug: 'tv-azteca', logo: '...', url: '...', country: 'México', bgColor: '#004b87' },
{ id: 'gol-peru', name: 'Gol Perú', slug: 'gol-peru', logo: '...', url: '...', country: 'Perú', bgColor: '#e30613' }
```

---

## Issue 5: CORREGIDO — Al hacer clic en un partido, ir al canal específico

### Diagnóstico
Actualmente, [`openSportsMatchFromPage()`](index.html:2819) y [`openSportsMatch()`](index.html:3046) muestran un modal con **todos los canales deportivos** (S.sportsChannels) en lugar de llevar directamente al canal donde se transmite el partido.

jjfutbol2.lat ya devuelve los canales específicos para cada partido en `item.canales`:
```json
{
  "titulo": "LaLiga SmartBank: \nCórdoba vs Zaragoza",
  "hora": "21:00",
  "categoria": "LaLiga SmartBank",
  "canales": [
    { "canal": "ESPN Premium", "canal_id": "123" },
    { "canal": "DirecTV Sports", "canal_id": "456" }
  ]
}
```

### Solución — Cambio Radical en el Flujo

En lugar de mostrar un modal con lista de canales, al hacer clic en un partido:

1. **Detectar el canal específico** del partido desde `match.channels`
2. **Mapear el nombre del canal** al canal correspondiente en `S.sportsChannels` (por nombre)
3. **Llevar directamente al reproductor** del canal (usando `openSportsChannelDetail()`)

#### Cambios en Frontend

**Archivo**: [`index.html`](index.html)

**A) Modificar `renderSportsPage()`** (línea 2755):
Cambiar el `onclick` de las tarjetas de partido para que en lugar de abrir un modal, vaya directamente al canal:
```javascript
// En lugar de:
html += `<div class="sports-match-card" onclick='openSportsMatchFromPage(decodeURIComponent("${matchData}"))'>`;

// Hacer:
const firstChannel = m.channels && m.channels.length > 0 ? m.channels[0] : null;
if (firstChannel) {
    // Buscar el canal en sportsChannels por nombre
    const foundChannel = S.sportsChannels.find(sc => 
        firstChannel.name.toLowerCase().includes(sc.name.toLowerCase()) ||
        sc.name.toLowerCase().includes(firstChannel.name.toLowerCase())
    );
    if (foundChannel) {
        const chData = encodeURIComponent(JSON.stringify(foundChannel));
        html += `<div class="sports-match-card" onclick='openSportsChannelDetail(decodeURIComponent("${chData}"))'>`;
    } else {
        html += `<div class="sports-match-card" onclick='openSportsMatchFromPage(decodeURIComponent("${matchData}"))'>`;
    }
} else {
    html += `<div class="sports-match-card" onclick='openSportsMatchFromPage(decodeURIComponent("${matchData}"))'>`;
}
```

**B) Modificar `renderSportsSection()`** (línea 3014):
Mismo cambio que en A para la sección de inicio.

**C) Mejorar `openSportsMatchFromPage()`** (línea 2819):
Si el partido tiene canales específicos, mostrar SOLO esos canales en el modal, no todos:
```javascript
// Ya existe la lógica en línea 2831:
const channelsToShow = matchChannels.length > 0 ? matchChannels : S.sportsChannels;
// Pero el problema es que matchChannels puede tener canales sin logo/url.
// Mejorar el mapeo para que busque en S.sportsChannels por nombre.
```

**D) Mejorar el mapeo de canales** (línea 2821-2828):
El mapeo actual busca por coincidencia de nombre, pero si no encuentra, crea un objeto genérico sin `url`. Mejorar para que si no encuentra el canal en `S.sportsChannels`, intente buscar en los canales de TV normales (`S.channels`):
```javascript
const matchChannels = (match.channels || []).map(c => {
    // Buscar primero en sportsChannels
    let found = S.sportsChannels.find(sc =>
        c.name.toLowerCase().includes(sc.name.toLowerCase()) ||
        sc.name.toLowerCase().includes(c.name.toLowerCase())
    );
    // Si no, buscar en todos los canales
    if (!found) {
        found = (S.channels || []).find(ch =>
            c.name.toLowerCase().includes(ch.name.toLowerCase())
        );
    }
    return found || { name: c.name, id: c.id, logo: '', description: c.name, country: match.league || '', bgColor: '#1a1a2e' };
});
```

---

## Issue 6: Auto-refresh de Partidos Deportivos

### Solución
**Archivo**: [`index.html`](index.html)

Añadir un intervalo que refresque los partidos cada 60 segundos desde `/api/sports/mirror`:

```javascript
function startSportsRefresh() {
    if (S.sportsInterval) clearInterval(S.sportsInterval);
    S.sportsInterval = setInterval(async () => {
        try {
            const r = await fetch(`${API}/sports/mirror`);
            const j = await r.json();
            if (j.success && j.data) {
                S.liveMatches = j.data;
                renderSportsSection();
                if (document.getElementById('view-sports').classList.contains('active')) {
                    renderSportsPage();
                }
            }
        } catch (e) { /* silent */ }
    }, 60000);
}
```

---

## Resumen de Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| [`backend/sources/verhdlink.js`](backend/sources/verhdlink.js) | Filtrar mirrors para solo incluir nupload.me |
| [`backend/services/sports.js`](backend/services/sports.js) | Mejorar parsing de equipos, añadir más canales |
| [`index.html`](index.html) | Mejorar UI servidores, arreglar scores null, redirigir partido→canal directo, auto-refresh deportes |

## Diagrama de Flujo de Datos (Después de los Cambios)

```mermaid
flowchart TD
    User[Usuario] --> FE[Frontend index.html]
    
    FE -->|Solicita película| API[/api/stream/movie/:id]
    API --> Orchestrator[backend/sources/index.js]
    
    Orchestrator --> Verhdlink[verhdlink.js<br/>SOLO nupload.me]
    Orchestrator --> Pelisflix[pelisflix.js<br/>nupload.me URLs]
    
    Verhdlink -->|Filtrado: solo nupload| Results[Streams<br/>Solo nupload.me]
    Pelisflix -->|data-url base64| Results
    
    Results --> FE
    
    FE -->|URL nupload.me| Resolve[/api/resolve-video]
    Resolve -->|Extrae HLS URL| HLS[URL HLS .m3u8]
    HLS --> FE
    
    FE -->|Reproduce con| HLSJS[hls.js]
    
    subgraph Deportes
        SportsAPI[/api/sports/mirror<br/>caché 5min]
        SportsAPI --> JJ[jjfutbol2.lat<br/>21 partidos]
        JJ -->|Parsing mejorado| Matches[Partidos<br/>con canales específicos]
        Matches --> FE
        FE -->|Auto-refresh 60s| SportsAPI
        
        User -->|Click partido| MatchCard[Tarjeta de partido]
        MatchCard -->|Busca canal en match.channels| FindChannel[Encuentra canal<br/>en S.sportsChannels]
        FindChannel -->|Abre directo| ChannelPlayer[Reproductor del canal<br/>vía /api/channel-player]
        ChannelPlayer -->|HLS| HLSJS
    end
```

## Orden de Implementación

1. **Filtrar verhdlink** — solo nupload.me (cambio pequeño, alto impacto)
2. **Arreglar datos deportivos** — parsing equipos + scores null (cambio backend+frontend, alto impacto)
3. **Redirigir partido→canal directo** — al hacer clic en partido, ir al canal específico (cambio frontend, alto impacto)
4. **Agregar más canales** — añadir 6 canales más (cambio simple, impacto medio)
5. **Auto-refresh deportes** — intervalo 60s (cambio frontend, impacto medio)
6. **Mejorar UI servidores** — CSS y HTML (cambio visual, impacto bajo)
