define(['tool/base',
        './bootstrap-switch',
        'tool/css!./bootstrap-switch.css'], function(base){
	
    return {
    	/**
    	 * options: {handleWidth: 40, size: 'small', onColor: 'success', offColor: 'default', onText: 'off', offText: 'on', state: false, wrapperClass: 'cls', onChange: func, animate: true}
    	 */
        init: function(domNode, options){
        	domNode.each(function(e){
        		$(this).bootstrapSwitch()
	            	.bootstrapSwitch('handleWidth', options.handleWidth)
		            .bootstrapSwitch('size', options.size)
		            .bootstrapSwitch('onColor', options.onColor? options.onColor : 'success')
		            .bootstrapSwitch('offColor', options.offColor? options.offColor : 'default')
		            .bootstrapSwitch('onText', options.onText)
		            .bootstrapSwitch('offText', options.offText)
		            .bootstrapSwitch('state', options.state? options.state : false)
		            .bootstrapSwitch('wrapperClass', options.wrapperClass? options.wrapperClass : 'bs')
                    .bootstrapSwitch('animate', base.isNull(options.animate)? true : options.animate);
                
                if(options.onChange){
                    $(this).on('switchChange.bootstrapSwitch', options.onChange);
                }
        	});
        },
        
        state: function(domNode, val){
            if(base.isNull(val)){
            	return domNode.bootstrapSwitch('state');
            	
            }else{
            	domNode.each(function(e){
                    $(this).bootstrapSwitch('state', val);
                });
            }
        }
    };
    
});