define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "common/widget/deviceActionTree/deviceActionTree",
    "dojo/text!./template/mine.html",
    "tool/css!./css/mine.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        DeviceActionTree,
        template){
    
    return declare("component.dataMonitor.widget.mine", [_Widget], {
        baseClass: "component_dataMonitor_widget_mine",
        templateString: template,
        
        constructor: function (args) {
            declare.safeMixin(this, args);
            
            this._initEvents();
        },
        
        postCreate: function () {
            this.inherited(arguments);
            
            this._initDom();
        },
        
        startup: function () {
            this.inherited(arguments);
        },
        
        destroy: function(){
        	this.inherited(arguments);
            
            //clear all clients
            topic.publish('component/dataMonitor/widget/monitorMap/refreshClients');
        },
        
        _initDom: function(){
            this.tree = new DeviceActionTree({
                groupSelect: false,
                needNodeData: true,
                maxTitleAsciiLen: 48,
                loaded: lang.hitch(this, function(ztree){
                    var nodes = ztree.getAllNodes();
                    var dataList = [];
                    for(var i=0; i<nodes.length; i++){
                        var item = nodes[i].nodeData;
                        if(!base.isNull(item.c_LGTD) && !base.isNull(item.c_LTTD)){
                            dataList.push(item);
                        }
                    }
                    
                    topic.publish('component/dataMonitor/widget/monitorMap/refreshClients', dataList);
                    topic.publish('component/dataMonitor/menuResultShown');
                }),
                hover: {
                    inFunc: lang.hitch(this, function(treeNode){
                        if(treeNode.type == 'client'){
                            var item = treeNode.nodeData;
                            if(!base.isNull(item.c_LGTD) && !base.isNull(item.c_LTTD)){
                                topic.publish('component/dataMonitor/widget/monitorMap/position', item);
                            }
                        }
                    }),
                    outFunc: lang.hitch(this, function(treeNode){
                        topic.publish('component/dataMonitor/widget/monitorMap/position');
                    })
                }
            });
        	$(this.domNode).find('.list').append($(this.tree.domNode));
        	this.tree.startup();
            this.own(this.tree);
        },
        
        _initEvents: function(){
            var sub1 = topic.subscribe('common/widget/dat/select', lang.hitch(this, function(data){
                if(base.isNull(this.tree) || (!base.isNull(data) && data.instanceId != this.tree.instanceId)){
                    return;
                }
                
                if(!base.isNull(data) && !base.isNull(data.newRow)){
                    var item = data.newRow.nodeData;
                    if(!base.isNull(item.c_LGTD) && !base.isNull(item.c_LTTD)){
                        topic.publish('component/dataMonitor/widget/monitorMap/locate', item);
                    }
                }
            }));
            var sub2 = topic.subscribe('component/dataMonitor/widget/monitorMap/discoveryLocated', lang.hitch(this, function(data){
                this.tree.clearSelect();
            }));
            
            this.own(sub1);
            this.own(sub2);
        }
    });
});
