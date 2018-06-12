package com.ckxh.cloud.platform.api.own.influx;

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
import com.fasterxml.jackson.core.type.TypeReference;

/**
 * this controller is using for authorization of sub user. 
 */
@Scope("singleton")
@Controller
@RequestMapping("/own/seriesUpdate/imageData")
public class ImageDataUpdateController {
	@Autowired
	private ClientInfoService clientInfoService;
	@Autowired
	private StreamDataService streamDataService;
	
	@ResponseBody
	@RequestMapping(method = RequestMethod.DELETE)
	public String delete(@RequestParam String clientId, @RequestParam String metaId, @RequestParam String delIds,
			HttpServletRequest request, HttpServletResponse response){
		try {
			if(clientId == null || clientId.length() == 0 || metaId == null || metaId.length() == 0){
				throw new Exception("参数错误");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			if(!this.clientInfoService.clientAuthority(clientId, uid, false)){
				throw new Exception("设备未授权");
			}
			
			//no record for delete is allowed
			if(delIds == null || delIds.length() == 0){
				return JsonUtil.createSuccessJson(true, null, null, null);
			}
			
			List<Long> delList =  MsgPackUtil.deserialize(delIds, new TypeReference<List<Long>>(){});
			if(!delList.isEmpty()){
				IOT_METADATA meta = this.clientInfoService.getClientMetadataMap(clientId).getMetaIdMap().get(metaId);
				if(meta != null){
					this.streamDataService.deleteImageFiles(clientId, meta.getMETA_ID(), meta.getMETA_CID(), delList);
				}
			}
			
			return JsonUtil.createSuccessJson(true, null, null, null);
			
		}catch(Exception e){
			e.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, e.getMessage(), null);
		}
	}
}
