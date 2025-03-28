// content.js
(function() {
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;
    let lastClickTime = 0;
    let isProcessingClick = false;
  
    // Function to create the floating button
    function createFloatingButton() {
      // Check if button already exists
      if (document.getElementById('easy-email-floating-button')) {
        return;
      }
  
      // Create the button element
      const floatingButton = document.createElement('div');
      floatingButton.id = 'easy-email-floating-button';
  
      // Style the button
      floatingButton.style.position = 'fixed';
      floatingButton.style.right = '20px';
      floatingButton.style.top = '50%';
      floatingButton.style.transform = 'translateY(-50%)';
      floatingButton.style.width = '50px';
      floatingButton.style.height = '50px';
      floatingButton.style.borderRadius = '50%';
      floatingButton.style.backgroundColor = '#4285F4';
      floatingButton.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
      floatingButton.style.cursor = 'move';
      floatingButton.style.zIndex = '9999';
      floatingButton.style.display = 'flex';
      floatingButton.style.alignItems = 'center';
      floatingButton.style.justifyContent = 'center';
      floatingButton.style.color = 'white';
      floatingButton.style.transition = 'transform 0.2s, box-shadow 0.2s';
      floatingButton.style.userSelect = 'none';
  
      // Add hover effect
      floatingButton.addEventListener('mouseover', function() {
        this.style.transform = 'scale(1.1)';
        this.style.boxShadow = '0 4px 15px rgba(0,0,0,0.4)';
      });
  
      floatingButton.addEventListener('mouseout', function() {
        if (!isDragging) {
          this.style.transform = 'scale(1)';
          this.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
        }
      });
  
      // Add custom SVG logo
      floatingButton.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" fill="white"/>
          <path d="M12 15L4 10V18H20V10L12 15Z" fill="white"/>
        </svg>
      `;
  
      // Add drag functionality
      floatingButton.addEventListener('mousedown', dragStart);
      document.addEventListener('mousemove', drag);
      document.addEventListener('mouseup', dragEnd);
  
      // Add click functionality
      floatingButton.addEventListener('click', function(e) {
        // Only trigger if not dragging and not already processing a click
        if (!isDragging && !isProcessingClick) {
          const currentTime = new Date().getTime();
          // Prevent double clicks
          if (currentTime - lastClickTime < 300) {
            return;
          }
          lastClickTime = currentTime;
          isProcessingClick = true;
  
          try {
            // Send message to background script to toggle side panel
            chrome.runtime.sendMessage({ action: 'toggleSidePanel' }, function(response) {
              isProcessingClick = false;
              if (chrome.runtime.lastError) {
                console.error('Error:', chrome.runtime.lastError);
              }
            });
          } catch (error) {
            console.error('Extension context invalidated:', error);
            isProcessingClick = false;
            // Reload the extension
            chrome.runtime.reload();
          }
        }
      });
  
      // Add the button to the page
      document.body.appendChild(floatingButton);
    }
  
    // Drag functions
    function dragStart(e) {
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;
  
      if (e.target === document.getElementById('easy-email-floating-button')) {
        isDragging = true;
      }
    }
  
    function drag(e) {
      if (isDragging) {
        e.preventDefault();
  
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
  
        xOffset = currentX;
        yOffset = currentY;
  
        const floatingButton = document.getElementById('easy-email-floating-button');
        floatingButton.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
        floatingButton.style.right = 'auto';
        floatingButton.style.top = 'auto';
      }
    }
  
    function dragEnd() {
      initialX = currentX;
      initialY = currentY;
      isDragging = false;
    }
  
    // Function to enhance Gmail UI
    function enhanceGmailUI() {
      const style = document.createElement('style');
      style.textContent = `
          /* Add any custom styles for Gmail integration */
      `;
      document.head.appendChild(style);
    }
  
    // Function to extract current email content
    function getCurrentEmailContent() {
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
  
    // Message listener for background/side panel
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'getCurrentEmail') {
        const emailContent = getCurrentEmailContent();
        sendResponse({ emailContent });
      }
    });
  
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        if (window.location.hostname === 'mail.google.com') {
          createFloatingButton();
          enhanceGmailUI();
        }
      });
    } else {
      if (window.location.hostname === 'mail.google.com') {
        createFloatingButton();
        enhanceGmailUI();
      }
    }
  
    // Also create button when Gmail's content changes
    const observer = new MutationObserver(function(mutations) {
      if (window.location.hostname === 'mail.google.com' && !document.getElementById('easy-email-floating-button')) {
        createFloatingButton();
      }
    });
  
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  })();
  