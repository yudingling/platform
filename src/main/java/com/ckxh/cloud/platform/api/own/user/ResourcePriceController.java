package com.ckxh.cloud.platform.api.own.user;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import com.ckxh.cloud.base.util.ConstString;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.persistence.common.CacheChanger;
import com.ckxh.cloud.persistence.model.RechargeType;

@Scope("singleton")
@Controller
@RequestMapping("/own/user/normal/resourcePrice")
public class ResourcePriceController {
	@Autowired
	private CacheChanger cacheChanger;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String get(@RequestParam String resourceTp, HttpServletRequest request, HttpServletResponse response){
		try{
			if(resourceTp == null || resourceTp.length() == 0){
				throw new Exception("参数错误");
			}
			
			RechargeType resTP = RechargeType.valueOf(resourceTp);
			if(resTP == null){
				throw new Exception("参数错误");
			}
			
			String price = null;
			switch(resTP){
				case sms:
					price = this.cacheChanger.getLocalValue(ConstString.DicKey_resPrice_sms, null);
					break;
				case image:
					price = this.cacheChanger.getLocalValue(ConstString.DicKey_resPrice_iotImg, null);
					break;
				case video:
					price = this.cacheChanger.getLocalValue(ConstString.DicKey_resPrice_iotVideo, null);
					break;
				default:
					break;
			}
			
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
