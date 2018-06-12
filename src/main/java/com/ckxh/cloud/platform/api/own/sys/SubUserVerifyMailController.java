package com.ckxh.cloud.platform.api.own.sys;

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
import com.ckxh.cloud.persistence.common.UserEffectiveTool;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.model.MAIN_USER;
import com.ckxh.cloud.persistence.db.user.service.UserInfoService;

@Scope("singleton")
@Controller
@RequestMapping("/own/sys/normal/subUser/verifyMail")
public class SubUserVerifyMailController {
	@Autowired
	private UserInfoService userInfoService;
	@Autowired
	private UserEffectiveTool userEffectiveTool;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.POST)
	@AuthPathOnBind("get:/platformApi/own/sys/normal/#")
	public String get(@RequestParam String uId, HttpServletRequest request, HttpServletResponse response){
		try{
			if(uId == null || uId.length() == 0){
				throw new Exception("参数错误");
			}
			
			String parentUid = AuthUtil.getIdFromSession(request.getSession());
			MAIN_USER user = this.userInfoService.getUserInfo(uId);
			
			if(user == null || !parentUid.equals(user.getU_PID())){
				throw new Exception("参数错误");
			}
			
			//should not judge from 'u_active == 0', cause we may manually set the user's activity to 0
			if(user.getU_PHONE() == null){
				this.userEffectiveTool.afterSubUserCreate(user);
				
				return JsonUtil.createSuccessJson(true, null, "已发送验证邮件，请该用户及时确认(24小时内有效)", null);
				
			}else{
				throw new Exception("用户已经通过验证");
			}
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
