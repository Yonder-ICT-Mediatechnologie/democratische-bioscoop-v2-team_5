// Democratische Bioscoop - Voting Page Logic
// Alleen de TOP 3 films (meeste stemmen) kunnen gestemd worden.
// Stemmen vereist een ingelogd account. Elke gebruiker mag slechts 1 keer stemmen.

function parseGenres(genre) {
    if (!genre) return [];
    if (Array.isArray(genre)) return genre.map(g => String(g).trim()).filter(Boolean);
    return String(genre).split(',').map(g => g.trim()).filter(Boolean);
}

class VotingPage {
    constructor() {
        this.films = [];
        this.init();
    }

    async init() {
        this.setupActiveNavLink();
        await this.loadFilms();
        this.setupRefreshListener();
    }

    setupActiveNavLink() {
        const navLinks = document.querySelectorAll('nav a');
        navLinks.forEach(link => {
            if (link.textContent.trim() === 'Stemmen' || link.href.includes('stemmen.html')) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    async loadFilms() {
        try {
            const allFilms = await api.getAllFilms();
            // Sorteer op stemmen (meeste stemmen bovenaan), neem TOP 3
            this.films = allFilms
                .sort((a, b) => b.votes - a.votes)
                .slice(0, 3);
            this.renderVotingList();
        } catch (error) {
            console.error('Error loading films:', error);
            showToast('Fout bij laden van films', 'error');
        }
    }

    renderVotingList() {
        const listContainer = document.getElementById('votingListContainer');
        if (!listContainer) return;

        if (this.films.length === 0) {
            listContainer.innerHTML = `
                <div class="alert alert-info">
                    <p>Er zijn momenteel geen films beschikbaar voor stemming.</p>
                </div>
            `;
            return;
        }

        const currentUser = auth.getCurrentUser();
        const isLoggedIn  = !!currentUser;
        const hasVoted    = isLoggedIn && auth.hasVoted(currentUser.userId);
        const votedFilmId = hasVoted ? auth.getVotedFilmId(currentUser.userId) : null;

        // Infobalk bovenaan
        let infoBanner = '';
        if (!isLoggedIn) {
            infoBanner = ''; // Geen banner — melding verschijnt alleen bij klikken op Stem
        } else if (hasVoted) {
            const votedFilm = this.films.find(f => f.id === votedFilmId);
            const votedTitle = votedFilm ? votedFilm.title : 'een film';
            infoBanner = `
                <div class="alert alert-success" style="margin-bottom: 1.5rem;">
                    ✅ <strong>Jij hebt al gestemd op "${this.escapeHtml(votedTitle)}".</strong>
                    Je kunt slechts één keer stemmen.
                </div>
            `;
        } else {
            infoBanner = `
                <div class="alert alert-info" style="margin-bottom: 1.5rem;">
                    👋 Ingelogd als <strong>${this.escapeHtml(currentUser.username)}</strong>.
                    Stem op één van de top 3 films hieronder!
                </div>
            `;
        }

        const listHtml = `
            ${infoBanner}
            <p style="color: var(--text-light-gray); margin-bottom: 1rem; font-size: 0.95rem;">
                🏆 Alleen de <strong>top 3 films</strong> zijn beschikbaar voor stemming. Stem op de film die jij wilt zien!
            </p>
            <ul class="voting-list">
                ${this.films.map((film, index) =>
                    this.createVotingItem(film, index + 1, isLoggedIn, hasVoted, votedFilmId)
                ).join('')}
            </ul>
        `;

        listContainer.innerHTML = listHtml;

        // Login-waarschuwing modal (eenmalig aanmaken als die er nog niet is)
        this.ensureLoginModal();

        // Event listeners op stem-knoppen (voor ingelogde gebruikers)
        document.querySelectorAll('.vote-btn').forEach(button => {
            button.addEventListener('click', () => {
                const filmId = button.getAttribute('data-film-id');
                const film = this.films.find(f => f.id === filmId);
                if (film) this.handleVote(film, button);
            });
        });

        // Event listeners op stem-knoppen voor niet-ingelogde gebruikers
        document.querySelectorAll('.vote-btn-guest').forEach(button => {
            button.addEventListener('click', () => {
                this.showLoginModal();
            });
        });
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
                        <a href="login.html?redirect=stemmen.html" class="btn" style="background: var(--accent-gold); color: #000; font-weight: bold; padding: 0.6rem 1.5rem;">
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
        if (overlay) {
            overlay.style.display = 'flex';
        }
    }

    hideLoginModal() {
        const overlay = document.getElementById('loginWarningOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    createVotingItem(film, rank, isLoggedIn, hasVoted, votedFilmId) {
        const meta = [
            film.director ? `<strong>Regie:</strong> ${this.escapeHtml(film.director)}` : '',
            film.genre    ? `<strong>Genre:</strong> ${this.escapeHtml(parseGenres(film.genre).join(', '))}` : '',
        ].filter(Boolean).join(' &bull; ');

        // Knop logica
        let btnHtml = '';
        if (!isLoggedIn) {
            btnHtml = `<button class="btn btn-success vote-btn-guest" style="width: 100%; margin-top: 1rem;">Stem</button>`;
        } else if (hasVoted) {
            if (film.id === votedFilmId) {
                btnHtml = `<button class="btn btn-success vote-btn" style="width: 100%; margin-top: 1rem;" disabled>✅ Jouw keuze</button>`;
            } else {
                btnHtml = `<button class="btn btn-secondary vote-btn" style="width: 100%; margin-top: 1rem;" disabled>Al gestemd</button>`;
            }
        } else {
            btnHtml = `<button class="btn btn-success vote-btn" style="width: 100%; margin-top: 1rem;" data-film-id="${this.escapeHtml(film.id)}">Stem</button>`;
        }

        // Highlight de film waarop gestemd is
        const isVotedFilm = hasVoted && film.id === votedFilmId;
        const itemStyle   = isVotedFilm ? 'border-color: var(--success-green); background: rgba(76,175,80,0.07);' : '';

        return `
            <li class="voting-item" style="${itemStyle}">
                <div class="voting-rank">#${rank}</div>
                <div class="voting-film-info">
                    <div class="voting-title">${this.escapeHtml(film.title)}</div>
                    ${meta ? `<div class="voting-meta">${meta}</div>` : ''}
                </div>
                <div class="voting-votes">
                    <div class="voting-label">Totale stemmen</div>
                    <div class="voting-count">${film.votes || 0}</div>
                    ${btnHtml}
                </div>
            </li>
        `;
    }

    async handleVote(film, button) {
        const currentUser = auth.getCurrentUser();

        // Dubbele check: moet ingelogd zijn
        if (!currentUser) {
            showToast('Je moet ingelogd zijn om te stemmen.', 'warning');
            window.location.href = 'login.html?redirect=stemmen.html';
            return;
        }

        // Dubbele check: mag maar 1 keer stemmen
        if (auth.hasVoted(currentUser.userId)) {
            showToast('Je hebt al gestemd. Je kunt slechts één keer stemmen.', 'warning');
            return;
        }

        try {
            button.disabled = true;
            button.innerHTML = '<span class="loading"></span>';

            const updatedFilm = await api.upvoteFilm(film.id);

            // Als de API 0 teruggeeft, incrementeer lokaal
            if (!updatedFilm.votes && film.votes >= 0) {
                updatedFilm.votes = film.votes + 1;
            }

            // Stem opslaan voor deze gebruiker
            auth.recordVote(currentUser.userId, film.id);

            const index = this.films.findIndex(f => f.id === film.id);
            if (index !== -1) {
                this.films[index] = { ...this.films[index], votes: updatedFilm.votes || (film.votes + 1) };
            }

            showToast(`Bedankt voor je stem op "${film.title}"! 🎬`, 'success');
            this.renderVotingList();

        } catch (error) {
            console.error('Error voting:', error);
            button.disabled = false;
            button.innerHTML = 'Stem';
            showToast('Fout bij stemmen. Probeer het opnieuw.', 'error');
        }
    }

    setupRefreshListener() {
        // Optioneel: elke 30 seconden herladen
        // setInterval(() => this.loadFilms(), 30000);
    }

    escapeHtml(text) {
        if (text === null || text === undefined) return '';
        const map = {
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
        };
        return String(text).replace(/[&<>"']/g, m => map[m]);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new VotingPage();
});
