
define(["tool/base",
        'dojo/_base/declare',
        'dojo/_base/lang',
        "http://g.alicdn.com/de/prismplayer/1.5.7/prism-min.js",
        'tool/css!http://g.alicdn.com/de/prismplayer/1.5.7/skins/default/index-min.css',
        'tool/css!./AliPlayer.css'], 
       function(base, declare, lang, Prismplayer){
    
    return declare('MyAliPlayer', null, {
        constructor: function(playerNode, url, mobileUrl, screenshot){
        	//to avoid twinkle (in chrome, the flash may be disabled, in that case, the white background of the flash object will be shown), set the opacity to 0.
        	//  should not use 'hide' method, flash cann't load in invisible mode.
            this.playerNode = playerNode.addClass("prism-player").addClass("myAliPlayer");
            
            if(!base.isMobileDevice()){
            	this.playerNode.css('opacity', '0');
            }
            
            var playerId = playerNode.attr('id');
            if(base.isNull(playerId)){
                playerId = 'pl_' + base.uuid();
                playerNode.attr('id', playerId); 
            }
            
            var opts = {
            	id: playerId,
            	preload: true,
            	isLive: true,
            	autoplay: true,
            	cover: screenshot,
            	source: base.isMobileDevice()? mobileUrl : url,
                width: '100%',
                height: this.playerNode.height() + 'px'
            };
            
            var isChrome = window.navigator.userAgent.indexOf("Chrome") !== -1;
            if(isChrome){
            	opts.showBuffer = false;
            }
            
            this.player =  new Prismplayer(opts);
            
            if(!base.isMobileDevice()){
            	this.player.on('ready', lang.hitch(this, function(){
                	this.playerNode.css('opacity', '1');
                }));
            	
            }else{
            	//fix: video tag always stay on top in wechat browser
            	this.playerNode.find('video').attr('webkit-playsinline', 'true').attr('x-webkit-airplay', 'true').attr('playsinline', 'true')
            		.attr('x5-video-player-type', 'h5').attr('x5-video-player-fullscreen', 'true')
            		.css('object-fit', 'fill');
            }
        },
        
        destroy: function(){
            //this.player.destroy();  //this method will remove the playerNode itself
            this.playerNode.empty();
        }
        
    });
});