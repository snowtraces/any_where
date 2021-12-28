window.$ = (function (window, $) {
    
    const initTable = function(columns, page, target) {
        // 1. 拼接查询数据
        let offset = page.offset || 0;
        let limit = page.limit || 0;

        // 2. 查询
        // TODO
        let data = {
            total: 1,
            rows: [
                {
                    title: '这是title',
                    content: '这是content'
                },
                {
                    title: '这是title',
                    content: '这是content'
                },
                {
                    title: '这是title',
                    content: '这是content'
                },
                {
                    title: '这是title',
                    content: '这是content'
                },
                {
                    title: '这是title',
                    content: '这是content'
                },
            ]
        };

        // 3. 组装结果数据
        let thead = columns.map(col => `<th width=${col.width || ''}>${col.name}</th>`).join('')

        let tbody = data.rows.map((item, idx) => {
            return '<tr>' + columns.map(col => `<td>${
                col.render ? col.render(item[col.code], idx, item) : (item[col.code] || '-')  
            }</td>`).join('') + '</tr>'
        }).join('\n')

        let tableTmplate = `<div class="std-table-header">
        <div class="left"></div>
        <div class="right"><button class="add btn-black btn-fade">+新增</button></div>
        </div>
        <table class='std-table'>
            <thead>
                <tr>
                    ${thead}
                </tr>
            </thead>
            <tbody>
                ${tbody}
            </tbody>
        </table>`
        target.innerHTML = tableTmplate
    }

    const func = {
        initTable: initTable
    }
    for (const _func in func) {
        $[_func] = func[_func]
        window[_func] = func[_func]
    }
    return $
})(window, window.$ || {})