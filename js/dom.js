function createUrlCountElement(totalUrls) {
  const urlCount = document.createElement("div");
  urlCount.className = "url-count";
  urlCount.textContent = `Found ${totalUrls} URLs total`;
  return urlCount;
}

function createSectionElement(postType, items) {
  const section = document.createElement("div");
  const heading = document.createElement("h3");
  heading.textContent = `${postType} (${items.length} items)`;
  section.appendChild(heading);

  items.forEach((item) => {
    const a = document.createElement("a");
    a.href = item.url;
    a.target = "_blank";
    a.textContent = item.url;
    section.appendChild(a);
  });

  return section;
}

function renderUrlsData(urlsData) {
  const output = document.getElementById("output");
  const container = document.createElement("div");

  let totalUrls = 0;

  urlsData.forEach(sectionData => {
    const section = createSectionElement(sectionData.postType, sectionData.items);
    container.appendChild(section);
    totalUrls += sectionData.items.length;
  });

  const urlCount = createUrlCountElement(totalUrls);

  output.innerHTML = "";
  output.appendChild(urlCount);
  output.appendChild(container);

  return totalUrls;
}

function showError(message) {
  const output = document.getElementById("output");
  output.textContent = message;
}

function showLoading() {
  const output = document.getElementById("output");
  output.textContent = "Loading URLs...";
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