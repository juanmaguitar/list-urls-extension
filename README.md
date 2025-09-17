# WordPress URL Grabber

A Chrome extension that fetches all public URLs from WordPress sites using the WordPress REST API, organized by post type.

## Features

- **Auto-detection**: Automatically detects WordPress sites and their REST API endpoints
- **Comprehensive URL extraction**: Fetches URLs from all available post types (posts, pages, custom post types)
- **Collapsible sections**: Click post type headers to hide/show URL lists while keeping counts visible
- **Search & Filter**: Real-time search functionality with highlighting and auto-expand on matches
- **Easy copying**: Copy all URLs or filtered results to clipboard with one click
- **Clean interface**: Organized display grouped by post type with URL counts and smooth animations

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory
5. The extension icon will appear in your browser toolbar

## Usage

1. Navigate to any WordPress website
2. Click the extension icon in your browser toolbar
3. The extension will:
   - Detect if the site is WordPress
   - Fetch all available post types and their URLs
   - Display them organized by collapsible sections (posts, pages, etc.)
4. **Organize your view:**
   - Click any section header to collapse/expand URL lists
   - Keep sections collapsed to focus on specific post types
   - Headers always show post type name and total count
5. **Search and filter:**
   - Use the search box to filter URLs by keyword
   - Matching sections automatically expand to show results
   - Search highlights matching text in yellow
6. **Copy URLs:**
   - Click "Copy All URLs" or "Copy Filtered URLs" to copy to clipboard
   - Copying works regardless of which sections are collapsed

## Project Structure

```
├── manifest.json          # Extension configuration
├── popup.html             # Extension popup interface
├── css/
│   └── styles.css         # All styling for the popup
├── js/
│   ├── api.js            # WordPress API functions
│   ├── clipboard.js      # Clipboard operations
│   ├── dom.js            # DOM manipulation utilities
│   ├── popup.js          # Main coordination logic
│   └── search.js         # Search and filtering functionality
└── README.md             # This file
```

### File Responsibilities

- **api.js**: Handles WordPress detection and data fetching
  - `fetchJSON()` - Generic JSON fetching with error handling
  - `checkWordPressSite()` - Detects WordPress sites and REST API paths
  - `fetchWordPressData()` - Retrieves all post types and their URLs

- **dom.js**: Manages DOM creation and updates
  - Element creation utilities with collapsible sections
  - Rendering functions for URL data
  - Toggle functionality for expand/collapse
  - Error and loading state management

- **clipboard.js**: Handles copying functionality
  - Clipboard operations with user feedback
  - URL formatting for copy operations
  - Button state management

- **search.js**: Implements search and filtering
  - Real-time URL filtering with collapsible section support
  - Text highlighting for search matches
  - Auto-expand sections with matching results
  - Search result statistics

- **popup.js**: Main application orchestration
  - Coordinates between all modules
  - Handles extension lifecycle
  - Event listener setup

## Requirements

- Chrome browser (Manifest V3 compatible)
- Target website must be WordPress with REST API enabled
- `activeTab` permission for accessing current tab URL

## WordPress Compatibility

The extension works with:
- WordPress sites with standard REST API endpoints
- Custom REST API paths (`/wp-json/`, `/index.php/wp-json/`, `/?rest_route=/`)
- Sites with custom post types
- Both standard WordPress installations and headless WordPress setups

## Technical Details

- **Manifest Version**: 3 (latest Chrome extension standard)
- **Permissions**: Only requires `activeTab` for security
- **Architecture**: Modular JavaScript with single-responsibility files
- **No external dependencies**: Pure vanilla JavaScript
- **CORS handling**: Uses `credentials: "omit"` for cross-origin requests
- **UI/UX**: CSS animations and transitions for smooth collapsible interactions
- **State management**: Preserves user collapse/expand preferences during search operations

## Error Handling

The extension provides helpful error messages for common issues:
- Non-WordPress sites
- Disabled REST API
- CORS restrictions
- Network connectivity issues
- Empty or private sites

## Browser Support

- Chrome (primary target)
- Chromium-based browsers (Edge, Brave, etc.)

## UI Features

### Collapsible Sections
- **Toggle indicators**: `v` (expanded) and `>` (collapsed) icons
- **Click interaction**: Click anywhere on section headers to toggle
- **Smooth animations**: CSS transitions for expanding/collapsing
- **Visual feedback**: Hover effects on section headers
- **Persistent state**: Manual collapse/expand states maintained during filtering

### Search Integration
- **Smart expansion**: Sections with matching URLs automatically expand when searching
- **Highlight matches**: Search terms highlighted in yellow
- **Dynamic counts**: Button text updates to show filtered result counts
- **Preserve state**: User-collapsed sections remain collapsed unless they contain matches

## Contributing

The codebase is organized for easy maintenance:
1. Each JavaScript file has a single responsibility
2. CSS is separated from HTML in organized folder structure
3. Clear separation between API logic, UI logic, and utilities
4. Comprehensive error handling and debugging logs
5. Modular design allows easy feature additions and modifications