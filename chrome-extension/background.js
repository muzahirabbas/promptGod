
const BACKEND_URL = 'http://127.0.0.1:5000'; // IMPORTANT: Replace with your deployed Cloud Run URL

// --- Context Menu & Shortcut Setup ---
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "promptgod-enhance",
    title: "Enhance with PromptGod",
    contexts: ["editable"]
  });
});

const triggerEnhancement = (tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: () => {
      // This function runs in the content script context
      // It finds the active element and sends its value
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable || (activeEl.tagName === 'INPUT' && /text|search|email|url|password/.test(activeEl.type)))) {
        window.postMessage({ type: "PROMPTGOD_INVOKE", prompt: activeEl.value || activeEl.textContent }, "*");
      } else {
        alert("PromptGod: Please click inside a text box first!");
      }
    }
  });
};

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "promptgod-enhance") {
    triggerEnhancement(tab);
  }
});

chrome.commands.onCommand.addListener((command, tab) => {
  if (command === "trigger-promptgod") {
    triggerEnhancement(tab);
  }
});

chrome.action.onClicked.addListener((tab) => {
    triggerEnhancement(tab);
});

// --- Main API Logic ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "PROMPTGOD_ANALYZE_SITE") {
    handleSiteAnalysis(request, sender.tab, sendResponse);
    return true; // Indicates that the response is sent asynchronously
  }
  if (request.type === "PROMPTGOD_ENHANCE_PROMPT") {
    handlePromptEnhancement(request, sender.tab, sendResponse);
    return true; // Indicates that the response is sent asynchronously
  }
});


async function handleSiteAnalysis(request, tab, sendResponse) {
  try {
    const { apiKey, model } = await chrome.storage.sync.get(['apiKey', 'model']);
    if (!apiKey) {
      chrome.runtime.openOptionsPage();
      sendResponse({ error: "API Key not set. Please configure it in the extension options." });
      return;
    }

    const response = await fetch(`${BACKEND_URL}/analyze-site`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: tab.url,
        apiKey: apiKey,
        model: model
      }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    sendResponse({ success: true, data: data });
  } catch (error) {
    console.error('PromptGod Error:', error);
    sendResponse({ error: error.message });
  }
}

async function handlePromptEnhancement(request, tab, sendResponse) {
  try {
    const { apiKey, model } = await chrome.storage.sync.get(['apiKey', 'model']);
     if (!apiKey) {
      // This check is redundant if called after analysis, but good for safety
      sendResponse({ error: "API Key not set." });
      return;
    }

    const response = await fetch(`${BACKEND_URL}/enhance-prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: tab.url,
        function: request.selectedFunction,
        prompt: request.prompt,
        apiKey: apiKey,
        model: model
      }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    sendResponse({ success: true, data: data });
  } catch (error) {
    console.error('PromptGod Error:', error);
    sendResponse({ error: error.message });
  }
}
