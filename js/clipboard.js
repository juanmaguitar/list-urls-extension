async function copyToClipboard(urls) {
  const formattedText = urls.join('\n');
  await navigator.clipboard.writeText(formattedText);
  console.log(`[DEBUG] Copied ${urls.filter(url => !url.includes('===')).length} URLs to clipboard`);
}

function showCopySuccess(button) {
  button.textContent = "✅ Copied!";
  button.classList.add("success");

  setTimeout(() => {
    updateCopyButtonText();
    button.classList.remove("success");
  }, 2000);
}

function showCopyError(button, message = "❌ Copy failed") {
  button.textContent = message;
  setTimeout(() => {
    updateCopyButtonText();
  }, 2000);
}

function formatUrlsForCopy(urlsData) {
  const urls = [];

  urlsData.forEach(sectionData => {
    urls.push(`\n=== ${sectionData.postType.toUpperCase()} ===`);
    sectionData.items.forEach(item => {
      urls.push(item.url);
    });
  });

  return urls;
}

function getFilteredUrlsForCopy() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  const urls = [];

  if (!searchTerm) {
    return window.allUrls || [];
  }

  const sections = document.querySelectorAll(".url-section:not(.hidden)");
  sections.forEach(section => {
    const sectionTitle = section.querySelector('.section-title');
    if (sectionTitle) {
      const postType = sectionTitle.textContent.split(' (')[0];
      urls.push(`\n=== ${postType.toUpperCase()} ===`);
    }

    const urlList = section.querySelector('.url-list');
    if (urlList) {
      const sectionLinks = urlList.querySelectorAll('a:not(.hidden)');
      sectionLinks.forEach(link => {
        urls.push(link.textContent);
      });
    }
  });

  return urls;
}

async function copyFilteredUrls() {
  const copyButton = document.getElementById("copyButton");
  const urlsToCopy = getFilteredUrlsForCopy();

  if (urlsToCopy.length === 0) {
    showCopyError(copyButton, "No URLs to copy");
    return;
  }

  try {
    await copyToClipboard(urlsToCopy);
    showCopySuccess(copyButton);
  } catch (error) {
    console.error(`[DEBUG] Copy failed:`, error);
    showCopyError(copyButton);
  }
}

function updateCopyButtonText() {
  const copyButton = document.getElementById("copyButton");
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();

  if (!searchTerm) {
    const totalUrls = (window.allUrlsData || []).length;
    copyButton.textContent = `📋 Copy All URLs (${totalUrls})`;
  } else {
    const visibleUrls = document.querySelectorAll(".url-list a:not(.hidden)").length;
    copyButton.textContent = `📋 Copy Filtered URLs (${visibleUrls})`;
  }
}