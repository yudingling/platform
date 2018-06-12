package com.ckxh.cloud.platform.api.own.thirdparty;

import java.io.IOException;
import java.sql.Timestamp;
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
import com.ckxh.cloud.base.util.ConstString;
import com.ckxh.cloud.base.util.DateUtil;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.persistence.common.CacheChanger;
import com.ckxh.cloud.persistence.common.SysTool;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.model.MAIN_3RDSERVICE;
import com.ckxh.cloud.persistence.db.model.MAIN_3RDSERVICE_RELIABLE;
import com.ckxh.cloud.persistence.db.model.MAIN_3RDSERVICE_RELIABLE_RECHARGE;
import com.ckxh.cloud.persistence.db.model.MAIN_USER;
import com.ckxh.cloud.persistence.db.sys.service.ThirdPartyService;
import com.ckxh.cloud.persistence.db.user.service.UserInfoService;
import com.ckxh.cloud.persistence.model.PayResultType;
import com.ckxh.cloud.persistence.model.RechargeType;
import com.ckxh.cloud.persistence.model.ThirdPartyServiceStatus;
import com.ckxh.cloud.platform.model.BalancePayInfo;
import com.ckxh.cloud.platform.model.PrePayInfo;
import com.ckxh.cloud.platform.pay.PayType;
import com.ckxh.cloud.platform.pay.Payment;

@Scope("singleton")
@Controller
@RequestMapping("/own/thirdparty/normal/reliablePay")
@AuthPathOnBind("get:/platformApi/own/thirdparty/normal/#")
public class ServiceReliableReviewPayController {
	@Autowired
	private ThirdPartyService thirdPartyService;
	@Autowired
	private CacheChanger cacheChanger;
	@Autowired
	private UserInfoService userInfoService;
	
	@ResponseBody
	@RequestMapping(method = RequestMethod.POST)
	public String post(@RequestParam String payTp, @RequestParam Long tpsId, @RequestParam String rlName, @RequestParam String subject, HttpServletRequest request, HttpServletResponse response) throws IOException {
		try {
			if(payTp == null || payTp.length() == 0 || tpsId == null || rlName == null || rlName.isEmpty() || subject == null || subject.isEmpty()){
				throw new Exception("参数错误");
			}
			
			PayType pp = PayType.valueOf(payTp);
			if(pp == null){
				throw new Exception("参数错误");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			MAIN_3RDSERVICE_RELIABLE_RECHARGE msrc = this.getPayInfo(uid, tpsId, rlName);
			
			if(this.thirdPartyService.save3rdReliableRecharge(msrc)){
				Object ret = null;
				
				if(pp.equals(PayType.Balance)){
					MAIN_USER user = this.userInfoService.getUserInfo_fromDB(uid);
					
					if(user.getU_PROFIT() >= msrc.getMRRC_FEE()){
						ret = new BalancePayInfo(msrc.getMRRC_ID(), user.getU_PROFIT(), msrc.getMRRC_FEE());
						
					}else{
						//create wechat pay by default
						ret = this.genPrePayInfo(msrc, subject, PayType.WeChat);
					}
				}else{
					ret = this.genPrePayInfo(msrc, subject, pp);
				}
				
				return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(ret), null, null);
			}
			
			return JsonUtil.createSuccessJson(false, null, "获取支付要素失败", null);

		} catch (Exception ex) {
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
	
	private PrePayInfo genPrePayInfo(MAIN_3RDSERVICE_RELIABLE_RECHARGE msrc, String subject, PayType pp) throws Exception{
		//pay amount unit is fen
		int payAmountReal = (int)(msrc.getMRRC_FEE() * 100);
		
		String qrCode = Payment.getQrCode(RechargeType.thirdPartyServiceReliable, msrc.getMRRC_ID(), pp, payAmountReal, subject);
		
		return new PrePayInfo(msrc.getMRRC_ID(), qrCode);
	}
	
	private MAIN_3RDSERVICE_RELIABLE_RECHARGE getPayInfo(String uid, Long tpsId, String rlName) throws Exception{
		MAIN_3RDSERVICE s3rd = this.thirdPartyService.get3RdServiceByTpsId(tpsId);
		
		if(s3rd == null || !uid.equals(s3rd.getU_ID()) || s3rd.getTPS_STATUS() != ThirdPartyServiceStatus.Ok.getValue()){
			throw new Exception("参数错误");
		}
		
		if(s3rd.getTPS_RELIABLE() != null && !s3rd.getTPS_RELIABLE().isEmpty()){
			throw new Exception("服务已认证");
		}
		
		MAIN_3RDSERVICE_RELIABLE reliable = this.thirdPartyService.getServiceReliableInfo(tpsId);
		if(reliable != null){
			throw new Exception("服务认证中");
		}
		
		String price = this.cacheChanger.getLocalValue(ConstString.DicKey_3rdReliableReviewPrice, null);
		if(price == null){
			throw new Exception("获取价格错误");
		}
		
		Timestamp ts = DateUtil.getCurrentTS();
		MAIN_3RDSERVICE_RELIABLE_RECHARGE rec = new MAIN_3RDSERVICE_RELIABLE_RECHARGE(
				SysTool.longUuid(), 
				uid, 
				tpsId, 
				Double.parseDouble(price), 
				PayResultType.wait.getValue(), 
				rlName,
				ts, ts);
		
		return rec;
	}
}
