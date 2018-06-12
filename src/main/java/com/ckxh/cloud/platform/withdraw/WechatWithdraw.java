package com.ckxh.cloud.platform.withdraw;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.SortedMap;
import java.util.TreeMap;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import com.ckxh.cloud.base.util.DoubleUtil;
import com.ckxh.cloud.persistence.common.WeChatCfg;
import com.ckxh.cloud.persistence.db.model.MAIN_WITHDRAW_ACCOUNT;
import com.ckxh.cloud.persistence.db.user.service.UserInfoService;
import com.ckxh.cloud.platform.util.weipay.HttpUtil;
import com.ckxh.cloud.platform.util.weipay.PayCommonUtil;
import com.ckxh.cloud.platform.util.weipay.XMLUtil;

@Component
public class WechatWithdraw extends Withdraw {
	
	@Autowired
	private UserInfoService userInfoService;
	
	public WechatWithdraw(){
		super(WithdrawType.WeChat);
	}
	
	@Override
	public WDResult accountLegal(MAIN_WITHDRAW_ACCOUNT account) {
		if(this.userInfoService.isAppBindExist(account.getU_ID(), account.getWDA_AID())){
			return new WDResult(true, null);
		}else{
			return new WDResult(false, "该微信用户未绑定至公众号");
		}
	}
	
	@Override
	public double getAvailAmount(double amount) {
		int val = (int)(amount * 100);
		if(val >= 100){
			return DoubleUtil.div(val, 100, 2);
			
		}else{
			return -1;
		}
	}
	
	@Override
	public WDResult doWithdraw(MAIN_WITHDRAW_ACCOUNT account, double amount, Long wdId) throws Exception {
		SortedMap<String, String> params = new TreeMap<String, String>();
		params.put("mch_appid", WeChatCfg.DicKey_weChat_appId);
		params.put("mchid", WeChatCfg.DicKey_weChat_mch_id);
		params.put("nonce_str", PayCommonUtil.getNonceString());
		params.put("partner_trade_no", wdId + "");
		params.put("openid", account.getWDA_AID());
		params.put("check_name", "FORCE_CHECK");
		params.put("re_user_name", account.getWDA_ANM());
		params.put("amount", ((long) DoubleUtil.multi(amount, 100))  + "");  //unit fen
		params.put("desc", "用户提款");
		params.put("spbill_create_ip", WeChatCfg.DicKey_weChat_mch_createIp);
		
		
		String sign = PayCommonUtil.createSign(StandardCharsets.UTF_8, params, WeChatCfg.DicKey_weChat_mch_authKey);
		params.put("sign", sign);

		String requestXML = PayCommonUtil.getRequestXmlTransparent(params);
		String resXml = HttpUtil.postDataSSL(WeChatCfg.DicKey_weChat_transfers, requestXML);
		if(resXml == null){
			throw new Exception("提款失败");
		}
		
		Map<String, String> map = XMLUtil.doXMLParse(resXml);
		
		if("SUCCESS".equals(map.get("return_code"))){
			if("SUCCESS".equals(map.get("result_code"))){
				return new WDResult(true, null);
			}else{
				String err_code_des = map.get("err_code_des");
				return new WDResult(false, err_code_des == null ? "提款失败" : err_code_des);
			}
		} else {
			String returnMsg = map.get("return_msg");
			return new WDResult(false, returnMsg == null ? "提款失败" : returnMsg);
		}
	}
}
