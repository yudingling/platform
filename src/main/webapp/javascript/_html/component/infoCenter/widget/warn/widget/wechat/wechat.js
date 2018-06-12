define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "dojo/text!./template/wechat.html",
    "tool/css!./css/wechat.css"
], function (base,
             declare,
             _Widget,
             lang,
             topic,
             template) {
    return declare("component.infoCenter.widget.warn.wechat", [_Widget], {
        baseClass: "component_infoCenter_widget_warn_wechat",
        templateString: template,

        constructor: function (args) {
            declare.safeMixin(this, args);

            this._initEvent();
        },

        postCreate: function () {
            this.inherited(arguments);

            this._initDom();
        },

        startup: function () {
            this.inherited(arguments);
        },

        destroy: function () {
            this.inherited(arguments);
        },

        _initDom: function () {
            var content = $(this.domNode).find(".content");
            content.val(this.wrn_DESC);

            var inputFileObj = $(this.domNode).find(".inputFileObj");
            inputFileObj.change(lang.hitch(this, function (e) {

                var files = e.target.files;
                var file = files.item(0);
               
                if (!/image\/\w+/.test(file.type)) {
                	base.error("文件格式错误","请确保是图像文件！");
                	return false;
                }
                
                if(!file.name.endsWith(".jpg") && !file.name.endsWith(".png")){
                	base.error("图片格式错误","只能是.png或.jpg文件");
                	return false;
                }
                   
                if(file.size/1024 > 50){
                	base.error("图片大小溢出","图片过大，不能超过50kb");
                	return;
                }
                
                var reader = new FileReader();
                reader.readAsDataURL(file);
                var img = $(this.domNode).find(".img");

                reader.onload = function () {
                    img.prop("src", this.result);
                };
            }));

            var imgDiv = $(this.domNode).find(".imgDiv");
        },
 
        _checkWechat: function () {
            //data contains wrnId title content imgUrl
            var title = $(this.domNode).find(".contact").val();
            var content = $(this.domNode).find(".content").val();
            var imgUrl = $(this.domNode).find(".inputFileObj").val();

            if (base.isNull(title) || title.length == 0) {
                base.error("表单域未赋值","标题不能为空!");
                return null;
            }

            if (base.isNull(imgUrl) || imgUrl.length == 0) {
                base.error("表单域未赋值","图片不能为空!");
                return null;
            }

            var data = {wrnId: this.wrn_ID, title: null, content: null, thumb_media_id: null};
            data.wrnId = this.wrn_ID;
            data.title = title;
            data.content = content;
            return data;
        },

        _save: function () {
            var data = this._checkWechat();
            if (data) {
                var inputFileObj = $(this.domNode).find(".inputFileObj");

                base.upload({
                    url: base.getServerNM() + 'platformApi/own/wechat/fileUp',
                    inputFileObj: inputFileObj
                }).success(lang.hitch(this, function (ret) {

                    var thumb_media_id = ret.data.thumb_media_id;
                    data.thumb_media_id = thumb_media_id;

                    if (thumb_media_id) {
                        base.ajax({
                            hintOnSuccess: true,
                            type: 'POST',
                            data: data,
                            url: base.getServerNM() + 'platformApi/own/warn/forward/wechat'
                        }).success(lang.hitch(this, function () {
                            topic.publish("component/infoCenter/widget/warn/sendSuccess");
                        }))
                    } else {
                        base.error("内部程序错误","发送失败！");
                    }
                }));
            }
        },

        _initEvent: function () {
            var sub1 = topic.subscribe('component/infoCenter/widget/warn/forward', lang.hitch(this, function () {
                this._save();
            }));

            this.own(sub1);
        }
    })
});
