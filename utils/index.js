// 带有样式的 log
function textLogWithStyle(text = "+", color = "blue", size = 16) {
  console.log(
    `%c${text}`,
    `color: ${color}; font-size: ${size}px; font-weight: bolder;`
  );
}

function textColorWithAnimation(text, fontSize = "20px") {
  console.log(
    `%c${text}`,
    `font-size: ${fontSize};
    background: linear-gradient(
      to right,
      purple,
      red,
      orange,
      yellow,
      green,
      cyan,
      blue,
      purple,
      red,
      orange,
      yellow,
      green,
      cyan,
      blue,
      purple
    );
    background-size: 100%;
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
    text-shadow: 0 5px 10px #fff;
    font-weight: bold;
    animation: text-color 3s ease-in-out infinite;`
  );
}

// 带有图片的 log
function imageLogWithStyle(url = "", padding = "0") {
  console.log(
    "%c+",
    `padding: ${padding};
          background-image: url(${url});
          background-size: 100% 100%;
          background-repeat: no-repeat;`
  );
}

//  根据 毫秒数 转换成 时、分、秒
function getTimeFromMillisecond(millisecond = 0) {
  const hours = parseInt(
    (millisecond % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const minutes = parseInt((millisecond % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = (millisecond % (1000 * 60)) / 1000;

  let result = "";

  if (hours) {
    result += `${hours} h`;
  }

  if (minutes) {
    result += `${result ? " " : ""}${minutes} m`;
  }

  if (seconds) {
    result += `${result ? " " : ""}${seconds} s`;
  }

  return result || "0 s";
}

// 确认操作
function comfirmInOrOutAction() {
  // 已经进行确认操作
  localStorage.setItem("finallyConfirm", true);

  // 正常情况，直接确认 签入、签出
  document.querySelector(".btn.btn-primary").click();
}

// 校验验证码
let timeout2;
function verifyCode(text) {
  textLogWithStyle("start verify code ...");

  // 识别出验证码，并且验证码长度符合 4 位数
  if (text && text.length === 4) {
    // 填充验证码
    $("#code_input")[0].value = text;

    // 触发确认按钮，针对填充的验证码进行校验
    comfirmInOrOutAction();

    // 若产生错误，验证码会自动刷新，刷新今后会再次触发 onload 事件重新进行验证码校验
    if ($(".error-message")[0]) {
      textLogWithStyle(
        "Verification codes are inconsistent, Prepare to automatically re-obtain verification codes !!!",
        "red"
      );
    } else {
      hasCheckOut = true;
      sendEmail({
        result:
          localStorage.getItem("checkType") == 1
            ? `本次签出成功！`
            : `本次签入成功！`,
      });
    }
  } else {
    // 识别验证码长度 < 4 或 > 4 ，意味着识别出现错误，需要重新获取验证码内容
    textLogWithStyle(
      "Unable to recognize verification code，will get verification code again !!!",
      "red"
    );

    // 切换新的验证码，此时会重新触发 image 元素的 onload 事件，实现自动调用
    clearTimeout(timeout2);
    timeout2 = setTimeout(() => {
      document.querySelector("#secur_code_change").click();
    }, 10000);
  }
}

// 获取验证码
async function getVerifyCode() {
  textLogWithStyle("Start get verify code ...");

  // 获取和页面上相同图片的 base64 格式
  const base64 = getBase64($("#image")[0]);

  // 识别图片验证码内容
  let { text = "" } = await recognizeCodeWithTesseract(base64);
  text = text.replace("\n", "");

  // 校验验证码
  verifyCode(text);
}

// 将外链图片转成本地 base64 图片
function getBase64(image) {
  const canvas = document.createElement("canvas");

  canvas.width = image.width;
  canvas.height = image.height;

  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, image.width, image.height);

  // 将canvas的内容转换为base64编码的字符串
  const base64 = canvas.toDataURL("image/png");

  imageLogWithStyle(base64, `${40}px ${160}px`);

  return base64;
}

// 识别验证码 Tesseract 版本
async function recognizeCodeWithTesseract(base64) {
  const worker = await Tesseract.createWorker("eng");

  const charCodes = [];
  for (let i = 0; i < 26; i++) {
    if (i <= 9) charCodes.push(i);
    charCodes.push(String.fromCharCode(97 + i), String.fromCharCode(65 + i)); //生成 a-z 26 个大小写字母
  }

  await worker.setParameters({
    tessedit_char_whitelist: charCodes.join(""),
  });

  const ret = await worker.recognize(base64);

  textLogWithStyle(
    `recognize code result = ${ret.data.text.replace("\n", "")}`
  );

  await worker.terminate();

  return ret.data;
}

// 发送邮件
async function sendEmail(config = {}) {
  const  { title, content, userName, result, errorInfo, resentCount = 0 } = config;
   
  let checkType = localStorage.getItem("checkType");
  if (!errorInfo) {
    localStorage.setItem("hasRefreshedForCheckIn", "");
  }

  const chromeStorageLocal = await chrome.storage.local.get(["captureDataUrl"]);

  if (chromeStorageLocal.captureDataUrl) {
    checkType = new Date().getHours() < 10 ? 0 : 1;
  }

  const image = $("#image")[0];
  const data = {
    title,
    content,
    result,
    name: userName || $(".dropdown-toggle")[0].innerText,
    luckyCode: image ? getBase64(image) : "",
    error: errorInfo,
    checkType,
    captureDataUrl: chromeStorageLocal.captureDataUrl,
  };

  const dateTime = moment().format("YYYY-MM-DD HH:mm:ss");

  $.ajax({
    url: `https://10.18.119.66:1888/sendEmail`,
    type: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
    },
    data,
    async: false,
    contentType: false, // 避免 ajax 请求异常
    success: function (res) {
      console.log(`【 ${dateTime} 】( Request Success ) = `, res);

      // 邮件发送成功
      if (res.code == 2000) {
        chrome.storage.local.set({ captureDataUrl: "" });
      } else {
        // 邮件发送失败
        // 错误重试，当重试次数超过 3 时不在进行重试，resentCount 记录的是每个不同的请求重试次数
        if (resentCount < 3) {
          console.log(`【 ${dateTime} 】10 s 后尝试重新发送邮件...`);
          setTimeout(() => {
            sendEmail({result, errorInfo, resentCount: resentCount + 1});
          }, 10 * 1000);
        } else {
          console.warn(`【 ${dateTime} 】邮件异常重试次数已到达上线！！！`);
        }
      }
    },
    error: function (res) {
      // 请求发送异常
      console.log(`【 ${dateTime} 】( Request Error ) = `, res);
      chrome.storage.local.set({ captureDataUrl: "" });
    },
  });
}

// 获取页面信息
function getPageInfo() {
  // 当前签到类型：0 签入 签出 1
  let checkType =
    $("#breadcrumb")[0].innerText.replace(/\s*/g, "").indexOf("签出") > -1
      ? 1
      : 0;

  localStorage.setItem("checkType", checkType);

  // 用户名
  const name = $(".dropdown-toggle")[0]
    .innerText.replace(/\([^)]*\)/, "")
    .trim();

  // IP 信息
  const checkInIp = $(".chk_in_remark")
    .prev()
    .map((_, v) => v.innerText)
    .filter((_, v) => v)[0];

  const checkOutIp = $(".chk_out_remark")
    .prev()
    .map((_, v) => v.innerText)
    .filter((_, v) => v)[0];

  // 签到时间
  const checkInTime = $(".pad_space").next()[0].innerText;
  const checkOutTime = $(".chk_out_remark").prev().prev()[0].innerText;

  // 是否签入、签出
  const hasCheckIn = /[0-9]/.test(checkInTime);
  const hasCheckOut = /[0-9]/.test(checkOutTime);

  // 当前签出时间
  const totalCheckOutTime = $(".chk_out_remark")
    .next()[0]
    .innerText.split("小时")[0];

  // 是否属于满足条件的签出
  const shouldCheckOut = checkType == 1 && totalCheckOutTime < 9;

  // 获取默认目标签出时间
  const { checkOutHours, checkOutMinutes } = getDefaultTime({
    checkInTime,
    shouldCheckOut,
  });

  return {
    name,
    checkInIp,
    checkOutIp,
    checkType,
    hasCheckIn,
    hasCheckOut,
    checkOutHours,
    checkOutMinutes,
    totalCheckOutTime: Number(totalCheckOutTime),
    shouldCheckOut,
  };
}

// 保证获取两位数的字符
function getTimeString(n) {
  return n >= 10 ? n : `0${n}`;
}

// 获取默认目标签出时间
function getDefaultTime({ checkInTime, shouldCheckOut }) {
  let checkOutHours = 18,
    checkOutMinutes = 0;

  // 自动计算签出时间
  if (shouldCheckOut) {
    const date = moment().format("YYYY-MM-DD");
    const targetMoment = moment(`${date} ${checkInTime}`).add({ hours: 9 });

    textLogWithStyle(`当前【 签入时间 】为【 ${checkInTime} 】`);
    textLogWithStyle(
      `【9 小时后】应【签出时间】为【 ${getTimeString(
        targetMoment.hour()
      )} : ${getTimeString(targetMoment.minutes())} 】`
    );

    // 小于 18 签出不合格，当目标时间大于等于默认的 18 时，需要以大的时间为准
    if (targetMoment.hour() >= checkOutHours) {
      checkOutHours = targetMoment.hour();
      checkOutMinutes = targetMoment.minutes();
    }

    // 当目标签出分钟数等于 0 ，即准点时，要替换为随机数
    if (checkOutMinutes == 0) {
      checkOutMinutes = parseInt(Math.random() * 20 + 1);
    }

    // 当分钟数不一致，意味着需要重置
    if (
      targetMoment.hour() !== checkOutHours ||
      targetMoment.minutes() !== checkOutMinutes
    ) {
      textLogWithStyle(
        `【自动调整】后【签出时间】为【 ${getTimeString(
          checkOutHours
        )} : ${getTimeString(checkOutMinutes)} 】`
      );
    }
  }

  return { checkOutHours, checkOutMinutes };
}

// 为页面添加 logo
function createLogoImage() {
  logMessage();

  if ($("#auto_gif")[0]) return;

  const image = document.createElement("img");
  image.src = `https://${host}:${port}/auto.gif`;
  image.style.height = "60px";
  image.id = "auto_gif";

  const logo = $("#logo")[0];

  logo.style.display = "flex";
  logo.style.justifyContent = "space-between";
  logo.style.justifyItems = "center";

  const h1 = document.createElement("h1");
  h1.id = "auto_ck_time_msg";
  logo.style.display = "flex";
  logo.style.alignItems = "center";

  logo.appendChild(h1);
  logo.appendChild(image);
}

function logMessage() {
  const text = `
        M          M           M    M M M M M M M         M                         M       M  M
       M M         M           M          M            M      M                     M     M      M
      M   M        M           M          M          M          M                   M      M
     M     M       M           M          M         M            M                  M        M
    M  M M  M      M           M          M          M          M                   M          M
   M         M      M         M           M            M      M              M      M    M      M
  M           M       M  M  M             M               M           M        M  M        M  M
  `;
  console.log(
    `%c${text}`,
    `background: linear-gradient(to right, purple, red, orange, yellow,green, cyan, blue, purple, red, orange, yellow,green, cyan, blue, purple );
          background-size: 100%;
          background-clip: text;
          -webkit-background-clip: text;
          color: transparent;
          text-shadow: 0 5px 10px #fff;
          font-weight: bold;`
  );
}

// 获取浏览指纹
async function getBrowserFinger(callback) {
  const fp = await FingerprintJS.load();
  const result = await fp.get();

  localStorage.setItem("visitorId", result.visitorId);

  callback(result.visitorId, result);
}

// 获取周信息
function getWeekDay() {
  const weekDays = [
    { zh: "周日", en: "Sunday" },
    { zh: "周一", en: "Monday" },
    { zh: "周二", en: "Tuesday" },
    { zh: "周三", en: "Wednesday" },
    { zh: "周四", en: "Thursday" },
    { zh: "周五", en: "Friday" },
    { zh: "周六", en: "Saturday" },
  ];

  const targetDate = moment(new Date());
  const targetDayIndex = targetDate.day();

  // 周末
  let dayOfWeek = weekDays[targetDayIndex];
  let isWeekend = targetDayIndex === 6 || targetDayIndex === 0;

  // 设定周末需要打卡时，覆盖前面的判断值
  const weekendAction = localStorage.getItem("weekendAction");
  if (weekendAction) isWeekend = false;

  // 判断目标日期是否为周六或者周天（公共假日）
  if (isWeekend) {
    dayOfWeek = weekDays[targetDayIndex];
  }

  // 不需要打卡日期
  const notCheckDates = JSON.parse(
    localStorage.getItem("notCheckDates") || "[]"
  ).filter((v) => v);
  let notCheckDate = notCheckDates[1] || notCheckDates[0];

  let futureSeconds = 0;
  const clock = `08:${getTimeString(parseInt(Math.random() * 30 + 10))}`;
  if (notCheckDate || isWeekend) {
    let dateStr = moment().format("YYYY-MM-DD");

    if (notCheckDate) {
      dateStr = notCheckDate;
    }

    // 加一天的目的是为了达到打卡日期
    futureSeconds = moment(`${dateStr} ${clock}`)
      .add(1, "days")
      .diff(moment(), "seconds");
  }

  // 当前日期是否需要打卡
  const notCheckToday = notCheckDates.includes(moment().format("YYYY-MM-DD"));

  return {
    dayOfWeek,
    isWeekend, // 周日、周六
    futureSeconds, // 多久时间达到可打卡的未来日期
    notCheckDates,
    notCheckToday, // 当前日期是否需要打卡
  };
}
