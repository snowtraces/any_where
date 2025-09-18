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
        $.copy($.el('.share-info').value).then(a => {
          $.successMsg("链接已复制")
        })
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

      $.bindEvent(".aside-item__share", 'click', (e, from) => {
        let idx = from.parentNode.dataset.idx
        let anywhereData = JSON.parse(localStorage.getItem("anywhere") || "[]")
        let shareUrl = `${location.protocol + "//" + location.host}/share/${anywhereData[idx].id}`

        $.copy(shareUrl).then(a => {
          $.successMsg("链接已复制")
        })
      })

      $.bindEvent(".data-option__copy", "click", (e, from) => {
        $.copy($.el('#data-input').value).then(a => {
          $.successMsg("内容已复制")
        })
      })

      $.bindEvent(".data-option__format", "click", (e, from) => {
        try {
          let jsonString = JSON.stringify(JSON.parse($.el('#data-input').value), null, 2)
          let codeType = this.checkCodeType(jsonString)
          $.el('#data-input').value = jsonString
          $.el('.data-code').innerHTML = `<pre class="language-${codeType}"><code class="language-${codeType}">${this.html2Escape(jsonString)}</code></pre>`
          Prism.highlightAll()
        } catch (e) {
          $.log(e)
        }
      })

      $.bindEvent('.qr-btn', 'click', () => {
        const text = $.el('.share-info').value;
        if (!text) {
          $.errorMsg("无链接内容");
          return;
        }

        // 创建模态框
        this.showQRCodeModal(`"${text}"`);
      });

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
      if (!sHtml) {
        return sHtml
      }
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
        return null;
      }

      // 先检查是否为 JSON 格式（高确定性）
      if ((inString.trim().startsWith("{") && inString.trim().endsWith("}")) ||
        (inString.trim().startsWith("[") && inString.trim().endsWith("]"))) {
        try {
          JSON.parse(inString.trim());
          return "json";
        } catch (e) {
          // 如果解析失败，继续其他判断
        }
      }

      // 定义各语言的特征词和权重
      const languagePatterns = {
        "js": {
          patterns: [
            /\b(?:await|let|var|const|function|=>|console\.|document\.|window\.|import|export|class\s+\w+)\b/,
            /\$?\{[^}]*\}/,
            /(?:let|const|var)\s+\w+\s*=/,
            /\.\w+\(/
          ],
          weight: 1.0
        },
        "css": {
          patterns: [
            /[\w-]+\s*:\s*[^;]+;/,
            /(?:\.|#)[\w-]+\s*\{/,
            /@media|@keyframes|@import/,
            /background|color|margin|padding|border|font/
          ],
          weight: 0.9
        },
        "markup": {
          patterns: [
            /<\/?[a-zA-Z][\s\S]*?>/,
            /<!DOCTYPE html>/i,
            /<\??xml/i
          ],
          weight: 0.8
        },
        "sql": {
          patterns: [
            /\b(?:SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|JOIN|ORDER BY|GROUP BY)\b/i,
            /\b(?:select|insert|update|delete|from|where|join|order by|group by)\b/
          ],
          weight: 0.9
        },
        "go": {
          patterns: [
            /\b(?:package|import|func|chan|defer|range|go\s+\w+)\b/,
            /(?:var|const)\s+\w+\s+[\w\*]+/,
            /\w+\s*:=\s*.+/,
            /,\s*err\s*:=/
          ],
          weight: 1.0
        },
        "clike": {
          patterns: [
            /\b(?:if\s*\(|else\s*\{|while\s*\(|for\s*\(|return|break|continue|switch|case)\b/,
            /#include\s*[<"]/,
            /\b(?:int|char|void|float|double|struct|class)\s+\w+/,
            /std::\w+/,
            /public\s+class/
          ],
          weight: 0.7
        }
      };

      // 计算各语言的匹配分数
      const scores = {};

      Object.keys(languagePatterns).forEach(lang => {
        const {patterns, weight} = languagePatterns[lang];
        let score = 0;

        patterns.forEach(pattern => {
          const matches = inString.match(new RegExp(pattern, 'g'));
          if (matches) {
            score += matches.length;
          }
        });

        // 应用权重并考虑代码长度
        scores[lang] = score * weight / Math.max(1, inString.length / 100);
      });

      // 找出得分最高的语言
      let bestLanguage = null;
      let maxScore = 0;

      Object.keys(scores).forEach(lang => {
        if (scores[lang] > maxScore && scores[lang] > 0.1) { // 设置最小阈值
          maxScore = scores[lang];
          bestLanguage = lang;
        }
      });

      return bestLanguage;
    },
    showQRCodeModal(text) {
      // 创建模态框
      const modal = document.createElement('div');
      modal.id = 'qrcode-modal';
      modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  `;

      const content = document.createElement('div');
      content.style.cssText = `
    background: white;
    padding: 20px;
    border-radius: 8px;
    text-align: center;
    position: relative;
    max-width: 300px;
    display: flex;
    flex-direction: column;
  `;

      const title = document.createElement('h3');
      title.textContent = '二维码分享';
      title.style.margin = '0';

      // 创建 canvas 元素而不是直接使用 div
      const canvas = document.createElement('canvas');
      canvas.id = 'qrcode-canvas';
      canvas.style.cssText = `
          margin: 15px 0px;
          border: 1px solid #333;
      `;

      const closeBtn = document.createElement('button');
      closeBtn.innerHTML = '关闭';
      closeBtn.style.cssText = `
    padding: 8px 16px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  `;

      closeBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
      });

      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          document.body.removeChild(modal);
        }
      });

      content.appendChild(title);
      content.appendChild(canvas);  // 添加 canvas 而不是 div
      content.appendChild(closeBtn);
      modal.appendChild(content);
      document.body.appendChild(modal);

      // 生成二维码到 canvas
      QRCode.toCanvas(canvas, text, {
        width: 200,
        height: 200,
        margin: 2
      }, function (error) {
        if (error) {
          $.errorMsg("生成二维码失败");
          console.error(error);
        }
      });
    }
    ,

    onload() {
    },
  }

  controller.init(view, model)
}
