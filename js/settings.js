function shouldValidateUrls() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['validateUrls'], (result) => {
      // Default to false (disabled) if not set
      const validateEnabled = result.validateUrls === true;
      resolve(validateEnabled);
    });
  });
}

function getPerPageLimit() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['perPageLimit'], (result) => {
      // Default to 1000 if not set
      const perPageLimit = result.perPageLimit || 1000;
      resolve(perPageLimit);
    });
  });
}

function setupSettingsEventListeners() {
  // No longer needed in popup since settings moved to options page
  console.log('[DEBUG] Settings are now managed in the options page');
}