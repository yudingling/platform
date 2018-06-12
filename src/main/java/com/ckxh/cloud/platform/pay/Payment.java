package com.ckxh.cloud.platform.pay;

import java.util.HashMap;
import java.util.Map;

import com.ckxh.cloud.base.filter.BaseFilter;
import com.ckxh.cloud.persistence.model.RechargeType;

public abstract class Payment extends BaseFilter implements IPayment {

	protected PayType payTp;

	private static Map<PayType, IPayment> pool = new HashMap<PayType, IPayment>();
	
	@Override
	public final void markThis() {
		pool.put(this.payTp, this);
	}
	
	public Payment(PayType payTp) {
		super();
		this.payTp = payTp;
	}
	
	/**
	 * get QR code for payment
	 * @param rechargeType
	 * @param payId business id
	 * @param amount pay amount with unit fen
	 * @param subject pay subject
	 * @return
	 * @throws Exception
	 */
	public static String getQrCode(RechargeType rechargeType, Long payId, PayType payTp, int amount, String subject) throws Exception{
		IPayment obj = pool.get(payTp);
		if(obj != null){
			String callBackUrl = getCallBackUrl(rechargeType, payTp);
			if(callBackUrl == null){
				throw new Exception("callback api was not found");
			}
			
			return obj.getQrCode(payId, amount, subject, callBackUrl);
		}else{
			throw new Exception("PayType[" + payTp.toString() +"] was not found");
		}
	}
	
	private static String getCallBackUrl(RechargeType rechargeType, PayType payTp){
		if(payTp.equals(PayType.WeChat)){
			switch(rechargeType){
				case sms:
				case image:
				case video:
					return "platformApi/open/pay/callback/wechat/resource";
				case thirdPartyService:
					return "platformApi/open/pay/callback/wechat/3rd";
				case thirdPartyServiceReliable:
					return "platformApi/open/pay/callback/wechat/3rdReliable";
			}
			
		}else if(payTp.equals(PayType.Alipay)){
			switch(rechargeType){
				case sms:
				case image:
				case video:
					return "platformApi/open/pay/callback/alipay/resource";
				case thirdPartyService:
					return "platformApi/open/pay/callback/alipay/3rd";
				case thirdPartyServiceReliable:
					return "platformApi/open/pay/callback/alipay/3rdReliable";
			}
		}
		
		return null;
	}
	
}
