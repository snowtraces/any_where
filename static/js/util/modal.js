window.$ = (function (window, $) {
    
    const initModal = function(title, content) {
        const id = 'global-modal';

        $.el(`#${id}`) && $.el('#global-modal').remove()

        let modalEl = document.createElement('div');
        modalEl.id = id;
        modalEl.classList.add('modal');
        modalEl.setAttribute("tabindex", "-1")
        modalEl.innerHTML = ` 
            <div class='modal-main'>
                <div class='modal-title'>${title}</div>
                <div class='modal-content columns'>${$.renderForm(content)}</div>
                <div class='modal-footer'>
                    <button type='button' class='submit-btn btn-black btn-zoom'>提交</button>
                    <button type='button' class='cancel-btn btn-gray btn-zoom'>取消</button>
                </div>
            </div>
        `
        $.bindEvent(`#${id}`, 'keyup', (e) => {
            if (e.keyCode === 27) {
                modalEl.remove()
            }
        })
        $.bindEvent(`.cancel-btn`, 'click', () => {
            modalEl.remove()
        })
        
        document.body.append(modalEl);
    }

    const func = {
        initModal: initModal,
    }
    for (const _func in func) {
        $[_func] = func[_func]
        window[_func] = func[_func]
    }
    return $
})(window, window.$ || {})