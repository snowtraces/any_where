let jsList = [
    '/static/js/util/function.js',
    '/static/js/util/event-hub.js',
    '/static/js/3rdparty/prism.js',

    '/static/js/module/home.js',

    '/static/js/route.js',
]

let developModel = true;

// let rootPath = "https://my.snowtraces.com/qa";
let rootPath = "";

let cssList = [
    '/static/css/main.css',
    '/static/css/prism.css',
]

let version = developModel ? new Date().getTime() : '2021082402';

function loadScript(url) {
    let script = document.createElement('script');
    script.src = `${url}?version=${version}`;
    let body = document.querySelector('body');
    body.append(script);

    return script;
}

function loadCss(url) {
    let link = document.createElement('link');
    link.rel = 'stylesheet'
    link.href = `${url}?version=${version}`;
    let head = document.querySelector('head');
    head.append(link);

    return link;
}

function syncLoad(urlList, loadFunction) {
    let len = urlList.length;
    if (len === 0) {
        return
    }
    let el = loadFunction(urlList[0]);
    el.onload = () => {
        urlList.shift()
        syncLoad(urlList, loadFunction)
    }
}

window.onload = function () {
    // syncLoad(cssList, loadCss)
    syncLoad(jsList, loadScript)
}

let routes = {
    "home": {
        name: "首页",
        event: "open-home",
        path: "./"
    },
    "share": {
        name: "问题",
        event: "load-share",
        path: "/share/"
    },
}

