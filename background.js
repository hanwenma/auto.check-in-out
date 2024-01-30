const Names = [
  "background-execute-tentcent-script",
  "background-execute-advanced-settings",
  "background-capture-visible-tab",
  "background-execute-juejin-script",
];

// 获取当前 tab 页
async function getCurrentTab() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

// fetch 请求
async function fetchPost(data) {
  let res = await fetch("https://10.18.119.66:1888/sendEmail", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  let json = await res.json();

  return json;
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
      const index = tab.index - 1;

      // 关闭当前 tab 页
      chrome.tabs.remove([tab.id]);

      setTimeout(async () => {
        // 聚焦上一个 tab 页
        await chrome.tabs.highlight({ tabs: index });
        // 接着刷新页面
        chrome.tabs.reload();
      }, 1000);

      break;

    case Names[2]:
      // 截图操作
      chrome.tabs.captureVisibleTab(null, {}, (dataUrl) => {
        chrome.storage.local.set({ captureDataUrl: dataUrl });
      });
      break;

    case Names[3]:
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