package com.ckxh.cloud.platform.api.own.client;

import java.text.SimpleDateFormat;
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
import com.ckxh.cloud.persistence.common.ClientMetadataTool;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.client.service.ClientInfoService;
import com.ckxh.cloud.persistence.model.Metadata_with_Preview;

@Scope("singleton")
@Controller
@RequestMapping("/own/client/normal/metadata/preview")
public class ClientMetadataPreviewController {
	@Autowired
	private ClientInfoService clientInfoService;
	@Autowired
	private ClientMetadataTool clientMetadataTool;
	
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
			
			List<Metadata_with_Preview> records = this.clientMetadataTool.getMetadataPreviewInfo(clientId);
			
			boolean isStar = this.clientInfoService.isStar(uid, clientId);
			
			Map<String, Object> retMap = new HashMap<String, Object>();
			retMap.put("metaInfo", records);
			retMap.put("star", isStar);
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(retMap, new SimpleDateFormat("MM/dd HH:mm")), null, null);

		} catch (Exception e) {
			e.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, e.getMessage(),null);
		}
	}
}
