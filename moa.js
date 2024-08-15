// 自执行函数
(async function () {
  textLogWithStyle('MOA.js is running...');

  // 重置标识
  localStorage.setItem(
    "captureUpdateTime",
    moment().format("YYYY-MM-DD HH:MM:SS")
  );

  setTimeout(() => {
    const userName = document.querySelector(".card-box-title").innerText;

    // 发送邮件
    sendEmail({ title: `${moment().format('YYYY-MM-DD HH:MM:ss')} (${userName}) MOA 验证提醒`, userName });

    // 自动验证按钮
    $(".tfa-button").click();
  }, 2000);
})();
