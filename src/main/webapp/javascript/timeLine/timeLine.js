/**
 * 时间轴
 */

define(['tool/base', 
        'dojo/_base/declare',
        'dojo/_base/lang',
        'tool/css!./timeLine.css'], function(base, declare, lang){
    
    return declare('js.timeLine', null, {
        constructor: function(domNode){
            this.items = [];
            this.tmUl = $('<section  class="myTimeLine"></section>');
            
            domNode.append(this.tmUl);
        },
        
        append: function(tm, tmCls, title, contentNode){
            var str = '<div class="cd-timeline-block">'
                + '<div class="cd-timeline-img"></div>'
                + '<div class="cd-timeline-content">'
                +   '<h2></h2>'
                +   '<div></div>'
                +   '<span class="cd-date"></span>'
                + '</div></div>';
            
            var tmli = $(str);
            
            tmli.find('.cd-timeline-img').addClass(tmCls);
            tmli.find('.cd-timeline-content>h2').text(title);
            tmli.find('.cd-timeline-content>.cd-date').text(tm);
            tmli.find('.cd-timeline-content>div').append(contentNode);
            
            this.tmUl.append(tmli);
            
            this.items.push(tmli);
        },
        
        size: function(){
            return this.items.length;
        },
        
        splice: function(start, length){
            for(var i=start; i<this.items.length && i<start+length; i++){
                this.items[i].remove();
            }
            
            this.items.splice(start, length);
        },
        
        clear: function(){
            this.items = [];
            this.tmUl.children().remove();
        },
        
        destroy: function(){
            this.tmUl.remove();
        }
        
    });
});