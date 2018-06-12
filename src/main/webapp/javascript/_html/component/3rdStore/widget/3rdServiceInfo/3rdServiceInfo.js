
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "dojo/text!./template/3rdServiceInfo.html",
    "tool/css!./css/3rdServiceInfo.css",
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        template){
    
    return declare("component.3rdStore.widget.3rdServiceInfo", [_Widget], {
        baseClass: "component_3rdStore_widget_3rdsinfo",
        templateString: template,
        
        /***
         * args: {
         *   isSysCheck: false
         * }
         */
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
            
            $(this.domNode).find('*[title]').tooltip('destroy');
        },
        
        refresh: function(data, used){
            this.current = data;
            
            $(this.domNode).find('.descImg>img').attr('src', base.getServerNM('file') + 'fileApi/own/3rdService?fileId=' + data.tps_IMG);
            $(this.domNode).find('.descT1 .usedCount').text(data.tps_USED);
            
            var usedSpan = $(this.domNode).find('.descT1 .used');
            var useBtn = $(this.domNode).find('button.use');
            if(used){
                usedSpan.show();
                useBtn.hide();
                
            }else{
                usedSpan.hide();
                
                var btnTitle = "使 用 (" + this._getFeeString(data) + ")";
                useBtn.show().text(btnTitle).unbind().click(lang.hitch(this, function(){
                    topic.publish('component/3rdStore/usingService', this.current);
                }));
            }
            
            if(base.isNull(data.tps_RELIABLE)){
                $(this.domNode).find('.descT1 .reliable').hide();
            }else{
                $(this.domNode).find('.descT1 .reliable').show();
                $(this.domNode).find('.descT1 .reliable span').text(data.tps_RELIABLE);
            }
            
            $(this.domNode).find('.descT1 .crtUser').text(data.u_NM);
            $(this.domNode).find('.descT1 .crtTs').text((new Date(data.crt_TS)).format('yyyy-MM-dd'));
            
            $(this.domNode).find('.brief').text(data.tps_BRIEF);
            $(this.domNode).find('.desc').text(data.tps_DESC);
            
            var authList = $(this.domNode).find('.authList');
            authList.children().remove();
            
            var lilist = [];
            for(var i=0; i<data.auth_API.length; i++){
                lilist.push($('<li>' + data.auth_API[i].api_NM + '</li>'));
            }
            authList.append(lilist);
            
            if(!base.isNull(data.tps_HELPURL) && data.tps_HELPURL.length > 0){
                $(this.domNode).find('.linkHelp').show().attr('href', data.tps_HELPURL);
            }else{
                $(this.domNode).find('.linkHelp').hide();
            }
        },
        
        _getFeeString: function(data){
            var feeTp = parseInt(data.fee_TP);
            if(feeTp == 0){
                return '免费';
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
                    return '￥' + data.fee_COUNT_BASE + '/' + countNumStr + '次，可试用' + data.fee_COUNT_FREE + '次';
                }else{
                    return '￥' + data.fee_COUNT_BASE + '/' + countNumStr + '次';
                }
                
            }else if(feeTp == 2){
                //fee by time
                var strEnd = parseInt(data.fee_TIME_FREE) > 0 ? ('，可试用' + data.fee_TIME_FREE + '天') : '';
                
                var period = parseInt(data.fee_TIME_PERIOD);
                var tmp = parseInt(period / 30), tmp1 = period % 30;
                if(tmp == 1 && tmp1 == 0){
                    return '￥' + data.fee_TIME_BASE + '/月' + strEnd;
                }
                
                tmp = parseInt(period / 180);
                tmp1 = period % 180;
                if(tmp == 1 && tmp1 == 0){
                    return '￥' + data.fee_TIME_BASE + '/半年' + strEnd;
                }
                
                tmp = parseInt(period / 360);
                tmp1 = period % 360;
                if(tmp1 == 0){
                    return '￥' + data.fee_TIME_BASE + '/' + (tmp == 1 ? '' : tmp) + '年' + strEnd;
                }
                
                return '￥' + data.fee_TIME_BASE + '/' + period + '天' + strEnd;
            }
        },
        
        _initDom: function(){
            $(this.domNode).find('*[title]').tooltip({
                container: 'body',
                placement: 'auto bottom',
                trigger: 'hover'
            });
            
            if(this.isSysCheck){
            	$(this.domNode).find('button').remove();
            	$(this.domNode).hide();
            }
        },
        
        _initEvents: function(){
            var sub1 = topic.subscribe('component/3rdStore/purchased', lang.hitch(this, function(result){
                if(this.current && this.current.tps_ID == result.tps_ID){
                    //here we should not set useCount to 'parseInt(this.current.tps_USED) + 1', cause 'this.current.tps_USED' may has increased
                    //  in 3rdStore component.
                    var useCountNode = $(this.domNode).find('.descT1 .usedCount');
                    useCountNode.text(parseInt(useCountNode.text()) + 1);
                    
                    $(this.domNode).find('.descT1 .used').show();
                    
                    $(this.domNode).find('button').hide();
                }
            }));
            
            this.own(sub1);
        }
    });
});
