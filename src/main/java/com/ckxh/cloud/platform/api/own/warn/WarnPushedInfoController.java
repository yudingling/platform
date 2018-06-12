package com.ckxh.cloud.platform.api.own.warn;

import java.util.HashMap;
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
import com.ckxh.cloud.persistence.db.client.service.WarnInfoService;
import com.ckxh.cloud.persistence.db.model.MAIN_3RDPUSH_MAIL;
import com.ckxh.cloud.persistence.db.model.MAIN_3RDPUSH_MSG;
import com.ckxh.cloud.persistence.db.model.MAIN_3RDPUSH_WECHAT;
import com.ckxh.cloud.persistence.model.WarnInfo;

@Scope("singleton")
@Controller
@RequestMapping("/own/warn/normal/pushedInfo")
public class WarnPushedInfoController {
	@Autowired
	private WarnInfoService warnInfoService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String get(@RequestParam Long wrnId, @RequestParam(required = false) Long msgId, @RequestParam(required = false) Long mailId, 
			@RequestParam(required = false) Long wechatId, HttpServletRequest request, HttpServletResponse response){
		try{
			if(wrnId == null){
				throw new Exception("参数错误");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			WarnInfo wrn = this.warnInfoService.getWarn(uid, wrnId);
			if(wrn == null){
				throw new Exception("未找到相关预警记录");
			}
			
			Map<String, Object> retMap = new HashMap<String, Object>();
			if(msgId != null){
				MAIN_3RDPUSH_MSG obj = this.warnInfoService.getWarnPushedMsg(wrnId, msgId);
				retMap.put("msg", obj);
			}
			if(mailId != null){
				MAIN_3RDPUSH_MAIL obj = this.warnInfoService.getWarnPushedMail(wrnId, mailId);
				retMap.put("mail", obj);
			}
			if(wechatId != null){
				MAIN_3RDPUSH_WECHAT obj = this.warnInfoService.getWarnPushedWeChat(wrnId, wechatId);
				retMap.put("weChat", obj);
			}
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(retMap), null, null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
