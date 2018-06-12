package com.ckxh.cloud.platform.api.own.warn;

import java.sql.Timestamp;
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
import com.ckxh.cloud.base.util.DateUtil;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.base.util.Validator;
import com.ckxh.cloud.persistence.common.SysTool;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.client.service.WarnInfoService;
import com.ckxh.cloud.persistence.db.model.MAIN_AUTO_3RDPUSH;
import com.ckxh.cloud.persistence.model.Auto3rdPushType;
import com.fasterxml.jackson.core.type.TypeReference;

@Scope("singleton")
@Controller
@RequestMapping("/own/warn/normal/auto3rdPush")
public class Auto3rdPushController {
	@Autowired
	private WarnInfoService warnInfoService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String get(@RequestParam String pushType, HttpServletRequest request, HttpServletResponse response){
		try{
			if(pushType == null || pushType.length() == 0){
				throw new Exception("参数错误");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			List<MAIN_AUTO_3RDPUSH> retList = this.warnInfoService.getAuto3rdPushList(uid, Auto3rdPushType.valueOf(pushType));
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(retList), null, null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.POST)
	@AuthPathOnBind("get:/platformApi/own/warn/normal/#")
	public String post(@RequestParam String list, @RequestParam String pushType, HttpServletRequest request, HttpServletResponse response){
		try{
			if(list == null || list.length() == 0 || pushType == null || pushType.length() == 0){
				throw new Exception("参数错误");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			Auto3rdPushType pt = Auto3rdPushType.valueOf(pushType);
			
			Timestamp ts = DateUtil.getCurrentTS();
			
			List<MAIN_AUTO_3RDPUSH> addList = (List<MAIN_AUTO_3RDPUSH>) MsgPackUtil.deserialize(list, new TypeReference<List<MAIN_AUTO_3RDPUSH>>(){});
			Map<String, MAIN_AUTO_3RDPUSH> addMap = new HashMap<String, MAIN_AUTO_3RDPUSH>();
			
			if(addList != null && !addList.isEmpty()){
				List<Long> uuids = SysTool.longUuid(addList.size());
				int uuidIndex = 0;
				
				for(MAIN_AUTO_3RDPUSH item : addList){
					if(item.getUP_VAL() != null && item.getUP_VAL().length() > 0 && this.validateValue(item, pt)){
						item.setUP_ID(uuids.get(uuidIndex++));
						item.setU_ID(uid);
						item.setUP_TP(pt.getValue());
						item.setCRT_TS(ts);
						item.setUPT_TS(ts);
						
						addMap.put(item.getUP_VAL(), item);
					}
				}
			}
			
			//record in oldList has the save msg/email with the item in addList will be removed
			List<MAIN_AUTO_3RDPUSH> oldList = this.warnInfoService.getAuto3rdPushList(uid, pt);
			for(MAIN_AUTO_3RDPUSH item : oldList){
				if(!addMap.containsKey(item.getUP_VAL())){
					addMap.put(item.getUP_VAL(), item);
				}
			}
			
			List<MAIN_AUTO_3RDPUSH> retList = new ArrayList<MAIN_AUTO_3RDPUSH>(addMap.values());
			
			boolean ret = this.warnInfoService.updateAuto3rdPush(uid, pt, retList);
			
			return JsonUtil.createSuccessJson(ret, MsgPackUtil.serialize2Str(retList), null, null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.DELETE)
	@AuthPathOnBind("get:/platformApi/own/warn/normal/#")
	public String delete(@RequestParam String idList, @RequestParam String pushType, HttpServletRequest request, HttpServletResponse response){
		try{
			if(idList == null || idList.length() == 0 || pushType == null || pushType.length() == 0){
				throw new Exception("参数错误");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			Auto3rdPushType pt = Auto3rdPushType.valueOf(pushType);
			
			List<String> delIdList = MsgPackUtil.deserialize(idList, new TypeReference<List<String>>(){});
			if(!delIdList.isEmpty()){
				this.warnInfoService.deleteAuto3rdPush(uid, pt, delIdList);
			}
			
			return JsonUtil.createSuccessJson(true, null, "删除成功", null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
	
	private boolean validateValue(MAIN_AUTO_3RDPUSH item, Auto3rdPushType pt){
		switch(pt){
			case msg:
				return Validator.isMobile(item.getUP_VAL());
				
			case email:
				return Validator.isEmail(item.getUP_VAL());
				
			default:
				return false;
		}
	}
}
