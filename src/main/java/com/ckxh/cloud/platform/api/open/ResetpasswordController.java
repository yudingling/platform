package com.ckxh.cloud.platform.api.open;

import java.io.IOException;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.ckxh.cloud.base.util.Encrypt;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.model.MAIN_USER;
import com.ckxh.cloud.persistence.db.user.service.UserInfoService;

@Scope("singleton")
@Controller
@RequestMapping("/open/resetpassword")
public class ResetpasswordController {
	@Autowired
	private UserInfoService userInfoService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.PUT)
	public String post(@RequestParam String qa, @RequestParam String pwd, HttpServletRequest request, HttpServletResponse response) throws IOException{
		try{
			if(qa != null && qa.length() > 0 && pwd != null && pwd.length() > 0){
				String uid = this.userInfoService.getQuickAccess(qa, false);
				if(uid != null && uid.length() > 0){
					MAIN_USER user = this.userInfoService.getUserInfo(uid);
					if(user != null && user.getU_ACTIVE() == 1 && user.getU_DISABLED() == 0 
							&& this.userInfoService.updateUserBaseInfo(uid, new String[]{"U_PWD"}, new Object[]{Encrypt.SHA1(pwd)})){
						//1、remove quick access code
						this.userInfoService.deleteQuickAccess(qa);
						
						//2、set the current session
						AuthUtil.setIdToSession(request, response, uid, false);
						
						return JsonUtil.createSuccessJson(true, null, "修改密码成功", null);
					}
				}
			}
			
			return JsonUtil.createSuccessJson(false, null, "参数错误！", null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
