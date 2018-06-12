package com.ckxh.cloud.platform.api.own.thirdparty;

import java.io.IOException;
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
import org.springframework.web.bind.annotation.ResponseBody;

import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.persistence.db.model.MAIN_API;
import com.ckxh.cloud.persistence.db.sys.service.ApiInfoService;
import com.ckxh.cloud.platform.model.MAIN_API_3RDAUTH_EXT;

@Scope("singleton")
@Controller
@RequestMapping("/own/thirdparty/normal/authApis")
public class AuthApisController {
	@Autowired
	private ApiInfoService apiInfoService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String get(HttpServletRequest request, HttpServletResponse response) throws IOException{
		try {
			List<MAIN_API_3RDAUTH_EXT> list = new ArrayList<MAIN_API_3RDAUTH_EXT>();
			
			Map<String, MAIN_API> authMap = this.apiInfoService.get3rdAuthApiMap();
			for(MAIN_API api : authMap.values()){
				list.add(new MAIN_API_3RDAUTH_EXT(api.getAPI_ID(), api.getAPI_NM()));
			}
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(list), null, null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
