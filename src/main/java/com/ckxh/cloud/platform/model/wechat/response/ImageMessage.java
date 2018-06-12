package com.ckxh.cloud.platform.model.wechat.response;

public class ImageMessage extends BaseMessage {

	private Image Image;

	public Image getImage() {
		return Image;
	}

	public void setImage(Image image) {
		Image = image;
	}

	public ImageMessage() {
		super();
	}

	public ImageMessage(Image image) {
		Image = image;
	}

}
