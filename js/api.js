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

async function fetchWordPressData(baseURL) {
  const typesRes = await fetchJSON(`${baseURL}${window.wpRestApiBasePath}wp/v2/types`);
  const urlsData = [];

  for (const typeKey of Object.keys(typesRes)) {
    const info = typesRes[typeKey];
    if (!info.rest_base) continue;

    const postType = info.rest_base;
    const items = await fetchJSON(
      `${baseURL}${window.wpRestApiBasePath}wp/v2/${postType}?per_page=100`
    );

    if (!items || items.length === 0) continue;

    const sectionData = {
      postType,
      count: items.length,
      items: items.filter(item => item.link).map(item => ({
        url: item.link,
        title: item.title ? item.title.rendered : '',
        id: item.id
      }))
    };

    urlsData.push(sectionData);
  }

  return urlsData;
}