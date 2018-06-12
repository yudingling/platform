package com.ckxh.cloud.platform.api.own.client;

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
import com.ckxh.cloud.persistence.model.ClientInfo_Simple;

@Scope("singleton")
@Controller
@RequestMapping("/own/client/normal/deletedClientInfo")
public class DeletedClientInfoController {
	@Autowired
	private ClientInfoService clientInfoService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String get(@RequestParam String clientId, HttpServletRequest request, HttpServletResponse response){
		try {
			if(clientId == null || clientId.length() == 0){
				throw new Exception("clientId不能为空");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			if (!this.clientInfoService.clientAuthority(clientId, uid, false)){
				throw new Exception("设备未授权访问");
			}
			
			ClientInfo_Simple client = this.clientInfoService.getDeletedClientInfo(clientId);
			if(client == null){
				throw new Exception("参数错误");
			}
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(client), null, null);
		} catch (Exception e) {
			return JsonUtil.createSuccessJson(false, null, e.getMessage(),null);
		}
	}
}
