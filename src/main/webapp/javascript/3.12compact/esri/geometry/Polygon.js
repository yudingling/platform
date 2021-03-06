// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See http://js.arcgis.com/3.12/esri/copyright.txt for details.
//>>built
define("esri/geometry/Polygon", "dojo/_base/declare dojo/_base/array dojo/_base/lang dojo/has ../kernel ../lang ../SpatialReference ./Geometry ./Point ./Extent ./mathUtils".split(" "), function (z, l, m, A, n, B, C, D, p, w, x) {
    var r = {type: "polygon", rings: null}, k = z(D, {
        declaredClass: "esri.geometry.Polygon", constructor: function (a) {
            m.mixin(this, r);
            this.rings = [];
            this._ring = 0;
            a && (m.isArray(a) ? this.rings = m.isArray(a[0][0]) ? a : [a] : a.rings ? m.mixin(this, a) : this.spatialReference = a, this.spatialReference && (this.spatialReference =
                new C(this.spatialReference)));
            this.verifySR()
        }, _extent: null, addRing: function (a) {
            this._extent = this._centroid = null;
            this._ring = this.rings.length;
            this.rings[this._ring] = [];
            m.isArray(a[0]) ? l.forEach(a, this._addPointArr, this) : l.forEach(a, this._addPoint, this);
            return this
        }, _addPointArr: function (a) {
            this.rings[this._ring].push(a)
        }, _addPoint: function (a) {
            this.rings[this._ring].push([a.x, a.y])
        }, _insertPoints: function (a, b) {
            this._extent = this._centroid = null;
            this._ring = b;
            this.rings[this._ring] || (this.rings[this._ring] =
                []);
            l.forEach(a, this._addPoint, this)
        }, _validateInputs: function (a, b) {
            return null !== a && void 0 !== a && (0 > a || a >= this.rings.length) || null !== b && void 0 !== a && (0 > b || b >= this.rings[a].length) ? !1 : !0
        }, getPoint: function (a, b) {
            if (this._validateInputs(a, b))return new p(this.rings[a][b], this.spatialReference)
        }, setPoint: function (a, b, c) {
            if (this._validateInputs(a, b))return this._extent = this._centroid = null, this.rings[a][b] = [c.x, c.y], this
        }, insertPoint: function (a, b, c) {
            if (this._validateInputs(a) && B.isDefined(b) && 0 <= b && b <= this.rings[a].length)return this._extent =
                this._centroid = null, this.rings[a].splice(b, 0, [c.x, c.y]), this
        }, removeRing: function (a) {
            if (this._validateInputs(a, null)) {
                this._extent = this._centroid = null;
                a = this.rings.splice(a, 1)[0];
                var b, c = a.length, d = this.spatialReference;
                for (b = 0; b < c; b++)a[b] = new p(a[b], d);
                return a
            }
        }, removePoint: function (a, b) {
            if (this._validateInputs(a, b))return this._extent = this._centroid = null, new p(this.rings[a].splice(b, 1)[0], this.spatialReference)
        }, getExtent: function () {
            var a;
            if (this._extent)return a = new w(this._extent), a._partwise =
                this._partwise, a;
            a = this.rings;
            var b = a.length;
            if (b && a[0].length) {
                var c, d, e, g, h, f, q, y, k = g = a[0][0][0], m = h = a[0][0][1], l = Math.min, n = Math.max, p = this.spatialReference, r = [], s, t, u, v;
                for (f = 0; f < b; f++) {
                    c = a[f];
                    s = t = c[0] && c[0][0];
                    u = v = c[0] && c[0][1];
                    y = c.length;
                    for (q = 0; q < y; q++)d = c[q], e = d[0], d = d[1], k = l(k, e), m = l(m, d), g = n(g, e), h = n(h, d), s = l(s, e), u = l(u, d), t = n(t, e), v = n(v, d);
                    r.push(new w({xmin: s, ymin: u, xmax: t, ymax: v, spatialReference: p ? p.toJson() : null}))
                }
                this._extent = {
                    xmin: k, ymin: m, xmax: g, ymax: h, spatialReference: p ? p.toJson() :
                        null
                };
                this._partwise = 1 < r.length ? r : null;
                a = new w(this._extent);
                a._partwise = this._partwise;
                return a
            }
        }, contains: function (a) {
            var b = this.rings, c, d = !1, e, g, h, f, q, k, m = b.length;
            c = this.spatialReference;
            e = a.spatialReference;
            var l = a.x;
            a = a.y;
            c && (e && !c.equals(e) && c._canProject(e)) && (a = c.isWebMercator() ? p.lngLatToXY(l, a) : p.xyToLngLat(l, a, !0), l = a[0], a = a[1]);
            for (k = 0; k < m; k++) {
                c = b[k];
                h = c.length;
                for (q = f = 0; q < h; q++)if (f++, f === h && (f = 0), e = c[q], g = c[f], (e[1] < a && g[1] >= a || g[1] < a && e[1] >= a) && e[0] + (a - e[1]) / (g[1] - e[1]) * (g[0] - e[0]) <
                    l)d = !d
            }
            return d
        }, getCentroid: function () {
            if (null != this._centroid)return this._centroid;
            var a, b, c, d, e = [], g, h;
            l.forEach(this.rings, function (d) {
                a = b = c = 0;
                l.forEach(d, function (e, k) {
                    k < d.length - 1 && (g = d[k + 1], h = e[0] * g[1] - g[0] * e[1], a += (e[0] + g[0]) * h, b += (e[1] + g[1]) * h, c += h)
                });
                0 < c && (c *= -1);
                e.push([a, b, c / 2])
            });
            e.sort(function (a, c) {
                return a[2] - c[2]
            });
            d = 6 * e[0][2];
            return this._centroid = new p(e[0][0] / d, e[0][1] / d, this.spatialReference)
        }, isClockwise: function (a) {
            var b = 0, c, d = a.length, e = m.isArray(a[0]) ? function (a, c) {
                return a[0] *
                    c[1] - c[0] * a[1]
            } : function (a, c) {
                return a.x * c.y - c.x * a.y
            };
            for (c = 0; c < d; c++)b += e(a[c], a[(c + 1) % d]);
            return 0 >= b / 2
        }, isSelfIntersecting: function (a) {
            a = a || this;
            var b, c, d, e, g, h, f, k = a.rings.length, l;
            for (d = 0; d < k; d++) {
                for (b = 0; b < a.rings[d].length - 1; b++) {
                    g = [[a.rings[d][b][0], a.rings[d][b][1]], [a.rings[d][b + 1][0], a.rings[d][b + 1][1]]];
                    for (c = d + 1; c < k; c++)for (e = 0; e < a.rings[c].length - 1; e++)if (h = [[a.rings[c][e][0], a.rings[c][e][1]], [a.rings[c][e + 1][0], a.rings[c][e + 1][1]]], (f = x._getLineIntersection2(g, h)) && !(f[0] === g[0][0] &&
                        f[1] === g[0][1] || f[0] === h[0][0] && f[1] === h[0][1] || f[0] === g[1][0] && f[1] === g[1][1] || f[0] === h[1][0] && f[1] === h[1][1]))return !0
                }
                e = a.rings[d].length;
                if (!(4 >= e))for (b = 0; b < e - 3; b++) {
                    l = e - 1;
                    0 === b && (l = e - 2);
                    g = [[a.rings[d][b][0], a.rings[d][b][1]], [a.rings[d][b + 1][0], a.rings[d][b + 1][1]]];
                    for (c = b + 2; c < l; c++)if (h = [[a.rings[d][c][0], a.rings[d][c][1]], [a.rings[d][c + 1][0], a.rings[d][c + 1][1]]], (f = x._getLineIntersection2(g, h)) && !(f[0] === g[0][0] && f[1] === g[0][1] || f[0] === h[0][0] && f[1] === h[0][1] || f[0] === g[1][0] && f[1] === g[1][1] ||
                        f[0] === h[1][0] && f[1] === h[1][1]))return !0
                }
            }
            return !1
        }, toJson: function () {
            var a = {rings: m.clone(this.rings)}, b = this.spatialReference;
            b && (a.spatialReference = b.toJson());
            return a
        }
    });
    k.defaultProps = r;
    k.createEllipse = function (a) {
        var b = a.center.x, c = a.center.y, d = a.longAxis, e = a.shortAxis, g = a.numberOfPoints, h = a.map, f, l, m;
        a = [];
        var n = 2 * Math.PI / g;
        for (l = 0; l < g; l++)f = Math.cos(l * n), m = Math.sin(l * n), f = h.toMap({
            x: d * f + b,
            y: e * m + c
        }), a.push(f);
        a.push(a[0]);
        b = new k(h.spatialReference);
        b.addRing(a);
        return b
    };
    k.createCircle = function (a) {
        return k.createEllipse({
            center: a.center,
            longAxis: a.r, shortAxis: a.r, numberOfPoints: a.numberOfPoints, map: a.map
        })
    };
    k.fromExtent = function (a) {
        var b = a.normalize();
        a = a.spatialReference;
        return new k({
            rings: l.map(b, function (a) {
                return [[a.xmin, a.ymin], [a.xmin, a.ymax], [a.xmax, a.ymax], [a.xmax, a.ymin], [a.xmin, a.ymin]]
            }), spatialReference: a ? a.toJson() : null
        })
    };
    A("extend-esri") && (m.setObject("geometry.Polygon", k, n), n.geometry.defaultPolygon = r, n.geometry.createEllipse = k.createEllipse, n.geometry.createCircle = k.createCircle, n.geometry.isClockwise = k.prototype.isClockwise,
        n.geometry.polygonSelfIntersecting = k.prototype.isSelfIntersecting);
    return k
});