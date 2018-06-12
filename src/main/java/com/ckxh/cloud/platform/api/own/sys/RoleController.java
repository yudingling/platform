package com.ckxh.cloud.platform.api.own.sys;

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

import com.ckxh.cloud.base.annotation.AuthPathOnBind;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.model.MAIN_ROLE;
import com.ckxh.cloud.persistence.db.sys.service.AccountService;
import com.ckxh.cloud.persistence.model.UserSubRoleApi;
import com.fasterxml.jackson.core.type.TypeReference;

@Scope("singleton")
@Controller
@RequestMapping("/own/sys/normal/role")
@AuthPathOnBind("get:/platformApi/own/sys/normal/#")
public class RoleController {
	@Autowired
	private AccountService accountService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String get(HttpServletRequest request, HttpServletResponse response){
		try{
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			List<UserSubRoleApi> apis = this.accountService.getUserSubRoleApi(uid);
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(apis), null, null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.PUT)
	public String update(@RequestParam String id, @RequestParam String name, @RequestParam(required = false) String desc, @RequestParam String apis,
			HttpServletRequest request, HttpServletResponse response){
		try{
			if(id == null || id.length() == 0 || name == null || name.length() == 0 || apis == null || apis.length() == 0){
				throw new Exception("参数错误");
			}
			
			if(desc != null && desc.length() == 0){
				desc = null;
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			List<UserSubRoleApi> apiList = MsgPackUtil.deserialize(apis, new TypeReference<List<UserSubRoleApi>>(){});
			
			if(this.accountService.updateUserSubRole(uid, id, name, desc, apiList)){
				Map<String, String> retMap = new HashMap<String, String>();
				retMap.put("id", id);
				retMap.put("dId", id);
				
				return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(retMap), "更新成功", null);
			}else{
				return JsonUtil.createSuccessJson(false, null, "更新失败", null);
			}
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.POST)
	public String post(@RequestParam String name, @RequestParam(required = false) String desc, @RequestParam String apis,
			HttpServletRequest request, HttpServletResponse response){
		try{
			if(name == null || name.length() == 0 || apis == null || apis.length() == 0){
				throw new Exception("参数错误");
			}
			
			if(desc != null && desc.length() == 0){
				desc = null;
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			List<UserSubRoleApi> apiList = MsgPackUtil.deserialize(apis, new TypeReference<List<UserSubRoleApi>>(){});
			
			MAIN_ROLE role = this.accountService.createUserSubRole(uid, name, desc, apiList);
			if(role != null){
				Map<String, String> retMap = new HashMap<String, String>();
				retMap.put("id", role.getROLE_ID());
				retMap.put("dId", role.getROLE_ID());
				
				return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(retMap), "添加成功", null);
			}else{
				return JsonUtil.createSuccessJson(false, null, "添加失败", null);
			}
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.DELETE)
	public String delete(@RequestParam String roleIds, HttpServletRequest request, HttpServletResponse response){
		try{
			if(roleIds == null || roleIds.length() == 0){
				throw new Exception("参数错误");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			List<String> idList = MsgPackUtil.deserialize(roleIds, new TypeReference<List<String>>(){});
			
			List<String> delList = new ArrayList<String>();
			if(!idList.isEmpty()){
				delList = this.accountService.deleteUserSubRole(uid, idList);
			}
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(delList), "删除成功", null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
