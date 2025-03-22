# EasyEmail Chrome Extension

A Chrome extension that provides a side panel interface for Gmail, allowing users to interact with their emails in a more efficient way.

## Features

- Google Account authentication
- Side panel interface that appears when using Gmail
- View and interact with emails
- Modern and clean user interface

## Setup Instructions

1. Clone this repository or download the source code
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory

### Google OAuth Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Gmail API for your project
4. Go to "Credentials" and create an OAuth 2.0 Client ID
5. Add the following to Authorized JavaScript origins:
   ```
   chrome-extension://<YOUR_EXTENSION_ID>
   ```
6. Copy the Client ID and replace `${YOUR_CLIENT_ID}` in the `manifest.json` file with your actual Client ID

## Usage

1. Click the extension icon in Chrome to open the side panel
2. Sign in with your Google account
3. The side panel will automatically appear when you open Gmail
4. View and interact with your emails in the side panel

## Development

The extension is built using:
- HTML/CSS for the UI
- JavaScript for functionality
- Chrome Extension APIs
- Gmail API

## Files Structure

- `manifest.json`: Extension configuration
- `sidepanel.html`: Side panel UI
- `sidepanel.js`: Side panel functionality
- `background.js`: Background service worker
- `content.js`: Gmail page integration

## Security

- All authentication is handled through Google's OAuth 2.0
- No sensitive data is stored locally
- All API requests are made securely

## License

MIT License 