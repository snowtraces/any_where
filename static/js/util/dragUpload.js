window.$ = (function (window, $) {
    /**
     * 拖拽上传
     * @param {String} wrapperSelector 
     * @param {String} resultType 
     */
    const dragUpload = function (wrapperSelector, callback, resultType) {
        let isSupportDrag = function () {
            let div = document.createElement('div');
            return (('draggable' in div) || ('ondragstart' in div && 'ondrop' in div)) && 'FormData' in window && 'FileReader' in window
        }()
        if (!isSupportDrag) {
            reject ? reject() : alert('浏览器不支持拖拽上传')
            return
        }
        $.bindEvent(
            'html',
            'drag dragstart dragend dragover dragenter dragleave drop',
            (event) => {
                event.preventDefault()
                event.stopPropagation()
            }
        )
        $.bindEvent(wrapperSelector, 'dragover dragenter', () => { $.el(wrapperSelector).classList = 'is-dragover' })
        $.bindEvent(wrapperSelector, 'dragleave dragend drop', () => { $.el(wrapperSelector).classList = '' })
        $.bindEvent(wrapperSelector, 'drop', (event) => {
            let droppedFiles = event.dataTransfer.files
            let reader = new FileReader()
            if (resultType && resultType === 'binary') {
                reader.readAsDataURL(droppedFiles[0])
            } else {
                reader.readAsText(droppedFiles[0])
            }
            reader.onload = () => {
                callback(reader.result)
            }
        })
    }

    const func = {
        dragUpload: dragUpload
    }
    for (const _func in func) {
        $[_func] = func[_func]
        window[_func] = func[_func]
    }
    return $
})(window, window.$ || {})