package com.ckxh.cloud.platform.api.f3rd;

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

import com.ckxh.cloud.base.model.mqMsg.ShadowRecord;
import com.ckxh.cloud.base.mq.AcMq;
import com.ckxh.cloud.base.util.ConstString;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.persistence.db.client.service.ClientInfoService;
import com.ckxh.cloud.persistence.db.client.service.ShadowInfoService;
import com.ckxh.cloud.persistence.db.f3rd.service.ClientInfo3rdService;
import com.ckxh.cloud.persistence.db.model.IOT_CLIENT;
import com.ckxh.cloud.persistence.db.model.IOT_METADATA;
import com.ckxh.cloud.persistence.model.f3rd.ClientState;
import com.fasterxml.jackson.core.type.TypeReference;

@Scope("singleton")
@Controller
@RequestMapping("/3rd/state/put")
public class States_PutController {
	@Autowired
	private ClientInfo3rdService clientInfo3rdService;
	@Autowired
	private ClientInfoService clientInfoService;
	@Autowired
	private ShadowInfoService shadowInfoService;
	@Autowired
	private AcMq acMq;

	@ResponseBody
	@RequestMapping(method = RequestMethod.PUT)
	public String put(@RequestParam String stateParam, HttpServletRequest request, HttpServletResponse response) {
		try {
			String uid = (String) request.getAttribute(ConstString.RequestAttr_uid);
			if (uid == null) {
				throw new Exception("用户未授权");
			}
			
			if(stateParam == null || stateParam.length() == 0){
				throw new Exception("参数错误");
			}
			
			List<ClientState> param = MsgPackUtil.deserialize(stateParam, new TypeReference<List<ClientState>>(){});
			if(param.isEmpty()){
				throw new Exception("参数错误");
			}
			
			List<String> cids = new ArrayList<String>();
			for(ClientState item : param){
				cids.add(item.getClientId());
			}
			
			if(!this.clientInfo3rdService.clientOwner(cids, uid)){
				throw new Exception("设备并非属于当前用户");
			}
			
			for(ClientState item : param){
				IOT_CLIENT cli = this.clientInfoService.getClient(item.getClientId());
				
				Map<String, IOT_METADATA> metaCIdMap = this.clientInfoService.getClientMetadataMap(cli.getC_ID()).getMetaCIdMap();
				ShadowRecord sr = this.shadowInfoService.updateShadowOnMerge(
						cli,
						uid,
						item.getState(),
						metaCIdMap);
				
				if(sr != null){
					this.acMq.sendQueue(sr, ConstString.AcQueue_shadowRecord_out);
				}
			}
			
			return JsonUtil.createSuccessJson(true, null, "修改成功", null);
			
		} catch (Exception ex) {
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
