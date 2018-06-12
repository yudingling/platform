package com.ckxh.cloud.platform.model;

import java.io.Serializable;

public class WechatUserInfo implements Serializable {
	private static final long serialVersionUID = -2298086939184281282L;
	
	private String openid;
	private String nickname;
	private String headimgurl;
	
	public String getOpenid() {
		return openid;
	}

	public void setOpenid(String openid) {
		this.openid = openid;
	}

	public String getNickname() {
		return nickname;
	}

	public void setNickname(String nickname) {
		this.nickname = nickname;
	}

	public String getHeadimgurl() {
		return headimgurl;
	}

	public void setHeadimgurl(String headimgurl) {
		this.headimgurl = headimgurl;
	}

	public WechatUserInfo(){
		super();
	}

	public WechatUserInfo(String openid, String nickname, String headimgurl) {
		super();
		this.openid = openid;
		this.nickname = nickname;
		this.headimgurl = headimgurl;
	}
}
