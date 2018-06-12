package com.ckxh.cloud.platform.api.own;

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

import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.user.service.UserInfoService;
import com.ckxh.cloud.persistence.model.UserRoleMenu;

@Scope("singleton")
@Controller
@RequestMapping("/own/componentAuth/self")
public class SelfAuthController {
	
	@Autowired
	private UserInfoService userInfoService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String bind(@RequestParam String cls, HttpServletRequest request, HttpServletResponse response){
		try{
			if(cls != null && cls.length() > 0){
				String uid = AuthUtil.getIdFromSession(request.getSession());
				Map<String, UserRoleMenu> roleMenus = this.userInfoService.getUserRoleMenu(uid);
				
				//'get' is enough
				for(UserRoleMenu menu: roleMenus.values()){
					if(cls.equals(menu.getAPI_CLS())){
						return JsonUtil.createSuccessJson(true, null, null, null);
					}
				}
				
				throw new Exception("unauthorized");
				
			}else{
				throw new Exception("参数错误");
			}
		}catch(Exception ex){
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
