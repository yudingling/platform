package com.ckxh.cloud.platform.api.own.sys;

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
import com.ckxh.cloud.persistence.db.sys.service.DataGroupService;
import com.ckxh.cloud.persistence.model.ClientTreeNode;

@Scope("singleton")
@Controller
@RequestMapping("/own/sys/normal/dataGroup")
@AuthPathOnBind("get:/platformApi/own/sys/normal/#")
public class GroupController {
	@Autowired
	private DataGroupService dataGroupService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.POST)
	public String post(@RequestParam(required = false) Long pId, @RequestParam String name, HttpServletRequest request, HttpServletResponse response){
		try{
			if(name == null || name.length() == 0){
				throw new Exception("参数错误");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			ClientTreeNode ret = this.dataGroupService.createGroup(uid, pId, name, false);
			if(ret != null){
				return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(ret), null, null);
			}else{
				throw new Exception("创建分组失败");
			}
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.PUT)
	public String put(@RequestParam Long id, @RequestParam String name, HttpServletRequest request, HttpServletResponse response){
		try{
			if(id == null || name == null || name.length() == 0){
				throw new Exception("参数错误");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			boolean ret = this.dataGroupService.updateGroup(uid, id, name);
			return JsonUtil.createSuccessJson(ret, null, ret? "保存成功": "保存失败, 分组不存在或非当前用户创建", null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
