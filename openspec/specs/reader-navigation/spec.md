## ADDED Requirements

### Requirement: Reader top bar with navigation, discovery, and mode controls
The reader page SHALL display a fixed top bar (height 48 px) always visible while reading. The top bar contains (left to right):

**Left zone:**
1. **"Mi Biblioteca" button** — chevron-left icon + "Mi Biblioteca" text (hidden on xs screens). Navigates to `/library`.
2. **"Colección General" button** — books-stack icon + "Colección General" text (hidden on xs screens). Navigates to `/discover`.

**Center zone:** Book title, truncated to one line.

**Right zone (controls):** A− / A+ font size, dark mode toggle, audio mode toggle (when `hasAudio`), chapters list (when `hasChapters`), fragments/bookmarks badge.

The magnifier icon is **not** used in the reader. "Colección General" uses a stacked-books icon.

#### Scenario: User taps Mi Biblioteca
- **WHEN** the user taps "Mi Biblioteca"
- **THEN** the browser navigates to `/library`

#### Scenario: User taps Colección General
- **WHEN** the user taps "Colección General"
- **THEN** the browser navigates to `/discover`

#### Scenario: Top bar does not overlap reading content
- **WHEN** the reader renders phrases
- **THEN** the first phrase is fully visible below the top bar

### Requirement: Modo Escucha Activa (hybrid audio + text mode)
When the user enters listening mode the reader SHALL simultaneously display the full text and play audio, with the active phrase highlighted in real-time. This is labelled "Modo Escucha Activa" in the sidebar header.

**Mode state machine:** `'reading'` ↔ `'listening'`. There is no separate `'hybrid'` state — listening mode IS the hybrid mode.

**Listening mode behaviors:**
- Text is visible; audio sidebar is visible on the right (md+ screens)
- Active phrase highlighted yellow (`bg-yellow-200 text-gray-900`)
- Text auto-scrolls to keep the active phrase centered
- Text **selection is disabled** (`select-none` CSS + `onMouseUp` removed)
- Sidebar header shows "Modo Escucha Activa" label in blue

**Sync engine:** The `timeupdate` event listener calls `phraseAt(phrases, audio.currentTime)` on every tick. The `activePhraseIndex` state is NOT in the effect dependency array — React 18's setState bailout handles the duplicate-value guard, avoiding listener re-registration on every frame.

#### Scenario: Entering listening mode shows sidebar with Modo Escucha Activa label
- **WHEN** the user switches to listening mode
- **THEN** the audio sidebar becomes visible and displays "Modo Escucha Activa" in the header

#### Scenario: Active phrase is highlighted while audio plays
- **WHEN** audio is playing and the sync map is loaded
- **THEN** the phrase whose `startTime ≤ currentTime < endTime` has yellow highlight

#### Scenario: Text selection is disabled in listening mode
- **WHEN** the reader is in listening mode
- **THEN** text cannot be selected (user-select: none applied)

#### Scenario: Sidebar can be closed without stopping audio
- **WHEN** the user clicks the ✕ button in the sidebar header
- **THEN** mode returns to 'reading' and audio continues playing without interruption

### Requirement: FAB opens audio mode with position selection
The floating action button (FAB) in the bottom-right SHALL:
- **In reading mode:** Switch to listening mode AND show the play-confirm panel. The panel offers three options: "Toca donde vas leyendo" (if sync map exists), "Continuar desde frase N" (if saved progress exists), "Desde el principio".
- **In listening mode:** Act as play/pause only.

**Tap-to-sync flow:** When the user selects "Toca donde vas leyendo", an instruction banner appears at the top ("Toca la frase donde estás leyendo") and all phrases become highlighted blue-on-hover. Tapping any phrase seeks audio to that phrase's `startTime` and begins playback.

#### Scenario: FAB in reading mode opens the audio panel
- **WHEN** the user taps the FAB in reading mode
- **THEN** the mode switches to listening and the play-confirm panel appears

#### Scenario: Tap-to-sync highlights phrases for selection
- **WHEN** the user selects "Toca donde vas leyendo"
- **THEN** all phrases show a blue hover highlight and an instruction banner appears

#### Scenario: Tapping a phrase in tap-to-sync mode starts audio from that phrase
- **WHEN** the user taps phrase index N in tap-to-sync mode
- **THEN** `audio.currentTime` is set to `phrases[N].startTime` and audio starts playing

### Requirement: Audio transport icons use semicircular arrows
The ±10s skip buttons SHALL use semicircular arrow SVG icons (↺ replay / ↻ forward) rather than skip-to-beginning-style icons. The "10s" label appears beneath each icon.

### Requirement: Audio bookmark shows citation location
When the user presses "Crear cita" in listening mode and chooses "Marcar y continuar escuchando":
- An orange ring (`ring-2 ring-orange-400`) is applied to the bookmarked phrase in the text.
- A banner at the bottom of the screen reads "🔖 Cita marcada en frase N" with "Descartar" and "Ir al audio" buttons.
- The banner text no longer says "pausado" (the audio may still be playing).

### Requirement: No-sync notice when audio exists but sync map is empty
When a book has an audio file but no sync map (empty phrases array), the audio sidebar SHALL display a notice: "Este libro aún no tiene sincronización texto-audio. El audio se reproduce pero las frases no se resaltarán."

## REMOVED Requirements

### Requirement: Magnifier icon in the right zone of the top bar
**Reason:** Replaced by the "Colección General" button (books icon + text) moved to the left zone, adjacent to "Mi Biblioteca". The right zone is reserved for reading controls only.
