package com.ckxh.cloud.platform.util.wechat;

import com.ckxh.cloud.persistence.common.WeChatCfg;
import com.ckxh.cloud.persistence.db.model.MAIN_USER_APPBIND;
import net.sf.json.JSONObject;

public class OAuthUtil {

	public static JSONObject getWebToken(String appid, String appSecret, String code) {
		String webTokenUrl = WeChatCfg.DicKey_weChat_webTokenUrl;
		String url = webTokenUrl.replaceFirst("APPID", appid).replaceFirst("SECRET", appSecret).replaceFirst("CODE",code);
		JSONObject jsonObject = null;
		jsonObject = CommonUtil.httpsRequest(url, "GET", null);
		return jsonObject;
	}

	// not silent given authority
	public static MAIN_USER_APPBIND getUserInfo(String access_token, String openid) {
		MAIN_USER_APPBIND main_user_appbind = null;
		String userInfoUrl = WeChatCfg.DicKey_weChat_userInfoUrl;
		String url = userInfoUrl.replaceFirst("ACCESS_TOKEN", access_token).replaceFirst("OPENID", openid);
		JSONObject jsonObject = CommonUtil.httpsRequest(url, "GET", null);
		if (jsonObject != null) {
			main_user_appbind = new MAIN_USER_APPBIND();
			main_user_appbind.setAB_WECHAT_ID(jsonObject.getString("openid"));
		}
		return main_user_appbind;
	}
}
