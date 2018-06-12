
define(['tool/base',
        './jquery.qrcode.min'], 
        function(base, qrcode){
	
	return {
		init: function(domNode, options){
            var qr = domNode.qrcode(options);
            var canvas = qr.find('canvas').hide();
            
            var img = domNode.children('img');
            if(img.length == 0){
                img = $('<img>').css('width', options.width).css('height', options.height);
                domNode.append(img);
            }
            
            img.attr('src', canvas.get(0).toDataURL('image/jpg'));
		}
	};
});