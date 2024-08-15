const Names = [
  "background-execute-tentcent-script",
  "background-capture-visible-tab",
  "background-tentcent-active-tab",
  "background-execute-MOA-script",
  "background-execute-juejin-script",
];

// 获取当前 tab 页
async function getCurrentTab() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

// 监听来自 content.js 的消息
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  const tab = await getCurrentTab();

  if (tab.url?.startsWith("chrome://")) {
    return;
  }

  switch (message.name) {
    case Names[0]:
      // 执行脚本
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: [
          "/libs/tesseract.min.js",
          "/libs/jquery.min.js",
          "/libs/moment.min.js",
          "/libs/fp.min.js",
          "/utils/index.js",
          "tentcent.js",
        ],
      });
      break;

    case Names[1]:
      // 截图操作
      chrome.tabs.captureVisibleTab(null, {}, (dataUrl) => {
        chrome.storage.local.set({ captureDataUrl: dataUrl });
      });
      break;

    case Names[2]:
      const [targetTab] = await chrome.tabs.query({
        url: "*://om.tencent.com/*",
      });
      chrome.tabs.highlight({ tabs: targetTab.index });
      break;

    case Names[3]:
      // 截图操作
      chrome.tabs.captureVisibleTab(null, {}, (dataUrl) => {
        chrome.storage.local.set({ captureDataUrl: dataUrl });

        // 执行脚本
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["/libs/jquery.min.js", "/libs/moment.min.js", "/utils/index.js", "moa.js"],
        });
      });
      break;

    case Names[4]:
      // 执行脚本
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["/libs/jquery.min.js", "/libs/moment.min.js", "juejin.js"],
      });
      break;
  }
});

// onInstalled 事件
chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({
    text: "ACM",
  });
});
