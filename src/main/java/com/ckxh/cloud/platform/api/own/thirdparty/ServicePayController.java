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
import com.ckxh.cloud.base.util.Common;
import com.ckxh.cloud.base.util.DateUtil;
import com.ckxh.cloud.base.util.DoubleUtil;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.persistence.common.SysTool;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.model.MAIN_3RDSERVICE_FEE;
import com.ckxh.cloud.persistence.db.model.MAIN_3RDSERVICE_RECHARGE;
import com.ckxh.cloud.persistence.db.model.MAIN_USER;
import com.ckxh.cloud.persistence.db.sys.service.ThirdPartyService;
import com.ckxh.cloud.persistence.db.user.service.UserInfoService;
import com.ckxh.cloud.persistence.model.PayResultType;
import com.ckxh.cloud.persistence.model.RechargeType;
import com.ckxh.cloud.persistence.model.ThirdPartyServiceFeeType;
import com.ckxh.cloud.platform.model.BalancePayInfo;
import com.ckxh.cloud.platform.model.PrePayInfo;
import com.ckxh.cloud.platform.pay.PayType;
import com.ckxh.cloud.platform.pay.Payment;

@Scope("singleton")
@Controller
@RequestMapping("/own/thirdparty/normal/pay")
@AuthPathOnBind("get:/platformApi/own/thirdparty/normal/#")
public class ServicePayController {
	@Autowired
	private ThirdPartyService thirdPartyService;
	@Autowired
	private UserInfoService userInfoService;
	
	@ResponseBody
	@RequestMapping(method = RequestMethod.POST)
	public String post(@RequestParam String payTp, @RequestParam Long uspId, @RequestParam Integer count, @RequestParam String subject, 
			HttpServletRequest request, HttpServletResponse response) throws IOException {
		try {
			if(payTp == null || payTp.length() == 0 || uspId == null || count == null || count.intValue() == 0 || subject == null || subject.length() == 0){
				throw new Exception("参数错误");
			}
			
			PayType pp = PayType.valueOf(payTp);
			if(pp == null){
				throw new Exception("参数错误");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			MAIN_3RDSERVICE_RECHARGE msrc = this.getPayInfo(uid, uspId, count.intValue());
			
			if(this.thirdPartyService.save3rdRecharge(msrc)){
				Object ret = null;
				
				if(pp.equals(PayType.Balance)){
					MAIN_USER user = this.userInfoService.getUserInfo_fromDB(uid);
					
					if(user.getU_PROFIT() >= msrc.getMSRC_FEE()){
						ret = new BalancePayInfo(msrc.getMSRC_ID(), user.getU_PROFIT(), msrc.getMSRC_FEE());
						
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
	
	private PrePayInfo genPrePayInfo(MAIN_3RDSERVICE_RECHARGE msrc, String subject, PayType pp) throws Exception{
		//pay amount unit is fen
		int payAmountReal = (int)(msrc.getMSRC_FEE() * 100);
		
		String qrCode = Payment.getQrCode(RechargeType.thirdPartyService, msrc.getMSRC_ID(), pp, payAmountReal, subject);
		
		return new PrePayInfo(msrc.getMSRC_ID(), qrCode);
	}
	
	private MAIN_3RDSERVICE_RECHARGE getPayInfo(String uid, Long uspId, int count) throws Exception{
		MAIN_3RDSERVICE_FEE fee = this.thirdPartyService.get3RdServiceFee(uid, uspId);
		if(fee == null){
			throw new Exception("参数错误");
		}
		
		MAIN_3RDSERVICE_RECHARGE msrc = null;
		Timestamp ts = DateUtil.getCurrentTS();
		
		if(fee.getFEE_TP() == ThirdPartyServiceFeeType.ByCount.getValue()){
			int multi = count / fee.getFEE_COUNT_NUM();
			int rem = count % fee.getFEE_COUNT_NUM();
			if(rem != 0 || multi <= 0){
				throw new Exception("参数错误");
			}
			
			msrc = new MAIN_3RDSERVICE_RECHARGE(
					SysTool.longUuid(), 
					uid, 
					uspId, 
					fee.getTPS_ID(), 
					Common.toFixed(DoubleUtil.multi(multi, fee.getFEE_COUNT_BASE()), 2),
					count, 
					fee.getFEE_COUNT_NUM(), 
					fee.getFEE_COUNT_BASE(), 
					PayResultType.wait.getValue(), 
					ts, ts);
			
		}else if(fee.getFEE_TP() == ThirdPartyServiceFeeType.ByTime.getValue()){
			int multi = count / fee.getFEE_TIME_PERIOD();
			int rem = count % fee.getFEE_TIME_PERIOD();
			if(rem != 0 || multi <= 0){
				throw new Exception("参数错误");
			}
			
			msrc = new MAIN_3RDSERVICE_RECHARGE(
					SysTool.longUuid(), 
					uid, 
					uspId, 
					fee.getTPS_ID(), 
					Common.toFixed(DoubleUtil.multi(multi, fee.getFEE_TIME_BASE()), 2), 
					count, 
					fee.getFEE_TIME_PERIOD(), 
					fee.getFEE_TIME_BASE(), 
					PayResultType.wait.getValue(), 
					ts, ts);
			
		}else{
			throw new Exception("参数错误");
		}
		
		if(msrc == null || msrc.getMSRC_FEE() <= 0){
			throw new Exception("参数错误");
		}
		
		return msrc;
	}
}
