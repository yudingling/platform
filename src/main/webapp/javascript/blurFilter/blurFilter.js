
define(['tool/base',
        'tool/css!./blurFilter.css'], 
       function (base) {
    
    var _divblurCss = function(divNode, blur){
        var blurStr = 'blur('+ blur +')';
        divNode.css('filter', blurStr).css('-ms-filter', blurStr).css('-moz-filter', blurStr).css('-webkit-filter', blurStr);
    };
    
	return {
        /*
           options: {
              img: 'imglocation',
              blur: '10px'
           }
        */
		init: function(domObj, options){
            document.documentElement.setAttribute("data-agent", navigator.userAgent);
            
            domObj.addClass('myBlur');
            
            var div = $('<div style="background-image: url('+ options.img +')"></div>');
            _divblurCss(div, options.blur);
            domObj.append(div);
            
            var id = 'bl_' + base.uuid();
            var svg = $('<svg><defs><filter id="'+ id +'"><feGaussianBlur stdDeviation="'+ parseInt(options.blur) +'"/></filter></defs><image xlink:href="'+ options.img +'" width="100%" height="100%" filter="url(#'+ id +')"></image></svg>');
            domObj.append(svg);
		},
        
        update: function(domObj, blur){
            _divblurCss(domObj.children('div'), blur);
            
            domObj.find('svg feGaussianBlur').attr('stdDeviation', parseInt(blur));
        }
	};
	
});