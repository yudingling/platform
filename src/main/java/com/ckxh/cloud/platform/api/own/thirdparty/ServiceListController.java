package com.ckxh.cloud.platform.api.own.thirdparty;

import java.io.IOException;

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
import com.ckxh.cloud.persistence.db.model.MAIN_USER;
import com.ckxh.cloud.persistence.db.sys.service.ThirdPartyService;
import com.ckxh.cloud.persistence.db.user.service.UserInfoService;
import com.ckxh.cloud.persistence.model.ThirdPartyServiceFeeType;

@Scope("singleton")
@Controller
@RequestMapping("/own/thirdparty/normal/servceList")
public class ServiceListController {
	@Autowired
	private ThirdPartyService thirdPartyService;
	@Autowired
	private UserInfoService userInfoService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String get(@RequestParam(required = false) String sort, @RequestParam(required = false) String filter, @RequestParam(required = false) String search,
			@RequestParam int start, @RequestParam int length, HttpServletRequest request, HttpServletResponse response) throws IOException{
		try {
			if(start < 0 || length <= 0){
				throw new Exception("参数错误");
			}
			
			String[] sortStr = null;
			if(sort == null){
				sort = "hot";
			}
			if("hot".equals(sort)){
				sortStr = new String[]{"TPS_USED", "CRT_TS"};
			}else if("tm".equals(sort)){
				sortStr = new String[]{"CRT_TS", "TPS_USED"};
			}else{
				throw new Exception("参数错误");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			MAIN_USER user = this.userInfoService.getUserInfo(uid);
			
			if(filter == null){
				filter = "default";
			}
			
			Object[] ret = null;
			if("default".equals(filter)){
				ret = this.thirdPartyService.getThirdPartyServiceList(uid, user.getU_PID(), sortStr, search, start, length, null, null, null);
				
			}else if("free".equals(filter)){
				ret = this.thirdPartyService.getThirdPartyServiceList(uid, user.getU_PID(), sortStr, search, start, length, ThirdPartyServiceFeeType.Free, null, null);
				
			}else if("mine".equals(filter)){
				ret = this.thirdPartyService.getThirdPartyServiceList(uid, user.getU_PID(), sortStr, search, start, length, null, uid, null);
				
			}else if("used".equals(filter)){
				ret = this.thirdPartyService.getThirdPartyServiceList(uid, user.getU_PID(), sortStr, search, start, length, null, null, uid);
				
			}else{
				throw new Exception("参数错误");
			}
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(ret), null, null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
