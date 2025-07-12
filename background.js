// SmartFilter Background Script (Service Worker)
class SmartFilterBackground {
    constructor() {
        this.init();
    }

    init() {
        // Listen for extension installation
        chrome.runtime.onInstalled.addListener((details) => {
            if (details.reason === 'install') {
                this.onInstall();
            }
        });

        // Listen for messages from content script or popup
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true; // Keep message channel open for async response
        });

        // Listen for storage changes
        chrome.storage.onChanged.addListener((changes, namespace) => {
            this.handleStorageChange(changes, namespace);
        });
    }

    async onInstall() {
        try {
            // Initialize default storage
            await chrome.storage.local.set({
                keywords: [],
                taggedCount: 0,
                settings: {
                    autoScan: true,
                    scanInterval: 30000 // 30 seconds
                }
            });

            // Open options page or show welcome message
            console.log('SmartFilter installed successfully');
        } catch (error) {
            console.error('Error during installation:', error);
        }
    }

    handleMessage(request, sender, sendResponse) {
        switch (request.action) {
            case 'getKeywords':
                this.getKeywords().then(sendResponse);
                break;
                
            case 'saveKeywords':
                this.saveKeywords(request.keywords).then(sendResponse);
                break;
                
            case 'resetTaggedCount':
                this.resetTaggedCount().then(sendResponse);
                break;
                
            case 'getStats':
                this.getStats().then(sendResponse);
                break;
                
            default:
                sendResponse({ error: 'Unknown action' });
        }
    }

    async getKeywords() {
        try {
            const result = await chrome.storage.local.get(['keywords']);
            return { keywords: result.keywords || [] };
        } catch (error) {
            console.error('Error getting keywords:', error);
            return { error: 'Failed to get keywords' };
        }
    }

    async saveKeywords(keywords) {
        try {
            await chrome.storage.local.set({ keywords });
            return { success: true };
        } catch (error) {
            console.error('Error saving keywords:', error);
            return { error: 'Failed to save keywords' };
        }
    }

    async resetTaggedCount() {
        try {
            await chrome.storage.local.set({ taggedCount: 0 });
            return { success: true };
        } catch (error) {
            console.error('Error resetting tagged count:', error);
            return { error: 'Failed to reset count' };
        }
    }

    async getStats() {
        try {
            const result = await chrome.storage.local.get(['keywords', 'taggedCount']);
            return {
                keywordCount: (result.keywords || []).length,
                taggedCount: result.taggedCount || 0
            };
        } catch (error) {
            console.error('Error getting stats:', error);
            return { error: 'Failed to get stats' };
        }
    }

    handleStorageChange(changes, namespace) {
        if (namespace === 'local') {
            // Notify content scripts about keyword changes
            if (changes.keywords) {
                this.notifyContentScripts('keywordsUpdated', changes.keywords.newValue);
            }
        }
    }

    async notifyContentScripts(action, data) {
        try {
            const tabs = await chrome.tabs.query({ url: 'https://mail.google.com/*' });
            
            for (const tab of tabs) {
                try {
                    await chrome.tabs.sendMessage(tab.id, { action, data });
                } catch (error) {
                    // Tab might not be ready or doesn't have content script
                    console.log('Could not send message to tab:', tab.id);
                }
            }
        } catch (error) {
            console.error('Error notifying content scripts:', error);
        }
    }
}

// Initialize background script
new SmartFilterBackground();
