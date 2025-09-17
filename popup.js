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
  
  // Method 1: Check for standard wp-json endpoint
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
        // Store the working path for later use
        window.wpRestApiBasePath = path;
        console.log(`[DEBUG] Found working WordPress REST API path: ${path}`);
        return true;
      }
    } catch (error) {
      console.log(`[DEBUG] ${path} endpoint error:`, error.message);
    }
  }
  
  // Method 2: Check for common WordPress indicators in HTML
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

let allUrls = []; // Store all URLs for copying
let allUrlsData = []; // Store URL data with metadata for filtering

async function copyAllUrls() {
  const copyButton = document.getElementById("copyButton");
  
  if (allUrls.length === 0) {
    copyButton.textContent = "No URLs to copy";
    setTimeout(() => {
      copyButton.textContent = "Copy All URLs";
    }, 2000);
    return;
  }

  try {
    // Format URLs as one per line, grouped by post type
    const formattedText = allUrls.join('\n');
    
    await navigator.clipboard.writeText(formattedText);
    
    // Visual feedback
    copyButton.textContent = "Copied!";
    copyButton.classList.add("success");
    
    setTimeout(() => {
      copyButton.textContent = "Copy All URLs";
      copyButton.classList.remove("success");
    }, 2000);
    
    console.log(`[DEBUG] Copied ${allUrls.length} URLs to clipboard`);
  } catch (error) {
    console.error(`[DEBUG] Copy failed:`, error);
    copyButton.textContent = "Copy failed";
    setTimeout(() => {
      copyButton.textContent = "Copy All URLs";
    }, 2000);
  }
}

async function main() {
  const output = document.getElementById("output");
  const copyButton = document.getElementById("copyButton");
  const searchContainer = document.getElementById("searchContainer");
  
  output.textContent = "Loading URLs...";
  allUrls = []; // Reset URLs array
  allUrlsData = []; // Reset URL data array

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    const baseURL = new URL(tab.url).origin;
    
    console.log(`[DEBUG] Current tab URL: ${tab.url}`);
    console.log(`[DEBUG] Extracted base URL: ${baseURL}`);
    
    // First, let's check if this might be a WordPress site
    console.log(`[DEBUG] Checking if site is WordPress...`);
    const isWordPress = await checkWordPressSite(baseURL);
    
    if (!isWordPress) {
      throw new Error(`This doesn't appear to be a WordPress site. No WordPress REST API detected at ${baseURL}`);
    }

    console.log(`[DEBUG] WordPress detected! Proceeding to fetch post types...`);
    console.log(`[DEBUG] Using REST API path: ${window.wpRestApiBasePath}`);
    const typesRes = await fetchJSON(`${baseURL}${window.wpRestApiBasePath}wp/v2/types`);
    const container = document.createElement("div");

    let totalUrls = 0;

    for (const typeKey of Object.keys(typesRes)) {
      const info = typesRes[typeKey];
      if (!info.rest_base) continue;

      const postType = info.rest_base;
      const items = await fetchJSON(
        `${baseURL}${window.wpRestApiBasePath}wp/v2/${postType}?per_page=100`
      );

      if (!items || items.length === 0) continue;

      const section = document.createElement("div");
      const heading = document.createElement("h3");
      heading.textContent = `${postType} (${items.length} items)`;
      section.appendChild(heading);

      // Add section header to allUrls for better formatting
      allUrls.push(`\n=== ${postType.toUpperCase()} ===`);

      items.forEach((item) => {
        if (!item.link) return;
        
        // Add URL to the copy array
        allUrls.push(item.link);
        
        // Store URL data for filtering
        allUrlsData.push({
          url: item.link,
          postType: postType,
          title: item.title ? item.title.rendered : '',
          id: item.id
        });
        
        totalUrls++;
        
        const a = document.createElement("a");
        a.href = item.link;
        a.target = "_blank";
        a.textContent = item.link;
        section.appendChild(a);
      });

      container.appendChild(section);
    }

    // Add URL count info
    const urlCount = document.createElement("div");
    urlCount.className = "url-count";
    urlCount.textContent = `Found ${totalUrls} URLs total`;
    
    output.innerHTML = "";
    output.appendChild(urlCount);
    output.appendChild(container);
    
    // Show copy button and search if we have URLs
    if (totalUrls > 0) {
      copyButton.style.display = "block";
      copyButton.textContent = `Copy All URLs (${totalUrls})`;
      searchContainer.style.display = "block";
    }
  } catch (err) {
    console.error(`[DEBUG] Main function error:`, err);
    
    let errorMessage = `Error: ${err.message}`;
    
    // Provide more specific error messages based on the error
    if (err.message.includes('404')) {
      errorMessage += `\n\nPossible causes:\n• Site is not WordPress\n• WordPress REST API is disabled\n• Different API path structure`;
    } else if (err.message.includes('CORS')) {
      errorMessage += `\n\nThis might be a CORS (Cross-Origin) issue. Try refreshing the page.`;
    } else if (err.message.includes("doesn't appear to be a WordPress site")) {
      errorMessage += `\n\nThis extension only works on WordPress sites with REST API enabled.`;
    }
    
    output.textContent = errorMessage;
  }
}

function filterUrls() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  const searchInfo = document.getElementById("searchInfo");
  const sections = document.querySelectorAll("#output > div:not(.url-count)");
  
  if (!searchTerm) {
    // Show all URLs when search is empty
    sections.forEach(section => {
      section.classList.remove("hidden");
      // Remove any highlighting
      section.querySelectorAll('a').forEach(link => {
        link.innerHTML = link.textContent;
      });
    });
    searchInfo.textContent = "";
    return;
  }
  
  let visibleCount = 0;
  let totalCount = 0;
  
  sections.forEach(section => {
    const links = section.querySelectorAll('a');
    let sectionHasVisibleLinks = false;
    
    links.forEach(link => {
      totalCount++;
      const url = link.textContent.toLowerCase();
      
      if (url.includes(searchTerm)) {
        // Highlight matching text
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        link.innerHTML = link.textContent.replace(regex, '<span class="highlight">$1</span>');
        link.classList.remove("hidden");
        sectionHasVisibleLinks = true;
        visibleCount++;
      } else {
        link.innerHTML = link.textContent;
        link.classList.add("hidden");
      }
    });
    
    // Hide section if no links are visible
    if (sectionHasVisibleLinks) {
      section.classList.remove("hidden");
    } else {
      section.classList.add("hidden");
    }
  });
  
  // Update search info
  if (visibleCount === 0) {
    searchInfo.textContent = "No URLs found matching your search";
  } else {
    searchInfo.textContent = `Showing ${visibleCount} of ${totalCount} URLs`;
  }
}

function copyFilteredUrls() {
  const copyButton = document.getElementById("copyButton");
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  
  let urlsToCopy = [];
  
  if (!searchTerm) {
    // No filter, copy all URLs
    urlsToCopy = allUrls;
  } else {
    // Copy only visible/filtered URLs
    const visibleLinks = document.querySelectorAll("#output a:not(.hidden)");
    
    // Group by sections for better formatting
    const sections = document.querySelectorAll("#output > div:not(.url-count):not(.hidden)");
    sections.forEach(section => {
      const heading = section.querySelector('h3');
      if (heading) {
        const postType = heading.textContent.split(' (')[0]; // Remove count
        urlsToCopy.push(`\n=== ${postType.toUpperCase()} ===`);
      }
      
      const sectionLinks = section.querySelectorAll('a:not(.hidden)');
      sectionLinks.forEach(link => {
        urlsToCopy.push(link.textContent);
      });
    });
  }
  
  if (urlsToCopy.length === 0) {
    copyButton.textContent = "No URLs to copy";
    setTimeout(() => {
      updateCopyButtonText();
    }, 2000);
    return;
  }

  try {
    const formattedText = urlsToCopy.join('\n');
    navigator.clipboard.writeText(formattedText);
    
    copyButton.textContent = "Copied!";
    copyButton.classList.add("success");
    
    setTimeout(() => {
      updateCopyButtonText();
      copyButton.classList.remove("success");
    }, 2000);
    
    console.log(`[DEBUG] Copied ${urlsToCopy.filter(url => !url.includes('===')).length} URLs to clipboard`);
  } catch (error) {
    console.error(`[DEBUG] Copy failed:`, error);
    copyButton.textContent = "Copy failed";
    setTimeout(() => {
      updateCopyButtonText();
    }, 2000);
  }
}

function updateCopyButtonText() {
  const copyButton = document.getElementById("copyButton");
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  
  if (!searchTerm) {
    const totalUrls = allUrlsData.length;
    copyButton.textContent = `Copy All URLs (${totalUrls})`;
  } else {
    const visibleUrls = document.querySelectorAll("#output a:not(.hidden)").length;
    copyButton.textContent = `Copy Filtered URLs (${visibleUrls})`;
  }
}

// Set up event listeners
document.addEventListener('DOMContentLoaded', () => {
  const copyButton = document.getElementById("copyButton");
  const searchInput = document.getElementById("searchInput");
  
  // Update copy function to handle filtered URLs
  copyButton.addEventListener('click', copyFilteredUrls);
  
  // Real-time search filtering
  searchInput.addEventListener('input', () => {
    filterUrls();
    updateCopyButtonText();
  });
});

main();
