chrome.action.onClicked.addListener(() => {
  const extensionUrl = chrome.runtime.getURL("popup.html");
  chrome.tabs.create({ url: extensionUrl }, (newTab) => {
    if (chrome.runtime.lastError) {
      console.error("Error creating tab: ", chrome.runtime.lastError.message);
    } else {
      console.log("New tab created: ", newTab);
    }
  });
});
