package com.ckxh.cloud.platform.model.wechat.response;

public class Article {

	private String Title;
	private String Description;
	private String PicUrl;
	private String Url;
	private Image image;

	public Image getImage() {
		return image;
	}

	public void setImage(Image image) {
		this.image = image;
	}

	public String getUrl() {
		return Url;
	}

	public void setUrl(String url) {
		Url = url;
	}

	public String getPicUrl() {

		return PicUrl;
	}

	public void setPicUrl(String picUrl) {
		PicUrl = picUrl;
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

	public Article() {
		super();
	}

	public Article(String title, String description, String picUrl, String url, Image image) {
		Title = title;
		Description = description;
		PicUrl = picUrl;
		Url = url;
		this.image = image;
	}

}
