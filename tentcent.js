// 异常监听
let lastError = null;
window.onerror = (message, url, lineNo, columnNo) => {
  const error = {
    message,
    url,
    lineNo,
    columnNo,
  };

  const currError = JSON.stringify(error);
  // 防止同一个错误不断上报
  if (currError != lastError) {
    lastError = currError;

    // 上报异常日志
    sendEmail("程序执行出现异常！", currError);
  }
};

// 计时器变量
let interval, interval0, interval1, interval2;
// 当前是否已迁出
let hasCheckInOrOut = false;
// 当前操作类型
let currentCheckType = -1;

// 触发签入、签出
function checkTrigger() {
  //  轮询判断弹窗内容是否完全加载
  clearInterval(interval2);
  interval2 = setInterval(() => {
    textLogWithStyle("Check whether the content has been loaded ...");

    if ($("#check_in_table")[0]) {
      clearInterval(interval2);

      // 存在验证码
      if ($("#image")[0]) {
        // 等待验证码图片加载完成
        $("#image")[0].onload = () => {
          // 已 签入、签出，不在触发相关逻辑，避免重复签出，重复发邮件
          if (hasCheckInOrOut) {
            textLogWithStyle(
              `Check ${
                currentCheckType == 1 ? "out" : "in"
              } successfully, this check out operation has been blocked !!!`,
              "#f40"
            );
            return;
          }

          // 检验验证码
          getVerifyCode();
        };

        // 手动触发，通过切换验证码实现
        document.querySelector("#secur_code_change").click();
      } else {
        textLogWithStyle("Check out successfully !!!", "green");

        hasCheckInOrOut = true;

        // 正常情况，直接确认 签入、签出
        comfirmInOrOutAction();

        sendEmail(currentCheckType == 1 ? "本次签出成功！" : "本次签入成功！");
      }
    }
  }, 3000);
}

// 开始签出
function startCheckOut(th = cko_th, tm = cko_tm, delay = cko_delay) {
  textLogWithStyle(
    `Target checkout time【 ${getTimeString(th)}:${getTimeString(tm)} 】!`,
    "rgb(243, 152, 1)",
    20
  );
  textLogWithStyle("Start patrol inspection ...");
  textLogWithStyle(
    `The current polling interval is【 ${getTimeFromMillisecond(delay)} 】!`,
    "rgb(243, 152, 1)",
    20
  );

  // 轮询判断是否到达或超过目标时间
  clearInterval(interval1);
  interval1 = setInterval(() => {
    const d = new Date();
    const hours = d.getHours();
    const minutes = d.getMinutes();

    // 是否达到或超过目标时间
    const isAtTime = hours > th || (hours == th && minutes >= tm);

    if (isAtTime) {
      clearInterval(interval1);

      textLogWithStyle(
        "Target time reached or exceeded, start triggering automatic checkout ...",
        "green"
      );

      //  触发弹窗
      document.querySelector("#checkout_btn").click();

      //  触发签出逻辑
      checkTrigger();
    } else {
      textLogWithStyle(
        "The current time has not reached or exceeded the target time, and the next round of detection will begin !!!"
      );
    }
  }, delay);
}

// 开始签入
function startCheckIn() {
  clearInterval(interval1);
  interval1 = setInterval(() => {
    // 轮询判断签入按钮是否加载完全
    if ($("#checkin_btn")[0]) {
      textLogWithStyle(
        "The check-in button is fully loaded, triggering pop-up dialog logic !",
        "green"
      );
      clearInterval(interval1);

      //  触发弹窗
      document.querySelector("#checkin_btn").click();

      // 触发签入逻辑
      checkTrigger();
    } else {
      textLogWithStyle(
        "The check-in button is not fully loaded, continue to the next round of testing!"
      );
    }
  }, 2000);
}

// 签入相关
function checkInTimeChecker(th = cki_th, tm = cki_tm, delay = cki_delay) {
  // 有值，证明已经刷新过页面，不需要在刷新页面
  if (localStorage.getItem("hasRefreshedForCheckIn")) {
    textLogWithStyle(`Check-in page is ready！！！`, "green", 30);

    startCheckIn();
    return;
  }

  textLogWithStyle(
    `Target check in time【 ${getTimeString(th)}:${getTimeString(tm)} 】!`,
    "rgb(243, 152, 1)",
    20
  );
  textLogWithStyle(
    `The current polling interval is【 ${getTimeFromMillisecond(delay)} 】!`,
    "rgb(243, 152, 1)",
    20
  );

  clearInterval(interval);
  interval = setInterval(() => {
    const d = new Date();
    const hours = d.getHours();
    const minutes = d.getMinutes();

    // 是否达到或超过目标时间
    const isAtTime = hours > th || (hours == th && minutes >= tm);

    // 避免晚上 18 - 23 点都命中如下逻辑
    const isMorning = hours >= 7 && hours <= 9;

    textLogWithStyle(
      `当前日志记录：
      currTime = ${getTimeString(hours)}:${getTimeString(minutes)}
      targetTime = ${getTimeString(th)}:${getTimeString(tm)}
      isMorning = ${isMorning}
      isAtTime = ${isAtTime}`,
      "red",
      20
    );

    if (isMorning && isAtTime) {
      textLogWithStyle(
        "The current time has reached or exceeded the target time, Open a new window to prepare for check-in !!!",
        "green"
      );

      clearInterval(interval);

      localStorage.setItem("hasRefreshedForCheckIn", true);

      // 刷新签入页面
      window.location.reload();
    } else {
      textLogWithStyle(
        "The current time has not reached or exceeded the target time, and the next round of detection will begin !!!"
      );
    }
  }, delay);
}

// 初始化
function init() {
  localStorage.removeItem("cancelRefreshCount");

  // 判断页面核心内容是否加载完成
  clearInterval(interval0);
  interval0 = setInterval(() => {
    if ($(".pad_space")[0]) {
      textLogWithStyle("The main content of the page is ready !!!");
      clearInterval(interval0);

      // 创建页面 logo
      createLogoImage();

      // 获取默认的时间
      const { checkOutHours, checkOutMinutes, checkType, totalCheckOutTime } =
        getPageInfo();

      currentCheckType = checkType;

      // 签入 和 签出
      checkType == 1 && totalCheckOutTime < 9
        ? startCheckOut(checkOutHours, checkOutMinutes)
        : checkInTimeChecker();
    }
  }, 2000);
}

// 将当前操作的结果进行截图发送
function sendPageResult() {
  // 注册监听事件
  chrome.storage.onChanged.addListener(({ captureDataUrl }) => {
    if (captureDataUrl.newValue) {
      sendEmail();
    }
  });

  // 判断是否需要通知 background 进行截屏操作
  if (localStorage.getItem("finallyConfirm")) {
    setTimeout(async () => {
      // 重置标识
      localStorage.removeItem("finallyConfirm");

      // 发送截图通知
      chrome.runtime.sendMessage({
        name: "background-capture-visible-tab",
      });
    }, 3000);
  }
}

// 自执行函数
(async function () {
  // 表明当前脚本已经被执行过，重复执行会发生异常
  localStorage.setItem("executeChkIO", true);

  // 将当前操作的结果进行截图发送
  sendPageResult();

  // 获取当前日期相关信息
  const { futureHours, dayOfWeek, notCheckDates, isWeekend } = getWeekDay();
  const notCheckToday = notCheckDates.includes(moment().format("YYYY-MM-DD"));

  let delay = 0, preTimer;

  // 周末 或 自定义 非打卡期间
  if (futureHours && (notCheckToday || isWeekend)) {
    delay = futureHours * 60 * 60 * 1000;

    textLogWithStyle(
      `Today is ${dayOfWeek.en}【 ${dayOfWeek.zh} 】，The time interval has been adjusted to【 ${futureHours} hours 】!`,
      "#eb7114",
      30
    );
  }

  preTimer = setTimeout(() => {
    clearTimeout(preTimer);

    const { dayOfWeek } = getWeekDay();

    // 正常打卡日期
    textLogWithStyle(
      `Today is ${dayOfWeek.en}【 ${dayOfWeek.zh} 】，Automatically checking ...`,
      "#5916eb",
      30
    );

    // 初始化执行
    init();
  }, delay);
})();
