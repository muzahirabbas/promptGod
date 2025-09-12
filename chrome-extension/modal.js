// File: modal.js

// Listen for messages from the content script to update the modal's HTML
window.addEventListener("message", (event) => {
    if (event.data && event.data.type === "PROMPTGOD_UPDATE_MODAL") {
        const contentDiv = document.getElementById('promptgod-modal-content');
        if (contentDiv) {
            contentDiv.innerHTML = event.data.html;
        }
    }
});

// Use event delegation to handle clicks on buttons that might not exist yet
document.addEventListener('click', (event) => {
    // Handle clicks on the generated feature buttons
    if (event.target.classList.contains('promptgod-button')) {
        const selectedFunction = event.target.dataset.function;
        // Send the selected function back to the content script
        window.parent.postMessage({
            type: 'PROMPTGOD_BUTTON_CLICK',
            payload: selectedFunction
        }, '*'); // Use '*' for simplicity, or specify the target origin
    }

    // Handle clicks on the overlay or close button
    if (event.target.id === 'promptgod-overlay' || event.target.id === 'promptgod-close') {
        window.parent.postMessage({ type: 'PROMPTGOD_CLOSE_MODAL' }, '*');
    }
});