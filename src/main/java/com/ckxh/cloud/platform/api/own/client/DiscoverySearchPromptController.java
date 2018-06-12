package com.ckxh.cloud.platform.api.own.client;

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
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.client.service.ClientInfoService;
import com.ckxh.cloud.persistence.db.client.service.StreamDataService;
import com.ckxh.cloud.persistence.db.model.IOT_METADATA;
import com.ckxh.cloud.persistence.model.ClientInfo_Discovery;
import com.ckxh.cloud.platform.model.DiscoverySearchPromptItem;

@Scope("singleton")
@Controller
@RequestMapping("/own/client/normal/discovery/search/prompt")
public class DiscoverySearchPromptController {
	@Autowired
	private ClientInfoService clientInfoService;
	@Autowired
	private StreamDataService streamDataService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String get(@RequestParam String search, @RequestParam double xmin, @RequestParam double xmax, @RequestParam double ymin, 
			@RequestParam double ymax, @RequestParam int maxCount, HttpServletRequest request, HttpServletResponse response){
		try {
			if(search == null || search.length() ==0 || maxCount <= 0){
				throw new Exception("参数错误");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			List<ClientInfo_Discovery> clients = this.clientInfoService.getDiscoveryClients(uid, xmin, xmax, ymin, ymax, search, 0, maxCount);
			List<DiscoverySearchPromptItem> retList = new ArrayList<DiscoverySearchPromptItem>();
			
			for(ClientInfo_Discovery cli : clients){
				DiscoverySearchPromptItem item = new DiscoverySearchPromptItem(cli.getC_ID(), cli.getC_NM());
				
				for(IOT_METADATA meta: this.clientInfoService.getClientMetadataMap(cli.getC_ID()).getMetaIdMap().values()){
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
				
				retList.add(item);
			}
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(retList), null, null);
		
		} catch (Exception e) {
			e.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, e.getMessage(),null);
		}
	}
}
