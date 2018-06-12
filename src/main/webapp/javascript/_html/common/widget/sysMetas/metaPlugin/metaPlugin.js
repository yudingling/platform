/**
 *  parent of sysMetadata plugin
 */

define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic"
], function(
        base,
        declare,
        _Widget,
        lang,
        topic){
    
    return declare("common.widget.sysMetas.metaPlugin", [_Widget], {
        
         baseOptions: {
             minWidth: null,      //'100px'
             minHeight: null,     //'100px'
             clientId: null,      //required
             clientNm: null,      //required
             metaId: null,        //required
             metaCId: null,       //required
             metaNm: null,        //required
             metaUnit: null,      //required
             showEditor: true,    //required
             size: 'normal',      //required, 'small/normal'
        },
        
        constructor: function (args) {
            //althought baseOptions is a reference type, but we have mix its property value to the instance, so the descendant have independent values of 'baseOptions',
        	// in fact, we should not(never) use 'this.baseOptions' directly, using 'this.metaId' rather than 'this.baseOptions.metaId'.
            declare.safeMixin(this, this.baseOptions);
            declare.safeMixin(this, args);
            
            this._initDefaultEvents();
        },
        
        postCreate: function () {
            this.inherited(arguments);
            
            this._initDefaultDom();
        },
        
        startup: function () {
            this.inherited(arguments);
        },
        
        destroy: function(){
        	this.inherited(arguments);
        },
        
        refresh: function(args){
            this.inherited(arguments);
        },
        
        _initDefaultDom: function(){
            if(this.minWidth){
                $(this.domNode).css('min-width', this.minWidth);
            }
            if(this.minHeight){
                $(this.domNode).css('min-height', this.minHeight);
            }
        },
        
        _initDefaultEvents: function () {
            var sub1 = topic.subscribe('common/widget/sysMetas/refresh', lang.hitch(this, function(data){
                this.refresh(data);
            }));
            
            this.own(sub1);
        }
    });
});
