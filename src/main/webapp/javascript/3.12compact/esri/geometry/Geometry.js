// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See http://js.arcgis.com/3.12/esri/copyright.txt for details.
//>>built
define("esri/geometry/Geometry", ["dojo/_base/declare", "dojo/_base/lang", "dojo/has", "../kernel", "../SpatialReference"], function (a, b, c, d, e) {
    a = a(null, {
        declaredClass: "esri.geometry.Geometry",
        spatialReference: null,
        type: null,
        setSpatialReference: function (a) {
            this.spatialReference = a;
            return this
        },
        verifySR: function () {
            this.spatialReference || this.setSpatialReference(new e(4326))
        },
        getExtent: function () {
            return null
        }
    });
    c("extend-esri") && b.setObject("geometry.Geometry", a, d);
    return a
});