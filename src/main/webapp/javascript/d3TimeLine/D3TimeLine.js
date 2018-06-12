/*
 * d3 kit timeline, see: https://github.com/kristw/d3kit-timeline
*/

define([
    'dojo/_base/declare',
    './js/d3kit-timeline',
    'tool/css!./D3TimeLine.css'
], function(declare, D3KitTimeLine){
    
    return declare('js.d3timeLine', null, {
        /*
         *  options: https://github.com/kristw/d3kit-timeline/blob/master/docs/api.md
         *  extend options:   
         *        tickValues
         *        tickFormat
        */
        constructor: function(domNode, options){
            this.tl = new D3KitTimeLine(domNode[0], options);
        },
        
        data: function(data){
            this.tl.data(data);
        },
        
        options: function(options){
            this.tl.options(options);
        },
        
        on: function(eventName, handler){
            this.tl.on(eventName, handler);
        },
        
        resizeToFit: function(){
            this.tl.resizeToFit();
        },
        
        destroy: function(){
        }
        
    });
});