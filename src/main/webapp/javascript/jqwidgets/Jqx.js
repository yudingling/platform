define(['./jqx-all',
        'tool/css!./styles/jqx.base.css',
        'tool/css!./styles/jqx.custom-zd.css'], function(){
	
	(function($) {
		$.fn.jqxGridCN = function(){
			var retObj = this.jqxGrid.apply(this, arguments);
			this.jqxGrid('localizestrings', {
				pagergotopagestring: '跳转: ',
				pagershowrowsstring: '每页: ',
				emptydatastring: '暂无数据',
				loadtext: "加载中..."
			});
			
			return retObj;
		}
		
	})(jQuery);
});