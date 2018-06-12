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
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.model.MAIN_3RDSERVICE_FEE;
import com.ckxh.cloud.persistence.db.model.MAIN_USER;
import com.ckxh.cloud.persistence.db.sys.service.ThirdPartyService;
import com.ckxh.cloud.persistence.db.user.service.UserInfoService;
import com.ckxh.cloud.persistence.model.ThirdPartyServiceDetail;
import com.ckxh.cloud.persistence.model.ThirdPartyServiceFeeType;

@Scope("singleton")
@Controller
@RequestMapping("/own/thirdparty/normal/purchase")
@AuthPathOnBind("get:/platformApi/own/thirdparty/normal/#")
public class ServicePurchaseController {
	@Autowired
	private ThirdPartyService thirdPartyService;
	@Autowired
	private UserInfoService userInfoService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.POST)
	public String post(@RequestParam Long tpsId, HttpServletRequest request, HttpServletResponse response) throws IOException{
		try {
			if(tpsId == null){
				throw new Exception("参数错误");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			MAIN_USER user = this.userInfoService.getUserInfo(uid);
			
			ThirdPartyServiceDetail service = this.thirdPartyService.getServiceDetail(tpsId, uid, user.getU_PID());
			if(service == null || service.getFEE_TP() == ThirdPartyServiceFeeType.Free.getValue()){
				throw new Exception("参数错误");
			}
			
			//1. add a unfree service is the same with free service at the first step. 
			Long uspId = this.thirdPartyService.saveFreeUseService(service, uid);
			
			//2. create fee statistic (try using). 
			//  if there is a payment then the fee statistic will be updated in the callback after payed.
			MAIN_3RDSERVICE_FEE fee = this.thirdPartyService.get3RdServiceFee(tpsId);
			Object feeSta = this.thirdPartyService.create3rdFeeStatisticOnTryUsing(uid, uspId, fee);
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(feeSta), "添加服务成功", null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
