$(function () {
  let currentTab = null;
  let visitorId = "";

  /* 展示错误信息 */
  function showErrorMsg(msg, shwoForm) {
    if (shwoForm) $("#form").show();

    $(".error_box").show();
    $(".error_box").text(`【 Error 】${msg}`);
  }

  /* 身份认证 */
  function auth(username, tapdPassword) {
    $.ajax({
      url: `https://${host}:${port}/login`,
      type: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
      },
      data: {
        username,
        tapdPassword,
        visitorId,
      },
      async: false,
      contentType: false, // 避免 ajax 请求异常
      success: function (res) {
        if (res.code === 2000) {
          // 有权限才注册事件
          registerBtnEvent();

          //  过渡切换
          $("#form").fadeOut();
          $(".operation-box").fadeIn();

          //  保存账户信息
          localStorage.setItem("username", username);
          localStorage.setItem("tapdPassword", tapdPassword);
        } else {
          showErrorMsg(res.msg, true);
        }
      },
      error: function (res) {
        showErrorMsg(res.msg, true);
      },
    });
  }

  /* 自动认证身份 */
  function autoAuth() {
    $.get(`https://${host}:${port}/getUserInfo?visitorId=${visitorId}`).then(
      (res) => {
        const { code, data } = res;
        if (code === 2000) {
          localStorage.setItem("username", data.name);
          localStorage.setItem("tapdPassword", data.tapdPassword);
          localStorage.setItem("visitorId", data.visitorId);
        }

        const username = localStorage.getItem("username");
        const tapdPassword = localStorage.getItem("tapdPassword");

        //  有值就自动认证
        if (username && tapdPassword) {
          auth(username, tapdPassword);
        } else {
          $("#form").show();
        }
      }
    );
  }

  /* 注册表单提交事件 */
  function registerFormEvent() {
    $("#form").submit(function onsubmit(event) {
      event.preventDefault();

      const username = $("#username").val();
      const tapdPassword = $("#tapd_password").val();

      auth(username, tapdPassword);
    });
  }

  /* 注册按钮事件 */
  function registerBtnEvent() {
    /* 签入/签出操作 */
    const btns = Array.from($(".operation-box .btn"));
    btns.forEach((item, index) => {
      item.onclick = () => {
        btnActions(index);
      };
    });
  }

  /* 注册日期事件 */
  function registerDateEvent() {
    // 初始化
    const notCheckDates = JSON.parse(StorageData.notCheckDates||'[]');
    $("#start-date").val(notCheckDates[0] || "");
    $("#start-date").attr("max", notCheckDates[1] || "");
    $("#end-date").val(notCheckDates[1] || "");
    $("#end-date").attr("min", notCheckDates[0] || "");

    // 具体事件
    $("#start-date").on("change", function () {
      const value = $(this).val();

      // 设置结束日期最小值
      $("#end-date").attr("min", value);
    });

    $("#end-date").on("change", function () {
      const value = $(this).val();

      // 设置开始日期最小值
      $("#start-date").attr("max", value);
    });
  }

  /* 注册单选框事件 */
 function registerCheckboxEvent() {
    // 初始化
    $("#weekend-checkbox").attr("checked", !!StorageData.weekendAction);

    // 具体事件
    $("#weekend-checkbox").on("change", function () {
      console.log($("input[type='checkbox']:checked").length);
    });
  }

  function getCurrDate(){
    const d = new Date();
    let year = d.getFullYear(), month = d.getMonth() + 1, date = d.getDate();
    if(month < 10){
      month = '0' + month;
    }
    if(date < 10){
      date = '0' + date;
    }
    return `${year}-${month}-${date}`;
  }

  /* 按钮操作 */
  async function btnActions(type) {
    $(".loading").show();

    // 处理无需打卡日期范围值
    const notCheckDates = [];
    const startDate = $("#start-date").val();
    const endDate = $("#end-date").val();
    if (startDate || endDate) {
      notCheckDates.push(startDate, endDate);
    }

    // 周末是否需要打卡
    const weekendAction = $("input[type='checkbox']:checked").length
      ? "checked"
      : "";
    
    // 存储数据
    await chrome.storage.local.set({ weekendAction, weekendActionDate: weekendAction ? getCurrDate() : '', notCheckDates: JSON.stringify(notCheckDates || []) });

    // 0 - 签入和签出  1 - 取消
    const response = await chrome.tabs.sendMessage(currentTab.id, {
      name: "content-execute-script",
      type,
    });

    let delay = 500;

    // 取消操作
    if (type === 1) {
      delay = 1000;

      $("#start-date").val("");
      $("#end-date").val("");
      $("#weekend-checkbox").attr("checked", false);
      await chrome.storage.local.set({ weekendAction:'', notCheckDates: '[]' });
    }

    // 延时关闭 loading
    setTimeout(() => {
      $(".loading").hide();
    }, delay);

    if (response && response.code != 200) {
      showErrorMsg(response.msg);
    } else {
      $(".error_box").hide();
    }
  }

  /* 初始化隐藏 */
  function hideEle() {
    $("#form").hide();
    $(".operation-box").hide();
    $(".error_box").hide();
    $(".loading").hide();
  }

  /* 获取当前 tab 页 */
  async function getCurrentTab() {
    // 获取当前 tab 页
    const queryOptions = { active: true, currentWindow: true };
    const [tab] = await chrome.tabs.query(queryOptions);
    currentTab = tab;
    return tab;
  }

  /* 判断是否是目标站点 */
  function isTargetSite() {
    const currentUrl = currentTab.url.split("?")[0];
    if (currentUrl.indexOf(`${Sites[1]}${PathNames[2]}`) > -1) {
      alert(
        "当前为登录页，插件默认会进行自动登录，若没有，请先在登录页面进行登录操作！"
      );
      return;
    }

    const inTargetSite = currentUrl.indexOf(Sites[0]) > -1;
    if (!inTargetSite) {
      const res = window.confirm("当前非目标站点，是否打开目标站点！");
      if (res) {
        chrome.tabs.query({}, (tabs) => {
          const tab = tabs.find((v) => v.url.indexOf(Sites[0]) > -1);
          if (tab) {
            chrome.tabs.highlight({ tabs: tab.index }, async (win) => {
              // 当使用已存在 tab 页时，刷新一下对应页面，避免页面处于旧的状态
              const tab = await getCurrentTab();
              chrome.tabs.reload(tab.id);
            });
          } else {
            chrome.tabs.create({ url: `https://${Sites[0]}` });
          }
        });
      }
    }
    return inTargetSite;
  }

  // 插件本地存储数据
var StorageData = {};

  /* 初始化页面内容 */
  async function initPage() {
    // 初始化隐藏
    hideEle();

    StorageData = await chrome.storage.local.get(["weekendAction",'notCheckDates']);

    // 获取当前 tab 页
    await getCurrentTab();

    // 判断是否是目标站点
    if (!isTargetSite()) {
      return;
    }

    // 注册表单事件
    registerFormEvent();

    // 注册日期事件
    registerDateEvent();

    // 注册单选框事件
    registerCheckboxEvent();

    // 判断是否需要自动进行权限认证
    const response = await chrome.tabs.sendMessage(currentTab.id, {
      name: "content-execute-script-visitorId",
    });

    visitorId = response.visitorId;
    localStorage.setItem("visitorId", visitorId);
    autoAuth();
  }

  initPage();
});
