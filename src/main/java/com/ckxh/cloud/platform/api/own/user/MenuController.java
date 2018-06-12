package com.ckxh.cloud.platform.api.own.user;

import java.util.Map;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.user.service.UserInfoService;
import com.ckxh.cloud.persistence.model.UserRoleMenu;

@Scope("singleton")
@Controller
@RequestMapping("/own/user/normal/menu")
public class MenuController {
	
	@Autowired
	private UserInfoService userInfoService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String get(HttpServletRequest request, HttpServletResponse response){
		try{
			String uid = AuthUtil.getIdFromSession(request.getSession());
			Map<String, UserRoleMenu> menus = this.userInfoService.getUserRoleMenu(uid);
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(menus), null, null);
			
		}catch(Exception ex){
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
