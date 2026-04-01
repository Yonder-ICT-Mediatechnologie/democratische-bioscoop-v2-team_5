// ============================================
// Democratische Bioscoop - API Module
// ============================================

const restService = 'https://project-bioscoop-restservice.azurewebsites.net';
const apiKey = 'UQc8Tp1d9elWAh7KDIMkjz2moFs';

// ── Globale toast popup ──────────────────────────────────────────
function showToast(message, type = 'info', duration = 3500) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${icons[type] || ''}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast-out');
        toast.addEventListener('animationend', () => toast.remove(), { once: true });
    }, duration);
}

// ============================================
// API OBJECT - alle methodes die de app gebruikt
// ============================================

// ============================================
// VELD-NORMALISATIE — zet API veldnamen om naar
// de namen die de rest van de app verwacht
// ============================================
const normalizeFilm = (film, planning = []) => {
    // De API gebruikt '_id' als unieke identifier (bv. "83BsT4p4bV2nMIv7")
    const filmId = film._id || film.id || film.filmId || film.timestamp || '';

    // Haal YouTube video-ID op uit de volledige URL (bv. ?v=dQw4w9WgXcQ)
    let youtubeId = film.youtubeTrailerId || '';
    if (!youtubeId && film.url_trailer) {
        const match = film.url_trailer.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
        youtubeId = match ? match[1] : '';
    }

    return {
        ...film,
        id:               filmId,
        title:            film.title          || film.titel        || '',
        description:      film.description    || film.beschrijving || '',
        genre:            film.genre          || film.genres       || film.categories ||
                          film.category       || film.categorie     || '',
        director:         film.director       || film.regisseur    || '',
        releaseYear:      film.releaseYear    || film.jaar         || film.year      || '',
        duration:         film.duration       || film.duur         || film.runtime   || '',
        rating:           film.rating         || film.beoordeling  || '',
        votes:            film.votes          || film.stemmen      || 0,
        // Gebruik YouTube-thumbnail als fallback poster (werkt altijd)
        posterImage:      film.posterImage    || film.poster       || film.image     || film.afbeelding ||
                          (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : ''),
        youtubeTrailerId: youtubeId,
        imdbUrl:          film.imdbUrl        || film.imdb         || '',
        scheduledDates:   planning
            .filter(p => String(p.idFilm) === String(filmId))
            .map(p => p.date)
    };
};

const api = {

    // ---------- FILM API CALLS ----------

    // Alle films ophalen, aangevuld met planningsdatums
    getAllFilms: async () => {
        const [filmsRaw, planning] = await Promise.all([
            fetch(`${restService}/list/${apiKey}`).then(r => r.json()),
            Promise.resolve(api.getPlanning())
        ]);

        const allFilms = Array.isArray(filmsRaw) ? filmsRaw : [];

        // Verwijder duplicaten op basis van titel (case-insensitief).
        // Bij duplicaten: houd de film met de meeste stemmen.
        const seen = new Map();
        for (const film of allFilms) {
            const key = (film.title || film.titel || '').trim().toLowerCase();
            if (!key) continue;
            const existing = seen.get(key);
            const votes = film.votes || film.stemmen || 0;
            const existingVotes = existing ? (existing.votes || existing.stemmen || 0) : -1;
            if (!existing || votes > existingVotes) {
                seen.set(key, film);
            }
        }
        const films = Array.from(seen.values());

        if (films.length > 0) {
            const f = films[0];
            console.group('%c DEMOCRATISCHE BIOSCOOP — API OVERZICHT', 'font-size:14px; font-weight:bold; color:#f5c518;');

            console.group('%c Verbinding', 'color:#4CAF50; font-weight:bold;');
            console.log('REST Service :', restService);
            console.log('API Key      :', apiKey);
            console.log('Status       :', '✅ Verbonden');
            console.groupEnd();

            console.group('%c Films', 'color:#4CAF50; font-weight:bold;');
            console.log('Aantal films :', films.length);
            console.log('Veldnamen    :', Object.keys(f).join(', '));
            console.log('Film-ID veld :', '_id  (bv. "' + f._id + '")');
            console.log('Voorbeeld    :', {
                _id:         f._id,
                title:       f.title,
                category:    f.category,
                description: f.description,
                votes:       f.votes,
                url_trailer: f.url_trailer,
                timestamp:   f.timestamp,
                date:        f.date,
                apikey:      f.apikey,
            });
            console.groupEnd();

            console.group('%c📡 Beschikbare endpoints', 'color:#4CAF50; font-weight:bold;');
            console.log('✅ GET  ' + restService + '/list/'              + apiKey          + '          → alle films');
            console.log('✅ GET  ' + restService + '/details/{_id}/'     + apiKey          + '  → 1 film');
            console.log('✅ POST ' + restService + '/add/'               + apiKey          + '          → film toevoegen');
            console.log('✅ PUT  ' + restService + '/voteup/{_id}/'      + apiKey          + '  → stem op film');
            console.log('✅ DEL  ' + restService + '/delete/{_id}/'      + apiKey          + '  → film verwijderen');
            console.groupEnd();

            console.group('%c❌ Niet beschikbare endpoints', 'color:#e74c3c; font-weight:bold;');
            console.log('❌ Planning/schedule endpoint — niet gevonden op deze server');
            console.log('   → Reserveren vereist een datum uit de planning');
            console.groupEnd();

            console.group('%c🗂 Veldnamen mapping (API → App)', 'color:#3498db; font-weight:bold;');
            console.table([
                { 'API veld': '_id',         'App gebruikt': 'id',               'Voorbeeld': f._id },
                { 'API veld': 'title',        'App gebruikt': 'title',            'Voorbeeld': f.title },
                { 'API veld': 'category/categories/genres', 'App gebruikt': 'genre', 'Voorbeeld': f.category || f.categories || f.genres },
                { 'API veld': 'description',  'App gebruikt': 'description',      'Voorbeeld': (f.description || '').substring(0, 40) + '...' },
                { 'API veld': 'votes',        'App gebruikt': 'votes',            'Voorbeeld': f.votes },
                { 'API veld': 'url_trailer',  'App gebruikt': 'youtubeTrailerId', 'Voorbeeld': f.url_trailer },
                { 'API veld': 'timestamp',    'App gebruikt': '(niet gebruikt)',  'Voorbeeld': f.timestamp },
                { 'API veld': '(geen)',       'App gebruikt': 'posterImage',      'Voorbeeld': '→ YouTube thumbnail' },
            ]);
            console.groupEnd();

            console.groupEnd();
        }

        return films.map(film => normalizeFilm(film, planning));
    },

    // Details van 1 film ophalen, aangevuld met planningsdatums
    getFilmById: async (id) => {
        const [film, planning] = await Promise.all([
            fetch(`${restService}/details/${id}/${apiKey}`).then(r => r.json()),
            Promise.resolve(api.getPlanning())
        ]);

        return normalizeFilm(film, planning);
    },

    // Film toevoegen
    addFilm: async (data) => {
        data.apikey = apiKey;
        const response = await fetch(`${restService}/add/${apiKey}`, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    // Film bijwerken
    updateFilm: async (id, data) => {
        data.apikey = apiKey;
        const response = await fetch(`${restService}/update/${id}/${apiKey}`, {
            method: 'PUT',
            mode: 'cors',
            cache: 'no-cache',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    // Film upvoten
    upvoteFilm: async (id) => {
        const response = await fetch(`${restService}/voteup/${id}/${apiKey}`, {
            method: 'PUT',
            mode: 'cors',
            cache: 'no-cache',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        const updatedFilm = await response.json();
        const planning = api.getPlanning();
        return normalizeFilm(updatedFilm, planning);
    },

    // Film verwijderen
    deleteFilm: async (id) => {
        const response = await fetch(`${restService}/delete/${id}/${apiKey}`, {
            method: 'DELETE',
            mode: 'cors',
            cache: 'no-cache',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        return response.json();
    },

    // ---------- PLANNING (localStorage) ----------

    getPlanning: () => {
        return JSON.parse(localStorage.getItem('bioscoop_planning')) || [];
    },

    // Film inplannen op een datum
    addPlanning: (idFilm, date) => {
        const planning = api.getPlanning();
        const item = {
            id: 'PLAN-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
            idFilm: String(idFilm),
            date: date,
            createdAt: new Date().toISOString()
        };
        planning.push(item);
        localStorage.setItem('bioscoop_planning', JSON.stringify(planning));
        return item;
    },

    // Planningitem verwijderen
    deletePlanning: (id) => {
        const planning = api.getPlanning();
        const filtered = planning.filter(p => p.id !== id);
        localStorage.setItem('bioscoop_planning', JSON.stringify(filtered));
    },

    // ---------- RESERVERINGEN (localStorage) ----------

    getReservations: () => {
        return JSON.parse(localStorage.getItem('bioscoop_reserveringen')) || [];
    },

    getTakenSeats: (filmId, date) => {
        const reservations = api.getReservations();
        const seats = [];
        reservations
            .filter(r => String(r.filmId) === String(filmId) && r.date === date)
            .forEach(r => {
                if (r.seats && Array.isArray(r.seats)) {
                    seats.push(...r.seats);
                }
            });
        return seats;
    },

    createReservation: (data) => {
        const reservations = api.getReservations();
        data.id = 'RES-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
        data.createdAt = new Date().toISOString();
        reservations.push(data);
        localStorage.setItem('bioscoop_reserveringen', JSON.stringify(reservations));
        return data;
    },

    deleteReservation: (id) => {
        const reservations = api.getReservations();
        const filtered = reservations.filter(r => r.id !== id);
        localStorage.setItem('bioscoop_reserveringen', JSON.stringify(filtered));
    },

    // ---------- HELPERS ----------

    calculatePrice: (numSeats) => {
        return numSeats * 10;
    },

    escapeHtml: (text) => {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    formatDate: (dateStr) => {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('nl-NL', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    }
};
