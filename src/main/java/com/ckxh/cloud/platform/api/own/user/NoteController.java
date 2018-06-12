package com.ckxh.cloud.platform.api.own.user;

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

import com.ckxh.cloud.base.annotation.AuthPathOnBind;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.user.service.UserRemindService;
import com.fasterxml.jackson.core.type.TypeReference;

@Scope("singleton")
@Controller
@RequestMapping("/own/user/normal/notification")
public class NoteController {
	@Autowired
	private UserRemindService userRemindService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String get(@RequestParam(required = false) Integer noteLevel, @RequestParam(required = false) String noteType, @RequestParam(required = false) String search, 
			@RequestParam(required = false) Integer readed, @RequestParam int start, @RequestParam int length, HttpServletRequest request, HttpServletResponse response){
		try{
			if(start < 0 || length <= 0){
				throw new Exception("参数错误");
			}
			
			if(readed == null){
				readed = -1;
			}
			if(noteLevel == null){
				noteLevel = -1;
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			Object[] retData = this.userRemindService.getUserReminds(uid, noteLevel, noteType, search, readed, start, length);
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(retData), null, null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.PUT)
	@AuthPathOnBind("get:/platformApi/own/user/normal/#")
	public String update(@RequestParam String rmIds, HttpServletRequest request, HttpServletResponse response){
		try{
			if(rmIds == null || rmIds.length() == 0){
				throw new Exception("参数错误");
			}
			
			List<Long> rmIdList = MsgPackUtil.deserialize(rmIds, new TypeReference<List<Long>>(){});
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			if(this.userRemindService.updateUserRemindForClose(uid, rmIdList)){
				return JsonUtil.createSuccessJson(true, null, "关闭通知成功", null);
			}else{
				return JsonUtil.createSuccessJson(false, null, "关闭通知失败", null);
			}
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
