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

  console.log(
    "%cPerform relevant operations after 3 seconds !",
    `
  color: blue;
  font-size: 20px;
  font-weight: bold;`
  );
}

// 准备下一次的签入
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
    location.href = "https://juejin.cn";
  }, hours * 60 * 60 * 1000);
}

const commomDelay = 3000;
const submitDelay = 5000;
function autoCheckIn() {
  const GoCkITetx = $(".signin-btn").text().trim();
  const ImCkIText = $(".signin.btn").text().trim();
  const Texts = ["去签到", "立即签到"];

  switch (GoCkITetx || ImCkIText) {
    case Texts[0]:
      // 点击去签到按钮
      $(".signin-btn").click();
      break;

    case Texts[1]:
      // 点击立即签到按钮
      $(".signin.btn").click();

      setTimeout(() => {
        // 点击去抽奖
        $(".btn-area .btn").click();

        setTimeout(() => {
          // 点击免费抽奖
          $("#turntable-item-0").click();

          setTimeout(() => {
            // 点击收下奖励
            $(".submit").click();

            // 准备下一次签入
            prepareNextChectIn();
          }, submitDelay);
        }, commomDelay);
      }, commomDelay);
      break;

    default:
      const text = $(".signedin-btn").text().trim();
      if (text) {
        console.log(
          `%cCurrent status【 ${text} 】，No check-in required!`,
          `
              color: orange;
              font-size: 20px;
              font-weight: bold;`
        );
      } else {
        console.log(
          `%cNot match any action!`,
          `
              color: #f40;
              font-size: 20px;
              font-weight: bold;`
        );
      }
      if (location.href === "https://juejin.cn/" && $('.avatar-img').attr('src')) {
        // 准备下一次签入
        prepareNextChectIn();
      }
      break;
  }
}

function init() {
  logMessage();

  setTimeout(autoCheckIn, commomDelay);
}

init();
