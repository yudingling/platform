
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    'root/spin/Spin',
    'root/slider/Slider',
    "root/customScrollbar/CustomScrollBar",
    "./widget/monitorMap/monitorMap",
    "./widget/searchBox/searchBox",
    "dojo/text!./template/dataMonitor.html",
    "tool/css!./css/dataMonitor.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        Spin,
        Slider,
        CustomScrollBar,
        MonitorMap,
        SearchBox,
        template){
    
    return declare("component.dataMonitor", [_Widget], {
        baseClass: "component_dataMonitor",
        templateString: template,
        
        selfAuth: true,
        
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
            
            this.defer(lang.hitch(this, function(){
                CustomScrollBar.init($(this.domNode).find('.customscrollbar'));
                
            }), 500);
        },
        
        destroy: function(){
        	this.inherited(arguments);
            
            this._removeMapSpin();
            
            this._removeMenuResultSpin();
        },
        
        _initDom: function(){
            this._initMap();
            this._initSearch();
            this._initSlider();
            this._initMenu();
            
            this._initMenuAction();
            this._initServiceLink();
        },
        
        _initServiceLink: function(){
            //ajax data
            base.ajax({
                url: base.getServerNM() + 'platformApi/own/thirdparty/normal/quickLink'
            }).success(lang.hitch(this, function(ret){
                var link = ret.data;
                
                var parent = $(this.domNode).find('.menuFix .menuContainer .serviceLink');
                for(var i=0; i<link.length; i++){
                    parent.append(this._createServiceLink(link[i]));
                }
            }));
            
            var span = $(this.domNode).find('.iframeContainer>.iframeNav>div>span');
            
            $(this.domNode).find('.iframeContainer>.iframeNav>i').click(lang.hitch(this, function(){
                span.hide().css('margin-left', '-' + (span.outerWidth() + 20) + 'px');
                
                $(this.domNode).removeClass('iframeShow');
            }));
            
            span.on('webkitTransitionEnd transitionend', lang.hitch(this, function(e){
                if(parseInt(span.css('margin-left')) < 0){
                    span.hide();
                }
            }));
            
            $(this.domNode).find('.iframeContainer>.iframeNav').hover(lang.hitch(this, function(){
                span.show().css('margin-left', '0px');

            }),lang.hitch(this, function(){
                span.css('margin-left', '-' + (span.outerWidth() + 20) + 'px');
            }));
        },
        
        _createServiceLink: function(linkData){
            return $('<li>' + linkData.tps_NM + '</li>').click(lang.hitch(this, function(){
                this._hideMenu(lang.hitch(this, function(){
                    base.ajax({
                        url: base.getServerNM() + linkData.api_URL.substr(1) + '?tokenId=' + linkData.usp_TOKEN
                    }).success(lang.hitch(this, function(ret){
                        $(this.domNode).addClass('iframeShow');
                        
                        var spanTitle = $(this.domNode).find('.iframeContainer>.iframeNav span.title').text(linkData.tps_NM);
                        spanTitle.css('margin-left', '-' + (spanTitle.outerWidth() + 20) + 'px');
                        
                        $(this.domNode).find('.iframeContainer>iframe').unbind().one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){
                            $(this).removeClass('animated fadeInRight');
                        }).addClass('animated fadeInRight').attr('src', ret.data);
                    }));
                }));
            }));
        },
        
        _initSearch: function(){
            this.searchBox = new SearchBox({
                emptySearch: false,
                placeholder: '搜索设备',
                search: lang.hitch(this, function(txt){
                    txt = txt.trim();
                    if(txt.length > 0){
                        this._search(txt);
                    }
                }),
                remove: lang.hitch(this, function(){
                    this._hideLeftSlider();
                }),
                menuClick: lang.hitch(this, function(){
                    this._showMenu();
                }),
                txtChanged: lang.hitch(this, function(txt){
                    txt = txt.trim();
                    if(txt.length > 0){
                        this._prompt(txt);
                    }
                })
            });
            $(this.domNode).find('.mainSearch').append($(this.searchBox.domNode));
            this.searchBox.startup();
            this.own(this.searchBox);
        },
        
        _search: function(txt){
            this._clearMenuResult();
            
            if(!this.searchComponent){
                base.newDojo("component/dataMonitor/widget/search/search", "search", null).success(lang.hitch(this, function(obj){
                    this.searchComponent = obj;
                    $(this.domNode).find('.leftSlider .searchResult>.searchResultContainer').append($(this.searchComponent.domNode));

                    this.searchComponent.startup();
                    this.own(this.searchComponent);
                    
                    this.searchComponent.refresh(txt);
                }));
                
            }else{
                this.searchComponent.refresh(txt);
            }
        },
        
        _searchFinished: function(){
            this.searchBox.finish();
            
            $(this.domNode).find('.leftSlider .sliderResult').addClass('s1');
            this._showLeftSlider();
        },
        
        _prompt: function(txt){
            base.ajax({
                url: base.getServerNM() + "platformApi/own/client/normal/discovery/search/prompt",
                type: 'GET',
                data: $.extend({search: txt, maxCount: 5}, this.map.getBoundary())
            }).success(lang.hitch(this, function(ret){
                this.searchBox.prompt(ret.data);
            }));
        },
        
        _initMenu: function(){
            $(this.domNode).find('.leftSlider .sliderResult .menuResult .menuS').click(lang.hitch(this, function(){
                this._showMenu();
            }));
            
            $(this.domNode).find('.menuFix>.menuPanel>.menuHeader>i.fa').click(lang.hitch(this, function(){
                this._hideMenu();
            }));
        },
        
        _showMenu: function(){
            var menuFix = $(this.domNode).find('.menuFix');
            var menuShim = menuFix.find('.menuShim');
            var menuHideFa = $(this.domNode).find('.menuFix>.menuPanel>.menuHeader>i.fa');
            
            menuShim.css('z-index', '12');
            menuShim.one('click', function(e){
                menuHideFa.click();
                e.stopPropagation();
            });
            menuFix.addClass('shown');
        },
        
        _hideMenu: function(callBack){
            var menuFix = $(this.domNode).find('.menuFix');
            var menuShim = menuFix.find('.menuShim');
            
            menuFix.removeClass('shown');
            menuShim.one('webkitTransitionEnd transitionend', function(event){
                menuShim.css('z-index', '-1');
                menuShim.off('webkitTransitionEnd transitionend');
                
                if(callBack){
                    callBack();
                }
            });
        },
        
        _initMenuAction: function(){
            $(this.domNode).find('.menuFix .menuContainer .menuLink li').click(lang.hitch(this, function(e){
                var data = $(e.currentTarget).attr('data');
                
                this._hideMenu(lang.hitch(this, function(){
                    this.searchBox.reset();
                    
                    $(this.domNode).find('.mainSearch').hide();
                    $(this.domNode).find('.leftSlider .sliderResult').removeClass('s1');
                    
                    this._showLeftSlider();
                    this._refreshMenuResult(data);
                }));
            }));
            
            $(this.domNode).find('.leftSlider .sliderResult .menuResult .closeMenu').click(lang.hitch(this, function(){
                this._hideLeftSlider();
                this._clearMenuResult();
                
                $(this.domNode).find('.mainSearch').show();
            }));
        },
        
        _initSlider: function(){
            this.leftSlider = new Slider($(this.domNode).find('.leftSlider'), {
                dependObj: $(this.domNode).find('.mainMap'),
                position: {top: '0px', left: '0px', bottom: '0px'},
                direction: 'right',
                animateWhenHide: true,
                easing: 'linear',/*'easeOutCirc',*/
                opacity: 0.85,
                backgroundColor: '#fff',
                width: 394,
                zindex: null,
                showOnInit: false,
                retainSize: 0,
                pullBtn: true,
                customscrollbar: false,
                animateMs: 200
            });

            this.own(this.leftSlider);
        },
        
        _showLeftSlider: function(){
            this.leftSlider.show(false);
            $(this.domNode).find('.leftSlider .sliderResult').css('opacity', '1');
        },
        
        _hideLeftSlider: function(){
            $(this.domNode).find('.leftSlider .sliderResult').css('opacity', '0');
            this.leftSlider.hide(true, false);
        },
        
        _initMap: function(){
            var mapDom = $(this.domNode).find('.mainMap');
            this.mapSpin = new Spin(mapDom);
            
        	this.map = new MonitorMap({center: [76.016, 44.159], zoom: 5, toolboxPos: 1});
            mapDom.append($(this.map.domNode));
            
            this.map.startup();
            this.own(this.map);
        },
        
        _removeMapSpin: function(){
            if(this.mapSpin){
                this.mapSpin.destroy();
                this.mapSpin = null;
            }
        },
        
        _removeMenuResultSpin: function(){
            if(this.menuResultSpin){
                this.menuResultSpin.destroy();
                this.menuResultSpin = null;
            }
        },
        
        _refreshMenuResult: function(menuData){
            this._clearMenuResult();
            
            this.menuResultSpin = new Spin($(this.domNode).find('.leftSlider .menuResult'));
            
            //menu content widget get a same name with menuData 
            var path = "component/dataMonitor/widget/" + menuData + "/" + menuData;
            base.newDojo(path, "menuData", null).success(lang.hitch(this, function(obj){
                this.menuResult = obj;
                $(this.domNode).find('.leftSlider .menuResult').append($(obj.domNode));
                
                this.menuResult.startup();
                this.own(this.menuResult);
            })).fail(function(){
                this._removeMenuResultSpin();
            });
        },
        
        _clearMenuResult: function(){
            if(this.menuResult){
                this.menuResult.destroyRecursive();
                this.menuResult = null;
            }
            
            this._removeMenuResultSpin();
        },
        
        _metaShowExpand: function(data){
            topic.publish('component/dataMonitor/widget/clientPrevCard/hideMetaList');
            
            if(this.currentModal){
                this.currentModal.destroyRecursive();
            }
            
            base.newDojo("component/dataMonitor/widget/metadataShow/metadataShow", "metadataShow", data).success(lang.hitch(this, function(obj){
                this.currentModal = obj;
                $(this.domNode).find('.modal .modal-body').append($(this.currentModal.domNode));
                this.currentModal.startup();
                
                this.own(this.currentModal);
                
                $(this.domNode).find('.modal .modal-title').html(data.c_NM);
                
                $(this.domNode).find('.modal').modal({backdrop: 'static', keyboard: false});
            }));
        },
        
        _initEvents: function () {
            var sub1 = topic.subscribe('root/map/shown', lang.hitch(this, function(data){
                this._removeMapSpin();
            }));
            var sub2 = topic.subscribe('root/slider/show', lang.hitch(this, function(data){
                if(data.hasClass('leftSlider')){
                    var mainSearch = $(this.domNode).find('.mainSearch');
                    if(mainSearch.is(':visible')){
                        mainSearch.removeClass('slide');
                    }
                    
                    topic.publish('component/dataMonitor/transition', {x: 394});
                }
            }));
            var sub3 = topic.subscribe('root/slider/hide', lang.hitch(this, function(data){
                if(data.hasClass('leftSlider')){
                    var mainSearch = $(this.domNode).find('.mainSearch');
                    if(mainSearch.is(':visible') && data.parent().is(':visible')){
                        $(this.domNode).find('.mainSearch').addClass('slide');
                    }
                    
                    topic.publish('component/dataMonitor/transition', {x: -394});
                }
            }));
            var sub4 = topic.subscribe('component/dataMonitor/menuResultShown', lang.hitch(this, function(data){
                this._removeMenuResultSpin();
            }));
            var sub5 = topic.subscribe('component/dataMonitor/searchFinished', lang.hitch(this, function(data){
                this._searchFinished();
            }));
            var sub6 = topic.subscribe('component/dataMonitor/metaShowExpand', lang.hitch(this, function(data){
                if(data){
                    this._metaShowExpand(data);
                }
            })); 
            
            this.own(sub1);
            this.own(sub2);
            this.own(sub3);
            this.own(sub4);
            this.own(sub5);
            this.own(sub6);
        }
    });
});
