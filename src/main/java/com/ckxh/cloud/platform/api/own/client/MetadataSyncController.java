package com.ckxh.cloud.platform.api.own.client;

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
import com.ckxh.cloud.base.annotation.AuthPathOnBind;
import com.ckxh.cloud.base.model.TTActionType;
import com.ckxh.cloud.base.model.VideoStatisticType;
import com.ckxh.cloud.base.model.mqMsg.ShadowRecord;
import com.ckxh.cloud.base.model.mqMsg.TTMsg;
import com.ckxh.cloud.base.model.mqMsg.VideoStatisticMsg;
import com.ckxh.cloud.base.mq.AcMq;
import com.ckxh.cloud.base.util.ConstString;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.client.service.ClientInfoService;
import com.ckxh.cloud.persistence.db.client.service.RuleInfoService;
import com.ckxh.cloud.persistence.db.client.service.ShadowInfoService;
import com.ckxh.cloud.persistence.db.client.service.StreamDataService;
import com.ckxh.cloud.persistence.db.model.IOT_CLIENT;
import com.ckxh.cloud.persistence.db.model.IOT_METADATA;
import com.ckxh.cloud.persistence.db.model.IOT_METADATA_SYS;
import com.ckxh.cloud.persistence.db.model.IOT_SHADOW;
import com.ckxh.cloud.persistence.db.user.service.UserInfoService;
import com.ckxh.cloud.persistence.model.Metadata_with_CNM;

@Scope("singleton")
@Controller
@RequestMapping("/own/client/metadataSync")
@AuthPathOnBind("put:/platformApi/own/client/clientInfo")
public class MetadataSyncController {
	@Autowired
	private ClientInfoService clientInfoService;
	@Autowired
	private RuleInfoService ruleInfoService;
	@Autowired
	private ShadowInfoService shadowInfoService;
	@Autowired
	private StreamDataService streamDataService;
	@Autowired
	private UserInfoService userInfoService;
	@Autowired
	private AcMq acMq;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.PUT)
	public String put(@RequestParam String clientId, HttpServletRequest request, HttpServletResponse response){
		try{
			if(clientId == null || clientId.length() == 0){
				throw new Exception("clientId不能为空");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			if(!this.clientInfoService.clientOwner(clientId, uid)){
				throw new Exception("该设备并非属于当前用户");
			}
			
			Map<String, IOT_METADATA> cidMetaMap = this.clientInfoService.getClientMetadataMap(clientId).getMetaCIdMap();
			if(cidMetaMap.isEmpty()){
				throw new Exception("当前设备无任何元数据");
			}
			
			//check the limitation of video metadata count
			this.videoLimitedCheck(uid, cidMetaMap);
			
			List<IOT_CLIENT> clients = this.clientInfoService.getMyClients(uid, null, true);
			StringBuilder sb = new StringBuilder();
			
			Map<String, IOT_METADATA_SYS> sysMetaMap = this.clientInfoService.getSysMetadata();
			
			
			for(IOT_CLIENT cli : clients){
				if(!cli.getC_ID().equals(clientId)){
					try{
						this.handleMetaInfoSync(uid, cli, cidMetaMap, sysMetaMap);
						
					}catch(Exception ex){
						sb.append(cli.getC_ID() + ",");
					}
				}
			}
			
			String msg = null;
			if(sb.length() > 0){
				msg = "批量更新完成，但部分设备更新出错, id 为：" + sb.deleteCharAt(sb.length() - 1).toString();
				
			}else{
				msg = "批量更新成功";
			}
			
			return JsonUtil.createSuccessJson(true, null, msg, null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
	
	private void videoLimitedCheck(String uid, Map<String, IOT_METADATA> stdCidMetaMap) throws Exception{
		List<String> videoCids = new ArrayList<String>();
		for(IOT_METADATA meta : stdCidMetaMap.values()){
			if(this.streamDataService.isMetaVideoType(meta.getSYSMETA_ID())){
				videoCids.add(meta.getMETA_CID());
			}
		}
		
		if(videoCids.isEmpty()){
			return;
		}
		
		int videoLimit = this.userInfoService.getVideoResourceLimit(uid);
		
		int totalSize = 0;
		List<Metadata_with_CNM> metaList = this.clientInfoService.getMetadataOfOwner(uid);
		for(Metadata_with_CNM tmp : metaList){
			if(videoCids.contains(tmp.getMETA_CID()) || this.streamDataService.isMetaVideoType(tmp.getSYSMETA_ID())){
				totalSize++;
			}
		}
		
		if(totalSize > videoLimit){
			throw new Exception(String.format("批量更新需要  %d 个视频类型元数据，当前允许的数量为 %d 个，可在“我的账号”中进行升级以移除限制.", totalSize, videoLimit));
		}
	}
	
	private boolean valueChanged(String stdVal, String oldVal){
		return stdVal != null && !stdVal.equals(oldVal);
	}
	
	private List<IOT_METADATA> getNewMetas(IOT_CLIENT cli, Map<String, IOT_METADATA> stdCidMetaMap){
		Map<String, IOT_METADATA> curMetaMap = this.clientInfoService.getClientMetadataMap(cli.getC_ID()).getMetaCIdMap();
		
		boolean changed = false;
		for(IOT_METADATA meta : curMetaMap.values()){
			IOT_METADATA stdMeta = stdCidMetaMap.get(meta.getMETA_CID());
			if(stdMeta != null){
				//set name, unit, sysMetaId
				if(this.valueChanged(stdMeta.getMETA_NM(), meta.getMETA_NM())){
					meta.setMETA_NM(stdMeta.getMETA_NM());
					changed = true;
				}
				
				if(this.valueChanged(stdMeta.getMETA_UNIT(), meta.getMETA_UNIT())){
					meta.setMETA_UNIT(stdMeta.getMETA_UNIT());
					changed = true;
				}
				
				if(this.valueChanged(stdMeta.getSYSMETA_ID(), meta.getSYSMETA_ID())){
					meta.setSYSMETA_ID(stdMeta.getSYSMETA_ID());
					changed = true;
				}
			}
		}
		
		return changed ? new ArrayList<IOT_METADATA>(curMetaMap.values()) : null;
	}
	
	@SuppressWarnings("unchecked")
	private void handleMetaInfoSync(String uid, IOT_CLIENT cli, Map<String, IOT_METADATA> stdCidMetaMap, Map<String, IOT_METADATA_SYS> sysMetaMap) throws Exception{
		List<IOT_METADATA> curMetas = this.getNewMetas(cli, stdCidMetaMap);
		if(curMetas == null){
			return;
		}
		
		Object[] rets = this.clientInfoService.updateClientForMetaSync(cli, curMetas);
		
		//1、rebind rule
		this.ruleInfoService.updateDefaultRuleFromSysMetaData(cli.getC_ID(), (List<IOT_METADATA>)rets[0], sysMetaMap);
		
		//2、send topic msg to notice timedtask was deleted
		for(Long ttId: (List<Long>)rets[1]){
			this.acMq.sendTopic(new TTMsg(TTActionType.delete, ttId, cli.getC_OWNER_UID()), ConstString.AcTopic_ttDispatch_delete);
		}
		
		//3、check the cur_SD_STATE and metadatas to decide whether to send a shadowRecord
		Map<String, IOT_METADATA> metaCIdMap = this.clientInfoService.getClientMetadataMap(cli.getC_ID()).getMetaCIdMap();
		IOT_SHADOW sd = this.shadowInfoService.getShadow(cli.getCUR_SD_ID());
		
		ShadowRecord sr = this.shadowInfoService.updateShadowOnMerge(
				cli,
				uid,
				sd.getSD_STATE_DESC(), 
				metaCIdMap);
		
		if(sr != null){
			this.acMq.sendQueue(sr, ConstString.AcQueue_shadowRecord_out);
		}
		
		//4、video cloud reset
		VideoStatisticMsg msg = this.streamDataService.refreshVideoStatistic(cli.getC_OWNER_UID(), cli.getC_ID(), VideoStatisticType.MetaDataChanged, metaCIdMap);
		if(msg != null){
			this.acMq.sendQueue(msg, ConstString.AcQueue_videoStatistic);
		}
	}
}
