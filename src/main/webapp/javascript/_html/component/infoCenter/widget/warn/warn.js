define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "root/spin/Spin",
    "root/customScrollbar/CustomScrollBar",
    "root/brandHref/BrandHref",
    "root/d3TimeLine/D3TimeLine",
    "dojo/text!./template/warn.html",
    "tool/css!./css/warn.css"
], function (base,
             declare,
             _Widget,
             lang,
             topic,
             Spin,
             CustomScrollBar,
             BrandHref,
             D3TimeLine,
             template) {

    return declare("component.infoCenter.widget.warn", [_Widget], {
        baseClass: "component_infoCenter_widget_warn",
        templateString: template,

        authApi: {
            updateWarn: '/platformApi/own/warn/update',
            forwardWarnSms: '/platformApi/own/warn/forward/sms',
            forwardWarnEmail: '/platformApi/own/warn/forward/email',
            forwardWarnWechat: '/platformApi/own/warn/forward/wechat',
            maintRecordUpt: '/platformApi/own/maint/maintRecord/update'
        },

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

            this.resizeBind = lang.hitch(this, function () {
                this._resizeManual(1);
            });
            $(window).resize(this.resizeBind);

            this._setFilter();
            $(this.domNode).find('.warnFilter li>a[data="all"]').click();

            this.defer(lang.hitch(this, function () {
                //cause the 'this.brand' is a absolute dom create dynamic, when the parent component 'infoCenter' show in animate, twinkle will appeare. to avoid this, we set the 'detail' unVisible on initial and show after a while.
                $(this.domNode).find('.rightContent>div>.bottom>.detail').show();
                CustomScrollBar.init($(this.domNode).find('.customScrollBar'));

            }), 500);

        },

        destroy: function () {
            this.inherited(arguments);

            this._destroyPreForwardObj();

            if (this.resizeBind) {
                $(window).unbind('resize', this.resizeBind);
            }
            return true;
        },

        bindAuthed: function () {
            this.inherited(arguments);

            //hide the action button at first to reduce twinke
            $(this.domNode).find('.rightContent>div>.bottom>.detail .detailContainer>.actionBar>*[bindAuth]').hide();
        },


        _initDom: function () {
            $(this.domNode).find('.warnFilter li.catalog>a').click(lang.hitch(this, function (e) {
                $(e.currentTarget).parent().toggleClass('open');
            }));

            $(this.domNode).find('.rightContent .top button').click(lang.hitch(this, function () {
                this._setData();
            }));

            $(this.domNode).find('.rightContent .top .warnTxt, .top .currentPage').keydown(lang.hitch(this, function (event) {
                if (event.which == 13) {
                    this._setData();
                }
            }));

            $(this.domNode).find('.warnFilter1>li>a[data]').click(lang.hitch(this, function (e) {
                var cur = $(e.currentTarget);
                if (this._filterAction(cur)) {
                    this.confirmed = parseInt(cur.attr('data'));

                    this._setData();
                }
            }));

            $(this.domNode).find('.warnFilter li>a[data="all"]').click(lang.hitch(this, function (e) {
                var cur = $(e.currentTarget);
                if (this._filterAction(cur)) {
                    this._setData();
                }
            }));

            $(this.domNode).find('.top i.fa-arrow-right').click(lang.hitch(this, function (event) {
                if (!base.isNull(this.totalPage)) {
                    var curPageNode = $(this.domNode).find('.top .currentPage');
                    var cur = parseInt(curPageNode.val());
                    if (cur < this.totalPage) {
                        curPageNode.val(cur + 1);
                        this._setData();
                    }
                }
            }));

            $(this.domNode).find('.top i.fa-arrow-left').click(lang.hitch(this, function (event) {
                if (!base.isNull(this.totalPage)) {
                    var curPageNode = $(this.domNode).find('.top .currentPage');
                    var cur = parseInt(curPageNode.val());
                    if (cur > 1) {
                        curPageNode.val(cur - 1);
                        this._setData();
                    }
                }
            }));

            $(this.domNode).find('.rightContent .top input[type="checkbox"]').change(lang.hitch(this, function () {
                this._setData();
            }));

            $(this.domNode).find('.rightContent>div>.bottom>.detail .detailContainer>.actionBar>.closeDetail').click(lang.hitch(this, function () {
                this._clearDetail();

                $(this.domNode).find('.rightContent>div>.bottom').one('webkitTransitionEnd transitionend', lang.hitch(this, function (e) {
                    $(e.currentTarget).off('webkitTransitionEnd transitionend');
                    this._resizeManual(1);

                })).removeClass('showDetail');
            }));

            this.brand = new BrandHref($(this.domNode).find('.rightContent>div>.bottom>.detail .detailContainer'), null, 'left');
            this.brand.setInfo('未确认', '#bbb');
            this.own(this.brand);

            $(this.domNode).find('.modal.forwardWin .btn.sure').click(lang.hitch(this, function () {
                topic.publish('component/infoCenter/widget/warn/forward');
            }));
        },

        _filterAction: function (cur, force) {
            if (!cur.hasClass('active') || force) {
                $(this.domNode).find('.warnFilter li>a[data]').not(cur).removeClass('active');
                cur.addClass('active');

                $(this.domNode).find('.top .currentPage').val('1');
                this.totalPage = 0;

                this.confirmed = -1;

                return true;
            } else {
                return false;
            }
        },

        //to reduce twinkle, we use replace instead of remove old item
        _clear: function (node, newCount) {
            this._clearDetail();
            $(this.domNode).find('.rightContent>div>.bottom>div').removeClass('trans');
            $(this.domNode).find('.rightContent>div>.bottom').removeClass('showDetail');

            node.find('tr.empty').remove();

            var children = node.find('tr');
            if (base.isNull(newCount) || newCount == 0) {
                children.remove();
            } else if (children.length > newCount) {
                for (var i = newCount; i < children.length; i++) {
                    $(children[i]).remove();
                }
            }

            node.find('tr.unClosed').removeClass('unClosed');
        },

        _setData: function () {
            var pageSize = 15;

            var curPageNode = $(this.domNode).find('.top .currentPage');
            var curPage = parseInt(curPageNode.val());
            if (isNaN(curPage) || curPage < 1) {
                curPage = 1;
                curPageNode.val(curPage);
            }
            if (!base.isNull(this.totalPage) && this.totalPage > 0) {
                if (curPage > this.totalPage) {
                    curPage = this.totalPage;
                    curPageNode.val(this.totalPage);
                }
            }

            var warnsContainer = $(this.domNode).find('.rightContent>div>.bottom .warnsContainer');

            base.ajax({
                url: base.getServerNM() + 'platformApi/own/warn/normal/warnInfo',
                data: {
                    confirmed: this.confirmed < 0 ? null : this.confirmed,
                    closed: $(this.domNode).find('.rightContent .top input[type="checkbox"]').is(':checked') ? 0 : null,
                    search: $(this.domNode).find('.rightContent .top .warnTxt').val(),
                    start: (curPage - 1) * pageSize,
                    length: pageSize
                }
            }).success(lang.hitch(this, function (ret) {
                var data = ret.data[1];

                this._clear(warnsContainer, data.length);

                if (data.length > 0) {
                    for (var i = 0; i < data.length; i++) {
                        this._createItem(i, warnsContainer, data[i]);
                    }
                } else {
                    warnsContainer.append('<tr class="empty"><td>暂无更多数据!</td></tr>');
                }

                this.totalPage = Math.ceil(parseInt(ret.data[0]) / pageSize);
                $(this.domNode).find('.top .totalPage').html(this.totalPage);
                if (this.totalPage == 0) {
                    curPageNode.val(0);
                }

            })).fail(lang.hitch(this, function (ret) {
                $(this.domNode).find('.rightContent>div>.bottom').removeClass('showDetail');

                $(this.domNode).find('.top .currentPage').val('0');
                $(this.domNode).find('.top .totalPage').val('0');

                warnsContainer.children().remove();
                warnsContainer.append('<tr class="empty"><td>获取数据失败!</td></tr>');

            }));
        },

        _getSubTitle: function (title, parentWidth) {
            //get the title span width
            var availWidth = parentWidth - 10 - 50 - 150;
            if (availWidth <= 0) {
                availWidth = $(window).width() - 220 - 70 - 10 - 50 - 150;
            }

            //average 7 pixels for each ascii character
            return base.subDescription(title, parseInt(availWidth / 7));
        },

        _createItem: function (i, parent, data) {
            var item = i >= 0 ? parent.find('tr:nth-child(' + (i + 1) + ')') : null;

            if (!item || item.length == 0) {
                item = $('<tr><td></td><td></td><td></td></tr>');
                parent.append(item);
            }

            item.attr('wrnID', data.wrn_ID);
            item.data('data', data);

            if (parseInt(data.wrn_CLOSE) == 0) {
                item.addClass('unClosed');
            }

            item.find('td:first-child').html(this._getSubTitle(data.wrn_NM, parent.width())).unbind().click(lang.hitch(this, function (e) {
                if (item.hasClass('active')) {
                    return;
                }

                var bottom = $(this.domNode).find('.bottom');
                if (!bottom.hasClass('showDetail')) {
                    //change the title description first
                    this._resizeManual(0.5);

                    $(this.domNode).find('.rightContent>div>.bottom>div').addClass('trans');

                    bottom.one('webkitTransitionEnd transitionend', lang.hitch(this, function () {
                        bottom.off('webkitTransitionEnd transitionend');
                        //defer 50ms for timeline, its canvan size need to be accurate
                        this.defer(lang.hitch(this, function () {
                            this._showDetail(data);

                        }), 100);
                    })).addClass('showDetail');

                } else {
                    this._showDetail(data);
                }

                item.parent().children('tr').not(item).removeClass('active');
                item.addClass('active');
            }));

            item.find('td:nth-child(2)').html(parseInt(data.wrn_CHK) == 1 ? '<i class="fa fa-check-circle" title="已审核"></i>' : '');
            item.find('td:nth-child(3)').html(base.getTMDesc(data.crt_TS));
        },

        _refreshItem: function (data) {
            var item = $(this.domNode).find('.rightContent>div>.bottom .warnsContainer tr[wrnID="' + data.wrn_ID + '"]');

            if (parseInt(data.wrn_CLOSE) == 0) {
                item.addClass('unClosed');
            } else {
                item.removeClass('unClosed');
            }

            item.find('td:nth-child(2)').html(parseInt(data.wrn_CHK) == 1 ? '<i class="fa fa-check-circle" title="已审核"></i>' : '');
        },

        _getTickPaddingPeriod: function (min, max) {
            var period = -1;
            var offTs = max - min;
            if (offTs < 1000) {
                period = 1000;
            } else if (offTs < 60000) {
                period = 5000;  //the tick period should lager than 5 seconds when time off in one minute
            } else if (offTs < 600000) {
                period = 120000 //2 minutes when time off in 10 minutes
            } else if (offTs < 1800000) {
                period = 300000  //5 minutes when time off in 30 minutes
            } else if (offTs < 3600000) {
                period = 600000; //10 minutes when time off in 1 hour
            } else if (offTs < 6 * 3600000) {
                period = 3600000
            } else if (offTs < 12 * 3600000) {
                period = 2 * 3600000;
            } else if (offTs < 24 * 3600000) {
                period = 4 * 3600000;
            } else if (offTs < 10 * 24 * 3600000) {
                period = 24 * 3600000;  // one day when time off in 10 days
            } else if (offTs < 20 * 24 * 3600000) {
                period = 2 * 24 * 3600000;  // 2 days when time off in 20 days
            } else if (offTs < 30 * 24 * 3600000) {
                period = 5 * 24 * 3600000;  // 5 days when time off in 30 days
            } else if (offTs < 60 * 24 * 3600000) {
                period = 10 * 24 * 3600000;
            } else if (offTs < 120 * 24 * 3600000) {
                period = 20 * 24 * 3600000;
            } else {
                period = 30 * 24 * 3600000;  // 1 month when time off large than 120 days
            }

            return period;
        },

        _getTimeTickFromData: function (dataType, dataList, ticksMap) {
            if (dataList && dataList.length > 0) {
                for (var i = 0; i < dataList.length; i++) {
                    var tmp = ticksMap[dataList[i].crt_TS];
                    if (!tmp) {
                        tmp = {};
                        ticksMap[dataList[i].crt_TS] = tmp;
                    }

                    var typeTmp = tmp[dataType];
                    if (!typeTmp) {
                        typeTmp = [];
                        tmp[dataType] = typeTmp;
                    }

                    typeTmp.push(dataList[i]);
                }
            }
        },

        _getTickDomainAndLabels: function (timeLineData) {
            if (!timeLineData || timeLineData.length == 0) {
                return {domain: undefined, ticks: []};
            }

            var min = timeLineData[0].time, max = timeLineData[0].time;
            var tickValues = [min];

            for (var i = 1; i < timeLineData.length; i++) {
                if (min > timeLineData[i].time) {
                    min = timeLineData[i].time;
                }
                if (max < timeLineData[i].time) {
                    max = timeLineData[i].time;
                }

                tickValues.push(timeLineData[i].time);
            }
            var domain = [new Date(min), new Date(max)];

            var period = this._getTickPaddingPeriod(min, max);

            //sort asc
            for (var i = 0; i < tickValues.length; i++) {
                for (var j = i + 1; j < tickValues.length; j++) {
                    if (tickValues[i] > tickValues[j]) {
                        var tmp = tickValues[j];
                        tickValues[j] = tickValues[i];
                        tickValues[i] = tmp;
                    }
                }
            }

            //tick values
            var tickValuesNew = [new Date(tickValues[0])], preTick = tickValues[0];
            for (var i = 1; i < tickValues.length; i++) {
                if (tickValues[i] - preTick > period) {
                    tickValuesNew.push(new Date(tickValues[i]));
                    preTick = tickValues[i];
                }
            }

            return {domain: domain, ticks: tickValuesNew};
        },

        _getTxtContent: function (tickData) {
            if (tickData.isCreate) {
                return '告警产生';
            } else if (tickData.isCheck) {
                return '告警确认';
            } else if (tickData.isClose) {
                return '告警关闭';
            } else {
                //forward data
                var txt = '';
                tickData = tickData.data;
                if (tickData.msg && tickData.msg.length > 0) {
                    txt += '短信、';
                }
                if (tickData.mail && tickData.mail.length > 0) {
                    txt += '邮件、';
                }
                if (tickData.weChat && tickData.weChat.length > 0) {
                    txt += '微信、';
                }
                if (tickData.maint && tickData.maint.length > 0) {
                    txt += '工单、';
                }
                
                if (txt.length > 0) {
                    txt = txt.substr(0, txt.length - 1) + '转发';
                }
                
                return txt;
            }
        },

        _getTxtColor: function (tickData) {
            if (tickData.isCreate) {
                return '#d62728';
            } else if (tickData.isCheck) {
                return '#18a689';
            } else if (tickData.isClose) {
                return '#636363';
            } else if(tickData.data.maint && tickData.data.maint.length > 0){
                return '#f0ad4e';
            }else{
                return '#1a7bb9';
            }
        },

        _setDescForTLClick: function (tickData) {
            var descNode = $(this.domNode).find('.rightContent>div>.bottom>.detail .detailContainer>.labelDesc');
            var str = '';

            var tmStr = new Date(tickData.time).format('yyyy-MM-dd HH:mm');
            var rec = tickData.data;

            if (tickData.isCreate) {
                str = '设备【' + rec.c_NM + '】'

                if (!base.isNull(rec.meta_ID)) {
                    str += '的元数据【' + (rec.meta_NM && rec.meta_NM.length > 0 ? rec.meta_NM : rec.meta_CID) + '】';
                }
                str += '在 ' + tmStr + ' ';
                if (!base.isNull(rec.rule_ID) && rec.rule_ID.length > 0) {
                    str += '因规则【' + this.allRules[rec.rule_ID].rule_NM + '】'
                }
                str += '产生预警';

                descNode.show().html(str);

            } else if (tickData.isCheck) {
                str += '预警于 ' + tmStr + ' 被 ' + rec.wrn_CHK_UNM + ' 确认';

                descNode.show().html(str);

            } else if (tickData.isClose) {
                str += '预警于 ' + tmStr + ' 被 ' + rec.wrn_CLOSE_UNM + ' 关闭';

                descNode.show().html(str);

            } else {
                str += '<span>' + tmStr + '</span>';

                var msgStr = '', msgId = null;
                if (rec.msg && rec.msg.length > 0) {
                    var nameStr = '';
                    for (var i = 0; i < rec.msg.length && i < 10; i++) {
                        nameStr += rec.msg[i].wm_PHONE + (rec.msg[i].wm_NM && rec.msg[i].wm_NM.length > 0 ? ('(' + rec.msg[i].wm_NM + ')') : '') + '、';
                    }
                    if (nameStr.length > 0) {
                        nameStr = nameStr.substr(0, nameStr.length - 1);
                    }
                    if (rec.msg.length > 10) {
                        nameStr += '...';
                    }

                    msgId = rec.msg[0].msg_ID;
                    msgStr = '<div><span>短信转发至 ' + nameStr + ', 短信内容:</span>';
                }

                var mailStr = '', mailId = null;
                if (rec.mail && rec.mail.length > 0) {
                    var nameStr = '';
                    for (var i = 0; i < rec.mail.length && i < 10; i++) {
                        nameStr += rec.mail[i].wml_ADDR + (rec.mail[i].wml_NM && rec.mail[i].wml_NM.length > 0 ? ('(' + rec.mail[i].wml_NM + ')') : '') + '、';
                    }
                    if (nameStr.length > 0) {
                        nameStr = nameStr.substr(0, nameStr.length - 1);
                    }
                    if (rec.mail.length > 10) {
                        nameStr += '...';
                    }

                    mailId = rec.mail[0].mail_ID;
                    mailStr = '<div><span>邮件转发至 ' + nameStr + ', 邮件内容:</span>';
                }

                var wechatStr = '', wechatId = null;
                if (rec.weChat && rec.weChat.length > 0) {
                    var nameStr = '';
                    for (var i = 0; i < rec.weChat.length && i < 10; i++) {
                        nameStr += rec.weChat[i].wechat_CD + '、';
                    }
                    if (nameStr.length > 0) {
                        nameStr = nameStr.substr(0, nameStr.length - 1);
                    }
                    if (rec.weChat.length > 10) {
                        nameStr += '...';
                    }

                    wechatId = rec.weChat[0].wechat_ID;
                    wechatStr = '<div><span>发布至微信公众号 ' + nameStr + ', 公众号内容:</span>';
                }
                
                var maintStr = '';
                if (rec.maint && rec.maint.length > 0) {
                    for (var i = 0; i < rec.maint.length; i++) {
                        maintStr += '<div><span>' + rec.maint[i].maint_CRT_UNM + '发布运维工单, 工单内容:</span>' + rec.maint[i].maint_DESC + '</div>';
                    }
                }

                //msg/mail/wechat may hava different content, but here we just show the content of the first record, generally, messages forward at the same time have the save content.
                if(msgId || mailId || wechatId){
                    base.ajax({
                        url: base.getServerNM() + 'platformApi/own/warn/normal/pushedInfo',
                        data: {
                            wrnId: this.currentRow.wrn_ID,
                            msgId: msgId,
                            mailId: mailId,
                            wechatId: wechatId
                        }
                    }).success(lang.hitch(this, function (ret) {
                        var pushedData = ret.data;
                        if (msgId) {
                            msgStr += (pushedData.msg && pushedData.msg.msg_DESC ? pushedData.msg.msg_DESC : '[<em>空</em>]') + '</div>';
                        }
                        if (mailId) {
                            mailStr += (pushedData.mail && pushedData.mail.mail_DESC ? pushedData.mail.mail_DESC : '[<em>空</em>]') + '</div>';
                        }
                        if (wechatId) {
                            wechatStr += (pushedData.weChat && pushedData.weChat.wechat_CONTENT ? pushedData.weChat.wechat_CONTENT : '[<em>空</em>]') + '</div>';
                        }

                        str += msgStr + mailStr + wechatStr + maintStr;
                        descNode.show().html(str);
                    }));
                    
                }else{
                    str += msgStr + mailStr + wechatStr + maintStr;
                    descNode.show().html(str);
                }
            }
        },

        _refreshTimeLine: function (extendData) {
            var ticksMap = {};
            this._getTimeTickFromData('msg', extendData.msg, ticksMap);
            this._getTimeTickFromData('mail', extendData.mail, ticksMap);
            this._getTimeTickFromData('weChat', extendData.weChat, ticksMap);
            this._getTimeTickFromData('maint', extendData.maint, ticksMap);

            var timeLineData = [];
            for (var tmKey in ticksMap) {
                timeLineData.push({time: parseInt(tmKey), data: ticksMap[tmKey]});
            }

            //create time tick
            timeLineData.push({time: extendData.warnInfo.crt_TS, isCreate: true, data: extendData.warnInfo});
            //confirm time tick
            if (parseInt(extendData.warnInfo.wrn_CHK) == 1) {
                timeLineData.push({time: extendData.warnInfo.wrn_CHK_TS, isCheck: true, data: extendData.warnInfo});
            }
            //close time tick
            if (parseInt(extendData.warnInfo.wrn_CLOSE) == 1) {
                timeLineData.push({time: extendData.warnInfo.wrn_CLOSE_TS, isClose: true, data: extendData.warnInfo});
            }

            //cache the current timeline data for dynamic update
            this.timeLineData = timeLineData;
            this._genTimeLine();
        },

        _genTimeLine: function () {
            var domainAndTicks = this._getTickDomainAndLabels(this.timeLineData);

            var width = $(this.domNode).find('.rightContent>div>.bottom>.detail .detailContainer>.timeLine').width();

            if (!this.tl) {
                var colorFunc = lang.hitch(this, function (d) {
                    return this._getTxtColor(d);
                });
                var txtFunc = lang.hitch(this, function (d, i) {
                    return this._getTxtContent(d);
                });

                this.tl = new D3TimeLine($(this.domNode).find('.rightContent>div>.bottom>.detail .detailContainer>.timeLine'), {
                    direction: 'down',
                    initialWidth: width,
                    margin: {left: 40, right: 80, top: 52, bottom: 20},
                    textFn: txtFunc,
                    tickFormat: d3.time.format("%m-%e %H:%M"),
                    tickValues: domainAndTicks.ticks,
                    /*scale: d3.time.scale(),  //default scale is 'd3.time.scale()' */
                    domain: domainAndTicks.domain,   //time axis domain
                    layerGap: 40,
                    dotColor: colorFunc,
                    labelBgColor: colorFunc,
                    linkColor: colorFunc,
                    labella: {
                        maxPos: width,
                        algorithm: 'simple'
                    }
                });
                this.tl.on('labelClick', lang.hitch(this, function (d, i) {
                    this._setDescForTLClick(d);
                }));

                this.tl.data(this.timeLineData);
                this.tl.resizeToFit();

                this.own(this.tl);

            } else {
                this.tl.options({
                    tickValues: domainAndTicks.ticks,
                    domain: domainAndTicks.domain,
                    labella: {
                        maxPos: width,
                        algorithm: 'simple'
                    }
                });
                this.tl.data(this.timeLineData);
                this.tl.resizeToFit();
            }
        },

        _refreshTimeLine_dynamic: function (actionType, warnInfoData) {
            if (this.timeLineData) {
                if (actionType == 'close') {
                    this.timeLineData.push({time: (new Date()).getTime(), isClose: true, data: warnInfoData});

                } else if (actionType == 'check') {
                    this.timeLineData.push({time: (new Date()).getTime(), isCheck: true, data: warnInfoData});
                }

                this._genTimeLine();
            }
        },

        _showDetail: function (data) {
            this.currentRow = data;

            $(this.domNode).find('.rightContent>div>.bottom>.detail .detailContainer>.labelDesc').hide();
            $(this.domNode).find('.rightContent>div>.bottom>.detail .detailContainer>.actionBar .wrnAction').unbind();

            this._getAllRules(lang.hitch(this, function () {
                base.ajax({
                    url: base.getServerNM() + 'platformApi/own/warn/normal/warnInfo/extend',
                    data: {wrnId: data.wrn_ID}
                }).success(lang.hitch(this, function (ret) {
                    var warnInfo = ret.data.warnInfo;

                    var detailParent = $(this.domNode).find('.rightContent>div>.bottom>.detail .detailContainer>.warnDetail');
                    detailParent.find('.warnDesc').html(warnInfo.wrn_DESC);
                    detailParent.find('.clientNM').html(warnInfo.c_NM);
                    if (!base.isNull(warnInfo.meta_ID)) {
                        detailParent.find('.metadataNM').html(warnInfo.meta_NM && warnInfo.meta_NM.length > 0 ? warnInfo.meta_NM : warnInfo.meta_CID);
                    } else {
                        detailParent.find('.metadataNM').html('[<em>未绑定</em>]');
                    }

                    if (!base.isNull(warnInfo.rule_ID) && warnInfo.rule_ID.length > 0) {
                        detailParent.find('.ruleNM').html(this.allRules[warnInfo.rule_ID].rule_NM);
                    } else {
                        detailParent.find('.ruleNM').html('[<em>未绑定</em>]');
                    }

                    this._setActionStatus(data, warnInfo);

                    this._refreshTimeLine(ret.data);

                }));
            }));
        },

        _setActionStatus: function (rowData, warnInfoData) {
            var parent = $(this.domNode).find('.rightContent>div>.bottom>.detail .detailContainer>.actionBar');

            //the buttons are bindAuthed
            var btnChk = parent.find('.wrnChk[bindAuthResult="true"]').unbind();
            var btnForward = parent.find('.wrnForward[bindAuthResult="true"]').unbind();
            var btnClose = parent.find('.wrnClose[bindAuthResult="true"]').unbind();

            var closeFun = lang.hitch(this, function () {
                this._updateWarn(rowData.wrn_ID, 'close').done(lang.hitch(this, function () {
                    var uptObj = {wrn_CLOSE: 1, wrn_CLOSE_TS: (new Date()).getTime(), wrn_CLOSE_UID: base.getUid()};
                    $.extend(rowData, uptObj);
                    $.extend(warnInfoData, uptObj);

                    this._setActionStatus(rowData, warnInfoData);
                    this._refreshTimeLine_dynamic('close', warnInfoData);
                    this._refreshItem(rowData);

                    this._closed(rowData);
                }));
            });
            var checkFun = lang.hitch(this, function () {
                this._updateWarn(rowData.wrn_ID, 'check').done(lang.hitch(this, function () {
                    var uptObj = {wrn_CHK: 1, wrn_CHK_TS: (new Date()).getTime(), wrn_CHK_UID: base.getUid()};
                    $.extend(rowData, uptObj);
                    $.extend(warnInfoData, uptObj);

                    this._setActionStatus(rowData, warnInfoData);
                    this._refreshTimeLine_dynamic('check', warnInfoData);
                    this._refreshItem(rowData);

                    this._checked(rowData);
                }));
            });
            var forwardFun = lang.hitch(this, function (e) {
                this._forwardWarn(warnInfoData, $(e.currentTarget).attr('data'));
            });

            if (parseInt(rowData.wrn_CLOSE) == 1) {
                btnChk.hide();
                btnForward.hide();
                btnClose.hide();

                this.brand.setInfo('已关闭', '#636363');

            } else if (parseInt(rowData.wrn_CHK) == 1) {
                btnChk.hide();
                btnForward.show().find('li').click(forwardFun);
                btnClose.show().click(closeFun);

                this.brand.setInfo('已确认', '#18a689');

            } else {
                btnChk.show().click(checkFun);
                btnForward.hide();
                btnClose.show().click(closeFun);

                this.brand.setInfo('未确认', '#bbb');
            }
        },

        _updateWarn: function (wrnId, actionType) {
            var def = $.Deferred();
            base.ajax({
                type: 'PUT',
                url: base.getServerNM() + 'platformApi/own/warn/update',
                data: {
                    wrnIds: JSON.stringify([wrnId]),
                    actionType: actionType
                }
            }).success(lang.hitch(this, function (ret) {
                def.resolve();
            })).fail(function () {
                def.reject();
            });

            return def.promise();
        },

        _forwardWarn: function (warnInfoData, fdType) {
            this._destroyPreForwardObj();

            var args = {
                wrn_ID: warnInfoData.wrn_ID,
                wrn_NM: warnInfoData.wrn_NM,
                wrn_DESC: warnInfoData.wrn_DESC
            };

            if(fdType == 'msg'){
                this._forwarnWarn_msg(args);
                
            }else if(fdType == 'mail'){
                this._forwarnWarn_mail(args);
                
            }else if(fdType == 'wechat'){
                this._forwarnWarn_wechat(args);
                
            }else if(fdType == 'maint'){
                args = {
                    clientIds: [warnInfoData.c_ID],
                    maintDesc: '告警信息：' + warnInfoData.wrn_DESC,
                    wrnId: warnInfoData.wrn_ID
                };
                
                this._forwarnWarn_maint(args);
            }
        },

        _destroyPreForwardObj: function () {
            if (this.preForwardObj) {
                this.preForwardObj.destroyRecursive();
                this.preForwardObj = null;
            }
        },
        
        _forwarnWarn_wechat: function (args) {
            base.newDojo(
                'component/infoCenter/widget/warn/widget/wechat/wechat',
                'component.infoCenter.widget.warn.wechat',
                args
            ).success(lang.hitch(this, function (obj) {

                this.preForwardObj = obj;

                var modal = $(this.domNode).find('.modal.forwardWin').modal({backdrop: 'static', keyboard: false});

                modal.find('.modal-title').html('微信转发');

                modal.find('.modal-body').append($(this.preForwardObj.domNode));

                this.preForwardObj.startup();
            }));
        },

        _forwarnWarn_mail: function (args) {
            base.newDojo(
                'component/infoCenter/widget/warn/widget/mail/mail',
                'component.infoCenter.widget.warn.mail',
                args
            ).success(lang.hitch(this, function (obj) {
                this.preForwardObj = obj;

                var modal = $(this.domNode).find('.modal.forwardWin').modal({backdrop: 'static', keyboard: false});

                modal.find('.modal-title').html('邮件转发');

                modal.find('.modal-body').append($(this.preForwardObj.domNode));

                this.preForwardObj.startup();
            }));
        },

        _forwarnWarn_msg: function (args) {
            base.newDojo(
                'component/infoCenter/widget/warn/widget/msg/msg',
                'component.infoCenter.widget.warn.msg',
                args
            ).success(lang.hitch(this, function (obj) {
                this.preForwardObj = obj;

                var modal = $(this.domNode).find('.modal.forwardWin').modal({backdrop: 'static', keyboard: false});

                modal.find('.modal-title').html('短信转发');

                modal.find('.modal-body').append($(this.preForwardObj.domNode));

                this.preForwardObj.startup();
            }));
        },
        
        _forwarnWarn_maint: function(args){
            base.newDojo(
                'common/widget/maintRecordCreator/maintRecordCreator', 
                'maintRecordCreator', 
                args
            ).success(lang.hitch(this, function (obj) {
                this.preForwardObj = obj;
                
                var modal = $(this.domNode).find('.modal.forwardMaint').modal({backdrop: 'static', keyboard: false});
                
                modal.find('.modal-body').append($(this.preForwardObj.domNode));

                this.preForwardObj.startup();
            }));
        },

        _getAllRules: function (callBack) {
            if (this.allRules) {
                callBack()
            } else {
                base.ajax({
                    url: base.getServerNM() + 'platformApi/own/rule/normal/allRule'
                }).success(lang.hitch(this, function (ret) {
                    this.allRules = ret.data;
                    callBack();
                }));
            }
        },

        _clearDetail: function () {
            var parent = $(this.domNode).find('.rightContent>div>.bottom>.detail .detailContainer');
            parent.find('.warnDetail .labelForVal').html(null);
            parent.find('.labelDesc').hide();

            this.currentRow = null;
            $(this.domNode).find('.rightContent>div>.bottom .warnsContainer tr.active').removeClass('active');
        },

        _resizeManual: function (percentage) {
            var parent = $(this.domNode).find('.rightContent>div>.bottom>.list .warnsContainer');
            var parentWidth = parseInt(parent.width() * percentage);

            parent.children('tr').each(lang.hitch(this, function (index, e) {
                var cur = $(e);
                var data = cur.data('data');

                cur.find('td:first-child').html(this._getSubTitle(data.wrn_NM, parentWidth));
            }));
        },

        _setFilter: function () {
            base.ajax({
                url: base.getServerNM() + 'platformApi/own/warn/normal/unClosed/statistic'
            }).success(lang.hitch(this, function (ret) {
                var data = ret.data;

                //all
                data.all = parseInt(data.all);
                $(this.domNode).find('.warnFilter li>a[data="all"]>span').html(this._getCountSpanVal(data.all)).data('count', data.all);

                //warn confirm status catalog
                var countMap = {};
                if (data.warnConfirm && data.warnConfirm.length > 0) {
                    for (var i = 0; i < data.warnConfirm.length; i++) {
                        countMap[parseInt(data.warnConfirm[i].wrn_CHK)] = parseInt(data.warnConfirm[i].count);
                    }
                }

                $(this.domNode).find('.warnFilter1 li>a[data="0"]>span').html(this._getCountSpanVal(countMap[0])).data('count', countMap[0]);
                $(this.domNode).find('.warnFilter1 li>a[data="1"]>span').html(this._getCountSpanVal(countMap[1])).data('count', countMap[1]);

                topic.publish('component/infoCenter/refreshInfoCount', {wrnCount: data.all});

            })).fail(lang.hitch(this, function () {
                $(this.domNode).find('.warnFilter li>a[data="all"]>span').html(null);

                $(this.domNode).find('.warnFilter1 li>a>span').html(null);

                topic.publish('component/infoCenter/refreshInfoCount', {wrnCount: 0});
            }));
        },

        _getCountSpanVal: function (val) {
            return !base.isNull(val) && parseInt(val) > 0 ? ('(' + val + ')') : '';
        },

        _closed: function (record) {
            var curVal = 0, spanNode = null;

            spanNode = $(this.domNode).find('.warnFilter1 li>a[data="' + record.wrn_CHK + '"]>span');
            curVal = spanNode.data('count');
            if (!base.isNull(curVal)) {
                spanNode.html(this._getCountSpanVal(curVal - 1)).data('count', curVal - 1);
            }

            spanNode = $(this.domNode).find('.warnFilter li>a[data="all"]>span');
            curVal = spanNode.data('count');
            if (!base.isNull(curVal)) {
                spanNode.html(this._getCountSpanVal(curVal - 1)).data('count', curVal - 1);
            }

            topic.publish('component/infoCenter/refreshInfoCount', {wrnCount: curVal - 1});
            topic.publish('topInfo/refreshInfo', {increment: -1});
        },

        _checked: function (record) {
            var curVal = 0, spanNode = null;

            spanNode = $(this.domNode).find('.warnFilter1 li>a[data="0"]>span');
            curVal = spanNode.data('count');
            if (!base.isNull(curVal)) {
                spanNode.html(this._getCountSpanVal(curVal - 1)).data('count', curVal - 1);
            }

            spanNode = $(this.domNode).find('.warnFilter1 li>a[data="1"]>span');
            curVal = spanNode.data('count');
            if (!base.isNull(curVal)) {
                spanNode.html(this._getCountSpanVal(curVal + 1)).data('count', curVal + 1);
            }
        },

        _initEvents: function () {
            var sub1 = topic.subscribe('component/infoCenter/refresh', lang.hitch(this, function (data) {
                this._setFilter();
                if (this._filterAction($(this.domNode).find('.warnFilter li>a[data="all"]'), true)) {
                    this._setData();
                }
            }));
            
            var sub2 = topic.subscribe("component/infoCenter/widget/warn/sendSuccess", lang.hitch(this, function () {
                $(this.domNode).find('.modal.forwardWin').modal('hide');
                this._showDetail(this.currentRow);
            }));
            
            var sub3 = topic.subscribe('common/widget/maintRecordCreator/finish', lang.hitch(this, function(data){
                this._showDetail(this.currentRow);
            }));
            
            var sub4 = topic.subscribe('common/widget/maintRecordCreator/close', lang.hitch(this, function(data){
                $(this.domNode).children('.modal.forwardMaint').modal('hide');
            }));
            
            this.own(sub1);
            this.own(sub2);
            this.own(sub3);
            this.own(sub4);
        }
    })
});
