package com.ckxh.cloud.platform.api.own.client;

import java.sql.Timestamp;
import java.util.ArrayList;
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

import com.ckxh.cloud.base.model.mqMsg.CustomCmd;
import com.ckxh.cloud.base.mq.AcMq;
import com.ckxh.cloud.base.util.ConstString;
import com.ckxh.cloud.base.util.DateUtil;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.persistence.common.SysTool;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.client.service.ClientInfoService;
import com.ckxh.cloud.persistence.db.model.IOT_CLIENT;
import com.ckxh.cloud.persistence.db.model.IOT_CUSTOM_CMD;
import com.fasterxml.jackson.core.type.TypeReference;

@Scope("singleton")
@Controller
@RequestMapping("/own/command/customCmd")
public class CustomCmdController {
	@Autowired
	private ClientInfoService clientInfoService;
	@Autowired
	private AcMq acMq;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.POST)
	public String get(@RequestParam String cids, @RequestParam String cmd, HttpServletRequest request, HttpServletResponse response){
		try {
			if(cids == null || cids.length() == 0 || cmd == null || cmd.length() == 0){
				throw new Exception("参数错误");
			}
			
			List<String> cidList = MsgPackUtil.deserialize(cids, new TypeReference<List<String>>(){});
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			List<IOT_CUSTOM_CMD> saveList = new ArrayList<IOT_CUSTOM_CMD>();
			List<CustomCmd> cmdMsgs = new ArrayList<CustomCmd>(); 
			Timestamp ts = DateUtil.getCurrentTS();
			
			List<Long> uuids = null;
			if(!cidList.isEmpty()){
				uuids = SysTool.longUuid(cidList.size());
			}
			
			int uuidIndex = 0;
			for(String cid : cidList){
				IOT_CLIENT cli = this.clientInfoService.getClient(cid);
				if(cli == null || !cli.getC_OWNER_UID().equals(uid)){
					throw new Exception("该设备并非属于当前用户");
				}
				
				IOT_CUSTOM_CMD item = new IOT_CUSTOM_CMD(uuids.get(uuidIndex++), cid, cmd, null, null, ts, ts);
				
				saveList.add(item);
				cmdMsgs.add(new CustomCmd(cid, cli.getDEVICE_ID(), ts, item.getCTCMD_ID(), cmd));
			}
			
			boolean ret = this.clientInfoService.saveCustomCmds(saveList);
			if(ret){
				for(CustomCmd msg : cmdMsgs){
					this.acMq.sendQueue(msg, ConstString.AcQueue_commandRecord_out);
				}
				
				return JsonUtil.createSuccessJson(true, null, "创建命令成功!", null);
			}else{
				return JsonUtil.createSuccessJson(false, null, null, "创建命令失败");
			}
			
		} catch (Exception e) {
			e.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, e.getMessage(),null);
		}
	}
}
