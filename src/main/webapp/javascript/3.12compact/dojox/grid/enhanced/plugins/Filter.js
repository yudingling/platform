//>>built
define("dojox/grid/enhanced/plugins/Filter","dojo/_base/declare dojo/_base/lang ../_Plugin ./Dialog ./filter/FilterLayer ./filter/FilterBar ./filter/FilterDefDialog ./filter/FilterStatusTip ./filter/ClearFilterConfirm ../../EnhancedGrid dojo/i18n!../nls/Filter".split(" "),function(d,f,g,h,e,k,l,m,n,p,q){d=d("dojox.grid.enhanced.plugins.Filter",g,{name:"filter",constructor:function(b,a){this.grid=b;this.nls=q;a=this.args=f.isObject(a)?a:{};if("number"!=typeof a.ruleCount||0>a.ruleCount)a.ruleCount=
3;if(void 0===(this.ruleCountToConfirmClearFilter=a.ruleCountToConfirmClearFilter))this.ruleCountToConfirmClearFilter=2;this._wrapStore();var c={plugin:this};this.clearFilterDialog=new h({refNode:this.grid.domNode,title:this.nls.clearFilterDialogTitle,content:new n(c)});this.filterDefDialog=new l(c);this.filterBar=new k(c);this.filterStatusTip=new m(c);b.onFilterDefined=function(){};this.connect(b.layer("filter"),"onFilterDefined",function(a){b.onFilterDefined(b.getFilter(),b.getFilterRelation())})},
destroy:function(){this.inherited(arguments);try{this.grid.unwrap("filter"),this.filterBar.destroyRecursive(),this.filterBar=null,this.clearFilterDialog.destroyRecursive(),this.clearFilterDialog=null,this.filterStatusTip.destroy(),this.filterStatusTip=null,this.filterDefDialog.destroy(),this.args=this.grid=this.filterDefDialog=null}catch(b){console.warn("Filter.destroy() error:",b)}},_wrapStore:function(){var b=this.grid,a=this.args,a=a.isServerSide?new e.ServerSideFilterLayer(a):new e.ClientSideFilterLayer({cacheSize:a.filterCacheSize,
fetchAll:a.fetchAllOnFirstFilter,getter:this._clientFilterGetter});e.wrap(b,"_storeLayerFetch",a);this.connect(b,"_onDelete",f.hitch(a,"invalidate"))},onSetStore:function(b){this.filterDefDialog.clearFilter(!0)},_clientFilterGetter:function(b,a,c){return a.get(c,b)}});p.registerPlugin(d);return d});