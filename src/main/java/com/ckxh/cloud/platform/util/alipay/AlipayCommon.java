package com.ckxh.cloud.platform.util.alipay;

import java.util.Map;
import com.alipay.api.AlipayApiException;
import com.alipay.api.internal.util.AlipaySignature;
import com.ckxh.cloud.persistence.common.AlipayCfg;

public class AlipayCommon {

	public static boolean verify(Map<String, String> params) throws AlipayApiException {
		return AlipaySignature.rsaCheckV1(params, AlipayCfg.DicKey_aliPay_appPublicKey, "UTF-8", "RSA2");
	}
}
