// Options page functionality
document.addEventListener('DOMContentLoaded', () => {
  const validateCheckbox = document.getElementById('validateUrls');
  const perPageSelect = document.getElementById('perPageLimit');
  const enableCacheCheckbox = document.getElementById('enableCache');
  const cacheExpirySelect = document.getElementById('cacheExpiry');
  const clearCacheButton = document.getElementById('clearCache');
  const statusDiv = document.getElementById('status');

  // Load current settings
  loadSettings();

  // Save settings when changed
  validateCheckbox.addEventListener('change', saveSettings);
  perPageSelect.addEventListener('change', saveSettings);
  enableCacheCheckbox.addEventListener('change', saveSettings);
  cacheExpirySelect.addEventListener('change', saveSettings);

  // Clear cache button
  clearCacheButton.addEventListener('click', clearCache);

  function loadSettings() {
    chrome.storage.sync.get(['validateUrls', 'perPageLimit', 'enableCache', 'cacheExpiry'], (result) => {
      // Default to false (disabled) if not set
      const validateEnabled = result.validateUrls === true;
      validateCheckbox.checked = validateEnabled;

      // Default to 1000 if not set
      const perPageLimit = result.perPageLimit || 1000;
      perPageSelect.value = perPageLimit;

      // Default to true (enabled) if not set
      const enableCache = result.enableCache !== false;
      enableCacheCheckbox.checked = enableCache;

      // Default to 3600 (1 hour) if not set
      const cacheExpiry = result.cacheExpiry || 3600;
      cacheExpirySelect.value = cacheExpiry;

      console.log('[OPTIONS] Loaded settings:', {
        validateEnabled,
        perPageLimit,
        enableCache,
        cacheExpiry
      });
    });
  }

  function saveSettings() {
    const validateEnabled = validateCheckbox.checked;
    const perPageLimit = parseInt(perPageSelect.value);
    const enableCache = enableCacheCheckbox.checked;
    const cacheExpiry = parseInt(cacheExpirySelect.value);

    chrome.storage.sync.set({
      validateUrls: validateEnabled,
      perPageLimit: perPageLimit,
      enableCache: enableCache,
      cacheExpiry: cacheExpiry
    }, () => {
      console.log('[OPTIONS] Saved settings:', {
        validateEnabled,
        perPageLimit,
        enableCache,
        cacheExpiry
      });
      showStatus('Settings saved successfully!');
    });
  }

  async function clearCache() {
    try {
      const clearedCount = await clearAllCache();
      if (clearedCount > 0) {
        showStatus(`Cleared ${clearedCount} cached entries successfully!`);
      } else {
        showStatus('No cached data to clear.');
      }
    } catch (error) {
      console.error('[OPTIONS] Error clearing cache:', error);
      showStatus('Error clearing cache.');
    }
  }

  function showStatus(message) {
    statusDiv.textContent = message;
    statusDiv.classList.add('success');

    setTimeout(() => {
      statusDiv.classList.remove('success');
    }, 2000);
  }
});