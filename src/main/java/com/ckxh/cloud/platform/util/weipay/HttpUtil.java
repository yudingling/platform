package com.ckxh.cloud.platform.util.weipay;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.SSLContext;
import org.apache.http.HttpEntity;
import org.apache.http.client.config.RequestConfig;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.conn.ssl.SSLConnectionSocketFactory;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.ssl.SSLContexts;
import com.ckxh.cloud.base.util.Common;
import com.ckxh.cloud.base.util.LogUtil;
import com.ckxh.cloud.persistence.common.WeChatCfg;
import com.ckxh.cloud.platform.util.CloseStream;

public class HttpUtil {
	private final static int CONNECT_TIMEOUT = 5000;
	private static HttpClientBuilder cliBuilder;
	private static RequestConfig requestConfig;
	
	static{
		try{
			KeyStore keyStore  = KeyStore.getInstance("PKCS12");
			InputStream instream = Thread.currentThread().getContextClassLoader().getResourceAsStream(WeChatCfg.DicKey_weChat_transfer_sslPfx);
			char[] pwd = WeChatCfg.DicKey_weChat_mch_id.toCharArray();
			
	        try {
	            keyStore.load(instream, pwd);
	        } finally {
	            instream.close();
	        }

	        // Trust own CA and all self-signed certs
	        SSLContext sslcontext = SSLContexts.custom().loadKeyMaterial(keyStore, pwd).build();
	        // Allow TLSv1 protocol only
	        @SuppressWarnings("deprecation")
			SSLConnectionSocketFactory sslsf = new SSLConnectionSocketFactory(
	                sslcontext,
	                new String[] { "TLSv1" },
	                null,
	                (HostnameVerifier) SSLConnectionSocketFactory.BROWSER_COMPATIBLE_HOSTNAME_VERIFIER);
	        
	        cliBuilder = HttpClients.custom().setSSLSocketFactory(sslsf);
	        
	        requestConfig = RequestConfig.custom()
		    		.setConnectionRequestTimeout(10000)
	                .setConnectTimeout(10000)
	                .setSocketTimeout(60000).build();
	        
		}catch(Exception ex){
			LogUtil.error(ex);
		}
	}
	
	/**
	 * postData
	 * @param urlStr
	 * @param data
	 * @return return null means fail
	 */
	public static String postData(String urlStr, String data) {
		HttpURLConnection conn = null;
		OutputStreamWriter osw = null;
		OutputStream os = null;

		InputStream is = null;
		InputStreamReader isr = null;
		BufferedReader in = null;

		try {
			URL url = new URL(urlStr);
			conn = (HttpURLConnection) url.openConnection();
			conn.setDoOutput(true);
			conn.setConnectTimeout(CONNECT_TIMEOUT);
			conn.setReadTimeout(CONNECT_TIMEOUT);
			conn.setRequestMethod("POST");
			conn.setUseCaches(false);

			os = conn.getOutputStream();
				
			osw = new OutputStreamWriter(conn.getOutputStream(), StandardCharsets.UTF_8);
			if (data == null){
				data = "";
			}
				
			osw.write(data);
			osw.flush();

			is = conn.getInputStream();
			isr = new InputStreamReader(is, StandardCharsets.UTF_8);
			in = new BufferedReader(isr);

			StringBuilder sb = new StringBuilder();
			String line = null;
			while ((line = in.readLine()) != null) {
				sb.append(line);
				sb.append("\r\n");
			}
			return sb.toString();
		} catch (IOException e) {
			LogUtil.error(e);
		} finally {
			try {
				CloseStream.close(os, osw, null);
				CloseStream.close(is, isr, in);
				if (conn != null) {
					conn.disconnect();
				}
			} catch (Exception e) {
				LogUtil.error(e);
			}
		}
		return null;
	}
	
	/**
	 * weipay transfer
	 * @param sslUrl
	 * @param data
	 * @return return null means fail
	 */
	public static String postDataSSL(String sslUrl, String data) {
		if(cliBuilder == null){
			return null;
		}
		
        CloseableHttpClient httpClient = cliBuilder.build();
        try {
            HttpPost httpPost = new HttpPost(sslUrl);
            httpPost.setConfig(requestConfig);
            
            StringEntity enti = new StringEntity(data, StandardCharsets.UTF_8); 
            httpPost.setEntity(enti);
            
            CloseableHttpResponse response = httpClient.execute(httpPost);
            
    		try {
    			if(response.getStatusLine().getStatusCode() == 200){
    				HttpEntity entity = response.getEntity();
    	        	return Common.inputStream2String(entity.getContent(), StandardCharsets.UTF_8, true);
    	        }else
    	        	throw new Exception("error, stauts code:" + response.getStatusLine().getStatusCode());
    			
    		}catch (Exception e) {
    			LogUtil.error(e);
    		}finally{
    			try {
					response.close();
				} catch (IOException e) {
				}
    		}
    		
        }catch(Exception e){
        	LogUtil.error(e);
        }finally{
        	try {
				httpClient.close();
			} catch (IOException e) {
			}
        }
        
        return null;
	}
}
