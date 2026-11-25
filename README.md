# CINE GO — AI Cinematic Movie Discovery & Ticket Booking

**CINE GO** is a dark-mode, cinema-first movie discovery and ticket booking web application built with React, TypeScript, Tailwind CSS, Framer Motion, and the Google Gemini API.

---

## Key Features

### 1. Mobile Number & OTP Authentication
- Launches on a full-screen atmospheric login gate (`OtpLoginView`).
- Generates a 6-digit OTP for the entered mobile number (displayed via an on-screen SMS notification banner with one-click Auto-Fill and resend timer).
- Transitions smoothly into the Home discovery stage after verification.

### 2. Cinematic Discovery Interface
- **Atmospheric Reactive Backdrop (`AmbientBackdrop`):** Full-viewport charcoal canvas (`#09090c`) with blurred artwork that cross-fades dynamically to match the hovered poster or active film, framed by subtle vertical architectural hairlines.
- **Interactive Vertical-Slice Poster Gallery (`VerticalPosterGallery`):** Staggered tall portrait poster slices that smoothly widen and elevate on hover while neighboring slices compress and dim. Adapts into a swipeable horizontal carousel on mobile screens.
- **Spotlight Left Sidebar (`SidebarNav`):** Minimal left navigation (`HOME`, `MOVIES`, `NOW SHOWING`, `COMING SOON`, `CATEGORIES`, `MY BOOKINGS`, `MY LIST`) featuring the same accordion-spotlight hover physics and gliding active indicator.
- **Distinct Home vs. Categories:** **HOME** highlights Now Showing films alongside location detection and the Gemini AI Concierge, while **CATEGORIES** showcases 8 genre portals (*Action & Adventure, Animation, Thriller, Sci-Fi, Drama, Crime, Horror, History*).

### 3. Live Location & Gemini AI Cinema Concierge
- **Location Detection (`HomeConciergeBar`, `locationAndAi.ts`):** Uses browser Geolocation + OpenStreetMap Nominatim reverse geocoding (with preset city fallbacks) to tailor nearby theatres and distances.
- **Gemini AI Assistant (`geminiAi.ts`):** Powered by Google Gemini (`gemini-3-flash-preview` / `gemini-flash-lite-latest`, with automatic local fallback). Enter any movie title—catalog or external (e.g., *Orbit Zero*, *Interstellar*)—or natural-language query to view:
  - Recommended **Best Screen** format (`IMAX 2D`, `Dolby Atmos`, `4DX`, `Laser 2D`) and reasoning
  - All today's **Show Timings** across nearby theatres
  - Live **Vacant Seat Counts** and **AI Best Vacant Seats** (`Row G` / `Row F` acoustic sweet-spot) with one-click reservation
- Clicking outside the AI panel, pressing `Escape`, or clearing the input closes the AI section and returns cleanly to Home.

### 4. Instant Search, Movie Details & Trailer Preview
- **Search (`SearchOverlay`):** Filters in real time by movie title, actor, director, genre, language, or screening format.
- **Cinematic Detail View (`MovieDetailModal`):** Shows synopsis, cast & crew, ratings, duration, language, AI match notes, `+ My List` watchlist toggle, and an embedded **Watch Trailer** preview modal.

### 5. Amphitheater Seat Selection, UPI Payment QR & Scannable Ticket Passes
- **Booking Stage (`BookingSessionView`):** Full-screen dark cinema hall layout (`Row I` to `Row A`) with inline Theatre, Date, and Showtime selectors, real-time seat states (`Available`, `Selected`, `Booked`, `Sold out`), **AI Best Seat Pick**, and live price breakdown.
- **Payment QR Checkout (`PaymentSectionModal`):** Generates a scannable `upi://pay` QR code containing the transaction reference, seat details, and total amount so scanning opens mobile payment apps (*Google Pay*, *PhonePe*, *Paytm*, *BHIM*, or any UPI app), plus direct app deep-links.
- **Digital E-Tickets (`BookingsAndListView`, `TicketQrPass`):** Every confirmed booking is saved to **My Bookings**. Clicking any ticket opens a full scannable **QR Ticket Pass** encoding pass ID, movie, theatre, date, showtime, format, and booked seats, along with an interactive **Preview Scanned Ticket Data** toggle.

---

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`)
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **QR Generation:** `qrcode`
- **AI Integration:** Google Gemini Generative Language REST API

---

## Project Structure

```text
├── public/
│   └── posters/                 # Local 9:16 vertical cinematic poster assets
├── src/
│   ├── components/
│   │   ├── AccountSettingsModal.tsx
│   │   ├── AmbientBackdrop.tsx
│   │   ├── BookingsAndListView.tsx
│   │   ├── BookingSessionView.tsx
│   │   ├── HomeConciergeBar.tsx
│   │   ├── MovieDetailModal.tsx
│   │   ├── OtpLoginView.tsx
│   │   ├── PaymentSectionModal.tsx
│   │   ├── SearchOverlay.tsx
│   │   ├── SidebarNav.tsx
│   │   ├── TicketQrPass.tsx
│   │   ├── TopBar.tsx
│   │   └── VerticalPosterGallery.tsx
│   ├── data/
│   │   └── movies.ts            # Curated movie catalog, categories, dates & theatres
│   ├── services/
│   │   ├── geminiAi.ts          # Gemini API integration & structured response builder
│   │   └── locationAndAi.ts     # Geolocation, local theatre mapping & fallback AI engine
│   ├── types/
│   │   └── cinema.ts            # TypeScript interfaces
│   ├── utils/
│   │   └── seating.ts           # Amphitheater seat map & AI sweet-spot seat selector
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── vite-env.d.ts
├── index.html
├── package.json
└── vite.config.ts
```

---

## Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Environment Setup

Create a `.env.local` file in the project root and add your Gemini API key:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

> **Security Note:** `.env.local` is ignored by `.gitignore`. For public production deployments, proxy Gemini API requests through a backend service instead of exposing the API key in client-side builds.

### Development Server

```bash
npm run dev
```

Open `http://localhost:5173/` in your browser.

### Production Build

```bash
npm run build
npm run preview
```
