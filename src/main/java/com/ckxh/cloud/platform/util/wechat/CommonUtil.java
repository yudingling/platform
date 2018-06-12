package com.ckxh.cloud.platform.util.wechat;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.URL;
import java.nio.charset.StandardCharsets;

import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSocketFactory;
import javax.net.ssl.TrustManager;

import net.sf.json.JSONObject;

import com.ckxh.cloud.base.util.LogUtil;
import com.ckxh.cloud.base.redis.JedisHelper;
import com.ckxh.cloud.base.util.ConstString;
import com.ckxh.cloud.persistence.common.WeChatCfg;
import com.ckxh.cloud.platform.util.CloseStream;

public class CommonUtil {
	public static JSONObject httpsRequest(String requestUrl, String requestMethod, String outputStr) {
		JSONObject jsonObject = null;
		InputStream is = null;
		InputStreamReader isr = null;
		BufferedReader in = null;
		OutputStream os = null;
		HttpsURLConnection conn = null;
		try {
			TrustManager[] tm = { new MyX509TrustManager() };
			SSLContext sslContext = SSLContext.getInstance("SSL", "SunJSSE");
			sslContext.init(null, tm, new java.security.SecureRandom());
			SSLSocketFactory ssf = sslContext.getSocketFactory();
			URL url = new URL(requestUrl);

			conn = (HttpsURLConnection) url.openConnection();
			conn.setSSLSocketFactory(ssf);
			conn.setDoOutput(true);
			conn.setDoInput(true);
			conn.setUseCaches(false);
			conn.setConnectTimeout(10000);
			conn.setReadTimeout(5000);
			conn.setRequestMethod(requestMethod);

			if (null != outputStr) {
				os = conn.getOutputStream();
				os.write(outputStr.getBytes(StandardCharsets.UTF_8));
			}

			is = conn.getInputStream();
			isr = new InputStreamReader(is, StandardCharsets.UTF_8);
			in = new BufferedReader(isr);
			String str = null;
			StringBuffer buffer = new StringBuffer();
			while ((str = in.readLine()) != null) {
				buffer.append(str);
			}
			jsonObject = JSONObject.fromObject(buffer.toString());

		}catch (Exception e) {
			LogUtil.error(e);
		} finally {
			CloseStream.close(is, isr, in);
			CloseStream.close(os);
			if (conn != null) {
				conn.disconnect();
			}
		}
		return jsonObject;
	}
	
	/**
	 * get the access token for wechat api. 
	 * @throws Exception 
	 */
	public static String getToken() throws Exception {
		String accessToken = JedisHelper.get(ConstString.RedisPrefix_wechat_accessToken);
		if(accessToken == null){
			accessToken = refreshToken();
			
			if(accessToken != null){
				// wechat access token will be expired in 7200s, set redis a smaller value to avoid illegal data on calling
				JedisHelper.setNX(ConstString.RedisPrefix_wechat_accessToken, accessToken, 5400);
			}
		}
		
		if(accessToken == null){
			throw new Exception("access token 获取失败");
		}
		
		return accessToken;
	}
	
	private static String refreshToken() {
		String requestUrl = WeChatCfg.DicKey_weChat_token_url.replace("APPID", WeChatCfg.DicKey_weChat_appId).replace("APPSECRET", WeChatCfg.DicKey_weChat_appSecret);
		JSONObject jsonObject = httpsRequest(requestUrl, "GET", null);
		
		return jsonObject != null ? jsonObject.getString("access_token") : null;
	}
}
