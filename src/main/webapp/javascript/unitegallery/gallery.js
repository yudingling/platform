

define(['tool/base',
        'dojo/_base/lang',
        "dojo/_base/declare",
        './js/unitegallery',
        'tool/css!./css/unite-gallery.css',
        'tool/css!./themes/default/ug-theme-default.css'], 
       function(base, lang, declare){
    
    return declare('Gallery', null, {
        
        constructor: function(domObj, options){
            
            require(['root/unitegallery/themes/default/ug-theme-default',
                    'root/unitegallery/themes/compact/ug-theme-compact'], lang.hitch(this, function(){
                //id is required in unitegallery
                if(base.isNull(domObj.attr('id'))){
                    domObj.attr('id', 'gla_' + base.uuid());
                }
                
                //options: http://unitegallery.net/index.php?page=default-options
                this.obj = domObj.unitegallery(options);
            }));
        },
        
        resize: function(width, height){
            if(this.obj){
                this.obj.resize(width, height);
            }
        },
        
        selectItem: function(index){
            if(this.obj){
                this.obj.selectItem(index);
            }
        },
        
        destroy: function(){
            if(this.obj){
                this.obj.destroy();
            }
        }
    });
});