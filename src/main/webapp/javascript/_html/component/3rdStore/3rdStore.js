
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    'root/spin/Spin',
    "root/dropdownBox/DropdownBox",
    "root/customScrollbar/CustomScrollBar",
    "root/brandHref/BrandHref",
    "root/blurFilter/blurFilter",
    "./widget/3rdServiceInfo/3rdServiceInfo",
    "dojo/text!./template/3rdStore.html",
    "tool/css!./css/3rdStore.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        Spin,
        DropdownBox,
        CustomScrollBar,
        BrandHref,
        BlurFilter,
        ServiceInfo,
        template){
    
    return declare("component.3rdStore", [_Widget], {
        baseClass: "component_3rdStore",
        templateString: template,
        
        selfAuth: true,
        
        constructor: function (args) {
            declare.safeMixin(this, args);
            
            this.brands = {};
            this.cachedDetails = {};
            
            this._initEvents();
        },
        
        postCreate: function () {
            this.inherited(arguments);
            
            this._initDom();
        },
        
        startup: function () {
            this.inherited(arguments);
            
            this.defer(lang.hitch(this, function(){
                CustomScrollBar.init($(this.domNode).find('.customScrollBar'));
                
                this._search();
                
            }), 500);
        },
        
        destroy: function(){
        	this.inherited(arguments);
            
            this._clearBrands();
            $(this.domNode).find('.content>div.components>.bottom .svContainer>.svItem>.itemDesc>div *[title]').tooltip('destroy');
            
            this._destroyUsingObj();
        },
        
        _clearBrands: function(){
            for(var key in this.brands){
                this.brands[key].destroy();
            }
            
            this.brands = {};
        },
        
        _initDom: function(){
            var navs = $(this.domNode).find('.navbar ul.nav>li[data]');
        	navs.click(lang.hitch(this, function(e){
                var cur = $(e.currentTarget);
                if(!cur.hasClass('active')){
                    navs.not(cur).removeClass('active');
                    cur.addClass('active');
                    
                    //may change the catalog group in the future
                }
            }));
            
            this.sort = new DropdownBox($(this.domNode).find('.components>.top div.sort'), {
                minWidth: 60,
			    dropMinWidth: 80,
                options: [{name: '热门', value: 'hot'}, {name: '最新', value: 'tm'}],
                onclick: lang.hitch(this, function(name, value){
                    this._search();
                })
            });
            this.sort.select('hot', true);
            this.own(this.sort);
            
            this.filter = new DropdownBox($(this.domNode).find('.components>.top div.filter'), {
                minWidth: 60,
			    dropMinWidth: 80,
                options: [{name: '默认', value: 'default'}, {name: '免费', value: 'free'}, {name: '我发布的', value: 'mine'}, {name: '在使用的', value: 'used'}],
                onclick: lang.hitch(this, function(name, value){
                    this._search();
                })
            });
            this.filter.select('default', true);
            this.own(this.filter);
            
            $(this.domNode).find('.components>.top>.search .serviceTxt, .components>.top .currentPage').keydown(lang.hitch(this, function(event){
                if(event.which == 13){
                	this._search();
                }
            }));
            $(this.domNode).find('.components>.top>.search .serviceTxt, .components>.top .fa.fa-search').click(lang.hitch(this, function(event){
                this._search();
            }));
            
            $(this.domNode).find('.components>.top i.fa-arrow-right').click(lang.hitch(this, function(event){
                if(!base.isNull(this.totalPage)){
                    var curPageNode = $(this.domNode).find('.components>.top .currentPage');
                    var cur = parseInt(curPageNode.val());
                    if(cur < this.totalPage){
                        curPageNode.val(cur + 1);
                        
                        this._search();
                    }
                }
            }));
            
            $(this.domNode).find('.components>.top i.fa-arrow-left').click(lang.hitch(this, function(event){
                if(!base.isNull(this.totalPage)){
                    var curPageNode = $(this.domNode).find('.components>.top .currentPage');
                    var cur = parseInt(curPageNode.val());
                    if(cur > 1){
                        curPageNode.val(cur - 1);
                        
                        this._search();
                    }
                }
            }));
            
            $(this.domNode).find('.menuFix>.menuPanel>.menuHeader>i.fa').click(lang.hitch(this, function(){
                this._hideMenu();
            }));
        },
        
        _showService: function(data){
            if(!this.svInfo){
                this.svInfo = new ServiceInfo();
                $(this.domNode).find('.components>.bottom .menuFix .svDesc').append($(this.svInfo.domNode));
                this.svInfo.startup();
                
                this.own(this.svInfo);
            }
            
            var detailData = this.cachedDetails[data.tps_ID];
            var used = !base.isNull(this.usedServiceMap[data.tps_ID]);
            
            if(detailData){
                this._showMenu(detailData);
                
                this.svInfo.refresh(detailData, used);
            }else{
                base.ajax({
                    url: base.getServerNM() + 'platformApi/own/thirdparty/normal/detail',
                    data: {
                        tpsId: data.tps_ID
                    }
                }).success(lang.hitch(this, function(ret){
                    detailData = ret.data;
                    this.cachedDetails[data.tps_ID] = detailData;
                    
                    this._showMenu(detailData);
                    
                    this.svInfo.refresh(detailData, used);
                }));
            }
        },
        
        _showMenu: function(detailData){
            var menuFix = $(this.domNode).find('.menuFix');
            if(!menuFix.hasClass('shown')){
                $(this.domNode).find('.menuFix>.menuPanel>.menuHeader>span').text(detailData.tps_NM);
                
                var menuShim = menuFix.find('.menuShim');
                var menuHideFa = $(this.domNode).find('.menuFix>.menuPanel>.menuHeader>i.fa');

                menuShim.css('z-index', '4');
                menuShim.one('click', function(e){
                    menuHideFa.click();
                    e.stopPropagation();
                });
                menuFix.addClass('shown');
            }
        },
        
        _hideMenu: function(){
            var menuFix = $(this.domNode).find('.menuFix.shown');
            if(menuFix && menuFix.length > 0){
                var menuShim = menuFix.find('.menuShim');
            
                menuFix.removeClass('shown');
                menuShim.one('webkitTransitionEnd transitionend', function(event){
                    menuShim.css('z-index', '-1');
                    menuShim.off('webkitTransitionEnd transitionend');
                });
            }
        },
        
        //to reduce twinkle, we use replace instead of remove old item
        _clear: function(node, newCount){
            node.children('div.empty').remove();
            this._clearBrands();
            node.find('.svItem>.itemDesc>div *[title]').tooltip('destroy');
            
            var children = node.children();
            if(base.isNull(newCount) || newCount == 0){
                children.remove();
                
            }else if(children.length > newCount){
                for(var i=newCount; i<children.length; i++){
                    $(children[i]).remove();
                }
            }
        },
        
        _getUsedServices: function(callback){
            if(this.usedServiceMap){
                callback();
            }else{
                base.ajax({
                    url: base.getServerNM() + 'platformApi/own/thirdparty/normal/used'
                }).success(lang.hitch(this, function(ret){
                    this.usedServiceMap = {};
                    
                    var data = ret.data;
                    for(var i=0; i<data.length; i++){
                        this.usedServiceMap[data[i]] = data[i];
                    }
                    
                    callback();
                }));
            }
        },
        
        _search: function(){
            this._hideMenu();
            
            var pageSize = 15;
            
            var curPageNode = $(this.domNode).find('.components>.top .currentPage');
            var curPage = parseInt(curPageNode.val());
            if(isNaN(curPage) || curPage < 1){
                curPage = 1;
                curPageNode.val(curPage);
            }
            if(!base.isNull(this.totalPage) && this.totalPage > 0){
                if(curPage > this.totalPage){
                    curPage = this.totalPage;
                    curPageNode.val(this.totalPage);
                }
            }
            
            var svContainer = $(this.domNode).find('.components>.bottom .svContainer');
            
            base.ajax({
                url: base.getServerNM() + 'platformApi/own/thirdparty/normal/servceList',
                data: {
                    sort: this.sort.getCurrentSelect().value,
                    filter: this.filter.getCurrentSelect().value,
                    search: $(this.domNode).find('.components>.top>.search .serviceTxt').val(),
                    start: (curPage - 1) * pageSize,
                    length: pageSize
                }
            }).success(lang.hitch(this, function(ret){
                this._getUsedServices(lang.hitch(this, function(){
                    var data = ret.data[1];
                
                    this._clear(svContainer, data.length);

                    if(data.length > 0){
                        for(var i=0; i<data.length; i++){
                            this._createItem(i, svContainer, data[i]);
                        }
                        
                        svContainer.find('.svItem>.itemDesc>div *[title]').tooltip({
                            container: 'body',
                            placement: 'auto bottom',
                            trigger: 'hover'
                        });
                        
                    }else{
                        svContainer.append('<div class="empty">暂无更多数据!</div>');
                    }

                    this.totalPage = Math.ceil(parseInt(ret.data[0]) / pageSize);
                    $(this.domNode).find('.components>.top .totalPage').text(this.totalPage);
                    if(this.totalPage == 0){
                        curPageNode.val(0);
                    }
                }));
                
            })).fail(lang.hitch(this, function(){
                $(this.domNode).find('.components>.top .currentPage').val('0');
                $(this.domNode).find('.components>.top .totalPage').val('0');
                
                svContainer.children().remove();
                svContainer.append('<div class="empty">获取数据失败!</div>');
                
            }));
        },
        
        _createItem: function(i, parent, data){
            var item = i>=0? parent.children(':nth-child('+ (i+1) +')') : null;
            
            if(!item || item.length == 0){
                var strTmp = '<div class="svItem">'
                    +  '<div class="itemImg">'
                    +       '<div class="imgDiv"></div>'
                    +       '<div class="ii imgFix"></div>'
                    +       '<div class="ii imgDesc"><span></span></div>'
                    +   '</div>'
                    +   '<div class="itemDesc">'
                    +       '<span></span>'
                    +       '<div style="margin-top: 8px;">'
                    +           '<span><i class="fa fa-user"></i><span class="usedCount" style="margin-left: 5px;"></span></span>'
                    +           '<span class="fee pull-right"></span>'
                    +       '</div>'
                    +   '</div>'
                    +  '</div>';
                
                item = $(strTmp);
                
                parent.append(item);
            }
            
            item.data('data', data).attr('tpsId', data.tps_ID);
            
            item.unbind().click(lang.hitch(this, function(){
                this._showService(data);
            }));
            
            if(this.usedServiceMap[data.tps_ID]){
                this.brands[data.tps_ID] = this._createBrand(item);
            }
            
            var imgDiv = item.find('.itemImg>.imgDiv');
            BlurFilter.init(imgDiv, {
                img: base.getServerNM('file') + 'fileApi/own/3rdService?fileId=' + data.tps_IMG,
                blur: '0px'
            });
            
            item.hover(function(){
                BlurFilter.update(imgDiv, '2px');
            }, function(){
                BlurFilter.update(imgDiv, '0px');
            });
            
            item.find('.itemImg>.imgDesc>span').text(base.subDescription(data.tps_BRIEF, 100));
            
            var nameNode = item.find('.itemDesc>span');
            var nameStr = base.subDescription(data.tps_NM, 32);
            nameNode.text(nameStr);
            if(nameStr.length < data.tps_NM.length){
                nameNode.attr('title', data.tps_NM);
            }
            
            item.find('.itemDesc .usedCount').text(data.tps_USED);
            
            var feeNode = item.find('.itemDesc .fee').html($(this._getFeeString(data)));
            
            var reliabledNode = item.find('.itemDesc .reliable');
            if(base.isNull(data.tps_RELIABLE)){
                reliabledNode.remove();
                
            }else if(reliabledNode.length == 0){
                feeNode.before($('<i class="reliable fa fa-shield" style="margin-left: 15px;"></i>'));
            }
        },
        
        _useOne: function(tpsId){
            this.usedServiceMap[tpsId] = tpsId;
            
            var node = $(this.domNode).find('.components>.bottom .svContainer>.svItem[tpsId="'+ tpsId +'"]');
            if(node.length > 0){
                this.brands[tpsId] = this._createBrand(node);
                
                var data = this.cachedDetails[tpsId];
                if(data){
                    data.tps_USED = parseInt(data.tps_USED) + 1;
                    
                    node.find('.itemDesc .usedCount').text(data.tps_USED);
                }
            }
        },
        
        _createBrand: function(node){
            var br = new BrandHref(node.find('.itemImg'));
            br.setInfo('已购', '#759892');
            return br;
        },
        
        _getFeeString: function(data){
            var feeTp = parseInt(data.fee_TP);
            if(feeTp == 0){
                return '<span class="free">免费</span>';
            }else if(feeTp == 1){
                
                var countNum = parseInt(data.fee_COUNT_NUM);
                var countNumStr = '';
                
                if(data.fee_COUNT_NUM < 10000){
                    countNumStr = data.fee_COUNT_NUM;
                }else{
                    var tmp = parseInt(countNum / 10000), tmp1 = countNum % 10000;
                    if(tmp1 == 0){
                        countNumStr = tmp + '万';
                    }else{
                        countNumStr = data.fee_COUNT_NUM;
                    }
                }
                
                //fee by count
                if(parseInt(data.fee_COUNT_FREE) > 0){
                    return '<span title="可试用">￥' + data.fee_COUNT_BASE + '/' + countNumStr + '次(试)</span>';
                }else{
                    return '<span>￥' + data.fee_COUNT_BASE + '/' + countNumStr + '次</span>';
                }
                
            }else if(feeTp == 2){
                //fee by time
                var canTry = parseInt(data.fee_TIME_FREE) > 0;
                var str1 = canTry? '<span title="可试用">￥' : '<span>￥';
                var str2 = canTry? '(试)</span>' : '</span>';
                
                var period = parseInt(data.fee_TIME_PERIOD);
                var tmp = parseInt(period / 30), tmp1 = period % 30;
                if(tmp == 1 && tmp1 == 0){
                    return str1 + data.fee_TIME_BASE + '/月' + str2;
                }
                
                tmp = parseInt(period / 180);
                tmp1 = period % 180;
                if(tmp == 1 && tmp1 == 0){
                    return str1 + data.fee_TIME_BASE + '/半年' + str2;
                }
                
                tmp = parseInt(period / 360);
                tmp1 = period % 360;
                if(tmp1 == 0){
                    return str1 + data.fee_TIME_BASE + '/' + (tmp == 1 ? '' : tmp) + '年' + str2;
                }
                
                return str1 + data.fee_TIME_BASE + '/' + period + '天' + str2;
            }
        },
        
        _usingService: function(detailData){
            this._destroyUsingObj();
            
            var path, cls;
            //free or the current user is the service creator
            if(parseInt(detailData.fee_TP) == 0 || base.getUid() == detailData.u_ID){
                path = 'component/3rdStore/widget/freeUse/freeUse';
                cls = '3rdStore.freeUse';
                
            }else{
                path = 'component/3rdStore/widget/purchase/purchase';
                cls = '3rdStore.purchase';
            }
            
            base.newDojo(path, cls, detailData).success(lang.hitch(this, function(obj){
                this.usingObj = obj;
                
                var modal = $(this.domNode).children('.modal').modal({backdrop: 'static', keyboard: false});
                modal.find('.modal-body').append($(this.usingObj.domNode));
                this.usingObj.startup();
            }));
        },
        
        _destroyUsingObj: function(){
            if(this.usingObj){
                this.usingObj.destroyRecursive();
                this.usingObj = null;
            }
        },
        
        _initEvents: function(){
            var sub1 = topic.subscribe('component/3rdStore/purchased', lang.hitch(this, function(data){
                this._useOne(data.tps_ID);
            }));
            var sub2 = topic.subscribe('component/3rdStore/usingService', lang.hitch(this, function(data){
                this._usingService(data);
            }));
            var sub3 = topic.subscribe('component/3rdStore/closeModal', lang.hitch(this, function(result){
                $(this.domNode).children('.modal').modal('hide');
            }));
            
            this.own(sub1);
            this.own(sub2);
            this.own(sub3);
        }
    });
});
