package com.ckxh.cloud.platform.withdraw;

import java.util.HashMap;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.alipay.api.AlipayClient;
import com.alipay.api.DefaultAlipayClient;
import com.alipay.api.request.AlipayFundTransToaccountTransferRequest;
import com.alipay.api.response.AlipayFundTransToaccountTransferResponse;
import com.ckxh.cloud.base.util.DoubleUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.persistence.common.AlipayCfg;
import com.ckxh.cloud.persistence.db.model.MAIN_WITHDRAW_ACCOUNT;

@Component
public class AlipayWithdraw extends Withdraw {

	public AlipayWithdraw(){
		super(WithdrawType.Alipay);
	}
	
	@Override
	public WDResult accountLegal(MAIN_WITHDRAW_ACCOUNT account) {
		return new WDResult(true, null);
	}
	
	@Override
	public double getAvailAmount(double amount) {
		int val = (int)(amount * 100);
		if(val >= 10){
			return DoubleUtil.div(val, 100, 2);
			
		}else{
			return -1;
		}
	}
	
	@Override
	public WDResult doWithdraw(MAIN_WITHDRAW_ACCOUNT account, double amount, Long wdId) throws Exception {
		AlipayClient alipayClient = new DefaultAlipayClient(
				AlipayCfg.DicKey_aliPay_gateway_open, 
				AlipayCfg.DicKey_aliPay_appId, 
				AlipayCfg.DicKey_aliPay_appPrivateKey, 
				"json", 
				"UTF-8", 
				AlipayCfg.DicKey_aliPay_appPublicKey, 
				"RSA2");
		
		AlipayFundTransToaccountTransferRequest request = new AlipayFundTransToaccountTransferRequest();
		
		Map<String, String> params = new HashMap<String, String>();
		params.put("out_biz_no", wdId + "");
		params.put("payee_type", "ALIPAY_LOGONID");
		params.put("payee_account", account.getWDA_AID());
		params.put("amount", amount + "");
		params.put("payer_show_name", AlipayCfg.DicKey_aliPay_withdraw_desc);
		params.put("payee_real_name", account.getWDA_ANM());
		params.put("remark", "用户提款");
		
		request.setBizContent(MsgPackUtil.serialize2Str(params));
		
		AlipayFundTransToaccountTransferResponse response = alipayClient.execute(request);
		if(response.isSuccess()){
			return new WDResult(true, null);
			
		}else{
			return new WDResult(false, response.getMsg());
		}
	}
}
