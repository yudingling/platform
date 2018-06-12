package com.ckxh.cloud.platform.api.open;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import com.ckxh.cloud.platform.util.wechat.SignUtil;

/**
 * see https://mp.weixin.qq.com/wiki?t=resource/res_main&id=mp1421135319
 */
@Scope("singleton")
@Controller
@RequestMapping("/open/wechat/devSignature")
public class WechatDevelopCheckSign {
	@ResponseBody
	@RequestMapping(method = RequestMethod.GET)
	public String get(@RequestParam String signature, @RequestParam String timestamp, @RequestParam String nonce, @RequestParam String echostr, 
			HttpServletRequest request, HttpServletResponse response) {
		if(SignUtil.CheckSignature(signature, timestamp, nonce)){
			return echostr;
		}else{
			return "";
		}
	}
}
