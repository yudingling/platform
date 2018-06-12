package platform.test;

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
import com.ckxh.cloud.base.util.LogUtil;
import com.ckxh.cloud.platform.util.CloseStream;
import com.ckxh.cloud.platform.util.wechat.MyX509TrustManager;
import net.sf.json.JSONObject;

/**
 * @author 该工具类是备用的生成的公众号的关注的二维码(不要随便调用)
 *
 */
public class QrCodeUtil {
	public static void main(String[] args) {
		String appid = "";
		String appsecret = "";
		
		String accessToken = getToken(appid, appsecret);

		String qrcodeUrl = "https://api.weixin.qq.com/cgi-bin/qrcode/create?access_token=TOKEN";
		String requestUrl = qrcodeUrl.replaceFirst("TOKEN", accessToken);

		String requestMethod = "POST";

		// 构建post的json
		// {"action_name": "QR_LIMIT_STR_SCENE", "action_info": {"scene":
		// {"scene_str": "123"}}}
		JSONObject three = new JSONObject();
		three.put("scene_str", "1234");
		JSONObject two = new JSONObject();
		two.put("scene", three);
		JSONObject one = new JSONObject();
		one.put("action_name", "QR_LIMIT_STR_SCENE");
		one.put("action_info", two);
		String jsonStr = one.toString();
		String outputStr = jsonStr;

		JSONObject qrCodeObj = httpsRequest(requestUrl, requestMethod, outputStr);
		String url = qrCodeObj.getString("url");
		System.out.println(url);
	}

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
			conn.setConnectTimeout(5000);
			conn.setReadTimeout(3000);
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

		} catch (Exception e) {
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

	public static String getToken(String appid, String appsecret) {
		String token = null;

		String weChat_token_url = "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=APPID&secret=APPSECRET";
		String requestUrl = weChat_token_url.replace("APPID", appid).replace("APPSECRET", appsecret);
		
		JSONObject jsonObject = httpsRequest(requestUrl, "GET", null);
		if (null != jsonObject) {
			try {
				token = jsonObject.getString("access_token");
			} catch (Exception e) {
				LogUtil.error(e);
			}
		}
		
		return token;
	}
}
