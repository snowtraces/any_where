window.$ = (function (window, $) {

    /**
     * 颜色信息
     */
    class rgb {
        constructor(r, g, b, count) {
            this.r = r;
            this.g = g;
            this.b = b;
            this.count = count;
        }
    }

    rgb.prototype.toRgba = function () {
        return `rgba(${this.r}, ${this.g}, ${this.b}, 1)`
    }

    rgb.prototype.toHex = function () {
        let rStr = this.r.toString(16).padStart(2, '0')
        let gStr = this.g.toString(16).padStart(2, '0')
        let bStr = this.b.toString(16).padStart(2, '0')

        return '#' + rStr + gStr + bStr;
    }

    rgb.prototype.getTextColor = function () {
        if (this.r + this.g + this.b > 600) {
            return '#000';
        } else {
            return '#fff';
        }
    }

    /**
     * 获取像素点值
     * @param {*} imageSelector 
     */
    const getPixels = function (imageSelector) {
        const sourceImg = $.el(imageSelector)
        let canvas = document.createElement('canvas')

        let height = canvas.height = sourceImg.naturalHeight;
        let width = canvas.width = sourceImg.naturalWidth;
        let context = canvas.getContext('2d')
        context.drawImage(sourceImg, 0, 0);

        let imgData = context.getImageData(0, 0, width, height);

        return imgData.data
    }

    /**
     * 中位切分法
     * @param {*} imageSelector 
     */
    const themeColor = function (imageSelector) {
        let pixels = getPixels(imageSelector)
        let length = pixels.length;
        // 将颜色放入对应位置
        let i = -4
        let blockSize = 47 // 选取密度
        let rgbArray = new Array(8)
        for (let j = 0; j < 8; j++) {
            rgbArray[j] = new rgb(0, 0, 0, 0);
        }
        while ((i += blockSize * 4) < length) {
            let rIndex = (pixels[i] - 128) >> 31;
            let gIndex = (pixels[i + 1] - 128) >> 31;
            let bIndex = (pixels[i + 2] - 128) >> 31;
            let index = ((rIndex + 1) << 2) + ((gIndex + 1) << 1) + (bIndex + 1); // 计算二进制索引
            rgbArray[index].r += pixels[i];
            rgbArray[index].g += pixels[i + 1];
            rgbArray[index].b += pixels[i + 2];
            rgbArray[index].count++;
        }

        rgbArray.sort(function (a, b) {
            return b.count - a.count
        })

        return rgbArray.map(_rgb => {
            let r = ~~(_rgb.r / _rgb.count)
            let b = ~~(_rgb.b / _rgb.count)
            let g = ~~(_rgb.g / _rgb.count)
            return new rgb(r, g, b, _rgb.count)
        })
    }

    const func = {
        themeColor: themeColor,
        rgb: rgb,
        getPixels: getPixels
    }
    for (const _func in func) {
        $[_func] = func[_func]
        window[_func] = func[_func]
    }
    return $
})(window, window.$ || {})