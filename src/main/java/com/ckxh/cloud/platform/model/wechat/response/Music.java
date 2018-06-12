package com.ckxh.cloud.platform.model.wechat.response;

public class Music {
	private String Title;
	private String Description;
	private String MusicUrl;
	private String HQMusicUrl;
	private String ThumbMedia;

	public String getThumbMedia() {
		return ThumbMedia;
	}

	public void setThumbMedia(String thumbMedia) {
		ThumbMedia = thumbMedia;
	}

	public String getHQMusicUrl() {

		return HQMusicUrl;
	}

	public void setHQMusicUrl(String HQMusicUrl) {
		this.HQMusicUrl = HQMusicUrl;
	}

	public String getMusicUrl() {

		return MusicUrl;
	}

	public void setMusicUrl(String musicUrl) {
		MusicUrl = musicUrl;
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

	public Music() {
		super();
	}

	public Music(String title, String description, String musicUrl, String hQMusicUrl, String thumbMedia) {
		Title = title;
		Description = description;
		MusicUrl = musicUrl;
		HQMusicUrl = hQMusicUrl;
		ThumbMedia = thumbMedia;
	}

}
