const setBadgeText = ({ text, color }) => {
  chrome.browserAction.setBadgeBackgroundColor({ color });
  chrome.browserAction.setBadgeText({ text });
};

const functionMap = {
  SET_BADGE_TEXT: setBadgeText,
};

// Listen for content script messages
chrome.runtime.onMessage.addListener((req, sender, sendRes) => {
  if (!req.type) return;

  const func = functionMap[req.type];
  if (!func) return;
  func(req);
});
