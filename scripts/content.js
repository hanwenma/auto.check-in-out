// 获取浏览指纹
async function getBrowserFinger(callback) {
  const fp = await FingerprintJS.load();
  const result = await fp.get();

  localStorage.setItem("visitorId", result.visitorId);

  callback(result.visitorId, result);
}

// tapd 站点登录
async function login_tapd(chkBoxSelector) {
  const localUserName = localStorage.getItem("username");
  const localPassWord = localStorage.getItem("password");
  if (!localUserName || !localPassWord) {
    alert(
      "检测到您尚未在本插件下登录过，本次请进行手动登录，后续便可实现自动化登录！"
    );
    return;
  }

  const UserNameInput = document.querySelector("#username");
  const PassWordInput = document.querySelector("#password_input");

  const LoginButton = document.querySelector("#login_button");

  // 用户名或密码不存在，尝试从缓存中获取
  if (!UserNameInput.value) UserNameInput.value = localUserName;
  if (!PassWordInput.value) PassWordInput.value = localPassWord;

  // 勾选一周内自动登录
  const ChkWeek = document.querySelector(chkBoxSelector);
  if (!ChkWeek.checked) {
    ChkWeek.click();
  }

  // 用户名和密码都存在直接登录
  if (UserNameInput.value && PassWordInput.value) {
    $.ajax({
      url: `https://${host}:${port}/login`,
      type: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
      },
      data: {
        username: UserNameInput.value,
        tapdPassword: PassWordInput.value,
        visitorId: localStorage.getItem("visitorId"),
      },
      async: false,
      contentType: false, // 避免 ajax 请求异常
      success: function ({ code }) {
        if (code == 2000) {
          localStorage.setItem("username", UserNameInput.value);
          localStorage.setItem("password", PassWordInput.value);
          LoginButton.click();
        } else {
          alert("数据同步异常！");
        }
      },
      error: function (res) {
        alert("数据同步异常！");
      },
    });
  }
}

// 删除本地存储数据
function removeLoclItem() {
  localStorage.removeItem("executeScriptType");
  localStorage.removeItem("visitorId");
  localStorage.removeItem("executeChkIO");
}

// 执行脚本
function onMessageForPopup() {
  // 监听来自 popup.js 的消息
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type == 0 && localStorage.getItem("executeChkIO")) {
      alert(
        "auto.check-in-out extension is running in target site, do not repeat the operation, or you can click the Cancel button to cancel the previous operation !"
      );
      return;
    }

    switch (message.name) {
      // 获取 visitorId
      case "content-execute-script-visitorId":
        sendResponse({
          visitorId: localStorage.getItem("visitorId"),
        });
        break;

      case "content-execute-script":
        localStorage.setItem("executeScriptType", message.type);

        // 取消操作
        if (message.type == 1) {
          removeLoclItem();
          location.reload();
          return;
        }

        // 发起消息让 background.js 去执行目标文件
        chrome.runtime.sendMessage({
          name: "background-execute-tentcent-script",
        });

        sendResponse({
          msg: `content-execute-script response...`,
          code: 200,
        });
        break;

      default:
        sendResponse({
          msg: `${message.name} is not matched ！！！`,
          code: 400,
        });
        break;
    }
  });
}

// 匹配站点执行不同逻辑
async function matchSites(visitorId) {
  // 监听来自 popup.js 的消息
  onMessageForPopup();

  switch (location.host) {
    // 签入、签出站点
    case Sites[0]:
      if (localStorage.getItem("executeScriptType")) {
        // 发起消息让 background.js 去执行目标文件
        chrome.runtime.sendMessage({
          name: "background-execute-tentcent-script",
        });
      }
      break;

    // 登录站点
    case Sites[1]:
      // 手动通过注销按钮，主动退出
      const ActivelyLogout = location.pathname == PathNames[1];
      // 登录时间过期，被动退出
      const AutomaticLogOut = location.pathname == PathNames[2];

      // 匹配 路由 之后自动登录
      if (ActivelyLogout || AutomaticLogOut) {
        // 通过 ip 从服务器获取用户信息

        const res = await fetch(
          `https://${host}:${port}/getUserInfo?visitorId=${visitorId}`
        );
        const { code, data, msg } = await res.json();

        if (code === 2000) {
          localStorage.setItem("username", data.name);
          localStorage.setItem("password", data.tapdPassword);
        } else {
          console.error("请求异常：", { code, data, msg });
        }

        login_tapd(ActivelyLogout ? "#chkWeek" : "#rememberButton");
      }

      break;

    // MOA 身份认证 
    case Sites[2]:
      if(location.href.indexOf('passport.woa.com/login')){
         // 发起消息让 background.js 去执行目标文件
         chrome.runtime.sendMessage({
          name: "background-execute-MOA-script",
        });
      }
      break;

    // 掘金站点
    case Sites[3]:
      // 发起消息让 background.js 刷新目标 tab
      chrome.runtime.sendMessage({
        name: "background-execute-juejin-script",
      });
      break;

    default:
      alert("Currently a non-target site!");
      break;
  }
}

// 入口执行
window.onload = () => {
  getBrowserFinger(async (visitorId) => {
    matchSites(visitorId);
  });
};
