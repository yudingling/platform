
define(["tool/base",
        'dojo/_base/declare',
        'dojo/_base/lang',
        "http://imgcache.qq.com/open/qcloud/video/vcplayer/TcPlayer.js",
        'tool/css!./TcPlayer.css'], 
       function(base, declare, lang, TcPlayerX){
    
    return declare('MyTcPlayer', null, {
        constructor: function(playerNode, url, mobileUrl, screenshot){
            this.playerNode = playerNode.addClass("myTcPlayer");
            
            var playerId = playerNode.attr('id');
            if(base.isNull(playerId)){
                playerId = 'pl_' + base.uuid();
                playerNode.attr('id', playerId); 
            }
            
            /*if(base.isNull(screenshot)){
                screenshot = base.getServerNM() + 'javascript/tcPlayer/img/play.png';
            }*/
            
            var opts = {
                "autoplay" : true,
                "coverpic" : screenshot,
                "live": true,
                "x5_type": "h5",
                "x5_fullscreen": "true",
                listener: lang.hitch(this, function (msg){
                    if(msg.type == 'error'){
                        this._clearTs();
                        this.resetTs = setTimeout(lang.hitch(this, function(){
                            this.player.load();
                        }), 1000);
                        
                    }else if(msg.type == 'loadeddata'){
                        this.player.play();
                    }
                })
                /*"width" :  '480',//视频的显示宽度，请尽量使用视频分辨率宽度
                "height" : '320'//视频的显示高度，请尽量使用视频分辨率高度*/
            };
            
            if(base.isMobileDevice()){
                opts.m3u8 = mobileUrl;
                opts.controls = "system";
                
                this.playerNode.addClass("mb");
                
            }else{
                opts.rtmp = url;
                opts.controls = "default";
            }
            
            this.player =  new TcPlayerX.TcPlayer(playerId, opts);
        },
        
        destroy: function(){
            this._clearTs();
            this.player.destroy();
            this.playerNode.children('.vcp-player').remove();
        },
        
        _clearTs: function(){
            if(this.resetTs){
                clearTimeout(this.resetTs);
                this.resetTs = null;
            }
        }
        
    });
});