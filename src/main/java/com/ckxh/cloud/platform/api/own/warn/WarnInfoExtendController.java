package com.ckxh.cloud.platform.api.own.warn;

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
import com.ckxh.cloud.persistence.db.client.service.WarnInfoService;
import com.ckxh.cloud.persistence.db.model.IOT_WARN_MAIL;
import com.ckxh.cloud.persistence.db.model.IOT_WARN_MSG;
import com.ckxh.cloud.persistence.db.model.IOT_WARN_WECHAT;
import com.ckxh.cloud.persistence.db.model.MAIN_USER;
import com.ckxh.cloud.persistence.db.sys.service.MaintenanceService;
import com.ckxh.cloud.persistence.db.user.service.UserInfoService;
import com.ckxh.cloud.persistence.model.MaintRecordInfo;
import com.ckxh.cloud.persistence.model.WarnInfo;

@Scope("singleton")
@Controller
@RequestMapping("/own/warn/normal/warnInfo/extend")
public class WarnInfoExtendController {
	@Autowired
	private WarnInfoService warnInfoService;
	@Autowired
	private UserInfoService userInfoService;
	@Autowired
	private MaintenanceService maintenanceService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String get(@RequestParam Long wrnId, HttpServletRequest request, HttpServletResponse response){
		try{
			if(wrnId == null){
				throw new Exception("参数错误");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			WarnInfo wrn = this.warnInfoService.getWarn(uid, wrnId);
			if(wrn == null){
				throw new Exception("未找到相关预警记录");
			}
			
			if(wrn.getWRN_CHK() > 0 && wrn.getWRN_CHK_UID() != null && wrn.getWRN_CHK_UID().length() > 0){
				MAIN_USER user = this.userInfoService.getUserInfo(wrn.getWRN_CHK_UID());
				if(user != null){
					wrn.setWRN_CHK_UNM(user.getU_NM());
				}
			}
			if(wrn.getWRN_CLOSE() > 0 && wrn.getWRN_CLOSE_UID() != null && wrn.getWRN_CLOSE_UID().length() > 0){
				MAIN_USER user = this.userInfoService.getUserInfo(wrn.getWRN_CLOSE_UID());
				if(user != null){
					wrn.setWRN_CLOSE_UNM(user.getU_NM());
				}
			}
			
			//get the warn mail/message/wechart records
			List<IOT_WARN_MSG> listMsg = this.warnInfoService.getWarnMsg(wrnId);
			List<IOT_WARN_MAIL> listMail = this.warnInfoService.getWarnMail(wrnId);
			List<IOT_WARN_WECHAT> listWeChat = this.warnInfoService.getWarnWeChat(wrnId);
			List<MaintRecordInfo> listMaints = this.maintenanceService.getMaintenanceRecords(wrnId);
			
			Map<String, Object> retMap = new HashMap<String, Object>();
			retMap.put("warnInfo", wrn);
			retMap.put("msg", listMsg);
			retMap.put("mail", listMail);
			retMap.put("weChat", listWeChat);
			retMap.put("maint", listMaints);
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(retMap), null, null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
