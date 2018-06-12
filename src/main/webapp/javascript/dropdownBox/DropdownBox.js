/**
 * dropdownBox
 * 
 */

define(["dojo/_base/declare", "dojo/_base/lang"], function(declare, lang){
	var opts = {
			placeholder: '',
			minWidth: 80,
			dropMinWidth: 110,
			options: [],
            btnClass: 'btn-default',
            onclick: null
	};
	
	return declare('DropdownBox', null, {
        /*
           dpOptions: {
              placeholder: 'xxx',
              minWidth: 100,
              dropMinWidth: 150,
              btnClass: 'xxxx',
              options: [{name:'模型计算', value:xxx, data: xxxx}, {name:'给定流量过程', value:xxx, data: xxx}],
              onclick: function(name, value, data){
              }
           }
        */
		constructor: function(domNode, dpOptions){
			
			this.myOpts = $.extend({}, opts, dpOptions);
            
			var dropStr = '<div class="dropdown">'
				  + '<button id="orderType" type="button" style="min-Width:'+ this.myOpts.minWidth +'px; white-space:normal" class="btn '+ this.myOpts.btnClass +' btn-sm dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">'
				  + this.myOpts.placeholder
				  + '<i class="fa fa-caret-down pull-right" style="line-height:inherit"></i></button>' 
				  + '<ul class="dropdown-menu" style="min-width:' + this.myOpts.dropMinWidth +'px" aria-labelledby="orderType"></ul></div>';
				  
            this.dropObj = $(dropStr);
			
            var lis = [];
			for(var i=0; i<this.myOpts.options.length; i++){
				lis.push($('<li><a href="javascript:void(0);" optValue="'+ this.myOpts.options[i].value +'">' + this.myOpts.options[i].name +'</a></li>').data('data', this.myOpts.options[i].data));
			}
			this.dropObj.find('ul.dropdown-menu').append(lis);
			
			domNode.append(this.dropObj);
			
			this.curData = {name: null, value: null, data: null};
            
            this.domNode = domNode;
			
            this.dropObj.find('ul.dropdown-menu>li>a').click(lang.hitch(this, function(e){
                this._click($(e.currentTarget));
            }));
		},
		
		getCurrentSelect: function(){
			return this.curData;
		},
        
        select: function(value, silent){
            var sel = this.dropObj.find('ul.dropdown-menu>li>a[optValue='+ value +']');
            if(sel && sel.length>0){
                this._click(sel, silent);
            }else{
                this.reset();
            }
            return this;
        },
        
        destroy: function(){
            this.dropObj.remove();
        },
        
        reset: function(){
            this.curData = {name: null, value: null, data: null};
            this.dropObj.children('button.dropdown-toggle').html(this.myOpts.placeholder + '<i class="fa fa-caret-down pull-right" style="line-height:inherit"></i>');
            
            return this;
        },
        
        hide: function(){
            this.domNode.hide();
        },
        
        show: function(){
            this.domNode.show();
        },
        
        _click: function(e, silent){
            var name = e.html();
            var value = e.attr('optValue');
            var data = e.parent().data('data');
            
            if(this.curData.value != value){
                this.curData.name = name;
                this.curData.value = value;
                this.curData.data = data;

                this.dropObj.children('button.dropdown-toggle').html(this.curData.name + '<i class="fa fa-caret-down pull-right" style="line-height:inherit"></i>');
                if(this.myOpts.onclick && !silent){
                    this.myOpts.onclick(this.curData.name, this.curData.value, this.curData.data);
                }
            }
        }
	});
});