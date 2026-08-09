# Easereader new UI specification

## Goal

Rebuild the removed Easereader frontend against the existing backend without
changing the user-facing capabilities. The UI should be responsive, accessible,
and usable on desktop and mobile. It may be built in any frontend stack; keep API
access in a small client layer so backend errors and request parameters are
handled consistently.

## Main experience

### Search

- Start with a prominent search field accepting title, author, or ISBN and a
  Search button. Enter submits the form.
- On submit, show a loading state, prevent duplicate submissions, and request
  `GET /api/search` with `q`, `strategy`, `zlibraryUrl`, and `sourceUrl`.
- Default to the `source` strategy (Anna's Archive) unless the user has a valid
  saved preference.
- Clearly render empty, loading, and error states.
- Render each result with cover (or fallback), title, author, publisher,
  language, year, extension, file size, rating/quality when supplied, and a link
  to the source detail page.
- Clicking the result downloads the EPUB via `GET /api/download`. Clicking the
  external detail link or a profile action must not trigger the row download.
- The backend only returns EPUB results. Do not imply that other formats work.

Typical result shape:

```json
{
  "title": "Book title",
  "author": "Author",
  "publisher": "Publisher",
  "language": "English",
  "year": "2024",
  "extension": "EPUB",
  "filesize": "2 MB",
  "rating": "4.5",
  "quality": "5.0",
  "cover": "https://...",
  "dl": "strategy-specific download id",
  "strategy": "source",
  "url": "https://..."
}
```

### Book sources

- Load options from `GET /api/book-sources`; never hard-code selectable URLs.
- Let the user choose one active strategy and one domain for each strategy:
  `zlibrary` or `source` (the API group for source domains is named
  `AnnasArchive`).
- Explain the trade-off: Z-Library is faster but less stable; Anna's Archive is
  slower and may require a countdown, but is generally more stable.
- Persist this object in local storage under `easereader.bookSources`:

```json
{
  "strategy": "source",
  "zlibraryUrl": "https://articles.sk",
  "sourceUrl": "https://annas-archive.gl"
}
```

- Validate saved URLs against the latest response from `/api/book-sources` and
  fall back to the first allowed URL when an old choice disappears.
- Send both source URLs on every search, download, and send request; the backend
  validates both values even though only the active strategy is used.
- If a source selection changes while results are visible, regenerate their
  download URLs.

### Direct download

Build the URL with `dl`, `title`, `strategy`, `zlibraryUrl`, and `sourceUrl`:

```text
GET /api/download?dl=...&title=...&strategy=...&zlibraryUrl=...&sourceUrl=...
```

The response is an EPUB attachment. Error responses are JSON. Important cases:

- `400`: invalid strategy, download id, or source URL.
- `429`: a source returned HTML instead of a book; the payload can contain
  `htmlPreviewId`.
- `503`: temporary upstream failure; `retrySuggested` and
  `puppeteerRestarted` can be true.

### Send to a reading device

- Load profiles before or alongside search results with `GET /api/profiles`.
- Show one compact avatar action per profile on every result. Use `imagePath` if
  present; otherwise use deterministic initials and color.
- On activation, call `POST /api/send` with JSON:

```json
{
  "dl": "download id",
  "title": "Book title",
  "profileId": "profile UUID",
  "strategy": "source",
  "zlibraryUrl": "https://articles.sk",
  "sourceUrl": "https://annas-archive.gl"
}
```

- Give the individual action pending, success, and failure states. Prevent an
  accidental direct download when this action is used.
- Display the backend's `error` message. When `retrySuggested` is true, describe
  it as temporary. If `htmlPreviewId` is present, offer a clearly labelled debug
  action opening `GET /api/debug/html/:id` in a new tab. Debug previews expire
  after roughly 30 minutes and may contain untrusted upstream HTML.

### Live download progress

- Connect to `ws(s)://<host>/ws/download-progress` and reconnect after a dropped
  connection with a short delay.
- Ignore the initial `connected` message and process messages with
  `type: "download_progress"`.
- Match `bookId` to the result's `dl` value and show a timestamped per-book log.
- Support these stages: `download_page_loaded`, `timer` (includes
  `waitSeconds`), `download_started`, and `download_finished`.
- Progress is broadcast to every connected client and has no operation ID. Do
  not claim it is private to the current user; matching by book ID is the best
  available correlation.

## Settings

Use a modal, drawer, or dedicated settings screen with sections for How it
works, Book sources, Senders, and Profiles. It must be keyboard operable, close
with an explicit close control, and work comfortably on narrow screens.

### SMTP senders

Sender response shape (the password is always masked):

```json
{
  "id": "UUID",
  "type": "smtp",
  "user": "sender@example.com",
  "host": "smtp.example.com",
  "port": 587,
  "secure": false,
  "password": "••••••"
}
```

Implement:

- List: `GET /api/senders`.
- Create: `POST /api/senders` with JSON fields `user`, `host`, `port`, `secure`,
  and `password`.
- Edit: `PUT /api/senders/:id`. Keep the masked password unchanged or omit an
  empty password so the stored secret is retained.
- Delete: `DELETE /api/senders/:id`, after warning that linked profiles are also
  deleted.
- Optional but supported test action: `POST /api/senders/:id/test` with
  `{ "destEmail": "..." }`.

Provide presets that only fill the form; the request remains normal SMTP:

| Provider | Host | Port | Secure |
| --- | --- | ---: | --- |
| Google | `smtp.gmail.com` | 465 | yes |
| Outlook | `smtp-mail.outlook.com` | 587 | no |
| Yahoo | `smtp.mail.yahoo.com` | 465 | yes |
| iCloud | `smtp.mail.me.com` | 587 | no |

Also provide Custom. Explain that Google commonly requires an app password.
Validate required fields client-side, but always surface backend validation.

### Profiles

A profile represents a destination device address plus the sender to use.

```json
{
  "id": "UUID",
  "name": "My Kindle",
  "destEmail": "device@kindle.com",
  "senderId": "sender UUID",
  "imagePath": "/uploads/file.jpg",
  "senderLabel": "sender@example.com"
}
```

Implement:

- List: `GET /api/profiles`.
- Create: `POST /api/profiles` as `multipart/form-data` with `name`,
  `destEmail`, `senderId`, and optional `image`.
- Edit: `PUT /api/profiles/:id` using the same multipart fields. Omitting an
  image retains the current image.
- Delete: `DELETE /api/profiles/:id` after confirmation.
- Preview a selected image before save. Accepted uploads are images up to 5 MiB.
- Disable profile creation or explain the dependency when there are no senders.
- Refresh profile actions on visible results immediately after create, edit, or
  delete.

## API and state rules

- Assume same-origin relative URLs by default. If the UI is hosted separately,
  the backend will need an explicit CORS policy before deployment.
- Treat every non-2xx response as a failure even if JSON parsing fails. Prefer
  the JSON `error` property when present.
- Do not store SMTP passwords in browser storage or client state longer than the
  active form needs them.
- Escape or render as text all book metadata and backend error messages. Source
  websites provide untrusted content.
- Preserve unsaved form input during unrelated data refreshes where practical.
- Use confirmation for destructive actions and announce async results to screen
  readers (`aria-live` or equivalent).

## Responsive and accessibility acceptance criteria

- Full functionality at phone and desktop widths; results and settings must not
  overflow horizontally.
- All actions are reachable by keyboard with visible focus states.
- Icon-only controls have accessible names and useful tooltips where helpful.
- Loading indicators are accompanied by text or an accessible status label.
- Covers have meaningful alt text or are correctly marked decorative.
- Form controls have persistent labels, validation messages, and sensible input
  types/autocomplete attributes.
- Colors meet WCAG AA contrast and are never the sole indication of status.
- Respect reduced-motion preferences.

## Suggested implementation order

1. Create the app shell, API client, global error/toast handling, and source
   preference store.
2. Implement search, results, and direct downloads.
3. Implement sender and profile management, including uploads.
4. Add send-to-profile actions and live WebSocket progress.
5. Add empty/error/retry/debug states, responsive behavior, and accessibility.
6. Test all flows against both source strategies and in a production Docker
   build.

## Definition of done

- No legacy frontend files or styles are copied into this project.
- Every API endpoint described above has a working UI flow or an intentionally
  documented debug-only use.
- Search, direct download, email delivery, sender CRUD, profile CRUD, source
  persistence, and live progress work on desktop and mobile.
- Backend errors are visible and actionable, secrets are not exposed, and the UI
  passes keyboard and basic screen-reader checks.
