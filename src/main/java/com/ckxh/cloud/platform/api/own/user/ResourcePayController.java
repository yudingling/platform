package com.ckxh.cloud.platform.api.own.user;

import java.io.IOException;
import java.sql.Timestamp;
import java.util.Calendar;

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
import com.ckxh.cloud.base.util.ConstString;
import com.ckxh.cloud.base.util.DateUtil;
import com.ckxh.cloud.base.util.DoubleUtil;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.persistence.common.CacheChanger;
import com.ckxh.cloud.persistence.common.SysTool;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.model.MAIN_USER;
import com.ckxh.cloud.persistence.db.model.MAIN_USER_RECHARGE;
import com.ckxh.cloud.persistence.db.model.MAIN_USER_RECHARGE_VIDEO;
import com.ckxh.cloud.persistence.db.user.service.UserInfoService;
import com.ckxh.cloud.persistence.model.PayResultType;
import com.ckxh.cloud.persistence.model.RechargeType;
import com.ckxh.cloud.platform.model.BalancePayInfo;
import com.ckxh.cloud.platform.model.PrePayInfo;
import com.ckxh.cloud.platform.pay.PayType;
import com.ckxh.cloud.platform.pay.Payment;

@Scope("singleton")
@Controller
@RequestMapping("/own/user/normal/resourcePay")
@AuthPathOnBind("get:/platformApi/own/user/normal/#")
public class ResourcePayController {
	@Autowired
	private CacheChanger cacheChanger;
	@Autowired
	private UserInfoService userInfoService;
	
	@ResponseBody
	@RequestMapping(method = RequestMethod.POST)
	public String post(@RequestParam String payTp, @RequestParam String resourceTp, @RequestParam String count, @RequestParam String subject, 
			HttpServletRequest request, HttpServletResponse response) throws IOException {
		try {
			if(payTp == null || payTp.length() == 0 || resourceTp == null || resourceTp.length() == 0 || count == null || count.length() == 0 || subject == null || subject.length() == 0){
				throw new Exception("参数错误");
			}
			
			PayType pp = PayType.valueOf(payTp);
			if(pp == null){
				throw new Exception("参数错误");
			}
			
			RechargeType resTP = RechargeType.valueOf(resourceTp);
			if(resTP == null){
				throw new Exception("参数错误");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			Object[] payInfoArrs = this.getPayInfo(uid, resTP, count);
			MAIN_USER_RECHARGE payInfo = (MAIN_USER_RECHARGE) payInfoArrs[0];
			Object extendPayInfo = payInfoArrs[1];
			
			if(this.userInfoService.saveResourceRecharge(payInfo, extendPayInfo)){
				Object ret = null;
				
				if(pp.equals(PayType.Balance)){
					MAIN_USER user = this.userInfoService.getUserInfo_fromDB(uid);
					
					if(user.getU_PROFIT() >= payInfo.getRC_FEE()){
						ret = new BalancePayInfo(payInfo.getRC_ID(), user.getU_PROFIT(), payInfo.getRC_FEE());
						
					}else{
						//create wechat pay by default
						ret = this.genPrePayInfo(resTP, payInfo, subject, PayType.WeChat);
					}
				}else{
					ret = this.genPrePayInfo(resTP, payInfo, subject, pp);
				}
				
				return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(ret), null, null);
			}
			
			return JsonUtil.createSuccessJson(false, null, "获取支付要素失败", null);

		} catch (Exception ex) {
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
	
	private PrePayInfo genPrePayInfo(RechargeType resTP, MAIN_USER_RECHARGE payInfo, String subject, PayType pp) throws Exception{
		//pay amount unit is fen
		int payAmountReal = (int)(payInfo.getRC_FEE() * 100);
		
		String qrCode = Payment.getQrCode(resTP, payInfo.getRC_ID(), pp, payAmountReal, subject);
		
		return new PrePayInfo(payInfo.getRC_ID(), qrCode);
	}
	
	private double getPrice(RechargeType resTP) throws Exception{
		String price = null;
		switch(resTP){
			case sms:
				price = this.cacheChanger.getLocalValue(ConstString.DicKey_resPrice_sms, null);
				break;
			case image:
				price = this.cacheChanger.getLocalValue(ConstString.DicKey_resPrice_iotImg, null);
				break;
			case video:
				price = this.cacheChanger.getLocalValue(ConstString.DicKey_resPrice_iotVideo, null);
				break;
			default:
				break;
		}
		
		if(price == null){
			throw new Exception("获取价格错误");
		}
		
		return Double.parseDouble(price);
	}
	
	private Object[] getPayInfo(String uid, RechargeType resTP, String count) throws Exception{
		double price = this.getPrice(resTP);
		Timestamp ts = DateUtil.getCurrentTS();
		
		double fee = 0;
		Integer countVal = null;
		Object extendObj = null;
		Long rcId = SysTool.longUuid();
		
		switch(resTP){
			case sms:
				countVal = Integer.parseInt(count);
				if(countVal < 100){
					throw new Exception("参数错误");
				}
				fee = Common.toFixed(DoubleUtil.multi(price, countVal), 2);
				break;
				
			case image:
				countVal = Integer.parseInt(count);
				if(countVal < 1000){
					throw new Exception("参数错误");
				}
				fee = Common.toFixed(DoubleUtil.multi(price, countVal), 2);
				break;
				
			case video:
				String[] countArr = count.split(",");
				if(countArr.length != 2){
					throw new Exception("参数错误");
				}
				int videoCount = Integer.parseInt(countArr[0]);
				int videoPeriod = Integer.parseInt(countArr[1]);
				
				if(videoCount < 1 || videoPeriod < 1){
					throw new Exception("参数错误");
				}
				fee = Common.toFixed(DoubleUtil.multi(price, videoCount * videoPeriod), 2);
				
				Timestamp endTs = new Timestamp(DateUtil.add(ts, Calendar.MONTH, videoPeriod).getTime());
				extendObj = new MAIN_USER_RECHARGE_VIDEO(rcId, videoCount, videoPeriod, endTs, ts, ts);
				break;
				
			default:
				throw new Exception("参数错误");
		}
		
		MAIN_USER_RECHARGE rec = new MAIN_USER_RECHARGE(
				rcId, 
				uid, 
				resTP.getValue(), 
				fee, 
				countVal, 
				PayResultType.wait.getValue(), 
				ts, ts);
		
		return new Object[]{rec, extendObj};
	}
}
