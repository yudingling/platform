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

import com.ckxh.cloud.base.annotation.AuthPathOnBind;
import com.ckxh.cloud.base.model.mqMsg.GetShadowCmd;
import com.ckxh.cloud.base.mq.AcMq;
import com.ckxh.cloud.base.util.ConstString;
import com.ckxh.cloud.base.util.DateUtil;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.client.service.ClientInfoService;
import com.ckxh.cloud.persistence.db.model.IOT_CLIENT;

@Scope("singleton")
@Controller
@RequestMapping("/own/client/normal/clientRecovery")
public class ClientRecoveryController {
	@Autowired
	private ClientInfoService clientInfoService;
	@Autowired
	private AcMq acMq;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.PUT)
	@AuthPathOnBind("put:/platformApi/own/client/clientInfo")
	public String put(@RequestParam String clientId, HttpServletRequest request, HttpServletResponse response){
		try {
			if(clientId == null || clientId.length() == 0){
				throw new Exception("clientId不能为空");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			IOT_CLIENT cli = this.clientInfoService.getClient(clientId);
			if(cli == null || !cli.getC_OWNER_UID().equals(uid)){
				throw new Exception("该设备并非属于当前用户");
			}
			
			Boolean flag = clientInfoService.updateClientForRecovery(clientId);
			if(flag){
				//get shadow command
				GetShadowCmd model = new GetShadowCmd(clientId, cli.getDEVICE_ID(), DateUtil.getCurrentTS());
				this.acMq.sendQueue(model, ConstString.AcQueue_commandRecord_out);
			}else{
				throw new Exception("恢复失败");
			}
			
			return JsonUtil.createSuccessJson(true, null, null, null);
		} catch (Exception e) {
			e.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, e.getMessage(),null);
		}
	}
}
