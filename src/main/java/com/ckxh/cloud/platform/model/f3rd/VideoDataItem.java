package com.ckxh.cloud.platform.model.f3rd;

import java.io.Serializable;
import java.sql.Timestamp;

public class VideoDataItem implements Serializable {
	private static final long serialVersionUID = -8867248332315787822L;
	
	private Timestamp tm;
	private String url;
	private String mobileUrl;
	private String screenshot;
	
	public Timestamp getTm() {
		return tm;
	}

	public void setTm(Timestamp tm) {
		this.tm = tm;
	}

	public String getUrl() {
		return url;
	}

	public void setUrl(String url) {
		this.url = url;
	}

	public String getMobileUrl() {
		return mobileUrl;
	}

	public void setMobileUrl(String mobileUrl) {
		this.mobileUrl = mobileUrl;
	}

	public String getScreenshot() {
		return screenshot;
	}

	public void setScreenshot(String screenshot) {
		this.screenshot = screenshot;
	}

	public VideoDataItem(){
		super();
	}

	public VideoDataItem(Timestamp tm, String url, String mobileUrl,
			String screenshot) {
		super();
		this.tm = tm;
		this.url = url;
		this.mobileUrl = mobileUrl;
		this.screenshot = screenshot;
	}
}
