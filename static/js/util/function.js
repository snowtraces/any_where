window.$ = (function (window, $) {
    const log = console.log.bind(console)
    const error = console.error.bind(console)

    /**
     * dom选择
     */
    const el = (selector) => document.querySelector(selector)
    const elAll = (selector) => document.querySelectorAll(selector)

    /**
     * 事件绑定
     */
    const bindEvent = (selector, event, func) => {
        const nodeList = elAll(selector)
        if (!nodeList || nodeList.length === 0) {
            bindEventForce(selector, event, func)
        } else {
            let eventList = event.split(' ').map(e => e.trim())
            nodeList.forEach(
                node => eventList.forEach(e => node.addEventListener(e, func, false))
            )
        }
    }

    /**
     * 事件绑定委托，默认使用document处理event
     */
    const bindEventForce = function (selector, event, func, delegation) {
        let eventList = event.split(' ').map(e => e.trim())
        eventList.forEach(e => {
            (delegation ? el(delegation) : document).addEventListener(e, (_e) => {
                const _list = elAll(selector)
                _list.forEach(
                    item => (_e.target === item || item.contains(_e.target)) && func.call(item, _e, item)
                )
            }, false)
        })
    }

    /**
     * 首字母大写
     */
    const firstUpperCase = ([first, ...rest]) => first.toUpperCase() + rest.join('')

    /**
     * 下划线转驼峰式
     */
    const toCamelCase = (name) => name.toLowerCase().replace(/_(\w)/g, (x) => {
        return x[1].toUpperCase()
    })

    /**
     * 时间格式化
     */
    const dateFormat = (fmt, date) => {
        let ret;
        const opt = {
            "Y+": date.getFullYear().toString(),        // 年
            "m+": (date.getMonth() + 1).toString(),     // 月
            "d+": date.getDate().toString(),            // 日
            "H+": date.getHours().toString(),           // 时
            "M+": date.getMinutes().toString(),         // 分
            "S+": date.getSeconds().toString()          // 秒
            // 有其他格式化字符需求可以继续添加，必须转化成字符串
        };
        for (let k in opt) {
            ret = new RegExp("(" + k + ")").exec(fmt);
            if (ret) {
                fmt = fmt.replace(ret[1], (ret[1].length == 1) ? (opt[k]) : (opt[k].padStart(ret[1].length, "0")))
            }
        }
        return fmt;
    }

    /**
     * 复制文本
     */
    const copy = function (text) {
        return new Promise((resolve, reject) => {
            var targetEL = document.createElement("textarea")
            targetEL.style.position = "fixed"
            targetEL.style.left = "-9999px"
            targetEL.style.top = "0"
            document.body.append(targetEL)
            targetEL.textContent = text

            targetEL.focus()
            targetEL.setSelectionRange(0, targetEL.value.length)
            document.execCommand('copy')
            targetEL.blur()
            targetEL.remove()

            resolve()
        })
    }

    /**
     * 日志功能
     */
    const errorMsg = function (msg) {
        let msgEL = buildMsgEl()
        el('#snowMsgContent').innerHTML = msg || '失败'
        msgEL.classList.add('error-msg')
        msgEL.classList.add('active')
        setTimeout(function () {
            msgEL.classList.remove('error-msg')
            msgEL.classList.remove('active')
        }, 800)
    }
    const successMsg = function (msg) {
        let msgEL = buildMsgEl()
        el('#snowMsgContent').innerHTML = msg || '成功'
        msgEL.classList.add('success-msg')
        msgEL.classList.add('active')
        setTimeout(function () {
            msgEL.classList.remove('success-msg')
            msgEL.classList.remove('active')
        }, 800)
    }

    const buildMsgEl = function () {
        if (el('#snowMsg')) {
            return el('#snowMsg')
        }
        let msg = document.createElement('div')
        msg.id = 'snowMsg'
        let msgContent = document.createElement('div')
        msgContent.id = 'snowMsgContent'
        msg.appendChild(msgContent)
        el('body').appendChild(msg)

        let msgStyle = document.createElement('style')
        msgStyle.textContent = `
        /* 消息提示 */
            #snowMsg {
                position: fixed;
                left: 0;
                right: 0;
                top: 30px;
                z-index: 999999;
                width: auto;
                max-width: 200px;
                margin: auto;
                border-radius: 5px;
                padding: 10px;
                color: #fff;
                text-align: center;
                opacity: .9;
                display: none;
                z-index: -1;
            }

            #snowMsg.error-msg {
                background-color: #f00;
            }

            #snowMsg.success-msg {
                background-color: #2196F3;
            }

            #snowMsg.active {
                display: block;
                z-index: 1;
            }
        `
        el('body').appendChild(msgStyle)
        return msg
    }

    /**
     * 抖动处理
     */
    const debounce = function (func, delay) {
        let timer = null
        return function () {
            if (timer) {
                clearTimeout(timer)
            }
            timer = setTimeout(() => {
                func.apply(this, arguments)
            }, delay || 300)
        }
    }

    /**
     * 节流throttle代码（定时器）：
     */
    const throttle = function (func, delay) {
        var timer = null;
        return function () {
            if (!timer) {
                timer = setTimeout(() => {
                    func.apply(this, arguments);
                    timer = null;
                }, delay || 300);
            }
        }
    }

    /**
     * 字符串模板动态执行
     */
    const evalTemplate = function (template, ...params) {
        let _template = 'return \`' + template + '\`'
        let func = new Function('data', _template)
        return func(params[0])
    }

    /**
     * 异步请求 get
     */
    const get = function (url, data) {
        return new Promise((resolve, reject) => {
            var xhr = new XMLHttpRequest();
            if (data) {
                url = url + '?' + Object.keys(data).map(key => `${key}=${data[key]}`).join('&')
            }
            xhr.open('GET', url, true);
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) {
                    if (xhr.status >= 200 && xhr.status < 400) {
                        if (xhr.responseText
                            && (xhr.responseText.charAt(0) === '[' || xhr.responseText.charAt(0) === '{')) {
                            let result = JSON.parse(xhr.responseText)
                            resolve(result);
                        } else {
                            resolve(xhr.responseText)
                        }
                    } else {
                        reject ? reject() : errorMsg(result.msg || '失败')
                    }
                }
            }
            xhr.send(null);
        })
    }

    /**
     * 异步请求 post
     */
    const post = function (url, data) {
        return new Promise((resolve, reject) => {
            var xhr = new XMLHttpRequest();
            xhr.open('POST', url, true);
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) {
                    if (xhr.status >= 200 && xhr.status < 400) {
                        if (xhr.responseText
                            && (xhr.responseText.charAt(0) === '[' || xhr.responseText.charAt(0)) === '{') {
                            let result = JSON.parse(xhr.responseText)
                            resolve(result);
                        } else {
                            resolve(xhr.responseText)
                        }
                    } else {
                        reject ? reject() : errorMsg(result.msg || '失败')
                    }
                }
            }
            xhr.send(json2FormData(data));
        })
    }

    /**
     * 异步请求 request
     */
    const request = function (url, data, method = 'POST') {
        return new Promise((resolve, reject) => {
            var xhr = new XMLHttpRequest();
            xhr.open(method, url, true);
            xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) {
                    if (xhr.status >= 200 && xhr.status < 400) {
                        if (xhr.responseText
                            && (xhr.responseText.charAt(0) === '[' || xhr.responseText.charAt(0)) === '{') {
                            let result = JSON.parse(xhr.responseText)
                            resolve(result);
                        } else {
                            resolve(xhr.responseText)
                        }
                    } else {
                        reject ? reject() : errorMsg(result.msg || '失败')
                    }
                }
            }
            xhr.send(JSON.stringify(data));
        })
    }

    /**
     * 瀑布流
     */
    const waterfall = function (containerSelector, padding = 12, defaultColumnSize = 3, minWidth = 260) {
        let columnSize = defaultColumnSize;
        let container = $.el(containerSelector)
        let totalWidth = container.offsetWidth
        let itemSelector = containerSelector + " > *"

        let singleWidth = ~~((totalWidth - (columnSize - 1) * padding) / columnSize)
        while (singleWidth < 260 && columnSize > 1) {
            columnSize -= 1
            singleWidth = ~~((totalWidth - (columnSize - 1) * padding) / columnSize)
        }

        let lastPosition = Array(columnSize).fill(0)

        // 宽度计算
        $.elAll(itemSelector).forEach((item, idx) => {
            item.setAttribute(`style`, `width: ${singleWidth}px;`)
        })

        // 生成瀑布流
        $.elAll(itemSelector).forEach((item, idx) => {
            let _height = item.offsetHeight

            // 1. 最小位置
            let minPosition = Math.min(...lastPosition)
            let _column = lastPosition.indexOf(minPosition)

            // 2. 挂载当前数据
            let _top = ~~(minPosition + padding);
            let _left = ~~(_column * (singleWidth + padding))
            item.setAttribute(`style`, `position: absolute; width: ${singleWidth}px; left: ${_left}px; top: ${_top}px`)

            // 3. 更新上下文
            lastPosition[_column] = lastPosition[_column] + padding + _height
        })

        // 绑定resize
        window.onresize = this.throttle(() => waterfall(containerSelector, padding, defaultColumnSize, minWidth))
    }

    /**
     * 显示切换
     */
    const toggle = function (selector, displayType = 'block') {
        let isHide = window.getComputedStyle($.el(selector)).display === 'none'
        if (isHide) {
            $.el(selector).style.display = displayType
        } else {
            $.el(selector).style.display = 'none'
        }
    }

    /**
     * 显示切换
     */
    const fade = function (selector, marginAt = 'right', displayType = 'block') {
        let isHide = !(window.getComputedStyle($.el(selector)).opacity !== '0') || window.getComputedStyle($.el(selector)).display === 'none'
        if (isHide) {
            $.el(selector).style.display = displayType
            $.el(selector).style.opacity = "1"
            $.el(selector).style.pointerEvents = 'auto'
            $.el(selector).style[`margin${firstUpperCase(marginAt)}`] = '0'
        } else {
            $.el(selector).style.opacity = "0"
            $.el(selector).style.pointerEvents = 'none'
            $.el(selector).style[`margin${firstUpperCase(marginAt)}`] = '10px'
            $.el(selector).style.transitionDelay = '0.2s'
            $.el(selector).style.transitionProperty = 'all'
        }
    }

    const json2FormData = function (data) {
        let formData = new FormData()
        for (let key in data) {
            formData.set(key, data[key])
        }
        return formData
    }

    const func = {
        el: el,
        elAll: elAll,
        bindEvent: bindEvent,
        bindEventForce: bindEventForce,
        firstUpperCase: firstUpperCase,
        toCamelCase: toCamelCase,
        dateFormat: dateFormat,
        copy: copy,
        log: log,
        errorMsg: errorMsg,
        successMsg: successMsg,
        debounce: debounce,
        throttle: throttle,
        evalTemplate: evalTemplate,
        post: post,
        get: get,
        request: request,
        waterfall: waterfall,
        toggle: toggle,
        fade: fade,
    }
    for (const _func in func) {
        $[_func] = func[_func]
        window[_func] = func[_func]
    }
    return $
})(window, window.$ || {})