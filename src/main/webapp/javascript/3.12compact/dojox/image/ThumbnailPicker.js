//>>built
define("dojox/image/ThumbnailPicker",["dijit","dojo","dojox","dojo/require!dojox/fx/scroll,dojo/fx/easing,dojo/fx,dijit/_Widget,dijit/_Templated"],function(m,b,n){b.provide("dojox.image.ThumbnailPicker");b.experimental("dojox.image.ThumbnailPicker");b.require("dojox.fx.scroll");b.require("dojo.fx.easing");b.require("dojo.fx");b.require("dijit._Widget");b.require("dijit._Templated");b.declare("dojox.image.ThumbnailPicker",[m._Widget,m._Templated],{imageStore:null,request:null,size:500,thumbHeight:75,
thumbWidth:100,useLoadNotifier:!1,useHyperlink:!1,hyperlinkTarget:"new",isClickable:!0,isScrollable:!0,isHorizontal:!0,autoLoad:!0,linkAttr:"link",imageThumbAttr:"imageUrlThumb",imageLargeAttr:"imageUrl",pageSize:20,titleAttr:"title",templateString:b.cache("dojox.image","resources/ThumbnailPicker.html",'\x3cdiv dojoAttachPoint\x3d"outerNode" class\x3d"thumbOuter"\x3e\n\t\x3cdiv dojoAttachPoint\x3d"navPrev" class\x3d"thumbNav thumbClickable"\x3e\n\t  \x3cimg src\x3d"" dojoAttachPoint\x3d"navPrevImg"/\x3e    \n\t\x3c/div\x3e\n\t\x3cdiv dojoAttachPoint\x3d"thumbScroller" class\x3d"thumbScroller"\x3e\n\t  \x3cdiv dojoAttachPoint\x3d"thumbsNode" class\x3d"thumbWrapper"\x3e\x3c/div\x3e\n\t\x3c/div\x3e\n\t\x3cdiv dojoAttachPoint\x3d"navNext" class\x3d"thumbNav thumbClickable"\x3e\n\t  \x3cimg src\x3d"" dojoAttachPoint\x3d"navNextImg"/\x3e  \n\t\x3c/div\x3e\n\x3c/div\x3e'),
_thumbs:[],_thumbIndex:0,_maxPhotos:0,_loadedImages:{},baseClass:"ThumbnailPicker",cellClass:"Thumbnail",postCreate:function(){this.inherited(arguments);this.pageSize=Number(this.pageSize);this._scrollerSize=this.size-102;var a=this._sizeProperty=this.isHorizontal?"width":"height";b.style(this.outerNode,"textAlign","center");b.style(this.outerNode,a,this.size+"px");b.style(this.thumbScroller,a,this._scrollerSize+"px");this.useHyperlink&&b.subscribe(this.getClickTopicName(),this,function(a){if(a=this.imageStore.getValue(a.data,
this.linkAttr))"new"==this.hyperlinkTarget?window.open(a):window.location=a});this.isClickable&&b.addClass(this.thumbsNode,"thumbClickable");this._totalSize=0;a=this.isHorizontal?"Horiz":"Vert";b.addClass(this.navPrev,"prev"+a);b.addClass(this.navNext,"next"+a);b.addClass(this.thumbsNode,"thumb"+a);b.addClass(this.outerNode,"thumb"+a);b.attr(this.navNextImg,"src",this._blankGif);b.attr(this.navPrevImg,"src",this._blankGif);this.connect(this.navPrev,"onclick","_prev");this.connect(this.navNext,"onclick",
"_next");this.isHorizontal?(this._sizeAttr="offsetWidth",this._scrollAttr="scrollLeft"):(this._sizeAttr="offsetHeight",this._scrollAttr="scrollTop");this._updateNavControls();this.init()},init:function(){if(this.isInitialized)return!1;this.isInitialized=!0;this.imageStore&&this.request&&this._loadNextPage();return!0},getClickTopicName:function(){return this.id+"/select"},getShowTopicName:function(){return this.id+"/show"},setDataStore:function(a,c,d){this.reset();this.request={query:{},start:c.start||
0,count:c.count||10,onBegin:b.hitch(this,function(a){this._maxPhotos=a})};c.query&&b.mixin(this.request.query,c.query);d&&b.forEach(["imageThumbAttr","imageLargeAttr","linkAttr","titleAttr"],function(a){d[a]&&(this[a]=d[a])},this);this.request.start=0;this.request.count=this.pageSize;this.imageStore=a;this._loadInProgress=!1;this.init()||this._loadNextPage()},reset:function(){this._loadedImages={};b.forEach(this._thumbs,function(a){a&&a.parentNode&&b.destroy(a)});this._thumbs=[];this.isInitialized=
!1;this._noImages=!0},isVisible:function(a){a=this._thumbs[a];if(!a)return!1;var b=this.isHorizontal?"offsetLeft":"offsetTop",d=this.isHorizontal?"offsetWidth":"offsetHeight",e=this.isHorizontal?"scrollLeft":"scrollTop",b=a[b]-this.thumbsNode[b];return b>=this.thumbScroller[e]&&b+a[d]<=this.thumbScroller[e]+this._scrollerSize},resize:function(a){var c=this.isHorizontal?"w":"h",d=0;0<this._thumbs.length&&0==b.marginBox(this._thumbs[0]).w||(b.forEach(this._thumbs,b.hitch(this,function(a){var f=b.marginBox(a.firstChild);
d+=Number(f[c])+10;this.useLoadNotifier&&0<f.w&&b.style(a.lastChild,"width",f.w-4+"px");b.style(a,"width",f.w+"px")})),b.style(this.thumbsNode,this._sizeProperty,d+"px"),this._updateNavControls())},_next:function(){for(var a=this.isHorizontal?"offsetLeft":"offsetTop",b=this.isHorizontal?"offsetWidth":"offsetHeight",d=this.thumbsNode[a],e=this._thumbs[this._thumbIndex][a]-d,f,g=this._thumbIndex+1;g<this._thumbs.length;g++)if(f=this._thumbs[g],f[a]-d+f[b]-e>this._scrollerSize){this._showThumbs(g);break}},
_prev:function(){if(0!=this.thumbScroller[this.isHorizontal?"scrollLeft":"scrollTop"]){for(var a=this.isHorizontal?"offsetLeft":"offsetTop",b=this._thumbs[this._thumbIndex][a]-this.thumbsNode[a],d,e=this._thumbIndex-1;-1<e;e--)if(d=this._thumbs[e],b-d[a]>this._scrollerSize){this._showThumbs(e+1);return}this._showThumbs(0)}},_checkLoad:function(a,c){b.publish(this.getShowTopicName(),[{index:c}]);this._updateNavControls();this._loadingImages={};this._thumbIndex=c;this.thumbsNode.offsetWidth-a.offsetLeft<
2*this._scrollerSize&&this._loadNextPage()},_showThumbs:function(a){a=Math.min(Math.max(a,0),this._maxPhotos);if(!(a>=this._maxPhotos)){var c=this._thumbs[a];if(c){var d=c.offsetLeft-this.thumbsNode.offsetLeft,e=c.offsetTop-this.thumbsNode.offsetTop,f=this.isHorizontal?d:e;f>=this.thumbScroller[this._scrollAttr]&&f+c[this._sizeAttr]<=this.thumbScroller[this._scrollAttr]+this._scrollerSize||(this.isScrollable?n.fx.smoothScroll({target:this.isHorizontal?{x:d,y:0}:{x:0,y:e},win:this.thumbScroller,duration:300,
easing:b.fx.easing.easeOut,onEnd:b.hitch(this,"_checkLoad",c,a)}).play(10):(this.isHorizontal?this.thumbScroller.scrollLeft=d:this.thumbScroller.scrollTop=e,this._checkLoad(c,a)))}}},markImageLoaded:function(a){var c=b.byId("loadingDiv_"+this.id+"_"+a);c&&this._setThumbClass(c,"thumbLoaded");this._loadedImages[a]=!0},_setThumbClass:function(a,c){this.autoLoad&&b.addClass(a,c)},_loadNextPage:function(){if(!this._loadInProgress){this._loadInProgress=!0;for(var a=this.request.start+(this._noImages?0:
this.pageSize),c=a;c<this._thumbs.length&&this._thumbs[c];)c++;var d=this.imageStore;this.request.onComplete=b.hitch(this,function(a,f){if(d==this.imageStore)if(a&&a.length){var g=0,h=b.hitch(this,function(){if(g>=a.length)this._loadInProgress=!1;else{var b=g++;this._loadImage(a[b],c+b,h)}});h();this._updateNavControls()}else this._loadInProgress=!1});this.request.onError=b.hitch(this,function(){this._loadInProgress=!1;console.log("Error getting items")});this.request.start=a;this._noImages=!1;this.imageStore.fetch(this.request)}},
_loadImage:function(a,c,d){var e=this.imageStore,f=e.getValue(a,this.imageThumbAttr),g=b.create("div",{id:"img_"+this.id+"_"+c,"class":this.cellClass}),h=b.create("img",{},g);h._index=c;h._data=a;this._thumbs[c]=g;var k;this.useLoadNotifier&&(k=b.create("div",{id:"loadingDiv_"+this.id+"_"+c},g),this._setThumbClass(k,this._loadedImages[c]?"thumbLoaded":"thumbNotifier"));c=b.marginBox(this.thumbsNode);var l;this.isHorizontal?(k=this.thumbWidth,l="w"):(k=this.thumbHeight,l="h");c=c[l];l=this.thumbScroller.scrollLeft;
var m=this.thumbScroller.scrollTop;b.style(this.thumbsNode,this._sizeProperty,c+k+20+"px");this.thumbScroller.scrollLeft=l;this.thumbScroller.scrollTop=m;this.thumbsNode.appendChild(g);b.connect(h,"onload",this,b.hitch(this,function(){if(e!=this.imageStore)return!1;this.resize();setTimeout(d,0);return!1}));b.connect(h,"onclick",this,function(c){b.publish(this.getClickTopicName(),[{index:c.target._index,data:c.target._data,url:h.getAttribute("src"),largeUrl:this.imageStore.getValue(a,this.imageLargeAttr),
title:this.imageStore.getValue(a,this.titleAttr),link:this.imageStore.getValue(a,this.linkAttr)}]);b.query("."+this.cellClass,this.thumbsNode).removeClass(this.cellClass+"Selected");b.addClass(c.target.parentNode,this.cellClass+"Selected");return!1});b.addClass(h,"imageGalleryThumb");h.setAttribute("src",f);(f=this.imageStore.getValue(a,this.titleAttr))&&h.setAttribute("title",f);this._updateNavControls()},_updateNavControls:function(){var a=function(a,c){var d=c?"addClass":"removeClass";b[d](a,"enabled");
b[d](a,"thumbClickable")},c=this.isHorizontal?"scrollLeft":"scrollTop",d=this.isHorizontal?"offsetWidth":"offsetHeight";a(this.navPrev,0<this.thumbScroller[c]);a(this.navNext,this.thumbScroller[c]+this._scrollerSize<this.thumbsNode[d])}})});