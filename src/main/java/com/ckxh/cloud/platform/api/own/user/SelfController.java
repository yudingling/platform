package com.ckxh.cloud.platform.api.own.user;

import java.util.HashMap;
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
import com.ckxh.cloud.persistence.db.model.MAIN_USER;
import com.ckxh.cloud.persistence.db.user.service.UserInfoService;

@Scope("singleton")
@Controller
@RequestMapping("/own/user/normal/self")
public class SelfController {
	@Autowired
	private UserInfoService userInfoService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String get(HttpServletRequest request, HttpServletResponse response){
		try{
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			//get it from db instead of redis cache(value of profit field in redis is not the real-time value)
			MAIN_USER user = this.userInfoService.getUserInfo_fromDB(uid);
			
			String parentUnm = user.getU_PID() != null && user.getU_PID().length() > 0 ? this.userInfoService.getUserInfo(user.getU_PID()).getU_NM() : null;
			
			//clear the password
			user.setU_PWD(null);
			
			Map<String, Object> retMap = new HashMap<String, Object>();
			retMap.put("parentUnm", parentUnm);
			retMap.put("self", user);
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(retMap), null, null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.PUT)
	@AuthPathOnBind("get:/platformApi/own/user/normal/#")
	public String update(@RequestParam String updateType, @RequestParam(required = false) String fileId, @RequestParam(required = false) String data,
			HttpServletRequest request, HttpServletResponse response){
		try{
			if(updateType == null || updateType.length() == 0){
				throw new Exception("参数错误");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			boolean updated = false;
			if("common".equals(updateType)){
				if(data == null || data.length() == 0){
					throw new Exception("参数错误");
				}
				
				MAIN_USER userNew = MsgPackUtil.deserialize(data, MAIN_USER.class);
				if(userNew == null || !userNew.getU_ID().equals(uid)){
					throw new Exception("参数错误");
				}
				
				updated = this.userInfoService.updateUserBaseInfo(
						uid, 
						new String[]{"U_NM"}, 
						new Object[]{userNew.getU_NM()});
				
			}else if("icon".equals(updateType)){
				if(fileId == null || fileId.length() == 0){
					throw new Exception("参数错误");
				}
				
				updated = this.userInfoService.updateUserBaseInfo(uid, new String[]{"U_ICON"}, new Object[]{fileId});
			}
			
			return JsonUtil.createSuccessJson(updated, null, updated? "更新成功" : "更新失败", null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
