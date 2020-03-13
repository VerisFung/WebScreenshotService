/**
 * 基于PhantomJS的网站截图服务
 * @author Veris
 * @website www.mostclan.com
 * @version 0.1
 * @date 2020-03-14 01:23
 * @update 2020-03-14 01:23
 */
var webserver = require('webserver').create()
var webpage = require('webpage')
webserver.listen(8080, function (request, response) {
    // 这里一定要用异常捕获来应对诸多错误问题（请求参数错误、奔溃、阻塞等），不然会阻塞进程导致不可用
    try {
        // 如果请求不合法则结束
        if (request.post === undefined || request.post.length === 0) {
            throw "请求不合法"
        }
        var postData = JSON.parse(request.post) // Post数据
        // 如果不是一个合法的JSON对象
        if (typeof postData != 'object') {
            throw "不是合法的JSON对象"
        }
        var page = webpage.create()
        var out_order_id = 0 // 外部单号
        if (postData.out_order_id) {
            out_order_id = postData.out_order_id
        }
        page.settings.javascriptEnabled = false // 禁用JavaScript代码
        page.open(postData.url, {
            operation: postData.method,
            encoding: "utf8",
            headers: postData.headers,
            data: postData.data
        }, function (status) {
            if (status === "success") {
                console.log('√ 渲染成功', out_order_id, page.title)
                response.statusCode = 200
                response.write(J(1, '渲染成功', {
                    out_order_id: out_order_id,
                    screen_image_data: page.renderBase64('jpg'),
                }))
            } else {
                console.log('× 渲染失败')
                response.statusCode = 200
                response.write(J(0, '渲染失败'))
            }
            page.close() // 这里需要关闭，不然下次无法再次调用open请求
            response.close() // 这里需要结束响应，不然连接会一直占用
        })
    } catch (e) {
        console.log('错误异常', e)
        // TODO 这了可以做一些错误日志
        response.statusCode = 200
        response.write(J(0, e.toString()))
        response.close()
    }
})
console.log('服务已启动...')

function J(code, msg, data) {
    if (data === undefined) {
        data = {}
    }
    var t = new Date().getTime()
    return JSON.stringify({
        code: code,
        msg: msg,
        data: data,
        timestamp: t,
    })
}