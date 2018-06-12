package com.ckxh.cloud.platform.api.own.warn;

import java.sql.Timestamp;
import java.util.List;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import com.ckxh.cloud.base.model.PushStatus;
import com.ckxh.cloud.base.util.ConstString;
import com.ckxh.cloud.base.util.DateUtil;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.persistence.common.CacheChanger;
import com.ckxh.cloud.persistence.common.SysTool;
import com.ckxh.cloud.persistence.common.WeChatCfg;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.client.service.WarnInfoService;
import com.ckxh.cloud.persistence.db.model.IOT_WARN_WECHAT;
import com.ckxh.cloud.persistence.db.model.MAIN_3RDPUSH_WECHAT;
import com.ckxh.cloud.platform.util.wechat.PushNewsUtil;

/**
 * this controller is using for authorization of sub user. 
 */
@Scope("singleton")
@Controller
@RequestMapping("own/warn/forward/wechat")
public class WeChatForwardController {
	@Autowired
	private WarnInfoService warnInfoService;
	@Autowired
	private CacheChanger cacheChanger;
	
	@ResponseBody
	@RequestMapping(method = RequestMethod.POST)
	public String post(@RequestParam Long wrnId, @RequestParam String title, @RequestParam String content, @RequestParam String thumb_media_id, HttpServletRequest request, HttpServletResponse response) {
		try {
			if (wrnId == null || thumb_media_id == null || thumb_media_id.length() == 0 || content == null || content.length() == 0) {
				throw new Exception("参数错误");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			//here we should not check whether the warning belong to the current user or not. cause the wechat forward was called by high priority users,
			//  and there is requirement for them to forward warnings from other users.
			
			Timestamp ts = DateUtil.getCurrentTS();
			String wechat_cd = WeChatCfg.DicKey_weChat_appId;
			
			List<Long> uuids = SysTool.longUuid(2);
			
			//save db first and then push to wechat
			MAIN_3RDPUSH_WECHAT pushWeChat = new MAIN_3RDPUSH_WECHAT(uuids.get(0), wechat_cd, PushStatus.sending.getValue(), title, content, thumb_media_id, uid, ts, ts);
			IOT_WARN_WECHAT iotWeChat = new IOT_WARN_WECHAT(uuids.get(1), wrnId, pushWeChat.getWECHAT_ID(),wechat_cd, ts, ts);
			this.warnInfoService.saveWarnPushInfoWeChat(pushWeChat, iotWeChat);
			
			String content_source_url = this.cacheChanger.getLocalValue(ConstString.DicKey_platformAppServerNM, null) + "platformMobile/main/mobile/iotWarnDetail?wrnId=" + wrnId;
			String message = PushNewsUtil.pushNewsToUser(title, content, thumb_media_id, content_source_url);
			if (message != "SUCCESS") {
				return JsonUtil.createSuccessJson(false, null, message, null);
			}else{
				return JsonUtil.createSuccessJson(true, null, "发送成功", null);
			}
			
		} catch (Exception ex) {
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, "发送失败", null);
		}
	}
}
