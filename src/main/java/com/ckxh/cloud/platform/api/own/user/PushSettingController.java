package com.ckxh.cloud.platform.api.own.user;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.ckxh.cloud.base.annotation.AuthPathOnBind;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.user.service.UserInfoService;
import com.ckxh.cloud.persistence.model.User3rdPushSettingType;

@Scope("singleton")
@Controller
@RequestMapping("/own/user/normal/pushSetting")
public class PushSettingController {
	@Autowired
	private UserInfoService userInfoService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String get(HttpServletRequest request, HttpServletResponse response){
		try{
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			Map<User3rdPushSettingType, Boolean> map = this.userInfoService.getUser3rdPushSetting(uid);
			
			List<Map<String, Object>> retList = new ArrayList<Map<String, Object>>();
			
			for(User3rdPushSettingType key : map.keySet()){
				switch(key){
					case iot_warn_fatal:
						this.setRetMap(retList, "iotWarn", 2, map.get(key).booleanValue());
						break;
					case iot_warn_medium:
						this.setRetMap(retList, "iotWarn", 1, map.get(key).booleanValue());
						break;
					case iot_warn_ordinary:
						this.setRetMap(retList, "iotWarn", 0, map.get(key).booleanValue());
						break;
						
					case remind_fatal:
						this.setRetMap(retList, "remind", 2, map.get(key).booleanValue());
						break;
					case remind_medium:
						this.setRetMap(retList, "remind", 1, map.get(key).booleanValue());
						break;
					case remind_ordinary:
						this.setRetMap(retList, "remind", 0, map.get(key).booleanValue());
						break;
					default:
						break;
				}
			}
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(retList), null, null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
	
	private void setRetMap(List<Map<String, Object>> retList, String catalog, int level, boolean val){
		Map<String, Object> tmp = new HashMap<String, Object>();
		tmp.put("catalog", catalog);
		tmp.put("level", level);
		tmp.put("enabled", val);
		
		retList.add(tmp);
	}
	
	private User3rdPushSettingType getPushSettingType(String catalog, int level){
		if("iotWarn".equals(catalog)){
			if(level == 2){
				return User3rdPushSettingType.iot_warn_fatal;
			}else if(level == 1){
				return User3rdPushSettingType.iot_warn_medium;
			}else if(level == 0){
				return User3rdPushSettingType.iot_warn_ordinary;
			}
			
		}else if("remind".equals(catalog)){
			if(level == 2){
				return User3rdPushSettingType.remind_fatal;
			}else if(level == 1){
				return User3rdPushSettingType.remind_medium;
			}else if(level == 0){
				return User3rdPushSettingType.remind_ordinary;
			}
		}
		
		return null;
	}
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.PUT)
	@AuthPathOnBind("get:/platformApi/own/user/normal/#")
	public String update(@RequestParam String catalog, @RequestParam int level, @RequestParam boolean enabled,
			HttpServletRequest request, HttpServletResponse response){
		try{
			if(catalog == null || catalog.length() == 0){
				throw new Exception("参数错误");
			}
			
			User3rdPushSettingType stype = this.getPushSettingType(catalog, level);
			if(stype != null){
				String uid = AuthUtil.getIdFromSession(request.getSession());
				this.userInfoService.updateUser3rdPushSetting(uid, stype, enabled);
				
				return JsonUtil.createSuccessJson(true, null, "更新成功", null);
			}
			
			return JsonUtil.createSuccessJson(false, null, "更新失败", null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
