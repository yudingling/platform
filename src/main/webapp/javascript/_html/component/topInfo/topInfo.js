
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "dojo/text!./template/topInfo.html",
    "tool/css!./css/topInfo.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        template){
    
    return declare("component.topInfo", [_Widget], {
        baseClass: "component_topInfo",
        templateString: template,
        
        authApi: {
            'infoCenter': 'component/infoCenter/infoCenter',
            'myAccount': 'component/userAccount/userAccount'
        },
        
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
            
            this._refreshInfo();
        },
        
        destroy: function(){
        	this.inherited(arguments);
        	
        	//clear interval
        	if(this.infoBDIntev){
        		clearInterval(this.infoBDIntev);
        	}
        },
        
        _refreshInfo: function(){
        	this._getInfoCountFromDB();
        	
        	this.infoBDIntev = setInterval(lang.hitch(this, function (){
                this._getInfoCountFromDB();

            }), 60000);
        },
        
        _getInfoCountFromDB: function(){
        	base.ajax({
                url: base.getServerNM() + 'platformApi/own/user/normal/infoCount',
            }).success(lang.hitch(this, function(ret){
                $(this.domNode).find('span.badge').html(parseInt(ret.data)>0? ret.data : '');
            }));
        },
        
        _initDom: function(){
            this._initCreatedNav();
            
            this._initDefaultNav();
            
            this._initSearchDom();
        },
        
        _initSearchDom: function(){
        	var txt = $(this.domNode).find('.searchAll input');
            var isearch = $(this.domNode).find('.searchAll i.fa');
            isearch.click(lang.hitch(this, function(){
                if(txt.is(':visible')){
                    txt.val('').css("padding", "0px").css('border-width', '0px').animate({'width': '0px'}, 300, function(){
                        txt.hide();
                    });
                }else{
                    txt.width(0).css("padding", "6px 12px").css('border-width', '1px').show().focus().animate({'width': '250px'}, 300);
                }
                
            }));
            
            txt.keydown(lang.hitch(this, function(event){
                if(event.which == 13){
                    event.preventDefault();
                    this._search();
                }else if(event.which == 27){
                    event.preventDefault();
                    isearch.click();
                }
                
            })).blur(lang.hitch(this, function(event){
                if(txt.width() > 0){
                    isearch.click();
                }
            }));
        },
        
        _search: function(){
        },
        
        _initDefaultNav: function(){
        	$(this.domNode).find('.navbar-nav.default>li:not(.dropdown)>a').click(lang.hitch(this, function(e){
                this._action_default($(e.currentTarget).parent(), e);
            }));
            
            $(this.domNode).find('.navbar-nav.default li.dropdown ul.dropdown-menu>li>a').click(lang.hitch(this, function(e){
                this._action_default($(e.currentTarget).parent().parent().parent(), e);
            }));
        },
        
        _initCreatedNav: function(){
        	base.ajax({
                url: base.getServerNM() + 'platformApi/own/user/normal/menu',
            }).success(lang.hitch(this, function(ret){
            	var menuMap = ret.data;
            	
            	//the level of menu is limited in 2, otherwise we should reconsider the business logic
            	var navs = {};
            	for(var apiId in menuMap){
            		var menu = menuMap[apiId];
            		
                    if(menu.api_AUTOGEN){
                        if(menu.api_PID && menu.api_PID.length>0){
                            if(navs[menu.api_PID]){
                                navs[menu.api_PID].children.push(this._genNavObject(menu));

                            }else{
                                var parent = menuMap[menu.api_PID];
                                if(parent){
                                    navs[parent.api_ID] = this._genNavObject(parent);
                                    navs[parent.api_ID].children.push(this._genNavObject(menu));
                                }else{
                                    //if parent cann't found, just treat it as a non parent menu
                                    navs[apiId] = this._genNavObject(menu);
                                }
                            }
                        }else{
                            navs[apiId] = this._genNavObject(menu);
                        }
                    }
            	}
            	
            	var navUlParent = $(this.domNode).find('ul.created');
            	var i = 0, navsEndIndex = Object.keys(navs).length - 1;
            	for(var apiId in navs){
            		var nav = navs[apiId];
            		
            		if(nav.path && nav.cls && (!nav.children || nav.children.length == 0)){
            			this._createNav_single(navUlParent, nav);
            		}else{
            			this._createNav_multi(navUlParent, nav);
            		}
            		
            		if(i++ != navsEndIndex){
            			navUlParent.append($('<li class="splic"><div></div></li>'));
            		}
            	}
                
                var acs = navUlParent.find('li>a.ac');
                if(acs.length > 0){
                    $(acs[0]).click();
                }
            }));
        },
        
        _genNavObject: function(menu){
        	return {name: menu.api_NM, path: menu.api_URL, cls: menu.api_CLS, args: menu.api_ARGS, children: []};
        },
        
        _createNav_single: function(navUlParent, data){
        	var li = $('<li><a href="javascript:void(0);" class="ac">'+ data.name +'</a></li>');
        	
        	li.find('a').click(lang.hitch(this, function(e){
        		this._action_created(li, data);
        	}));
        	
    		navUlParent.append(li);
        },
        
        _createNav_multi: function(navUlParent, data){
        	var dd = $('<li class="dropdown"><a href="javascript:void(0);" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">'
        		+ data.name +' <span class="caret"></span></a><ul class="dropdown-menu"></ul></li>');
        	
        	var ddMenu = dd.find('ul.dropdown-menu');
        	
        	for(var i=0; i<data.children.length; i++){
        		lang.hitch(this, (function(child){
        			var li = $('<li><a href="javascript:void(0);" class="ac">'+ child.name +'</a></li>');
            		
            		li.find('a').click(lang.hitch(this, function(e){
                		this._action_created(dd, child);
                	}));
            		
            		ddMenu.append(li);
        			
        		}))(data.children[i]);
        	}
        	
    		navUlParent.append(dd);
        },
        
        _action_default: function(curParent, e){
            var curNode = $(e.currentTarget);
        	
            switch(curNode.attr('data')){
                case 'infoBrief':
                	curParent.toggleClass('active');
                    topic.publish('index/infoBrief', {'kind': curParent.hasClass('active')? 'show':'hide'});
                    
                    this._hideToggleMenuAfterClick();
                    
                    return;
                    
                case 'exit':
                    base.confirm('确认', '退出平台？', lang.hitch(this, function(){
                        this._exit();
                        
                    }), lang.hitch(this, function(){
                    	this._hideToggleMenuAfterClick();
                    }));
                    
                    return;
                    
                case 'create':
                    this._action_created(curParent, {cls: curNode.attr('cls'), path: curNode.attr('path'), args: null});
                    return;
                
                default:
                    return;
            }
        },
        
        _action_created: function(curParent, data){
        	if(this._changeActive(curParent, data.cls)){
        		topic.publish('index/create', data);
        		
        		this._hideToggleMenuAfterClick();
        	}
        },
        
        _hideToggleMenuAfterClick: function(){
        	var btn = $(this.domNode).find('.navbar-toggle');
        	if(btn.is(':visible') && !btn.hasClass('collapsed')){
        		btn.click();
        	}
        },
        
        _changeActive: function(curParent, actionStr){
        	if(!this.preActionStr || this.preActionStr != actionStr){
        		this.preActionStr = actionStr;
                
                $(this.domNode).find('.navbar-nav>li').not(curParent).removeClass('active');
                curParent.addClass('active');
                
                return true;
            }
        	
        	return false;
        },
        
        _exit: function(){
            //exit all
            $.when(
                this._exitInUrl(base.getServerNM() + 'platformApi/own/sys/normal/signout')
                //this._exitInUrl(base.getServerNM('file') + 'fileApi/own/sys/normal/signout')   //session is managed in redis, only need to clear it from platform
            ).done(function(){
                location.href = base.getServerNM();
            }).fail(function(){
                base.error('错误', '退出平台出现异常');
            });
        },
        
        _exitInUrl: function(url){
            var def = $.Deferred();
            base.ajax({
                url: url
            }).success(function(){
                def.resolve();
            }).fail(function(){
                def.reject();
            });
            
            return def.promise();
        },
        
        _initEvents: function () {
        	var sub1 = topic.subscribe('topInfo/refreshInfo', lang.hitch(this, function(data){
                var node = $(this.domNode).find('span.badge');
                
                if(!base.isNull(data.bdSize)){
                    node.html(parseInt(data.bdSize)>0? data.bdSize : '');
                    
                }else if(!base.isNull(data.increment)){
                    var current = parseInt(node.html());
                    if(isNaN(current)){
                        current = 0;
                    }
                    
                    current += parseInt(data.increment);
                    
                    node.html(current>0? current : '');
                }
            }));
            
            this.own(sub1);
        }
    });
});
