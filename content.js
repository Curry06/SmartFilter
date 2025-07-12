// SmartFilter Content Script for Gmail
class SmartFilterContent {
    constructor() {
        this.keywords = [];
        this.taggedEmails = new Set();
        this.init();
    }

    async init() {
        // Load keywords from storage
        await this.loadKeywords();
        
        // Start observing Gmail interface
        this.observeGmailChanges();
        
        // Listen for messages from popup
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'scanEmails') {
                this.keywords = request.keywords;
                this.scanAndTagEmails();
                sendResponse({ success: true });
            }
        });

        // Initial scan
        setTimeout(() => this.scanAndTagEmails(), 2000);
    }

    async loadKeywords() {
        try {
            const result = await chrome.storage.local.get(['keywords']);
            this.keywords = result.keywords || [];
        } catch (error) {
            console.error('Error loading keywords:', error);
        }
    }

    observeGmailChanges() {
        // Observer for Gmail inbox changes
        const observer = new MutationObserver((mutations) => {
            let shouldScan = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Check if new email rows were added
                    const hasEmailRows = Array.from(mutation.addedNodes).some(node => 
                        node.nodeType === Node.ELEMENT_NODE && 
                        (node.querySelector('[role="listitem"]') || node.matches('[role="listitem"]'))
                    );
                    
                    if (hasEmailRows) {
                        shouldScan = true;
                    }
                }
            });

            if (shouldScan) {
                setTimeout(() => this.scanAndTagEmails(), 1000);
            }
        });

        // Start observing
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    scanAndTagEmails() {
        if (this.keywords.length === 0) return;

        // Different selectors for different Gmail views
        const emailSelectors = [
            '[role="listitem"]', // List view
            'tr[jsmodel]', // Table view
            '.zA' // Conversation view
        ];

        let emailElements = [];
        for (const selector of emailSelectors) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                emailElements = Array.from(elements);
                break;
            }
        }

        if (emailElements.length === 0) {
            console.log('No email elements found');
            return;
        }

        let taggedCount = 0;

        emailElements.forEach(emailElement => {
            const emailId = this.getEmailId(emailElement);
            if (this.taggedEmails.has(emailId)) return;

            const emailText = this.extractEmailText(emailElement);
            const matchedKeywords = this.findMatchingKeywords(emailText);

            if (matchedKeywords.length > 0) {
                this.tagEmail(emailElement, matchedKeywords);
                this.taggedEmails.add(emailId);
                taggedCount++;
            }
        });

        if (taggedCount > 0) {
            this.updateTaggedCount(taggedCount);
            console.log(`Tagged ${taggedCount} emails`);
        }
    }

    getEmailId(emailElement) {
        // Try to get a unique identifier for the email
        return emailElement.getAttribute('data-thread-id') || 
               emailElement.getAttribute('id') || 
               emailElement.querySelector('[data-thread-id]')?.getAttribute('data-thread-id') ||
               emailElement.innerHTML.substring(0, 100);
    }

    extractEmailText(emailElement) {
        // Extract text from subject and sender
        const subjectElement = emailElement.querySelector('[data-thread-id] span[id^=":"]') || 
                              emailElement.querySelector('.bog') || 
                              emailElement.querySelector('.bqe') ||
                              emailElement.querySelector('[role="link"] span');
        
        const senderElement = emailElement.querySelector('.yW') || 
                             emailElement.querySelector('.bA4') ||
                             emailElement.querySelector('[email]');

        let text = '';
        if (subjectElement) text += subjectElement.textContent + ' ';
        if (senderElement) text += senderElement.textContent + ' ';

        return text.toLowerCase();
    }

    findMatchingKeywords(emailText) {
        return this.keywords.filter(keyword => 
            emailText.includes(keyword.keyword.toLowerCase())
        );
    }

    tagEmail(emailElement, matchedKeywords) {
        // Remove existing SmartFilter tags
        const existingTags = emailElement.querySelectorAll('.smartfilter-tag');
        existingTags.forEach(tag => tag.remove());

        // Create container for tags
        const tagContainer = document.createElement('div');
        tagContainer.className = 'smartfilter-tags';
        tagContainer.style.cssText = `
            display: flex;
            gap: 4px;
            margin-top: 4px;
            flex-wrap: wrap;
        `;

        // Add tags for each matched keyword
        matchedKeywords.forEach(keyword => {
            const tag = document.createElement('span');
            tag.className = 'smartfilter-tag';
            tag.textContent = keyword.tag;
            tag.style.cssText = `
                background-color: ${keyword.color};
                color: white;
                padding: 2px 6px;
                border-radius: 10px;
                font-size: 11px;
                font-weight: 500;
                display: inline-block;
            `;
            tagContainer.appendChild(tag);
        });

        // Insert tag container
        const insertTarget = emailElement.querySelector('.yW') || 
                            emailElement.querySelector('.bA4') ||
                            emailElement.querySelector('[role="link"]') ||
                            emailElement.firstElementChild;

        if (insertTarget) {
            if (insertTarget.parentNode) {
                insertTarget.parentNode.insertBefore(tagContainer, insertTarget.nextSibling);
            } else {
                emailElement.appendChild(tagContainer);
            }
        }
    }

    async updateTaggedCount(increment) {
        try {
            const result = await chrome.storage.local.get(['taggedCount']);
            const newCount = (result.taggedCount || 0) + increment;
            await chrome.storage.local.set({ taggedCount: newCount });
        } catch (error) {
            console.error('Error updating tagged count:', error);
        }
    }
}

// Initialize content script when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new SmartFilterContent();
    });
} else {
    new SmartFilterContent();
}
