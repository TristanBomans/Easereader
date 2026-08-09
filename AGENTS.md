# AGENTS.md — 

Dit document legt de ontwerp- en codeerfylosofie vast voor de  frontend, zodat toekomstige agents consistent blijven zonder telkens opnieuw de context te moeten reconstrueren.

## Projectcontext


- **React 19** + **TypeScript strict**
- **Vite 8**
- **Tailwind CSS 4** via `@tailwindcss/vite`
- **TanStack Query** voor server-state
- **TanStack Router** voor URL-gedreven navigatie en filters
- **Lucide React** voor iconen
- OpenAPI-client (`openapi-typescript` + `openapi-fetch`)

De app is **desktop-first maar responsive**. Filters, zoeken en paginering horen in de URL; server-data leeft in Query.

## Visuele fylosofie (t3code-geïnspireerd)

De UI is donker, ingetogen en informatiedicht. Geen grote gradients, felle glows of overdreven witruimte. De visuele hiërarchie ontstaat door:

- Zeer subtiele contrastverschillen tussen achtergrondlagen.
- Haarlijn-borders die structureel scheiden zonder zwaar aan te voelen.
- Kleur die vrijwel altijd semantisch is: status, acties, links.
- Compacte controls en dichte informatie.

### Designprincipes

1. **Donker als standaard**: bijna-zwarte neutrale achtergrond, kaarten nauwelijks lichter.
2. **Subtiele diepte**: `bg` → `surface` → `surface-elevated` → `surface-hover` zijn kleine stappen van 2–4% wit.
3. **Borders zijn structureel**, niet decoratief: 1px, laag contrast (`rgba(255,255,255,0.06)`), vaak alleen om kaarten en secties.
4. **Kleur is semantisch**:
   - `primary` voor links, focus en belangrijke acties.
   - `destructive` voor verwijderen / onherroepelijke acties.
   - `success` / `warning` / `info` voor statusbadges.
   - Vermijd willekeurige accentkleuren in tekst of iconen.
5. **Compact maar niet druk**:
   - Controls 28–32px hoog (`size="sm"`/`default`, `h-7`/`h-8`).
   - Resultaatlijsten als `divide-y` rijen met hairline-scheiding, geen boxed kaarten per item.
   - Kleinere radius op controls (`rounded-md` ≈ 6px), `rounded-lg` voor kaarten/panelen.
   - Één regel per titel, truncaten met `truncate` of `line-clamp`.
6. **Typografie**:
   - `DM Sans` met Apple/system fallbacks.
   - Body 13px/1.55, gewicht 400; koppen maximaal `font-medium` (nooit semibold/bold).
   - Labels/metadata 11–12px, tertiary info `text-text-muted`.
   - Paginatitels klein en ingetogen (`text-sm font-medium`).
   - Gebruik `tabular-nums` voor bytes, aantallen en datums.
7. **Hover/focus**:
   - Hover: lichte achtergrondverhoging (`surface-hover`, ~4% wit).
   - Focus: dunne primary ring (`box-shadow: 0 0 0 1.5px var(--color-primary)`).
   - Transities 120–180ms, `ease-out`.
8. **Respecteer `prefers-reduced-motion`** — zie `index.css`.

## Design tokens

Gedefinieerd in `frontend/src/index.css`:

| Token | Waarde | Gebruik |
|-------|--------|---------|
| `bg` | `#0a0a0a` | App-achtergrond |
| `surface` | `#111111` | Kaarten, panelen, navbar |
| `surface-elevated` | `#171717` | Innerlijke lijstitems, badges |
| `surface-hover` | `rgba(255,255,255,0.04)` | Hoverstate op rijen/knoppen |
| `border` | `rgba(255,255,255,0.06)` | Standaard borders |
| `border-strong` | `rgba(255,255,255,0.10)` | Zwaardere scheidingen |
| `text-primary` | `#f5f5f5` | Titels, primaire tekst |
| `text-secondary` | `#a3a3a3` | Subtekst, metadata |
| `text-muted` | `#525252` | Placeholders, tertiary info |
| `primary` | oklch blauw | Links, focus, primary actions |
| `destructive` | oklch rood | Verwijderen, fouten |
| `success` | oklch groen | OK, bereikbaar |
| `warning` | oklch amber | Waarschuwing, uitgeschakeld |
| `radius` | `0.625rem` (10px) | Basisradius |

Gebruik deze tokens als Tailwind-utilities (`bg-surface`, `text-text-secondary`, `border-border`, enz.). Voeg geen harde kleurcodes toe in componenten zonder goede reden.

## Componentpatronen

### Kaarten / secties

```tsx
<section className="rounded-lg border border-border bg-surface p-4">
  ...
</section>
```

- `rounded-lg` voor kaarten en panelen, `rounded-md` voor controls.
- Zoekresultaten staan in een `divide-y divide-border` lijst (geen kaart per item).
- Op de zoekpagina staat alleen de strategy-toggle (`StrategyToggle`); domeinen en overige configuratie leven uitsluitend in de settings-drawer (deep-link via `openSettings('sources')` uit `stores/settingsStore`).

### Knoppen

Gebruik de `Button`-component. Voorrang:

- `variant="secondary"` voor de meeste acties.
- `variant="default"` / `primary` voor de belangrijkste call-to-action.
- `variant="destructive"` voor verwijderen.
- `variant="ghost"` voor icoonknoppen of minder prominente acties.

Kleine acties binnen kaarten gebruiken `size="sm"`.

### Badges

- `success`: bereikbaar, ingeschakeld.
- `warning`: uitgeschakeld, pending.
- `destructive`: onbereikbaar, mislukt.
- `secondary`: neutrale status.
- `outline`: onbekend.

### Tabellen

- `w-full`, `text-left`, `text-sm`.
- Header: `bg-surface-elevated`, `text-xs uppercase text-text-secondary`.
- Rijen: `border-b border-border`, `hover:bg-surface-hover`, focus-visible styling.
- Numerieke kolommen: `tabular`.

### Formulieren / filters

- Inputs: `bg-surface`, `border-border`, `rounded-lg`, `h-9`/`h-10`.
- Labels 12px, `text-text-secondary`.
- Debounce voor zoekvelden.

### Charts

- Gebruik dezelfde kleurentokens / semantische kleuren als de rest van de UI.
- Zorg voor voldoende contrast tussen opeenvolgende segmenten.
- Lever waar zinvol een tabel- of lijstalternatief voor toegankelijkheid.

## Responsive gedrag

- **Desktop-first**: layout en spacing werken eerst op desktop, schalen naar beneden.
- Op kleine schermen:
  - Navigatie wordt icon-only (`hidden md:inline`).
  - Lange knopteksten korten in (`sm:inline` / `sm:hidden`).
  - Tabellen krijgen `overflow-x-auto`; kolommen verbergen pas als het écht nodig is.
  - Zorg dat er nooit horizontale viewport-scroll ontstaat.

## Animaties

- Gebruik `transition-colors` voor hover/focus.
- Voor grotere UI-transities (openen/sluiten panelen): `transition-all duration-300 ease-out` met `transform` en `opacity` — vermijd `width`/`height`-animaties die layout reflow veroorzaken.
- Respecteer `prefers-reduced-motion`.

## Toegankelijkheid

- Contrast moet WCAG AA halen.
- Focus-visible ringen moeten zichtbaar zijn.
- Knoppen en rijen die klikbaar zijn moeten `role`, `tabIndex`, keyboard handlers en `aria-label` hebben waar nodig.
- Geen informatie alleen via kleur overdragen.

## Wanneer je twijfelt

1. Kijk hoe een vergelijkbare pagina of component het al doet.
2. Gebruik de bestaande tokens, niet nieuwe kleurcodes.
3. Houd het donker, compact en semantisch.
4. Test op kleine viewport-breedtes.
5. Laat `npm run typecheck`, `npm run lint` en `npm test` slagen voor je commit.

## Broninspiratie

De visuele richting is los geïnspireerd op [t3code](file:///Users/tristan/Documents/Projects/t3code/apps/web/src/index.css): DM Sans, subtiele dark-mode oppervlakken, hairline borders, compacte controls en semantisch kleurgebruik. Niet letterlijk overgenomen, maar dezelfde ingetogen hiërarchie.
