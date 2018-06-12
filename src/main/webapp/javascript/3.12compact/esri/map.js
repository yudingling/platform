// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See http://js.arcgis.com/3.12/esri/copyright.txt for details.
//>>built
define("esri/map", "require dojo/_base/kernel dojo/_base/declare dojo/_base/connect dojo/_base/lang dojo/_base/array dojo/_base/event dojo/on dojo/aspect dojo/dom dojo/dom-class dojo/dom-construct dojo/dom-geometry dojo/dom-style dijit/registry ./kernel ./config ./sniff ./lang ./_coremap ./MapNavigationManager".split(" "), function (u, r, H, y, k, n, z, A, I, B, f, C, J, K, L, s, M, e, q, N, O) {
    var v = {up: "panUp", right: "panRight", down: "panDown", left: "panLeft"}, D = {
        upperRight: "panUpperRight", lowerRight: "panLowerRight", lowerLeft: "panLowerLeft",
        upperLeft: "panUpperLeft"
    }, g = y.connect, E = y.disconnect, l = C.create, m = K.set, w = k.hitch, t = J.getMarginBox, F = r.deprecated, x = k.mixin, G = 0;
    r = H(N, {
        declaredClass: "esri.Map", constructor: function (a, c) {
            x(this, {
                _slider: null,
                _navDiv: null,
                _mapParams: x({
                    attributionWidth: 0.45,
                    slider: !0,
                    nav: !1,
                    logo: !0,
                    sliderStyle: "small",
                    sliderPosition: "top-left",
                    sliderOrientation: "vertical",
                    autoResize: !0
                }, c || {})
            });
            x(this, {
                isDoubleClickZoom: !1,
                isShiftDoubleClickZoom: !1,
                isClickRecenter: !1,
                isScrollWheelZoom: !1,
                isPan: !1,
                isRubberBandZoom: !1,
                isKeyboardNavigation: !1,
                isPanArrows: !1,
                isZoomSlider: !1
            });
            k.isFunction(s._css) && (s._css = s._css(this._mapParams.force3DTransforms), this.force3DTransforms = this._mapParams.force3DTransforms);
            var b = e("esri-transforms") && e("esri-transitions");
            this.navigationMode = this._mapParams.navigationMode || b && "css-transforms" || "classic";
            "css-transforms" === this.navigationMode && !b && (this.navigationMode = "classic");
            this.fadeOnZoom = q.isDefined(this._mapParams.fadeOnZoom) ? this._mapParams.fadeOnZoom : "css-transforms" === this.navigationMode;
            "css-transforms" !== this.navigationMode && (this.fadeOnZoom = !1);
            this.setMapCursor("default");
            this.smartNavigation = c && c.smartNavigation;
            if (!q.isDefined(this.smartNavigation) && e("mac") && !e("esri-touch") && !e("esri-pointer") && !(3.5 >= e("ff"))) {
                var d = navigator.userAgent.match(/Mac\s+OS\s+X\s+([\d]+)(\.|\_)([\d]+)\D/i);
                d && (q.isDefined(d[1]) && q.isDefined(d[3])) && (b = parseInt(d[1], 10), d = parseInt(d[3], 10), this.smartNavigation = 10 < b || 10 === b && 6 <= d)
            }
            this.showAttribution = q.isDefined(this._mapParams.showAttribution) ?
                this._mapParams.showAttribution : !1;
            this._onLoadHandler_connect = g(this, "onLoad", this, "_onLoadInitNavsHandler");
            var h = l("div", {"class": "esriControlsBR" + (this._mapParams.nav ? " withPanArrows" : "")}, this.root);
            if (this.showAttribution)if (b = k.getObject("esri.dijit.Attribution", !1))this._initAttribution(b, h); else {
                var f = G++, p = this;
                this._rids && this._rids.push(f);
                u(["./dijit/Attribution"], function (a) {
                    var b = p._rids ? n.indexOf(p._rids, f) : -1;
                    -1 !== b && (p._rids.splice(b, 1), p._initAttribution(a, h))
                })
            }
            this._mapParams.logo &&
            (b = {}, 6 === e("ie") && (b.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(enabled\x3d'true', sizingMethod\x3d'crop', src\x3d'" + u.toUrl("./images/map/logo-med.png") + "')"), this._ogol = l("div", {style: b}, h), this._setLogoSize(), this._onMapResizeLogo_connect = g(this, "onResize", this, "_setLogoSize"), e("esri-touch") || (this._ogol_connect = g(this._ogol, "onclick", this, "_openLogoLink")));
            this.navigationManager = new O(this);
            c && c.basemap && (this._onLoadFix = !0, this.setBasemap(c.basemap), this._onLoadFix = !1);
            if (this.autoResize =
                    this._mapParams.autoResize)b = this._getEnclosingResizableWidget(this.container) || window, d = w(this, this.resize), this._rszSignal = A.pausable(b, "resize", d), this._oriSignal = A.pausable(window, "orientationchange", d), I.after(b, "resize", d, !0)
        }, _getEnclosingResizableWidget: function (a) {
            var c = L.getEnclosingWidget(a);
            return !c ? c : c.resize ? c : this._getEnclosingResizableWidget(a.parentNode)
        }, _setLogoSize: function () {
            this._ogol && (25E4 > this.root.clientWidth * this.root.clientHeight ? (f.remove(this._ogol, "logo-med"), f.add(this._ogol,
                "logo-sm")) : (f.remove(this._ogol, "logo-sm"), f.add(this._ogol, "logo-med")))
        }, _initAttribution: function (a, c) {
            var b = l("span", {"class": "esriAttribution"}, c, "first");
            m(b, "maxWidth", Math.floor(this.width * this._mapParams.attributionWidth) + "px");
            this._connects.push(g(b, "onclick", function () {
                f.contains(this, "esriAttributionOpen") ? f.remove(this, "esriAttributionOpen") : this.scrollWidth > this.clientWidth && f.add(this, "esriAttributionOpen")
            }));
            this.attribution = new a({map: this}, b)
        }, _cleanUp: function () {
            this.disableMapNavigation();
            this.navigationManager.destroy();
            var a = this._slider;
            a && (a.destroy && !a._destroyed) && a.destroy();
            var a = this._navDiv, c = this.attribution;
            a && C.destroy(a);
            c && c.destroy();
            this._connects.push(this._slider_connect, this._ogol_connect, this._rszSignal, this._oriSignal);
            n.forEach(this._connects, E);
            this.attribution = this.navigationManager = this._rids = this._connects = this._slider_connect = this._ogol_connect = this._rszSignal = this._oriSignal = null;
            this.inherited("_cleanUp", arguments)
        }, _isPanningOrZooming: function () {
            return this.__panning ||
                this.__zooming
        }, _canZoom: function (a) {
            var c = this.getLevel();
            return !this.__tileInfo || !(c === this.getMinZoom() && 0 > a || c === this.getMaxZoom() && 0 < a)
        }, _onLoadInitNavsHandler: function () {
            this.enableMapNavigation();
            this._createNav();
            if ("small" === this._mapParams.sliderStyle || !this._createSlider)this._createSimpleSlider(); else if (this._mapParams.slider) {
                var a = -1 !== this._getSliderClass(!0).indexOf("Horizontal"), a = [a ? "dijit.form.HorizontalSlider" : "dijit.form.VerticalSlider", a ? "dijit.form.HorizontalRule" : "dijit.form.VerticalRule",
                    a ? "dijit.form.HorizontalRuleLabels" : "dijit.form.VerticalRuleLabels"];
                if (n.some(a, function (a) {
                        return !k.getObject(a, !1)
                    })) {
                    var a = n.map(a, function (a) {
                        return a.replace(/\./g, "/")
                    }), c = G++, b = this;
                    this._rids && this._rids.push(c);
                    u(a, function () {
                        var a = b._rids ? n.indexOf(b._rids, c) : -1;
                        -1 !== a && (b._rids.splice(a, 1), b._createSlider.apply(b, arguments))
                    })
                } else a = n.map(a, function (a) {
                    return k.getObject(a, !1)
                }), this._createSlider.apply(this, a)
            }
            E(this._onLoadHandler_connect)
        }, _createNav: function () {
            if (this._mapParams.nav) {
                var a,
                    c, b, d = f.add, h = this.id;
                this._navDiv = l("div", {id: h + "_navdiv"}, this.root);
                d(this._navDiv, "navDiv");
                var e = this.width / 2, p = this.height / 2, k;
                for (b in v)c = v[b], a = l("div", {id: h + "_pan_" + b}, this._navDiv), d(a, "fixedPan " + c), "up" === b || "down" === b ? (k = parseInt(t(a).w, 10) / 2, m(a, {
                    left: e - k + "px",
                    zIndex: 30
                })) : (k = parseInt(t(a).h, 10) / 2, m(a, {
                    top: p - k + "px",
                    zIndex: 30
                })), this._connects.push(g(a, "onclick", w(this, this[c])));
                this._onMapResizeNavHandler_connect = g(this, "onResize", this, "_onMapResizeNavHandler");
                for (b in D)c = D[b], a =
                    l("div", {
                        id: h + "_pan_" + b,
                        style: {zIndex: 30}
                    }, this._navDiv), d(a, "fixedPan " + c), this._connects.push(g(a, "onclick", w(this, this[c])));
                this.isPanArrows = !0
            }
        }, _onMapResizeNavHandler: function (a, c, b) {
            a = this.id;
            c /= 2;
            b /= 2;
            var d = B.byId, h, f, e;
            for (h in v)f = d(a + "_pan_" + h), "up" === h || "down" === h ? (e = parseInt(t(f).w, 10) / 2, m(f, "left", c - e + "px")) : (e = parseInt(t(f).h, 10) / 2, m(f, "top", b - e + "px"))
        }, _createSimpleSlider: function () {
            if (this._mapParams.slider) {
                var a = this._slider = l("div", {
                    id: this.id + "_zoom_slider", "class": this._getSliderClass(),
                    style: {zIndex: 30}
                }), c = e("esri-touch") && !e("ff") ? "touchstart" : e("esri-pointer") ? navigator.msPointerEnabled ? "MSPointerDown" : "pointerdown" : "onclick", b = l("div", {"class": "esriSimpleSliderIncrementButton"}, a), d = l("div", {"class": "esriSimpleSliderDecrementButton"}, a);
                this._incButton = b;
                this._decButton = d;
                this._simpleSliderZoomHandler(null, null, null, this.getLevel());
                b.innerHTML = "\x3cspan\x3e+\x3c/span\x3e";
                d.innerHTML = "\x3cspan\x3e\x26ndash;\x3c/span\x3e";
                8 > e("ie") && f.add(d, "dj_ie67Fix");
                this._connects.push(g(b,
                    c, this, this._simpleSliderChangeHandler));
                this._connects.push(g(d, c, this, this._simpleSliderChangeHandler));
                "touchstart" == c && (this._connects.push(g(b, "onclick", this, this._simpleSliderChangeHandler)), this._connects.push(g(d, "onclick", this, this._simpleSliderChangeHandler)));
                (-1 < this.getMaxZoom() || -1 < this.getMinZoom()) && this._connects.push(g(this, "onZoomEnd", this, this._simpleSliderZoomHandler));
                10 > e("ie") && B.setSelectable(a, !1);
                this.root.appendChild(a);
                this.isZoomSlider = !0
            }
        }, _simpleSliderChangeHandler: function (a) {
            z.stop(a);
            a = -1 !== a.currentTarget.className.indexOf("IncrementButton") ? !0 : !1;
            this._extentUtil({numLevels: a ? 1 : -1})
        }, _simpleSliderZoomHandler: function (a, c, b, d) {
            var e;
            a = this._incButton;
            c = this._decButton;
            -1 < d && d === this.getMaxZoom() ? e = a : -1 < d && d === this.getMinZoom() && (e = c);
            e ? (f.add(e, "esriSimpleSliderDisabledButton"), f.remove(e === a ? c : a, "esriSimpleSliderDisabledButton")) : (f.remove(a, "esriSimpleSliderDisabledButton"), f.remove(c, "esriSimpleSliderDisabledButton"))
        }, _getSliderClass: function (a) {
            a = a ? "Large" : "Simple";
            var c =
                this._mapParams.sliderOrientation, b = this._mapParams.sliderPosition || "", c = c && "horizontal" === c.toLowerCase() ? "esri" + a + "SliderHorizontal" : "esri" + a + "SliderVertical";
            if (b)switch (b.toLowerCase()) {
                case "top-left":
                    b = "esri" + a + "SliderTL";
                    break;
                case "top-right":
                    b = "esri" + a + "SliderTR";
                    break;
                case "bottom-left":
                    b = "esri" + a + "SliderBL";
                    break;
                case "bottom-right":
                    b = "esri" + a + "SliderBR"
            }
            return "esri" + a + "Slider " + c + " " + b
        }, _openLogoLink: function (a) {
            window.open(M.defaults.map.logoLink, "_blank");
            z.stop(a)
        }, enableMapNavigation: function () {
            this.navigationManager.enableNavigation()
        },
        disableMapNavigation: function () {
            this.navigationManager.disableNavigation()
        }, enableDoubleClickZoom: function () {
            this.isDoubleClickZoom || (this.navigationManager.enableDoubleClickZoom(), this.isDoubleClickZoom = !0)
        }, disableDoubleClickZoom: function () {
            this.isDoubleClickZoom && (this.navigationManager.disableDoubleClickZoom(), this.isDoubleClickZoom = !1)
        }, enableShiftDoubleClickZoom: function () {
            this.isShiftDoubleClickZoom || (F(this.declaredClass + ": Map.(enable/disable)ShiftDoubleClickZoom deprecated. Shift-Double-Click zoom behavior will not be supported.",
                null, "v2.0"), this.navigationManager.enableShiftDoubleClickZoom(), this.isShiftDoubleClickZoom = !0)
        }, disableShiftDoubleClickZoom: function () {
            this.isShiftDoubleClickZoom && (F(this.declaredClass + ": Map.(enable/disable)ShiftDoubleClickZoom deprecated. Shift-Double-Click zoom behavior will not be supported.", null, "v2.0"), this.navigationManager.disableShiftDoubleClickZoom(), this.isShiftDoubleClickZoom = !1)
        }, enableClickRecenter: function () {
            this.isClickRecenter || (this.navigationManager.enableClickRecenter(), this.isClickRecenter = !0)
        }, disableClickRecenter: function () {
            this.isClickRecenter && (this.navigationManager.disableClickRecenter(), this.isClickRecenter = !1)
        }, enablePan: function () {
            this.isPan || (this.navigationManager.enablePan(), this.isPan = !0)
        }, disablePan: function () {
            this.isPan && (this.navigationManager.disablePan(), this.isPan = !1)
        }, enableRubberBandZoom: function () {
            this.isRubberBandZoom || (this.navigationManager.enableRubberBandZoom(), this.isRubberBandZoom = !0)
        }, disableRubberBandZoom: function () {
            this.isRubberBandZoom && (this.navigationManager.disableRubberBandZoom(),
                this.isRubberBandZoom = !1)
        }, enableKeyboardNavigation: function () {
            this.isKeyboardNavigation || (this.navigationManager.enableKeyboardNavigation(), this.isKeyboardNavigation = !0)
        }, disableKeyboardNavigation: function () {
            this.isKeyboardNavigation && (this.navigationManager.disableKeyboardNavigation(), this.isKeyboardNavigation = !1)
        }, enableScrollWheelZoom: function () {
            this.isScrollWheelZoom || (this.navigationManager.enableScrollWheelZoom(), this.isScrollWheelZoom = !0)
        }, disableScrollWheelZoom: function () {
            this.isScrollWheelZoom &&
            (this.navigationManager.disableScrollWheelZoom(), this.isScrollWheelZoom = !1)
        }, showPanArrows: function () {
            this._navDiv && (this._navDiv.style.display = "block", this.isPanArrows = !0)
        }, hidePanArrows: function () {
            this._navDiv && (this._navDiv.style.display = "none", this.isPanArrows = !1)
        }, showZoomSlider: function () {
            this._slider && (m(this._slider.domNode || this._slider, "visibility", "visible"), this.isZoomSlider = !0)
        }, hideZoomSlider: function () {
            this._slider && (m(this._slider.domNode || this._slider, "visibility", "hidden"), this.isZoomSlider = !1)
        }
    });
    e("extend-esri") && (s.Map = r);
    return r
});