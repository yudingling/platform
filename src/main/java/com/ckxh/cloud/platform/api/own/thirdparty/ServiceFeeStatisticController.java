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
import com.ckxh.cloud.persistence.db.model.MAIN_3RDSERVICE_FEE;
import com.ckxh.cloud.persistence.db.model.MAIN_USER_3RDSERVICE;
import com.ckxh.cloud.persistence.db.sys.service.ThirdPartyService;

@Scope("singleton")
@Controller
@RequestMapping("/own/thirdparty/normal/feeStatistic")
public class ServiceFeeStatisticController {
	@Autowired
	private ThirdPartyService thirdPartyService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String get(@RequestParam Long tpsId, @RequestParam Long uspId, HttpServletRequest request, HttpServletResponse response) throws IOException{
		try {
			if(tpsId == null || uspId == null){
				throw new Exception("参数错误");
			}
			
			MAIN_3RDSERVICE_FEE fee = this.thirdPartyService.get3RdServiceFee(tpsId);
			if(fee == null){
				throw new Exception("参数错误");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			MAIN_USER_3RDSERVICE s3rd = this.thirdPartyService.getUserOf3RdService_fromDB(uid, uspId);
			if(s3rd == null){
				throw new Exception("参数错误");
			}
			
			Object ret = this.thirdPartyService.get3rdFeeStatistic(uid, uspId, fee);
			if(ret == null){
				return JsonUtil.createSuccessJson(false, null, "操作失败", null);
			}else{
				return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(ret), null, null);
			}
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
