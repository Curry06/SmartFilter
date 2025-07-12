# SmartFilter - Email Auto-Tagger

## Overview

SmartFilter is a Chrome extension designed to automatically tag and organize Gmail inbox emails using custom keywords. The extension provides a user-friendly interface for managing keywords and tags, with real-time email scanning and visual feedback through color-coded tags.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Extension Architecture
The system follows Chrome Extension Manifest V3 architecture with three main components:
- **Background Script (Service Worker)**: Handles initialization, message passing, and storage management
- **Content Script**: Injected into Gmail pages to scan and tag emails
- **Popup Interface**: Provides user interface for keyword management

### Technology Stack
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Storage**: Chrome Extension Storage API (local storage)
- **Platform**: Chrome Extension Manifest V3
- **Target Integration**: Gmail web interface

## Key Components

### 1. Background Script (`background.js`)
- **Purpose**: Central message hub and initialization handler
- **Key Features**:
  - Extension installation setup
  - Message routing between popup and content script
  - Storage change monitoring
  - Default settings initialization

### 2. Content Script (`content.js`)
- **Purpose**: Gmail page interaction and email scanning
- **Key Features**:
  - DOM observation for Gmail interface changes
  - Email scanning and keyword matching
  - Tag application and visual feedback
  - Real-time inbox monitoring

### 3. Popup Interface (`popup.html`, `popup.js`, `popup.css`)
- **Purpose**: User interface for keyword management
- **Key Features**:
  - Keyword addition with custom tags and colors
  - Statistics display (keyword count, tagged emails)
  - Visual keyword management with color coding
  - Settings and preferences interface

## Data Flow

### Keyword Management Flow
1. User adds keywords through popup interface
2. Keywords stored in Chrome local storage
3. Content script loads keywords and monitors Gmail
4. Background script coordinates message passing

### Email Scanning Flow
1. Content script observes Gmail DOM changes
2. New emails trigger scanning process
3. Keywords matched against email content
4. Tags applied with visual indicators
5. Statistics updated in storage

### Storage Structure
```javascript
{
  keywords: [
    {
      keyword: "urgent",
      tag: "Important",
      color: "#FF6B6B"
    }
  ],
  taggedCount: 0,
  settings: {
    autoScan: true,
    scanInterval: 30000
  }
}
```

## External Dependencies

### Chrome APIs
- **Storage API**: Persistent keyword and settings storage
- **Runtime API**: Message passing and event handling
- **Scripting API**: Content script injection capabilities

### Gmail Integration
- **DOM Manipulation**: Direct interaction with Gmail interface
- **Mutation Observer**: Real-time detection of inbox changes
- **CSS Injection**: Visual tag application

## Deployment Strategy

### Chrome Extension Distribution
- **Manifest V3**: Modern extension architecture
- **Host Permissions**: Restricted to Gmail domains only
- **Storage Permissions**: Local storage for user data
- **Active Tab**: Minimal permission scope

### File Structure
```
/
├── manifest.json          # Extension configuration
├── background.js          # Service worker
├── content.js            # Gmail integration
├── popup.html            # UI interface
├── popup.js              # UI logic
├── popup.css             # UI styling
└── icons/                # Extension icons
```

### Security Considerations
- **Content Security Policy**: No inline scripts
- **Permission Minimization**: Only necessary permissions requested
- **Domain Restriction**: Limited to Gmail domains
- **Local Storage**: No external data transmission

## Key Architectural Decisions

### 1. Manifest V3 Adoption
- **Problem**: Chrome's migration to Manifest V3
- **Solution**: Service worker background script instead of persistent background page
- **Benefits**: Better performance, security, and future compatibility

### 2. Local Storage Strategy
- **Problem**: Need for persistent keyword storage
- **Solution**: Chrome Storage API with local storage
- **Benefits**: Reliable persistence, no external dependencies

### 3. Real-time Gmail Monitoring
- **Problem**: Dynamic Gmail interface changes
- **Solution**: MutationObserver for DOM change detection
- **Benefits**: Immediate email tagging without page refresh

### 4. Minimal Permission Model
- **Problem**: User privacy and security concerns
- **Solution**: Restricted permissions to Gmail domain only
- **Benefits**: Enhanced security and user trust

### 5. Visual Tag System
- **Problem**: Clear email organization feedback
- **Solution**: Color-coded tags with customizable appearance
- **Benefits**: Quick visual identification and user customization