function cdt(c, e, d,arr,width,height) {     //cdt(border,holeBoundary,option)
    void 0 === d && (d = {
        triSize: 0,
        numSmoothing: 0
    });
    var a = cdt.generateInputData(c, e, d.triSize,arr,width,height),
        b = a.points,
        f = a.constraint;
    if (3 > b.length)
        return null;
    cdt.addSuperTriangleToPoints(b);
    for (var g = a = new cdt.DelaunayTriangle(b, [b.length - 3, b.length - 2, b.length - 1]), h = 0; h < b.length - 3; ++h)
        g = cdt.DelaunayTriangle.lawsonTriangleDetection(b, g, b[h]), g.addPoint(h, b, f);
    for (g = 0;;) {
        if (g > 2 * b.length) {
            console.log("max iteration at cdt()");
            break
        }
        var k = cdt.getCrossTriConstraint(b, a, f),
            h = k.crossEdge,
            m = k.crossTri,
            k = cdt.extractVerticesFromTri(m),
            k = cdt.getUpperAndLowerVtx(b, h, k),
            l = cdt.removeCrossTriAndExtractOuterEdge(m, a),
            a = l.head;
        if (null != h)
            m = cdt.addInnerVetices(b, h, k.upperVtx, l.adjTris, a), h = cdt.addInnerVetices(b, h, k.lowerVtx, l.adjTris, a), cdt.updateLocalAdjacentsLU(m, h);
        else
            break;
        ++g
    }
    a = cdt.removeSuperTriangle(a, b);
    a = cdt.removeOuterTriangles(a, b, c, e);
    cdt.smoothing(a, b, f, d.numSmoothing);
    c = [];
    for (e = a; null != e; e = e.next)
        c.push(e.vertexID);
    return {
        points: b,                  //所有点对应的坐标
        connectivity: c             //所有三角点(1,2,3)
    }
}
//拉普拉斯平滑处理 10次
cdt.smoothing = function(c, e, d, a) {
    if (!(0 >= a))
        for (a = void 0 == a ? 10 : a, c = cdt.dataForSmoothing(c, e, d), d = 0; d < a; ++d)
            cdt.laplacianSmoothing(e, c)
};
cdt.dataForSmoothing = function(c, e, d) {
    for (var a = Array(e.length), b = 0; b < a.length; ++b)
        a[b] = !1;
    for (b = 0; b < d.length; ++b)
        for (var f = 0; f < d[b].length; ++f)
            a[d[b][f]] = !0;
    d = Array(e.length);
    for (b = 0; b < e.length; ++b)
        d[b] = [];
    for (; null != c; c = c.next)
        d[c.vertexID[0]].push(c), d[c.vertexID[1]].push(c), d[c.vertexID[2]].push(c);
    return {
        isOnBoundary: a,            //判断是否在边界
        posToTri: d                 //作为处理点
    }
};
cdt.laplacianSmoothing = function(c, e) {
    for (var d = e.isOnBoundary, a = e.posToTri, b = cdt.clone(c), f = 0; f < c.length; ++f)
        if (!d[f]) {
            for (var g = [], h = 0; h < a[f].length; ++h)
                g.push(a[f][h].vertexID[0]), g.push(a[f][h].vertexID[1]), g.push(a[f][h].vertexID[2]);
            for (var g = g.filter(function(a, b, c) {
                return c.indexOf(a) === b
            }), g = g.filter(function(a) {
                return a !== f
            }), k = [0, 0], h = 0; h < g.length; ++h)
                k = cdt.add(k, c[g[h]]);
            b[f] = cdt.div(k, g.length)
        }
    for (f = 0; f < c.length; ++f)
        c[f] = cdt.clone(b[f])
};

//生成输入数据 cdt.generateInputData(border,holeBoundary,AUTO)
cdt.generateInputData = function(c, e, d,arr,width,height) {
    for (var a = 0, b = 0; b < c.length; ++b)
        a += c[b].length;        //得到总的 B 的约束点数
    for (b = 0; b < e.length; ++b)
        a += e[b].length;       //得到 H 约束点
    for (var a = Array(a), f = 0, b = 0; b < c.length; ++b)     //创建一个总分散的 B 约束点的数组
        for (var g = 0; g < c[b].length; ++g)
            a[f] = cdt.clone(c[b][g]), ++f;
    for (b = 0; b < e.length; ++b)                              //创建一个总分散的 H 约束点的数组
        for (g = 0; g < e[b].length; ++g)
            a[f] = cdt.clone(e[b][g]), ++f;
    for (var f = Array(c.length + e.length), h = 0, b = 0; b < c.length; ++b) {
        f[b] = Array(c[b].length);
        for (g = 0; g < f[b].length; ++g)
            f[b][g] = h, ++h;
        //f[b].push(f[b][0])
    }
    for (var k = c.length, b = 0; b < e.length; ++b) {
        f[b + k] = Array(e[b].length);
        for (g = 0; g < f[b + k].length; ++g)
            f[b + k][g] = h, ++h;
        f[b + k].push(f[b + k][0])
    }
    if (void 0 == d || 0 >= d)
        return {
            points: a,
            constraint: f
        };
    //求得所有约束点的平均距离
    if ("auto" == d) {
        for (b = h = d = 0; b < c.length; ++b)
            for (g = 0; g < c[b].length; ++g)
                //k 为所有约束线上点的 x y 的坐标差; d 为所有约束线的长度; h 为 B 约束点个数
                k = cdt.sub(c[b][(g + 1) % c[b].length], c[b][g]), d += cdt.norm2(k), ++h;
        for (b = 0; b < e.length; ++b)
            for (g = 0; g < e[b].length; ++g)
                k = cdt.sub(e[b][(g + 1) % e[b].length], e[b][g]), d += cdt.norm2(k), ++h;
        d = ~~(d / h * 3);   //得到所有约束点的平均距离
        //d=(width+height)*0.02;
    }
    //寻找最小最大的 X Y 坐标点
    for (var h = [], m = a[0][0], k = a[0][0], g = a[0][1], l = a[0][1], b = 0; b < a.length; ++b)
        m < a[b][0] && (m = a[b][0]), k > a[b][0] && (k = a[b][0]), g < a[b][1] && (g = a[b][1]),
        l > a[b][1] && (l = a[b][1]);
    //最大距离/约束点的平均距离;m 为横坐标插入的点数;p为纵坐标插入的点数
    for (var m = (m - k) / d, p = (g - l) / d, n, b = 0; b < m + 1; ++b) {
        for (g = 0; g < p + 1; ++g) {
            var x=k + d * b+1,y=l + d * g+1;
            n = [x, y];
            if (arr[x + y * width] === 0) {
                h.push(n);
            }
        }
    }
    arr=null;
    a = a.concat(h);
    return {
        points: a,
        constraint: f
    }
};
//删除交叉的三角并提取外边缘
cdt.removeCrossTriAndExtractOuterEdge = function(c, e) {
    for (var d = [], a = 0; a < c.length; ++a)
        for (var b = 0; 3 > b; ++b)
            d.push(c[a].adjacent[b]);
    for (b = 0; b < c.length; ++b)
        e = c[b].remove(e);
    b = [];
    for (a = 0; a < d.length; ++a)
        null != d[a] && (d[a].isRemoved || b.push(d[a]));
    return {
        adjTris: b,
        head: e
    }
};
//添加内部顶点
cdt.addInnerVetices = function(c, e, d, a, b) {
    var f = cdt.mul(.5, cdt.add(c[e[0]], c[e[1]]));
    d.sort(function(a, b) {
        var th1 = Math.atan2(c[a][1] - f[1], c[a][0] - f[0]);
        var th2 = Math.atan2(c[b][1] - f[1], c[b][0] - f[0]);
        return th1 - th2
    });
    e = cdt.innerTriangulation(c, d);
    null != e && (cdt.updateLocalAdjacents(e, a), a = cdt.getTail(b), a.next = e, e.prev = a);
    return e
};
//更新本地相邻的LU
cdt.updateLocalAdjacentsLU = function(c, e) {
    if (null == c || null == e)
        console.log("upperHead is null. upperHead:" + c + " lowerHead:" + e);
    else {
        for (var d = [], a = e; null != a; a = a.next)
            d.push(a);
        cdt.updateLocalAdjacents(c, d)
    }
};
//更新本地相邻的LU
cdt.updateLocalAdjacents = function(c, e) {
    for (var d = c; null != d; d = d.next)
        for (var a = 0; 3 > a; ++a)
            if (null == d.adjacent[a])
                for (var b = 0; b < e.length; ++b)
                    for (var f = 0; 3 > f; ++f)
                        d.vertexID[a] == e[b].vertexID[(f + 1) % 3] && d.vertexID[(a + 1) % 3] == e[b].vertexID[f] && (d.adjacent[a] = e[b], e[b].adjacent[f] = d, d.edgeIDinAdjacent[a] = f, e[b].edgeIDinAdjacent[f] = a)
};
cdt.getTail = function(c) {
    for (; null != c.next;)
        c = c.next;
    return c
};
//内三角
cdt.innerTriangulation = function(c, e) {
    if (3 == e.length)
        return new cdt.DelaunayTriangle(c, [e[0], e[1], e[2]]);
    for (var d = Array(e.length), a = 0; a < d.length; ++a)
        d[a] = cdt.clone(c[e[a]]);
    for (var b = Array(e.length), a = 0; a < e.length; ++a)
        b[a] = a;
    b = cdt.clone(b);
    b[0] != b[b.length - 1] && b.push(b[0]);
    cdt.addSuperTriangleToPoints(d);
    for (var a = d.length, f = new cdt.DelaunayTriangle(d, [a - 3, a - 2, a - 1]), g = f, a = 0; a < d.length - 3; ++a)
        g = cdt.DelaunayTriangle.lawsonTriangleDetection(d, g, d[a]), g.addPoint(a, d, b);
    f = cdt.removeSuperTriangle(f, d);
    for (d =
             f = cdt.removeOuterTrianglesForInnerTriangulation(f, b); null != d; d = d.next)
        for (a = 0; 3 > a; ++a)
            d.vertexID[a] = e[d.vertexID[a]];
    return f
};
//去除内三角形的外三角形
cdt.removeOuterTrianglesForInnerTriangulation = function(c, e) {
    for (var d = Array(3), a = Array(3), b = c; null != b; b = d) {
        for (var d = [null, null, null], f = 0; 3 > f; ++f)
            for (var g = 0; g < e.length - 1; ++g)
                if (b.vertexID[f] == e[g]) {
                    d[f] = e[g];
                    break
                }
        for (f = 0; 3 > f; ++f)
            a[f] = d[(f + 1) % 3] - d[f];
        d = b.next;
        0 < a[0] * a[1] * a[2] && (c = b.remove(c))
    }
    return c
};
//去除外三角形
cdt.removeOuterTriangles = function(c, e, d, a) {
    for (var b, f = c; null != f; f = b) {
        b = f.next;
        var g = cdt.add(e[f.vertexID[0]], e[f.vertexID[1]]),
            g = cdt.div(cdt.add(g, e[f.vertexID[2]]), 3);
        cdt.isPointInsideOfBoundaries(g, d, a) || (c = f.remove(c))
    }
    return c
};
//是否是边界内的点
cdt.isPointInsideOfBoundaries = function(c, e, d) {
    for (var a = 0; a < d.length; ++a)
        if (cdt.isPointInsideOfBoundary(c, d[a]))
            return !1;
    for (a = 0; a < e.length; ++a)
        if (cdt.isPointInsideOfBoundary(c, e[a]))
            return !0;
    return !1
};
//是否是边界内的点
cdt.isPointInsideOfBoundary = function(c, e) {
    if (0 == c.length)
        return flase;
    for (var d = 0, a, b = 0; b < e.length; b++) {
        a = new cdt.LineSeg(e[b], e[(b + 1) % e.length]);
        var f = a.start[1] - c[1],
            g = a.end[1] - c[1];
        1E-10 > Math.abs(f) && (f = 0);
        1E-10 > Math.abs(g) && (g = 0);
        0 < f * g || 1E-10 > Math.abs(a.start[1] - a.end[1]) || (f = a.crossXpos(c[1]), f < c[0] || 1E-10 > Math.abs(f - a.end[0]) && 1E-10 > Math.abs(c[1] - a.end[1]) || 1E-10 > Math.abs(f - a.start[0]) && 1E-10 > Math.abs(c[1] - a.start[1]) && 0 <= (a.end[1] - a.start[1]) * ((0 == b ? e[e.length - 1][1] : e[b - 1][1]) - a.start[1]) ||
        ++d)
    }
    return 1 == d % 2
};
//得到上限和下限顶点
cdt.getUpperAndLowerVtx = function(c, e, d) {
    var a = [],
        b = [];
    if (null != e) {
        for (var f = cdt.sub(c[e[0]], c[e[1]]), g, h = 0; h < d.length; ++h)
            g = cdt.sub(c[d[h]], c[e[1]]), 0 < f[0] * g[1] - f[1] * g[0] ? a.push(d[h]) : 0 > f[0] * g[1] - f[1] * g[0] && b.push(d[h]);
        a.push(e[0]);
        a.push(e[1]);
        b.push(e[0]);
        b.push(e[1])
    }
    return {
        upperVtx: a,
        lowerVtx: b
    }
};
//得到交叉的约束
cdt.getCrossTriConstraint = function(c, e, d) {
    e = cdt.makePointToTri(c, e);
    for (var a = null, b = [], f = !1, g = 0; g < d.length; ++g) {
        for (var h = 0; h < d[g].length - 1; ++h)
            if (b = cdt.isEdgeCross(c, e, d[g], h), 0 < b.length) {
                a = [d[g][h + 1], d[g][h]];
                f = !0;
                break
            }
        if (f)
            break
    }
    return {
        crossTri: b,
        crossEdge: a
    }
};
//从三角中提取顶点
cdt.extractVerticesFromTri = function(c) {
    for (var e = [], d = 0; d < c.length; ++d)
        for (var a = 0; 3 > a; ++a)
            e.push(c[d].vertexID[a]);
    e = e.filter(function(a, c, d) {
        return d.indexOf(a) === c
    });
    e.sort(function(a, c) {
        return a < c ? -1 : a > c ? 1 : 0
    });
    return e
};
//删除超级三角
cdt.removeSuperTriangle = function(c, e) {
    for (var d, a = c; null != a;) {
        d = !1;
        for (var b = 0; 3 > b; ++b)
            for (var f = 0; 3 > f; ++f)
                if (a.vertexID[b] == e.length - 1 - f) {
                    d = !0;
                    break
                }
        d ? a === c ? a = c = a.remove(c) : (d = a.next, a.remove(c), a = d) : a = a.next
    }
    e.splice(e.length - 3, 3);
    return c
};
//是否和跨过其他边缘
cdt.isEdgeCross = function(c, e, d, a) {
    for (var b = [c[d[a]], c[d[a + 1]]], f, g = null, h = 0; h < e[d[a]].length && (f = e[d[a]][h], g = cdt.isTriAndEdgeCross(c, f, b), null == g); ++h)
        ;
    if (null == g)
        return [];
    for (e = [f];;) {
        h = f.edgeIDinAdjacent[g];
        f = f.adjacent[g];
        if (null == f) {
            console.log("ERROR at isEdgeCross");
            break
        }
        e.push(f);
        if (f.vertexID[(h + 2) % 3] == d[a + 1])
            break;
        g = cdt.isTriAndEdgeCross(c, f, b, h)
    }
    return e
};
//是三角形并且跨边缘了
cdt.isTriAndEdgeCross = function(c, e, d, a) {
    for (var b = [[0, 0], [0, 0], [0, 0]], f = 0; 3 > f; ++f)
        b[f] = c[e.vertexID[f]];
    for (f = 0; 3 > f; ++f)
        if (cdt.isIntersect(d, [b[f], b[(f + 1) % 3]]) && f != a)
            return f;
    return null
};
//让点成为三角形
cdt.makePointToTri = function(c, e) {
    for (var d = Array(c.length), a = 0; a < d.length; ++a)
        d[a] = [];
    for (a = e; null != a; a = a.next)
        d[a.vertexID[0]].push(a), d[a.vertexID[1]].push(a), d[a.vertexID[2]].push(a);
    return d
};
//是相交的
cdt.isIntersect = function(c, e) {
    var d = cdt.sub(e[0], c[0]),
        a = cdt.sub(c[1], c[0]),
        b = cdt.sub(e[1], e[0]),
        f = a[0] * b[1] - a[1] * b[0];
    if (0 == f)
        return !1;
    b = (d[0] * b[1] - d[1] * b[0]) / f;
    d = (d[0] * a[1] - d[1] * a[0]) / f;
    return 0 >= b - 1E-5 || 1 <= b + 1E-5 || 0 >= d - 1E-5 || 1 <= d + 1E-5 ? !1 : !0
};
//加入超级三角
cdt.addSuperTriangleToPoints = function(c) {
    if (0 == c.length)
        return [[0, 0], [0, 0], [0, 0]];
    for (var e = c[0][1], d = c[0][1], a = c[0][0], b = c[0][0], f = 1; f < c.length; ++f)
        b > c[f][0] && (b = c[f][0]), a < c[f][0] && (a = c[f][0]), e > c[f][1] && (e = c[f][1]), d < c[f][1] && (d = c[f][1]);
    var f = .5 * (a - b) + b,
        g = .5 * (d - e) + e,
        e = 4 * (a - b > d - e ? a - b : d - e),
        d = Array(3);
    d[0] = [f - .5 * e, g - 1.732 / 6 * e];
    d[1] = [f + .5 * e, g - 1.732 / 6 * e];
    d[2] = [f, g + 1.732 / 3 * e];
    c.push(d[0]);
    c.push(d[1]);
    c.push(d[2])
};
//g = a = new cdt.DelaunayTriangle(b, [b.length - 3, b.length - 2, b.length - 1])
cdt.DelaunayTriangle = function(c, e) {
    this.adjacent=null;
    this.edgeIDinAdjacent=null;
    this.vertexID=null;
    this.prev=null;
    this.next=null;
    this.init(c, e);
    this.isRemoved=null
};
cdt.DelaunayTriangle.prototype.init = function(c, e) {
    this.adjacent = [null, null, null];
    this.edgeIDinAdjacent = [-1, -1, -1];
    this.vertexID = cdt.clone(e);
    this.next = this.prev = null;
    var d = cdt.sub(c[this.vertexID[1]], c[this.vertexID[0]]),
        a = cdt.sub(c[this.vertexID[2]], c[this.vertexID[0]]);
    0 > d[0] * a[1] - d[1] * a[0] && (d = this.vertexID[1], this.vertexID[1] = this.vertexID[2], this.vertexID[2] = d);
    this.isRemoved = !1
};
//克隆属性
cdt.DelaunayTriangle.prototype.cloneProperties = function() {
    return {
        adjacent: this.adjacent,
        edgeIDinAdjacent: cdt.clone(this.edgeIDinAdjacent),
        vertexID: cdt.clone(this.vertexID),
        prev: this.prev,
        next: this.next
    }
};
cdt.DelaunayTriangle.prototype.remove = function(c) {
    if (this.isRemoved)
        return null;
    for (var e = 0; 3 > e; ++e)
        null != this.adjacent[e] && (this.adjacent[e].adjacent[this.edgeIDinAdjacent[e]] = null);
    this.edgeIDinAdjacent = [];
    this.adjacent = null;
    null != this.next && (this.next.prev = this.prev);
    null != this.prev && (this.prev.next = this.next);
    this.prev = null;
    this === c && (c = this.next);
    this.next = null;
    this.isRemoved = !0;
    return c
};
cdt.DelaunayTriangle.prototype.addPoint = function(c, e, d) {
    for (var a = this.cloneProperties(), b, f = Array(3), g = 0; 3 > g; ++g)
        b = [c, a.vertexID[g], a.vertexID[(g + 1) % 3]], 0 == g ? (f[g] = this, f[g].init(e, b)) : f[g] = new cdt.DelaunayTriangle(e, b);
    null != a.prev && (a.prev.next = f[0]);
    f[0].next = f[1];
    f[1].next = f[2];
    f[2].next = a.next;
    null != a.next && (a.next.prev = f[2]);
    f[2].prev = f[1];
    f[1].prev = f[0];
    f[0].prev = a.prev;
    for (g = 0; 3 > g; ++g)
        f[g].adjacent[0] = f[(g + 2) % 3], f[g].adjacent[1] = a.adjacent[g], f[g].adjacent[2] = f[(g + 1) % 3], null != a.adjacent[g] &&
        (a.adjacent[g].adjacent[a.edgeIDinAdjacent[g]] = f[g]), f[g].edgeIDinAdjacent[0] = 2, f[g].edgeIDinAdjacent[1] = a.edgeIDinAdjacent[g], f[g].edgeIDinAdjacent[2] = 0, null != a.adjacent[g] && (a.adjacent[g].edgeIDinAdjacent[a.edgeIDinAdjacent[g]] = 1);
    a = [];
    a.push(f[0]);
    a.push(f[1]);
    for (a.push(f[2]); 0 != a.length;)
        cdt.DelaunayTriangle.swapping(a, c, e, d)
};
//交换
cdt.DelaunayTriangle.swapping = function(c, e, d, a) {
    for (var b = c.pop(), f, g, h, k, m, l = 0; 3 > l; ++l)
        if (b.vertexID[l] == e) {
            f = l;
            g = (f + 1) % 3;
            break
        }
    h = b.adjacent[g];
    if (null != h) {
        k = b.edgeIDinAdjacent[g];
        m = (k + 2) % 3;
        if (void 0 == a || null == a)
            a = [];
        var p,
            n,
            r,
            t;
        p = b.vertexID[g];
        n = b.vertexID[(g + 1) % 3];
        for (l = 0; l < a.length; ++l)
            for (var q = 0; q < a[l].length - 1; ++q)
                if (r = a[l][q], t = a[l][q + 1], p == r && n == t || p == t && n == r)
                    return;
        a = new cdt.DelaunayTriangle.Circumcircle(d[h.vertexID[0]], d[h.vertexID[1]], d[h.vertexID[2]]);
        cdt.norm2(cdt.sub(a.p, d[e])) < a.rad &&
        (b.vertexID[(f + 2) % 3] = h.vertexID[m], h.vertexID[(m + 2) % 3] = b.vertexID[f], b.adjacent[g] = h.adjacent[(k + 1) % 3], h.adjacent[k] = b.adjacent[(g + 1) % 3], b.adjacent[(g + 1) % 3] = h, h.adjacent[(k + 1) % 3] = b, null != b.adjacent[g] && (b.adjacent[g].adjacent[h.edgeIDinAdjacent[(k + 1) % 3]] = b), null != h.adjacent[k] && (h.adjacent[k].adjacent[b.edgeIDinAdjacent[(g + 1) % 3]] = h), b.edgeIDinAdjacent[g] = h.edgeIDinAdjacent[(k + 1) % 3], h.edgeIDinAdjacent[k] = b.edgeIDinAdjacent[(g + 1) % 3], b.edgeIDinAdjacent[(g + 1) % 3] = (k + 1) % 3, h.edgeIDinAdjacent[(k + 1) % 3] = (g +
            1) % 3, null != b.adjacent[g] && (b.adjacent[g].edgeIDinAdjacent[b.edgeIDinAdjacent[g]] = g), null != h.adjacent[k] && (h.adjacent[k].edgeIDinAdjacent[h.edgeIDinAdjacent[k]] = k), c.push(b), c.push(h))
    }
};
cdt.DelaunayTriangle.lawsonTriangleDetection = function(c, e, d) {
    for (var a = 0, b, f, g = !1;;) {
        for (var g = !0, h = 0; 3 > h; ++h) {
            f = cdt.sub(d, c[e.vertexID[a]]);
            b = cdt.sub(c[e.vertexID[(a + 1) % 3]], c[e.vertexID[a]]);
            if (0 < f[0] * b[1] - f[1] * b[0]) {
                b = e.edgeIDinAdjacent[a];
                e = e.adjacent[a];
                a = (b + 1) % 3;
                g = !1;
                null == e && alert("Triangle search failed.");
                break
            }
            a = (a + 1) % 3
        }
        if (g)
            return e
    }
};
cdt.DelaunayTriangle.Circumcircle = function(c, e, d) {
    var a = cdt.norm2(cdt.sub(e, d)),
        b = cdt.norm2(cdt.sub(d, c)),
        f = cdt.norm2(cdt.sub(c, e)),
        g = .5 * (a + b + f);
    this.S = Math.sqrt(g * (g - a) * (g - b) * (g - f));
    this.rad = a * b * f / (4 * this.S);
    c = cdt.mul(a * a * (b * b + f * f - a * a), c);
    e = cdt.mul(b * b * (f * f + a * a - b * b), e);
    d = cdt.mul(f * f * (a * a + b * b - f * f), d);
    this.p = cdt.div(cdt.add(cdt.add(c, e), d), 16 * this.S * this.S)
};
//克隆数组的值 cdt.clone(B[i][j])
cdt.clone = function(c) {
    if (0 == c.length)
        return [];
    var e = Array(c.length);
    if ("number" == typeof c[0]) {
        /*
        for (var d = 0; d < c.length; ++d)
            e[d] = c[d];
            */
        e=c.concat();
        return e
    }
    if (typeof ("number" == c[0][0])) {
        /*
        for (d = 0; d < c.length; ++d) {
            e[d] = Array(c[d].length);
            for (var a = 0; a < c[d].length; ++a)
                e[d][a] = c[d][a]
        }
        */
        e=c.concat();
        return e
    }
    if (typeof ("number" == c[0][0][0]))
        for (alert("\u3053\u306e\u51e6\u7406\u306f\u672a\u691c\u8a3c at cdt.clone"), d = 0; d < c.length; ++d)
            for (e[d] = Array(c[d].length), a = 0; a < c[d].length; ++a) {
                e[d][a] = Array(c[d][a].length);
                for (var b = 0; b < c[d][a].length; ++b)
                    e[d][a][b] =
                        c[d][a][b]
            }
};
cdt.norm2 = function(c) {
    for (var e = 0, d = 0; d < c.length; ++d)
        e += c[d] * c[d];
    return Math.sqrt(e)
};
//两个坐标相减
cdt.sub = function(c, e) {
    if (c.length != e.length)
        return console.log("length of input arrays are not equal. in cdt.sub"), null;
    for (var d = c.length, a = Array(d), b = 0; b < d; ++b)
        a[b] = c[b] - e[b];
    return a
};
cdt.add = function(c, e) {
    if (c.length != e.length)
        return console.log("ERROR: length of input arrays are not equal. in cdt.sub"), null;
    for (var d = c.length, a = Array(d), b = 0; b < d; ++b)
        a[b] = c[b] + e[b];
    return a
};
cdt.mul = function(c, e) {
    var d,
        a;
    if ("number" == typeof c)
        d = c, a = e;
    else if ("number" == typeof e)
        d = e, a = c;
    else
        return console.log("ERROR: input argument do not include scalar value"), null;
    for (var b = a.length, f = Array(b), g = 0; g < b; ++g)
        f[g] = d * a[g];
    return f
};
cdt.div = function(c, e) {
    var d,
        a;
    if ("number" == typeof c)
        d = c, a = e;
    else if ("number" == typeof e)
        d = e, a = c;
    else
        return console.log("ERROR: input arguments do not include scalar value"), null;
    var b = a.length,
        f = Array(b);
    d = 1 / d;
    for (var g = 0; g < b; ++g)
        f[g] = a[g] * d;
    return f
};
cdt.LineSeg = function(c, e) {
    this.start = cdt.clone(c);
    this.end = cdt.clone(e);
    this.a = this.end[1] - this.start[1];
    this.b = this.start[0] - this.end[0];
    this.c = (this.end[0] - this.start[0]) * this.start[1] - (this.end[1] - this.start[1]) * this.start[0];
    this.vec = cdt.sub(this.end, this.start);
    this.len = cdt.norm2(this.vec)
};
cdt.LineSeg.prototype.intersect = function(c) {
    var e = !1,
        d = ((c.start[0] - c.end[0]) * (this.start[1] - c.start[1]) + (c.start[1] - c.end[1]) * (c.start[0] - this.start[0])) * ((c.start[0] - c.end[0]) * (this.end[1] - c.start[1]) + (c.start[1] - c.end[1]) * (c.start[0] - this.end[0]));
    0 >= ((this.start[0] - this.end[0]) * (c.start[1] - this.start[1]) + (this.start[1] - this.end[1]) * (this.start[0] - c.start[0])) * ((this.start[0] - this.end[0]) * (c.end[1] - this.start[1]) + (this.start[1] - this.end[1]) * (this.start[0] - c.end[0])) && 0 >= d && (this.start[1] - this.end[1]) /
    (this.start[0] - this.end[0]) != (c.start[1] - c.end[1]) / (c.start[0] - c.end[0]) && (e = !0);
    return e
};
cdt.LineSeg.prototype.crossPos = function(c) {
    var e = Array(2);
    e[0] = (this.b * c.c - c.b * this.c) / (this.a * c.b - c.a * this.b);
    e[1] = (c.a * this.c - this.a * c.c) / (this.a * c.b - c.a * this.b);
    return e
};
cdt.LineSeg.prototype.crossXpos = function(c) {
    return (-this.b * c - this.c) / this.a
};
cdt.LineSeg.prototype.crossYpos = function(c) {
    return (-this.a * c - this.c) / this.b
};

