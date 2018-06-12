package com.ckxh.cloud.platform.api.own.wechat;

import java.io.BufferedReader;
import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.commons.CommonsMultipartFile;
import com.ckxh.cloud.base.annotation.AuthPathOnBind;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.persistence.common.WeChatCfg;
import com.ckxh.cloud.platform.util.CloseStream;
import com.ckxh.cloud.platform.util.wechat.CommonUtil;

@Scope("singleton")
@Controller
@RequestMapping("/own/wechat/fileUp")
@AuthPathOnBind("post:/platformApi/own/warn/forward/wechat")
public class ThumbImgUpController {

	@ResponseBody
	@RequestMapping(method = RequestMethod.POST, consumes = { "multipart/form-data" })
	public String upload(@RequestParam("file") CommonsMultipartFile file, HttpServletRequest request, HttpServletResponse response) throws Exception {

		OutputStream out = null;
		DataInputStream dis = null;
		InputStream is = null;
		InputStreamReader isr = null;
		BufferedReader in = null;

		try {
			if(file == null){
				throw new Exception("文件空指针异常");
			}
			
			if(!file.getOriginalFilename().endsWith(".png") && !file.getOriginalFilename().endsWith(".jpg")) {
				return JsonUtil.createSuccessJson(false, null, "文件格式不正确", null);
			}else {
				if (file.getSize() / 1024 > 50) {
					return JsonUtil.createSuccessJson(false, null, "文件大小溢出", null);
				}
			}
			
			String replaceUrl = WeChatCfg.DicKey_weChat_upThumbImg.replace("ACCESS_TOKEN", CommonUtil.getToken());
			URL urlObj = new URL(replaceUrl);

			HttpURLConnection con = (HttpURLConnection) urlObj.openConnection();
			con.setRequestMethod("POST");
			con.setDoInput(true);
			con.setDoOutput(true);
			con.setUseCaches(false);
			con.setRequestProperty("Connection", "Keep-Alive");
			con.setRequestProperty("Charset", "UTF-8");
			String BOUNDARY = "----------" + System.currentTimeMillis();
			con.setRequestProperty("Content-Type", "multipart/form-data; boundary=" + BOUNDARY);
			StringBuilder sb = new StringBuilder();
			sb.append("--");
			sb.append(BOUNDARY);
			sb.append("\r\n");
			sb.append("Content-Disposition: form-data;name=\"media\";filelength=\"" + file.getSize() + "\";filename=\""
					+ file.getOriginalFilename() + "\"\r\n");
			sb.append("Content-Type:application/octet-stream\r\n\r\n");
			byte[] head = sb.toString().getBytes(StandardCharsets.UTF_8);
			out = new DataOutputStream(con.getOutputStream());
			out.write(head);
			dis = new DataInputStream(file.getInputStream());
			int bytes = 0;
			byte[] bufferOut = new byte[1024];
			while ((bytes = dis.read(bufferOut)) != -1) {
				out.write(bufferOut, 0, bytes);
			}
			byte[] foot = ("\r\n--" + BOUNDARY + "--\r\n").getBytes(StandardCharsets.UTF_8);
			out.write(foot);
			out.flush();

			StringBuffer buffer = new StringBuffer();
			String result = null;
			is = con.getInputStream();
			isr = new InputStreamReader(is);
			in = new BufferedReader(isr);

			String line = null;
			while ((line = in.readLine()) != null) {
				buffer.append(line);
			}
			if (result == null) {
				result = buffer.toString();
			}

			return JsonUtil.createSuccessJson(true, result, "发送成功", null);
		} catch (Exception e) {
			return JsonUtil.createSuccessJson(false, null, e.getMessage(), null);
		} finally {
			CloseStream.close(is, isr, in);
			CloseStream.close(out);
		}
	}
}
