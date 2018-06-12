package com.ckxh.cloud.platform.api.open.paycb;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

import com.ckxh.cloud.base.daemon.IWriteBack;
import com.ckxh.cloud.platform.payCallBack.ThirdPartyServiceReliableCB;

@Scope("singleton")
@Controller
@RequestMapping("/open/pay/callback/alipay/3rdReliable")
public class AliPay_3rdReliableController extends AlipayCallBack {
	@Autowired
	private ThirdPartyServiceReliableCB thirdPartyServiceReliableCB;
	
	@ResponseBody
	@RequestMapping(method = RequestMethod.POST)
	public String POST(String out_trade_no, String trade_no, String trade_status, HttpServletRequest request, HttpServletResponse response){
		return this.done(out_trade_no, trade_no, trade_status, request, response);
	}

	@Override
	protected IWriteBack getWriteBack() {
		return this.thirdPartyServiceReliableCB;
	}
}
