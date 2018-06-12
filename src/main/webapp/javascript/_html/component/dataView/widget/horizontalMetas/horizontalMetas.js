
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "root/customScrollbar/CustomScrollBar",
    "dojo/text!./template/horizontalMetas.html",
    "tool/css!./css/horizontalMetas.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        CustomScrollBar,
        template){
    
    return declare("component.dataView.widget.horizontalMetas", [_Widget], {
        baseClass: "component_dataView_widget_horz",
        templateString: template,
        
        constructor: function (args) {
            declare.safeMixin(this, args);
            
            this._initEvents();
        },
        
        postCreate: function () {
            this.inherited(arguments);
            
            this._initDom();
            
            this._initAction();
        },
        
        startup: function () {
            this.inherited(arguments);
            
            this.defer(lang.hitch(this, function(){
                CustomScrollBar.init($(this.domNode), 'x');
            }), 50);
        },
        
        destroy: function(){
        	this.inherited(arguments);
            
            $(this.domNode).find('.btn-group label.disabled').tooltip('destroy');
        },
        
        refresh: function(clientId, clientNm){
            this._removeAll();
            
            if(clientId){
                var parent = $(this.domNode).find('.btn-group');
                
                //get data from db
                this.clientId = clientId;
                
                base.ajax({
                    type: 'GET',
                    url: base.getServerNM() + 'platformApi/own/client/normal/clientMetadata',
                    data: {clientId: this.clientId}
                }).success(lang.hitch(this, function(ret){
                    
                    var metas = ret.data;
                    for(var i=0; i<metas.length; i++){
                        parent.append(this._createMeta(clientId, clientNm, metas[i]));
                    }
                    
                    CustomScrollBar.update($(this.domNode), 'x');
                }));
            }
        },
        
        _removeAll: function(clientId, clientNm){
            var parent = $(this.domNode).find('.btn-group');
            
            parent.find('label.active').each(lang.hitch(this, function(index, element){
                topic.publish('component/dataView/meta/change', {
                    clientId: this.clientId, 
                    metadata: $(element).data('item'), 
                    selected: false});
            }));
            
            parent.contents().remove();
            
            this.clientId = null;
        },
        
        _initDom: function(){
        },
        
        _initAction: function(){
        },
        
        _createMeta: function(clientId, clientNm, item){
            var metaNm = (item.meta_NM && item.meta_NM.length>0)? item.meta_NM : item.meta_CID;
            var label = $('<label class="btn btn-default"><i class="fa fa-check"></i><input type="checkbox" autocomplete="off">' + metaNm + '</label>').data('item', item);
            
            if(!item.sysmeta_ID || item.sysmeta_ID.length == 0){
                label.find('input').remove();
                label.addClass('disabled').attr('title', '未设置系统元数据映射').tooltip({
                    container: 'body',
                    placement: 'auto bottom',
                    trigger: 'hover'
                });
            }else{
                label.click(function(){
                    //the 'active' is on changing. use the opposite value
                    topic.publish('component/dataView/meta/change', {clientId: clientId, clientNm: clientNm, metadata: item, selected: !($(this).hasClass('active'))});
                });
            }
            
            return label;
        },
        
        _initEvents: function () {
            var sub1 = topic.subscribe('common/widget/dat/select', lang.hitch(this, function(data){
                if(data && data.newRow){
                    this.refresh(data.newRow.dId, data.newRow.name);
                }else{
                    this._removeAll();
                }
            }));
            
            this.own(sub1);
        }
    });
});
