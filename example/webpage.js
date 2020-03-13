var webpage = require('webpage');
var page = webpage.create();
page.settings.javascriptEnabled = false; // 禁用JavaScript代码
page.open("http://www.mostclan.com", function (status) {
    if (status === "success") {
        console.log(page.title);
        console.log("截图成功");
        page.render("screenshot.png");
    } else {
        console.log("截图失败");
    }
});