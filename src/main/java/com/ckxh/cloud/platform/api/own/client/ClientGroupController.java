package com.ckxh.cloud.platform.api.own.client;

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
import com.ckxh.cloud.persistence.db.client.service.ClientInfoService;
import com.ckxh.cloud.persistence.db.sys.service.DataGroupService;
import com.fasterxml.jackson.core.type.TypeReference;

@Scope("singleton")
@Controller
@RequestMapping("/own/client/group")
@AuthPathOnBind("put:/platformApi/own/client/clientInfo")
public class ClientGroupController {
	@Autowired
	private ClientInfoService clientInfoService;
	@Autowired
	private DataGroupService dataGroupService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.PUT)
	public String put(@RequestParam(required = false) String groups, @RequestParam(required = false) String clients, 
			HttpServletRequest request, HttpServletResponse response){
		try{
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			if(groups != null && groups.length() > 0){
				Map<String, String> gpMap =  MsgPackUtil.deserialize(groups, new TypeReference<Map<String, String>>(){});
				if(!gpMap.isEmpty()){
					this.dataGroupService.updateParentGroup(gpMap, uid);
				}
			}
			
			if(clients != null && clients.length() > 0){
				Map<String, String> cliMap =  MsgPackUtil.deserialize(clients, new TypeReference<Map<String, String>>(){});
				if(!cliMap.isEmpty()){
					this.clientInfoService.updateClientGroup(cliMap, uid);
				}
			}
			
			return JsonUtil.createSuccessJson(true, null, "更新成功", null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
