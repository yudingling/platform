package com.ckxh.cloud.platform.util.weipay;

import java.nio.charset.Charset;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Iterator;
import java.util.Map.Entry;
import java.util.SortedMap;

public class PayCommonUtil {
	
	public static boolean isTenpaySign(Charset charset, SortedMap<String, String> packageParams,String API_KEY) {
		StringBuffer sb = new StringBuffer();
		
		Iterator<Entry<String, String>> it = packageParams.entrySet().iterator();
		while (it.hasNext()) {
			Entry<String, String> entry = it.next();
			String k = entry.getKey();
			String v = entry.getValue();
			
			if (!"sign".equals(k) && null != v && v.length() > 0) {
				sb.append(k + "=" + v + "&");
			}
		}

		sb.append("key=" + API_KEY);
		String mysign = MD5Util.MD5Encode(sb.toString(), charset).toLowerCase();
		String tenpaySign = ((String) packageParams.get("sign")).toLowerCase();	
		return tenpaySign.equals(mysign);
	}
	
	public static String createSign(Charset charset, SortedMap<String, String> packageParams, String API_KEY) {
		StringBuffer sb = new StringBuffer();
		
		Iterator<Entry<String, String>> it = packageParams.entrySet().iterator();
		while (it.hasNext()) {
			Entry<String, String> entry = it.next();
			String k = entry.getKey();
			String v = entry.getValue();
			
			if (v != null && v.length() > 0 && !"sign".equals(k) && !"key".equals(k)) {
				sb.append(k + "=" + v + "&");
			}
		}
		sb.append("key=" + API_KEY);
		String sign = MD5Util.MD5Encode(sb.toString(), charset).toUpperCase();
		return sign;
	}
	
	public static String getRequestXml(SortedMap<String, String> parameters) {
		StringBuffer sb = new StringBuffer();
		sb.append("<xml>");
		
		Iterator<Entry<String, String>> it = parameters.entrySet().iterator();
		while (it.hasNext()) {
			Entry<String, String> entry = it.next();
			String k = entry.getKey();
			String v = entry.getValue();
			
			if ("attach".equalsIgnoreCase(k) || "body".equalsIgnoreCase(k) || "sign".equalsIgnoreCase(k)) {
				sb.append("<" + k + ">" + "<![CDATA[" + v + "]]></" + k + ">");
			} else {
				sb.append("<" + k + ">" + v + "</" + k + ">");
			}
		}
		sb.append("</xml>");
		
		return sb.toString();
	}
	
	public static String getRequestXmlTransparent(SortedMap<String, String> params) {
		StringBuffer sb = new StringBuffer();
		sb.append("<xml>");
		
		Iterator<Entry<String, String>> it = params.entrySet().iterator();
		while (it.hasNext()) {
			Entry<String, String> entry = it.next();
			
			sb.append("<" + entry.getKey() + ">" + entry.getValue() + "</" + entry.getKey() + ">");
		}
		sb.append("</xml>");
		
		return sb.toString();
	}
	
	public static String getNonceString(){
		SimpleDateFormat outFormat = new SimpleDateFormat("HHmmssSSS");
		String s = outFormat.format(new Date());
		
		double random = Math.random();
		if (random < 0.1) {
			random = random + 0.1;
		}
		int  d = (int) ((random * 10000));
		
		return s + d;
	}
}
