# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Maison des Présences** (House of Presences) is an educational web application used in primary schools in Geneva, Switzerland. It's a presence-tracking ritual tool where students type their first name below their photo to mark attendance. The application is designed for young children learning to read and use a keyboard.

Licensed under GPLv3 by the Department of Education (DIP) of Geneva.

## Architecture

This is a static web application with no build system. Files are loaded directly in the browser.

### Core JavaScript Files

- **js/app.js** - Entry point. Initializes the application, sets automatic presence reset (10 hours).
- **js/functions.js** - Main business logic: student card creation, name validation, image handling, configuration management.
- **js/handlers.js** - DOM event handlers: drag/drop, file upload, button clicks, keyboard input.
- **js/storage/db.js** - IndexedDB wrapper (`nameDB`) for storing student photos and names persistently.
- **js/storage/simpleStorage.js** - localStorage wrapper for app configuration settings.

### Application Modes

The app has two modes controlled via URL parameter `?mode=e` (student) or `?mode=p` (professor):

- **Teacher mode**: Full navbar visible, can add/remove students via drag-drop or file picker, edit student names, configure settings.
- **Student mode**: Navbar hidden, students type their name in input field below their photo. Correct name turns green with audio feedback.

### Key Configuration (stored in simpleStorage)

- `caseSense` / `accentSense` - Whether name matching respects case/accents
- `shuffle` - Randomize student card order in student view
- `lectureLettres` - Audio playback of typed letters (A-Z sounds in `snd/alphabet/`)
- `afficherNoms` - Display student names on photos as hints
- `rightNames` - Array of students who have correctly written their names
- `timeForPresence` - Timestamp for automatic presence reset

### Data Flow

1. Teacher uploads student photos (named with student's first name, e.g., "Marie.jpg")
2. Photos stored as blobs in IndexedDB with filename as default name
3. Student mode displays cards with photos and input fields
4. Name validation uses `latinise.min_.js` for accent-insensitive comparison when configured

### External Dependencies (included in repo)

- Bootstrap 4 (CSS/JS)
- jQuery 3.3.1 slim
- jquery-confirm (dialogs)
- bootstrap-notify (toast notifications)
- bootstrap-colorpicker (background color selection)
- JavaScript-Load-Image library (image processing with EXIF orientation)

## Development

Open `index.html` directly in a browser. No build step required.

The bootstrap-colorpicker directory contains a separate npm project with its own build system, but the compiled dist files are already included.
