
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "root/spin/Spin",
    "root/customScrollbar/CustomScrollBar",
    "common/widget/maintRecordDetail/widget/locationMap/locationMap",
    "dojo/text!./template/broadcastDetail.html",
    "tool/css!./css/broadcastDetail.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        Spin,
        CustomScrollBar,
        LocationMap,
        template){
    
    return declare("component.myMaint.broadcastDetail", [_Widget], {
        baseClass: "component_myMaint_broadcastDetail",
        templateString: template,
        
        constructor: function(args){
            declare.safeMixin(this, args);
            
            this._initEvents();
        },
        
        postCreate: function(){
            this.inherited(arguments);

            this._initDom();
        },
        
        startup: function(){
            this.inherited(arguments);
            
            this.defer(lang.hitch(this, function(){
                CustomScrollBar.init($(this.domNode).children('.customScrollBar'));
                
            }), 500);
        },
        
        destroy: function(){
        	this.inherited(arguments);
        },
        
        _initDom: function(){
            $(this.domNode).find('.occupy').click(lang.hitch(this, function(){
                if(this.data){
                    this._occupy();
                }
            }));
        },
        
        _occupy: function(){
            //save 'this.data' to a temp object, cause 'this.data' will be cleared by topic message.
            var oldData = this.data;
            
            base.ajax({
                type: 'PUT',
                url: base.getServerNM() + 'platformApi/own/myMaint/normal/maintRecord',
                data: {
                    maintId: oldData.maint_ID
                }
            }).success(lang.hitch(this, function(ret){
                if(ret.data){
                    base.ok('成功', '接收工单成功');
                    
                    var data = $.extend({}, oldData, {
                        maint_CRT_UNM: ret.data.maint_CRT_UNM,
                        maint_ACT_UID: ret.data.maint_ACT_UID,
                        maint_ACT_UNM: ret.data.maint_ACT_UNM,
                        maint_ACT_TS: ret.data.maint_ACT_TS,
                        maint_STATUS: 1
                    })
                    
                    topic.publish('component/myMaint/added', data);
                    
                }else{
                    base.info('失败', '工单已被别的运维人员接收，失效');
                }
                
                topic.publish('component/myMaint/occupied', oldData);
                
                this._clear();
            }));
        },
        
        _refresh: function(data){
            this.data = data;
            
            var parent = $(this.domNode).find('table');
            parent.find('.crtDesc').text(this._getCrtHtml(this.data));
            parent.find('.from').text(this._getRecordSourceHtml(this.data));
            parent.find('.desc').text(this.data.maint_DESC);
            
            this._createLocationMap(data.clients);
        },
        
        _createLocationMap: function(clis){
            var defer = false;
            if(!this.map){
                this.map = new LocationMap({center: [76.016, 44.159], zoom: 5, toolboxPos: 1});
                
                $(this.domNode).children('.clientsMap').append($(this.map.domNode));
                this.map.startup();
                this.own(this.map);
                
                defer = true;
            }
            
            if(defer){
                this.defer(lang.hitch(this, function(){
                    this.map.resize();
                    this.map.refresh(clis);
                    
                }), 500);
                
            }else{
                this.map.resize();
                this.map.refresh(clis);
            }
        },
        
        _getCrtHtml: function(data){
            return '创建于 ' + (new Date(data.crt_TS)).format('yyyy-MM-dd HH:mm');
        },
        
        _getRecordSourceHtml: function(data){
            return base.isNull(data.wrn_ID)? '人工产生' : '设备告警';
        },
        
        _clear: function(){
            this.data = null;
            topic.publish('component/myMaint/clearSelect');
        },
        
        _initEvents: function(){
            var sub1 = topic.subscribe('component/myMaint/selected', lang.hitch(this, function(data){
                if(!this.data || this.data.maint_ID != data.maint_ID){
                    this._refresh(data);
                }
            }));
            var sub1 = topic.subscribe('component/myMaint/deleted', lang.hitch(this, function(data){
                if(this.data && this.data.maint_ID == data.maint_ID){
                    this._clear();
                }
            }));
            
            this.own(sub1);
        }
    });
});
