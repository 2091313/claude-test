# Taskmanager

Mobile-first Aufgaben-App mit Punktesystem, umgesetzt nach dem Claude-Design-Prototyp
`project/Taskmanager.dc.html` (Modernist-Stil: Archivo, keine Rundungen, 2px-Linien, Rot als Akzent, Gold für erreichte Ziele).

React 18 + TypeScript + Vite. Alle Daten liegen in `localStorage` (`taskmanager-v1`) und bleiben nach dem Neuladen erhalten.

```bash
npm install
npm run dev       # Entwicklung
npm test          # Unit-Tests der Logik (Wiederholungen, Punkte, Streak, Archiv)
npm run build     # Produktions-Build nach dist/
```

## Funktionen

- **Aufgaben**: offene Aufgaben abhaken → Archiv, +1 Punkt, 3 s „Rückgängig“. Antippen zum Bearbeiten/Löschen.
  Einmalig (heute / morgen / Datum) oder wiederkehrend (täglich, wöchentlich mit Wochentag, alle X Tage).
  Noch nicht fällige Aufgaben stehen unter „Demnächst“.
- **Archiv**: erledigte Aufgaben nach Tag gruppiert, wiederherstellbar (−1 Punkt), automatische Löschung nach 30 Tagen.
- **Punkte**: Glas-Anzeige mit Endziel und Zwischenzielen (gold, wenn erreicht), neues Ziel nach Erreichen; Streak mit Wochenleiste.
- **Einstellungen**: Hell / Dunkel / System, Testmodus (Zeit vorspulen), alle Daten löschen.

Auf großen Bildschirmen wird die App wie im Design in einem Android-Rahmen gezeigt, auf dem Smartphone randlos
(inkl. Safe-Area).

## Offline & Startbildschirm

Der Produktions-Build ist eine installierbare PWA: Ein Service Worker (`sw/sw.js`, beim Build zu `dist/sw.js`
mit allen Dateien des Builds) speichert die App beim ersten Aufruf, danach startet sie auch ohne Netz.
Nach einem neuen Deployment lädt sie die neue Version im Hintergrund; sie ist beim nächsten Öffnen aktiv.

1. Jeder Push auf `main` baut und veröffentlicht die App per GitHub Actions (`.github/workflows/pages.yml`) unter
   https://2091313.github.io/claude-test/ (einmalig nötig: Settings → Pages → Source „GitHub Actions“).
2. Seite auf dem Handy einmal öffnen.
3. Android/Chrome: Menü → „App installieren“ bzw. „Zum Startbildschirm hinzufügen“.
   iPhone/Safari: Teilen → „Zum Home-Bildschirm“.

Im Dev-Server (`npm run dev`) ist der Service Worker bewusst nicht aktiv; zum Testen `npm run build && npm run preview`.

## Aufbau

- `src/lib/` – Datenmodell, Datumslogik, reine Zustandsübergänge (`actions.ts`, getestet), Theme-Tokens
- `src/components/` – Aufgaben-, Archiv- und Punkte-Ansicht, Bottom-Sheets, UI-Bausteine
- `src/App.tsx` – Zustand, Persistenz, Navigation, Toast
- `project/`, `chats/` – Design-Handoff (Prototyp, Design-System, Chatverlauf; Anleitung in `project/HANDOFF.md`)
