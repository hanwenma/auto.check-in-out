const commomDelay = 3000;
const submitDelay = 5000;
const KeyTexts = ["去签到", "立即签到"];

function logExtensionInfo() {
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

  console.log(
    "%cPerform relevant operations after 3 seconds !",
    `
  color: blue;
  font-size: 20px;
  font-weight: bold;`
  );
}

function sleep(delay) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, delay);
  });
}

async function start() {
  await sleep(commomDelay);
  $(".signin-btn").click(); // 点击去签到按钮

  await sleep(commomDelay);
  $(".signin.btn").click(); // 点击立即签到按钮

  await sleep(commomDelay);
  $(".btn-area .btn").click(); // 点击去抽奖

  await sleep(commomDelay);
  $("#turntable-item-0").click(); // 点击免费抽奖

  await sleep(submitDelay);
  $(".submit").click(); // 点击收下奖励

  prepareNextChectIn();// 准备下一次签到
}

function prepareNextChectIn() {
  const hours = moment(moment().format("YYYY-MM-DD") + " 07:00")
    .add(1, "days")
    .diff(moment(), "hours");

  console.log(
    `%cYou will be automatically checked in after【 ${hours} 】hour!`,
    `color: #02cb0f;
     font-size: 20px;
     font-weight: bold;`
  );

  setTimeout(() => {
    location.href = "https://juejin.cn";// 跳转到签到页
  }, hours * 60 * 60 * 1000);
}

function autoCheckIn() {
  const GoCkITetx = $(".signin-btn").text().trim();
  const ImCkIText = $(".signin.btn").text().trim();

  switch (GoCkITetx || ImCkIText) {
    case KeyTexts[0]:
      // 点击去签到按钮
      $(".signin-btn").click();
      break;

    case KeyTexts[1]:
      // 正式开始签到
      start();
      break;

    default:
      // 准备下次签到
      prepareNextChectIn();
      break;
  }
}

(function init() {
  // 输出提示
  logExtensionInfo();

  // 签入
  autoCheckIn();
})()