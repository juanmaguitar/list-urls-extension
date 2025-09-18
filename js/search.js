function highlightSearchTerm(text, searchTerm) {
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, '<span class="highlight">$1</span>');
}

function filterUrls() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  const searchInfo = document.getElementById("searchInfo");
  const sections = document.querySelectorAll(".url-section");

  if (!searchTerm) {
    showAllUrls(sections);
    searchInfo.textContent = "";
    return;
  }

  const { visibleCount, totalCount } = filterUrlsBySector(sections, searchTerm);
  updateSearchInfo(searchInfo, visibleCount, totalCount);
}

function showAllUrls(sections) {
  sections.forEach(section => {
    section.classList.remove("hidden");
    const urlList = section.querySelector('.url-list');
    if (urlList) {
      urlList.querySelectorAll('a').forEach(link => {
        link.innerHTML = link.textContent;
        link.classList.remove("hidden");
      });
    }
  });
}

function filterUrlsBySector(sections, searchTerm) {
  let visibleCount = 0;
  let totalCount = 0;

  sections.forEach(section => {
    const urlList = section.querySelector('.url-list');
    if (!urlList) return;

    const links = urlList.querySelectorAll('a');
    let sectionHasVisibleLinks = false;

    links.forEach(link => {
      totalCount++;
      const url = link.textContent.toLowerCase();

      if (url.includes(searchTerm)) {
        link.innerHTML = highlightSearchTerm(link.textContent, searchTerm);
        link.classList.remove("hidden");
        sectionHasVisibleLinks = true;
        visibleCount++;
      } else {
        link.innerHTML = link.textContent;
        link.classList.add("hidden");
      }
    });

    if (sectionHasVisibleLinks) {
      section.classList.remove("hidden");
      urlList.classList.remove("collapsed");
      const toggleIcon = section.querySelector('.toggle-icon');
      if (toggleIcon) toggleIcon.textContent = '▼';
    } else {
      section.classList.add("hidden");
    }
  });

  return { visibleCount, totalCount };
}

function updateSearchInfo(searchInfo, visibleCount, totalCount) {
  if (visibleCount === 0) {
    searchInfo.textContent = "🚫 No URLs found matching your search";
  } else {
    searchInfo.textContent = `📊 Showing ${visibleCount} of ${totalCount} URLs`;
  }
}

function setupSearchEventListeners() {
  const searchInput = document.getElementById("searchInput");

  searchInput.addEventListener('input', () => {
    filterUrls();
    updateCopyButtonText();
  });
}