package com.ckxh.cloud.platform.api.own.client;

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
import com.ckxh.cloud.base.model.TTActionType;
import com.ckxh.cloud.base.model.VideoStatisticType;
import com.ckxh.cloud.base.model.mqMsg.GetShadowCmd;
import com.ckxh.cloud.base.model.mqMsg.ShadowRecord;
import com.ckxh.cloud.base.model.mqMsg.TTMsg;
import com.ckxh.cloud.base.model.mqMsg.VideoStatisticMsg;
import com.ckxh.cloud.base.mq.AcMq;
import com.ckxh.cloud.base.util.Common;
import com.ckxh.cloud.base.util.ConstString;
import com.ckxh.cloud.base.util.DateUtil;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.base.util.Validator;
import com.ckxh.cloud.persistence.common.SysTool;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.client.service.ClientInfoService;
import com.ckxh.cloud.persistence.db.client.service.RuleInfoService;
import com.ckxh.cloud.persistence.db.client.service.ShadowInfoService;
import com.ckxh.cloud.persistence.db.client.service.StreamDataService;
import com.ckxh.cloud.persistence.db.model.IOT_CLIENT;
import com.ckxh.cloud.persistence.db.model.IOT_CLIENT_TAG;
import com.ckxh.cloud.persistence.db.model.IOT_METADATA;
import com.ckxh.cloud.persistence.db.user.service.UserInfoService;
import com.ckxh.cloud.persistence.db.user.service.UserRemindService;
import com.ckxh.cloud.persistence.model.ClientTreeNode;
import com.ckxh.cloud.persistence.model.Metadata_with_CNM;
import com.fasterxml.jackson.core.type.TypeReference;

@Scope("singleton")
@Controller
@RequestMapping("/own/client/clientInfo")
public class ClientInfoController {
	@Autowired
	private ClientInfoService clientInfoService;
	@Autowired
	private RuleInfoService ruleInfoService;
	@Autowired
	private ShadowInfoService shadowInfoService;
	@Autowired
	private UserRemindService userRemindService;
	@Autowired
	private UserInfoService userInfoService;
	@Autowired
	private StreamDataService streamDataService;
	@Autowired
	private AcMq acMq;

	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String get(@RequestParam String clientId, HttpServletRequest request, HttpServletResponse response){
		try {
			if(clientId == null || clientId.length() == 0){
				throw new Exception("clientId不能为空");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			if(!this.clientInfoService.clientAuthority(clientId, uid, true)){
				throw new Exception("设备未授权访问");
			}
			
			Map<String, Object> map = clientInfoService.getClientInfo(clientId);
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(map), null, null);
		} 
		catch(Exception e){
			return JsonUtil.createSuccessJson(false, null, e.getMessage(), null);
		}
	}
	
	@SuppressWarnings("unchecked")
	@ResponseBody
	@RequestMapping(method=RequestMethod.PUT)
	public String put(@RequestParam String info, HttpServletRequest request, HttpServletResponse response){
		try {
			if(info == null || info.length() == 0){
				throw new Exception("参数错误");
			}
			
			Object obj = MsgPackUtil.deserialize(info, Object.class);
			if(obj instanceof Map){
				@SuppressWarnings("rawtypes")
				Map map = (Map) obj;
				
				String uId = AuthUtil.getIdFromSession(request.getSession());
				
				Object[] clientsRet = this.getClient_update(map, uId);
				IOT_CLIENT cli = (IOT_CLIENT) clientsRet[0];
				Boolean publicRemoved = (Boolean) clientsRet[1];
				Double[] historyLoc = (Double[]) clientsRet[2];
				
				List<IOT_METADATA> metas = this.getMetadatas(map, uId, cli.getC_ID(), false);
				List<IOT_CLIENT_TAG> tags = this.getTags(map, cli.getC_ID());
				
				//0、update
				Object[] rets = this.clientInfoService.updateClient(cli, metas, tags, historyLoc);
				
				//1、notice user who star the client when its public property was removed
				if(publicRemoved){
					List<String> users = this.clientInfoService.getNoticeStarUserOfClient(cli.getC_ID());
					if(!users.isEmpty()){
						this.clientInfoService.deleteStarUserOfClient(cli.getC_ID(), users);
						
						for(String noticeUid: users){
							this.userRemindService.createStarClientPublicRemovedInfo(noticeUid, cli.getC_NM());
						}
					}
				}
				
				//2、rebind rule
				this.ruleInfoService.updateDefaultRuleFromSysMetaData(cli.getC_ID(), (List<IOT_METADATA>)rets[0], this.clientInfoService.getSysMetadata());
				
				//3、send topic msg to notice timedtask was deleted
				for(Long ttId: (List<Long>)rets[1]){
					this.acMq.sendTopic(new TTMsg(TTActionType.delete, ttId, cli.getC_OWNER_UID()), ConstString.AcTopic_ttDispatch_delete);
				}
				
				//4、check the cur_SD_STATE and metadatas to decide whether to send a shadowRecord
				Map<String, IOT_METADATA> metaCIdMap = this.clientInfoService.getClientMetadataMap(cli.getC_ID()).getMetaCIdMap();
				ShadowRecord sr = this.shadowInfoService.updateShadowOnMerge(
						cli,
						uId,
						Common.getMapString(map, "cur_SD_STATE", false), 
						metaCIdMap);
				
				if(sr != null){
					this.acMq.sendQueue(sr, ConstString.AcQueue_shadowRecord_out);
				}
				
				//5、video cloud reset
				this.refreshVideoStatistic(cli.getC_OWNER_UID(), cli.getC_ID(), VideoStatisticType.MetaDataChanged, metaCIdMap);
				
				return JsonUtil.createSuccessJson(true, null, "保存成功", null);
			}
			
			throw new Exception("参数错误");
			
		}catch(Exception e){
			e.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, e.getMessage(), null);
		}
	}
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.POST)
	public String post(@RequestParam String info, HttpServletRequest request, HttpServletResponse response){
		try {
			if(info == null || info.length() == 0){
				throw new Exception("参数错误");
			}
			
			Object obj = MsgPackUtil.deserialize(info, Object.class);
			if(obj instanceof Map){
				@SuppressWarnings("rawtypes")
				Map map = (Map) obj;
				
				String uId = AuthUtil.getIdFromSession(request.getSession());
				
				IOT_CLIENT cli = this.getClient_create(map, AuthUtil.getIdFromSession(request.getSession()));
				
				List<IOT_METADATA> metas = this.getMetadatas(map, uId, cli.getC_ID(), true);
				List<IOT_CLIENT_TAG> tags = this.getTags(map, cli.getC_ID());
				
				ClientTreeNode node = this.clientInfoService.createClient(cli, metas, tags);
				if(node != null){
					this.ruleInfoService.updateDefaultRuleFromSysMetaData(cli.getC_ID(), metas, this.clientInfoService.getSysMetadata());
					
					//get shadow command
					GetShadowCmd model = new GetShadowCmd(cli.getC_ID(), cli.getDEVICE_ID(), DateUtil.getCurrentTS());
					this.acMq.sendQueue(model, ConstString.AcQueue_commandRecord_out);
					
					//create a client don't need to call 'refreshVideoStatistic'
					
					return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(node), "保存成功", null);
				}else{
					throw new Exception("创建设备失败");
				}
			}
			
			throw new Exception("参数错误");
			
		}catch(Exception e){
			e.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, e.getMessage(), null);
		}
	}
	
	@SuppressWarnings("unchecked")
	@ResponseBody
	@RequestMapping(method=RequestMethod.DELETE)
	public String delete(@RequestParam String clients, HttpServletRequest request, HttpServletResponse response){
		try{
			String uId = AuthUtil.getIdFromSession(request.getSession());
			
			List<String> clientIds = clients != null && clients.length() > 0?
					MsgPackUtil.deserialize(clients, new TypeReference<List<String>>(){}) : (new ArrayList<String>());
					
			Object[] delRets = this.clientInfoService.deleteClient(uId, clientIds);
			
			List<Long> delTTids = (List<Long>) delRets[0];
			List<String> delOwnClis = (List<String>) delRets[1];
			
			for(Long ttId: delTTids){
				this.acMq.sendTopic(new TTMsg(TTActionType.delete, ttId, uId), ConstString.AcTopic_ttDispatch_delete);
			}
			
			for(String cid : delOwnClis){
				this.refreshVideoStatistic(uId, cid, VideoStatisticType.ClientDeleted, null);
			}
			
			return JsonUtil.createSuccessJson(true, null, "删除成功", null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
	
	@SuppressWarnings("rawtypes")
	private List<IOT_METADATA> getMetadatas(Map map, String uid, String clientId, boolean isCreate) throws Exception{
		List<IOT_METADATA> retList = new ArrayList<IOT_METADATA>();
		
		Object metadatas = map.get("metadatas");
		int curVideoMetaCount = 0, preVideoMetaCount = 0, otherVideoMetaCount = 0;
		
		if(metadatas instanceof List){
			Timestamp ts = DateUtil.getCurrentTS();
			List list = (List) metadatas;
			
			List<Long> uuids = null;
			if(isCreate && !list.isEmpty()){
				uuids = SysTool.longUuid(list.size());
			}
			
			int uuidIndex = 0;
			for(Object item: list){
				Map mdMap = (Map) item;
				
				String metaCID = Common.getMapString(mdMap, "meta_CID", false);
				if(!Validator.isMetaCId(metaCID)){
					throw new Exception("元数据的标识不能为空且不超过50个字符["+ metaCID +"]");
				}
				String metaNM = Common.getMapString(mdMap, "meta_NM", false);
				if(metaNM != null && metaNM.length() > 100){
					throw new Exception("元数据名称不符合要求，最大长度100");
				}
				String metaUnit = Common.getMapString(mdMap, "meta_UNIT", false);
				if(metaUnit != null && metaUnit.length() > 50){
					throw new Exception("元数据单位不符合要求，最大长度50");
				}
				
				IOT_METADATA md = new IOT_METADATA(
						isCreate ? uuids.get(uuidIndex++) : Common.getMapLong(mdMap, "meta_ID"), 
						clientId, 
						metaCID,
						metaNM == null? metaCID : metaNM,
						null, 
						Common.getMapString(mdMap, "sysmeta_ID", false), 
						0,
						metaUnit,
						ts, ts);
				
				if(this.streamDataService.isMetaVideoType(md.getSYSMETA_ID())){
					curVideoMetaCount++;
				}
				
				retList.add(md);
			}
			
			//get video metadata count of the other clients that belong to the user
			List<Metadata_with_CNM> metaList = this.clientInfoService.getMetadataOfOwner(uid);
			for(Metadata_with_CNM tmp : metaList){
				if(this.streamDataService.isMetaVideoType(tmp.getSYSMETA_ID())){
					if(tmp.getC_ID().equals(clientId)){
						preVideoMetaCount++;
						
					}else{
						otherVideoMetaCount++;
					}
				}
			}
			
			int limit = this.userInfoService.getVideoResourceLimit(uid);
			int curTotal = curVideoMetaCount + otherVideoMetaCount;
			//if the upper limit is reached, ensure the current update will reduce the total count
			if(curTotal > limit && curVideoMetaCount > preVideoMetaCount){
				throw new Exception(String.format("您当前设置了 %d 个视频类型元数据，当前允许的数量为 %d 个，可在“我的账号”中进行升级以移除限制.", curTotal, limit));
			}
		}
		
		return retList;
	}
	
	@SuppressWarnings("rawtypes")
	private IOT_CLIENT getClient_create(Map map, String uid) throws Exception{
		String id = Common.getMapString(map, "c_ID", false);
		
		if(!Validator.isClientId(id)){
			throw new Exception("站点[编码："+ id +"] 不符合要求，只由数字/英文字符/下划线组成，并且长度小于50");
		}
		if(this.clientInfoService.getClient(id) != null){
			throw new Exception("站点[编码："+ id +"] 已经存在");
		}
		
		String name = this.getClientName(map);
		Double lgtd = this.checkLgtdLttd(Common.getMapString(map, "c_LGTD", false));
		Double lttd = this.checkLgtdLttd(Common.getMapString(map, "c_LTTD", false));
		int isPublic = Common.getMapInt(map, "c_PUBLIC", 0);
		Long mfId = Common.getMapLong(map, "mf_ID");
		Long pdId = Common.getMapLong(map, "pd_ID");
		Long gpId = Common.getMapLong(map, "gp_ID");
		
		Timestamp ts = DateUtil.getCurrentTS();
		
		//mqtt client、no wrapper、don't support offline message、non compression、don't need to split packet、minSubIntv = 0、 not deleted
		return new IOT_CLIENT(
				id, 
				null,
				name, 
				uid, 
				lgtd, 
				lttd, 
				mfId, pdId, 
				null, null, 
				gpId, 
				null, null, 
				null,
				0, 0,
				isPublic, 
				null,
				0,
				0,
				0,
				ts, ts);
	}
	
	private Double checkLgtdLttd(String value) throws Exception{
		if(value == null){
			return null;
		}
		
		try{
			return Double.parseDouble(Common.subString(value, 10));
		}catch(Exception e){
			throw new Exception("经纬度输入错误");
		}
	}
	
	/**
	 * get the client object for updated
	 * @return index 0: iot_client,  index 1: identify the public property was removed or not,  index 3: history location, not null means need to add an history location
	 */
	@SuppressWarnings("rawtypes")
	private Object[] getClient_update(Map map, String uid) throws Exception{
		String id = Common.getMapString(map, "c_ID", false);
		if(id == null){
			throw new Exception("参数错误");
		}
		
		IOT_CLIENT old = this.clientInfoService.getClient(id);
		if(old == null){
			throw new Exception("设备不存在");
		}
		if(!old.getC_OWNER_UID().equals(uid)){
			throw new Exception("该设备并非属于当前用户");
		}
		
		Double[] historyLoc = null;
		Double lgtd = this.checkLgtdLttd(Common.getMapString(map, "c_LGTD", false));
		Double lttd = this.checkLgtdLttd(Common.getMapString(map, "c_LTTD", false));
		if(lgtd != null && lttd != null){
			if(!lgtd.equals(old.getC_LGTD()) || !lttd.equals(old.getC_LTTD())){
				try{
					historyLoc = new Double[]{lgtd, lttd};
				}catch(Exception ex){
					historyLoc = null;
				}
			}
		}
		
		old.setC_NM(this.getClientName(map));
		old.setC_LGTD(lgtd);
		old.setC_LTTD(lttd);
		old.setMF_ID(Common.getMapLong(map, "mf_ID"));
		old.setPD_ID(Common.getMapLong(map, "pd_ID"));
		
		Boolean publicRemoved = false;
		int cPublic = Common.getMapInt(map, "c_PUBLIC", 0);
		if(old.getC_PUBLIC() == 1 && cPublic == 0){
			publicRemoved = true;
		}
		old.setC_PUBLIC(cPublic);
		
		old.setUPT_TS(DateUtil.getCurrentTS());
		
		return new Object[]{old, publicRemoved, historyLoc};
	}
	
	@SuppressWarnings("rawtypes")
	private String getClientName(Map map) throws Exception{
		String name = Common.getMapString(map, "c_NM", false);
		if(name == null || name.length() > 50){
			throw new Exception("站点名称不符合要求，不能为空且最大长度50");
		}
		return name;
	}
	
	@SuppressWarnings("rawtypes")
	private List<IOT_CLIENT_TAG> getTags(Map map, String clientId) throws Exception{
		List<IOT_CLIENT_TAG> ret = new ArrayList<IOT_CLIENT_TAG>();
		
		Object tagsObj = map.get("tags");
		if(tagsObj instanceof List){
			List tagsList = (List) tagsObj;
			Timestamp ts = DateUtil.getCurrentTS();
			
			List<Long> uuids = null;
			if(!tagsList.isEmpty()){
				uuids = SysTool.longUuid(tagsList.size());
			}
			
			int uuidIndex = 0;
			for(Object tag: tagsList){
				String tagNM = (String)tag;
				if(tagNM.length() > 50){
					throw new Exception("标签最大长度30");
				}
				ret.add(new IOT_CLIENT_TAG(uuids.get(uuidIndex++), clientId, (String)tag, ts, ts));
			}
		}
		
		return ret;
	}
	
	private void refreshVideoStatistic(String uid, String clientId, VideoStatisticType vsType, Map<String, IOT_METADATA> metaCIdMap){
		VideoStatisticMsg msg = this.streamDataService.refreshVideoStatistic(uid, clientId, vsType, metaCIdMap);
		if(msg != null){
			this.acMq.sendQueue(msg, ConstString.AcQueue_videoStatistic);
		}
	}
}
