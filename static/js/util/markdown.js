window.$ = (function (window, $) {
    const mdParser = function (mdText) {
        let result = {}
        let result_list = []
        let script_list = []
        result.post = result_list
        result.script = script_list

        let flag_newLine = true;
        let line_idx = -1;
        let char_idx = -1;
        let first_not_blank_char = null;
        let last_char = null;
        // 每行非空字符开始索引
        let start_idx = [];

        let pair_stack = [];
        let data_stack = [];
        let line_data_stack = [];
        let last_pair_idx = -1;

        let pair_chars = ['```', '+', '|'];
        let on_text_block = false;

        for (const c of mdText) {
            // 新行初始化
            if (flag_newLine) {
                line_idx++;
                char_idx == -1;
                start_idx[line_idx] = -1;
                first_not_blank_char = null;

                last_pair_idx = -1;
            }
            char_idx++;

            // 查找第一个非空字符
            if (!first_not_blank_char && !/\s/.test(c)) {
                first_not_blank_char = c;
                start_idx[line_idx] = char_idx;
            }

            if (flag_newLine) {
                // 新行开始
                let pair_size = pair_chars.length;
                let pair_matched = false;
                let cached_data = line_data_stack.join('')
                for (let i = 0; i < pair_size; i++) {
                    let pair = pair_chars[i]
                    if (cached_data.startsWith(pair)) {
                        pair_matched = true;
                        if (on_text_block) {
                            // 在数据块中，判断当前是否已结束
                            // 结束了就弹出数据
                            if (pair_chars.includes(line_data_stack[0]) || line_data_stack[0] === '`') {
                                if (line_data_stack[0] !== '`' && line_data_stack[0] === c) {
                                    continue
                                }

                                let popped_data = popStack(data_stack, pair_stack[0])
                                let data_seg = popped_data.data
                                pair_stack.pop()
                                data_stack = []
                                if (popped_data.type === 'meta') {
                                    result.meta = data_seg
                                } else {
                                    if (popped_data.type === 'exec' && popped_data.script) {
                                        script_list.push(...popped_data.script)
                                    }

                                    data_seg && data_seg.trim() && result_list.push(`${data_seg.trim()}`)
                                }

                                on_text_block = false
                            }
                        } else {
                            // 开始数据块
                            on_text_block = true
                            pair_stack.push(pair)

                            data_stack = pair === '```' ? data_stack.slice(pair.length) : data_stack
                        }
                        break
                    }
                }

                // 没有命中pair
                if (!pair_matched) {
                    if (on_text_block) {
                        // 数据块中
                        // do nothing
                    } else {
                        // 段落模式中，换行
                        let popped_data = popStack(data_stack)
                        let data_seg = popped_data.data
                        data_stack = []
                        data_seg && data_seg.trim() && result_list.push(`<p>${data_seg.trim()}</p>`)
                    }
                }

                line_data_stack = []
            }

            data_stack.push(c)
            line_data_stack.push(c)

            // 新行状态切换
            flag_newLine = c && c === '\n'
            last_char = c
        }

        return result;
    }

    const html2Escape = function (sHtml) {
        return sHtml.replace(/[<>&"]/g, function (c) { return { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]; });
    }

    const popStack = function (data_stack, pair, plainText) {
        let result = {}
        let text = data_stack.join('');
        if (plainText || !pair) {
            if (!text || /^\s+$/.test(text) || /^# /.test(text)) {
                return result;
            }


            // 图片
            text = text.replace(/\!\[([^\]]+)\]\(([^\)]+)\)/g, '<img title="$1" src="$2" />')
            // 超链接
            text = text.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a title="$1" href="$2" target="_blank">$1</a>')
            // 标题
            if (text.indexOf('## ') !== -1) {
                text = text.replace(/(\n|^)## ([^\n]*)(\n|$)/g, '<h2>$2</h2>')
            }
            if (text.indexOf('## ') !== -1) {
                text = text.replace(/(\n|^)### ([^\n]*)(\n|$)/g, '<h3>$2</h3>')
            }

            text = text.replace(/`([^`]+)`/g, '<code>$1</code>')

            result.data = text
            result.type = 'text'
            return result
        } else {
            if (pair === '```') {
                // 文本块
                let firstLineIdx = data_stack.indexOf('\n')
                let type = data_stack.slice(0, firstLineIdx).join('').trim()
                text = data_stack.slice(firstLineIdx + 1, data_stack.length - 5).join('')

                if (type === 'meta') {
                    // 解析meta信息
                    return {
                        data: metaParser(text),
                        type: 'meta'
                    }
                } else if (type === 'exec') {
                    if (/<script.*?src=[\"\']([^\"\']+)[\"\']+/.test(text)) {
                        let scriptSrc = /<script.*?src=[\"\']([^\"\']+)[\"\']+/.exec(text)[1]
                        result.script = [scriptSrc]
                    }
                    result.data = text;
                    result.type = 'exec';
                    return result;
                } else {
                    result.type = 'block'
                    result.data = `<pre class="line-numbers language-${type}"><code class="language-${type}">${html2Escape(text.trim())}</code></pre>`
                    return result
                }
            } else if (pair === '|') {
                // 表格
                let table_regex = /(\|.*\|\s*\n)+/
                let table_matched = text.match(table_regex)
                if (table_matched && table_matched[0]) {
                    let raw_table = table_matched[0]
                    let table_html = tableParser(raw_table)

                    text = text.replace(table_regex, table_html)
                }

                result.data = text
                result.type = 'table'
                return result
            } else if (pair === '+') {

                // 列表
                let ul_regex = /(^|\n)(\+ .*\s*(\n|$))+/
                let ul_matched = text.match(ul_regex)
                if (ul_matched && ul_matched[0]) {
                    let raw_ul = ul_matched[0]
                    let li_array = raw_ul.split('\n').map(li => li.trim()).filter(li => li).map(li => li.substr(2))
                    let ul_html = `<ul>${li_array.map(li => `<li>${html2Escape(li)}</li>`).join('')}</ul>`

                    text = text.replace(ul_regex, ul_html)
                }

                text = text.replace(/`([^`]+)`/g, '<code>$1</code>')

                result.data = text
                result.type = 'ul'
                return result
            }
        }
    }


    const tableParser = function (tableText) {
        let rows = tableText.split("\n")
        if (rows.length <= 2) {
            return tableText
        }

        // 表头
        let table_header = rows[0].split('|')
        table_header.pop()
        table_header.shift()
        table_header = table_header.map(title => title.trim())

        // TODO 表对齐规则
        // 表数据
        let data_rows = rows.filter((_, idx) => idx > 1)
            .map(row => {
                data_row = row.split('|')
                data_row.pop()
                data_row.shift()
                return data_row.map(data => data.trim())
            })

        // 转换成html
        return `
        <table>
            <thead>
                <tr>
                    ${table_header.map(title => `<th>${title}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
                ${
            data_rows.map(row => `<tr>${row.map(data => `<td>${data}</td>`).join('')}</tr>`).join('')
            }
            </tbody>
        </table>`
    }

    const metaParser = function (metaText) {
        let lineList = metaText.split('\n');
        let regexedList = lineList
            .filter(line => !/^\s*$/.test(line))
            .map(line => /^(\s*)([^\s:]+):?\s*(.*)/.exec(line));

        let meta = {}
        let offsex_off_array = 1;
        regexedList.forEach((matched, idx) => {
            let title = matched[2]
            if (title === '-') {
                let lastTitle = regexedList[idx - offsex_off_array][2];
                meta[lastTitle] = meta[lastTitle] || []
                meta[lastTitle].push(matched[3])
                offsex_off_array++;
            } else {
                meta[title] = matched[3]
                offsex_off_array = 1
            }
        });
        return meta;
    }

    const func = {
        mdParser: mdParser,
    }
    for (const _func in func) {
        $[_func] = func[_func]
        window[_func] = func[_func]
    }
    return $
})(window, window.$ || {})
