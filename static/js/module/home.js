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
        if (!$.el('#data-input').value) {
          $.errorMsg("无内容")
          return
        }

        // 1. 执行提交
        $.request('/api/v1/msg/save', {
          // base64
          "content": $.el('#data-input').value,
          "createAt": null
        }).then(result => {
          // 2. 切换状态
          $.toggle('.submit-btn')
          $.toggle('.refresh-btn')
          $.el('.share-left').classList.add("success")
          $.el('.share-right').classList.add("success")

          $.el('.share-info').value = `${location.protocol + "//" + location.host}/share/${result.id}`

          // 3. 保存历史记录
          let anywhereData = JSON.parse(localStorage.getItem("anywhere") || "[]")
          anywhereData.unshift(result)
          localStorage.setItem("anywhere", JSON.stringify(anywhereData))
        })
      })

      $.bindEvent('.refresh-btn', 'click', (e, from) => {
        $.toggle('.submit-btn')
        $.toggle('.refresh-btn')
        $.el('.data-code').style.display = 'none'
        $.el('.share-left').classList.remove("success")
        $.el('.share-right').classList.remove("success")
        $.el('#data-input').value = ""
        $.el('.share-info').value = ""
      })

      $.bindEvent('.share-btn', 'click', () => {
        $.copy($.el('.share-info').value)
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
        setTimeout(() => {
          $.el('#data-input').click()
        }, 0)

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

          let codeType = this.checkCodeType(result.content)
          if (codeType) {
            $.el('.data-code').innerHTML = `<pre class="language-${codeType}"><code class="language-${codeType}">${this.html2Escape(result.content)}</code></pre>`
            Prism.highlightAll()
            $.toggle('.data-code')
          }

          // 2. 切换状态
          $.toggle('.submit-btn')
          $.toggle('.refresh-btn')
          $.el('.share-left').classList.add("success")
          $.el('.share-right').classList.add("success")

          $.el('.share-info').value = `${location.protocol + "//" + location.host}/share/${result.id}`
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
<!--                         <div class="aside-item__btn aside-item__save ">保存</div>-->
                         <div class="aside-item__btn aside-item__delete">删除</div>
<!--                         <div class="aside-item__btn aside-item__share">分享</div>-->
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

      let cLikeRegex = "(if\\s*\\(|else\\s*\\(|while|do|for\\s*\\(|return | in |instanceof|function|new|try|throw|catch|finally|null|break|continue)"
      let cLikeCount = (inString.match(new RegExp(cLikeRegex, "ig")) || []).length
      if (cLikeCount && cLikeCount > inString.length / 240) {
        return "clike"
      }


      let codeRegex = {
        "markup": "<(div|a |link |xml|node|html|body)[^\>]*>",
        "css": "(padding|margin|border|font|size)",
        "js": "(await |let |var |const |undefined|document\\.|window\\.|\\) =>)|\\$\\{",
        "go": "(chan |defer |range|iota |nil|:=)|, err =",
        "sql": "(select |distinct |join |left |where |exist )"
      }

      let codeCount = {}
      Object.keys(codeRegex).map(key => {
        let reg = new RegExp(codeRegex[key], "ig")
        let matchResult = inString.match(reg)
        if (matchResult && matchResult.length > 0) {
          codeCount[key] = matchResult.length
          $.log(key, matchResult)
        }
      })

      let codeTypes = ["js", "sql", "go", "markup", "css"]

      let maxCount = Math.max(...Object.values(codeCount))
      let types = codeTypes.filter(type => codeCount[type] && codeCount[type] === maxCount)
      if (types && types.length > 0) {
        return types[0]
      } else {
        return null
      }
    },

    onload() {
    },
  }

  controller.init(view, model)
}
