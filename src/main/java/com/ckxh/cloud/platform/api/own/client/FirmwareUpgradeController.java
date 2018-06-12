package com.ckxh.cloud.platform.api.own.client;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
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

import com.ckxh.cloud.base.model.mqMsg.FirmwareUpdateCmd;
import com.ckxh.cloud.base.mq.AcMq;
import com.ckxh.cloud.base.util.ConstString;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.client.service.ClientInfoService;
import com.ckxh.cloud.persistence.db.model.IOT_CLIENT;
import com.ckxh.cloud.persistence.db.model.IOT_CLIENT_FIRMWARE;
import com.fasterxml.jackson.core.type.TypeReference;

@Scope("singleton")
@Controller
@RequestMapping("/own/client/firmwareUpgrade")
public class FirmwareUpgradeController {
	@Autowired
	private ClientInfoService clientInfoService;
	@Autowired
	private AcMq acMq;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.POST)
	public String get(@RequestParam Long fileId, @RequestParam String curId, @RequestParam String clientIds,  @RequestParam String version, HttpServletRequest request, HttpServletResponse response){
		try{
			if(fileId == null || clientIds == null || clientIds.length() == 0 || version == null || version.length() == 0){
				throw new Exception("参数错误");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			List<String> idList = MsgPackUtil.deserialize(clientIds, new TypeReference<List<String>>(){});
			
			List<String> okNames = new ArrayList<String>();
			List<String> failNames = new ArrayList<String>();
			IOT_CLIENT_FIRMWARE curCf = null;
			
			for(String id: idList){
				IOT_CLIENT cli = this.clientInfoService.getClient(id);
				
				if(cli != null){
					//owner should be the current user
					if(cli.getC_OWNER_UID().equals(uid)){
						Object[] rets = this.clientInfoService.updateFirmware(uid, id, cli.getDEVICE_ID(), fileId, version);
						
						this.acMq.sendQueue((FirmwareUpdateCmd)rets[0], ConstString.AcQueue_commandRecord_out);
						IOT_CLIENT_FIRMWARE cf = (IOT_CLIENT_FIRMWARE)rets[1];
						if(cf.getC_ID().equals(curId)){
							curCf = cf;
						}
						
						okNames.add(cli.getC_NM());
					}else{
						failNames.add(cli.getC_NM());
					}
				}
			}
			
			Map<String, Object> map = new HashMap<String, Object>();
			map.put("ok", okNames);
			map.put("fail", failNames);
			map.put("curCf", curCf);
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(map), null, null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
