package com.ckxh.cloud.platform.model.wechat.response;

public class MusicMessage extends BaseMessage {
	private Music Music;

	public Music getMusic() {
		return Music;
	}

	public void setMusic(Music music) {
		Music = music;
	}

	public MusicMessage() {
		super();
	}

	public MusicMessage(Music music) {
		Music = music;
	}

}
