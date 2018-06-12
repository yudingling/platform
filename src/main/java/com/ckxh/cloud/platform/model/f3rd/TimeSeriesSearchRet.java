package com.ckxh.cloud.platform.model.f3rd;

import java.io.Serializable;
import java.util.Map;

public class TimeSeriesSearchRet implements Serializable {
	private static final long serialVersionUID = -7841298062737742435L;
	
	private String clientId;
	private Map<String, Object> data;
	
	public String getClientId() {
		return clientId;
	}

	public void setClientId(String clientId) {
		this.clientId = clientId;
	}
	
	public Map<String, Object> getData() {
		return data;
	}

	public void setData(Map<String, Object> data) {
		this.data = data;
	}

	public TimeSeriesSearchRet(){
		super();
	}

	public TimeSeriesSearchRet(String clientId, Map<String, Object> data) {
		super();
		this.clientId = clientId;
		this.data = data;
	}
}
