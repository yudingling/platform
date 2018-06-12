package com.ckxh.cloud.platform.api.own.metaplugin.command;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.ckxh.cloud.base.model.mqMsg.MoveXYZCmd;
import com.ckxh.cloud.base.mq.AcMq;
import com.ckxh.cloud.base.util.ConstString;
import com.ckxh.cloud.base.util.DateUtil;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.client.service.ClientInfoService;
import com.ckxh.cloud.persistence.db.model.IOT_CLIENT;

@Scope("singleton")
@Controller
@RequestMapping("/own/command/moveXYZ")
public class MoveXYZController {
	@Autowired
	private ClientInfoService clientInfoService;
	@Autowired
	private AcMq acMq;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.POST)
	public String post(@RequestParam String clientId, @RequestParam String metaId, @RequestParam String metaCId, 
			@RequestParam(required = false) Integer x, @RequestParam(required = false) Integer y,  @RequestParam(required = false) Integer z, 
			HttpServletRequest request, HttpServletResponse response){
		try {
			if(clientId == null || clientId.length() == 0 || metaId == null || metaId.length() == 0 || metaCId == null || metaCId.length() == 0){
				throw new Exception("参数错误");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			IOT_CLIENT cli = this.clientInfoService.getClient(clientId);
			if(cli == null || !cli.getC_OWNER_UID().equals(uid)){
				throw new Exception("该设备并非属于当前用户");
			}
			
			if(!this.clientInfoService.metaCIdBelongToClient(clientId, metaCId)){
				throw new Exception("参数错误");
			}
			
			int xVal = x == null? 0 : x;
			int yVal = y == null? 0 : y;
			int zVal = z == null? 0 : z;
			
			if(xVal != 0 || yVal != 0 || zVal != 0){
				MoveXYZCmd cmd = new MoveXYZCmd(clientId, cli.getDEVICE_ID(), DateUtil.getCurrentTS(), xVal, yVal, zVal, metaCId);
				this.acMq.sendQueue(cmd, ConstString.AcQueue_commandRecord_out);
				
				return JsonUtil.createSuccessJson(true, null, "执行成功", null);
			}else{
				return JsonUtil.createSuccessJson(false, null, "至少给定一个轴的位移量", null);
			}
		}
		catch(Exception e){
			e.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, e.getMessage(), null);
		}
	}
	
}
