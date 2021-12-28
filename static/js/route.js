const loadRoute = () => {
    let path = window.location.pathname
    let pathMeta = path.substr(1).split('/')
    if (pathMeta.length >= 2) {
        window.eventHub.emit(routes[pathMeta[0]].event, {value: pathMeta[1], loadView: true})
    } else {
        window.eventHub.emit(routes.home.event)
    }
}
loadRoute()
window.addEventListener("popstate", loadRoute, false);