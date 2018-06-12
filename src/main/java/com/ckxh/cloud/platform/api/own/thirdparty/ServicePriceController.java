package com.ckxh.cloud.platform.api.own.thirdparty;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.ckxh.cloud.base.util.Common;
import com.ckxh.cloud.base.util.DoubleUtil;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.persistence.db.model.MAIN_3RDSERVICE_FEE;
import com.ckxh.cloud.persistence.db.sys.service.ThirdPartyService;
import com.ckxh.cloud.persistence.model.ThirdPartyServiceFeeType;
import com.ckxh.cloud.platform.model.PriceSel;

@Scope("singleton")
@Controller
@RequestMapping("/own/thirdparty/normal/price")
public class ServicePriceController {
	@Autowired
	private ThirdPartyService thirdPartyService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String get(@RequestParam Long tpsId, HttpServletRequest request, HttpServletResponse response) throws IOException{
		try {
			if(tpsId == null){
				throw new Exception("参数错误");
			}
			
			MAIN_3RDSERVICE_FEE fee = this.thirdPartyService.get3RdServiceFee(tpsId);
			if(fee == null){
				throw new Exception("参数错误");
			}
			
			List<PriceSel> retList = new ArrayList<PriceSel>();
			
			if(fee.getFEE_TP() == ThirdPartyServiceFeeType.ByCount.getValue()){
				retList.add(this.genCountPriceSel(1, fee));
				retList.add(this.genCountPriceSel(3, fee));
				retList.add(this.genCountPriceSel(5, fee));
				retList.add(this.genCountPriceSel(10, fee));
				
			}else if(fee.getFEE_TP() == ThirdPartyServiceFeeType.ByTime.getValue()){
				this.setTimePriceSel(retList, fee);
			}
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(retList), null, null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
	
	private void setTimePriceSel(List<PriceSel> selList, MAIN_3RDSERVICE_FEE fee){
		String baseName = this.getBaseTimeName(fee.getFEE_TIME_PERIOD());
		
		switch(baseName){
		case "天":
			selList.add(this.genTimePriceSel_day(1, fee));
			selList.add(this.genTimePriceSel_day(3, fee));
			selList.add(this.genTimePriceSel_day(5, fee));
			selList.add(this.genTimePriceSel_day(10, fee));
			break;
			
		case "月":
			selList.add(this.genTimePriceSel_cus(1, fee, "1个月"));
			selList.add(this.genTimePriceSel_cus(3, fee, "3个月"));
			selList.add(this.genTimePriceSel_cus(6, fee, "半年"));
			selList.add(this.genTimePriceSel_cus(12, fee, "1年"));
			break;
			
		case "半年":
			selList.add(this.genTimePriceSel_cus(1, fee, "半年"));
			selList.add(this.genTimePriceSel_cus(2, fee, "1年"));
			selList.add(this.genTimePriceSel_cus(6, fee, "3年"));
			selList.add(this.genTimePriceSel_cus(10, fee, "5年"));
			break;
			
		case "年":
			selList.add(this.genTimePriceSel_cus(1, fee, "1年"));
			selList.add(this.genTimePriceSel_cus(3, fee, "3年"));
			selList.add(this.genTimePriceSel_cus(5, fee, "5年"));
			selList.add(this.genTimePriceSel_cus(10, fee, "10年"));
			break;
		}
	}
	
	private PriceSel genCountPriceSel(int multiple, MAIN_3RDSERVICE_FEE fee){
		long count = fee.getFEE_COUNT_NUM() * multiple;
		double wan = count / 10000;
		long wanEx = count % 10000;
		String countStr = (wan >= 1 && wanEx == 0) ? ((int)wan + "万次") : (count + "次");
		
		PriceSel sel = new PriceSel(countStr, count + "");
		sel.setCount(count);
		sel.setFee(Common.toFixed(DoubleUtil.multi(fee.getFEE_COUNT_BASE(), multiple), 2));
		
		return sel;
	}
	
	private PriceSel genTimePriceSel_day(int multiple, MAIN_3RDSERVICE_FEE fee){
		PriceSel sel = new PriceSel(fee.getFEE_TIME_PERIOD() * multiple + "天", fee.getFEE_TIME_PERIOD() * multiple + "");
		sel.setCount(fee.getFEE_TIME_PERIOD() * multiple);
		sel.setFee(Common.toFixed(DoubleUtil.multi(fee.getFEE_TIME_BASE(), multiple), 2));
		
		return sel;
	}
	
	private PriceSel genTimePriceSel_cus(int multiple, MAIN_3RDSERVICE_FEE fee, String name){
		PriceSel sel = new PriceSel(name, fee.getFEE_TIME_PERIOD() * multiple + "");
		sel.setCount(fee.getFEE_TIME_PERIOD() * multiple);
		sel.setFee(Common.toFixed(DoubleUtil.multi(fee.getFEE_TIME_BASE(), multiple), 2));
		
		return sel;
	}
	
	private String getBaseTimeName(int dayCount){
		int tmp = dayCount / 30, tmp1 = dayCount % 30;
		if(tmp == 1 && tmp1 == 0){
			return "月";
		}
		
		tmp = dayCount / 180;
		tmp1 = dayCount % 180;
		if(tmp == 1 && tmp1 == 0){
			return "半年";
		}
		
		tmp = dayCount / 360;
		tmp1 = dayCount % 360;
		if(tmp == 1 && tmp1 == 0){
			return "年";
		}
		
		return "天";
	}
}
