
define(['dojo/_base/declare',
        'dojo/_base/lang',
        './js/ion.rangeSlider',
        'tool/css!./css/normalize.css',
        'tool/css!./css/ion.rangeSlider.css',
        'tool/css!./css/ion.rangeSlider.skinModern.css'], function(declare, lang){

    return declare('RangeSlider', null, {
        /**
         * options see: https://github.com/IonDen/ion.rangeSlider
         */
        constructor: function(domObj, options){
            domObj.ionRangeSlider($.extend({force_edges: true }, options));
            this.rangeObj = domObj.data("ionRangeSlider");
        },
        
        from: function(){
            return this.rangeObj.old_from;
        },
        
        to: function(){
            return this.rangeObj.old_to;
        },
        
        min: function(){
            return this.rangeObj.options.min;
        },
        
        max: function(){
            return this.rangeObj.options.max;
        },
        
        update: function(options){
            this.rangeObj.update(options);
        },
        
        destroy: function(){
            this.rangeObj.destroy();
        }
    });
    
});