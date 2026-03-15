# slskd Card for Home Assistant

A custom Lovelace card for searching and downloading music from Soulseek via [slskd](https://github.com/slskd/slskd), using the [slskd Home Assistant integration](https://github.com/kaymyst/slskd-homeassistant).

## Features

- Search the Soulseek network directly from your dashboard
- Browse up to 10 results sorted by upload speed
- One-click download with progress tracking
- Connection status indicator
- Adapts to your HA theme (optimized for dark themes)

## Prerequisites

Install the [slskd Home Assistant integration](https://github.com/kaymyst/slskd-homeassistant) and configure it with your slskd instance.

## Installation

1. Copy `slskd-card.js` to your Home Assistant `config/www/` directory
2. Add the resource in **Settings → Dashboards → Resources**:
   - URL: `/local/slskd-card.js`
   - Type: JavaScript Module
3. Add the card to your dashboard

## Configuration

```yaml
type: custom:slskd-card
search_entity: sensor.slskd_last_search_result_total
download_entity: sensor.slskd_last_download_status
connection_entity: binary_sensor.slskd_connected
title: slskd  # optional, defaults to "slskd"
```

## Usage

1. Type a search query and click **Search** (or press Enter)
2. Results appear below — click any result or its download icon to start downloading
3. The download progress bar shows at the bottom of the card
