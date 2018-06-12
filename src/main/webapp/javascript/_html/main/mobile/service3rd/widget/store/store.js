
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    'root/spin/Spin',
    "root/dropdownBox/DropdownBox",
    "root/customScrollbar/CustomScrollBar",
    "root/pageSwitch/pageSwitch",
    "root/brandHref/BrandHref",
    "component/3rdStore/widget/3rdServiceInfo/3rdServiceInfo",
    "dojo/text!./template/store.html",
    "tool/css!./css/store.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        Spin,
        DropdownBox,
        CustomScrollBar,
        PageSwitch,
        BrandHref,
        ServiceInfo,
        template){
    
    return declare("main.mobile.service3rd.store", [_Widget], {
        baseClass: "main_mobile_service3rd_store",
        templateString: template,
        
        constructor: function (args) {
            declare.safeMixin(this, args);
            
            this.brands = {};
            this.cachedDetails = {};
            
            this.pageSize = 15;
            
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
                CustomScrollBar.init($(this.domNode).find('.customScrollBar_more'), 'y', lang.hitch(this, function(){
                    this._getMore();
                }));
                this._search();
                
            }), 500);
        },
        
        destroy: function(){
        	this.inherited(arguments);
            
            this._clearBrands();
            
            this._destroyUsingObj();
        },
        
        _clearBrands: function(){
            for(var key in this.brands){
                this.brands[key].destroy();
            }
            
            this.brands = {};
        },
        
        _initDom: function(){
            this.ps = new PageSwitch($(this.domNode).find('.steps')[0], {
                duration: 600,
                direction: 0,
                start: 0,
                loop: false,
                ease: 'ease',
                transition: 'scrollX',
                freeze: false,
                mouse: false,
                mousewheel: false,
                arrowkey: false,
                autoplay: false,
                interval: 0
            });
            
            $(this.domNode).find('.components .top .fa-filter').click(lang.hitch(this, function(){
                $(this.domNode).find('.components .filterCC').toggleClass('show');
            }));
            
            this.sort = new DropdownBox($(this.domNode).find('.components .filterCC div.sort'), {
                minWidth: 60,
			    dropMinWidth: 80,
                options: [{name: '热门', value: 'hot'}, {name: '最新', value: 'tm'}],
                onclick: lang.hitch(this, function(name, value){
                    this._search();
                })
            });
            this.sort.select('hot', true);
            this.own(this.sort);
            
            this.filter = new DropdownBox($(this.domNode).find('.components .filterCC div.filter'), {
                minWidth: 60,
			    dropMinWidth: 80,
                options: [{name: '默认', value: 'default'}, {name: '免费', value: 'free'}, {name: '我发布的', value: 'mine'}, {name: '在使用的', value: 'used'}],
                onclick: lang.hitch(this, function(name, value){
                    this._search();
                })
            });
            this.filter.select('default', true);
            this.own(this.filter);
            
            $(this.domNode).find('.components .top>.search .serviceTxt').keydown(lang.hitch(this, function(event){
                if(event.which == 13){
                	this._search();
                }
            }));
            $(this.domNode).find('.components .top>.search .fa.fa-search').click(lang.hitch(this, function(event){
                this._search();
            }));
            
            $(this.domNode).find('.svDesc i.fa.return').click(lang.hitch(this, function(){
                this.ps.prev();
            }));
        },
        
        _showService: function(data){
            if(!this.svInfo){
                this.svInfo = new ServiceInfo();
                $(this.domNode).find('.svDesc .svDescInner').append($(this.svInfo.domNode));
                this.svInfo.startup();
                
                this.own(this.svInfo);
            }
            
            var detailData = this.cachedDetails[data.tps_ID];
            var used = !base.isNull(this.usedServiceMap[data.tps_ID]);
            
            if(detailData){
                this._showServiceDetail(detailData);
                
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
                    
                    this._showServiceDetail(detailData);
                    
                    this.svInfo.refresh(detailData, used);
                }));
            }
        },
        
        _showServiceDetail: function(detailData){
            $(this.domNode).find('.svDesc .svName').text(detailData.tps_NM);
            
            this.ps.next();
        },
        
        
        //to reduce twinkle, we use replace instead of remove old item
        _clear: function(node, newCount){
            node.children('div.empty').remove();
            this._clearBrands();
            
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
            this.curPage = 1;
            this.ended = false;
            
            $(this.domNode).find('.components .filterCC').removeClass('show');
            
            var svContainer = $(this.domNode).find('.components>.bottom .svContainer');
            
            base.ajax({
                url: base.getServerNM() + 'platformApi/own/thirdparty/normal/servceList',
                data: {
                    sort: this.sort.getCurrentSelect().value,
                    filter: this.filter.getCurrentSelect().value,
                    search: $(this.domNode).find('.components .top>.search .serviceTxt').val(),
                    start: (this.curPage - 1) * this.pageSize,
                    length: this.pageSize
                }
            }).success(lang.hitch(this, function(ret){
                this._getUsedServices(lang.hitch(this, function(){
                    var data = ret.data[1];
                
                    this._clear(svContainer, data.length);

                    if(data.length > 0){
                        for(var i=0; i<data.length; i++){
                            this._createItem(i, svContainer, data[i]);
                        }
                        
                    }else{
                        svContainer.append('<div class="empty">暂无更多数据!</div>');
                        this.ended = true;
                    }
                }));
                
            })).fail(lang.hitch(this, function(){
                svContainer.children().remove();
                svContainer.append('<div class="empty">获取数据失败!</div>');
            }));
        },
        
        _getMore: function(){
            var svContainer = $(this.domNode).find('.components>.bottom .svContainer');
            if(this.ended || this.loading){
                return;
            }
            
            this.loading = true;
            
            //CustomScrollBar.scrollTo($(this.domNode).find('.customScrollBar_more'), 'bottom');
            this.curPage = this.curPage + 1;
            
            base.ajax({
                url: base.getServerNM() + 'platformApi/own/thirdparty/normal/servceList',
                data: {
                    sort: this.sort.getCurrentSelect().value,
                    filter: this.filter.getCurrentSelect().value,
                    search: $(this.domNode).find('.components .top>.search .serviceTxt').val(),
                    start: (this.curPage - 1) * this.pageSize,
                    length: this.pageSize
                }
            }).success(lang.hitch(this, function(ret){
                this._getUsedServices(lang.hitch(this, function(){
                    var data = ret.data[1];
                    
                    if(data.length > 0){
                        for(var i=0; i<data.length; i++){
                            this._createItem(-1, svContainer, data[i]);
                        }
                        
                        this.defer(lang.hitch(this, function(){
                            CustomScrollBar.scrollTo($(this.domNode).find('.customScrollBar_more'), '-=90');
                        }), 600);
                        
                    }else{
                        base.info('提醒', '暂无更多数据!');
                        this.ended = true;
                    }
                    
                    this.loading = false;
                }));
                
            })).fail(function(){
                this.curPage = this.curPage - 1;
                
                this.loading = false;
            });
        },
        
        _createItem: function(i, parent, data){
            var item = i>=0? parent.children(':nth-child('+ (i+1) +')') : null;
            
            if(!item || item.length == 0){
                var strTmp = '<div class="svItem">'
                    +  '<div class="itemImg">'
                    +       '<img>'
                    +   '</div>'
                    +   '<div class="itemDesc">'
                    +       '<span></span>'
                    +       '<div style="margin-top: 8px;">'
                    +           '<span title="用户数量"><i class="fa fa-user"></i><span class="usedCount" style="margin-left: 5px;"></span></span>'
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
            
            item.find('.itemImg>img').attr('src', base.getServerNM('file') + 'fileApi/own/3rdService?fileId=' + data.tps_IMG);
            
            //calculate the string width. base on the css setting
            var strWidth = 0, parentWidth = parent.width();
            if(parentWidth <= 260){
                strWidth = parentWidth;
            }else if(parentWidth <= 500){
                strWidth = parentWidth / 2;
            }else{
                strWidth = 250;
            }
            
            var nameStr = base.subDescription(data.tps_NM, parseInt(strWidth/8));
            item.find('.itemDesc>span').text(nameStr);
            
            item.find('.itemDesc .usedCount').text(data.tps_USED);
            
            var feeNode = item.find('.itemDesc .fee').html($(this._getFeeString(data)));
            
            var reliabledNode = item.find('.itemDesc .reliable');
            if(base.isNull(data.tps_RELIABLE)){
                reliabledNode.remove();
                
            }else if(reliabledNode.length == 0){
                feeNode.before($('<i class="reliable fa fa-shield" title="已认证" style="margin-left: 15px;"></i>'));
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
