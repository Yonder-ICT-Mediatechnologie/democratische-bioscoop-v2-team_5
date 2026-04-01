// Democratische Bioscoop - Admin Dashboard Logic

class AdminDashboard {
    constructor() {
        this.isLoggedIn = false;
        this.films = [];
        this.reservations = [];
        this.planning = [];
        this.init();
    }

    init() {
        this.setupActiveNavLink();
        const loginContainer = document.getElementById('loginContainer');

        if (loginContainer && !this.isLoggedIn) {
            this.showLoginForm();
        } else if (this.isLoggedIn) {
            this.showDashboard();
        }
    }

    setupActiveNavLink() {
        const navLinks = document.querySelectorAll('nav a');
        navLinks.forEach(link => {
            if (link.textContent.trim() === 'Dashboard' || link.href.includes('dashboard.html')) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    showLoginForm() {
        const loginContainer = document.getElementById('loginContainer');
        if (!loginContainer) return;

        loginContainer.innerHTML = `
            <div class="container">
                <form id="loginForm" style="max-width: 400px;">
                    <h3>Beheerder Login</h3>
                    <p style="color: var(--text-light-gray); margin-bottom: 1.5rem;">
                        Voer uw inloggegevens in om het dashboard te openen.
                    </p>

                    <div class="form-group">
                        <label for="username">Gebruikersnaam</label>
                        <input type="text" id="username" required placeholder="admin">
                    </div>

                    <div class="form-group">
                        <label for="password">Wachtwoord</label>
                        <input type="password" id="password" required placeholder="••••••••">
                    </div>

                    <div id="loginError" class="alert alert-error" style="display: none; margin-bottom: 1rem;"></div>

                    <button type="submit" class="btn btn-large" style="width: 100%;">Inloggen</button>
                </form>
            </div>
        `;

        const form = document.getElementById('loginForm');
        form.addEventListener('submit', (e) => this.handleLogin(e));
    }

    handleLogin(e) {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // Simple demo login (admin/admin123)
        if (username === 'admin' && password === 'admin123') {
            this.isLoggedIn = true;
            this.showDashboard();
        } else {
            const errorDiv = document.getElementById('loginError');
            errorDiv.textContent = 'Ongeldig gebruikersnaam of wachtwoord';
            errorDiv.style.display = 'block';
        }
    }

    async showDashboard() {
        const loginContainer = document.getElementById('loginContainer');
        if (!loginContainer) return;

        try {
            this.films = await api.getAllFilms();
            this.reservations = api.getReservations();
            this.planning = await api.getPlanning();

            loginContainer.innerHTML = `
                <div class="container">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                        <h2 style="color: var(--accent-gold); text-transform: uppercase; letter-spacing: 1px;">Beheerdersdashboard</h2>
                        <button id="logoutButton" class="btn btn-danger">Afmelden</button>
                    </div>

                    <div class="admin-grid">
                        <div class="admin-section">
                            <h3>Films beheren</h3>
                            <p style="color: var(--text-light-gray); margin-bottom: 1rem;">
                                Totaal: ${this.films.length} films
                            </p>

                            <div id="filmsList" class="film-list"></div>

                            <button id="addFilmButton" class="btn btn-success" style="width: 100%; margin-top: 1rem;">Nieuwe film toevoegen</button>
                        </div>

                        <div class="admin-section">
                            <h3>Reserveringsoverzicht</h3>
                            <p style="color: var(--text-light-gray); margin-bottom: 1rem;">
                                Totaal: ${this.reservations.length} reserveringen
                            </p>

                            <div id="reservationsList" style="max-height: 500px; overflow-y: auto;"></div>
                        </div>
                    </div>

                    <!-- Planning sectie -->
                    <div class="admin-section" style="margin-top: 2rem;">
                        <h3>Planning beheren</h3>
                        <p style="color: var(--text-light-gray); margin-bottom: 1rem;">
                            Hier bepaal je welke film op welke vrijdag speelt.
                        </p>

                        <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem; align-items: flex-end;">
                            <div class="form-group" style="margin-bottom: 0; flex: 1; min-width: 180px;">
                                <label for="planningFilmSelect">Film</label>
                                <select id="planningFilmSelect">
                                    <option value="">-- Kies een film --</option>
                                    ${this.films.map(f => `<option value="${f.id}">${this.escapeHtml(f.title)}</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group" style="margin-bottom: 0; flex: 1; min-width: 160px;">
                                <label for="planningDateInput">Datum (vrijdag)</label>
                                <input type="date" id="planningDateInput">
                            </div>
                            <button id="addPlanningButton" class="btn btn-success" style="height: 42px; white-space: nowrap;">Inplannen</button>
                        </div>

                        <div id="planningList"></div>
                    </div>

                    <div id="filmFormContainer"></div>
                </div>
            `;

            this.renderFilmsList();
            this.renderReservationsList();
            this.renderPlanningList();
            this.setupDashboardListeners();
        } catch (error) {
            console.error('Error loading dashboard:', error);
            loginContainer.innerHTML = `
                <div class="container">
                    <div class="alert alert-error">
                        <p>Fout bij laden van dashboard</p>
                    </div>
                </div>
            `;
        }
    }

    renderPlanningList() {
        const planningList = document.getElementById('planningList');
        if (!planningList) return;

        if (!this.planning || this.planning.length === 0) {
            planningList.innerHTML = '<p style="color: var(--text-light-gray);">Geen planning gevonden. Voeg hierboven een film in.</p>';
            return;
        }

        // Sorteer op datum
        const sorted = [...this.planning].sort((a, b) => (a.date > b.date ? 1 : -1));

        planningList.innerHTML = sorted.map(item => {
            const film = this.films.find(f => String(f.id) === String(item.idFilm));
            const filmTitle = film ? film.title : `Film #${item.idFilm}`;
            const dateDisplay = new Date(item.date + 'T00:00:00').toLocaleDateString('nl-NL', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            });

            return `
                <div class="film-item" style="margin-bottom: 0.75rem;">
                    <div class="film-item-info">
                        <h4>${this.escapeHtml(filmTitle)}</h4>
                        <div class="film-item-meta">${dateDisplay}</div>
                    </div>
                    <div class="film-item-actions">
                        <button class="btn btn-danger btn-small delete-planning" data-id="${item.id}">Verwijder</button>
                    </div>
                </div>
            `;
        }).join('');

        document.querySelectorAll('.delete-planning').forEach(btn => {
            btn.addEventListener('click', () => this.handleDeletePlanning(btn.dataset.id));
        });
    }

    async handleAddPlanning() {
        const filmSelect = document.getElementById('planningFilmSelect');
        const dateInput = document.getElementById('planningDateInput');

        if (!filmSelect || !dateInput) return;

        const idFilm = filmSelect.value;
        const date = dateInput.value;

        if (!idFilm) {
            showToast('Selecteer een film', 'warning');
            return;
        }
        if (!date) {
            showToast('Kies een datum', 'warning');
            return;
        }

        try {
            await api.addPlanning(idFilm, date);
            this.planning = await api.getPlanning();
            this.films = await api.getAllFilms();
            this.renderPlanningList();
            filmSelect.value = '';
            dateInput.value = '';
            showToast('Planning succesvol toegevoegd!', 'success');
        } catch (error) {
            console.error('Error adding planning:', error);
            showToast('Fout bij toevoegen van planning', 'error');
        }
    }

    async handleDeletePlanning(id) {
        if (!confirm('Planning verwijderen?')) return;

        try {
            await api.deletePlanning(id);
            this.planning = await api.getPlanning();
            this.films = await api.getAllFilms();
            this.renderPlanningList();
            showToast('Planning verwijderd', 'success');
        } catch (error) {
            console.error('Error deleting planning:', error);
            showToast('Fout bij verwijderen van planning', 'error');
        }
    }

    renderFilmsList() {
        const filmsList = document.getElementById('filmsList');
        if (!filmsList) return;

        if (this.films.length === 0) {
            filmsList.innerHTML = '<p style="color: var(--text-light-gray);">Geen films gevonden</p>';
            return;
        }

        // Bepaal top 3 op basis van stemmen
        const sorted = [...this.films].sort((a, b) => (b.votes || 0) - (a.votes || 0));
        const top3Ids = new Set(sorted.slice(0, 3).map(f => String(f.id)));

        filmsList.innerHTML = this.films.map(film => {
            const isTop3 = top3Ids.has(String(film.id));
            const meta = [
                film.director    ? this.escapeHtml(film.director) : '',
                film.releaseYear ? String(film.releaseYear)        : '',
                isTop3           ? `${film.votes || 0} stemmen 🏆` : '',
            ].filter(Boolean).join(' • ');

            return `
            <div class="film-item">
                <div class="film-item-info">
                    <h4>${this.escapeHtml(film.title)}</h4>
                    <div class="film-item-meta">${meta}</div>
                </div>
                <div class="film-item-actions">
                    <button class="btn btn-secondary btn-small edit-film" data-id="${film.id}">Bewerk</button>
                    <button class="btn btn-danger btn-small delete-film" data-id="${film.id}">Verwijder</button>
                </div>
            </div>
        `; }).join('');

        document.querySelectorAll('.edit-film').forEach(btn => {
            btn.addEventListener('click', () => this.showEditFilmForm(btn.dataset.id));
        });

        document.querySelectorAll('.delete-film').forEach(btn => {
            btn.addEventListener('click', () => this.handleDeleteFilm(btn.dataset.id));
        });
    }

    renderReservationsList() {
        const reservationsList = document.getElementById('reservationsList');
        if (!reservationsList) return;

        if (this.reservations.length === 0) {
            reservationsList.innerHTML = '<p style="color: var(--text-light-gray);">Geen reserveringen</p>';
            return;
        }

        reservationsList.innerHTML = this.reservations.map(reservation => {
            const film = this.films.find(f => f.id === reservation.filmId);
            const filmTitle = film ? film.title : 'Onbekende film';

            return `
                <div class="film-item" style="margin-bottom: 1rem;">
                    <div class="film-item-info">
                        <h4>${this.escapeHtml(reservation.name)}</h4>
                        <div class="film-item-meta">
                            <strong>Film:</strong> ${this.escapeHtml(filmTitle)}<br>
                            <strong>Datum:</strong> ${new Date(reservation.date).toLocaleDateString('nl-NL')}<br>
                            <strong>Zitplaatsen:</strong> ${reservation.seats.join(', ')}<br>
                            <strong>Email:</strong> ${this.escapeHtml(reservation.email)}<br>
                            <strong>Totaal:</strong> €${reservation.totalPrice.toFixed(2)}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    setupDashboardListeners() {
        document.getElementById('logoutButton')?.addEventListener('click', () => {
            this.isLoggedIn = false;
            this.init();
        });

        document.getElementById('addFilmButton')?.addEventListener('click', () => {
            this.showAddFilmForm();
        });

        document.getElementById('addPlanningButton')?.addEventListener('click', () => {
            this.handleAddPlanning();
        });
    }

    showAddFilmForm() {
        const formContainer = document.getElementById('filmFormContainer');
        if (!formContainer) return;

        formContainer.innerHTML = `
            <div style="background-color: var(--secondary-dark); border: 1px solid var(--border-color); border-radius: 8px; padding: 2rem; margin-top: 2rem;">
                <h3>Nieuwe film toevoegen</h3>
                <form id="addFilmFormElement">
                    <div class="form-group">
                        <label for="filmTitle">Titel</label>
                        <input type="text" id="filmTitle" required>
                    </div>

                    <div class="form-group">
                        <label for="filmDirector">Regisseur</label>
                        <input type="text" id="filmDirector" required>
                    </div>

                    <div class="form-group">
                        <label for="filmYear">Jaar</label>
                        <input type="number" id="filmYear" required min="1900" max="2100">
                    </div>

                    <div class="form-group">
                        <label for="filmDuration">Duur (minuten)</label>
                        <input type="number" id="filmDuration" required min="1">
                    </div>

                    <div class="form-group">
                        <label for="filmGenre">Genre</label>
                        <input type="text" id="filmGenre" required placeholder="bijv. Drama, Komedie">
                    </div>

                    <div class="form-group">
                        <label for="filmRating">Rating</label>
                        <input type="number" id="filmRating" required min="0" max="10" step="0.1">
                    </div>

                    <div class="form-group">
                        <label for="filmDescription">Beschrijving</label>
                        <textarea id="filmDescription" required></textarea>
                    </div>

                    <div class="form-group">
                        <label for="filmYoutube">YouTube Trailer ID</label>
                        <input type="text" id="filmYoutube" placeholder="bijv. dQw4w9WgXcQ">
                    </div>

                    <div class="form-group">
                        <label for="filmImdb">IMDb URL</label>
                        <input type="url" id="filmImdb" placeholder="https://www.imdb.com/title/...">
                    </div>

                    <div style="display: flex; gap: 1rem;">
                        <button type="submit" class="btn btn-success">Opslaan</button>
                        <button type="button" class="btn btn-secondary" id="cancelFormButton">Annuleren</button>
                    </div>
                </form>
            </div>
        `;

        document.getElementById('addFilmFormElement')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitAddFilm();
        });

        document.getElementById('cancelFormButton')?.addEventListener('click', () => {
            formContainer.innerHTML = '';
        });
    }

    showEditFilmForm(filmId) {
        const film = this.films.find(f => String(f.id) === String(filmId));
        if (!film) return;

        const formContainer = document.getElementById('filmFormContainer');
        if (!formContainer) return;

        formContainer.innerHTML = `
            <div style="background-color: var(--secondary-dark); border: 1px solid var(--border-color); border-radius: 8px; padding: 2rem; margin-top: 2rem;">
                <h3>Film bewerken</h3>
                <form id="editFilmFormElement">
                    <div class="form-group">
                        <label for="filmTitle">Titel</label>
                        <input type="text" id="filmTitle" required value="${this.escapeHtml(film.title)}">
                    </div>

                    <div class="form-group">
                        <label for="filmDirector">Regisseur</label>
                        <input type="text" id="filmDirector" required value="${this.escapeHtml(film.director)}">
                    </div>

                    <div class="form-group">
                        <label for="filmYear">Jaar</label>
                        <input type="number" id="filmYear" required min="1900" max="2100" value="${film.releaseYear}">
                    </div>

                    <div class="form-group">
                        <label for="filmDuration">Duur (minuten)</label>
                        <input type="number" id="filmDuration" required min="1" value="${film.duration}">
                    </div>

                    <div class="form-group">
                        <label for="filmGenre">Genre</label>
                        <input type="text" id="filmGenre" required value="${this.escapeHtml(film.genre)}">
                    </div>

                    <div class="form-group">
                        <label for="filmRating">Rating</label>
                        <input type="number" id="filmRating" required min="0" max="10" step="0.1" value="${film.rating}">
                    </div>

                    <div class="form-group">
                        <label for="filmDescription">Beschrijving</label>
                        <textarea id="filmDescription" required>${this.escapeHtml(film.description)}</textarea>
                    </div>

                    <div class="form-group">
                        <label for="filmYoutube">YouTube Trailer ID</label>
                        <input type="text" id="filmYoutube" value="${this.escapeHtml(film.youtubeTrailerId || '')}">
                    </div>

                    <div class="form-group">
                        <label for="filmImdb">IMDb URL</label>
                        <input type="url" id="filmImdb" value="${this.escapeHtml(film.imdbUrl || '')}">
                    </div>

                    <div style="display: flex; gap: 1rem;">
                        <button type="submit" class="btn btn-success">Opslaan</button>
                        <button type="button" class="btn btn-secondary" id="cancelFormButton">Annuleren</button>
                    </div>
                </form>
            </div>
        `;

        document.getElementById('editFilmFormElement')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitEditFilm(filmId);
        });

        document.getElementById('cancelFormButton')?.addEventListener('click', () => {
            formContainer.innerHTML = '';
        });
    }

    async submitAddFilm() {
        const youtubeId = document.getElementById('filmYoutube').value.trim();
        const filmData = {
            title: document.getElementById('filmTitle').value,
            director: document.getElementById('filmDirector').value,
            releaseYear: parseInt(document.getElementById('filmYear').value),
            duration: parseInt(document.getElementById('filmDuration').value),
            genre: document.getElementById('filmGenre').value,
            rating: parseFloat(document.getElementById('filmRating').value),
            description: document.getElementById('filmDescription').value,
            youtubeTrailerId: youtubeId,
            imdbUrl: document.getElementById('filmImdb').value,
            posterImage: youtubeId
                ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
                : ''
        };

        try {
            await api.addFilm(filmData);
            this.films = await api.getAllFilms();
            this.renderFilmsList();
            document.getElementById('filmFormContainer').innerHTML = '';
            showToast('Film succesvol toegevoegd', 'success');
        } catch (error) {
            console.error('Error adding film:', error);
            showToast('Fout bij toevoegen van film', 'error');
        }
    }

    async submitEditFilm(filmId) {
        const filmData = {
            title: document.getElementById('filmTitle').value,
            director: document.getElementById('filmDirector').value,
            releaseYear: parseInt(document.getElementById('filmYear').value),
            duration: parseInt(document.getElementById('filmDuration').value),
            genre: document.getElementById('filmGenre').value,
            rating: parseFloat(document.getElementById('filmRating').value),
            description: document.getElementById('filmDescription').value,
            youtubeTrailerId: document.getElementById('filmYoutube').value,
            imdbUrl: document.getElementById('filmImdb').value
        };

        try {
            await api.updateFilm(filmId, filmData);
            this.films = await api.getAllFilms();
            this.renderFilmsList();
            document.getElementById('filmFormContainer').innerHTML = '';
            showToast('Film succesvol bijgewerkt', 'success');
        } catch (error) {
            console.error('Error updating film:', error);
            showToast('Fout bij bijwerken van film', 'error');
        }
    }

    async handleDeleteFilm(filmId) {
        if (!confirm('Weet je zeker dat je deze film wilt verwijderen?')) {
            return;
        }

        try {
            await api.deleteFilm(String(filmId));
            this.films = await api.getAllFilms();
            this.reservations = await api.getReservations();
            this.renderFilmsList();
            this.renderReservationsList();
            showToast('Film succesvol verwijderd', 'success');
        } catch (error) {
            console.error('Error deleting film:', error);
            showToast('Fout bij verwijderen van film', 'error');
        }
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return String(text).replace(/[&<>"']/g, m => map[m]);
    }

    showMessage(message, type = 'info') {
        showToast(message, type);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new AdminDashboard();
});
