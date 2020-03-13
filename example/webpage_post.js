var webpage = require('webpage');
var page = webpage.create();
var settings = {
    operation: "POST",
    encoding: "utf8",
    headers: {
        "Content-Type": "application/json"
    },
    data: JSON.stringify({
        params: "data",
        array: ["1", "2"]
    })
};
page.settings.javascriptEnabled = false; // 禁用JavaScript代码
page.open("http://www.mostclan.com", settings, function (status) {
    if (status === "success") {
        console.log(page.title);
        console.log("截图成功");
        page.render("screenshot.png");
    } else {
        console.log("截图失败");
    }
});