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
let interval, interval0, interval1, interval2, timeout0, timeout1;
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

// 检测当前日期和目标时间剩余小时
function getLeftTimeFormTargetTime(futureTime, type) {
  const currentDate = moment().format("YYYY-MM-DD");
  const leftTime = moment(`${currentDate} ${futureTime}`).diff(moment(), type);
  return leftTime;
}

// 开始签出
function startCheckOut(th = cko_th, tm = cko_tm, delay = 0) {
  // 获取距离目标时间的剩余秒数，因为小时、分钟数不准确
  const leftSeconds = getLeftTimeFormTargetTime(
    `${getTimeString(th)}:${getTimeString(tm)}`,
    "seconds"
  );
  delay = leftSeconds * 1000;

  textLogWithStyle(
    `Target checkout time【 ${getTimeString(th)}:${getTimeString(
      tm
    )} 】, and the polling time is adjusted to 【 ${getTimeFromMillisecond(
      delay
    )} 】!`,
    "rgb(243, 152, 1)",
    25
  );

  textColorWithAnimation("To be continued ...", "30px");

  $("#auto_ck_time_msg").text(
    `目标【 签出 】时间为：【 ${getTimeString(th)}:${getTimeString(tm)} 】`
  );

  // 轮询判断是否到达或超过目标时间
  clearTimeout(timeout0);
  timeout0 = setTimeout(() => {
    // 激活目标页面
    chrome.runtime.sendMessage({
      name: "background-tentcent-active-tab",
    });

    // 当前签出时间
    const totalCheckOutTime = $(".chk_out_remark")
      .next()[0]
      .innerText.split("小时")[0];

    // 是否属于满足条件的签出
    const shouldCheckOut = totalCheckOutTime < 9;

    // 已达到指定时间
    if (shouldCheckOut) {
      clearTimeout(timeout0);
      textLogWithStyle(
        "Target time reached or exceeded, start triggering automatic checkout !!!",
        "green"
      );

      //  触发弹窗
      document.querySelector("#checkout_btn").click();

      //  触发签出逻辑
      checkTrigger();
    } else {
      textLogWithStyle(
        "The current check-out time meets 9 hours, no check-out is required！",
        "red"
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
        "The check-in button is not fully loaded, continue to the next round of testing!",
        "red"
      );
    }
  }, 2000);
}

// 签入相关
function checkInTimeChecker(
  th = cki_th,
  tm = parseInt(Math.random() * 10) + 30
) {
  const tomorrowDate = moment(
    `${moment().format("YYYY-MM-DD")} ${getTimeString(th)}:${getTimeString(tm)}`
  );

  const shouldCheckInToday = $(".pad_space").next()[0].innerText == "未签入";

  const tomorrowSeconds = shouldCheckInToday
    ? 0
    : tomorrowDate.add(1, "days").diff(moment(), "seconds");

  const delay = tomorrowSeconds * 1000;

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

  textColorWithAnimation("To be continued ...", "30px");

  $("#auto_ck_time_msg").text(
    `目标【 签入 】时间为：【 ${getTimeString(th)}:${getTimeString(tm)} 】`
  );

  clearTimeout(timeout1);
  timeout1 = setTimeout(() => {
    // 激活目标页面
    chrome.runtime.sendMessage({
      name: "background-tentcent-active-tab",
    });

    const d = new Date();
    const hours = d.getHours();
    const minutes = d.getMinutes();

    // 避免晚上 18 - 23 点都命中如下逻辑
    const isMorning = hours >= 7 && hours <= 9;

    textLogWithStyle(
      `当前日志记录：
      currTime = ${getTimeString(hours)}:${getTimeString(minutes)}
      targetTime = ${getTimeString(th)}:${getTimeString(tm)}
      isMorning = ${isMorning}`,
      "red",
      20
    );

    if (isMorning) {
      textLogWithStyle(
        "The current time has reached or exceeded the target time, Open a new window to prepare for check-in !!!",
        "green"
      );

      clearTimeout(timeout1);

      localStorage.setItem("hasRefreshedForCheckIn", true);

      // 刷新签入页面
      window.location.reload();
    } else {
      textLogWithStyle(
        "The current time has not reached or exceeded the target time, and the next round of detection will begin !!!"
      );
      // 未到时间则递归执行
      setTimeout(checkInTimeChecker, 5 * 60 * 1000);
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
      clearInterval(interval0);

      // 获取默认的时间
      const { checkOutHours, checkOutMinutes, checkType, shouldCheckOut } =
        getPageInfo();

      currentCheckType = checkType;

      // 签入 和 签出
      shouldCheckOut
        ? startCheckOut(checkOutHours, checkOutMinutes)
        : checkInTimeChecker();
    }
  }, 2000);
}

// 将当前操作的结果进行截图发送
function sendPageResult() {
  // 注册监听事件
  chrome.storage.onChanged.addListener(({ captureDataUrl }) => {
    // 重置标识
    localStorage.setItem('captureUpdateTime', moment().format("YYYY-MM-DD HH:MM:SS"));

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
    }, 10 * 1000);
  }
}

// 自执行函数
(async function () {
  // 创建页面 logo
  createLogoImage();

  // 表明当前脚本已经被执行过，重复执行会发生异常
  localStorage.setItem("executeChkIO", true);

  // 将当前操作的结果进行截图发送
  sendPageResult();

  // 获取当前日期相关信息
  const { futureSeconds, dayOfWeek, notCheckDates, isWeekend } = getWeekDay();
  const notCheckToday = notCheckDates.includes(moment().format("YYYY-MM-DD"));

  let delay = 3000,
    preTimer;

  // 周末 或 自定义 非打卡期间
  if (futureSeconds && (notCheckToday || isWeekend)) {
    delay = futureSeconds * 1000;

    textLogWithStyle(
      `Today is ${dayOfWeek.en}【 ${
        dayOfWeek.zh
      } 】，Today does not require auto check，The time interval has been adjusted to【 ${getTimeFromMillisecond(
        delay
      )} 】!`,
      "#eb7114",
      30
    );

    // 到时间后刷新页面，重新执行
    setTimeout(() => {
      window.location.reload();
    }, delay);
    return;
  }

  // 计时器
  clearTimeout(preTimer);
  preTimer = setTimeout(() => {
    clearTimeout(preTimer);

    const { dayOfWeek } = getWeekDay();

    // 正常打卡日期
    textLogWithStyle(
      `Today is ${dayOfWeek.en}【 ${dayOfWeek.zh} 】，Automatically checking ...`,
      "#5916eb",
      30
    );

    // 周末是否打卡提示
    const weekendAction = localStorage.getItem("weekendAction") == "checked";
    textLogWithStyle(
      `${
        weekendAction
          ? "【 本周末 】将进行【 自动打卡 】，若需要取消"
          : "【 本周末 】默认【 不需自动打卡 】，若有需要"
      }，请点击插件图标进行重置！`,
      "#f40",
      25
    );

    // 初始化执行
    init();
  }, delay);
})();
