package com.ckxh.cloud.platform.api.open.paycb;

import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.LogUtil;
import com.ckxh.cloud.persistence.common.SysTool;
import com.ckxh.cloud.platform.util.alipay.AlipayCommon;

public abstract class AlipayCallBack extends CBGetter{
	
	public String done(String out_trade_no, String trade_no, String trade_status, HttpServletRequest request, HttpServletResponse response){
		try{
			Map<String, String> params = new HashMap<String, String>();
			Map<?, ?> requestParams = request.getParameterMap();
			for (Iterator<?> iter = requestParams.keySet().iterator(); iter.hasNext();) {
				String name = (String) iter.next();
				String[] values = (String[]) requestParams.get(name);
				String valueStr = "";
				for (int i = 0; i < values.length; i++) {
					valueStr = (i == values.length - 1) ? valueStr + values[i] : valueStr + values[i] + ",";
				}
				params.put(name, valueStr);
			}
			boolean result = AlipayCommon.verify(params);
			if(result){
				if (trade_status.equals("TRADE_SUCCESS") || trade_status.equals("TRADE_FINISHED")) {
					this.safeWriteBack(out_trade_no, true, null);
				}else{
					this.safeWriteBack(out_trade_no, false, "支付失败");
				}
				
				//aliyun required
				return "success";
			}
			
			return JsonUtil.createSuccessJson(false, null, "参数错误", null);
			
		}catch (Exception e){
			return JsonUtil.createSuccessJson(false, null, "参数错误", null);
		}
	}
	
	private void safeWriteBack(String id, boolean success, String errMsg){
		try{
			this.wb.writeBack(SysTool.longUuidInLocal(), new Object[]{id, success, errMsg});
		}catch(Exception ex){
			LogUtil.error(ex);
		}
	}
}
