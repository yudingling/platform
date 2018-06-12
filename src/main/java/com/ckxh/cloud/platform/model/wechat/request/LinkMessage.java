package com.ckxh.cloud.platform.model.wechat.request;

public class LinkMessage extends BaseMessage {

	private String Title;
	private String Description;
	private String URl;

	public String getURl() {
		return URl;
	}

	public void setURl(String URl) {
		this.URl = URl;
	}

	public String getDescription() {

		return Description;
	}

	public void setDescription(String description) {
		Description = description;
	}

	public String getTitle() {
		return Title;

	}

	public void setTitle(String title) {
		Title = title;
	}

	public LinkMessage() {
		super();
	}

	public LinkMessage(String title, String description, String uRl) {
		Title = title;
		Description = description;
		URl = uRl;
	}

}
