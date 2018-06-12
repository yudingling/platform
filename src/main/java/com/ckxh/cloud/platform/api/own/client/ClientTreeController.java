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
import com.ckxh.cloud.persistence.model.ClientTreeNode;

@Scope("singleton")
@Controller
@RequestMapping("/own/client/normal/clientTree")
public class ClientTreeController {
	@Autowired
	private ClientInfoService clientInfoService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String get(@RequestParam(required = false) String search, @RequestParam(required = false) Boolean needNodeData, 
			@RequestParam(required = false) Boolean ownedClients, @RequestParam(required = false) Boolean showCheck, 
			HttpServletRequest request, HttpServletResponse response){
		try{
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			if(needNodeData == null){
				needNodeData = false;
			}
			if(ownedClients == null){
				ownedClients = false;
			}
			if(showCheck == null){
				showCheck = false;
			}
			List<ClientTreeNode> list = clientInfoService.getClientTree(uid, search, needNodeData, ownedClients, showCheck);
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(list), null, null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
