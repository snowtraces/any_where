window.$ = (function (window, $) {

    const renderForm = function (formJson) {
        formJson = [
            {
                label: 'input',
                type: 'text',
                title: '这是input text',
                name: 'name_1'
            }, {
                label: 'input',
                type: 'text',
                title: '这是input text',
                name: 'name_2'
            }, {
                label: 'input',
                type: 'text',
                title: '这是 numb',
                name: 'name_3'
            }
        ]

        let formHTML = formJson.map(item => {
            let label = item.label;
            switch(label) {
                case 'input':
                    return `
                    <div class='form-item column is-4'>
                        <label>${item.title}:</label>
                        <input type=${item.type || 'text'} name=${item.name} />
                    </div>
                    `
            }
        }).join('')

        return formHTML
    }

    const func = {
        renderForm: renderForm
    }
    for (const _func in func) {
        $[_func] = func[_func]
        window[_func] = func[_func]
    }
    return $
})(window, window.$ || {})