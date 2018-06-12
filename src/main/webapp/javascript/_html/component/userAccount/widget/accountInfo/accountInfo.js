define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "root/spin/Spin",
    "root/customScrollbar/CustomScrollBar",
    "root/fileSelector/FileSelector",
    "root/jquery-qrcode/QRCode",
    "tool/validator",
    "dojo/text!./template/accountInfo.html",
    "tool/css!./css/accountInfo.css"
], function (base,
             declare,
             _Widget,
             lang,
             topic,
             Spin,
             CustomScrollBar,
             FileSelector,
             QrCode,
             validator,
             template) {

    return declare("component.userAccount.widget.accountInfo", [_Widget], {
        baseClass: "component_userAccount_widget_acInfo",
        templateString: template,

        constructor: function (args) {
            declare.safeMixin(this, args);

            this._initEvents();
        },

        postCreate: function () {
            this.inherited(arguments);

            this._initDom();
        },

        startup: function () {
            this.inherited(arguments);
            this._setData();

            this.defer(lang.hitch(this, function () {
                CustomScrollBar.init($(this.domNode));

            }), 500);
        },

        destroy: function () {
            this.inherited(arguments);
            
            this._clearVerifyIntv(true);
            $(this.domNode).find('.moreInfo i.fa, .icon>div.unm>span.verifyIcon i.fa-user').tooltip('destroy');
            
            this._destroyWidthdraw();
        },

        _initDom: function () {     
        	
        	this._loadUserRnauthInfoData();
        	
            var editClick = $(this.domNode).find('.editClick');
            editClick.click(lang.hitch(this, function (e) {
                $(e.currentTarget).parent().addClass('edit').find('input').focus();
            }));

            $(this.domNode).find('.editClick').parent().find('input').blur(lang.hitch(this, function (e) {
                var input = $(e.currentTarget);
                var curEditClick = input.parent().removeClass('edit').find('.editClick');
                if (input.val().trim() != curEditClick.html()) {
                    curEditClick.html(input.val().trim());
                    this._saveData('common');
                }
            }));

            $(this.domNode).find('.moreContent>a.more').click(lang.hitch(this, function (e) {
                $(e.currentTarget).parent().toggleClass('open');
            }));

            $(this.domNode).find('.moreInfo i.fa').tooltip({
                container: 'body',
                placement: 'auto bottom',
                trigger: 'hover'
            });

            /* icon change */

            this.fileSel = new FileSelector(
                $(this.domNode).find('.modal.iconEdit .newIcon>.upload'),
                "image/jpeg,image/jpg,image/png,image/bmp",
                lang.hitch(this, function (e) {
                    this._loadIcon(e);
                })
            );
            this.own(this.fileSel);

            $(this.domNode).find('.icon .imgEdit').click(lang.hitch(this, function () {
                var modalNode = $(this.domNode).find('.modal.iconEdit');
                modalNode.on('hidden.bs.modal', lang.hitch(this, function (e) {
                    modalNode.find('.newIcon>div:not(.upload)').remove();
                    modalNode.find('.btn.sure').unbind();

                })).modal({backdrop: 'static', keyboard: false});
            }));

            /* phone change */

            var verifyBtn = $(this.domNode).find('.modal.phoneEdit .verifyDiv .btn');
            var newPhoneInput = $(this.domNode).find('.modal.phoneEdit .newPhone');

            newPhoneInput.on("propertychange input", lang.hitch(this, function (event) {
                if (!this.onVerify) {
                    if ($(event.currentTarget).val().length > 0) {
                        verifyBtn.removeAttr('disabled');
                    } else {
                        verifyBtn.attr('disabled', 'disabled');
                    }
                }
            }));

            verifyBtn.click(lang.hitch(this, function () {
                var phone = newPhoneInput.val();

                if (phone.length == 0) {
                    base.info('输入错误', '手机号不能为空');
                    return;
                }

                this.onVerify = true;

                base.ajax({
                    type: 'GET',
                    url: base.getServerNM() + 'platformApi/open/msgverify/' + phone,
                    hintOnSuccess: true
                }).success(lang.hitch(this, function () {
                    verifyBtn.attr('disabled', 'disabled');

                    var val = 60;
                    this.verifyIntv = setInterval(lang.hitch(this, function () {
                        verifyBtn.text(val--);
                        if (val < 0) {
                            this._clearVerifyIntv();
                        }
                    }), 1000);

                }));
            }));

            QrCode.init($(this.domNode).find('.qrCode>div'), {
                width: 140,
                height: 140,
                foreground: '#333',
                text: base.getServerNM('platform') + 'platformMobile/s/userOpenInfo?uid=' + base.getUid()
            });
            
            /* userRnauthInfo change */
            var uploadA = $(this.domNode).find('.modal.nameEdit .uploadA>.imgPanel');
            this.fileSelImgA = new FileSelector(
                uploadA,
                "image/jpeg,image/jpg,image/png,image/bmp",
                lang.hitch(this, function (e) {
                    this._loadIdCardImg(uploadA, e);
                })
            );
            this.own(this.fileSelImgA);
            
            var uploadB = $(this.domNode).find('.modal.nameEdit .uploadB>.imgPanel');
            this.fileSelImgB = new FileSelector(
                uploadB,
                "image/jpeg,image/jpg,image/png,image/bmp",
                lang.hitch(this, function (e) {
                    this._loadIdCardImg(uploadB, e);
                })
            );
            this.own(this.fileSelImgB);
            
            var idNumberInput = $(this.domNode).find('.modal.nameEdit .idNumber');
            idNumberInput.blur(lang.hitch(this, function () {
                var idNumber = idNumberInput.val();

                if (!base.isNull(idNumber) && idNumber.length != 0) {
                    if (!validator.isCardNo(idNumber)) {
                        base.error("错误", "身份证号输入错误");
                        idNumberInput.focus();
                    }
                }
            }))
        },
        
        _loadIdCardImg: function(imgPanel, file){
            var imgDiv = imgPanel.find('img');

            if (file.currentTarget.files.length == 0) {
                imgDiv.remove();
                return;
            }

            var upFile = file.currentTarget.files[0];

            if (upFile.size / 1024 > 1024) {
                base.error('错误', '图片不能超过1M');
                imgDiv.remove();
                return;
            }

            //image preview in html5
            var reader = new FileReader();
            reader.onload = lang.hitch(this, function (e) {
                if (imgDiv.length == 0) {
                    imgDiv = $('<img style="width: 192px;height: 120px;">');
                    imgPanel.append(imgDiv);
                }

                imgDiv.attr('src', e.target.result);
                
                imgPanel.data('imgModifiedOnEdit', true);
            });
            reader.readAsDataURL(upFile);
        },
        
        _loadUserRnauthInfoData: function(rninfo){
            if(rninfo){
                this._setRNInfo(rninfo);
            }else{
                base.ajax({
                    type: "GET",
                    url: base.getServerNM() + "platformApi/own/user/normal/rNAuthInfo"
                }).success(lang.hitch(this, function (ret) {
                    this._setRNInfo(ret.data);
                }));
            }
        },
        
        _setRNInfo: function(rninfo){
            if(!base.isNull(rninfo)){
                 this.userRnauthInfo = rninfo;
                
                 if (this.userRnauthInfo.rna_RESULT == 1) {
                     var verifyIcon = "<i class='fa fa-user verifyedName' title='已实名验证' style='cursor: pointer; font-size: 14px; margin-left: 5px;'></i>"                   	 
                     var verifyObj = $(this.domNode).find(".icon > div.unm > span.verifyIcon");                    	
                     verifyObj.append(verifyIcon);

                     verifyObj.find('i.fa-user').tooltip({
                          container: 'body',
                          placement: 'auto bottom',
                          trigger: 'hover'
                     });
                 }
             }

             $(this.domNode).find('.moreContent i.userRnauthInfo').unbind('click').click(lang.hitch(this, function () {
                 this._initialUserRnauthInfo();
                 $(this.domNode).find('.modal.nameEdit').modal({backdrop: 'static', keyboard: false});
             }));

             $(this.domNode).find('.modal.nameEdit .btn.sure').unbind('click').click(lang.hitch(this, function () {
                 this._saveUserRnauthInfo();
             }));
            
            $(this.domNode).find('.moreContent i.withdraw').unbind('click').click(lang.hitch(this, function () {
                if(this.userRnauthInfo && this.userRnauthInfo.rna_RESULT == 1){
                    
                    this._destroyWidthdraw();
                    
                    base.newDojo(
                        'component/userAccount/widget/accountInfo/widget/withdraw/withdraw',
                        'component.userAccount.widget.accountInfo.widget.withdraw',
                        null).success(lang.hitch(this, function(obj){
                        
                        this.widthdrawObj = obj;
                        $(this.domNode).find('.modal.widthdrawModal .modal-body').append($(this.widthdrawObj.domNode));
                        this.widthdrawObj.startup();
                        
                        $(this.domNode).find('.modal.widthdrawModal').modal({backdrop: 'static', keyboard: false});
                    }));
                    
                }else{
                    base.info('提醒', '请先完成实名认证!');
                }
            }));
        },
        
        _destroyWidthdraw: function(){
            if(this.widthdrawObj){
                this.widthdrawObj.destroyRecursive();
                this.widthdrawObj = null;
            }
        },

        _checkUserRnauthInfo: function () {
            var name = $(this.domNode).find('.modal.nameEdit .name');
            var idNumber = $(this.domNode).find('.modal.nameEdit .idNumber');

            if (base.isNull(name.val()) || name.val().length == 0) {
                base.error("错误", "姓名不能为空!");
                name.focus();
                return false;
            }

            if (base.isNull(idNumber.val()) || idNumber.val().length == 0) {
                base.error("错误", "身份证号不能为空!");
                idNumber.focus();
                return false;
            }

            if ($(this.domNode).find('.modal.nameEdit .uploadA img').length == 0) {
                base.error("错误", "身份证正面不能为空!");
                return false;
            }

            if ($(this.domNode).find('.modal.nameEdit .uploadB img').length == 0) {
                base.error("错误", "身份证反面不能为空!");
                return false;
            }

            return true;
        },

        _saveUserRnauthIdPhoto: function (fileSel) {
            var def = $.Deferred();

            base.upload({
                url: base.getServerNM('file') + 'fileApi/own/rnauth',
                inputFileObj: fileSel.getSelector()
            }).success(lang.hitch(this, function (ret) {
                def.resolve(ret.data.fileId);
            })).fail(lang.hitch(this, function () {
                def.reject();
            }));

            return def.promise();
        },

        _clearUserRnauthInfo: function () {
            var nameEditNode = $(this.domNode).find(".modal.nameEdit");
            
            nameEditNode.find(".uploadA>.imgPanel>input").val("");
            nameEditNode.find(".uploadB>.imgPanel>input").val("");
            nameEditNode.find(".uploadA>.imgPanel>img").remove();
            nameEditNode.find(".uploadB>.imgPanel>img").remove();
            nameEditNode.find('.idNumber').val("");
            nameEditNode.find('.name').val("");
            nameEditNode.find('.result').text("");
            nameEditNode.find('.phone').text("");
            
            nameEditNode.find(".uploadA>.imgPanel").data('imgModifiedOnEdit', false);
            nameEditNode.find(".uploadB>.imgPanel").data('imgModifiedOnEdit', false);
        },
        
        _getUserRnauthPhotoUrl: function (fileId) {
            return base.getServerNM('file') + 'fileApi/own/rnauth?fileId=' + fileId;
        },

        _initialUserRnauthInfo: function () {
            this._clearUserRnauthInfo();
            
            var authInfoNode = $(this.domNode).find('.modal.nameEdit .authInfo');
            
            if(!base.isNull(this.userRnauthInfo)){
                $(this.domNode).find('.modal.nameEdit .idNumber').val(this.userRnauthInfo.rna_ID);
                
                $(this.domNode).find('.modal.nameEdit .name').val(this.userRnauthInfo.rna_NM);
                
                var img1 = $("<img style='width:192px;height:120px;' src="+ this._getUserRnauthPhotoUrl(this.userRnauthInfo.rna_IDPIC_0) +">");
                var img2 = $("<img style='width:192px;height:120px;' src="+ this._getUserRnauthPhotoUrl(this.userRnauthInfo.rna_IDPIC_1) +">");
                $(this.domNode).find(".modal.nameEdit .uploadA>.imgPanel").append(img1);
                $(this.domNode).find(".modal.nameEdit .uploadB>.imgPanel").append(img2);
                
                var resultStr = '';
                if(this.userRnauthInfo.rna_RESULT == 0){
                    resultStr = "待审核";
                }else if(this.userRnauthInfo.rna_RESULT == 1){
                    resultStr = "审核通过";
                    $(this.domNode).find('.modal.nameEdit .btn.sure').hide();
                }else{
                    resultStr = this._getUserRnauthInfoCheckRetString(this.userRnauthInfo.upt_TS, this.userRnauthInfo.rna_INFO);
                }
                authInfoNode.find('.result').html(resultStr);
                authInfoNode.show();
                
            }else{
                authInfoNode.hide();
            }
            $(this.domNode).find('.modal.nameEdit .phone').text(this.userPhone);
        },
        
        _getUserRnauthInfoCheckRetString: function(ts, info){
            var str = '<span style="display: block; text-align: left; margin-top: 0px;">未通过 ' +  (new Date(ts)).format('MM-dd HH:mm') + '</span><ol style="padding: 0px 0px 0px 15px; text-align: left;">';
            
            var rvlist = JSON.parse(info);
            for(var i=0; i<rvlist.length; i++){
                str += '<li>' + rvlist[i] + '</li>';
            }
            str += '</ol>';
            
            return str;
        },

        _saveUserRnauthInfo: function () {
            if (this._checkUserRnauthInfo()) {
                var imgPanelA = $(this.domNode).find(".modal.nameEdit .uploadA>.imgPanel");
                var imgPanelB = $(this.domNode).find(".modal.nameEdit .uploadB>.imgPanel");
                
                if(imgPanelA.data('imgModifiedOnEdit') && imgPanelB.data('imgModifiedOnEdit')){
                    $.when(
                        this._saveUserRnauthIdPhoto(this.fileSelImgA),
                        this._saveUserRnauthIdPhoto(this.fileSelImgB)
                    ).done(lang.hitch(this, function (idPhotoAId, idPhotoBId) {
                        this._saveRnInfoAfterImgPosted(idPhotoAId, idPhotoBId);
                    }));
                    
                }else if(imgPanelA.data('imgModifiedOnEdit')){
                    $.when(
                        this._saveUserRnauthIdPhoto(this.fileSelImgA)
                    ).done(lang.hitch(this, function (idPhotoId) {
                        this._saveRnInfoAfterImgPosted(idPhotoId, this.userRnauthInfo.rna_IDPIC_1);
                    }));
                    
                }else if(imgPanelB.data('imgModifiedOnEdit')){
                    $.when(
                        this._saveUserRnauthIdPhoto(this.fileSelImgB)
                    ).done(lang.hitch(this, function (idPhotoId) {
                        this._saveRnInfoAfterImgPosted(this.userRnauthInfo.rna_IDPIC_0, idPhotoId);
                    }));
                    
                }else{
                    this._saveRnInfoAfterImgPosted(this.userRnauthInfo.rna_IDPIC_0, this.userRnauthInfo.rna_IDPIC_1);
                }
            }
        },
        
        _saveRnInfoAfterImgPosted: function(idPhotoAId, idPhotoBId){
            var modalNode = $(this.domNode).find('.modal.nameEdit');
            
            var name = modalNode.find('.name').val();
            var idNumber = modalNode.find('.idNumber').val();

            base.ajax({
                hintOnSuccess: true,
                type: "PUT",
                url: base.getServerNM() + "platformApi/own/user/normal/rNAuthInfo",
                data: {
                    name: name,
                    idNumber: idNumber,
                    idPhotoAId: idPhotoAId,
                    idPhotoBId: idPhotoBId
                }
            }).success(lang.hitch(this, function (ret) {
                this._loadUserRnauthInfoData(ret.data);

                modalNode.modal('hide');
            }));
        },

        _clearVerifyIntv: function (isDestroy) {
            if (this.verifyIntv) {
                clearInterval(this.verifyIntv);
            }

            if (!isDestroy) {
                var verifyBtn = $(this.domNode).find('.verifyDiv .btn').text('获取');
                this.onVerify = false;
               
                if ($(this.domNode).find('.phone').val().length > 0) {
                    verifyBtn.removeAttr('disabled');
                }
            }
        },

        _loadIcon: function (file) {
            var modalEdit = $(this.domNode).find('.modal.iconEdit');

            if (file.currentTarget.files.length == 0) {
                modalEdit.find('.btn.sure').unbind();
                modalEdit.find('.newIcon>div:nth-child(1):not(.upload)').remove();
                return;
            }

            var upFile = file.currentTarget.files[0];

            if (upFile.size / 1024 > 30) {
                base.error('错误', '图片不能超过30KB');
                modalEdit.find('.btn.sure').unbind();
                modalEdit.find('.newIcon>div:nth-child(1):not(.upload)').remove();
                return;
            }

            //image preview in html5
            var reader = new FileReader();
            reader.onload = lang.hitch(this, function (e) {
                var newDiv = modalEdit.find('.newIcon>div:nth-child(1)');
                if (newDiv.hasClass('upload')) {
                    newDiv = $('<div><img></div>');
                    modalEdit.find('.newIcon').prepend(newDiv);
                }

                newDiv.find('img').attr('src', e.target.result);

                modalEdit.find('.btn.sure').unbind().click(lang.hitch(this, function () {
                    this._saveData('icon');
                }));
            });
            reader.readAsDataURL(upFile);
        },

        _getImgUrl: function (data) {
            return base.isNull(data.u_ICON) ? (base.getServerNM() + 'javascript/_html/common/linkimg/user.png') : (base.getServerNM('file') + 'fileApi/own/icon?fileId=' + data.u_ICON);
        },

        _setCurrentObjValue: function () {
            this.currentObj.u_NM = $(this.domNode).find('.icon .unm input').val().trim();
        },

        _saveData: function (updateType) {
            if (updateType == 'common') {
                this._setCurrentObjValue();

                base.ajax({
                    type: 'PUT',
                    url: base.getServerNM() + 'platformApi/own/user/normal/self',
                    data: {
                        updateType: updateType,
                        data: JSON.stringify(this.currentObj)
                    }
                }).success(lang.hitch(this, function (ret) {
                }));

            } else {
                base.upload({
                    url: base.getServerNM('file') + 'fileApi/own/icon',
                    inputFileObj: this.fileSel.getSelector()
                }).success(lang.hitch(this, function (upRet) {
                    base.ajax({
                        type: 'PUT',
                        url: base.getServerNM() + 'platformApi/own/user/normal/self',
                        data: {
                            updateType: updateType,
                            fileId: upRet.data.fileId
                        }
                    }).success(lang.hitch(this, function (ret) {
                        this.currentObj.u_ICON = upRet.data.fileId;

                        this._setImgUrl();

                        $(this.domNode).find('.modal.iconEdit').modal('hide');
                    }));
                }));
            }
        },

        _setImgUrl: function () {
            var imgUrl = this._getImgUrl(this.currentObj);
            $(this.domNode).find('.icon img').attr('src', imgUrl);
            $(this.domNode).find('.modal.iconEdit .currentIcon img').attr('src', imgUrl);
        },

        _setData: function () {
            base.ajax({
                url: base.getServerNM() + 'platformApi/own/user/normal/self'
            }).success(lang.hitch(this, function (ret) {
            	        
            	this.userPhone = ret.data.self.u_PHONE;   
            	this.userName = ret.data.self.u_NM;
           	
                this.currentObj = ret.data.self;

                this._setImgUrl();

                var node = $(this.domNode).find('.icon .unm');
                node.find('span.editClick').html(this.currentObj.u_NM);
                node.find('.crtTs').html((new Date(this.currentObj.crt_TS)).format('yyyy-MM-dd') + ' 加入');
                node.find('input').val(this.currentObj.u_NM);

                node = $(this.domNode).find('.moreContent');
                if (this.currentObj.u_PID) {
                    node.find('.pUnm>div>label').html(this.currentObj.parentUnm);
                } else {
                    node.find('.pUnm').hide();
                }
                node.find('.email>div>label').html(this.currentObj.u_EMAIL).attr('title', this.currentObj.u_EMAIL);
                node.find('.profit>div>label').html('￥' + this.currentObj.u_PROFIT);
                node.find('.phone>div>label').html(this.currentObj.u_PHONE);

                node.find('i.resetPwd').click(lang.hitch(this, function () {
                    var modalNode = $(this.domNode).find('.modal.pwdEdit');
                    modalNode.on('hidden.bs.modal', lang.hitch(this, function (e) {
                        modalNode.find('input').val(null);

                    })).modal({backdrop: 'static', keyboard: false});
                }));

                $(this.domNode).find('.modal.pwdEdit .btn.sure').click(lang.hitch(this, function () {
                    this._changePwd();
                }));

                node.find('i.changePhone').click(lang.hitch(this, function () {
                    //clear the content after 'btn.sure' clicked, not on event 'hidden.bs.modal' fired.
                    $(this.domNode).find('.modal.phoneEdit').modal({backdrop: 'static', keyboard: false});
                }));

                $(this.domNode).find('.modal.phoneEdit .btn.sure').click(lang.hitch(this, function () {
                    this._changePhone();
                }));
            }));
        },

        _changePwd: function () {
            var parent = $(this.domNode).find('.modal.pwdEdit');
            var oldPwd = parent.find('input.oldPwd').val();
            var newPwd1 = parent.find('input.oldPwd1').val();
            var newPwd2 = parent.find('input.oldPwd2').val();

            if (oldPwd.length == 0) {
                base.info('提醒', '原密码不能为空');
                return;
            }
            if (newPwd1.length == 0 || newPwd2.length == 0 || newPwd1 != newPwd2) {
                base.info('提醒', '新密码不能为空且两次输入必须一致');
                return;
            }

            base.ajax({
                type: 'PUT',
                hintOnSuccess: true,
                url: base.getServerNM() + 'platformApi/own/user/normal/changePassword',
                data: {
                    oldPwd: oldPwd,
                    newPwd1: newPwd1,
                    newPwd2: newPwd2
                }
            }).success(lang.hitch(this, function (ret) {
                parent.modal('hide');
            }));
        },

        _changePhone: function () {
            var parent = $(this.domNode).find('.modal.phoneEdit');
            var newPhone = parent.find('.newPhone').val();
            var verifyCode = parent.find('.verifyDiv>.verify').val();

            if (newPhone.length == 0) {
                base.info('输入错误', '手机号不能为空');
                return;
            }

            if (verifyCode.length == 0) {
                base.info('输入错误', '验证码不能为空');
                return;
            }

            base.ajax({
                type: 'PUT',
                url: base.getServerNM() + 'platformApi/own/user/normal/changePhone',
                data: {
                    newPhone: newPhone,
                    verifyCode: verifyCode
                }
            }).success(lang.hitch(this, function (ret) {
                parent.find('input').val(null);

                this.currentObj.u_PHONE = newPhone;
                node.find('.phone>div>label').html(newPhone);

                parent.modal('hide');
            }));
        },

        _initEvents: function () {
            var sub1 = topic.subscribe('component/userAccount/widget/accountInfo/afterWithdraw', lang.hitch(this, function(data){
                var node = $(this.domNode).find('.moreContent .profit>div>label').html('￥' + (this.currentObj.u_PROFIT - data.dec));
            }));
            
            this.own(sub1);
        }
    });
});
