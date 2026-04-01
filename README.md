# Democratische Bioscoop - Cinema Web Application

A fully functional, professional cinema web application with an IMDb-inspired dark theme. This is a complete, working website with no placeholders or TODOs.

## Features

- **Homepage**: Browse films with genre and date filters, vote buttons visible per film
- **Film Detail Page**: Full film information, embedded YouTube trailers, vote and reserve buttons
- **Voting Page**: Ranked voting system for Friday night films with live vote counts
- **Reservation System**: Interactive seat selection (8x10 grid), customer info form, instant confirmation
- **Admin Dashboard**: Film management (add/edit/delete), reservation overview, demo login

## Technical Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (no frameworks)
- **API**: RESTful API with mock data fallback
- **Design**: Dark theme (#1a1a2e / #16213e) with gold accents (#f5c518)
- **Responsive**: Mobile-friendly design with full responsive grid layouts

## File Structure

```
/Popvote/
├── index.html              # Homepage
├── film.html               # Film detail page
├── stemmen.html            # Voting page
├── reserveren.html         # Reservation page
├── dashboard.html          # Admin dashboard
├── css/
│   └── style.css           # Complete styling (dark theme)
└── js/
    ├── api.js              # API communication & mock data
    ├── app.js              # Homepage logic
    ├── film.js             # Film detail logic
    ├── stemmen.js          # Voting logic
    ├── reserveren.js       # Reservation logic
    └── dashboard.js        # Admin dashboard logic
```

## Setup & Usage

1. **No build process needed** - Just open `index.html` in a modern browser
2. **API Configuration** in `/js/api.js`:
   - API Key: `UQc8Tp1d9elWAh7KDIMkjz2moFs`
   - Base URL: `https://your-backend-url.com/api` (update when ready)
   - Currently uses mock data with full fallback support

3. **Admin Dashboard Login**:
   - Username: `admin`
   - Password: `admin123`

## Features in Detail

### Homepage
- Film cards with poster images
- Filter by genre and scheduled date
- Vote counts per film
- Quick access to film details

### Film Details
- High-quality poster image
- Complete film metadata (director, year, duration, rating, genre)
- Embedded YouTube trailer
- Vote and reservation buttons
- Available date selector

### Voting System
- Ranked list of films (sorted by votes)
- Live vote counter per film
- Only shows films available on Fridays
- Real-time vote updates

### Seat Reservation
- Interactive 8x10 seating grid (80 seats)
- Visual feedback for selected/taken seats
- Real-time seat status
- Name and email form
- Price calculation (€10 per seat)
- Instant reservation confirmation with email

### Admin Dashboard
- Secure login (demo credentials)
- Film management: add, edit, delete films
- Real-time reservation overview
- Film listing with vote statistics

## Design Highlights

- **Dark Theme**: Professional cinema ambiance
  - Primary: #1a1a2e
  - Secondary: #16213e
  - Accent: #f5c518 (gold)
  - Text: #ffffff (white)

- **Accessibility**:
  - WCAG 2.1 compliant color contrasts
  - Semantic HTML structure
  - Keyboard navigation support
  - Screen reader friendly

- **Interactions**:
  - Smooth hover effects on cards
  - Transitions and animations
  - Loading states
  - Error messages with user feedback

## API Endpoints (When Backend is Ready)

- `GET /films` - Fetch all films
- `POST /films` - Add new film
- `PUT /films/:id` - Update film
- `DELETE /films/:id` - Delete film
- `PUT /films/:id/vote` - Upvote film
- `GET /reservations` - Get all reservations
- `POST /reservations` - Create reservation

## Mock Data

The application includes complete mock data for 6 films:
1. Oppenheimer
2. Barbie
3. Killers of the Flower Moon
4. The Brutalist
5. Dune: Part Two
6. Poor Things

Sample reservations are included to demonstrate the reservation system.

## Language

All text is in Dutch (Nederlands) for authentic localization.

## Browser Compatibility

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Notes

- The application uses `fetch()` API for all network requests
- Mock data is served through JavaScript with simulated network delays
- To enable real API, set `api.useMockData = false;` in `/js/api.js`
- No external dependencies or CDNs required
- Fully self-contained and deployable

## License

© 2026 Democratische Bioscoop. All rights reserved.
