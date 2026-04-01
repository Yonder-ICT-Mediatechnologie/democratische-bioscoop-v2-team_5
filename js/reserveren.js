// Democratische Bioscoop - Reservation Page Logic

class ReservationPage {
    constructor() {
        this.film = null;
        this.selectedDate = null;
        this.selectedSeats = [];
        this.takenSeats = [];
        this.allSeats = [];
        this.init();
    }

    async init() {
        this.setupActiveNavLink();
        this.getParametersFromUrl();

        // Geen filmId in URL → toon uitleg i.p.v. foutmelding
        if (!this.filmId) {
            this.showNoFilmSelected();
            return;
        }

        await this.loadFilm();

        if (!this.film) {
            this.showError('Film niet gevonden. Ga terug naar de homepagina en klik op "Details" bij een film.');
            return;
        }

        await this.loadTakenSeats();
        this.renderFilmDateHeader();
        this.setupSeatingChart();
        this.setupFormListeners();
    }

    setupActiveNavLink() {
        const navLinks = document.querySelectorAll('nav a');
        navLinks.forEach(link => {
            if (link.textContent.trim() === 'Reserveren' || link.href.includes('reserveren.html')) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    getParametersFromUrl() {
        const params = new URLSearchParams(window.location.search);
        const raw = params.get('filmId');
        this.selectedDate = params.get('date');

        if (raw && raw !== 'undefined' && raw !== 'null') {
            // Ondersteuning voor zowel numerieke als string IDs (_id van MongoDB)
            const asNum = Number(raw);
            this.filmId = isNaN(asNum) ? raw : asNum;
        }
    }

    async loadFilm() {
        try {
            const films = await api.getAllFilms();
            // Vergelijk als string zodat zowel "83BsT4p4bV2nMIv7" als 5 werkt
            this.film = films.find(f => String(f.id) === String(this.filmId));
        } catch (error) {
            console.error('Error loading film:', error);
        }
    }

    async showNoFilmSelected() {
        const mainElement = document.querySelector('main');
        if (!mainElement) return;

        // Laad films zodat de gebruiker er direct één kan kiezen
        let films = [];
        try {
            films = await api.getAllFilms();
        } catch (e) {
            console.error('Fout bij laden films:', e);
        }

        const filmOptions = films.length > 0
            ? films.map(f => `<option value="${f.id}">${f.title || f.titel || 'Onbekende film'}</option>`).join('')
            : '<option disabled>Geen films beschikbaar</option>';

        mainElement.innerHTML = `
            <div class="container" style="padding: 3rem 0;">
                <h2>Reserveer kaartjes</h2>
                <div style="background-color: var(--secondary-dark); border: 1px solid var(--border-color); border-radius: 8px; padding: 2rem; max-width: 500px; margin: 0 auto;">
                    <h3 style="color: var(--accent-gold); margin-bottom: 1.5rem;">Kies een film</h3>
                    <div class="form-group">
                        <label for="filmSelect">Film</label>
                        <select id="filmSelect">
                            <option value="">-- Selecteer een film --</option>
                            ${filmOptions}
                        </select>
                    </div>
                    <div class="form-group" id="dateGroup" style="display:none;">
                        <label for="dateSelect">Datum</label>
                        <select id="dateSelect">
                            <option value="">-- Selecteer een datum --</option>
                        </select>
                    </div>
                    <button id="goReserveBtn" class="btn btn-success btn-large" style="width:100%;" disabled>
                        Ga naar reservering
                    </button>
                </div>
            </div>
        `;

        const filmSelect = document.getElementById('filmSelect');
        const dateGroup = document.getElementById('dateGroup');
        const dateSelect = document.getElementById('dateSelect');
        const goBtn = document.getElementById('goReserveBtn');

        filmSelect.addEventListener('change', () => {
            const selected = films.find(f => String(f.id) === String(filmSelect.value));
            dateGroup.style.display = 'none';
            dateSelect.innerHTML = '<option value="">-- Selecteer een datum --</option>';
            goBtn.disabled = true;

            if (selected && selected.scheduledDates && selected.scheduledDates.length > 0) {
                selected.scheduledDates.forEach(date => {
                    const opt = document.createElement('option');
                    opt.value = date;
                    opt.textContent = new Date(date).toLocaleDateString('nl-NL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                    dateSelect.appendChild(opt);
                });
                dateGroup.style.display = 'block';
            } else if (selected) {
                // Geen datums gepland — melding tonen, knop blijft uit
                dateGroup.style.display = 'block';
                dateSelect.innerHTML = '<option value="" disabled>Geen voorstellingen gepland voor deze film</option>';
                goBtn.disabled = true;
            }
        });

        dateSelect.addEventListener('change', () => {
            goBtn.disabled = !dateSelect.value;
        });

        goBtn.addEventListener('click', () => {
            const filmId = filmSelect.value;
            const date = dateSelect.value;
            if (!filmId || !date) return;
            window.location.href = `reserveren.html?filmId=${filmId}&date=${date}`;
        });
    }

    renderFilmDateHeader() {
        const header = document.getElementById('filmDateHeader');
        if (!header || !this.film) return;

        const title = this.escapeHtml(this.film.title || '');
        const dateDisplay = this.selectedDate
            ? new Date(this.selectedDate).toLocaleDateString('nl-NL', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
              })
            : '';

        header.innerHTML = `
            <div style="margin-bottom: 0.75rem;">
                <a href="film.html?id=${this.filmId}" style="
                    color: var(--text-light-gray);
                    text-decoration: none;
                    font-size: 0.9rem;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.4rem;
                    transition: color 0.2s;
                " onmouseover="this.style.color='var(--accent-gold)'" onmouseout="this.style.color='var(--text-light-gray)'">
                    &#8592; Terug naar film
                </a>
            </div>
            <div style="
                background-color: var(--secondary-dark);
                border: 1px solid var(--accent-gold);
                border-radius: 8px;
                padding: 1.25rem 1.75rem;
                margin-bottom: 1.5rem;
                display: flex;
                gap: 2rem;
                flex-wrap: wrap;
                align-items: center;
            ">
                <div>
                    <div style="font-size: 0.8rem; color: var(--text-light-gray); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.25rem;">Film</div>
                    <div style="font-size: 1.2rem; font-weight: bold; color: var(--accent-gold);">${title}</div>
                </div>
                ${dateDisplay ? `
                <div style="border-left: 2px solid var(--border-color); padding-left: 2rem;">
                    <div style="font-size: 0.8rem; color: var(--text-light-gray); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.25rem;">Datum</div>
                    <div style="font-size: 1.2rem; font-weight: bold; color: var(--text-white);">${dateDisplay}</div>
                </div>` : ''}
            </div>
        `;
    }

    async loadTakenSeats() {
        try {
            this.takenSeats = await api.getTakenSeats(this.film.id, this.selectedDate);
        } catch (error) {
            console.error('Error loading taken seats:', error);
        }
    }

    setupSeatingChart() {
        const seatsContainer = document.getElementById('seatsContainer');
        if (!seatsContainer) return;

        const rows = 'ABCDEFGH'.split('');
        const seatsHtml = rows.map(row => {
            let rowHtml = `<div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem; align-items: center;">`;
            rowHtml += `<div class="row-label">${row}</div><div style="display: grid; grid-template-columns: repeat(10, 1fr); gap: 0.5rem;">`;

            for (let i = 1; i <= 10; i++) {
                const seatLabel = `${row}${i}`;
                const isTaken = this.takenSeats.includes(seatLabel);

                this.allSeats.push(seatLabel);

                rowHtml += `
                    <button
                        type="button"
                        class="seat ${isTaken ? 'seat-taken' : ''}"
                        data-seat="${seatLabel}"
                        ${isTaken ? 'disabled' : ''}
                        title="${seatLabel}">
                        ${i}
                    </button>
                `;
            }

            rowHtml += '</div></div>';
            return rowHtml;
        }).join('');

        seatsContainer.innerHTML = seatsHtml;

        // Setup seat click listeners
        document.querySelectorAll('.seat:not(.seat-taken)').forEach(seatButton => {
            seatButton.addEventListener('click', () => this.toggleSeat(seatButton));
        });

        // Add legend
        this.addSeatsLegend();
    }

    addSeatsLegend() {
        const legendContainer = document.getElementById('seatsLegend');
        if (!legendContainer) return;

        legendContainer.innerHTML = `
            <div class="seats-legend">
                <div class="legend-item">
                    <div class="legend-box legend-available"></div>
                    <span>Beschikbaar</span>
                </div>
                <div class="legend-item">
                    <div class="legend-box legend-selected"></div>
                    <span>Gekozen</span>
                </div>
                <div class="legend-item">
                    <div class="legend-box legend-taken"></div>
                    <span>Bezet</span>
                </div>
            </div>
        `;
    }

    toggleSeat(seatButton) {
        const seatLabel = seatButton.dataset.seat;

        if (seatButton.classList.contains('seat-selected')) {
            seatButton.classList.remove('seat-selected');
            this.selectedSeats = this.selectedSeats.filter(s => s !== seatLabel);
        } else {
            seatButton.classList.add('seat-selected');
            this.selectedSeats.push(seatLabel);
        }

        this.updateReservationSummary();
    }

    updateReservationSummary() {
        const summaryContainer = document.getElementById('reservationSummary');
        if (!summaryContainer) return;

        const totalPrice = api.calculatePrice(this.selectedSeats.length);
        const seatsDisplay = this.selectedSeats.length > 0 ? this.selectedSeats.join(', ') : 'Geen zitplaatsen gekozen';
        const dateDisplay = this.selectedDate ? new Date(this.selectedDate).toLocaleDateString('nl-NL', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) : '';

        summaryContainer.innerHTML = `
            <div class="summary-box">
                <div class="summary-title">Reserveringsoverzicht</div>
                <div class="summary-item">
                    <span class="summary-label">Film</span>
                    <span class="summary-value">${this.escapeHtml(this.film?.title || '')}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Datum</span>
                    <span class="summary-value">${dateDisplay}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Zitplaatsen</span>
                    <span class="summary-value">${seatsDisplay}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Aantal zitplaatsen</span>
                    <span class="summary-value">${this.selectedSeats.length}</span>
                </div>
                <div style="border-top: 2px solid var(--accent-gold); padding-top: 1rem; margin-top: 1rem;">
                    <div class="summary-item">
                        <span class="summary-label">Totaal</span>
                        <span class="summary-value" style="font-size: 1.5rem;">€ ${totalPrice.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        `;

        // Enable/disable submit button
        const submitButton = document.getElementById('submitReservation');
        if (submitButton) {
            submitButton.disabled = this.selectedSeats.length === 0;
        }
    }

    setupFormListeners() {
        const form = document.getElementById('reservationForm');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitReservation();
        });
    }

    async submitReservation() {
        const nameInput = document.getElementById('customerName');
        const emailInput = document.getElementById('customerEmail');

        if (!nameInput || !emailInput) {
            showToast('Formulier niet correct', 'error');
            return;
        }

        const name = nameInput.value.trim();
        const email = emailInput.value.trim();

        if (!name || !email) {
            showToast('Vul alstublieft alle velden in', 'warning');
            return;
        }

        if (this.selectedSeats.length === 0) {
            showToast('Selecteer alstublieft zitplaatsen', 'warning');
            return;
        }

        try {
            const reservationData = {
                filmId: this.film.id,
                name,
                email,
                seats: this.selectedSeats,
                date: this.selectedDate,
                totalPrice: api.calculatePrice(this.selectedSeats.length)
            };

            const reservation = await api.createReservation(reservationData);

            this.showReservationConfirmation(reservation);
        } catch (error) {
            console.error('Error creating reservation:', error);
            showToast('Fout bij reservering', 'error');
        }
    }

    showReservationConfirmation(reservation) {
        const mainElement = document.querySelector('main');
        if (!mainElement) return;

        const dateDisplay = new Date(this.selectedDate).toLocaleDateString('nl-NL', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        mainElement.innerHTML = `
            <div class="container">
                <div class="alert alert-success" style="margin-bottom: 2rem;">
                    <h3>Reservering bevestigd!</h3>
                    <p>Uw reservering is succesvol gemaakt.</p>
                </div>

                <div class="summary-box">
                    <div class="summary-title">Reserveringsgegevens</div>
                    <div class="summary-item">
                        <span class="summary-label">Confirmatie ID</span>
                        <span class="summary-value">#${reservation.id}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Film</span>
                        <span class="summary-value">${this.escapeHtml(this.film.title)}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Datum</span>
                        <span class="summary-value">${dateDisplay}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Naam</span>
                        <span class="summary-value">${this.escapeHtml(reservation.name)}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Email</span>
                        <span class="summary-value">${this.escapeHtml(reservation.email)}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Zitplaatsen</span>
                        <span class="summary-value">${reservation.seats.join(', ')}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Totaal</span>
                        <span class="summary-value">€ ${reservation.totalPrice.toFixed(2)}</span>
                    </div>
                </div>

                <div style="margin-top: 2rem; text-align: center;">
                    <p style="color: var(--text-light-gray); margin-bottom: 1.5rem;">
                        Een bevestigingsmail wordt verzonden naar ${this.escapeHtml(reservation.email)}
                    </p>
                    <a href="index.html" class="btn btn-large">Terug naar home</a>
                </div>
            </div>
        `;
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
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
    new ReservationPage();
});
