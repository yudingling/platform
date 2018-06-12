
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "tool/validator",
    "root/objectSelector/ObjectSelector",
    "common/widget/zTree/zTree",
    "root/customScrollbar/CustomScrollBar",
    "dojo/text!./template/pushUserSelector.html",
    "tool/css!./css/pushUserSelector.css",
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        Validator,
        ObjectSelector,
        ZTree,
        CustomScrollBar,
        template){
    
    return declare("component.userAccount.widget.notificationSet.widget.pushUserSelector", [_Widget], {
        baseClass: "component_userAccount_widget_ntfSet_pushUserSelector",
        templateString: template,
        
        /*
          args: {
              selTitle: '短信',
              selType: 'msg'    //msg/email
            }
         */ 
        constructor: function (args) {
            declare.safeMixin(this, args);
            
            this.currentSelected = {};

            this._initEvents();
        },
        
        postCreate: function () {
            this.inherited(arguments);

            this._initDom();
        },
        
        startup: function () {
            this.inherited(arguments);
            
            this._setData();
        },
        
        destroy: function(){
        	this.inherited(arguments);
            
            this._destoryUserTree();
        },
        
        enable: function(enabled){
            if(enabled){
                $(this.domNode).removeClass('showCover');
            }else{
                $(this.domNode).addClass('showCover');
            }
        },
        
        _initDom: function(){
            $(this.domNode).find('.head>span').html(this.selTitle);
            
            $(this.domNode).find('.head li.append i').click(lang.hitch(this, function(){
        		this._showAppend();
        	}));
            
            $(this.domNode).find('.head li.delete i').click(lang.hitch(this, function(){
        		this._toggleDeleteStatus(true);
        	}));
        	
        	$(this.domNode).find('.head li.cancel a').click(lang.hitch(this, function(){
        		this._toggleDeleteStatus(false);
        	}));
        	
        	$(this.domNode).find('li.ok a').click(lang.hitch(this, function(){
                var delObj = this._getDeleteObject();
                
                if(delObj.ids.length == 0){
                    base.info('提醒', '请选中要删除的对象');
                    return;
                }
                
        		this._deleteInfo(delObj);
        	}));
        },
        
        _getCurrentItems: function(){
            var selected = [];
            $(this.domNode).find('.infoContainer>li').each(function(i, e){
                var val = $(this).data('item').up_VAL;
                if(val && val.length > 0){
                    selected.push(val);
                }
            });
            
            return selected;
        },
        
        _destoryUserTree: function(){
            if(this.userTree){
                this.userTree.destroyRecursive();
                this.userTree = null;
            }
        },
        
        _showAppend: function(){
            this._initSelector();
            
            this._showSelector();
        },
        
        _initSelector: function(){
            if(!this.selector){
                this.selector = new ObjectSelector(
                    $(this.domNode), 
                    '添加'+ this.selTitle +'对象', 
                    lang.hitch(this, function(objContainer){
                        //cause the push users may changed in 'userAccount', we need to reCreate it each time.
                        if(!this.selectorInited){
                            var placeHolder = '';
                            if(this.selType == 'msg'){
                                placeHolder = '格式：短信号码 姓名(非必须),短信号码 姓名...';
                            }else if(this.selType == 'email'){
                                placeHolder = '格式：邮箱 姓名(非必须),邮箱 姓名...';
                            }

                            objContainer.append($('<div class="userTree" style="width: 100%; height: 75%"><div class="userTreeCti"></div></div>'))
                            objContainer.append($('<div style="width: 100%; height: 25%"><textarea class="form-control" style="height:100%" spellcheck="false" placeholder="'+ placeHolder +'"></textarea></div>'))
                            CustomScrollBar.init(objContainer.find('.userTree'));

                            this.selectorInited = true;
                        }

                        this._destoryUserTree();
                        objContainer.find('textarea').val(null);
                        
                        this.userTree = new ZTree({
                            treeObj: objContainer.find('.userTreeCti'),
                            urlOrData: base.getServerNM() + 'platformApi/own/warn/normal/pushUser?showCheck=true&pushType=' + this.selType,
                            expandFirst: false,
                            render: null, 
                            beforeClick: null, 
                            click: null,
                            loaded: lang.hitch(this, function(ztree){
                                //this tree is using for 'append', not 'reset', so there is no need to check on which is selected. 
                                return;

                                //check the node that its property 'phone/emial' equals to the selected info
                                var selected = this._getCurrentItems();
                                var allNodes = ztree.getAllNodes();

                                for(var i=0; i<allNodes.length; i++){
                                    if(allNodes[i].type == 'client'){
                                        if(this.selType == 'msg'){
                                            var phone = allNodes[i].nodeData.pu_PHONE;
                                            if(!base.isNull(phone) && phone.length > 0 && selected.indexOf(phone) >= 0){
                                                ztree.checkNode(allNodes[i], true);
                                            }
                                        }else if(this.selType == 'email'){
                                            var email = allNodes[i].nodeData.pu_EMAIL;
                                            if(!base.isNull(email) && email.length > 0 && selected.indexOf(email) >= 0){
                                                ztree.checkNode(allNodes[i], true);
                                            }
                                        }
                                    }
                                }
                            }
                        )});

                        this.userTree.startup();
                    }),
                    '确 定',
                    true
                );
                
                this.own(this.selector);
            }
        },
        
        _getAddObject: function(name, val){
            return {up_ID: null, u_ID: null, up_TP: null, up_NM: name, up_VAL: val, crt_TS: null, upt_TS: null};
        },
        
        _showSelector: function(){
            this.selector.show(lang.hitch(this, function(objContainer){
                var addList = [];
                
                var checkedNodes = this.userTree.getCheckedNodes(true);
                for(var i=0; i<checkedNodes.length; i++){
                    if(checkedNodes[i].type == 'client'){
                        var nodeData = checkedNodes[i].nodeData;
                        if(this.selType == 'msg'){
                            addList.push(this._getAddObject(nodeData.pu_NM, nodeData.pu_PHONE));
                        }else if(this.selType == 'email'){
                            addList.push(this._getAddObject(nodeData.pu_NM, nodeData.pu_EMAIL));
                        }
                    }
                }
                
                var txtVal = objContainer.find('textarea').val().trim();
                var arr = txtVal.split(',');
                for(var i=0; i<arr.length; i++){
                    var tmp = arr[i].split(' ');
                    
                    var getted = [];
                    for(var j=0; j<tmp.length; j++){
                        var filter = tmp[j].trim();
                        if(filter.length > 0){
                            getted.push(filter);
                        }
                    }
                    
                    if(getted.length > 0){
                        if((this.selType == 'msg' && Validator.isMobile(getted[0])) || (this.selType == 'email' && Validator.isEmail(getted[0]))){
                            addList.push(this._getAddObject(getted.length > 1? getted[1] : null, getted[0]));
                        }
                    }
                }
                
                if(addList.length > 0){
                    base.ajax({
                        type: 'POST',
                        url: base.getServerNM() + 'platformApi/own/warn/normal/auto3rdPush',
                        data: {
                            list: JSON.stringify(addList),
                            pushType: this.selType
                        }
                    }).success(lang.hitch(this, function(ret){
                        this._refreshItems(ret.data);
                    }));
                }

            }), {width: '320px', height: '380px', top: '-20px', left: '100px' });
        },
        
        _setData: function(){
            base.ajax({
                url: base.getServerNM() + 'platformApi/own/warn/normal/auto3rdPush',
                data: {
                    pushType: this.selType
                }
            }).success(lang.hitch(this, function(ret){
                this._refreshItems(ret.data);
            }));
        },
        
        _refreshItems: function(items){
            this._clear();
            
            var nodes = [];
            for(var i=0; i<items.length; i++){
                nodes.push(this._createItem(items[i]));
            }
            
            $(this.domNode).find('.infoContainer').append(nodes);
        },
        
        _clear: function(){
            $(this.domNode).find('.infoContainer>li').remove();
            this.currentSelected = {};
        },
        
        _toggleDeleteStatus: function(isDelete){
            var lis = $(this.domNode).find('.head>.list-inline');
            var infoCenter = $(this.domNode).find('.infoContainer');
            
        	if(isDelete){
        		lis.find('li.delete').hide();
        		lis.find('li.append').hide();
        		
        		lis.find('li.ok').show();
        		lis.find('li.cancel').show();
                
                infoCenter.addClass('showDelete');
                
        	}else{
        		lis.find('li.ok').hide();
        		lis.find('li.cancel').hide();
        		
        		lis.find('li.delete').show();
        		lis.find('li.append').show();
        		
        		infoCenter.children('li').removeClass('delete');
        		infoCenter.find('li input:checked').prop('checked', false);
                
                infoCenter.removeClass('showDelete');
        	}
            
            this.isDelete = isDelete;
        },
        
        _createItem: function(item){
            this._removeOldItem(item);
            
            var name = item.up_VAL;
            if(item.up_NM && item.up_NM.length > 0){
                name += '(' + item.up_NM + ')';
            }
            var obj = $('<li><a href="javascript:void(0);"><input type="checkbox">' + name + '</a></li>').data('item', item);
            
            var chk = obj.find('input');
            obj.click(lang.hitch(this, function(e){
                if(this.isDelete){
                    chk.prop('checked', !chk.is(':checked'));
            		chk.trigger('change');
                }
            }));
            chk.click(lang.hitch(this, function(e){
            	//if click on checkbox, we should sotp propagation to avoid the obj.click being called
            	e.stopPropagation();
            }));
            
            chk.change(lang.hitch(this, function(e){
                if($(e.currentTarget).is(':checked')){
                	obj.addClass('delete');
                }else{
                	obj.removeClass('delete');
                }
            }));
            
            this.currentSelected[item.up_VAL] = obj;
            
            return obj;
        },
        
        _removeOldItem: function(item){
            var old = this.currentSelected[item.up_VAL];
            if(old){
                old.remove();
                
                delete this.currentSelected[item.up_VAL];
            }
        },
        
        _getDeleteObject: function(){
            var objs = $(this.domNode).find('.infoContainer>li.delete');
            var ids = [];
            var items = [];
            
            objs.each(lang.hitch(this, function(i, e){
                var tmp = $(e).data('item');
                items.push(tmp);
                ids.push(tmp.up_ID);
            }));
            
            return {items: items, ids: ids};
        },
        
        _deleteInfo: function(delObj){
            base.ajax({
                type: 'DELETE',
                url: base.getServerNM() + 'platformApi/own/warn/normal/auto3rdPush',
                data: {
                    idList: JSON.stringify(delObj.ids),
                    pushType: this.selType
                }
            }).success(lang.hitch(this, function(ret){
                
                for(var i=0; i<delObj.items.length; i++){
                    this._removeOldItem(delObj.items[i]);
                }
                
                this._toggleDeleteStatus(false);
            }));
        },
        
        _initEvents: function(){
            var sub1 = topic.subscribe('component/userAccount/widget/notificationSet/hide', lang.hitch(this, function(data){
                if(this.selector){
                    this.selector.hide();
                }
            }));
            
            this.own(sub1);
        }
    });
});
