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
import net.sf.json.JSONObject;
import com.ckxh.cloud.platform.util.CloseStream;
import com.ckxh.cloud.platform.util.wechat.MyX509TrustManager;

import junit.framework.TestCase;

public class WechatMenu extends TestCase {
	public void setMenu(){
		String menuJson = "{\"button\":["
			+ "{\"name\":\"查询\", \"sub_button\":[{\"type\":\"view\",\"name\":\"设备信息\",\"url\":\"http://hfsys.cn/platformMobile/s/deviceInfo\"},{\"type\":\"view\",\"name\":\"数据查询\",\"url\":\"http://hfsys.cn/platformMobile/s/dataMonitor\"},{\"type\":\"view\",\"name\":\"最新数据\",\"url\":\"http://hfsys.cn/platformMobile/s/latestData\"}]},"
			+ "{\"name\":\"个人中心\", \"sub_button\":[{\"type\":\"view\",\"name\":\"个人信息\",\"url\":\"http://hfsys.cn/platformMobile/s/userInfo\"},{\"type\":\"view\",\"name\":\"消息中心\",\"url\":\"http://hfsys.cn/platformMobile/s/infoCenter\"},{\"type\":\"view\",\"name\":\"服务中心\",\"url\":\"http://hfsys.cn/platformMobile/s/service3rd\"}]},"
			+ "{\"name\":\"设置\", \"sub_button\":[{\"type\":\"view\",\"name\":\"账号绑定\",\"url\":\"http://hfsys.cn/platformMobile/s/appBind\"}]}"
			+ "]}";
		
		System.out.println(menuJson);
		
		String accessToken = getAccessToken();
		
		JSONObject jsonObject = httpsRequest("https://api.weixin.qq.com/cgi-bin/menu/create?access_token=" + accessToken, "POST", menuJson);
		System.out.println(jsonObject.toString());
	}
	
	private String getAccessToken() {
		JSONObject jsonObject = httpsRequest("https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wx5e5b61c01e67873e&secret=451dabab84d5d6410ebc99690b909f8e", "GET", null);
		
		return jsonObject != null ? jsonObject.getString("access_token") : null;
	}
	
	private JSONObject httpsRequest(String requestUrl, String requestMethod, String outputStr) {
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
			e.printStackTrace();
			
		} finally {
			CloseStream.close(is, isr, in);
			CloseStream.close(os);
			if (conn != null) {
				conn.disconnect();
			}
		}
		return jsonObject;
	}
}
