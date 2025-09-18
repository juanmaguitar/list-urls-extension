// Cache management functions
async function getCacheSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['enableCache', 'cacheExpiry'], (result) => {
      const enableCache = result.enableCache !== false; // Default to true
      const cacheExpiry = result.cacheExpiry || 3600; // Default to 1 hour
      resolve({ enableCache, cacheExpiry });
    });
  });
}

function getCacheKey(baseURL, settings, postType = null) {
  // Create a unique cache key based on URL, settings, and optionally post type
  let key = `cache_${baseURL}_${settings.perPageLimit}_${settings.validateUrls}`;
  if (postType) {
    key += `_${postType}`;
  }
  return key.replace(/[^a-zA-Z0-9_]/g, '_'); // Sanitize key
}

function getPostTypeCacheKey(baseURL, postType, settings) {
  return getCacheKey(baseURL, settings, postType);
}

async function getCachedPostType(baseURL, postType) {
  const settings = await getCacheSettings();
  if (!settings.enableCache) {
    return null;
  }

  const perPageLimit = await getPerPageLimit();
  const validateUrls = await shouldValidateUrls();

  const cacheKey = getPostTypeCacheKey(baseURL, postType, { perPageLimit, validateUrls });

  return new Promise((resolve) => {
    chrome.storage.local.get([cacheKey], (result) => {
      const cachedEntry = result[cacheKey];

      if (!cachedEntry) {
        console.log(`[CACHE] No cached data found for ${baseURL}/${postType}`);
        resolve(null);
        return;
      }

      const now = Date.now();
      const expiryTime = cachedEntry.timestamp + (settings.cacheExpiry * 1000);

      if (now > expiryTime) {
        console.log(`[CACHE] Cached data expired for ${baseURL}/${postType} (age: ${(now - cachedEntry.timestamp) / 1000}s)`);
        // Clean up expired entry
        chrome.storage.local.remove([cacheKey]);
        resolve(null);
        return;
      }

      console.log(`[CACHE] Using cached data for ${baseURL}/${postType} (age: ${(now - cachedEntry.timestamp) / 1000}s)`);
      resolve(cachedEntry.data);
    });
  });
}

async function getCachedData(baseURL) {
  // This function is kept for backward compatibility but now checks for partial cache hits
  const settings = await getCacheSettings();
  if (!settings.enableCache) {
    return null;
  }

  // We no longer return full cached data since we're using per-post-type caching
  // Individual post types will be checked during the fetch process
  return null;
}

async function setCachedPostType(baseURL, postType, sectionData) {
  const settings = await getCacheSettings();
  if (!settings.enableCache) {
    return;
  }

  const perPageLimit = await getPerPageLimit();
  const validateUrls = await shouldValidateUrls();

  const cacheKey = getPostTypeCacheKey(baseURL, postType, { perPageLimit, validateUrls });
  const cacheEntry = {
    data: sectionData,
    timestamp: Date.now(),
    baseURL: baseURL,
    postType: postType,
    settings: { perPageLimit, validateUrls }
  };

  chrome.storage.local.set({ [cacheKey]: cacheEntry }, () => {
    console.log(`[CACHE] Cached data for ${baseURL}/${postType} (${sectionData.count} items)`);
  });
}

async function setCachedData(baseURL, data) {
  // This function is kept for backward compatibility
  // Individual post types are now cached separately as they're processed
  console.log(`[CACHE] Skipping full data cache - using per-post-type caching instead`);
}

async function clearAllCache() {
  return new Promise((resolve) => {
    chrome.storage.local.get(null, (items) => {
      const cacheKeys = Object.keys(items).filter(key => key.startsWith('cache_'));

      if (cacheKeys.length === 0) {
        console.log('[CACHE] No cached data to clear');
        resolve(0);
        return;
      }

      chrome.storage.local.remove(cacheKeys, () => {
        console.log(`[CACHE] Cleared ${cacheKeys.length} cached entries`);
        resolve(cacheKeys.length);
      });
    });
  });
}

async function getCacheStats() {
  return new Promise((resolve) => {
    chrome.storage.local.getBytesInUse(null, (bytesInUse) => {
      chrome.storage.local.get(null, (items) => {
        const cacheEntries = Object.keys(items).filter(key => key.startsWith('cache_'));
        const totalEntries = cacheEntries.length;

        resolve({
          totalEntries,
          bytesInUse,
          mbInUse: (bytesInUse / 1024 / 1024).toFixed(2)
        });
      });
    });
  });
}