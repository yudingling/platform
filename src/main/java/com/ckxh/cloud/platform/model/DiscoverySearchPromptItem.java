package com.ckxh.cloud.platform.model;

import java.io.Serializable;

public class DiscoverySearchPromptItem implements Serializable {
	private static final long serialVersionUID = 696010591517663211L;
	
	private String cid;
	private String cnm;
	private boolean hasVideo = false;
	private boolean hasImage = false;
	private boolean hasTsData = false;
	
	public String getCid() {
		return cid;
	}

	public void setCid(String cid) {
		this.cid = cid;
	}

	public String getCnm() {
		return cnm;
	}

	public void setCnm(String cnm) {
		this.cnm = cnm;
	}

	public boolean isHasVideo() {
		return hasVideo;
	}

	public void setHasVideo(boolean hasVideo) {
		this.hasVideo = hasVideo;
	}

	public boolean isHasImage() {
		return hasImage;
	}

	public void setHasImage(boolean hasImage) {
		this.hasImage = hasImage;
	}

	public boolean isHasTsData() {
		return hasTsData;
	}

	public void setHasTsData(boolean hasTsData) {
		this.hasTsData = hasTsData;
	}

	public DiscoverySearchPromptItem(){
		super();
	}
	
	public DiscoverySearchPromptItem(String cid, String cnm){
		super();
		this.cid = cid;
		this.cnm = cnm;
	}

	public DiscoverySearchPromptItem(String cid, String cnm, boolean hasVideo,
			boolean hasImage, boolean hasTsData) {
		super();
		this.cid = cid;
		this.cnm = cnm;
		this.hasVideo = hasVideo;
		this.hasImage = hasImage;
		this.hasTsData = hasTsData;
	}
	
}
