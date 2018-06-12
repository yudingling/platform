package com.ckxh.cloud.platform.api.open.paycb;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

import com.ckxh.cloud.base.annotation.AuthPathOnBind;
import com.ckxh.cloud.base.daemon.IWriteBack;
import com.ckxh.cloud.platform.payCallBack.ResourceCB;

@Scope("singleton")
@Controller
@RequestMapping("/open/pay/callback/wechat/resource")
@AuthPathOnBind
public class Wechat_resourceController extends WeChatCallBack {
	@Autowired
	private ResourceCB resourceCB;
	
	@ResponseBody
	@RequestMapping(method = RequestMethod.POST)
	public String POST(HttpServletRequest request, HttpServletResponse response){
		return this.done(request, response);
	}
	
	@Override
	protected IWriteBack getWriteBack() {
		return this.resourceCB;
	}
}
