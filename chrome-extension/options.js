
const saveButton = document.getElementById('save');
const apiKeyInput = document.getElementById('apiKey');
const modelSelect = document.getElementById('model');
const statusDiv = document.getElementById('status');

// Load saved settings when the page is opened
function restoreOptions() {
  chrome.storage.sync.get(['apiKey', 'model'], (items) => {
    if (items.apiKey) {
      apiKeyInput.value = items.apiKey;
    }
    if (items.model) {
      modelSelect.value = items.model;
    }
  });
}

// Save settings to chrome.storage
function saveOptions() {
  const apiKey = apiKeyInput.value;
  const model = modelSelect.value;

  if (!apiKey) {
    statusDiv.textContent = 'API Key cannot be empty.';
    statusDiv.style.color = '#e74c3c';
    setTimeout(() => { statusDiv.textContent = ''; }, 3000);
    return;
  }

  chrome.storage.sync.set({
    apiKey: apiKey,
    model: model
  }, () => {
    statusDiv.textContent = 'Options saved!';
    statusDiv.style.color = '#2ecc71';
    setTimeout(() => { statusDiv.textContent = ''; }, 2000);
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
saveButton.addEventListener('click', saveOptions);