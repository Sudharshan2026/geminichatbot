document.addEventListener('DOMContentLoaded', function() {
    const chatMessages = document.getElementById('chatMessages');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');
    const resetButton = document.getElementById('resetButton');
    const modeSelectors = document.querySelectorAll('.mode-selector');
    const modeDropdown = document.getElementById('modeDropdown');
    
    let sessionId = generateSessionId();
    let isWaitingForResponse = false;
    
    // Function to generate a random session ID
    function generateSessionId() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
    
    // Function to add a message to the chat
    function addMessage(content, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.innerHTML = formatMessage(content);
        
        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        messageTime.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageDiv.appendChild(messageContent);
        messageDiv.appendChild(messageTime);
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Function to format message with markdown-like syntax
    function formatMessage(text) {
        // Convert URLs to clickable links
        text = text.replace(/https?:\/\/[^\s]+/g, url => `<a href="${url}" target="_blank">${url}</a>`);
        
        // Convert **text** to bold
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Convert *text* to italic
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Convert newlines to <br>
        text = text.replace(/\n/g, '<br>');
        
        return text;
    }
    
    // Function to show typing indicator
    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message';
        typingDiv.id = 'typingIndicator';
        
        const typingContent = document.createElement('div');
        typingContent.className = 'typing-indicator';
        typingContent.innerHTML = '<span></span><span></span><span></span>';
        
        typingDiv.appendChild(typingContent);
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Function to remove typing indicator
    function removeTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    // Function to send message to the server
    async function sendMessage(message) {
        if (!message.trim() || isWaitingForResponse) return;
        
        // Add user message to chat
        addMessage(message, true);
        
        // Clear input field
        userInput.value = '';
        
        // Show typing indicator
        isWaitingForResponse = true;
        showTypingIndicator();
        
        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    session_id: sessionId
                }),
            });
            
            const data = await response.json();
            
            // Remove typing indicator
            removeTypingIndicator();
            
            // Add bot response to chat
            addMessage(data.response);
            
            // Update session ID if provided
            if (data.session_id) {
                sessionId = data.session_id;
            }
        } catch (error) {
            console.error('Error:', error);
            removeTypingIndicator();
            addMessage('Sorry, there was an error processing your request. Please try again.');
        } finally {
            isWaitingForResponse = false;
        }
    }
    
    // Function to reset chat
    async function resetChat() {
        try {
            const response = await fetch('/reset', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `session_id=${sessionId}`,
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                // Clear chat messages
                chatMessages.innerHTML = '';
                
                // Add welcome message
                const welcomeDiv = document.createElement('div');
                welcomeDiv.className = 'welcome-message';
                welcomeDiv.innerHTML = '<p>Chat history has been reset. You can start a new conversation!</p>';
                chatMessages.appendChild(welcomeDiv);
            }
        } catch (error) {
            console.error('Error resetting chat:', error);
        }
    }
    
    // Event listener for send button
    sendButton.addEventListener('click', () => {
        sendMessage(userInput.value);
    });
    
    // Event listener for enter key
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage(userInput.value);
        }
    });
    
    // Event listener for reset button
    resetButton.addEventListener('click', resetChat);
    
    // Event listeners for mode selectors
    modeSelectors.forEach(selector => {
        selector.addEventListener('click', (e) => {
            e.preventDefault();
            const mode = e.target.dataset.mode;
            modeDropdown.textContent = e.target.textContent;
            sendMessage(mode);
        });
    });
});