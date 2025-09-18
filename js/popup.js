window.allUrls = [];
window.allUrlsData = [];

async function main() {
  showStatus("Getting current tab information...");
  window.allUrls = [];
  window.allUrlsData = [];

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    const baseURL = new URL(tab.url).origin;

    console.log(`[DEBUG] Current tab URL: ${tab.url}`);
    console.log(`[DEBUG] Extracted base URL: ${baseURL}`);

    showStatus("Checking if site is WordPress...");
    console.log(`[DEBUG] Checking if site is WordPress...`);
    const isWordPress = await checkWordPressSite(baseURL);

    if (!isWordPress) {
      throw new Error(`This doesn't appear to be a WordPress site. No WordPress REST API detected at ${baseURL}`);
    }

    showStatus("WordPress detected! Fetching post types...");
    console.log(`[DEBUG] WordPress detected! Proceeding to fetch post types...`);
    console.log(`[DEBUG] Using REST API path: ${window.wpRestApiBasePath}`);

    const response = await fetchWordPressData(baseURL);
    const { urlsData, cacheStats } = response;

    showStatus("Processing and validating URLs...");

    window.allUrls = formatUrlsForCopy(urlsData);
    window.allUrlsData = urlsData.flatMap(section =>
      section.items.map(item => ({
        ...item,
        postType: section.postType
      }))
    );

    const totalUrls = await renderUrlsData(urlsData, cacheStats);
    showControls(totalUrls);

  } catch (err) {
    console.error(`[DEBUG] Main function error:`, err);

    let errorMessage = `Error: ${err.message}`;

    if (err.message.includes('404')) {
      errorMessage += `\n\nPossible causes:\n• Site is not WordPress\n• WordPress REST API is disabled\n• Different API path structure`;
    } else if (err.message.includes('CORS')) {
      errorMessage += `\n\nThis might be a CORS (Cross-Origin) issue. Try refreshing the page.`;
    } else if (err.message.includes("doesn't appear to be a WordPress site")) {
      errorMessage += `\n\nThis extension only works on WordPress sites with REST API enabled.`;
    }

    showError(errorMessage);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const copyButton = document.getElementById("copyButton");
  copyButton.addEventListener('click', copyFilteredUrls);
  setupSearchEventListeners();
  setupSettingsEventListeners();
});

main();
