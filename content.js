let currentMode = "show";

// Apply stored artwork mode on page load
chrome.storage.local.get("artworkMode", (result) => {
  currentMode = result.artworkMode || "show";
  applyMode(currentMode);
});

// React to changes from the popup in real-time
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.artworkMode) {
    currentMode = changes.artworkMode.newValue || "show";
    applyMode(currentMode);
  }
});

function applyMode(mode) {
  // Light DOM (handled by content.css)
  if (mode !== "show") {
    document.documentElement.dataset.amArtwork = mode;
  } else {
    delete document.documentElement.dataset.amArtwork;
  }
  // Shadow DOM (player bar web components)
  injectIntoShadowRoots(mode);
}

// Inject styles into amp-lcd shadow roots that content.css can't reach
function injectIntoShadowRoots(mode) {
  document.querySelectorAll("amp-lcd").forEach((el) => {
    if (el.shadowRoot) {
      applyShadowStyle(el.shadowRoot, mode);
    }
  });
}

function applyShadowStyle(shadowRoot, mode) {
  let style = shadowRoot.getElementById("am-artwork-ext");
  if (!style) {
    style = document.createElement("style");
    style.id = "am-artwork-ext";
    shadowRoot.appendChild(style);
  }

  if (mode === "blur") {
    style.textContent =
      ".lcd__artwork-container { overflow: hidden; } " +
      "picture img, .lcd__artwork-img, img[class*='artwork'] { filter: blur(5px); }";
  } else if (mode === "hide") {
    style.textContent =
      "picture img, .lcd__artwork-img, img[class*='artwork'] { visibility: hidden; }";
  } else {
    style.textContent = "";
  }
}

// Watch for dynamically added amp-lcd elements (player bar loads after page)
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      const lcds =
        node.tagName === "AMP-LCD"
          ? [node]
          : Array.from(node.querySelectorAll?.("amp-lcd") || []);
      for (const lcd of lcds) {
        // Shadow root may attach slightly after the element is added
        waitForShadowRoot(lcd);
      }
    }
  }
});
observer.observe(document.documentElement, { childList: true, subtree: true });

function waitForShadowRoot(el, attempts = 0) {
  if (el.shadowRoot) {
    applyShadowStyle(el.shadowRoot, currentMode);
  } else if (attempts < 20) {
    requestAnimationFrame(() => waitForShadowRoot(el, attempts + 1));
  }
}
