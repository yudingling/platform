package com.ckxh.cloud.platform.model;

import java.io.Serializable;
import java.sql.Timestamp;
import java.util.List;

public class DiscoveryItem implements Serializable {
	private static final long serialVersionUID = -1838808332259050628L;
	
	private String cid;
	private String cnm;
	private long starCount;
	private List<String> tags;
	private Timestamp crtTs;
	private Long latestTs;
	private String uId;
	private String uNm;
	private Long uIcon;
	private boolean isPublic = false;
	private boolean hasVideo = false;
	private boolean hasImage = false;
	private boolean hasTsData = false;
	private boolean starByCurrent = false;
	
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
	public long getStarCount() {
		return starCount;
	}
	public void setStarCount(long starCount) {
		this.starCount = starCount;
	}
	public List<String> getTags() {
		return tags;
	}
	public void setTags(List<String> tags) {
		this.tags = tags;
	}
	public Timestamp getCrtTs() {
		return crtTs;
	}
	public void setCrtTs(Timestamp crtTs) {
		this.crtTs = crtTs;
	}
	public Long getLatestTs() {
		return latestTs;
	}
	public void setLatestTs(Long latestTs) {
		this.latestTs = latestTs;
	}
	public String getuId() {
		return uId;
	}
	public void setuId(String uId) {
		this.uId = uId;
	}
	public String getuNm() {
		return uNm;
	}
	public void setuNm(String uNm) {
		this.uNm = uNm;
	}
	public Long getuIcon() {
		return uIcon;
	}
	public void setuIcon(Long uIcon) {
		this.uIcon = uIcon;
	}
	public boolean isPublic() {
		return isPublic;
	}
	public void setPublic(boolean isPublic) {
		this.isPublic = isPublic;
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
	public boolean isStarByCurrent() {
		return starByCurrent;
	}
	public void setStarByCurrent(boolean starByCurrent) {
		this.starByCurrent = starByCurrent;
	}
	
	public DiscoveryItem(){
		super();
	}
	
	public DiscoveryItem(String cid, String cnm) {
		super();
		this.cid = cid;
		this.cnm = cnm;
		this.starCount = 0;
	}
	
	
}
