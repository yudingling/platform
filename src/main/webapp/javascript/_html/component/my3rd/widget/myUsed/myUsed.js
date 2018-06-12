
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "root/brandHref/BrandHref",
    "root/customScrollbar/CustomScrollBar",
    "root/blurFilter/blurFilter",
    "dojo/text!./template/myUsed.html",
    "tool/css!./css/myUsed.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        BrandHref,
        CustomScrollBar,
        BlurFilter,
        template){
    
    return declare("component.my3rd.widget.myUsed", [_Widget], {
        baseClass: "component_my3rd_widget_myUsed",
        templateString: template,
        
        constructor: function (args) {
            declare.safeMixin(this, args);
            
            this.brands = {};
            
            this._initEvents();
        },
        
        postCreate: function () {
            this.inherited(arguments);
            
            this._initDom();
        },
        
        startup: function () {
            this.inherited(arguments);
            
            this.defer(lang.hitch(this, function(){
                CustomScrollBar.init($(this.domNode).children('.customScrollBar'));
                
                this._setData();
                
            }), 500);
        },
        
        destroy: function(){
        	this.inherited(arguments);
            
            $(this.domNode).find('.svItem>.itemDesc>div *[title], .svItem>.itemDesc>div i.tg, .svItem>.itemDesc>div i.link').tooltip('destroy');
            
            this._clearBrands();
            
            this._destroyPurchase();
        },
        
        _clearBrands: function(uspId){
            if(uspId){
                var obj = this.brands[uspId];
                if(obj){
                    obj.destroy();
                    delete this.brands[uspId];
                }
            }else{
                for(var key in this.brands){
                    this.brands[key].destroy();
                }

                this.brands = {};
            }
        },
        
        _initDom: function(){
        },
        
        _showService: function(data){
            topic.publish('component/my3rd/loadService', data);
        },
        
        _showServiceSuccessed: function(data){
            var feeTp = parseInt(data.fee_TP);
            var execTp = parseInt(data.tps_EXEC_TP);
            
            if(feeTp == 1 && execTp == 1){
                var endStrNode = $(this.domNode).find('.svContainer>.svItem[uspId="'+ data.usp_ID +'"] .itemDesc .endStr');
                
                if(endStrNode && endStrNode.length > 0 && base.getUid() != data.u_ID){
                    //here we just increase the 'api_UNFREE_USED' field to reduce the remains of count
                    data.api_UNFREE_USED = parseInt(data.api_UNFREE_USED) + 1;
                    
                    endStrNode.text(this._getEndStr(data));
                }
            }
        },
        
        _feeService: function(data){
            this._destroyPurchase();
            
            base.newDojo(
                'component/my3rd/widget/myUsed/widget/purchase/purchase', 
                'my3rd.myUsed.purchase', 
                data
            ).success(lang.hitch(this, function(obj){
                this.purchaseObj = obj;
                
                var modal = $(this.domNode).children('.modal').modal({backdrop: 'static', keyboard: false});
                modal.find('.modal-title').text(data.tps_NM);
                modal.find('.modal-body').append($(this.purchaseObj.domNode));
                this.purchaseObj.startup();
            }));
        },
        
        _destroyPurchase: function(){
            if(this.purchaseObj){
                this.purchaseObj.destroyRecursive();
                this.purchaseObj = null;
            }
        },
        
        _setData: function(){
            var svContainer = $(this.domNode).find('.svContainer');
            
            base.ajax({
                url: base.getServerNM() + 'platformApi/own/thirdparty/normal/usedList'
            }).success(lang.hitch(this, function(ret){
                var data = ret.data;
                
                if(data.length > 0){
                    for(var i=0; i<data.length; i++){
                        this._createItem(svContainer, data[i]);
                    }
                    
                }else{
                    svContainer.append('<div class="empty">暂无更多数据!</div>');
                }
                
            })).fail(lang.hitch(this, function(){
                svContainer.append('<div class="empty">获取数据失败!</div>');
            }));
        },
        
        _appendData: function(tpsId){
            var svContainer = $(this.domNode).find('.svContainer');
            
            base.ajax({
                url: base.getServerNM() + 'platformApi/own/thirdparty/normal/usedList',
                data: {
                    tpsIds: JSON.stringify([tpsId])
                }
            }).success(lang.hitch(this, function(ret){
                var data = ret.data;
                
                if(data.length > 0){
                    for(var i=0; i<data.length; i++){
                        this._createItem(svContainer, data[i]);
                    }
                }
            }));
        },
        
        _createItem: function(parent, data){
            var strTmp = '<div class="svItem">'
                +  '<div class="itemImg">'
                +       '<div class="imgDiv"></div>'
                +       '<div class="ii imgFix"></div>'
                +       '<div class="ii imgDesc"><span></span></div>'
                +   '</div>'
                +   '<div class="itemDesc">'
                +       '<span></span>'
                +       '<div style="margin-top: 8px;">'
                +           '<span class="endStr" style="margin-right: 15px;"></span>'
                +           '<span class="icons pull-right"></span>'
                +       '</div>'
                +   '</div>'
                +  '</div>';
                
            var item = $(strTmp).data('data', data).attr('uspId', data.usp_ID);
            parent.append(item);
            
            var imgDiv = item.find('.itemImg>.imgDiv');
            BlurFilter.init(imgDiv, {
                img: base.getServerNM('file') + 'fileApi/own/3rdService?fileId=' + data.tps_IMG,
                blur: '0px'
            });
            
            var nameNode = item.find('.itemDesc>span');
            
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
            nameNode.text(nameStr);
            if(nameStr.length < data.tps_NM.length){
                nameNode.attr('title', data.tps_NM);
            }
            
            if(parseInt(data.fee_TP) == 0 || base.getUid() == data.u_ID){
                item.find('.itemDesc .endStr').hide();
            }else{
                item.find('.itemDesc .endStr').text(this._getEndStr(data));
            }
            
            if(parseInt(data.tps_STATUS) == -1){
                this.brands[data.usp_ID] = this._createBrand(item, '被禁用', '#ed5565');
                
            }else{
                if(parseInt(data.needFee) == 1){
                    item.addClass('needFee').find('.itemImg>.imgDesc>span').text('购买');
                    item.find('.itemImg').css('cursor', 'pointer').click(lang.hitch(this, function(){
                        this._feeService(data);
                    }));
                    
                    item.hover(function(){
                        BlurFilter.update(imgDiv, '2px');
                    }, function(){
                        BlurFilter.update(imgDiv, '0px');
                    });

                }else{
                    item.find('.itemImg').css('cursor', 'pointer').click(lang.hitch(this, function(){
                        this._showService(data);
                    }));
                }
                
                var iconNode = item.find('.itemDesc .icons').html(this._getIconString(data));
                if(parseInt(data.usp_ENABLED) == 0){
                    this.brands[data.usp_ID] = this._createBrand(item, '已停止', '#e69b31');
                }

                var reliabledNode = item.find('.itemDesc .reliable');
                if(base.isNull(data.tps_RELIABLE)){
                    reliabledNode.remove();

                }else if(reliabledNode.length == 0){
                    iconNode.before($('<i class="reliable fa fa-shield" title="已认证" style="color: #8baf04"></i>'));
                }
            }
            
            item.find('.itemDesc>div *[title]').tooltip({
                container: 'body',
                placement: 'auto bottom',
                trigger: 'hover'
            });
        },
        
        _createBrand: function(node, title, color){
            var br = new BrandHref(node.find('.itemImg'));
            br.setInfo(title, color);
            return br;
        },
        
        _getEndStr: function(data){
            var feeTp = parseInt(data.fee_TP);
            
            if(feeTp == 1){
                var remainCount = 0;
                var freeTotal = parseInt(data.api_FREE_TOTAL);
                if(freeTotal < 0){
                    remainCount = parseInt(data.api_UNFREE_TOTAL) - parseInt(data.api_UNFREE_USED);
                }else{
                    remainCount = freeTotal - parseInt(data.api_FREE_USED) + parseInt(data.api_UNFREE_TOTAL) - parseInt(data.api_UNFREE_USED);
                }
                
                return '可用次数 ' + remainCount;
                
            }else if(feeTp == 2){
                return '使用期限 ' + (new Date(data.api_UNFREE_END)).format('yyyy-MM-dd');
            }else{
                return null;
            }
        },
        
        _stopOrStartService: function(data){
            var title = '停止服务', content = '确定要停止服务';
            if(parseInt(data.usp_ENABLED) == 0){
                title = '启动服务';
                content = '确定要启动服务';
            }
            
            base.confirmSave(title, content + '[' + data.tps_NM +']?', lang.hitch(this, function(){
                base.ajax({
                    type: 'PUT',
                    url: base.getServerNM() + 'platformApi/own/thirdparty/normal/toggleUspEnabled',
                    data: {
                        uspId: data.usp_ID
                    }
                }).success(lang.hitch(this, function(ret){
                    data.usp_ENABLED = parseInt(ret.data.usp_ENABLED);
                    
                    this._changeUSPEnabledStatusOnToggle(data);
                }));
            }));
        },
        
        _changelinkedService: function(data){
            base.ajax({
                type: 'PUT',
                url: base.getServerNM() + 'platformApi/own/thirdparty/normal/toggleUspLinked',
                data: {
                    uspId: data.usp_ID
                }
            }).success(lang.hitch(this, function(ret){
                data.usp_LINKED = parseInt(ret.data.usp_LINKED);

                this._changeUSPLinkedStatusOnToggle(data);
            }));
        },
        
        _changeUSPEnabledStatusOnToggle: function(data){
            var item = $(this.domNode).find('.svContainer>.svItem[uspId="'+ data.usp_ID +'"]');
            if(data.usp_ENABLED == 0){
                this.brands[data.usp_ID] = this._createBrand(item, '已停止', '#e69b31');
            }else{
                this._clearBrands(data.usp_ID);
            }
            
            var iNode = item.find('i.tg');
            if(iNode.length > 0){
                if(data.usp_ENABLED == 0){
                    iNode.removeClass('fa-play-circle').addClass('fa-stop-circle');
                    
                }else{
                    iNode.removeClass('fa-stop-circle').addClass('fa-play-circle');
                }
            }
        },
        
        _changeUSPLinkedStatusOnToggle: function(data){
            var item = $(this.domNode).find('.svContainer>.svItem[uspId="'+ data.usp_ID +'"]');
            var iNode = item.find('i.link');
            if(iNode.length > 0){
                if(data.usp_LINKED == 0){
                    iNode.removeClass('fa-external-link-square').addClass('fa-external-link');
                    
                }else{
                    iNode.removeClass('fa-external-link').addClass('fa-external-link-square');
                }
            }
        },
        
        _getIconString: function(data){
            var execTp = parseInt(data.tps_EXEC_TP);
            var nodes = [];
            
            if(execTp == 0){
                var tgNode = null;
                if(parseInt(data.usp_ENABLED) == 0){
                    tgNode = $('<i class="tg fa fa-stop-circle"></i>');
                }else{
                    tgNode = $('<i class="tg fa fa-play-circle"></i>');
                }
                
                tgNode.click(lang.hitch(this, function(){
                    this._stopOrStartService(data);
                })).tooltip({
                    container: 'body',
                    placement: 'auto bottom',
                    trigger: 'hover',
                    title: function(){
                        return data.usp_ENABLED == 0 ? '已停止,点击启动' : '运行中,点击停止';
                    }
                });
                
                nodes.push(tgNode);
                
            }else if(!base.isMobileDevice()){
                var linkedNode = null;
                if(parseInt(data.usp_LINKED) == 0){
                    linkedNode = $('<i class="link fa fa-external-link"></i>');
                }else{
                    linkedNode = $('<i class="link fa fa-external-link-square"></i>');
                }
                
                linkedNode.click(lang.hitch(this, function(){
                    this._changelinkedService(data);
                })).tooltip({
                    container: 'body',
                    placement: 'auto bottom',
                    trigger: 'hover',
                    title: function(){
                        return data.usp_LINKED == 0 ? '添加首页链接' : '取消首页链接';
                    }
                });
                
                nodes.push(linkedNode);
            }
            
            var feeTp = parseInt(data.fee_TP);
            if(parseInt(data.fee_TP) != 0 && base.getUid() != data.u_ID){
                feeNode = $('<i class="fa fa-shopping-cart" title="购买"></i>');
                feeNode.click(lang.hitch(this, function(){
                    this._feeService(data);
                }));
                
                nodes.push(feeNode);
            }
            
            return nodes;
        },
        
        _afterPayed: function(paiedData){
            var item = $(this.domNode).find('.svContainer>.svItem[uspId="'+ paiedData.usp_ID +'"]');
            
            var data = item.removeClass('needFee').data('data');
            item.unbind('hover');
            
            $.extend(data, {needFee: 0}, paiedData);
            
            item.find('.itemDesc .endStr').text(this._getEndStr(data));
        },
        
        _initEvents: function(){
            var sub1 = topic.subscribe('component/my3rd/widget/myUsed/afterPayed', lang.hitch(this, function(data){
                this._afterPayed(data);
            }));
            var sub2 = topic.subscribe('component/my3rd/widget/myUsed/closeModal', lang.hitch(this, function(data){
                $(this.domNode).children('.modal').modal('hide');
            }));
            var sub3 = topic.subscribe('component/my3rd/loadService/success', lang.hitch(this, function(data){
                this._showServiceSuccessed(data);
            }));
            //for mobile using. (my3rd and 3rdStore are on the same page component in mobile)
            var sub4 = topic.subscribe('component/3rdStore/purchased', lang.hitch(this, function(data){
                this._appendData(data.tps_ID);
            }));
            
            this.own(sub1);
            this.own(sub2);
            this.own(sub3);
            this.own(sub4);
        }
    });
});
