// Listen for messages from the side panel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getCurrentEmail') {
        // Get the current email being viewed in Gmail
        const emailContent = getCurrentEmailContent();
        sendResponse({ emailContent });
    }
});

function getCurrentEmailContent() {
    // This function would need to be customized based on Gmail's DOM structure
    // This is a basic example that would need to be updated based on Gmail's current structure
    const emailView = document.querySelector('.a3s.aiL');
    if (emailView) {
        return {
            subject: document.querySelector('.hP')?.textContent || '',
            sender: document.querySelector('.gD')?.textContent || '',
            body: emailView.innerHTML
        };
    }
    return null;
}

// Add any Gmail-specific UI enhancements here
function enhanceGmailUI() {
    // Add custom styles or UI elements to Gmail
    const style = document.createElement('style');
    style.textContent = `
        /* Add any custom styles for Gmail integration */
    `;
    document.head.appendChild(style);
}

// Initialize when the page loads
enhanceGmailUI(); 