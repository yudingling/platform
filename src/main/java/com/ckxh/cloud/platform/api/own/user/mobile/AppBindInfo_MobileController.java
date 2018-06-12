package com.ckxh.cloud.platform.api.own.user.mobile;

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

import com.ckxh.cloud.base.annotation.AuthPathOnBind;
import com.ckxh.cloud.base.util.ConstString;
import com.ckxh.cloud.base.util.Encrypt;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.model.MAIN_USER;
import com.ckxh.cloud.persistence.db.model.MAIN_USER_APPBIND;
import com.ckxh.cloud.persistence.db.user.service.UserInfoService;

@Scope("singleton")
@Controller
@RequestMapping("/own/user/normal/mobile/appBindInfo")
@AuthPathOnBind("get:/platformApi/own/user/normal/#")
public class AppBindInfo_MobileController {
	@Autowired
	private UserInfoService userInfoService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String get(HttpServletRequest request, HttpServletResponse response){
		try{
			String mobileId = (String) request.getSession().getAttribute(ConstString.SessionKey_Mobile);
			if(mobileId == null){
				throw new Exception("用户未登录");
			}
			List<MAIN_USER_APPBIND> list = this.userInfoService.getAppBindListFromWechatId(mobileId);
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(list), null, null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
	
	@ResponseBody
	@RequestMapping(method = RequestMethod.PUT)
	public String put(@RequestParam String uid, HttpServletRequest request, HttpServletResponse response) {
		try {
			if(uid == null || uid.length() == 0){
				throw new Exception("参数错误");
			}
			
			String mobileId = (String) request.getSession().getAttribute(ConstString.SessionKey_Mobile);
			if(mobileId == null){
				throw new Exception("用户未登录");
			}
			
			String oldUid = AuthUtil.getIdFromSession(request.getSession());
			if(!oldUid.equals(uid)){
				boolean ret = this.userInfoService.updateAppBindForCurrentUsing(oldUid, uid, mobileId);
				if(ret){
					//set new session
					AuthUtil.setIdToSession(request, response, uid, false);
				}
				
				return JsonUtil.createSuccessJson(ret, null, ret? "切换成功" : "切换失败", null);
			}else{
				return JsonUtil.createSuccessJson(false, null, "参数错误", null);
			}
			
		}catch(Exception e){
			e.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, e.getMessage(), null);
		}
	}
	
	@ResponseBody
	@RequestMapping(method = RequestMethod.POST)
	public String post(@RequestParam String uid, @RequestParam String pwd, HttpServletRequest request, HttpServletResponse response) {
		try {
			String mobileId = (String) request.getSession().getAttribute(ConstString.SessionKey_Mobile);
			if(mobileId == null){
				throw new Exception("用户未登录");
			}
			
			if(uid != null && uid.length() > 0 && pwd != null && pwd.length() > 0){
				String oldUid = AuthUtil.getIdFromSession(request.getSession());
				if(oldUid.equals(uid)){
					return JsonUtil.createSuccessJson(false, null, "该用户已绑定", null);
				}
				
				MAIN_USER user = this.userInfoService.getUserInfo(uid);
				if(user != null && Encrypt.SHA1(pwd).equals(user.getU_PWD())){
					if(user.getU_DISABLED() == 0 && user.getU_ACTIVE() == 1){
						if(user.getU_ISMAINT() == 0){
							boolean flag = userInfoService.saveUserAppbind(oldUid, uid, mobileId);
							if(!flag){
								throw new Exception("禁止重复绑定！");					
							}
							
							//set new session
							AuthUtil.setIdToSession(request, response, uid, false);
							
							return JsonUtil.createSuccessJson(true, null, "绑定成功", null);
							
						}else{
							return JsonUtil.createSuccessJson(false, null, "禁止绑定运维用户!", null);
						}
						
					}else{
						return JsonUtil.createSuccessJson(false, null, "用户被禁用或未激活!", null);
					}
				}else{
					return JsonUtil.createSuccessJson(false, null, "验证失败!", null);
				}
			}else{
				return JsonUtil.createSuccessJson(false, null, "用户名、密码不能为空!", null);
			}
			
		}catch(Exception e){
			e.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, e.getMessage(), null);
		}
	}
}
