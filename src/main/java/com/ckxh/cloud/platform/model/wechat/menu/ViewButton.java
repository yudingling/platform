package com.ckxh.cloud.platform.model.wechat.menu;

public class ViewButton extends Button {
	private String type;
	private String url;

	public String getType() {
		return type;
	}

	public void setType(String type) {
		this.type = type;
	}

	public String getUrl() {
		return url;
	}

	public void setUrl(String url) {
		this.url = url;
	}

	public ViewButton() {
		super();
	}

	public ViewButton(String type, String url) {
		super();
		this.type = type;
		this.url = url;
	}

}
