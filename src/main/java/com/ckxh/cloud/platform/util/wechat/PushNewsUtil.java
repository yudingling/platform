package com.ckxh.cloud.platform.util.wechat;

import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.apache.http.HttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;
import com.ckxh.cloud.base.util.LogUtil;
import com.ckxh.cloud.persistence.common.WeChatCfg;
import com.ckxh.cloud.platform.util.CloseStream;

public class PushNewsUtil {

	public static String nextOpenId = "NEXT_OPENID";

	public static String getNewsMediaId(String title, String content, String thumb_media_id, String content_source_url) {
		try{
			JSONObject news = new JSONObject();
			JSONArray articles = new JSONArray();
			JSONObject list = new JSONObject();
			list.put("thumb_media_id", thumb_media_id);
			list.put("title", title);
			list.put("content_source_url", content_source_url);
			// content support html tag
			list.put("content", content);
			list.put("show_cover_pic", 0);
			articles.add(list);
			news.put("articles", articles);

			String newsStr = news.toString();
			CloseableHttpClient httpClient = HttpClients.createDefault();
			String body = null;
			
			String url = WeChatCfg.DicKey_weChat_upNews.replace("ACCESS_TOKEN", CommonUtil.getToken());

			HttpPost method = new HttpPost(url);
			if (method != null) {
				HttpResponse response;
				try {
					method.addHeader("Content-type", "application/json; charset=utf-8");
					method.setHeader("Accept", "application/json");
					method.setEntity(new StringEntity(newsStr, StandardCharsets.UTF_8));
					response = httpClient.execute(method);
					body = EntityUtils.toString(response.getEntity());
				} catch (IOException e) {
					LogUtil.error(e);
				}
			}
			JSONObject jsonObject = JSONObject.fromObject(body);
			
			return jsonObject.getString("media_id");
			
		}catch(Exception ex){
			LogUtil.error(ex);
		}
		
		return null;
	}

	// get useropenIdlist
	public static List<String> getUserOpenIdList(String nextOpenId) {
		List<String> openIdList = null;
		URL url;
		InputStream is = null;
		try {
			String urlStr = WeChatCfg.DicKey_weChat_openIdListUrl.replace("ACCESS_TOKEN", CommonUtil.getToken());
			
			url = new URL(urlStr);
			HttpURLConnection http = (HttpURLConnection) url.openConnection();
			http.setRequestMethod("GET");
			http.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
			http.setDoInput(true);
			is = http.getInputStream();
			int size = is.available();
			byte[] buf = new byte[size];
			is.read(buf);
			String resp = new String(buf, StandardCharsets.UTF_8);
			JSONObject jsonObject = JSONObject.fromObject(resp);
			int count = jsonObject.getInt("count");
			if(count == 0){
				return null;
			}
			
			JSONArray array = jsonObject.getJSONObject("data").getJSONArray("openid");
			// update next_openid
			nextOpenId = jsonObject.getString("next_openid");
			openIdList = new ArrayList<String>();

			for (int i = 0, aSize = array.size(); i < aSize; i++) {
				openIdList.add(array.getString(i));
			}
			return openIdList;
		}catch (Exception e) {
			LogUtil.error(e);
		} finally {
			CloseStream.close(is);
		}
		return null;
	}
	
	public static String pushNewsToUser(String title, String content, String thumb_media_id, String content_source_url) throws Exception {
		String message = "SUCCESS";
		
		// get media_id
		String mediaId = getNewsMediaId(title, content, thumb_media_id, content_source_url);
		if(mediaId == null){
			message = "图文消息上传失败";
			return message;
		}
	
		// get userOpenIdList
		List<String> userOpenIdList = getUserOpenIdList(nextOpenId);

		if(userOpenIdList == null){
			message = "您的公众号暂时没有关注用户，无法发送!";	
			return message;
		}
		
		// package news
		JSONObject news = new JSONObject();
		JSONArray touser = new JSONArray();
		for (String openId : userOpenIdList) {
			touser.add(openId);
		}
		JSONObject mpnews = new JSONObject();
		mpnews.put("media_id", mediaId);
		news.put("touser", touser);
		news.put("mpnews", mpnews);
		news.put("msgtype", "mpnews");

		String resultStr = news.toString();
		String url = WeChatCfg.DicKey_weChat_realPushNews.replace("ACCESS_TOKEN", CommonUtil.getToken());

		CloseableHttpClient httpClient = HttpClients.createDefault();
		HttpPost method = new HttpPost(url);
		String body = "";

		if (method != null) {
			HttpResponse response;
			try {
				method.addHeader("Content-type", "application/json; charset=utf-8");
				method.setHeader("Accept", "application/json");
				method.setEntity(new StringEntity(resultStr, StandardCharsets.UTF_8));
				response = httpClient.execute(method);
				body = EntityUtils.toString(response.getEntity());
			
			} catch (IOException e) {
				LogUtil.error(e);
			}
		}

		JSONObject jsonObject = JSONObject.fromObject(body);
		int flag = jsonObject.getInt("errcode");
		if (flag != 0) {
			message = "图文消息推送失败";		
			return message;
		}
		return message;
	}
}
