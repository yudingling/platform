package com.ckxh.cloud.platform.model.f3rd;

import java.io.Serializable;
import java.sql.Timestamp;

public class ImageDataItem implements Serializable {
	private static final long serialVersionUID = -1311245884835785112L;
	
	private Timestamp tm;
	private String url;

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

	public ImageDataItem(){
		super();
	}

	public ImageDataItem(Timestamp tm, String url) {
		super();
		this.tm = tm;
		this.url = url;
	}
}
