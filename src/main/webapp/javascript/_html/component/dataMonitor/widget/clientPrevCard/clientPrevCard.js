define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "dojo/_base/event",
    "root/lvbPlayer/aliPlayer/AliPlayer",
    "dojo/text!./template/clientPrevCard.html",
    "tool/css!./css/clientPrevCard.css"
], function(
       base,
        declare,
        _Widget,
        lang,
        topic,
        event,
        LvbPlayer,
        template){
	
	return declare("component.dataMonitor.widget.clientPrevCard", [_Widget], {
        baseClass: "component_dataMonitor_widget_cliPrevCard",
        templateString: template,
        
        /*
          args: {
            hideStar: false,
            hideTooltip: false
          }
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
            
            $(this.domNode).find('.cardAct>i.fa, td.noSysMeta').tooltip('destroy');
            this._destroyPlayer();
        },
        
        refresh: function(data){
            this.client = data;
            
            this._destroyPlayer();
            
            var trfirst = $(this.domNode).find('table tr:first');
            trfirst.find('td>span').html(data.c_NM);
            
            $(this.domNode).find('td.noSysMeta').tooltip('destroy');
            $(this.domNode).find('table tr:not(:first)').remove();
            
            var table = $(this.domNode).find('table');
            table.removeClass('stream');
            
            var parent = trfirst.parent();
            
            var metaInfo = this.client.metaInfo;
            var firstImage = null;
            var firstVideo = null;
            var imageCount = 0, videoCount = 0;
            var hasNumeric = false;
            
            for(var i=0; i<metaInfo.length; i++){
                
                if(metaInfo[i].preview_TP == 'image'){
                    if(!firstImage && !base.isNull(metaInfo[i].latest_IMG_URL)){
                        firstImage = metaInfo[i];
                    }
                    imageCount++;
                }else if(metaInfo[i].preview_TP == 'video'){
                    if(!firstVideo && !base.isNull(metaInfo[i].latest_VIDEO_URL)){
                        firstVideo = metaInfo[i];
                    }
                    videoCount++;
                }else if(metaInfo[i].preview_TP == 'numeric'){
                    var unit = metaInfo[i].meta_UNIT? metaInfo[i].meta_UNIT : '';
                    
                    var time;
                    if(!base.isNull(metaInfo[i].latest_TM) && typeof metaInfo[i].latest_TM !== 'string' ){
                    	time = new Date(metaInfo[i].latest_TM).format("MM/dd HH:mm");
                    }else{
                    	time = metaInfo[i].latest_TM;
                    }
                    
                    var ltm = base.isNull(time)? '--' : time;                 
                    
                    var val = (base.isNull(metaInfo[i].latest_TM) || base.isNull(metaInfo[i].latest_VAL))? 
                        '--' : (metaInfo[i].latest_VAL + ' ' + unit);
                    
                    var tdCls = base.isNull(metaInfo[i].sysmeta_ID) ? 'class="noSysMeta"' : '';
                    var tdCls_tm = ltm == '--'? 'class="noValue"' : '';
                    var tdCls_val = val == '--'? 'class="noValue"' : '';
                    
                    parent.append($('<tr><td '+ tdCls +'>' + this._getMetaName(metaInfo[i]) + '</td><td '+ tdCls_val +'>' + val + '</td><td '+ tdCls_tm +'>' + ltm + '</td></tr>'));
                    hasNumeric = true;
                }
            }
            
            parent.find('td.noSysMeta').tooltip({
                container: 'body',
                placement: 'auto left',
                trigger: 'hover',
                template: '<div class="tooltip" role="tooltip" style="margin-right: 0px"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',
                title: '未设置系统元数据映射'
            });
            
            if(hasNumeric){
                //add icon to remind that there are stream metadatas
                this._addMetaIcon(parent, imageCount, videoCount, 0, 0, 3);
                
            }else{
                //video get a higher level than image
                if(firstVideo){
                    //make img/stream vertical-middle, the div has css 'display: table-cell', that depends on table's fixed width 
                    table.addClass('stream');
                    
                    var trVideo = $('<tr><td class="metaVideo"></td></tr>');
                    var tdVideo = trVideo.find('td');
                    
                    tdVideo.append($("<div></div>"));
                    
                    parent.append(trVideo);
                    
                    this._addMetaIcon(parent, imageCount, videoCount, 0, 1, 1, 
                        $('<span>当前：'+ base.subDescription(this._getMetaName(firstVideo), 25) +'</span>'));
                    
                    this.player = new LvbPlayer(
                        parent.find('.metaVideo>div'), 
                        firstVideo.latest_VIDEO_URL, 
                        firstVideo.latest_VIDEO_URL_MOBILE, 
                        firstVideo.latest_VIDEO_SCREENSHOT);
                    
                }else if(firstImage){
                    table.addClass('stream');
                    
                    var trImage = $('<tr><td class="metaImage"></td></tr>');
                    var tdImage = trImage.find('td');
                    
                    tdImage.append($('<div><img src="' + firstImage.latest_IMG_URL + '"></img></div>'));
                    
                    parent.append(trImage);
                    
                    this._addMetaIcon(parent, imageCount, videoCount, 1, 0, 1, 
                        $('<span>当前：'+ base.subDescription(this._getMetaName(firstImage), 15) + '&nbsp;&nbsp;' + firstImage.latest_TM +'</span>'));
                }else{
                    parent.append('<tr><td class="empty"><div><span><i class="fa fa-info-circle"></i>暂无数据</span></div></td></tr>');
                    this._addMetaIcon(parent, imageCount, videoCount, 0, 0, 1);
                }
            }
            
            this._changeStar();
        },
        
        _destroyPlayer: function(){
            if(this.player){
                this.player.destroy();
                this.player = null;
            }
        },
        
        _addMetaIcon: function(parent, imageCount, videoCount, condiSizeImage, condiSizeVideo, colspan, descSpan){
            if(imageCount > condiSizeImage || videoCount > condiSizeVideo){
                var trIcon = $('<tr><td class="metaIcon" colspan="'+ colspan +'"></td></tr>');
                var tdIcon = trIcon.find('td');
                if(imageCount > condiSizeImage){
                    tdIcon.append($('<i class="fa fa-image" title="更多图像，见详细数据中"></i>'));
                }
                if(videoCount > condiSizeVideo){
                    tdIcon.append($('<i class="fa fa-video-camera" title="更多视频，见详细数据中"></i>'));
                }
                
                if(descSpan){
                    tdIcon.append(descSpan);
                }

                parent.append(trIcon);
            }
        },
        
        _getMetaName: function(meta){
            return meta.meta_NM && meta.meta_NM.length>0? meta.meta_NM : meta.meta_CID
        },
        
        _changeStar: function(){
            var starNode = $(this.domNode).find('.cardAct>i.fa.star');
            if(this.client.star){
                starNode.removeClass('fa-star-o').addClass('fa-star').css('color', '#db4437');
            }else{
                starNode.removeClass('fa-star').addClass('fa-star-o').css('color', 'inherit');
            }
        },
        
        _initDom: function(){
            var faStar = $(this.domNode).find('.cardAct>i.fa.star');
            var faDetail = $(this.domNode).find('.cardAct>i.fa.detail');
            
        	if(this.hideStar){
        		faStar.hide();
        	}else{
                faStar.show();
                faStar.tooltip({
                    container: 'body',
                    placement: 'auto top',
                    trigger: 'hover',
                    title: lang.hitch(this, function(e){
                        return this.client.star? '取消关注' : '关注';
                    })
                });
                
                faStar.click(lang.hitch(this, function(e){
                    if(this.client){
                        base.ajax({
                            type: this.client.star? 'DELETE' : 'POST',
                            url: base.getServerNM() + "platformApi/own/client/normal/star",
                            data: {clientId: this.client.c_ID}
                        }).success(lang.hitch(this, function(ret){

                            this.client.star = !this.client.star;
                            this._changeStar();
                            topic.publish('component/dataMonitor/widget/clientPrevCard/toggleStar', this.client);
                        }));
                    }
                }));
            }
       
        	if(base.isNull(this.hideTooltip) || this.hideTooltip == false){	      		
            	 faDetail.tooltip({
 	                container: 'body',
 	                placement: 'auto top',
 	                trigger: 'hover'
 	             });
            }
        	
            
            faDetail.click(lang.hitch(this, function(){
                if(this.client){
                    topic.publish('component/dataMonitor/widget/clientPrevCard/toggleMetaList', this.client);
                }
            }));
        },
        
        _initEvents: function(){
        }
	});
});
