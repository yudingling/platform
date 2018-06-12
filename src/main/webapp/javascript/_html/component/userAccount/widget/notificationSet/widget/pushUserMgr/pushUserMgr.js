
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "tool/validator",
    "root/popoverMenu/PopoverMenu",
    "./widget/pushUserTree/pushUserTree",
    "dojo/text!./template/pushUserMgr.html",
    "tool/css!./css/pushUserMgr.css",
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        Validator,
        PopoverMenu,
        PushUserTree,
        template){
    
    return declare("component.userAccount.widget.notificationSet.widget.pushUserMgr", [_Widget], {
        baseClass: "component_userAccount_widget_ntfSet_pushUserMgr",
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
        },
        
        _initDom: function(){
            this.popoverMenu = new PopoverMenu(
                $(this.domNode).find('ul>li.append a'), 
                $(this.domNode).find('ul>li.append a i'), 
                [{name: '人员', value: "client"}, {name: '分组', value: "group"}],
                lang.hitch(this, function(value){
                    topic.publish('component/userAccount/widget/notificationSet/widget/pushUserMgr/pushUserTree/add', {isGroup: value == 'group'});
                })
            );
            this.own(this.popoverMenu);
            
            var pushUserTree = new PushUserTree({maxTitleAsciiLen: 45});
        	$(this.domNode).find('.pushUserTree').append($(pushUserTree.domNode));
        	pushUserTree.startup();
            this.own(pushUserTree);
            
            $(this.domNode).find('ul>li.delete i').click(lang.hitch(this, function(){
        		this._toggleDeleteStatus(true);
        		
        		topic.publish('component/userAccount/widget/notificationSet/widget/pushUserMgr/pushUserTree/toggleDelete');
        	}));
        	
        	$(this.domNode).find('ul>li.cancel a').click(lang.hitch(this, function(){
        		this._toggleDeleteStatus(false);
        		
        		topic.publish('component/userAccount/widget/notificationSet/widget/pushUserMgr/pushUserTree/toggleDelete');
        	}));
        	
        	$(this.domNode).find('ul>li.ok a').click(lang.hitch(this, function(){
                topic.publish('component/userAccount/widget/notificationSet/widget/pushUserMgr/pushUserTree/delete');
        	}));
            
            $(this.domNode).find('.cmd button.save').click(lang.hitch(this, function(){
                if(this.selected && this.selected.newRow){
                    if(this.selected.newRow.type == 'client'){
                        this._cmdSave_client();
                    }else if(this.selected.newRow.type == 'group'){
                        this._cmdSave_group();
                    }
                }
            }));
            
            $(this.domNode).find('.cmd button.cancel').click(lang.hitch(this, function(){
                topic.publish('component/userAccount/widget/notificationSet/widget/pushUserMgr/pushUserTree/canceAdd', this.selected);
            }));
        },
        
        _cmdSave_client: function(){
            var parent = $(this.domNode).find('.clientForm');
            
            var pu_NM = parent.find('.name').val().trim();
            var pu_PHONE = parent.find('.phone').val().trim();
            var pu_EMAIL = parent.find('.email').val().trim();
            
            if(pu_PHONE.length > 0 && !Validator.isMobile(pu_PHONE)){
                base.error('错误', '手机号输入错误');
                return;
            }
            if(pu_EMAIL.length > 0 && !Validator.isEmail(pu_EMAIL)){
                base.error('错误', '邮箱输入错误');
                return;
            }
            
            var saveObj = {
                pu_ID: this.selected.newRow.dId,
                u_ID: null,
                gp_ID: this.selected.newRow.pDid,  //mind that pDid is the real value for 'group id in db'
                pu_NM: pu_NM,
                pu_PHONE: pu_PHONE,
                pu_EMAIL: pu_EMAIL,
                crt_TS: null,
                upt_TS: null
            };
            
            var isAdd = base.isNull(saveObj.pu_ID);
            
            base.ajax({
                hintOnSuccess: true,
                type: isAdd? 'POST' : 'PUT',  
                url: base.getServerNM() + 'platformApi/own/warn/normal/pushUser',
                data: {info: JSON.stringify(saveObj)}
            }).success(lang.hitch(this, function(ret){
                var name = saveObj.pu_NM && saveObj.pu_NM.length > 0 ? saveObj.pu_NM : '';
                if(name.length ==0 && saveObj.pu_PHONE && saveObj.pu_PHONE.length > 0){
                    name = saveObj.pu_PHONE;
                }
                if(name.length ==0 && saveObj.pu_EMAIL && saveObj.pu_EMAIL.length > 0){
                    name = saveObj.pu_EMAIL;
                }
                
                var treeData = ret.data;
                if(isAdd){
                    $.extend(this.selected.newRow, {id: treeData.id, dId: treeData.dId, name: name, nodeData: treeData.nodeData});
                    
                }else{
                    $.extend(this.selected.newRow, {name: name, nodeData: treeData.nodeData});
                }
                
                topic.publish('component/userAccount/widget/notificationSet/widget/pushUserMgr/pushUserTree/update', this.selected.newRow);
                //hide cancel
                $(this.domNode).find('.cmd button.cancel').hide();
            }));
        },
        
        _cmdSave_group: function(){
            var gpName = $(this.domNode).find('.groupForm .name').val().trim();
            
            if(gpName.length == 0){
                base.info('提醒', '分组名字不能为空');
                return;
            }
            
            //mind that dId and pDid is the real value for 'group id in db'
            var saveObj = {
                id: this.selected.newRow.dId, 
                pId: this.selected.newRow.pDid,
                name: gpName,
            };
            
            var isAdd = base.isNull(saveObj.id);
            
            base.ajax({
                hintOnSuccess: true,
                type: isAdd? 'POST' : 'PUT',  
                url: base.getServerNM() + 'platformApi/own/sys/normal/dataGroup',
                data: saveObj
            }).success(lang.hitch(this, function(ret){
                if(isAdd){
                    $.extend(this.selected.newRow, {id: ret.data.id, dId: ret.data.dId, name: gpName});
                }else{
                    $.extend(this.selected.newRow, {name: gpName});
                }
                
                topic.publish('component/userAccount/widget/notificationSet/widget/pushUserMgr/pushUserTree/update', this.selected.newRow);
                $(this.domNode).find('.cmd button.cancel').hide();
            }));
        },
        
        _toggleDeleteStatus: function(isDelete){
        	if(isDelete){
        		$(this.domNode).find('ul>li.delete').hide();
        		$(this.domNode).find('ul>li.append').hide();
        		
        		$(this.domNode).find('ul>li.ok').show();
        		$(this.domNode).find('ul>li.cancel').show();
        	}else{
        		$(this.domNode).find('ul>li.ok').hide();
        		$(this.domNode).find('ul>li.cancel').hide();
        		
        		$(this.domNode).find('ul>li.delete').show();
        		$(this.domNode).find('ul>li.append').show();
        	}
        },
        
        _setData: function(selected){
            this.selected = selected;
            
            if(base.isNull(this.selected) || base.isNull(this.selected.newRow)){
            	$(this.domNode).find('.cmd button.save').hide();
                $(this.domNode).find('.cmd button.cancel').hide();
                
                $(this.domNode).find('.pushUserContent input').val(null);
            }else{
                var groupForm = $(this.domNode).find('.groupForm');
                var clientForm = $(this.domNode).find('.clientForm');
                
            	if(this.selected.newRow.type == 'client'){
            		groupForm.hide();
                	clientForm.show();
                    
                    clientForm.find('input.name').val(this.selected.newRow.nodeData.pu_NM);
                    clientForm.find('input.phone').val(this.selected.newRow.nodeData.pu_PHONE);
                    clientForm.find('input.email').val(this.selected.newRow.nodeData.pu_EMAIL);
                	
                }else if(this.selected.newRow.type == 'group'){
                    clientForm.hide();
                	groupForm.show();
                    
                    groupForm.find('input.name').val(this.selected.newRow.name);
                }
            	
                if(base.isNull(this.selected.newRow.id)){
                	$(this.domNode).find('.cmd button.save').show();
                    $(this.domNode).find('.cmd button.cancel').show();
                    
                }else{
                	$(this.domNode).find('.cmd button.save').show();
                    $(this.domNode).find('.cmd button.cancel').hide();
                }
            }
        },
        
        _initEvents: function(){
            var sub1 = topic.subscribe('component/userAccount/widget/notificationSet/widget/pushUserMgr/pushUserTree/select', lang.hitch(this, function(data){
                this._setData(data);
            }));
            var sub2 = topic.subscribe('component/userAccount/widget/notificationSet/widget/pushUserMgr/pushUserTree/afterDelete', lang.hitch(this, function(data){
                this._toggleDeleteStatus(false);
            }));
            
            this.own(sub1);
            this.own(sub2);
        }
    });
});
