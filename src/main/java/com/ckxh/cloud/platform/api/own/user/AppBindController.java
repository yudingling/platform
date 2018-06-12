package com.ckxh.cloud.platform.api.own.user;

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
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.model.MAIN_USER;
import com.ckxh.cloud.persistence.db.model.MAIN_USER_APPBIND;
import com.ckxh.cloud.persistence.db.user.service.UserInfoService;

@Scope("singleton")
@Controller
@RequestMapping("/own/user/normal/appBind")
public class AppBindController {
	@Autowired
	private UserInfoService userInfoService;

	@ResponseBody
	@AuthPathOnBind("get:/platformApi/own/user/normal/#")
	@RequestMapping(method = RequestMethod.POST)
	public String bindUser(@RequestParam(required = false) String mobileId, HttpServletRequest request, HttpServletResponse response) {
		try {
			if (mobileId == null || mobileId.length() == 0) {
				throw new Exception("参数错误！");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			MAIN_USER user = this.userInfoService.getUserInfo(uid);
			if(user.getU_ISMAINT() == 0){
				MAIN_USER_APPBIND appBindInfo = userInfoService.getAppBindFromWeChatId(uid, mobileId);
				if (appBindInfo == null) {
					boolean flag = userInfoService.saveUserAppbind(uid, uid, mobileId);
					if(!flag){
						//cause this api is called from signin, we need to clear the session if error occurs on binding
						AuthUtil.removeIdFromSession(request, response);
						throw new Exception("禁止重复绑定！");					
					}
				}
				request.getSession().setAttribute(ConstString.SessionKey_Mobile, mobileId);
				
				return JsonUtil.createSuccessJson(true, null, "用户绑定成功！", null);
				
			}else{
				//sign out
				AuthUtil.removeIdFromSession(request, response);
				
				return JsonUtil.createSuccessJson(false, null, "运维用户请从运维 app 访问！", null);
			}
			
		} catch (Exception e) {
			e.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, e.getMessage(), null);
		}
	}
}
