package com.ckxh.cloud.platform.api.open;

import net.sf.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import com.ckxh.cloud.base.util.ConstString;
import com.ckxh.cloud.persistence.common.CacheChanger;
import com.ckxh.cloud.persistence.common.WeChatCfg;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.model.MAIN_USER_APPBIND;
import com.ckxh.cloud.persistence.db.user.service.UserInfoService;
import com.ckxh.cloud.platform.util.wechat.OAuthUtil;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@Scope("singleton")
@Controller
@RequestMapping("/open/wechat/oauth/snsapi_base")
public class WeChatOauthSnsapi_BaseController {
	@Autowired
	private UserInfoService userInfoService;
	@Autowired
	private CacheChanger cacheChanger;

	@ResponseBody
	@RequestMapping(method = RequestMethod.GET)
	public String oauth(@RequestParam String code, @RequestParam String state, HttpServletRequest request, HttpServletResponse response) {
		try {
			if (code == null || code.length() == 0 || state == null || state.length() == 0) {			
				throw new Exception("参数错误");
			}

			String appId = WeChatCfg.DicKey_weChat_appId;
			String appSecret = WeChatCfg.DicKey_weChat_appSecret;
			JSONObject webTokenJson = OAuthUtil.getWebToken(appId, appSecret, code);

			if (webTokenJson != null) {
				String mobileId = webTokenJson.getString("openid");							
				MAIN_USER_APPBIND appBindInfo = userInfoService.getAppBindFromWeChatId(null, mobileId);
				
				String platformAppNm = this.cacheChanger.getLocalValue(ConstString.DicKey_platformAppServerNM, null);			
				String redirectURL = platformAppNm + "static/signin.jsp?mobileId=" + mobileId + "&state=" + state;
				
				if(appBindInfo == null) {
					response.sendRedirect(redirectURL);
				}else{
					AuthUtil.setIdToSession(request, response, appBindInfo.getU_ID(), false);
					request.getSession().setAttribute(ConstString.SessionKey_Mobile, mobileId);
					response.sendRedirect(state);
				}
			}

			return null;
		} catch (Exception e) {
			e.printStackTrace();
			return "mobile/oauthError";
		}
	}
}
