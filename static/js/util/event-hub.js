window.eventHub = {
    events: {},
    queue: {},
    emit(eventName, data) {
        let fnList = this.events[eventName]
        if (fnList) {
            fnList.map(fn => fn.call(undefined, data))
        } else {
            this.queue[eventName] = [...(this.queue[eventName] || []), data]
        }
    },
    on(eventName, fn) {
        (this.events[eventName] || (this.events[eventName] = [])).push(fn)

        let remainDataArray = this.queue[eventName]
        if (remainDataArray) {
            remainDataArray.forEach(data => this.emit(eventName, data))
            delete this.queue[eventName]
        }
    }
}
