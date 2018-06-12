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
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.client.service.ClientInfoService;
import com.ckxh.cloud.persistence.db.client.service.StreamDataService;
import com.ckxh.cloud.persistence.db.model.IOT_CLIENT;
import com.ckxh.cloud.persistence.db.model.IOT_METADATA;
import com.ckxh.cloud.persistence.db.model.MAIN_USER;
import com.ckxh.cloud.persistence.db.user.service.UserInfoService;
import com.ckxh.cloud.persistence.influx.InfluxClient;
import com.ckxh.cloud.platform.model.DiscoveryItem;
import com.fasterxml.jackson.core.type.TypeReference;

@Scope("singleton")
@Controller
@RequestMapping("/own/client/normal/discovery/detail")
public class DiscoveryDetailController {
	@Autowired
	private ClientInfoService clientInfoService;
	@Autowired
	private UserInfoService userInfoService;
	@Autowired
	private StreamDataService streamDataService;
	@Autowired
	private InfluxClient influxClient;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String get(@RequestParam String clientIds, HttpServletRequest request, HttpServletResponse response){
		try {
			if(clientIds == null || clientIds.length() == 0){
				throw new Exception("参数错误");
			}
			
			List<String> ids = MsgPackUtil.deserialize(clientIds, new TypeReference<List<String>>(){});
			List<IOT_CLIENT> chkClis = new ArrayList<IOT_CLIENT>();
			List<String> chkIds = new ArrayList<String>();
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			Map<String, DiscoveryItem> retList = new HashMap<String, DiscoveryItem>();
			for(String cid : ids){
				IOT_CLIENT cli = this.clientInfoService.getClient(cid);
				if(cli != null && this.clientInfoService.clientAuthority(cli, uid, true)){
					DiscoveryItem item = new DiscoveryItem(cid, cli.getC_NM());
					chkClis.add(cli);
					chkIds.add(cid);
					
					item.setPublic(cli.getC_PUBLIC() > 0);
					item.setCrtTs(cli.getCRT_TS());
					item.setStarCount(this.clientInfoService.getStarCount(cid));
					
					MAIN_USER owner = this.userInfoService.getUserInfo(cli.getC_OWNER_UID());
					if(owner != null){
						item.setuId(owner.getU_ID());
						item.setuNm(owner.getU_NM());
						item.setuIcon(owner.getU_ICON());
					}
					
					item.setTags(this.clientInfoService.getClientTags(cid));
					
					for(IOT_METADATA meta: this.clientInfoService.getClientMetadataMap(cid).getMetaIdMap().values()){
						boolean isImage = this.streamDataService.isMetaImageType(meta.getSYSMETA_ID());
						if(isImage && !item.isHasImage()){
							item.setHasImage(true);
						}
						
						boolean isVideo = this.streamDataService.isMetaVideoType(meta.getSYSMETA_ID());
						if(isVideo && !item.isHasVideo()){
							item.setHasVideo(true);
						}
						
						if(!isImage && !isVideo && !item.isHasTsData()){
							item.setHasTsData(true);
						}
						
						if(item.isHasImage() && item.isHasVideo() && item.isHasTsData()){
							break;
						}
					}
					
					retList.put(cid, item);
				}
			}
			
			if(!chkIds.isEmpty()){
				List<String> stared = this.clientInfoService.getStarClients(uid, chkIds);
				for(String starId: stared){
					retList.get(starId).setStarByCurrent(true);
				}
			}
			
			Map<String, Long> tms = this.influxClient.getLatestTMFromRedis(chkClis);
			for(DiscoveryItem item: retList.values()){
				item.setLatestTs(tms.get(item.getCid()));
			}
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(retList.values()), null, null);
		
		} catch (Exception e) {
			e.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, e.getMessage(),null);
		}
	}
}
