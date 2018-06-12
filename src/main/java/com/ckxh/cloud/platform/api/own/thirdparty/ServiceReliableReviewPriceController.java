package com.ckxh.cloud.platform.api.own.thirdparty;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import com.ckxh.cloud.base.util.ConstString;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.persistence.common.CacheChanger;

@Scope("singleton")
@Controller
@RequestMapping("/own/thirdparty/normal/reliablePrice")
public class ServiceReliableReviewPriceController {
	@Autowired
	private CacheChanger cacheChanger;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String get(HttpServletRequest request, HttpServletResponse response){
		try{
			String price = this.cacheChanger.getLocalValue(ConstString.DicKey_3rdReliableReviewPrice, null);
			
			if(price == null){
				throw new Exception("获取价格错误");
			}
			
			return JsonUtil.createSuccessJson(true, Double.parseDouble(price) + "", null, null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
