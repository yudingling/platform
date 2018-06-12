package com.ckxh.cloud.platform.ssl;

import java.sql.Timestamp;
import java.util.HashMap;
import java.util.Map;
import java.util.ResourceBundle;
import javax.annotation.PostConstruct;
import javax.annotation.Resource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import com.ckxh.cloud.base.model.mqMsg.SSLClientGenRecord;
import com.ckxh.cloud.base.mq.AcMq;
import com.ckxh.cloud.base.util.ConstString;
import com.ckxh.cloud.base.util.DateUtil;
import com.ckxh.cloud.base.util.HttpClientUtil;
import com.ckxh.cloud.base.util.LogUtil;
import com.ckxh.cloud.persistence.common.CacheChanger;
import com.ckxh.cloud.persistence.db.client.service.ClientInfoService;
import com.ckxh.cloud.persistence.db.user.service.UserInfoService;

/**
 * 处理 user 对应的 client ssl 授权生成，单线程
 */
@Component
public class CrtActor implements Runnable {
	@Resource(name = "clientInfoService")
	private ClientInfoService clientInfoService;
	@Autowired
	private UserInfoService userInfoService;
	@Autowired
	private AcMq acMq;
	@Autowired
	private CacheChanger cacheChanger;
	
	private static String sslDir;
	private static String shMakeFile;
	private static String shClearFile;
	private static String crtFile;
	private static String keyFile;
	private static String authUid;
	private static String authPwd;
	
	static{
		ResourceBundle bundle = ResourceBundle.getBundle("ssl");  
	    if (bundle == null) {  
	        throw new IllegalArgumentException("[ssl.properties] 无法找到!");  
	    }
	    sslDir = bundle.getString("ssl.dir").trim();
	    shMakeFile = sslDir + "/" + bundle.getString("ssl.make").trim();
	    shClearFile = sslDir + "/" + bundle.getString("ssl.clear").trim();
	    crtFile = sslDir + "/" + bundle.getString("ssl.crt").trim();
	    keyFile = sslDir + "/" + bundle.getString("ssl.key").trim();
	    
	    authUid = bundle.getString("file.upload.authUid").trim();
	    authPwd = bundle.getString("file.upload.authPwd").trim();
	    
	    try {
	    	//给与 755 权限
			Runtime.getRuntime().exec("chmod 755 " + shMakeFile).waitFor();
			Runtime.getRuntime().exec("chmod 755 " + shClearFile).waitFor();
		} catch (Exception e) {
			LogUtil.error("CrtActor chmod 755 fail", e);
		}
	}
	
	@PostConstruct
	private void init() throws Exception{
		(new Thread(this)).start();
	}

	@Override
	public void run() {
		Timestamp tsPre = DateUtil.getCurrentTS();
		while(true){
			try{
				//can not using callback mode(listener is concurrent mode)
				SSLClientGenRecord msg = (SSLClientGenRecord) this.acMq.receiveQueue(ConstString.AcQueue_sslGen, SSLClientGenRecord.class);
				if(msg != null){
					Runtime.getRuntime().exec("/bin/sh " + shMakeFile).waitFor();
				    this.sendFile(msg);
				}
			}catch(Exception ex){
				LogUtil.error(ex);
			}
			
			try{
				Timestamp tsNow = DateUtil.getCurrentTS();
				//clear each 1 hour
				if(DateUtil.getDiffForHours(tsPre, tsNow, true) > 1){
					tsPre = tsNow;
					Runtime.getRuntime().exec("/bin/sh " + shClearFile).waitFor();
				}
			}catch(Exception ex){
				LogUtil.error(ex);
			}
		}
	}
	
	private void sendFile(SSLClientGenRecord msg){
		Map<String, String> fileMap = new HashMap<String, String>();
		fileMap.put(ConstString.SSLFileLoader_fileParam_key, keyFile);
		fileMap.put(ConstString.SSLFileLoader_fileParam_crt, crtFile);
		
		//you can't put these parameters to the argument named 'paramMap' of HttpClientUtil.postFile, 
		// cause the authenticate of file app use 'request.getParameter' to get the auth info, if you pass these parameters into MultipartEntity in HttpClientUtil, 
		// the request.getParameter always return null.
		String fileServerNm = this.cacheChanger.getLocalValue(ConstString.DicKey_fileAppServerNM_local, null);
		String postUrl = String.format("%sfileApi/own/ssl?%s=%s&%s=%s&%s=%s", 
				fileServerNm,
				ConstString.AuthParam_uid, authUid,
				ConstString.AuthParam_pwd, authPwd,
				ConstString.FileLoader_uid, msg.getUid());
		
		Map<String, String> retFileIds = new HashMap<String, String>();
		if(HttpClientUtil.postFile(postUrl, null, fileMap, retFileIds) 
				&& retFileIds.containsKey(ConstString.SSLFileLoader_returnFileId_key) 
				&& retFileIds.containsKey(ConstString.SSLFileLoader_returnFileId_crt)){
			
			this.userInfoService.updateUserSSLPfx(
					msg.getUid(), 
					Long.parseLong(retFileIds.get(ConstString.SSLFileLoader_returnFileId_key)), 
					Long.parseLong(retFileIds.get(ConstString.SSLFileLoader_returnFileId_crt)));
		}
	}
}
