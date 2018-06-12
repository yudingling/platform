package com.ckxh.cloud.platform.api.own;

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
import com.ckxh.cloud.persistence.db.user.service.UserInfoService;
import com.ckxh.cloud.persistence.model.UserRoleApi;
import com.fasterxml.jackson.core.type.TypeReference;

@Scope("singleton")
@Controller
@RequestMapping("/own/componentAuth/bind")
public class BindAuthController {
	
	@Autowired
	private UserInfoService userInfoService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String bind(@RequestParam String authApi, HttpServletRequest request, HttpServletResponse response){
		try{
			if(authApi != null){
				Map<String, String> authApiMap = MsgPackUtil.deserialize(authApi, new TypeReference<Map<String, String>>(){});
				
				String uid = AuthUtil.getIdFromSession(request.getSession());
				Map<String, UserRoleApi> roleApis = this.userInfoService.getUserRoleApi(uid);
				
				Map<String, List<String>> retMap = new HashMap<String, List<String>>();
				
				for(String aliasNm :authApiMap.keySet()){
					
					String api = authApiMap.get(aliasNm).toLowerCase();
					
					String apiGet = "get:" + api;
					String apiPost = "post:" + api;
					String apiPut = "put:" + api;
					String apiDelete = "delete:" + api;
					
					List<String> tempList = new ArrayList<String>();
					
					if(this.userInfoService.matchApiPath(roleApis, apiGet) != null){
						tempList.add("get");
					}
					if(this.userInfoService.matchApiPath(roleApis, apiPost) != null){
						tempList.add("post");
					}
					if(this.userInfoService.matchApiPath(roleApis, apiPut) != null){
						tempList.add("put");
					}
					if(this.userInfoService.matchApiPath(roleApis, apiDelete) != null){
						tempList.add("delete");
					}
					
					retMap.put(aliasNm, tempList);
				}
				
				return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(retMap), null, null);
				
			}else{
				throw new Exception("参数错误");
			}
		}catch(Exception ex){
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
