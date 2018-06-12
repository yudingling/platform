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
import com.ckxh.cloud.base.annotation.AuthPathOnBind;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.sys.service.ThirdPartyService;

@Scope("singleton")
@Controller
@RequestMapping("/own/thirdparty/statusReview")
@AuthPathOnBind("get:/platformApi/own/thirdparty/normal/#")
public class ServiceStatusReviewController {
	@Autowired
	private ThirdPartyService thirdPartyService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.PUT)
	public String put(@RequestParam Long tpsId, HttpServletRequest request, HttpServletResponse response) throws IOException{
		try {
			if(tpsId == null){
				throw new Exception("参数错误");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			boolean ret = this.thirdPartyService.updateServiceStatusReview(tpsId, uid);
			
			return JsonUtil.createSuccessJson(ret, null, ret? "申请成功" : "申请失败", null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
