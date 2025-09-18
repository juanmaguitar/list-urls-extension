function createUrlCountElement(totalUrls) {
  const urlCount = document.createElement("div");
  urlCount.className = "url-count";
  urlCount.textContent = `Found ${totalUrls} URLs total`;
  return urlCount;
}

function createSectionElement(postType, items) {
  const section = document.createElement("div");
  section.className = "url-section";

  const header = document.createElement("div");
  header.className = "section-header";
  header.innerHTML = `
    <span class="toggle-icon">v</span>
    <span class="section-title">${postType} (${items.length} items)</span>
  `;

  const urlList = document.createElement("div");
  urlList.className = "url-list";

  items.forEach((item) => {
    const a = document.createElement("a");
    a.href = item.url;
    a.target = "_blank";
    a.textContent = item.url;
    urlList.appendChild(a);
  });

  header.addEventListener('click', () => toggleSection(section));

  section.appendChild(header);
  section.appendChild(urlList);

  return section;
}

function toggleSection(section) {
  const urlList = section.querySelector('.url-list');
  const toggleIcon = section.querySelector('.toggle-icon');

  if (urlList.classList.contains('collapsed')) {
    urlList.classList.remove('collapsed');
    toggleIcon.textContent = 'v';
  } else {
    urlList.classList.add('collapsed');
    toggleIcon.textContent = '>';
  }
}

async function renderUrlsData(urlsData, cacheStats = null) {
  const output = document.getElementById("output");
  const container = document.createElement("div");

  let totalUrls = 0;

  urlsData.forEach(sectionData => {
    const section = createSectionElement(sectionData.postType, sectionData.items);
    container.appendChild(section);
    totalUrls += sectionData.items.length;
  });

  const urlCount = createUrlCountElement(totalUrls);

  // Add validation status info
  const validationInfo = document.createElement("div");
  const isValidationEnabled = await shouldValidateUrls();
  validationInfo.className = isValidationEnabled ? "validation-info validated" : "validation-info not-validated";
  validationInfo.textContent = isValidationEnabled
    ? "✓ URLs validated for accessibility"
    : "⚠ URLs not validated (faster but may include broken links)";

  // Add cache status info
  const cacheInfo = document.createElement("div");
  cacheInfo.className = "cache-info";
  const cacheSettings = await getCacheSettings();
  if (cacheSettings.enableCache) {
    if (cacheStats && (cacheStats.cachedCount > 0 || cacheStats.freshCount > 0)) {
      const { cachedCount, freshCount } = cacheStats;
      if (cachedCount > 0 && freshCount > 0) {
        cacheInfo.textContent = `💾 Partial cache hit: ${cachedCount} cached, ${freshCount} fresh post types`;
      } else if (cachedCount > 0 && freshCount === 0) {
        cacheInfo.textContent = `💾 All results loaded from cache (${cachedCount} post types)`;
      } else {
        cacheInfo.textContent = `💾 All results freshly fetched and cached (${freshCount} post types)`;
      }
    } else {
      cacheInfo.textContent = "💾 Results cached for faster future loads";
    }
  } else {
    cacheInfo.textContent = "🔄 Fresh data fetched (caching disabled)";
  }

  output.innerHTML = "";
  output.appendChild(urlCount);
  output.appendChild(validationInfo);
  output.appendChild(cacheInfo);
  output.appendChild(container);

  return totalUrls;
}

function showError(message) {
  const output = document.getElementById("output");
  output.textContent = message;
}

function showStatus(message) {
  const output = document.getElementById("output");
  output.textContent = message;
}

function showLoading() {
  showStatus("Loading URLs...");
}

function showControls(totalUrls) {
  const copyButton = document.getElementById("copyButton");
  const searchContainer = document.getElementById("searchContainer");

  if (totalUrls > 0) {
    copyButton.style.display = "block";
    copyButton.textContent = `Copy All URLs (${totalUrls})`;
    searchContainer.style.display = "block";
  }
}