async function fetchJSON(url) {
  console.log(`[DEBUG] Attempting to fetch: ${url}`);
  try {
    const res = await fetch(url, { credentials: "omit" });
    console.log(`[DEBUG] Response status: ${res.status} ${res.statusText}`);
    console.log(`[DEBUG] Response headers:`, Object.fromEntries(res.headers.entries()));

    if (!res.ok) {
      const responseText = await res.text();
      console.log(`[DEBUG] Error response body:`, responseText);
      throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    console.log(`[DEBUG] Successfully fetched data from ${url}:`, data);
    return data;
  } catch (error) {
    console.error(`[DEBUG] Fetch error for ${url}:`, error);
    throw error;
  }
}

async function checkWordPressSite(baseURL) {
  console.log(`[DEBUG] Starting WordPress detection for: ${baseURL}`);

  const wpJsonPaths = [
    '/wp-json/',
    '/index.php/wp-json/',
    '/?rest_route=/'
  ];

  for (const path of wpJsonPaths) {
    try {
      const wpJsonResponse = await fetch(`${baseURL}${path}`, { credentials: "omit" });
      console.log(`[DEBUG] ${path} endpoint status: ${wpJsonResponse.status}`);
      if (wpJsonResponse.ok) {
        const data = await wpJsonResponse.json();
        console.log(`[DEBUG] ${path} endpoint data:`, data);
        window.wpRestApiBasePath = path;
        console.log(`[DEBUG] Found working WordPress REST API path: ${path}`);
        return true;
      }
    } catch (error) {
      console.log(`[DEBUG] ${path} endpoint error:`, error.message);
    }
  }

  try {
    const htmlResponse = await fetch(baseURL, { credentials: "omit" });
    if (htmlResponse.ok) {
      const html = await htmlResponse.text();
      const wpIndicators = [
        'wp-content',
        'wp-includes',
        'wordpress',
        'wp-json',
        'generator.*wordpress'
      ];

      const foundIndicators = wpIndicators.filter(indicator =>
        new RegExp(indicator, 'i').test(html)
      );

      console.log(`[DEBUG] WordPress indicators found in HTML:`, foundIndicators);

      if (foundIndicators.length > 0) {
        console.log(`[DEBUG] Site appears to be WordPress based on HTML content`);
        return true;
      }
    }
  } catch (error) {
    console.log(`[DEBUG] HTML check error:`, error.message);
  }

  console.log(`[DEBUG] No WordPress indicators found`);
  return false;
}

async function validateUrl(url) {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      credentials: 'omit'
    });
    return response.ok;
  } catch (error) {
    console.log(`[DEBUG] URL validation failed for ${url}:`, error.message);
    return false;
  }
}

async function validateUrls(items, postType) {
  const validItems = [];
  const totalItems = items.length;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.link) continue;

    if (totalItems > 10) {
      // Only show progress for larger sets to avoid spam
      showStatus(`🔍 Validating ${postType} URLs... (${i + 1}/${totalItems})`);
    }

    const isValid = await validateUrl(item.link);
    if (isValid) {
      validItems.push({
        url: item.link,
        title: item.title ? item.title.rendered : '',
        id: item.id
      });
    } else {
      console.log(`[DEBUG] Skipping invalid URL: ${item.link}`);
    }
  }

  return validItems;
}

async function fetchAllItemsForPostType(baseURL, postType, desiredLimit) {
  let allItems = [];
  let page = 1;
  let perPage = Math.min(desiredLimit, 100); // Start with max 100 per page
  let totalFetched = 0;

  while (totalFetched < desiredLimit) {
    const remainingNeeded = desiredLimit - totalFetched;
    const currentPerPage = Math.min(perPage, remainingNeeded);

    showStatus(`📄 Fetching ${postType} page ${page} (${totalFetched}+ items so far)...`);

    try {
      const items = await fetchJSON(
        `${baseURL}${window.wpRestApiBasePath}wp/v2/${postType}?per_page=${currentPerPage}&page=${page}`
      );

      if (!items || items.length === 0) {
        console.log(`[DEBUG] No more items found for ${postType} at page ${page}`);
        break;
      }

      allItems = allItems.concat(items);
      totalFetched += items.length;
      console.log(`[DEBUG] Fetched ${items.length} items from ${postType} page ${page} (total: ${totalFetched})`);

      // If we got fewer items than requested per page, we've reached the end
      if (items.length < currentPerPage) {
        console.log(`[DEBUG] Reached end of ${postType} results (got ${items.length} < ${currentPerPage})`);
        break;
      }

      page++;
    } catch (error) {
      if (error.message.includes('per_page must be between') && perPage > 10) {
        // Server has a lower limit, try with 100 items per page
        console.log(`[DEBUG] Server limit detected for ${postType}, falling back to 100 per page`);
        perPage = 100;
        continue; // Retry with lower limit
      } else {
        console.log(`[DEBUG] Error fetching ${postType} page ${page}:`, error.message);
        throw error; // Re-throw for other errors
      }
    }
  }

  return allItems;
}

async function fetchWordPressData(baseURL) {
  showStatus("💾 Checking for cached data...");

  const typesRes = await fetchJSON(`${baseURL}${window.wpRestApiBasePath}wp/v2/types`);
  const urlsData = [];
  const postTypes = Object.keys(typesRes).filter(key => typesRes[key].rest_base);
  const validateEnabled = await shouldValidateUrls();
  const perPageLimit = await getPerPageLimit();

  let cachedCount = 0;
  let freshCount = 0;

  for (let i = 0; i < postTypes.length; i++) {
    const typeKey = postTypes[i];
    const info = typesRes[typeKey];
    const postType = info.rest_base;

    // Check if this post type is already cached
    const cachedPostTypeData = await getCachedPostType(baseURL, postType);

    if (cachedPostTypeData) {
      showStatus(`💾 Loading cached ${postType} (${i + 1}/${postTypes.length})...`);
      urlsData.push(cachedPostTypeData);
      cachedCount++;
      console.log(`[DEBUG] Using cached data for ${postType} (${cachedPostTypeData.count} items)`);
      continue;
    }

    // Fetch fresh data for this post type
    freshCount++;
    showStatus(`📡 Fetching ${postType} (${i + 1}/${postTypes.length})...`);

    try {
      const items = await fetchAllItemsForPostType(baseURL, postType, perPageLimit);

      if (!items || items.length === 0) {
        console.log(`[DEBUG] No items found for post type: ${postType}`);
        continue;
      }

      let processedItems;

      if (validateEnabled) {
        showStatus(`✅ Validating ${items.length} URLs for ${postType}...`);
        console.log(`[DEBUG] Validating URLs for post type: ${postType}`);
        processedItems = await validateUrls(items, postType);

        if (processedItems.length === 0) {
          console.log(`[DEBUG] No valid URLs found for post type: ${postType}`);
          continue;
        }

        console.log(`[DEBUG] Found ${processedItems.length} valid URLs for ${postType}`);
      } else {
        console.log(`[DEBUG] Skipping validation for ${postType} (${items.length} items)`);
        processedItems = items.filter(item => item.link).map(item => ({
          url: item.link,
          title: item.title ? item.title.rendered : '',
          id: item.id
        }));
      }

      const sectionData = {
        postType,
        count: processedItems.length,
        items: processedItems
      };

      urlsData.push(sectionData);

      // Cache this post type data immediately after processing
      await setCachedPostType(baseURL, postType, sectionData);

    } catch (error) {
      console.log(`[DEBUG] Skipping post type '${postType}' due to error:`, error.message);
      // Continue with other post types instead of failing completely
      continue;
    }
  }

  console.log(`[DEBUG] Fetch summary: ${cachedCount} cached, ${freshCount} fresh post types`);

  return {
    urlsData,
    cacheStats: {
      cachedCount,
      freshCount,
      totalPostTypes: postTypes.length
    }
  };
}