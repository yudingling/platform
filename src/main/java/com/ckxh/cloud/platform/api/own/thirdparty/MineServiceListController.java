package com.ckxh.cloud.platform.api.own.thirdparty;

import java.io.IOException;
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
import org.springframework.web.bind.annotation.ResponseBody;

import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.model.MAIN_USER;
import com.ckxh.cloud.persistence.db.sys.service.ThirdPartyService;
import com.ckxh.cloud.persistence.db.user.service.UserInfoService;
import com.ckxh.cloud.persistence.model.ThirdPartyServiceInfo_mine;

@Scope("singleton")
@Controller
@RequestMapping("/own/thirdparty/normal/mineList")
public class MineServiceListController {
	@Autowired
	private ThirdPartyService thirdPartyService;
	@Autowired
	private UserInfoService userInfoService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String get(HttpServletRequest request, HttpServletResponse response) throws IOException{
		try {
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			List<ThirdPartyServiceInfo_mine> list = this.thirdPartyService.getMineServiceList(uid);
			
			MAIN_USER user = this.userInfoService.getUserInfo(uid);
			
			Map<String, Object> ret = new HashMap<String, Object>();
			ret.put("isRNA", user.getU_RNA() == 0? false : true);
			ret.put("list", list);
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(ret), null, null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
