
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "dojo/text!./template/verticalMetas.html",
    "tool/css!./css/verticalMetas.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        template){
    
    return declare("component.dataView.widget.verticalMetas", [_Widget], {
        baseClass: "component_dataView_widget_vert",
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
        },
        
        destroy: function(){
        	this.inherited(arguments);
            
            $(this.domNode).find('.panel .btn-group label.disabled').tooltip('destroy');
        },
        
        refresh: function(){
            $(this.domNode).contents().remove();
        },
        
        _addItem: function(clientId, clientNM){
            base.ajax({
                type: 'GET',
                url: base.getServerNM() + 'platformApi/own/client/normal/clientMetadata',
                data: {clientId: clientId}
            }).success(lang.hitch(this, function(ret){
                
                var metas = ret.data;
                
                var obj = $('<div class="panel panel-default"><div class="panel-heading">'
                    + clientNM + '</div><div class="btn-group" data-toggle="buttons"></div></div>').addClass('cls_' + clientId);
            
                var parent = obj.find('.btn-group');
                for(var i=0; i<metas.length; i++){
                    parent.append(this._createMeta(clientId, clientNM, metas[i]));
                }

                obj.appendTo($(this.domNode));
            }));
        },
        
        _createMeta: function(clientId, clientNm, item){
            var metaNmOrg = (item.meta_NM && item.meta_NM.length>0)? item.meta_NM : item.meta_CID;
            
            var metaNm = base.subDescription(metaNmOrg, 18);
            
            var label = $('<label class="btn btn-default"><i class="fa fa-check"></i><input type="checkbox" autocomplete="off">'+ metaNm +'</label>').data('item', item);
            
            if(!item.sysmeta_ID || item.sysmeta_ID.length == 0){
                label.find('input').remove();
                label.addClass('disabled').attr('title', '未设置系统元数据映射').tooltip({
                    container: 'body',
                    placement: 'auto left',
                    trigger: 'hover'
                });
            }else{
                label.click(function(){
                    //the 'active' is on changing. use the opposite value
                    topic.publish('component/dataView/meta/change', {
                        clientId: clientId, 
                        clientNm: clientNm,
                        metadata: item, 
                        selected: !($(this).hasClass('active'))});
                });
            }
            
            if(metaNm.length < metaNmOrg.length){
                label.attr('title', metaNmOrg);
            }
            
            return label;
        },
        
        _removeItem: function(clientId, clientNm){
            var obj = $(this.domNode).find('.panel.cls_' + clientId);
            
            obj.find('label.active').each(lang.hitch(this, function(index, element){
                topic.publish('component/dataView/meta/change', {
                    clientId: clientId, 
                    metadata: $(element).data('item'), 
                    selected: false});
            }));
            
            obj.remove();
        },
        
        _initDom: function(){
        },
        
        _initAction: function(){
        },
        
        _initEvents: function () {
            var sub1 = topic.subscribe('common/widget/ztree/check', lang.hitch(this, function(nodes){
                if(nodes && nodes.length>0){
                    for(var i=0; i<nodes.length; i++){
                        if(nodes[i].type == 'client'){
                            this._addItem(nodes[i].dId, nodes[i].name);
                        }
                    }
                }
            }));
            
            var sub2 = topic.subscribe('common/widget/ztree/unCheck', lang.hitch(this, function(nodes){
                if(nodes && nodes.length>0){
                    for(var i=0; i<nodes.length; i++){
                        if(nodes[i].type == 'client'){
                            this._removeItem(nodes[i].dId, nodes[i].name);
                        }
                    }
                }
            }));
            
            this.own(sub1);
            this.own(sub2);
        }
    });
});
