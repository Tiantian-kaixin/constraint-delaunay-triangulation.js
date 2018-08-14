window.onload = function(e) {
    var GAUSSIAN = [
        [1 / 256, 4 / 256, 6 / 256, 4 / 256, 1 / 256],
        [4 / 256, 16 / 256, 24 / 256, 16 / 256, 4 / 256],
        [6 / 256, 24 / 256, 36 / 256, 24 / 256, 6 / 256],
        [4 / 256, 16 / 256, 24 / 256, 16 / 256, 4 / 256],
        [1 / 256, 4 / 256, 6 / 256, 4 / 256, 1 / 256]
    ];
    var SOBEL_X = [
        [-1, 0, 1],
        [-2, 0, 2],
        [-1, 0, 1]
    ];
    var SOBEL_Y = [
        [-1, -2, -1],
        [0, 0, 0],
        [1, 2, 1]
    ];
    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');
    var canvas2 = document.getElementById("finalcvs");
    var context2 = canvas2.getContext('2d');
    var loading=document.getElementById('h1');
    var top=document.getElementById('top');
    var dlButton =document.getElementById("downloadImageBtn");
    var contrain=document.getElementById('contrainLine');
    var web=document.getElementById('web');
    var final=document.getElementById('final');
    var width=0;
    var height=0;
    var allLine = [];   //所有点集合
    var testLine = [];  //
    var easyLine = [];    //easy() 后的点
    var allSpliceLine = [];
    var finalImage=null;
    var resultPoints=null;
    var c = [];
    dlButton.disabled='true';
    contrain.disabled='true';
    web.disabled='true';
    final.disabled='true';

    //打开文件
    var file = document.getElementById('file');
    file.onchange = function (e) {
        easyLine = [];
        loading.style.visibility= 'visible';
        var dataURL = window.URL.createObjectURL(file.files[0]);
        var image = new Image();
        image.src = dataURL;
        image.onload = function (e) {
            console.time('prepare time');
            var k= 700/image.width<=1 && 700/image.width;
            var w = width=canvas.width = canvas2.width=~~(image.width*(k || 1));
            var h = height=canvas.height = canvas2.height =~~(image.height*(k || 1));
            context.drawImage(image, 0, 0,w,h);
            var imageData = context.getImageData(0, 0, w, h);
            // 灰度数组。
            console.timeEnd('prepare time');

            console.time('total time');

            console.time('morphology time');
            var arr = morphology(imageData.data, w, h);  //数学形态学
            console.timeEnd('morphology time');

            console.time('sobel time');
            arr = sobel(arr, w, h, true);
            console.timeEnd('sobel time');

            console.time('threshold time');
            var t1 = Threshold(arr, w, h), t2 = t1 / 2;
            console.timeEnd('threshold time');
            //console.log('yuzhi t1:'+t1);

            console.time('hysteresisBinarize time');
            c = hysteresisBinarize(arr, w, h, t2, t1);
            console.timeEnd('hysteresisBinarize time');

            console.time('DouglasPeucker time');
            var a=DouglasPeucker(allSpliceLine, 2, w, h);
            console.timeEnd('DouglasPeucker time');

            //drawArr(arr, w, h);
            //easy(easyLine,w,h);                 //绘制简化后的线段图
            //contrainLine(easyLine,w,h);
            console.time('newconstrianDelaunay time');
            resultPoints=newconstrianDelaunay(easyLine,w,h,imageData);
            console.timeEnd('newconstrianDelaunay time');

            console.timeEnd('total time');

            allLine = [];                         //得到所有原始的连接线段,包括连续的分叉线段
            allSpliceLine = [];                   //得到所有分离的线段,不包括分叉线段
            testLine = [];
            canvas.style.visibility= 'visible';
            canvas2.style.visibility= 'visible';
            dlButton.disabled=false;
            contrain.disabled=false;
            web.disabled=false;
            final.disabled=false;
            loading.style.visibility= 'hidden';
            finalImage=context2.getImageData(0,0,w,h);
        }
    };
    top.onclick=function (e){
        var target=e.target;
        if(target===dlButton) {
            window.location.href = canvas2.toDataURL("image/png").replace("image/png", "image/octet-stream");
        }else if(target===contrain){
            context2.clearRect(0,0,width,height);
            contrainLine(easyLine,width,height);
        }else if(target===web){
            context2.clearRect(0,0,width,height);
            webTri(width,height,resultPoints);
        }else if(target===final){
            context2.clearRect(0,0,width,height);
            context2.putImageData(finalImage,0,0);
        }
    };

    function morphology(data, w, h) {
        function tol(R, G, B) {
            var L;
            var var_R = ( R / 255 );
            var var_G = ( G / 255 );
            var var_B = ( B / 255 );
            var var_Min = Math.min(var_R, var_G, var_B);    //Min. value of RGB
            var var_Max = Math.max(var_R, var_G, var_B);    //Max. value of RGB

            L = ( var_Max + var_Min ) / 2;
            return L * 255
        }

        function dilate(mData, w, h) {
            var dstData = new Array(mData.length);
            var newOffset, total, nowX, offsetY, offsetI, nowOffset, i, j;
            for (i = h; i--;) {
                offsetI = i * w;             //offsetI=h*w
                for (j = w; j--;) {            //j=w
                    newOffset = 0;
                    total = 0;
                    for (var y = 1; y >= -1; y--) {
                        offsetY = (y + i) * w * 4;     //offsetY=(3+h)*4*w
                        for (var x = 1; x >= -1; x--) {
                            nowX = (x + j) * 4;         //nowX=(3+w)*4
                            nowOffset = offsetY + nowX;
                            (mData[nowOffset] + mData[nowOffset + 1] + mData[nowOffset + 2] > total) &&
                            (total = mData[nowOffset] + mData[nowOffset + 1] + mData[nowOffset + 2]) &&
                            (newOffset = nowOffset);
                        }
                    }
                    dstData[(j + offsetI) * 4] = mData[newOffset];
                    dstData[(j + offsetI) * 4 + 1] = mData[newOffset + 1];
                    dstData[(j + offsetI) * 4 + 2] = mData[newOffset + 2];
                    dstData[(j + offsetI) * 4 + 3] = 1;
                }
            }
            return dstData
        }

        function erode(mData, w, h) {
            var dstData = new Array(mData.length);
            var newOffset, total, nowX, offsetY, offsetI, nowOffset, i, j;
            for (i = h; i--;) {
                offsetI = i * w;             //offsetI=h*w
                for (j = w; j--;) {            //j=w
                    newOffset = 0;
                    total = 765;
                    for (var y = 1; y >= -1; y--) {
                        offsetY = (y + i) * w * 4;     //offsetY=(3+h)*4*mWidth
                        for (var x = 1; x >= -1; x--) {
                            nowX = (x + j) * 4;
                            nowOffset = offsetY + nowX;
                            (mData[nowOffset] + mData[nowOffset + 1] + mData[nowOffset + 2] < total) &&
                            (total = mData[nowOffset] + mData[nowOffset + 1] + mData[nowOffset + 2]) &&
                            (newOffset = nowOffset);
                        }
                    }
                    dstData[(j + offsetI) * 4] = mData[newOffset];
                    dstData[(j + offsetI) * 4 + 1] = mData[newOffset + 1];
                    dstData[(j + offsetI) * 4 + 2] = mData[newOffset + 2];
                    dstData[(j + offsetI) * 4 + 3] = 1;
                }
            }
            return dstData
        }
        var imgdata = dilate(data, w, h), arr = [];
        imgdata = erode(imgdata, w, h);
        imgdata = erode(imgdata, w, h);
        imgdata = dilate(imgdata, w, h);
        for (var i = 0; i < w * h; i++) {
            var j = i * 4;
            var L = tol(imgdata[j], imgdata[j + 1], imgdata[j + 2]);
            arr.push(L)
        }
        return arr
    }

    function clamp(x, min, max) {
        return Math.min(Math.max(x, min), max);
    }

    function filter5x5(src, w, h, filter) {
        var dst = [];
        for (var y = 0; y < h; y++) {
            for (var x = 0; x < w; x++) {
                var g = 0;
                for (var dy = 0; dy < 5; dy++) {
                    for (var dx = 0; dx < 5; dx++) {
                        var cx = clamp(x + dx - 2, 0, w - 1);
                        var cy = clamp(y + dy - 2, 0, h - 1);
                        g += filter[dy][dx] * src[cx + cy * w];
                    }
                }
                dst.push(clamp(g, 0, 255));
            }
        }
        return dst;
    }

    function sobel(src, w, h, nms) {
        var amp = [];
        var dir = [];
        for (var y = 0; y < h; y++) {
            for (var x = 0; x < w; x++) {
                var gx = 0;
                var gy = 0;
                for (var dy = 0; dy < 3; dy++) {
                    for (var dx = 0; dx < 3; dx++) {
                        var cx = clamp(x + dx - 1, 0, w - 1);
                        var cy = clamp(y + dy - 1, 0, h - 1);
                        var i = cx + cy * w;
                        gx += SOBEL_X[dy][dx] * src[i];
                        gy += SOBEL_Y[dy][dx] * src[i];
                    }
                }
                amp.push(Math.sqrt(gx * gx + gy * gy));
                var rad = -Math.atan2(gy, gx);                  // 找出用于非最大抑制的边的角度。
                if (rad < 0) {
                    rad += Math.PI * 2;
                }
                var deg = rad * (180 / Math.PI);
                var d = 1;
                if (deg >= 45 - 22.5 && deg < 45 + 22.5) {
                    d = 2;
                } else if (deg >= 90 - 22.5 && deg < 90 + 22.5) {
                    d = 3;
                } else if (deg >= 135 - 22.5 && deg < 135 + 22.5) {
                    d = 4;
                } else if (deg >= 180 - 22.5 && deg < 180 + 22.5) {
                    d = 1;
                } else if (deg >= 225 - 22.5 && deg < 225 + 22.5) {
                    d = 2;
                } else if (deg >= 270 - 22.5 && deg < 270 + 22.5) {
                    d = 3;
                } else if (deg >= 315 - 22.5 && deg < 315 + 22.5) {
                    d = 4;
                }
                dir.push(d);
            }
        }
        var dst = [];
        if (nms) {
            for (var i = 0; i < w * h; i++) {
                dst.push(0);
            }
            for (var y = 1; y < h - 1; y++) {
                for (var x = 1; x < w - 1; x++) {
                    var i = x + y * w;
                    var p0 = amp[i];
                    var p1, p2;
                    if (dir[i] === 1) {
                        p1 = amp[i - 1];
                        p2 = amp[i + 1];
                    } else if (dir[i] === 2) {
                        p1 = amp[i + 1 - w];
                        p2 = amp[i - 1 + w];
                    } else if (dir[i] === 3) {
                        p1 = amp[i - w];
                        p2 = amp[i + w];
                    } else if (dir[i] === 4) {
                        p1 = amp[i - 1 - w];
                        p2 = amp[i + 1 + w];
                    }
                    if (p0 > p1 && p0 > p2) {
                        dst[i] = clamp(p0, 0, 255);
                    }
                }
            }
        } else {
            dst = amp;
        }
        return dst;
    }

    // 描述阵列像素。
    function drawArr(arr, w, h) {
        for (var y = 0; y < h; y++) {
            for (var x = 0; x < w; x++) {
                var g = Math.floor(arr[x + y * w]);
                context.fillStyle = 'rgb(' + g + ',' + g + ',' + g + ')';
                context.fillRect(x, y, 1, 1);
            }
        }
    }

    function Threshold(arr, w, h) {
        var testarr = [];
        for (var i = arr.length; --i ;) {
            testarr[i] = ~~arr[i]
        }

        function createHistogram(arr) {                         //创建直方图
            var histogram = {},
                total = 0;
            for (var i = 0; i<256;i++ ) {
                histogram[i] = 0;
            }
            for (var j = 0; j < w * h; j++) {
                histogram[arr[j]] += 1;
                total += 1;
            }
            histogram.length = total;
            return histogram;
        }

        function calcMeanThreshold(arr) {
            var histogram = createHistogram(arr),
                sum = 0,
                total = histogram.length;
            for (var i = 0; i < 256; i++) {
                sum += i * histogram[i];
            }
            return sum;                                                 //平均灰度值
        }

        function calcWeight(histogram, s, e) {     //计算比例
            var totle = 0;
            for (var i = s; i < e; i++) {
                totle += histogram[i];
            }
            return (totle / histogram.length)
        }

        function calcMean(histogram, s, e) {      //计算平均灰度
            var sum = 0, totle = 0;
            for (var i = s; i < e; i++) {
                sum += histogram[i] * i;
                totle += histogram[i]
            }
            return (sum / totle)
        }

        /*
        w1前景占整幅图像的比例,它的平均灰度为u0,W2背景像素点赞整幅图像的比例,它的平均灰度为u1,图像的总平均
        灰度记为μ,类间方差记为g。假设图像的背景较暗,并且图像的大小为M×N,
        图像中像素的灰度值小于阈值T的像素个数记作N0,像素灰度大于阈值T的像素个数记作N1,则有:
      　　　　　　ω0=N0/ M×N (1)
      　　　　　　ω1=N1/ M×N (2)
      　　　　　　N0+N1=M×N (3)
      　　　　　　ω0+ω1=1 (4)
      　　　　　　μ=ω0*μ0+ω1*μ1 (5)
      　　　　　　g=ω0(μ0-μ)^2+ω1(μ1-μ)^2 (6)
        将式(5)代入式(6),得到等价公式: g=ω0ω1(μ0-μ1)^2 (7)    前比例*后比例*(前灰度-后灰度)^2
         */
        function calcBetweenClassVariance(weight1, mean1, weight2, mean2) {       //内间方差计算
            return weight1 * weight2 * (mean1 - mean2) * (mean1 - mean2);
        }

        function fastOtsu(arr) {
            var histogram = createHistogram(arr);
            var start = 0;
            var end = 255;
            var leftWeight, rightWeight,
                leftMean, rightMean;
            var betweenClassVariances = [];
            var max = -Infinity, threshold;
            for (var i = 1; i < 256; i++) {
                leftWeight = calcWeight(histogram, start, i);
                rightWeight = calcWeight(histogram, i, end + 1);
                leftMean = calcMean(histogram, start, i);
                rightMean = calcMean(histogram, i, end + 1);
                betweenClassVariances[i] = calcBetweenClassVariance(leftWeight, leftMean, rightWeight, rightMean);
                if (betweenClassVariances[i] > max) {
                    max = betweenClassVariances[i];
                    threshold = i;
                }
            }
            return threshold;
        }

        function highMine(histogram, mid) {
            var v1 = calcMean(histogram, 0, mid);
            var v2 = calcMean(histogram, mid, 256);
            return ~~((v1 + v2) / 2);
        }

        function suit(arr) {
            var histogram = createHistogram(arr);
            var mid = 127, v0 = highMine(histogram, mid);
            while (Math.abs(v0 - mid) >= 3) {
                mid = v0;
                v0 = highMine(histogram, mid);
            }
            return v0
        }
        //return fastOtsu(testarr);
        return suit(testarr)
    }

    //阈值筛选处理
    function binarize(input, threshold) {
        var output = [];
        for (var i = 0; i < input.length; i++) {
            output[i] = input[i] < threshold ? 0 : 255;
        }
        return output;
    }

    function hysteresisBinarize(src, w, h, mint, maxt) {
        // 一个肯定会成为边缘的像素。
        var minb = binarize(src, mint);
        // 它可能是一个边缘像素。。
        var maxb = binarize(src, maxt);
        var edge = [];
        var triLength=~~((w+h)*0.01);
        for (var i = 0; i < w * h; i++) {
            if (maxb[i] === 255) {
                edge.push(2);
            } else if (minb[i] === 255) {
                edge.push(1);
            } else {
                edge.push(0);
            }
        }
        var check = [];
        for (var i = 0; i < w * h; i++) {
            check.push(false);
        }
        //var edgeIndices = [];
        var continuous = false;
        //var indices = [];
        var line = [];
        allLine = [];
        var edgeIndices = [];
        var sarch = function (x, y) {
            if (x < 0 || y < 0 || x >= w || y >= h) {
                return;
            }
            var i = x + y * w;
            if (check[i] || edge[i] === 0) {
                return;
            }
            check[i] = true;
            indices.push(i);
            line.push([x, y]);
            if (!continuous && edge[i] === 2) {
                continuous = true;
            }
            sarch(x, y - 1);
            sarch(x + 1, y);
            sarch(x, y + 1);
            sarch(x - 1, y);
            sarch(x - 1, y - 1);
            sarch(x + 1, y + 1);
            sarch(x - 1, y + 1);
            sarch(x + 1, y - 1);
        };
        for (var y = 0; y < h; y++) {
            for (var x = 0; x < w; x++) {
                continuous = false;
                var indices = [];
                line = [];
                sarch(x, y);
                if (continuous) {
                    allLine.push(line);                     //所有的连续分段线段点,arcording binary tree
                    for (var i = 0; i < indices.length; i++) {
                        edgeIndices.push(indices[i]);       //主要是点
                    }

                }
            }
        }
        for (var n = 0; n < allLine.length; n++) {
            var l = allLine[n].length;
            if (l === 1) {
                allSpliceLine.push(allLine[n]);
            } else {
                var oldOne = 0;
                for (var m = 1; m < l; m++) {
                    if ((Math.pow((allLine[n][m][0] - allLine[n][m - 1][0]), 2) + Math.pow((allLine[n][m][1] - allLine[n][m - 1][1]), 2) ) > 2) {
                        allSpliceLine.push(allLine[n].slice(oldOne, m));
                        oldOne = m;
                    }
                }
                allSpliceLine.push(allLine[n].slice(oldOne, l));
            }
        }
        allLine = null;
        var dst = [];
        for (var i = 0; i < w * h; i++) {
            dst[i] = 0;
        }
        for (i = 0; i < allSpliceLine.length; i++) {
            for (var j = 0; j < allSpliceLine[i].length; j++) {
                for (m = -triLength; m <= triLength; m++) {
                    for (n = -triLength; n < triLength; n++) {
                        var a = allSpliceLine[i][j][0] + n;       //x
                        var b = allSpliceLine[i][j][1] + m;       //y
                        if (a >= 0 && a <= w && b >= 0 && b <= h) {
                            dst[a + b * w] = 255
                        }
                    }
                }
            }
        }
        /*
        var dst2 = [];
        for (var i = 0; i < w * h; i++) {
            dst2[i] = 0;
        }
        for (var i = 0; i < edgeIndices.length; i++) {
            dst2[edgeIndices[i]] = 255;
        }
        */
        return dst;
    }
    function DouglasPeucker(points, tolerance, w, h) {
        function Line(p1, p2) {
            this.p1 = p1;
            this.p2 = p2;
        }
        Line.prototype.rise = function () {
            return this.p2[1] - this.p1[1];                 //y2-y1
        };
        Line.prototype.run = function () {                   //x2-x1
            return this.p2[0] - this.p1[0];
        };
        Line.prototype.slope = function () {                  //斜率
            return this.rise() / this.run();
        };
        Line.prototype.distance = function () {
            return Math.sqrt(Math.pow(this.rise(), 2) + Math.pow(this.run(), 2))
        };
        Line.prototype.yIntercept = function () {
            return this.p1[1] - (this.p1[0] * this.slope(this.p1, this.p2));        //偏移原点的 y坐标
        };
        Line.prototype.isVertical = function () {              //是否垂直
            return !isFinite(this.slope());
        };
        Line.prototype.isHorizontal = function () {              //是否平行
            return this.p1[1] === this.p2[1];
        };
        Line.prototype._perpendicularDistanceHorizontal = function (point) { //水平偏差
            return Math.abs(this.p1[1] - point[1]);
        };
        Line.prototype._perpendicularDistanceVertical = function (point) {  //垂直偏差
            return Math.abs(this.p1[0] - point[0]);
        };
        Line.prototype._perpendicularDistanceHasSlope = function (point) {  //点到直线的距离
            var slope = this.slope();
            var y_intercept = this.yIntercept();
            return Math.abs((slope * point[0]) - point[1] + y_intercept) / Math.sqrt((Math.pow(slope, 2)) + 1);
        };
        Line.prototype.perpendicularDistance = function (point) {
            if (this.isVertical()) {
                return this._perpendicularDistanceVertical(point);
            }
            else if (this.isHorizontal()) {
                return this._perpendicularDistanceHorizontal(point);
            }
            else {
                return this._perpendicularDistanceHasSlope(point);
            }
        };

        function half(points, distance) {
            var l = points.length;
            if (l === 1) {
                testLine.push(points);
                return null
            }
            if (l <= 4) {
                var summer = 0,minLength= (w+h)*(w+h)/5000;   //()
                for (var i = 1; i < l; i++) {               // 可以改进!!!!!!
                    var a = points[i][0] - points[i - 1][0], b = points[i][1] - points[i - 1][1];
                    summer += (a * a + b * b);
                }
                if (summer <= minLength ) {
                    for (var i = points.length; --i;) {
                        testLine.push(points[i]);
                    }
                    return null
                }
            }
            for (var i = 1; i < points.length; i++) {           //不能动!!!
                var disX=points[i][0] - points[i-1][0],disY=points[i][1] - points[i-1][1];
                var dis = Math.sqrt(disX*disX+disY*disY);
                var time = Math.floor(dis/distance);
                if (!time) {
                    continue
                }
                var aveX = disX / time, aveY = disY / time;
                for (var j = time - 1; j > 0; j--) {
                    points.splice(i, 0, [Math.round(j * aveX + points[i - 1][0]), Math.round(j * aveY + points[i - 1][1])]);
                }
                i += (time - 1)             //如果i,i-1的距离大于distance,
            }
            return points
        }
        function half2(points, distance) {
            var l = points.length;
            if (l === 1) {
                easyLine.push(points);
                return null
            }
            if (l <= 4) {
                var summer = 0,minLength= (w+h)*(w+h)/5000;   //()
                for (var i = 1; i < l; i++) {               // 可以改进!!!!!!
                    var a = points[i][0] - points[i - 1][0], b = points[i][1] - points[i - 1][1];
                    summer += (a * a + b * b);
                }
                if (summer <= minLength ) {
                    for (var i = points.length; --i;) {
                        easyLine.push([points[i]]);
                    }
                    return null
                }
            }
            for (var i = 1; i < points.length; i++) {           //不能动!!!
                var disX=points[i][0] - points[i-1][0],disY=points[i][1] - points[i-1][1];
                var dis = Math.sqrt(disX*disX+disY*disY);
                var time = Math.floor(dis/distance);
                if (!time) {
                    continue
                }
                var aveX = disX / time, aveY = disY / time;
                for (var j = time - 1; j > 0; j--) {
                    points.splice(i, 0, [Math.round(j * aveX + points[i - 1][0]), Math.round(j * aveY + points[i - 1][1])]);
                }
                i += (time - 1)             //如果i,i-1的距离大于distance,
            }
            return points
        }
        function simplifyGeometry(points, tolerance) {               //DouglasPeucker(allSpliceLine,5);
            var dmax = 0;
            var index = 0;
            //返回每个点到起终线的距离,找到最大值
            for (var i = 1; i <= points.length - 2; i++) {
                var d = new Line(points[0], points[points.length - 1]).perpendicularDistance(points[i]);
                if (d > dmax) {
                    index = i;
                    dmax = d;
                }
            }
            var results_one, results_two, results;//如果最大的距离大于阈值,则分开为两段,并分别简化
            if (dmax > tolerance) {
                results_one = simplifyGeometry(points.slice(0, index), tolerance);
                results_two = simplifyGeometry(points.slice(index, points.length), tolerance);
                results = results_one.concat(results_two);
            }
            else if (points.length > 1) {
                results = [points[0], points[points.length - 1]];
            }
            else {
                results = [points[0]];
            }
            return results
        }
        //简化线条-------------
        var arr = [], edgeIndices = [], dst = [], addPoints = [],triLength=~~((w+h)*0.005);
        for (var i = 0; i<points.length;i++) {                      //O M G!!!!!!!!!!!!!!!!!!!!!!!!!!!
            var newline = simplifyGeometry(points[i], tolerance);
            newline = half(newline, (h + w) * 0.02);
            if (!newline) {
                continue
            }
            easyLine.push(newline);                                    //简化后的线条
            for (var j = newline.length; --j;) {
                edgeIndices.push(newline[j][0] + newline[j][1] * w);
            }
        }
        for (var i = w * h; --i;) {
            dst[i] = 0;
        }

        for (i = easyLine.length; --i;) {        //保留线段腐蚀膨胀;判断其他点是否在附近
            var l = easyLine[i].length;
            if (l === 1) {
                addPoints.push(easyLine[i][0]);
                continue
            }
            for (var j = 1; j < l; j++) {
                var a1 = easyLine[i][j][0], b1 = easyLine[i][j][1], a2 = easyLine[i][j - 1][0],
                    b2 = easyLine[i][j - 1][1];
                dst[a1 + b1 * w]=255;dst[a2 + b2 * w]=255;
                var dx=a2-a1,dy=b2-b1,steps,k,abs=Math.abs,round=Math.round;
                var xIncrement,yIncrement,x=a1,y=b1;
                if(abs(dx)>abs(dy)){
                    steps=abs(dx);
                } else {
                    steps = abs(dy);
                }
                xIncrement=dx/steps;
                yIncrement=dy/steps;
                for(k=0;k<steps;k++){
                    x+=xIncrement;
                    y+=yIncrement;
                    addPoints.push([round(x),round(y)]);
                }
            }
        }

        for (i = addPoints.length; --i;) {        //保留线段腐蚀膨胀;判断其他点是否在附近
            for (var m = -4; m <= 4; m++) {
                for (var n = -4; n < 4; n++) {
                    var a = addPoints[i][0] + n;       //x
                    var b = addPoints[i][1] + m;       //y
                    if (a >= 0 && a <= w && b >= 0 && b <= h) {
                        dst[a + b * w] = 255
                    }
                }
            }
        }

        for (var i = testLine.length; --i;) {                   //约束点膨胀腐蚀处理
            if (dst[testLine[i][0] + testLine[i][1] * w] === 0) {
                easyLine.push([testLine[i]]);
                for (var m = -4; m <= 4; m++) {
                    for (var n = -4; n < 4; n++) {
                        var a = testLine[i][0] + n;       //x
                        var b = testLine[i][1] + m;       //y
                        if (a >= 0 && a <= w && b >= 0 && b <= h) {
                            dst[a + b * w] = 255
                        }
                    }
                }
            }
        }

        for (i = w * h; --i;) {
            arr[i] = 0;
        }
        for (i = edgeIndices.length; --i;) {
            arr[edgeIndices[i]] = 255;
        }
        return arr
    }
    function contrainLine(points,w,h){            //contrainLine(easyLine,w,h,pointNum)
        for(var i=0;i<points.length;i++){
            if(points[i].length<=1){
                context2.fillStyle = 'rgb(255,0,0)';
                context2.beginPath();
                context2.arc(points[i][0][0], points[i][0][1], 2, 0, Math.PI * 2, false);
                context2.fill();
            }else {
                for (var j = 1; j < points[i].length; j++) {
                    var p2 = points[i][j], p1 = points[i][j - 1];
                    context2.beginPath();
                    context2.strokeStyle = "black";
                    context2.lineWidth = 1;
                    context2.moveTo(p1[0], p1[1]);
                    context2.lineTo(p2[0], p2[1]);
                    context2.stroke();
                    context2.closePath();
                }
            }
        }
    }
    function newconstrianDelaunay(Apoints,w,h,imageData){                 //newconstrianDelaunay(easyLine,w,h);
        var border=[],line=[];
        for(var i=0;i<15;i++){line.push([~~(w/15*i),0])}
        for(i=0;i<15;i++){line.push([w,~~(h/15*i)])}
        for(i=15;i>0;i--){line.push([~~(w/15*i),h])}
        for(i=15;i>0;i--){line.push([0,~~(h/15*i)])}
        border.push(line);
        var holeBoundary=[];
        for(var i=0;i<Apoints.length;i++) {
            border.push(Apoints[i]);
        }
        var option = {triSize: 'auto'};
        var result = cdt(border,holeBoundary,option,c,w,h);
        c=null;
        var points = result.points;
        var conn = result.connectivity;

        // create canvas
        canvas2.width = w;
        canvas2.height = h;
        // draw triangles
        context2.putImageData(imageData,0,0);
        for(var i = 0; i < conn.length; ++i) {
            var one=points[conn[i][0]],two=points[conn[i][1]],thire=points[conn[i][2]], x1 = one[0],
                x2 = two[0], x3 = thire[0], y1 = one[1], y2 = two[1], y3 = thire[1],
                cx = ~~((x1 + x2 + x3) / 3),
                cy = ~~((y1 + y2 + y3) / 3);

            var a=1/3,b=2/3;
            var h1=colorData(a*x1+b*cx,a*y1+b*cy,w,imageData),h2=colorData(a*x2+b*cx,a*y2+b*cy,w,imageData),
                h3=colorData(a*x3+b*cx,a*y3+b*cy,w,imageData),h4=colorData(a*cx+b*x1,a*cy+b*y1,w,imageData),
                h5=colorData(a*cx+b*x2,a*cy+b*y2,w,imageData),h6=colorData(a*cx+b*x3,a*cy+b*y3,w,imageData),
                h7=colorData(cx,cy,w,imageData);
            var arr=[h1,h2,h3,h4,h5,h6,h7];
            arr.sort(function(ob1,ob2){
                return ob1[2]-ob2[2]
            });

            var h7=colorData(cx,cy,w,imageData);
            var newcolor2=toRgb(h7[0],h7[1],h7[2]);
            /*
            var color1=toRgb(arr[2][0],arr[2][1],arr[2][2]),color2=toRgb(arr[3][0],arr[3][1],arr[3][2]),
                color3=toRgb(arr[4][0],arr[4][1],arr[4][2]);
            var col1=~~((color1[0]+color2[0]+color3[0])/3),col2=~~((color1[1]+color2[1]+color3[1])/3),
                col3=~~((color1[2]+color2[2]+color3[2])/3);
            var newcolor2=[col1,col2,col3];
            */
            var color_r=newcolor2[0];
            var color_g=newcolor2[1];
            var color_b=newcolor2[2];
            context2.beginPath();
            context2.fillStyle="rgba(" + color_r + "," + color_g + "," + color_b + ",1)";
            //context2.strokeStyle="rgba(" + color_r + "," + color_g + "," + color_b + ",0.1)";
            context2.beginPath();
            context2.moveTo(one[0], one[1]);
            context2.lineTo(two[0], two[1]);
            context2.lineTo(thire[0], thire[1]);
            context2.fill();
        }
        return result
    }
    function webTri(w,h,result){                 //newconstrianDelaunay(easyLine,w,h);
        c=null;
        var points = result.points;
        var conn = result.connectivity;

        // create canvas
        canvas2.width = w;
        canvas2.height = h;
        // draw triangles
        for(var i = 0; i < conn.length; ++i) {
            var one=points[conn[i][0]],two=points[conn[i][1]],thire=points[conn[i][2]], x1 = one[0],
                x2 = two[0], x3 = thire[0], y1 = one[1], y2 = two[1], y3 = thire[1];
            context2.beginPath();
            context2.strokeStyle="rgb(0,0,0)";
            context2.beginPath();
            context2.moveTo(one[0], one[1]);
            context2.lineTo(two[0], two[1]);
            context2.lineTo(thire[0], thire[1]);
            context2.lineTo(one[0], one[1]);
            context2.stroke();
        }
    }

    function colorData(x,y,w,imageData){
        var index=(~~y * w + ~~x) * 4,data=imageData.data;
        var color_r_1 = data[index];
        var color_g_1 = data[index + 1];
        var color_b_1 = data[index + 2];
        return toHsl(color_r_1,color_g_1,color_b_1,1.2);
    }
    function toHsl(R,G,B,add) {
        var H, S, L;
        var var_R = ( R / 255 );
        var var_G = ( G / 255 );
        var var_B = ( B / 255 );
        var var_Min = Math.min(var_R, var_G, var_B);    //Min. value of RGB
        var var_Max = Math.max(var_R, var_G, var_B);    //Max. value of RGB
        var del_Max = var_Max - var_Min;             //Delta RGB value

        L = ( var_Max + var_Min ) / 2;

        if (del_Max === 0)                     //This is a gray, no chroma...
        {
            H = 0;
            S = 0
        }
        else                                    //Chromatic data...
        {
            if (L < 0.5) S = del_Max / ( var_Max + var_Min );
            else S = del_Max / ( 2 - var_Max - var_Min );

            var del_R = ( ( ( var_Max - var_R ) / 6 ) + ( del_Max / 2 ) ) / del_Max;
            var del_G = ( ( ( var_Max - var_G ) / 6 ) + ( del_Max / 2 ) ) / del_Max;
            var del_B = ( ( ( var_Max - var_B ) / 6 ) + ( del_Max / 2 ) ) / del_Max;

            if (var_R === var_Max) H = del_B - del_G;
            else if (var_G === var_Max) H = ( 1 / 3 ) + del_R - del_B;
            else if (var_B === var_Max) H = ( 2 / 3 ) + del_G - del_R;

            if (H < 0) H += 1;
            if (H > 1) H -= 1
        }
        S *= add;
        return [H,S,L]
    }
    function toRgb(H,S,L){
        var newR,newG,newB,round= Math.round;
        if ( S === 0 )
        {

            newR = L * 255;
            newG = L * 255;
            newB = L * 255
        }
        else
        {
            if ( L < 0.5 ) {
                var var_2 = L * ( 1 + S )
            } else {
                var_2 = ( L + S ) - ( S * L )
            }
            var var_1 = 2 * L - var_2;

            newR = round(255 * Hue_2_RGB( var_1, var_2, H + ( 1 / 3 ) ));
            newG = round(255 * Hue_2_RGB( var_1, var_2, H ));
            newB = round(255 * Hue_2_RGB( var_1, var_2, H - ( 1 / 3 ) ))
        }
        return [newR,newG,newB]
    }
    function Hue_2_RGB( v1, v2, vH ){             //Function Hue_2_RGB
        if ( vH < 0 ) vH += 1;
        if( vH > 1 ) vH -= 1;
        if ( ( 6 * vH ) < 1 ) return ( v1 + ( v2 - v1 ) * 6 * vH );
        if ( ( 2 * vH ) < 1 ) return ( v2 );
        if ( ( 3 * vH ) < 2 ) return ( v1 + ( v2 - v1 ) * ( ( 2 / 3 ) - vH ) * 6 );
        return ( v1 )
    }
};
