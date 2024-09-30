// 自执行函数
(async function () {
  textLogWithStyle("MOA.js is running...");

  // 初始化
  autoAction();

  // 根据情况是否需要刷新页面，重新验证
  isNeedRefresh();
})();

// 自动化提示
function autoAction() {
  // 重置标识
  localStorage.setItem(
    "captureUpdateTime",
    moment().format("YYYY-MM-DD HH:mm:ss")
  );
  // 有值代表是从其他站点跳转的，无值代表是在当前页面刷新，此时需重置刷新次数
  if(document.referrer){
    localStorage.setItem('RefreshCount', 3);
  }

  setTimeout(() => {
    const userName = document.querySelector(".card-box-title").innerText;

    // 发送邮件
    sendEmail({
      title: `${moment().format(
        "YYYY-MM-DD HH:mm:ss"
      )} (${userName}) MOA 验证提醒`,
      content: "【工作日】会自动进行【3 次】认证提示【间隔 8 分钟】请及时进行验证，【周末】会延迟至【第二天】进行验证！",
      userName,
    });

    // 自动验证按钮
    $(".tfa-button").click();
  }, 2000);
}

// 插件本地存储数据
var StorageData = {};

// 过期重刷页面
async function isNeedRefresh() {
  StorageData = await chrome.storage.local.get(["weekendAction","notCheckDates"]);

  // 获取当前日期相关信息
  const { isWeekend } = getWeekDay(StorageData);
  let maxCount = Number(localStorage.getItem('RefreshCount') || '3');

  // 超过 3 次，不再触发验证，并重置 RefreshCount
  if(maxCount <= 1) {
    localStorage.setItem('RefreshCount', 3);
    return;
  };

  // 一次 MOA 认证有效期约为【5 分钟】，若用户未及时进行认证，需重新刷新页面再次发起新的认证
  let delay = 8 * 60 * 1000;

  // 周末等到第二天重新验证
  if(isWeekend){
    const dateStr = moment().format("YYYY-MM-DD");
    delay = moment(`${dateStr} 08:28`)
    .add(1, "days")
    .diff(moment(), "seconds") * 1000;
  }


  // 刷新页面
  setTimeout(() => {
    if(!isWeekend){
      localStorage.setItem('RefreshCount', maxCount - 1);
    }
    window.location.reload();
  }, delay);
}
