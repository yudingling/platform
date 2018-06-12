package com.ckxh.cloud.platform.api.open.paycb;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.SortedMap;
import java.util.TreeMap;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.LogUtil;
import com.ckxh.cloud.persistence.common.SysTool;
import com.ckxh.cloud.persistence.common.WeChatCfg;
import com.ckxh.cloud.platform.util.CloseStream;
import com.ckxh.cloud.platform.util.weipay.PayCommonUtil;
import com.ckxh.cloud.platform.util.weipay.XMLUtil;

public abstract class WeChatCallBack extends CBGetter{
	
	protected final String done(HttpServletRequest request, HttpServletResponse response){
		try {
			SortedMap<String, String> packageParams = createSignParams(request);
			if(packageParams == null || packageParams.isEmpty()){
				throw new Exception("微信支付回调通知失败！");
			}
			
			String key = WeChatCfg.DicKey_weChat_mch_authKey;

			if (packageParams != null && !packageParams.isEmpty() && PayCommonUtil.isTenpaySign(StandardCharsets.UTF_8, packageParams, key)) {
				String resXml = "";

				// first to check return_code
				if("SUCCESS".equals(packageParams.get("return_code"))){
					//business data																
					String out_trade_no = packageParams.get("out_trade_no");
					//String total_fee = packageParams.get("total_fee");
					
					if("SUCCESS".equals(packageParams.get("result_code"))){
						this.safeWriteBack(out_trade_no, true, null);
						
						resXml = "<xml>" + "<return_code><![CDATA[SUCCESS]]></return_code>"+ "<return_msg><![CDATA[OK]]></return_msg>" + "</xml>";
					}else{
						this.safeWriteBack(out_trade_no, false, packageParams.get("err_code"));
						
						resXml = "<xml>" + "<return_code><![CDATA[FAIL]]></return_code>"+ "<return_msg><![CDATA[报文为空]]></return_msg>" + "</xml>";
					}
					
					return resXml;
				}
			}
			
			return JsonUtil.createSuccessJson(false, null, "参数错误", null);
			
		}catch(Exception ex){
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
	
	private SortedMap<String, String> createSignParams(HttpServletRequest request) {
		InputStream is = null;
		InputStreamReader isr = null;
		BufferedReader in = null;

		try {
			StringBuffer sb = new StringBuffer();
			is = request.getInputStream();
			String str;
			isr = new InputStreamReader(is, StandardCharsets.UTF_8);
			in = new BufferedReader(isr);
			while ((str = in.readLine()) != null) {
				sb.append(str);
			}

			Map<String, String> m = new HashMap<String, String>();
			m = XMLUtil.doXMLParse(sb.toString());
			// sort key nature
			SortedMap<String, String> packageParams = new TreeMap<String, String>();
			Iterator<String> it = m.keySet().iterator();
			// remove null
			while (it.hasNext()) {
				String parameter = (String) it.next();
				String parameterValue = m.get(parameter);
				String v = "";
				if (null != parameterValue) {
					v = parameterValue.trim();
				}
				packageParams.put(parameter, v);
			}
			return packageParams;
		} catch (Exception e) {
			LogUtil.error(e);
		} finally {
			CloseStream.close(is, isr, in);
		}
		return null;
	}
}
