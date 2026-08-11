import typography from '@tailwindcss/typography'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        // Koppen: Instrument Serif. Smal display-font, blijft passen op weinig
        // breedte (± 30% smaller dan Newsreader bij gelijke leesgrootte).
        serif: ['Instrument Serif', 'Georgia', 'serif'],
        // Cijfers: Newsreader, niet Instrument Serif. Instrument Serif heeft geen
        // tabular figures (een "0" is 2x breder dan een "1"), waardoor bedragen
        // die live veranderen (KPI's, slider-waarden) zichtbaar springen. Getest
        // en bevestigd op 11 augustus 2026, zie DESIGN_SYSTEM.md-aanvulling.
        numeric: ['Newsreader', 'Georgia', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        // Moodboard-basispalet (DESIGN_SYSTEM.md §1)
        ink: '#29392E',
        warmwhite: '#EBE9E6',
        morning: '#DDE6EE',
        stone: '#95A1A6',
        sand: '#C7BCA9',
        // Afgeleide werkkleuren
        canvas: '#E4E1DC',
        panel: '#F7F6F4',
        field: '#FFFDFA',
        line: '#DAD5CD',
        'line-soft': '#E4E1DC',
        body: '#4C5A50',
        muted: '#6E7F72',
        'on-dark': '#C0CBC3',
        signal: '#A85A3C',
        // Datakleuren: doorgetrokken uit ochtendblauw (208°) en zand (38°),
        // donker genoeg voor grafiekvlakken en categorie-markeringen.
        // Contrast op paneel #F7F6F4: 500 = 4,04:1 · 700 = 6,75:1 · sand-deep = 3,37:1.
        // data-100 en data-300 uitsluitend als grafiekvlak, nooit als los UI-element.
        'data-100': '#B6C8D8',
        'data-300': '#83A0B9',
        'data-500': '#527898',
        'data-700': '#3B5972',
        'sand-deep': '#9A835B',
      },
    },
  },
  plugins: [typography],
}
