// SmartFilter Popup Script
class SmartFilterPopup {
    constructor() {
        this.keywords = [];
        this.taggedCount = 0;
        this.init();
    }

    async init() {
        await this.loadKeywords();
        this.setupEventListeners();
        this.updateUI();
    }

    async loadKeywords() {
        try {
            const result = await chrome.storage.local.get(['keywords', 'taggedCount']);
            this.keywords = result.keywords || [];
            this.taggedCount = result.taggedCount || 0;
        } catch (error) {
            console.error('Error loading keywords:', error);
            this.showStatus('Error loading keywords', 'error');
        }
    }

    async saveKeywords() {
        try {
            await chrome.storage.local.set({ 
                keywords: this.keywords,
                taggedCount: this.taggedCount
            });
        } catch (error) {
            console.error('Error saving keywords:', error);
            this.showStatus('Error saving keywords', 'error');
        }
    }

    setupEventListeners() {
        // Add keyword button
        document.getElementById('addKeywordBtn').addEventListener('click', () => {
            this.addKeyword();
        });

        // Enter key in input fields
        document.getElementById('keywordInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addKeyword();
        });

        document.getElementById('tagInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addKeyword();
        });

        // Scan now button
        document.getElementById('scanNowBtn').addEventListener('click', () => {
            this.scanInbox();
        });

        // Clear all button
        document.getElementById('clearAllBtn').addEventListener('click', () => {
            this.clearAllKeywords();
        });
    }

    addKeyword() {
        const keywordInput = document.getElementById('keywordInput');
        const tagInput = document.getElementById('tagInput');
        const colorInput = document.getElementById('colorInput');

        const keyword = keywordInput.value.trim().toLowerCase();
        const tag = tagInput.value.trim();
        const color = colorInput.value;

        if (!keyword || !tag) {
            this.showStatus('Please enter both keyword and tag name', 'error');
            return;
        }

        // Check if keyword already exists
        if (this.keywords.some(k => k.keyword === keyword)) {
            this.showStatus('Keyword already exists', 'error');
            return;
        }

        // Add new keyword
        const newKeyword = {
            id: Date.now(),
            keyword: keyword,
            tag: tag,
            color: color,
            matches: 0
        };

        this.keywords.push(newKeyword);
        this.saveKeywords();
        this.updateUI();

        // Clear inputs
        keywordInput.value = '';
        tagInput.value = '';
        
        this.showStatus('Keyword added successfully!', 'success');
    }

    deleteKeyword(id) {
        this.keywords = this.keywords.filter(k => k.id !== id);
        this.saveKeywords();
        this.updateUI();
        this.showStatus('Keyword deleted', 'info');
    }

    editKeyword(id) {
        const keyword = this.keywords.find(k => k.id === id);
        if (!keyword) return;

        const newTag = prompt('Enter new tag name:', keyword.tag);
        if (newTag && newTag.trim()) {
            keyword.tag = newTag.trim();
            this.saveKeywords();
            this.updateUI();
            this.showStatus('Keyword updated', 'success');
        }
    }

    clearAllKeywords() {
        if (confirm('Are you sure you want to clear all keywords? This action cannot be undone.')) {
            this.keywords = [];
            this.taggedCount = 0;
            this.saveKeywords();
            this.updateUI();
            this.showStatus('All keywords cleared', 'info');
        }
    }

    async scanInbox() {
        try {
            this.showStatus('Scanning inbox...', 'info');
            
            // Get active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab.url.includes('mail.google.com')) {
                this.showStatus('Please open Gmail to scan your inbox', 'error');
                return;
            }

            // Send message to content script to scan emails
            await chrome.tabs.sendMessage(tab.id, { 
                action: 'scanEmails', 
                keywords: this.keywords 
            });

            this.showStatus('Inbox scan completed!', 'success');
        } catch (error) {
            console.error('Error scanning inbox:', error);
            this.showStatus('Error scanning inbox. Make sure you\'re on Gmail.', 'error');
        }
    }

    updateUI() {
        // Update stats
        document.getElementById('keywordCount').textContent = this.keywords.length;
        document.getElementById('taggedCount').textContent = this.taggedCount;

        // Update keywords list
        const keywordsList = document.getElementById('keywordsList');
        
        if (this.keywords.length === 0) {
            keywordsList.innerHTML = `
                <div class="empty-state">
                    <p>No keywords added yet. Add your first keyword above!</p>
                </div>
            `;
        } else {
            keywordsList.innerHTML = this.keywords.map(keyword => `
                <div class="keyword-item">
                    <span class="keyword-tag" style="background-color: ${keyword.color}">
                        ${keyword.tag}
                    </span>
                    <span class="keyword-text">${keyword.keyword}</span>
                    <div class="keyword-actions">
                        <button class="edit-btn" onclick="popup.editKeyword(${keyword.id})">Edit</button>
                        <button class="delete-btn" onclick="popup.deleteKeyword(${keyword.id})">Delete</button>
                    </div>
                </div>
            `).join('');
        }
    }

    showStatus(message, type) {
        const statusEl = document.getElementById('statusMessage');
        statusEl.textContent = message;
        statusEl.className = `status ${type}`;
        statusEl.style.display = 'block';

        setTimeout(() => {
            statusEl.style.display = 'none';
        }, 3000);
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.popup = new SmartFilterPopup();
});
