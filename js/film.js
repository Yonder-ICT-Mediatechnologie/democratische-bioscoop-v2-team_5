// Democratische Bioscoop - Film Detail Page Logic

// Zet genre altijd om naar een array, ongeacht of het een string of array is
function parseGenres(genre) {
    if (!genre) return [];
    if (Array.isArray(genre)) return genre.map(g => String(g).trim()).filter(Boolean);
    return String(genre).split(',').map(g => g.trim()).filter(Boolean);
}

class FilmDetailPage {
    constructor() {
        this.film = null;
        this.selectedDate = null;
        this.init();
    }

    async init() {
        this.setupActiveNavLink();
        this.isTop3Film = false;
        const filmId = this.getFilmIdFromUrl();

        if (!filmId) {
            this.showError('Film ID niet gevonden');
            return;
        }

        await this.loadFilmDetails(filmId);
        this.setupEventListeners();
    }

    setupActiveNavLink() {
        const navLinks = document.querySelectorAll('nav a');
        navLinks.forEach(link => {
            if (link.textContent.trim() === 'Film' || link.href.includes('film.html')) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    getFilmIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        const raw = params.get('id');
        if (!raw || raw === 'undefined' || raw === 'null') return null;
        // Probeer eerst als getal, anders als string (voor timestamp-IDs)
        const asNum = Number(raw);
        return isNaN(asNum) ? raw : asNum;
    }

    async loadFilmDetails(filmId) {
        try {
            // Laad filmdetails én alle films tegelijk om top 3 te bepalen
            const [filmData, allFilms] = await Promise.all([
                api.getFilmById(filmId),
                api.getAllFilms()
            ]);

            this.film = filmData;

            if (!this.film || !this.film.title) {
                this.showError('Film niet gevonden');
                return;
            }

            // Bepaal of deze film in de top 3 zit (op basis van stemmen)
            const sorted = [...allFilms].sort((a, b) => (b.votes || 0) - (a.votes || 0));
            const top3Ids = new Set(sorted.slice(0, 3).map(f => String(f.id)));
            this.isTop3Film = top3Ids.has(String(this.film.id));

            this.renderFilmDetails();
            this.populateDateSelector();
        } catch (error) {
            console.error('Error loading film:', error);
            this.showError('Fout bij laden van filmdetails');
        }
    }

    renderFilmDetails() {
        const detailsContainer = document.getElementById('filmDetails');

        if (!detailsContainer) {
            console.error('Film details container not found');
            return;
        }

        const genreHtml = parseGenres(this.film.genre)
            .map(g => `<span class="badge">${this.escapeHtml(g)}</span>`)
            .join('');

        const youtubeHtml = this.film.youtubeTrailerId
            ? `
                <div class="film-trailer">
                    <h3>Trailer</h3>
                    <a href="https://www.youtube.com/watch?v=${this.escapeHtml(this.film.youtubeTrailerId)}"
                       target="_blank"
                       style="display:block; position:relative; border-radius:8px; overflow:hidden; max-width:100%;">
                        <img
                            src="https://img.youtube.com/vi/${this.escapeHtml(this.film.youtubeTrailerId)}/hqdefault.jpg"
                            alt="Trailer van ${this.escapeHtml(this.film.title)}"
                            style="width:100%; display:block; border-radius:8px;">
                        <div style="
                            position:absolute; top:50%; left:50%;
                            transform:translate(-50%,-50%);
                            background:rgba(0,0,0,0.75);
                            border-radius:50%;
                            width:72px; height:72px;
                            display:flex; align-items:center; justify-content:center;
                            font-size:2rem;
                            border: 3px solid #f5c518;
                            transition: transform 0.2s;">
                            ▶
                        </div>
                    </a>
                    <p style="color:var(--text-light-gray); margin-top:0.75rem; font-size:0.9rem;">
                        Klik op de afbeelding om de trailer te bekijken op YouTube.
                    </p>
                </div>
            `
            : '';

        const imdbLinkHtml = this.film.imdbUrl
            ? `<a href="${this.escapeHtml(this.film.imdbUrl)}" target="_blank" class="btn btn-secondary" style="margin-right: 0.5rem;">Zie op IMDb</a>`
            : '';

        const posterHtml = this.film.posterImage
            ? `<img src="${this.escapeHtml(this.film.posterImage)}" alt="${this.escapeHtml(this.film.title)}">`
            : `<div style="width:100%;aspect-ratio:2/3;background:#1e2530;border-radius:8px;"></div>`;

        detailsContainer.innerHTML = `
            <div class="film-detail">
                <div class="film-poster">
                    ${posterHtml}
                </div>

                <div class="film-info">
                    <h3>${this.escapeHtml(this.film.title)}</h3>

                    <div class="film-meta">
                        ${this.film.releaseYear ? `<div class="meta-item"><span class="meta-label">Jaar</span><span class="meta-value">${this.film.releaseYear}</span></div>` : ''}
                        ${this.film.director ? `<div class="meta-item"><span class="meta-label">Regisseur</span><span class="meta-value">${this.escapeHtml(this.film.director)}</span></div>` : ''}
                        ${this.film.duration ? `<div class="meta-item"><span class="meta-label">Duur</span><span class="meta-value">${this.film.duration} minuten</span></div>` : ''}
                        ${this.film.rating ? `<div class="meta-item"><span class="meta-label">Rating</span><span class="meta-value">${this.film.rating}/10</span></div>` : ''}
                        ${genreHtml ? `<div class="meta-item"><span class="meta-label">Genre</span><span class="meta-value">${genreHtml}</span></div>` : ''}
                        ${this.isTop3Film ? `
                        <div class="meta-item">
                            <span class="meta-label">Stemmen</span>
                            <span class="meta-value" id="stemmenValue">${this.film.votes || 0}</span>
                        </div>` : ''}
                    </div>

                    <div class="film-description">
                        ${this.escapeHtml(this.film.description)}
                    </div>

                    <div style="margin: 2rem 0; padding: 1.5rem; background-color: var(--secondary-dark); border-radius: 8px; border: 1px solid var(--border-color);">
                        <h4 style="color: var(--accent-gold); margin-bottom: 1rem;">Beschikbare Data</h4>
                        <div id="dateSelector" style="display: flex; flex-wrap: wrap; gap: 0.5rem;"></div>
                    </div>

                    <div style="margin: 2rem 0;">
                        <span data-vote-section>${this.renderVoteButton()}</span>
                        <button id="reserveButton" class="btn btn-success btn-large" disabled style="margin-right: 0.5rem;">Reserveer kaartjes</button>
                        ${imdbLinkHtml}
                    </div>
                </div>
            </div>

            ${youtubeHtml}
        `;

        // Setup button listeners
        document.getElementById('voteButton')?.addEventListener('click', () => this.handleVote());
        document.getElementById('voteButtonGuest')?.addEventListener('click', () => this.showLoginModal());
        document.getElementById('reserveButton')?.addEventListener('click', () => this.handleReserve());
        this.ensureLoginModal();
    }

    populateDateSelector() {
        const dateSelector = document.getElementById('dateSelector');
        if (!dateSelector) return;

        if (!this.film.scheduledDates || this.film.scheduledDates.length === 0) {
            dateSelector.innerHTML = `
                <p style="color:var(--text-light-gray); font-size:0.9rem; margin:0;">
                    Nog geen voorstellingen gepland voor deze film. Reserveren is pas mogelijk als er een datum is ingepland.
                </p>`;
            return;
        }

        dateSelector.innerHTML = this.film.scheduledDates.map(date => {
            const dateObj = new Date(date);
            const formattedDate = dateObj.toLocaleDateString('nl-NL', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            });

            return `
                <button
                    class="btn btn-secondary date-button"
                    data-date="${date}"
                    style="flex: 0 0 auto; padding: 0.5rem 1rem; font-size: 0.9rem;">
                    ${formattedDate}
                </button>
            `;
        }).join('');

        document.querySelectorAll('.date-button').forEach(button => {
            button.addEventListener('click', (e) => {
                document.querySelectorAll('.date-button').forEach(b => {
                    b.style.backgroundColor = '';
                    b.style.borderColor = '';
                });
                e.target.style.backgroundColor = 'var(--accent-gold)';
                e.target.style.color = 'var(--primary-dark)';
                e.target.style.borderColor = 'var(--accent-gold)';
                this.selectedDate = e.target.dataset.date;
                document.getElementById('reserveButton').disabled = false;
            });
        });
    }

    renderVoteButton() {
        const currentUser = auth.getCurrentUser();
        const isLoggedIn = !!currentUser;
        const hasVoted = isLoggedIn && auth.hasVoted(currentUser.userId);

        if (!this.isTop3Film) {
            // Geen stem-knop voor films buiten de top 3
            return '';
        }

        if (!isLoggedIn) {
            return `<button id="voteButtonGuest" class="btn btn-large" style="margin-right: 0.5rem; background: var(--accent-gold); color: #000;">Stem voor deze film</button>`;
        }

        if (hasVoted) {
            const votedFilmId = auth.getVotedFilmId(currentUser.userId);
            if (String(votedFilmId) === String(this.film.id)) {
                return `<button class="btn btn-large" disabled style="margin-right: 0.5rem; background: var(--success-green); color: #fff; opacity: 0.8; cursor: not-allowed;">✅ Jouw keuze</button>`;
            } else {
                return `<button class="btn btn-large" disabled style="margin-right: 0.5rem; opacity: 0.5; cursor: not-allowed;">Al gestemd</button>`;
            }
        }

        return `<button id="voteButton" class="btn btn-large" style="margin-right: 0.5rem; background: var(--accent-gold); color: #000;">Stem voor deze film</button>`;
    }

    ensureLoginModal() {
        if (document.getElementById('loginWarningModal')) return;
        const modal = document.createElement('div');
        modal.id = 'loginWarningModal';
        modal.innerHTML = `
            <div id="loginWarningOverlay" style="
                display: none;
                position: fixed;
                inset: 0;
                background: rgba(0,0,0,0.7);
                z-index: 1000;
                align-items: center;
                justify-content: center;
            ">
                <div style="
                    background: var(--secondary-dark);
                    border: 2px solid var(--warning-orange);
                    border-radius: 12px;
                    padding: 2rem;
                    max-width: 420px;
                    width: 90%;
                    text-align: center;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.6);
                ">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">🔒</div>
                    <h3 style="color: var(--warning-orange); margin-bottom: 0.75rem; font-size: 1.3rem;">Inloggen vereist</h3>
                    <p style="color: var(--text-light-gray); margin-bottom: 1.5rem; line-height: 1.6;">
                        Je moet ingelogd zijn om op een film te stemmen.<br>
                        Log in of maak een gratis account aan!
                    </p>
                    <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                        <a href="login.html?redirect=film.html?id=${this.escapeHtml(String(this.film?.id || ''))}" class="btn" style="background: var(--accent-gold); color: #000; font-weight: bold; padding: 0.6rem 1.5rem;">
                            Inloggen / Registreren
                        </a>
                        <button id="loginModalClose" class="btn btn-secondary" style="padding: 0.6rem 1.5rem;">
                            Annuleren
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        document.getElementById('loginModalClose').addEventListener('click', () => this.hideLoginModal());
        document.getElementById('loginWarningOverlay').addEventListener('click', (e) => {
            if (e.target === document.getElementById('loginWarningOverlay')) this.hideLoginModal();
        });
    }

    showLoginModal() {
        const overlay = document.getElementById('loginWarningOverlay');
        if (overlay) overlay.style.display = 'flex';
    }

    hideLoginModal() {
        const overlay = document.getElementById('loginWarningOverlay');
        if (overlay) overlay.style.display = 'none';
    }

    async handleVote() {
        const currentUser = auth.getCurrentUser();

        if (!currentUser) {
            this.showLoginModal();
            return;
        }

        if (auth.hasVoted(currentUser.userId)) {
            showToast('Je hebt al gestemd. Je kunt slechts één keer stemmen.', 'warning');
            return;
        }

        const voteBtn = document.getElementById('voteButton');
        if (voteBtn) {
            voteBtn.disabled = true;
            voteBtn.innerHTML = '<span class="loading"></span>';
        }

        try {
            const updatedFilm = await api.upvoteFilm(this.film.id);

            // Alleen de stemteller updaten — de rest van this.film intact houden
            // zodat de pagina niet leeg wordt als de API onvolledige data teruggeeft
            const newVotes = (updatedFilm && updatedFilm.votes)
                ? updatedFilm.votes
                : (this.film.votes || 0) + 1;

            this.film = { ...this.film, votes: newVotes };

            // Stem opslaan voor deze gebruiker
            auth.recordVote(currentUser.userId, this.film.id);

            showToast(`Bedankt voor je stem op "${this.film.title}"! 🎬`, 'success');

            // Herrender alleen de knop en het stemteller getal (niet de hele pagina)
            const votesBadge = document.querySelector('.meta-item .meta-value[data-votes]');
            if (votesBadge) votesBadge.textContent = newVotes;

            // Vervang de stem-sectie
            const voteContainer = document.querySelector('[data-vote-section]');
            if (voteContainer) {
                voteContainer.innerHTML = this.renderVoteButton();
                document.getElementById('voteButton')?.addEventListener('click', () => this.handleVote());
                document.getElementById('voteButtonGuest')?.addEventListener('click', () => this.showLoginModal());
            }

            // Update het stemmen getal in de meta-sectie
            const stemmenValue = document.getElementById('stemmenValue');
            if (stemmenValue) stemmenValue.textContent = newVotes;

        } catch (error) {
            console.error('Error voting:', error);
            if (voteBtn) {
                voteBtn.disabled = false;
                voteBtn.innerHTML = 'Stem voor deze film';
            }
            showToast('Fout bij stemmen. Probeer het opnieuw.', 'error');
        }
    }

    handleReserve() {
        if (!this.selectedDate) {
            showToast('Selecteer eerst een datum', 'warning');
            return;
        }
        window.location.href = `reserveren.html?filmId=${this.film.id}&date=${this.selectedDate}`;
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

    showError(message) {
        const mainElement = document.querySelector('main');
        if (mainElement) {
            mainElement.innerHTML = `
                <div class="container">
                    <div class="alert alert-error">
                        <h3>Fout</h3>
                        <p>${this.escapeHtml(message)}</p>
                        <a href="index.html" class="btn">Terug naar home</a>
                    </div>
                </div>
            `;
        }
    }

}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new FilmDetailPage();
});
