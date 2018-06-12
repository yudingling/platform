
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    'root/spin/Spin',
    'root/drawerMenu/DrawerMenu',
    'root/popoverMenu/PopoverMenu',
    "common/widget/deviceActionTree/deviceActionTree",
    "./widget/deviceContent/deviceContent",
    "dojo/text!./template/deviceMgr.html",
    "tool/css!./css/deviceMgr.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        Spin,
        DrawerMenu,
        PopoverMenu,
        DeviceActionTree,
        DeviceContent,
        template){
    
    return declare("component.deviceMgr", [_Widget], {
        baseClass: "component_deviceMgr",
        templateString: template,
        
        selfAuth: true,
        authApi: {
            'clientInfo': '/platformApi/own/client/clientInfo'
        },
        
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
        },
        
        _initDom: function(){
        	//todo. support mobile browser, ztree did nothing on this
        	var tree = new DeviceActionTree({groupSelect: true, maxTitleAsciiLen: 35, canDrag: true});
        	$(this.domNode).find('.list').append($(tree.domNode));
        	tree.startup();
            this.own(tree);
            
            var detail = new DeviceContent({refreshInstanceId: tree.instanceId});
            $(this.domNode).find('.detail').append($(detail.domNode));
            detail.startup();
            this.own(detail);
            
            //popup menu
            this.popoverMenu = new PopoverMenu(
            		$(this.domNode).find('li.append a'), 
            		$(this.domNode).find('li.append a i'), 
            		[{name: '设备', value: "client"}, {name: '分组', value: "group"}],
            		lang.hitch(this, function(value){
            			topic.publish('common/widget/dat/add', {isGroup: value == 'group'});
            		})
            );
            this.own(this.popoverMenu);
            
            DrawerMenu.init($(this.domNode).find('.drawerMenu'));
        },
        
        _initAction: function(){
        	$(this.domNode).find('li.append i').click(lang.hitch(this, function(){
        	}));
        	
        	$(this.domNode).find('li.delete i').click(lang.hitch(this, function(){
        		this._toggleDeleteStatus(true);
        		
        		topic.publish('common/widget/dat/toggleDelete');
        	}));
        	
        	$(this.domNode).find('li.cancel a').click(lang.hitch(this, function(){
        		this._toggleDeleteStatus(false);
        		
        		topic.publish('common/widget/dat/toggleDelete');
        	}));
        	
        	$(this.domNode).find('li.ok a').click(lang.hitch(this, function(){
        		base.confirm('删除', '确定删除所选设备?', function(){
        			topic.publish('common/widget/dat/delete');
        		});
        	}));
        	
        	$(this.domNode).find('li.recycle a').click(lang.hitch(this, function(){
        		this._showModal('设备恢复', 'component/deviceMgr/widget/deviceRecover/deviceRecover', 'component_deviceMgr_widget_deviceRecover');
        	}));
            $(this.domNode).find('li.customCmd a').click(lang.hitch(this, function(){
        		this._showModal('自定义命令', 'component/deviceMgr/widget/customCmd/customCmd', 'component_deviceMgr_widget_customCmd');
        	}));
        },
        
        _showModal: function(title, path, cls){
            if(this.currentModal){
                this.currentModal.destroyRecursive();
                this.currentModal = null;
            }
            
            $(this.domNode).find('.modal .modal-title').html(title);
            base.newDojo(path, cls, null).success(lang.hitch(this, function(obj){
                this.currentModal = obj;
                $(this.domNode).find('.modal .modal-body').append($(this.currentModal.domNode));
                this.currentModal.startup();
                
                this.own(this.currentModal);
                
                $(this.domNode).find('.modal').modal({backdrop: 'static', keyboard: false});
            }));
        },
        
        _initEvents: function () {
            var sub1 = topic.subscribe('common/widget/dat/afterDelete', lang.hitch(this, function(data){
                this._toggleDeleteStatus(false);
            }));
            
            this.own(sub1);
        },
        
        _toggleDeleteStatus: function(isDelete){
        	if(isDelete){
        		$(this.domNode).find('li.delete').hide();
        		$(this.domNode).find('li.append').hide();
        		
        		$(this.domNode).find('li.ok').show();
        		$(this.domNode).find('li.cancel').show();
        	}else{
        		$(this.domNode).find('li.ok').hide();
        		$(this.domNode).find('li.cancel').hide();
        		
        		$(this.domNode).find('li.delete').show();
        		$(this.domNode).find('li.append').show();
        	}
        }
    });
});
