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
import com.ckxh.cloud.persistence.common.ClientMetadataTool;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.client.service.ClientInfoService;
import com.ckxh.cloud.persistence.db.model.IOT_CLIENT;
import com.ckxh.cloud.persistence.model.Metadata_with_Preview;

@Scope("singleton")
@Controller
@RequestMapping("/own/client/normal/latestDataReport")
public class LatestDataReportController {
	@Autowired
	private ClientInfoService clientInfoService;

	@Autowired
	private ClientMetadataTool clientMetadataTool;

	@ResponseBody
	@RequestMapping(method = RequestMethod.GET)
	public String get(@RequestParam(required = false) String search, HttpServletRequest request, HttpServletResponse response) {
		try {
			String uid = AuthUtil.getIdFromSession(request.getSession());

			List<IOT_CLIENT> clientList = this.clientInfoService.getMyClients(uid, search, false);

			Map<String, Object> metaDataMap = null;

			List<Object> metaDatas = new ArrayList<Object>();
			
			List<Metadata_with_Preview> metadataPreviewInfo = null;
			
			for (IOT_CLIENT client: clientList) {
				metaDataMap = new HashMap<String, Object>();

				metadataPreviewInfo = this.clientMetadataTool.getMetadataPreviewInfo((client.getC_ID()));
		
				metaDataMap.put("c_ID", client.getC_ID());				
				metaDataMap.put("c_NM", client.getC_NM());									
				metaDataMap.put("metaInfo", metadataPreviewInfo);
				
				metaDatas.add(metaDataMap);
			}

			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(metaDatas), null, null);

		} catch (Exception e) {
			e.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, e.getMessage(), null);
		}
	}
}
