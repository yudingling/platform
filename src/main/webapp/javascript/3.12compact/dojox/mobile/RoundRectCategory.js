//>>built
define("dojox/mobile/RoundRectCategory","dojo/_base/declare dojo/_base/window dojo/dom-construct dijit/_Contained dijit/_WidgetBase dojo/has dojo/has!dojo-bidi?dojox/mobile/bidi/RoundRectCategory".split(" "),function(c,b,e,f,g,d,h){b=c(d("dojo-bidi")?"dojox.mobile.NonBidiRoundRectCategory":"dojox.mobile.RoundRectCategory",[g,f],{label:"",tag:"h2",baseClass:"mblRoundRectCategory",buildRendering:function(){var a=this.domNode=this.containerNode=this.srcNodeRef||e.create(this.tag);this.inherited(arguments);
!this.label&&(1===a.childNodes.length&&3===a.firstChild.nodeType)&&(this.label=a.firstChild.nodeValue)},_setLabelAttr:function(a){this.label=a;this.domNode.innerHTML=this._cv?this._cv(a):a}});return d("dojo-bidi")?c("dojox.mobile.RoundRectCategory",[b,h]):b});