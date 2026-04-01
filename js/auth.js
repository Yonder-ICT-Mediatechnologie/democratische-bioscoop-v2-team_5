// ============================================
// Democratische Bioscoop - Authenticatie Module
// ============================================

const auth = {

    // ── Storage helpers ──────────────────────────────────────────────

    getUsers: () =>
        JSON.parse(localStorage.getItem('bioscoop_users')) || [],

    saveUsers: (users) =>
        localStorage.setItem('bioscoop_users', JSON.stringify(users)),

    getSession: () =>
        JSON.parse(localStorage.getItem('bioscoop_session')) || null,

    saveSession: (session) =>
        localStorage.setItem('bioscoop_session', JSON.stringify(session)),

    clearSession: () =>
        localStorage.removeItem('bioscoop_session'),

    getUserVotes: () =>
        JSON.parse(localStorage.getItem('bioscoop_user_votes')) || {},

    saveUserVotes: (votes) =>
        localStorage.setItem('bioscoop_user_votes', JSON.stringify(votes)),

    // ── Status ────────────────────────────────────────────────────────

    isLoggedIn: () => !!auth.getSession(),

    getCurrentUser: () => auth.getSession(),

    // ── Registreren ───────────────────────────────────────────────────

    register: (username, email, password) => {
        const users = auth.getUsers();

        if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
            return { error: 'Dit e-mailadres is al in gebruik.' };
        }
        if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
            return { error: 'Deze gebruikersnaam is al in gebruik.' };
        }
        if (username.trim().length < 2) {
            return { error: 'Gebruikersnaam moet minimaal 2 tekens lang zijn.' };
        }
        if (password.length < 4) {
            return { error: 'Wachtwoord moet minimaal 4 tekens lang zijn.' };
        }

        const user = {
            id: 'USR-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
            username: username.trim(),
            email: email.trim().toLowerCase(),
            password: password,
            createdAt: new Date().toISOString()
        };

        users.push(user);
        auth.saveUsers(users);
        return { success: true, user };
    },

    // ── Inloggen ─────────────────────────────────────────────────────

    login: (email, password) => {
        const users = auth.getUsers();
        const user = users.find(
            u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
        );
        if (!user) {
            return { error: 'Onjuist e-mailadres of wachtwoord.' };
        }
        const session = {
            userId: user.id,
            username: user.username,
            email: user.email,
            loggedInAt: new Date().toISOString()
        };
        auth.saveSession(session);
        return { success: true, user };
    },

    // ── Uitloggen ────────────────────────────────────────────────────

    logout: () => {
        auth.clearSession();
        window.location.href = 'index.html';
    },

    // ── Stemmen bijhouden ─────────────────────────────────────────────

    hasVoted: (userId) => {
        const votes = auth.getUserVotes();
        return votes.hasOwnProperty(userId);
    },

    getVotedFilmId: (userId) => {
        const votes = auth.getUserVotes();
        return votes[userId] || null;
    },

    recordVote: (userId, filmId) => {
        const votes = auth.getUserVotes();
        votes[userId] = filmId;
        auth.saveUserVotes(votes);
    },

    // ── Nav injecteren ────────────────────────────────────────────────

    renderNav: () => {
        const navItem = document.getElementById('auth-nav');
        if (!navItem) return;

        const session = auth.getSession();
        if (session) {
            navItem.innerHTML = `
                <span class="nav-user">👤 ${authEscapeHtml(session.username)}</span>
                <a href="#" class="nav-logout" id="logoutBtn">Uitloggen</a>
            `;
            document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
                e.preventDefault();
                auth.logout();
            });
        } else {
            navItem.innerHTML = `<a href="login.html">Inloggen</a>`;
        }
    }
};

function authEscapeHtml(text) {
    if (!text) return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

// Render nav zodra de DOM geladen is
document.addEventListener('DOMContentLoaded', () => auth.renderNav());
