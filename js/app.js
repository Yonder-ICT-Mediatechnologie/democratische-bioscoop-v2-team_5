// Democratische Bioscoop - Homepage Logic

// Zet genre altijd om naar een array, ongeacht of het een string of array is
function parseGenres(genre) {
    if (!genre) return [];
    if (Array.isArray(genre)) return genre.map(g => String(g).trim()).filter(Boolean);
    return String(genre).split(',').map(g => g.trim()).filter(Boolean);
}

class BioscoapHomepage {
    constructor() {
        this.films = [];
        this.filteredFilms = [];
        this.currentGenreFilter = 'alle';
        this.currentDateFilter = 'alle';
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadFilms();
        this.setupActiveNavLink();
    }

    setupActiveNavLink() {
        const navLinks = document.querySelectorAll('nav a');
        navLinks.forEach(link => {
            if (link.textContent.trim() === 'Home' || link.href.includes('index.html')) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    async loadFilms() {
        try {
            const allFilms = await api.getAllFilms();
            // Sorteer: top 3 (meeste stemmen) bovenaan, daarna de rest
            const sorted = [...allFilms].sort((a, b) => (b.votes || 0) - (a.votes || 0));
            this.top3Ids = new Set(sorted.slice(0, 3).map(f => f.id));
            // Volgorde: eerst top 3, daarna overige films
            const top3 = sorted.slice(0, 3);
            const rest = sorted.slice(3);
            this.films = [...top3, ...rest];
            this.filteredFilms = [...this.films];
            this.populateFilters();
            this.renderFilms();
        } catch (error) {
            console.error('Error loading films:', error);
            showToast('Fout bij laden van films', 'error');
        }
    }

    populateFilters() {
        // Get unique genres
        const genres = new Set();
        this.films.forEach(film => {
            parseGenres(film.genre).forEach(g => genres.add(g));
        });

        const genreSelect = document.getElementById('genreFilter');
        if (genreSelect) {
            const uniqueGenres = Array.from(genres).sort();
            const existingOptions = genreSelect.querySelectorAll('option:not(:first-child)');
            existingOptions.forEach(opt => opt.remove());

            uniqueGenres.forEach(genre => {
                const option = document.createElement('option');
                option.value = genre;
                option.textContent = genre;
                genreSelect.appendChild(option);
            });
        }

        // Get unique dates
        const dates = new Set();
        this.films.forEach(film => {
            if (film.scheduledDates) {
                film.scheduledDates.forEach(date => dates.add(date));
            }
        });

        const dateSelect = document.getElementById('dateFilter');
        if (dateSelect) {
            const sortedDates = Array.from(dates).sort();
            const existingOptions = dateSelect.querySelectorAll('option:not(:first-child)');
            existingOptions.forEach(opt => opt.remove());

            sortedDates.forEach(date => {
                const option = document.createElement('option');
                option.value = date;
                option.textContent = new Date(date).toLocaleDateString('nl-NL', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                dateSelect.appendChild(option);
            });
        }
    }

    setupEventListeners() {
        const genreFilter = document.getElementById('genreFilter');
        const dateFilter = document.getElementById('dateFilter');
        const resetFilters = document.getElementById('resetFilters');

        if (genreFilter) {
            genreFilter.addEventListener('change', () => this.applyFilters());
        }

        if (dateFilter) {
            dateFilter.addEventListener('change', () => this.applyFilters());
        }

        if (resetFilters) {
            resetFilters.addEventListener('click', () => this.resetFilters());
        }
    }

    applyFilters() {
        const genreFilter = document.getElementById('genreFilter')?.value || 'alle';
        const dateFilter = document.getElementById('dateFilter')?.value || 'alle';

        this.currentGenreFilter = genreFilter;
        this.currentDateFilter = dateFilter;

        this.filteredFilms = this.films.filter(film => {
            const genreMatch = genreFilter === 'alle' || parseGenres(film.genre).includes(genreFilter);
            const dateMatch = dateFilter === 'alle' || (film.scheduledDates && film.scheduledDates.includes(dateFilter));
            return genreMatch && dateMatch;
        });

        this.renderFilms();
    }

    resetFilters() {
        document.getElementById('genreFilter').value = 'alle';
        document.getElementById('dateFilter').value = 'alle';
        this.filteredFilms = [...this.films];
        this.currentGenreFilter = 'alle';
        this.currentDateFilter = 'alle';
        this.renderFilms();
    }

    renderFilms() {
        const filmsContainer = document.getElementById('filmsContainer');

        if (!filmsContainer) {
            console.error('Films container not found');
            return;
        }

        if (this.filteredFilms.length === 0) {
            filmsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-light-gray); font-size: 1.1rem;">Geen films gevonden</p>';
            return;
        }

        const top3Films = this.filteredFilms.filter(f => this.top3Ids && this.top3Ids.has(f.id));
        const otherFilms = this.filteredFilms.filter(f => !this.top3Ids || !this.top3Ids.has(f.id));

        let html = '';

        if (top3Films.length > 0) {
            html += `
                <div style="grid-column: 1 / -1; margin-bottom: 0.5rem; margin-top: 0.5rem;">
                    <h3 style="color: var(--accent-gold); font-size: 1.1rem; display: flex; align-items: center; gap: 0.5rem;">
                        🏆 <span>Top 3 — stem nu op jouw favoriet!</span>
                        <a href="stemmen.html" style="font-size: 0.85rem; font-weight: normal; color: var(--text-light-gray); margin-left: 0.75rem;">Naar stemmen →</a>
                    </h3>
                </div>
            `;
            html += top3Films.map(film => this.createFilmCard(film, true)).join('');
        }

        if (otherFilms.length > 0) {
            if (top3Films.length > 0) {
                html += `
                    <div style="grid-column: 1 / -1; margin-top: 1.5rem; margin-bottom: 0.5rem; border-top: 1px solid var(--border-color); padding-top: 1.5rem;">
                        <h3 style="color: var(--text-light-gray); font-size: 1rem;">Overige films</h3>
                    </div>
                `;
            }
            html += otherFilms.map(film => this.createFilmCard(film, false)).join('');
        }

        filmsContainer.innerHTML = html;

        // Add event listeners to detail buttons
        document.querySelectorAll('.detail-button').forEach((button) => {
            const filmId = button.getAttribute('data-film-id');
            button.addEventListener('click', () => this.goToDetail(filmId));
        });
    }

    createFilmCard(film, isTop3 = false) {
        // Ondersteun zowel Engelse als mogelijke andere veldnamen van de API
        const title = film.title || film.titel || film.name || 'Onbekende film';
        const director = film.director || film.regisseur || film.director_name || '';
        const year = film.releaseYear || film.jaar || film.year || '';
        const rating = film.rating || film.imdbRating || film.score || '';
        const duration = film.duration || film.duur || film.runtime || '';
        const genre = parseGenres(film.genre || film.genres).join(', ');
        const votes = film.votes || film.stemmen || 0;
        const poster = film.posterImage || film.poster || film.image || film.afbeelding || '';

        const scheduledDatesHtml = film.scheduledDates && film.scheduledDates.length > 0
            ? film.scheduledDates.slice(0, 2).map(date =>
                `<span class="badge badge-secondary">${new Date(date).toLocaleDateString('nl-NL', { month: 'short', day: 'numeric' })}</span>`
            ).join('')
            : '';

        // Gouden rand en badge voor top 3 films
        const cardStyle = isTop3 ? 'border: 2px solid var(--accent-gold);' : '';
        const top3Badge = isTop3 ? `<div style="position:absolute;top:0.6rem;right:0.6rem;background:var(--accent-gold);color:#000;font-size:0.7rem;font-weight:bold;padding:0.25rem 0.55rem;border-radius:20px;">🏆 STEM</div>` : '';

        return `
            <div class="card" style="${cardStyle} position: relative;">
                ${top3Badge}
                ${poster ? `<img src="${this.escapeHtml(poster)}" alt="${this.escapeHtml(title)}" class="card-image">` : `<div class="card-image" style="background:#1e2530;"></div>`}
                <div class="card-content">
                    <div class="card-title">${this.escapeHtml(title)}</div>
                    <div class="card-subtitle">${this.escapeHtml(director)}${director && year ? ' • ' : ''}${year}</div>
                    <div class="card-meta">
                        ${rating ? `<span>${rating} / 10</span>` : ''}
                        ${duration ? `<span>${duration} min</span>` : ''}
                    </div>
                    <div class="card-description">${this.escapeHtml(genre)}</div>

                    <div class="card-meta" style="gap: 0.5rem; flex-wrap: wrap;">
                        ${scheduledDatesHtml}
                    </div>

                    <div style="margin-top: auto; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                        ${isTop3 ? `<div class="vote-count">${votes} stemmen</div>` : ''}
                        <button class="btn btn-secondary detail-button" style="width: 100%;" data-film-id="${this.escapeHtml(film.id)}">Details</button>
                    </div>
                </div>
            </div>
        `;
    }

    async handleVote(film) {
        try {
            const updatedFilm = await api.upvoteFilm(film.id);

            // Als de API 0 teruggeeft, incrementeer lokaal
            if (!updatedFilm.votes && film.votes >= 0) {
                updatedFilm.votes = film.votes + 1;
            }

            // Update zowel filteredFilms als films
            const filteredIndex = this.filteredFilms.findIndex(f => f.id === film.id);
            if (filteredIndex !== -1) this.filteredFilms[filteredIndex] = updatedFilm;

            const filmsIndex = this.films.findIndex(f => f.id === film.id);
            if (filmsIndex !== -1) this.films[filmsIndex] = updatedFilm;

            this.renderFilms();
            showToast(`Bedankt voor je stem voor "${film.title}"!`, 'success');
        } catch (error) {
            console.error('Error voting:', error);
            showToast('Fout bij stemmen', 'error');
        }
    }

    goToDetail(filmId) {
        window.location.href = `film.html?id=${filmId}`;
    }

    escapeHtml(text) {
        if (text === null || text === undefined) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return String(text).replace(/[&<>"']/g, m => map[m]);
    }

}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new BioscoapHomepage();
});
