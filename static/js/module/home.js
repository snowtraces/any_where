{
    let view = {
        el: '#main-wrapper',
        template: `
        `,
        render(data) {
            $.el(this.el).innerHTML = $.evalTemplate(this.template, data)
        }
    }

    let model = {
        filter: {}
    }

    let controller = {
        init(view, model) {
            this.view = view
            this.model = model
            this.bindEvents()
            this.bindEventHub()
        },
        bindEvents: function () {
            $.bindEvent('.submit-btn', 'click', (e, from) => {
                // 1. 执行提交
                $.request('/api/v1/msg/save', {
                    "content": $.el('#data-input').value,
                    "createAt": ""
                }).then(result => {
                    // 2. 切换状态
                    $.toggle('.submit-btn')
                    $.toggle('.refresh-btn')
                    $.el('.share-left').classList.add("success")
                    $.el('.share-right').classList.add("success")

                    $.el('.share-info').innerHTML = `<a target="_blank" href="/share/${result.id}" title="分享链接">${location.protocol + "//" + location.host}/share/${result.id}</a>`

                    // 3. 保存历史记录
                    let anywhereData = JSON.parse(localStorage.getItem("anywhere") || "[]")
                    anywhereData.unshift(result)
                    localStorage.setItem("anywhere", JSON.stringify(anywhereData))
                })
            })

            $.bindEvent('.refresh-btn', 'click', (e, from) => {
                $.toggle('.submit-btn')
                $.toggle('.refresh-btn')
                $.el('.share-left').classList.remove("success")
                $.el('.share-right').classList.remove("success")
                $.el('#data-input').value = ""
                $.el('.share-info').innerHTML = ""
            })

            $.bindEvent('.share-btn', 'click', () => {
                $.copy($.el('.share-info a').href)
            })

            $.bindEvent('.aside-option', 'click', () => {
                $.fade('#aside-wrapper')
            })

            $.bindEvent('.nav-item__his', 'click', () => {
                $.fade('#aside-wrapper')
                this.loadHistory()
            })

            $.bindEvent(".aside-item__delete", 'click', (e, from) => {
                let idx = from.parentNode.dataset.idx
                let anywhereData = JSON.parse(localStorage.getItem("anywhere") || "[]")
                anywhereData.splice(idx, 1)
                localStorage.setItem("anywhere", JSON.stringify(anywhereData))

                this.loadHistory()
            })

            $.bindEvent(".data-option__copy", "click", (e, from) => {
                $.copy($.el('#data-input').value)
            })

            // $.bindEvent(".data-option__edit", "click", (e, from) => {
            //     $.toggle('.data-code')
            // })

            $.bindEvent("#data-input", "blur", (e, from) => {
                let codeType = this.checkCodeType($.el('#data-input').value)
                $.log(codeType)
                if (codeType) {
                    $.el('.data-code').innerHTML = `<pre class="language-${codeType}"><code class="language-${codeType}">${this.html2Escape($.el('#data-input').value)}</code></pre>`
                    Prism.highlightAll()
                    $.toggle('.data-code')
                    $.el('.data-code pre').scrollTo($.el('#data-input').scrollLeft, $.el('#data-input').scrollTop)
                }
            })

            $.bindEvent(".data-code", "click", () => {
                let top = $.el('.data-code pre').scrollTop
                let left = $.el('.data-code pre').scrollLeft

                $.toggle('.data-code')
                $.el('#data-input').focus()
                $.el('#data-input').scrollTo(left, top)
            })

        },
        html2Escape(sHtml) {
            return sHtml.replace(/[<>&"]/g, function (c) {
                return {'<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;'}[c];
            });
        },
        bindEventHub() {
            window.eventHub.on("load-share", (data) => {
                let id = data.value
                $.get("/api/v1/msg/load", {id}).then((result) => {
                    $.el('#data-input').value = result.content

                    // 2. 切换状态
                    $.toggle('.submit-btn')
                    $.toggle('.refresh-btn')
                    $.el('.share-left').classList.add("success")
                    $.el('.share-right').classList.add("success")

                    $.el('.share-info').innerHTML = `<a target="_blank" href="/share/${result.id}" title="分享链接">${location.protocol + "//" + location.host}/share/${result.id}</a>`
                })
            })
        },
        loadHistory() {
            let anywhereData = JSON.parse(localStorage.getItem("anywhere") || "[]")
            if (anywhereData.length) {
                $.el('.aside-content').innerHTML = anywhereData.map((item, idx) => `
                    <div class="aside-item">
                        <div class="aside-item__option" data-idx="${idx}" data-id="${item.id}">
                         <div class="aside-item__time">${$.dateFormat("YY.mm.dd HH:MM:SS", new Date(item.createAt * 1000))}</div>
                         <div class="aside-item__btn aside-item__save ">保存</div>
                         <div class="aside-item__btn aside-item__delete">删除</div>
                         <div class="aside-item__btn aside-item__share">分享</div>
                       </div>
                       <pre class="aside-item__data">${this.html2Escape(item.content)}</pre>
                    </div>
                    `).join("")
            } else {
                $.el('.aside-content').innerHTML = ""
            }
        },
        checkCodeType(inString) {
            if (!inString) {
                return null
            }

            let codeRegex = {
                "markup": "<(div|a |link |xml|node|html|body)[^\>]*>",
                "js": "(await |let |var |const |undefined|document\\.|window\\.|\\) =>)|\\$\\{",
                "go": "(chan |defer |range|iota |nil|:=)|, err",
                "sql": "(select |distinct |join |left |where |exist )"
            }
            let clikeRegex = "(if|else|while|do|for|return|in|instanceof|function|new|try|throw|catch|finally|null|break|continue)"

            let codeCount = {}
            Object.keys(codeRegex).map(key => {
                let reg = new RegExp(codeRegex[key], "ig")
                let matchResult = inString.match(reg)
                if (matchResult && matchResult.length > 0) {
                    codeCount[key] = matchResult.length
                    $.log(key, matchResult)
                }
            })

            let codeTypes = ["js", "sql", "go", "markup"]

            $.log(codeCount)

            let maxCount = Math.max(...Object.values(codeCount))
            let types = codeTypes.filter(type => codeCount[type] && codeCount[type] === maxCount)
            if (types && types.length > 0) {
                return types[0]
            } else {
                let clikeCount = inString.match(new RegExp(clikeRegex, "ig")).length
                return (clikeCount && clikeCount > inString.length / 240) ? "clike" : null;
            }
        },

        onload() {
        },
    }

    controller.init(view, model)
}
