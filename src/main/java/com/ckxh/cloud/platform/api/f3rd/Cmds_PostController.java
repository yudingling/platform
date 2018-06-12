package com.ckxh.cloud.platform.api.f3rd;

import java.sql.Timestamp;
import java.util.ArrayList;
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
import com.ckxh.cloud.base.model.mqMsg.CmdRecord;
import com.ckxh.cloud.base.model.mqMsg.CustomCmd;
import com.ckxh.cloud.base.model.mqMsg.GetHistoricalDataCmd;
import com.ckxh.cloud.base.model.mqMsg.GetRealTimeDataCmd;
import com.ckxh.cloud.base.model.mqMsg.GetShadowCmd;
import com.ckxh.cloud.base.model.mqMsg.MoveXYZCmd;
import com.ckxh.cloud.base.model.mqMsg.StartCmd;
import com.ckxh.cloud.base.model.mqMsg.StopCmd;
import com.ckxh.cloud.base.mq.AcMq;
import com.ckxh.cloud.base.util.ConstString;
import com.ckxh.cloud.base.util.DateUtil;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.persistence.common.SysTool;
import com.ckxh.cloud.persistence.db.client.service.ClientInfoService;
import com.ckxh.cloud.persistence.db.f3rd.service.ClientInfo3rdService;
import com.ckxh.cloud.persistence.db.model.IOT_CUSTOM_CMD;
import com.ckxh.cloud.platform.model.f3rd.CmdParam;
import com.fasterxml.jackson.core.type.TypeReference;

@Scope("singleton")
@Controller
@RequestMapping("/3rd/cmd/post")
public class Cmds_PostController {
	@Autowired
	private ClientInfo3rdService clientInfo3rdService;
	@Autowired
	private ClientInfoService clientInfoService;
	@Autowired
	private AcMq acMq;

	@ResponseBody
	@RequestMapping(method = RequestMethod.POST)
	public String post(@RequestParam String cmdParam, HttpServletRequest request, HttpServletResponse response) {
		try {
			String uid = (String) request.getAttribute(ConstString.RequestAttr_uid);
			if (uid == null) {
				throw new Exception("用户未授权");
			}
			
			if(cmdParam == null || cmdParam.length() == 0){
				throw new Exception("参数错误");
			}
			
			List<CmdParam> list = MsgPackUtil.deserialize(cmdParam, new TypeReference<List<CmdParam>>(){});
			if(list.isEmpty()){
				throw new Exception("参数错误");
			}
			
			List<String> ids = new ArrayList<String>();
			for(CmdParam item : list){
				ids.add(item.getClientId());
			}
			
			if(!this.clientInfo3rdService.clientOwner(ids, uid)){
				throw new Exception("设备并非属于当前用户");
			}
			
			int cmdLen = this.sendCmds(list);
			
			if(cmdLen == 0){
				return JsonUtil.createSuccessJson(false, null, "无有效指令", null);
				
			}else{
				return JsonUtil.createSuccessJson(true, null, "成功提交" + cmdLen + "条指令", null);
			}
			
		} catch (Exception ex) {
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
	
	private int sendCmds(List<CmdParam> cmdList) throws Exception{
		List<CmdRecord> sendList = new ArrayList<CmdRecord>();
		
		for(CmdParam item : cmdList){
			if(item.getCmds() != null && !item.getCmds().isEmpty()){
				String deviceId = this.clientInfoService.getClient(item.getClientId()).getDEVICE_ID();
				
				for(Map<String, Object> cur : item.getCmds()){
					CmdRecord cmd = this.createCmd(item.getClientId(), deviceId, cur);
					if(cmd != null){
						sendList.add(cmd);
					}
				}
			}
		}
		
		this.handleCmd(sendList);
		this.send(sendList);
		
		return sendList.size();
	}
	
	private void handleCmd(List<CmdRecord> sendList) throws Exception{
		List<IOT_CUSTOM_CMD> cusList = new ArrayList<IOT_CUSTOM_CMD>();
		
		for(CmdRecord cmd : sendList){
			if(cmd instanceof CustomCmd){
				CustomCmd cus = (CustomCmd) cmd;
				
				cusList.add(new IOT_CUSTOM_CMD(cus.getCusId(), cus.getCid(), cus.getContent(), null, null, cus.getCrtTs(), cus.getCrtTs()));
			}
		}
		
		if(!cusList.isEmpty() && !this.clientInfoService.saveCustomCmds(cusList)){
			throw new Exception("创建 custom 指令失败!");
		}
	}
	
	private void send(List<CmdRecord> sendList){
		for(CmdRecord cmd : sendList){
			this.acMq.sendQueue(cmd, ConstString.AcQueue_commandRecord_out);
		}
	}
	
	private CmdRecord createCmd(String clientId, String deviceId, Map<String, Object> params) throws Exception{
		Object key = params.get("cmd");
		
		if(key != null && key instanceof String){
			Timestamp ts = DateUtil.getCurrentTS();
			
			switch((String) key){
				case ConstString.CmdRecordNm_getShadow:
					return this.genGetShadow(clientId, deviceId, ts);
					
				case ConstString.CmdRecordNm_getHistoricalData:
					return this.genGetHistoricalData(clientId, deviceId, ts, params);
					
				case ConstString.CmdRecordNm_getRealTimeData:
					return this.genGetRealTimeData(clientId, deviceId, ts, params);
					
				case ConstString.CmdRecordNm_moveXYZ:
					return this.genMoveXYZ(clientId, deviceId, ts, params);
					
				case ConstString.CmdRecordNm_start:
					return this.genStart(clientId, deviceId, ts, params);
					
				case ConstString.CmdRecordNm_stop:
					return this.genStop(clientId, deviceId, ts, params);
					
				case ConstString.CmdRecordNm_custom:
					return this.genCustom(clientId, deviceId, ts, params);
				
				case ConstString.CmdRecordNm_firmwareUpdate:
				case ConstString.CmdRecordNm_uploadImage:
				case ConstString.CmdRecordNm_uploadVideo:
				case ConstString.CmdRecordNm_infoUpload:
				default:
					//command requested from client and some special command like 'firmwareUpdate' should not response from here.
					break;
			}
		}
		
		return null;
	}
	
	private CmdRecord genGetShadow(String clientId, String deviceId, Timestamp ts){
		return new GetShadowCmd(clientId, deviceId, ts);
	}
	
	@SuppressWarnings("unchecked")
	private CmdRecord genGetHistoricalData(String clientId, String deviceId, Timestamp ts, Map<String, Object> params) throws Exception{
		try{
			long stm = (long) params.get("startTM");
			long etm = (long) params.get("startTM");
			List<String> metadata = (List<String>) params.get("metadata");
			
			return new GetHistoricalDataCmd(clientId, deviceId, ts, new Timestamp(stm), new Timestamp(etm), metadata);
			
		}catch(Exception ex){
			throw new Exception("getHistoricalData 指令生成出错, " + ex.getMessage());
		}
	}
	
	@SuppressWarnings("unchecked")
	private CmdRecord genGetRealTimeData(String clientId, String deviceId, Timestamp ts, Map<String, Object> params) throws Exception{
		try{
			List<String> metadata = (List<String>) params.get("metadata");
			
			return new GetRealTimeDataCmd(clientId, deviceId, ts, metadata);
			
		}catch(Exception ex){
			throw new Exception("getRealTimeData 指令生成出错, " + ex.getMessage());
		}
	}
	
	@SuppressWarnings("unchecked")
	private CmdRecord genMoveXYZ(String clientId, String deviceId, Timestamp ts, Map<String, Object> params) throws Exception{
		try{
			List<Integer> xyz = (List<Integer>) params.get("value");
			List<String> metadata = (List<String>) params.get("metadata");
			
			if(xyz == null || xyz.size() != 3){
				throw new Exception("xyz参数错误");
			}
			
			return new MoveXYZCmd(clientId, deviceId, ts, xyz.get(0), xyz.get(1), xyz.get(2), metadata);
			
		}catch(Exception ex){
			throw new Exception("moveXYZ 指令生成出错, " + ex.getMessage());
		}
	}
	
	@SuppressWarnings("unchecked")
	private CmdRecord genStart(String clientId, String deviceId, Timestamp ts, Map<String, Object> params) throws Exception{
		try{
			List<String> metadata = (List<String>) params.get("metadata");
			
			return new StartCmd(clientId, deviceId, ts, metadata);
			
		}catch(Exception ex){
			throw new Exception("start 指令生成出错, " + ex.getMessage());
		}
	}
	
	@SuppressWarnings("unchecked")
	private CmdRecord genStop(String clientId, String deviceId, Timestamp ts, Map<String, Object> params) throws Exception{
		try{
			List<String> metadata = (List<String>) params.get("metadata");
			
			return new StopCmd(clientId, deviceId, ts, metadata);
			
		}catch(Exception ex){
			throw new Exception("stop 指令生成出错, " + ex.getMessage());
		}
	}
	
	private CmdRecord genCustom(String clientId, String deviceId, Timestamp ts, Map<String, Object> params) throws Exception{
		try{
			String content = (String) params.get("content");
			
			return new CustomCmd(clientId, deviceId, ts, SysTool.longUuid(), content);
			
		}catch(Exception ex){
			throw new Exception("custom 指令生成出错, " + ex.getMessage());
		}
	}
}
