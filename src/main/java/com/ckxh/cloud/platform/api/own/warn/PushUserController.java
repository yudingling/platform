package com.ckxh.cloud.platform.api.own.warn;

import java.sql.Timestamp;
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
import com.ckxh.cloud.base.util.DateUtil;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.base.util.Validator;
import com.ckxh.cloud.persistence.common.SysTool;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.client.service.WarnInfoService;
import com.ckxh.cloud.persistence.db.model.MAIN_3RDPUSH_USER;
import com.ckxh.cloud.persistence.model.Auto3rdPushType;
import com.ckxh.cloud.persistence.model.ClientTreeNode;
import com.fasterxml.jackson.core.type.TypeReference;

@Scope("singleton")
@Controller
@RequestMapping("/own/warn/normal/pushUser")
@AuthPathOnBind("get:/platformApi/own/warn/normal/#")
public class PushUserController {
	@Autowired
	private WarnInfoService warnInfoService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String get(@RequestParam(required = false) String pushType, @RequestParam(required = false) String search, @RequestParam(required = false) Boolean showCheck,
			HttpServletRequest request, HttpServletResponse response){
		try {
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			if(showCheck == null){
				showCheck = false;
			}
			
			List<ClientTreeNode> retList = null;
			if(pushType != null && pushType.length() > 0){
				retList = this.warnInfoService.getPushUserTree(uid, Auto3rdPushType.valueOf(pushType), search, showCheck);
			}else{
				retList = this.warnInfoService.getPushUserTree(uid, null, search, showCheck);
			}
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(retList), null, null);
			
		} catch (Exception e) {
			e.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, e.getMessage(),null);
		}
	}
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.POST)
	public String post(@RequestParam String info, HttpServletRequest request, HttpServletResponse response){
		try{
			if(info == null || info.length() == 0){
				throw new Exception("参数错误");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			MAIN_3RDPUSH_USER pushUser = MsgPackUtil.deserialize(info, MAIN_3RDPUSH_USER.class);
			
			ClientTreeNode ret = null;
			if(this.checkPushUser(pushUser, uid, true)){
				ret = this.warnInfoService.savePushUser(pushUser);
			}
			
			return JsonUtil.createSuccessJson(ret != null, MsgPackUtil.serialize2Str(ret), ret != null? "添加成功" : "添加失败", null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.PUT)
	public String put(@RequestParam String info, HttpServletRequest request, HttpServletResponse response){
		try{
			if(info == null || info.length() == 0){
				throw new Exception("参数错误");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			MAIN_3RDPUSH_USER pushUser = MsgPackUtil.deserialize(info, MAIN_3RDPUSH_USER.class);
			
			ClientTreeNode ret = null;
			if(this.checkPushUser(pushUser, uid, false)){
				ret = this.warnInfoService.updatePushUser(pushUser);
			}
			
			return JsonUtil.createSuccessJson(ret != null, MsgPackUtil.serialize2Str(ret), ret != null? "更新成功" : "更新失败", null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.DELETE)
	public String delete(@RequestParam String ids, HttpServletRequest request, HttpServletResponse response){
		try{
			if(ids == null || ids.length() == 0){
				throw new Exception("参数错误");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			List<Long> delIdList = MsgPackUtil.deserialize(ids, new TypeReference<List<Long>>(){});
			if(!delIdList.isEmpty()){
				this.warnInfoService.deletePushUser(uid, delIdList);
			}
			
			return JsonUtil.createSuccessJson(true, null, "删除成功", null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
	
	private boolean checkPushUser(MAIN_3RDPUSH_USER pushUser, String uid, boolean isAdd) throws Exception{
		if(pushUser.getPU_PHONE() != null && pushUser.getPU_PHONE().length() > 0 && !Validator.isMobile(pushUser.getPU_PHONE())){
			throw new Exception("手机号输入错误");
		}
		
		if(pushUser.getPU_EMAIL() != null && pushUser.getPU_EMAIL().length() > 0 && !Validator.isEmail(pushUser.getPU_EMAIL())){
			throw new Exception("邮箱输入错误");
		}
		
		Timestamp ts = DateUtil.getCurrentTS();
		pushUser.setU_ID(uid);
		pushUser.setCRT_TS(ts);
		pushUser.setUPT_TS(ts);
		
		if(isAdd){
			pushUser.setPU_ID(SysTool.longUuid());
		}
		
		return true;
	}
}
