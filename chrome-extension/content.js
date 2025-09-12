// File: content.js

let activePromptElement = null;
let originalPrompt = '';
let modalIframe = null;

// Listen for invocation from background script (via executeScript)
window.addEventListener("message", (event) => {
    // Handle invocation from the page itself
    if (event.source === window && event.data.type === "PROMPTGOD_INVOKE") {
        activePromptElement = document.activeElement;
        originalPrompt = event.data.prompt;
        
        if (!activePromptElement) return;
        
        showLoadingModal();

        chrome.runtime.sendMessage({
            type: "PROMPTGOD_ANALYZE_SITE"
        }, (response) => {
            if (response.error) {
                updateModalContent(`<div class="promptgod-error">Error: ${response.error}</div>`);
            } else if (response.success) {
                const functions = response.data.functions;
                let buttonsHtml = functions.map(func => `<button class="promptgod-button" data-function="${func}">${func}</button>`).join('');
                updateModalContent(`
                    <h2>Select Feature</h2>
                    <div class="promptgod-button-container">
                        ${buttonsHtml}
                    </div>
                `);
            }
        });
    }

    // Handle messages coming FROM the iframe (button clicks)
    if (event.data && event.data.type === 'PROMPTGOD_BUTTON_CLICK') {
        const selectedFunction = event.data.payload;
        showLoadingModal('Enhancing prompt...');

        chrome.runtime.sendMessage({
            type: "PROMPTGOD_ENHANCE_PROMPT",
            prompt: originalPrompt,
            selectedFunction: selectedFunction
        }, (response) => {
            if (response.error) {
                updateModalContent(`<div class="promptgod-error">Error: ${response.error}</div>`);
            } else if (response.success) {
                const newPrompt = response.data.enhanced_prompt;
                if (activePromptElement) {
                    if (activePromptElement.value !== undefined) {
                        activePromptElement.value = newPrompt;
                    } else {
                        activePromptElement.textContent = newPrompt;
                    }
                    activePromptElement.dispatchEvent(new Event('input', { bubbles: true }));
                }
                destroyModal();
            }
        });
    }

    // Handle close message from the iframe
    if (event.data && event.data.type === 'PROMPTGOD_CLOSE_MODAL') {
        destroyModal();
    }
});

function createModal() {
    if (document.getElementById('promptgod-modal-iframe')) return;

    modalIframe = document.createElement('iframe');
    modalIframe.id = 'promptgod-modal-iframe';
    modalIframe.style.position = 'fixed';
    modalIframe.style.top = '0';
    modalIframe.style.left = '0';
    modalIframe.style.width = '100%';
    modalIframe.style.height = '100%';
    modalIframe.style.zIndex = '999999999';
    modalIframe.style.border = 'none';
    modalIframe.src = chrome.runtime.getURL('modal.html');
    
    document.body.appendChild(modalIframe);
}

function showLoadingModal(text = 'Analyzing website...') {
    if (!modalIframe) createModal();
    const loadingHtml = `
        <h2>${text}</h2>
        <div class="promptgod-loader"></div>
    `;
    updateModalContent(loadingHtml);
}

function updateModalContent(htmlContent) {
    if (modalIframe && modalIframe.contentWindow) {
        modalIframe.contentWindow.postMessage({
            type: "PROMPTGOD_UPDATE_MODAL",
            html: htmlContent
        }, '*');
    }
}

function destroyModal() {
    if (modalIframe) {
        modalIframe.remove();
        modalIframe = null;
    }
    activePromptElement = null;
    originalPrompt = '';
}