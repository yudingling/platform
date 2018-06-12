package com.ckxh.cloud.platform.api.own.client;

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

import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.client.service.ClientInfoService;
import com.ckxh.cloud.persistence.db.model.MAIN_USER;
import com.ckxh.cloud.persistence.db.user.service.UserInfoService;

@Scope("singleton")
@Controller
@RequestMapping("/own/client/normal/clientsFromParent")
public class ClientsFromParentController {
	@Autowired
	private ClientInfoService clientInfoService;
	@Autowired
	private UserInfoService userInfoService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String get(@RequestParam String childUid, HttpServletRequest request, HttpServletResponse response){
		try {
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			MAIN_USER child = this.userInfoService.getUserInfo(childUid);
			if(!uid.equals(child.getU_PID())){
				throw new Exception("参数错误");
			}
			
			List<String> clients = this.clientInfoService.getParentClients(uid, childUid);
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(clients), null, null);
		
		} catch (Exception e) {
			return JsonUtil.createSuccessJson(false, null, e.getMessage(),null);
		}
	}
}
