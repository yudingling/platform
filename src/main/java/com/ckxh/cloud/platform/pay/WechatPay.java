package com.ckxh.cloud.platform.pay;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.SortedMap;
import java.util.TreeMap;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import com.ckxh.cloud.base.util.ConstString;
import com.ckxh.cloud.persistence.common.CacheChanger;
import com.ckxh.cloud.persistence.common.WeChatCfg;
import com.ckxh.cloud.platform.util.weipay.HttpUtil;
import com.ckxh.cloud.platform.util.weipay.PayCommonUtil;
import com.ckxh.cloud.platform.util.weipay.XMLUtil;

@Component
public class WechatPay extends Payment {

	@Autowired
	private CacheChanger cacheChanger;

	public WechatPay() {
		super(PayType.WeChat);
	}

	@Override
	public String getQrCode(Long payId, int amount, String subject, String callBackApiUrl) throws Exception {
		SortedMap<String, String> packageParams = new TreeMap<String, String>();
		packageParams.put("body", subject);
		packageParams.put("out_trade_no", payId + "");
		String newpayamount = Integer.toString((int) amount);
		packageParams.put("total_fee", newpayamount);
		packageParams.put("appid", WeChatCfg.DicKey_weChat_appId);
		packageParams.put("mch_id", WeChatCfg.DicKey_weChat_mch_id);
		packageParams.put("nonce_str", PayCommonUtil.getNonceString());
		packageParams.put("spbill_create_ip", WeChatCfg.DicKey_weChat_mch_createIp);
		packageParams.put("notify_url", this.getCallBackUrl(callBackApiUrl));
		packageParams.put("trade_type", "NATIVE");
		
		String sign = PayCommonUtil.createSign(StandardCharsets.UTF_8, packageParams, WeChatCfg.DicKey_weChat_mch_authKey);
		packageParams.put("sign", sign);

		String requestXML = PayCommonUtil.getRequestXml(packageParams);
		String resXml = HttpUtil.postData(WeChatCfg.DicKey_weChat_unified_order, requestXML);
		if(resXml == null){
			throw new Exception("统一下单通信失败！");
		}
		
		Map<String, String> map = XMLUtil.doXMLParse(resXml);
		String return_code = map.get("return_code");
		
		if ("SUCCESS".equals(return_code)) {
			String result_code = map.get("result_code");
			if ("SUCCESS".equals(result_code)) {
				return map.get("code_url");
			} else {
				throw new Exception("统一下单业务失败！");
			}
		} else {
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
