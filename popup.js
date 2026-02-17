const radios = document.querySelectorAll('input[name="mode"]');

// Load current mode and check the right radio
chrome.storage.local.get("artworkMode", (result) => {
  const mode = result.artworkMode || "show";
  const radio = document.querySelector(`input[value="${mode}"]`);
  if (radio) radio.checked = true;
});

// Save on change
for (const radio of radios) {
  radio.addEventListener("change", () => {
    chrome.storage.local.set({ artworkMode: radio.value });
  });
}
