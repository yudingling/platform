package com.ckxh.cloud.platform.pay;

import java.util.HashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import com.alipay.api.AlipayClient;
import com.alipay.api.DefaultAlipayClient;
import com.alipay.api.request.AlipayTradePrecreateRequest;
import com.alipay.api.response.AlipayTradePrecreateResponse;
import com.ckxh.cloud.base.util.ConstString;
import com.ckxh.cloud.base.util.DoubleUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.persistence.common.AlipayCfg;
import com.ckxh.cloud.persistence.common.CacheChanger;

@Component
public class AliPay extends Payment {
	@Autowired
	private CacheChanger cacheChanger;

	public AliPay() {
		super(PayType.Alipay);
	}

	@Override
	public String getQrCode(Long payId, int amount, String subject, String callBackApiUrl) throws Exception {
		AlipayClient alipayClient = new DefaultAlipayClient(
				AlipayCfg.DicKey_aliPay_gateway_open, 
				AlipayCfg.DicKey_aliPay_appId, 
				AlipayCfg.DicKey_aliPay_appPrivateKey, 
				"json", 
				"UTF-8", 
				AlipayCfg.DicKey_aliPay_appPublicKey, 
				"RSA2");
		
		AlipayTradePrecreateRequest request = new AlipayTradePrecreateRequest();
		request.setNotifyUrl(this.getCallBackUrl(callBackApiUrl));
		
		Map<String, Object> params = new HashMap<String, Object>();
		params.put("out_trade_no", payId + "");
		params.put("total_amount", DoubleUtil.div(amount, 100, 2));
		params.put("subject", subject);
		
		request.setBizContent(MsgPackUtil.serialize2Str(params));
		
		AlipayTradePrecreateResponse response = alipayClient.execute(request);
		if(response.isSuccess()){
			return response.getQrCode();
		}else{
			throw new Exception("统一下单通信失败！");
		}
	}

	private String getCallBackUrl(String callBackApiUrl) throws Exception {
		String serverNM = this.cacheChanger.getLocalValue(ConstString.DicKey_platformAppServerNM, null);
		if (serverNM == null) {
			throw new Exception("DicKey_platformAppServerNM 获取错误");
		}
		
		return serverNM + callBackApiUrl;
	}
}
