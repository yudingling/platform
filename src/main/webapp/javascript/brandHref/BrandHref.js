/*
* brand ribbon button
**/

define(["dojo/_base/declare", 
        'tool/css!./BrandHref.css'],
       function(declare){
    
    return declare('BrandHref', null, {
        type: 'brandhref',
        constructor: function(container, onClick, pos){
            var obj = $('<div class="fork-me-wrapper"><div class="fork-me"><a class="fork-me-link" href="javascript:void(0);"><span class="fork-me-text"></span></a></div></div>');
            
            if(pos && pos == 'left'){
                obj.addClass('fork-me-left');
            }
            
            if(onClick){
                obj.find('a').click(onClick);
            }else{
                obj.find('a').css('cursor', 'default');
            }
            
            container.append(obj);
            
            this.obj = obj;
        },
        
        setInfo: function(title, color){
            this.obj.find('span.fork-me-text').html(title);
            this.obj.find('div.fork-me').css('background-color', color).css('box-shadow', '0 0 7px 0 ' + color);
        },
        
        destroy: function(){
            this.obj.remove();
        }
    });
    
});