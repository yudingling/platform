package com.ckxh.cloud.platform.api.f3rd;

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
import com.ckxh.cloud.base.util.ConstString;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.persistence.db.f3rd.service.ClientInfo3rdService;
import com.ckxh.cloud.persistence.model.f3rd.MetaDataInfo;
import com.fasterxml.jackson.core.type.TypeReference;

@Scope("singleton")
@Controller
@RequestMapping("/3rd/metadata")
public class MetadatasController {
	@Autowired
	private ClientInfo3rdService clientInfo3rdService;

	@ResponseBody
	@RequestMapping(method = RequestMethod.GET)
	public String get(@RequestParam String clientIds, HttpServletRequest request, HttpServletResponse response) {
		return this.act(clientIds, request, response);
	}
	
	/**
	 * for long parameter (url length is limited)
	 */
	@ResponseBody
	@RequestMapping(method = RequestMethod.POST)
	public String post(@RequestParam String clientIds, HttpServletRequest request, HttpServletResponse response) {
		return this.act(clientIds, request, response);
	}
	
	private String act(String clientIds, HttpServletRequest request, HttpServletResponse response){
		try {
			String uid = (String) request.getAttribute(ConstString.RequestAttr_uid);
			if (uid == null) {
				throw new Exception("用户未授权");
			}
			
			if (clientIds == null || clientIds.length() == 0) {
				throw new Exception("clientIds不能为空");
			}
			
			List<String> cidList = MsgPackUtil.deserialize(clientIds, new TypeReference<List<String>>(){});
			if(cidList.isEmpty()){
				throw new Exception("clientIds不能为空");
			}
			
			if(!this.clientInfo3rdService.clientAuthority(cidList, uid)){
				throw new Exception("存在设备未授权访问");
			}
			
			List<MetaDataInfo> metadata = clientInfo3rdService.getMetadata(cidList);
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(metadata), null, null);
		} catch (Exception e) {
			e.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, e.getMessage(), null);
		}
	}
}
