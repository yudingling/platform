package com.ckxh.cloud.platform.model;

import java.io.Serializable;
import java.sql.Timestamp;

public class IotImageInfo implements Serializable {
	private static final long serialVersionUID = -5481990472656703920L;
	
	private Long IF_ID;
	private Timestamp IF_COLTS;
	private Timestamp CRT_TS;
	private String URL;
	
	public Long getIF_ID() {
		return IF_ID;
	}

	public void setIF_ID(Long iF_ID) {
		IF_ID = iF_ID;
	}

	public Timestamp getIF_COLTS() {
		return IF_COLTS;
	}

	public void setIF_COLTS(Timestamp iF_COLTS) {
		IF_COLTS = iF_COLTS;
	}

	public String getURL() {
		return URL;
	}

	public void setURL(String uRL) {
		URL = uRL;
	}

	public Timestamp getCRT_TS() {
		return CRT_TS;
	}

	public void setCRT_TS(Timestamp cRT_TS) {
		CRT_TS = cRT_TS;
	}

	public IotImageInfo(){
		super();
	}

	public IotImageInfo(Long iF_ID, Timestamp iF_COLTS, Timestamp cRT_TS,
			String uRL) {
		super();
		IF_ID = iF_ID;
		IF_COLTS = iF_COLTS;
		CRT_TS = cRT_TS;
		URL = uRL;
	}
	
}
