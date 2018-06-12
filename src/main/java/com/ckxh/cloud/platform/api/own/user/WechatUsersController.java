package com.ckxh.cloud.platform.api.own.user;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.persistence.common.WeChatCfg;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.model.MAIN_USER_APPBIND;
import com.ckxh.cloud.persistence.db.user.service.UserInfoService;
import com.ckxh.cloud.platform.model.WechatUserInfo;
import com.ckxh.cloud.platform.util.wechat.CommonUtil;

@Scope("singleton")
@Controller
@RequestMapping("/own/user/normal/wechatUsers")
public class WechatUsersController {
	@Autowired
	private UserInfoService userInfoService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String get(HttpServletRequest request, HttpServletResponse response){
		try{
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			List<MAIN_USER_APPBIND> bidUsers = this.userInfoService.getAppBindListFromUid(uid);
			Map<String, Object> params = this.getBatchUserInfoParams(bidUsers);
			
			if(params != null && !params.isEmpty()){
				String url = WeChatCfg.DicKey_weChat_batchUserInfoUrl.replaceFirst("ACCESS_TOKEN", CommonUtil.getToken());
				JSONObject userInfo = CommonUtil.httpsRequest(url, "POST", MsgPackUtil.serialize2Str(params));
				
				if(userInfo != null){
					List<WechatUserInfo> retList = this.getUserInfoFromResult(userInfo);
					if(retList != null){
						return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(retList), null, null);
					}
				}
			}
			
			return JsonUtil.createSuccessJson(true, null, null, null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
	
	private List<WechatUserInfo> getUserInfoFromResult(JSONObject userInfo){
		if(userInfo.containsKey("user_info_list")){
			JSONArray arr = userInfo.getJSONArray("user_info_list");
			if(arr != null){
				List<WechatUserInfo> retList = new ArrayList<WechatUserInfo>();
				
				@SuppressWarnings("rawtypes")
				Iterator it = arr.iterator();
	            while (it.hasNext()) {
	                JSONObject cur = (JSONObject) it.next();
	                
	                retList.add(new WechatUserInfo(cur.getString("openid"), cur.getString("nickname"), cur.getString("headimgurl")));
	            }
	            
	            return retList;
			}
		}
		
		return null;
	}
	
	private Map<String, Object> getBatchUserInfoParams(List<MAIN_USER_APPBIND> bidUsers){
		List<Map<String, String>> content = new ArrayList<Map<String, String>>();
		
		for(MAIN_USER_APPBIND user : bidUsers){
			if(user.getAB_WECHAT_ID() != null){
				Map<String, String> tmp = new HashMap<String, String>();
				tmp.put("openid", user.getAB_WECHAT_ID());
				tmp.put("lang", "zh_CN");
				
				content.add(tmp);
			}
		}
		
		if(!content.isEmpty()){
			Map<String, Object> params = new HashMap<String, Object>();
			params.put("user_list", content);
			return params;
			
		}else{
			return null;
		}
	}
}
