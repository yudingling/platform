package com.ckxh.cloud.platform.api.own.client;

import java.util.Map;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.persistence.db.client.service.ClientInfoService;
import com.ckxh.cloud.persistence.db.model.IOT_METADATA_SYS_PLUGIN;

@Scope("singleton")
@Controller
@RequestMapping("/own/client/normal/sysMetaPlugins")
public class SysMetaPluginsController {
	@Autowired
	private ClientInfoService clientInfoService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String get(HttpServletRequest request, HttpServletResponse response){
		try {
			Map<String, IOT_METADATA_SYS_PLUGIN> list = this.clientInfoService.getSysMetadataPlugins();
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(list), null, null);
		
		} catch (Exception e) {
			return JsonUtil.createSuccessJson(false, null, e.getMessage(),null);
		}
	}
}
