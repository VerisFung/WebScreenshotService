# WebScreenshotService
基于PhantomJS的网站截图服务API设计与开发

> 原文链接：[http://www.mostclan.com/post-329.html](http://www.mostclan.com/post-329.html)
> 作者：Veris
> Blog：最族 [ http://www.mostclan.com ]

为公司某业务实现“服务端对网站截图”功能，搜罗了很多技术最终采用了PhantomJS无头浏览器技术。

**什么是PhantomJS？**

> PhantomJS是一个基于webkit的javaScript API。它使用QtWebKit作为它核心浏览器的功能，使用webkit来编译解释执行javaScript代码。任何你可以基于在webkit浏览器做的事情，它都能做到。它不仅是个隐性的浏览器，提供了诸如css选择器、支持wen标准、DOM操作、json、HTML5等，同时也提供了处理文件I/O的操作，从而使你可以向操作系统读写文件等。phantomJS的用处可谓非常广泛诸如网络监测、网页截屏、无需浏览器的wen测试、页面访问自动化等。

网上流传PhantomJS已暂停维护，转而投入selenium的开发，所以用户更倾向于目前流行的浏览器自动化测试框架“selenium”，这里作者选择使用PhantomJS来做服务，因为部署比较简单，且完全能满足业务需求。

**1、实现截图**

```
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
```

将文件保存为webpage.js，使用如下命令执行程序

```
phantomjs webpage.js
```

（这里需要安装PhantomJS，详细步骤不做阐述，请自行百度）

如果返回截图成功，那么恭喜你截图服务已经写好了，就是这么简单，你可以查看目录下的“screenshot.png”有一张我的博客截图^_^。

webpage 是 PhantomJS 的核心模块，上面的代码中，open() 方法有两个参数。

- 第一个参数是请求地址（不要忘记协议头），默认使用 GET 方式
- 第二个参数是回调函数，回调参数status表示网页状态主要有success和fail两种。

> 值的注意的是，只要请求有返回结果，status参数就是success，即使服务器返回的状态是404或500错误。

如果需要使用POST请求或其他请求要求，可以使用如下方式：

```
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
```

这里第二个参数变成一个对象类型的配置信息，可以配置请求方式、编码、头信息、数据等。

另外代码中有一句 `page.settings.javascriptEnabled = false;`，如果不需要页面渲染时执行JS代码，可以禁用此选项来加速截图，因为一般网站都是由HTML+CSS来渲染页面的，其他基本上对渲染结果影响不大。

`page.render() `可以将打开的网页截图并保存成本地图片，可以将指定的图片文件名作为参数传入，render 方法可以根据文件名的后缀将图片保存成对应的格式。

目前支持PNG、GIF、JPEG、PDF四种图片格式。

```
page.render('temp.jpeg', {format: 'jpeg', quality: '100'});
```

其他参数详细细节可参考官方文档

**2、搭建WebServer**
这里用到一个基于mongoose的WebServer模块，因为该模块目前仅允许10个并发请求，所以在大流量并发环境下请选择其他Web服务模块，或并发量不高的话可以做个多服务的负载集群，后文会介绍操作方法。

```
var webserver = require('webserver').create();
webserver.listen(8080, function (request, response) {
    response.statusCode = 200;
    response.write('<html><h1>Hello World!</h1></html>');
    response.close();
});
```

将文件保存为webserver.js，使用如下命令执行程序

```
phantomjs webserver.js
```

然后访问 http://127.0.0.1:8080 便可看到刚刚搭建的Web服务

[![Web服务例子](https://upload-images.jianshu.io/upload_images/3543788-8a946498d2dd4191?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)](http://pic.mostclan.com/Fps_Yx9PL7zcIm2v9P6xHS-JDJKQ) 

listen方法的第一个参数可以为一个端口号，也可以是`ip:port`这种形式
第二个参数是回调方法，主要有两个回调参数：`request`和`response`。

**request参数的几个常用属性：**

- `method`，请求方式（get、post等）
- `url`，请求的URL，包含请求的get参数
- `post`，POST请求数据
- `postRaw`，POST数据原始信息，就是application/x-www-form-urlencoded编码提交的数据
- `headers`，请求头信息

**response参数的几个常用方法：**

- `statusCode(code)`，设置HTTP状态码
- `write(data)`，向response中写入数据
- `close()`，关闭HTTP连接（这个比较重要，如果未关闭会一直占用连接，后面会讲这个坑）

**3、API服务网关设计**

Web服务搭建好后，我们就可以做服务网关了，这样通过调用网关便能获取网站截图。
首先规定交互协议和返回数据格式，我们协定如下：

**请求参数：（POST请求服务网关）**

- url: 需要截图的网站地址
- out_order_id: 外部订单ID，如果是异步回调通知形式，可以加这个参数来识别图片
- method: 请求方式
- headers: 请求头
- data: 请求参数（json格式）
  - screen_width: 截图屏幕宽度（如果有要求的话）
  - screen_height: 截图屏幕高度（如果有要求的话）
- sign: 签名（这里如果要暴露服务给外网使用，又想限定用户的话可以设置签名参数来授权，详细设计方法不再阐述）

**响应参数：**

- code: 状态值 0-失败 1-成功
- msg: 回馈消息
- data: 响应数据
  - screen_image_data: 截屏图片数据（base64加密）
  - out_order_id: 外部订单ID
- timestamp: 时间戳

设计好数据格式就可以运行服务了，完整代码我分享在github上（见文末），可运行src/server.js

[![Postman请求例子](https://upload-images.jianshu.io/upload_images/3543788-196d5ab85b500fd7?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)](http://pic.mostclan.com/FuuwVoEX2n389eIUpkG6nXhlxsDK) 

我这在本地使用postman请求服务网关，可以看到时间响应还是挺快的，部署到服务器会更快点。

渲染效果如下：（我这里图片采用了jpg压缩了，追求质量可以改成png，不过响应渲染的速度会下降一些）

[![渲染效果](https://upload-images.jianshu.io/upload_images/3543788-bfd87ac8978c2a68?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)](http://pic.mostclan.com/FpTFeBNUmOY2GQ03PG53zk19KRCY) 

**4、服务化部署、异常情况及解决方案**

**高可用问题**：为了使服务正常可控，一定要使用try()catch(e){}形式捕获异常！部署到Linux需要注意的是——如何在后台保持稳定运行，这里推荐大家使用Supervisor来守护进程，可以在后台运行的同时记录日志，当进程异常奔溃还可以自动重载服务。（详情可自行查阅资料）

**超时问题：**因为截图比较耗时，可以改为异步的形式，即服务处理完成后回调通知结果，图片则可使用本地存储/OSS存储图片数据，返回图片链接形式加快响应速度。

**字体问题：**如果部署在linux上，很容易出现中文乱码或显示不出的问题，这里需要在系统上安装字体，可参考[https://blog.csdn.net/weiguang1017/article/details/80229133](https://blog.csdn.net/weiguang1017/article/details/80229133)

**另外请求服务的生命周期也至关重要：**
我们可以试着将`response.close();`注释掉，然后启动服务再请求，会发现一直在等待响应中，当我如此反复请求10次发现无法再请求了

[![请求异常例子](https://upload-images.jianshu.io/upload_images/3543788-3f8e1876164afe44?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)](http://pic.mostclan.com/FlwNnQcWUJsLyp_PhEerEybncFPZ) 

这是因为**WebServer模块只支持10个并发**，而且**可以response完没有close连接**，就导致一直占用tcp连接，造成服务不可用，我们可以通过linux命令来查看情况

```
ps aux | grep server.js
```

拿到进程的PID后使用`lsof`命令查看进程详情

```
lsof -nPp 39207
```

情况如下图，可以看到有10个TCP连接，其中有几个是CLOSE_WAIT状态。

[![TCP连接占用情况](https://upload-images.jianshu.io/upload_images/3543788-6d1ed27b93fee231?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)](http://pic.mostclan.com/Fjl9nd_56GthtBKNCzoth1MuKDeE) 

出现大量`close_wait`的现象，主要原因是某种情况下对方关闭了socket链接（我这里postman取消了请求），但是服务方处于忙线状态，没有关闭连接。

所以`response.close();`这一句千万不能漏，无论是请求成功还是异常情况都要正常响应用户并关闭连接。

**5、服务扩展与展望**

如若想要实现高并发大流量的服务，则需增加服务网关（可分布式部署），使用nginx反向代理来负载均衡（反向到各个服务网关的WebServer地址），这里和一般网站的高并发架构方式类似，设计如下图：

[![分布式架构例子](https://upload-images.jianshu.io/upload_images/3543788-2aa22374d0650205?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)](http://pic.mostclan.com/FoDDPUQy7dAt3tvTTKF5jKCufZ-p) 

如果服务网关数量不够，扛不住大量并发访问，则可以通过限流的形式缓解压力

至此一个简单的网站截图服务就做好了，以如今的设计应该能满足日常需要，有更好设计方案或想法欢迎留言和issue。

本项目源代码公开在 [https://github.com/VerisFung/WebScreenshotService](https://github.com/VerisFung/WebScreenshotService) ，欢迎Star！

> 转载请注明出处：
> 作者：Veris
> 最族 [ http://www.mostclan.com ]