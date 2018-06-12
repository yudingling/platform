package com.ckxh.cloud.platform.util.wechat;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Arrays;

import com.ckxh.cloud.base.util.LogUtil;
import com.ckxh.cloud.persistence.common.WeChatCfg;

public class SignUtil {

	public static boolean CheckSignature(String signature, String timestamp, String nonce) {

		String[] paramArr = new String[] {WeChatCfg.DicKey_weChat_token,timestamp, nonce };
		Arrays.sort(paramArr);
		boolean flag = false;
		String content = paramArr[0].concat(paramArr[1]).concat(paramArr[2]);
		String ciphertext = null;

		try {
			MessageDigest md = MessageDigest.getInstance("SHA-1");

			byte[] digest = md.digest(content.toString().getBytes());

			ciphertext = byteToStr(digest);

		} catch (NoSuchAlgorithmException e) {
			LogUtil.error(e);
		}

		if (ciphertext != null) {

			if (ciphertext.equals(signature.toUpperCase())) {
				flag = true;
			} else
				flag = false;
		}
		return flag;
	}

	static String byteToStr(byte[] byteArrays) {
		String strDigest = "";
		for (int i = 0; i < byteArrays.length; i++) {
			strDigest += byteToHexStr(byteArrays[i]);
		}
		return strDigest;
	}

	static String byteToHexStr(byte Mybyte) {
		char[] digest = { '0', '1', '2', '3', '4', '5', '6', '7', '8', '9','A', 'B', 'C', 'D', 'E', 'F' };
		char[] tempArr = new char[2];
		tempArr[0] = digest[(Mybyte >>> 4) & 0X0f];
		tempArr[1] = digest[Mybyte & 0x0f];
		String s = new String(tempArr);
		return s;
	}
}
