package com.ckxh.cloud.platform.model.f3rd;

import java.io.Serializable;
import java.util.List;

public class TimeSeriesSearchParam implements Serializable {
	private static final long serialVersionUID = -3482590282871235663L;
	
	private String clientId;
	private List<String> metaCIds;
	
	public String getClientId() {
		return clientId;
	}

	public void setClientId(String clientId) {
		this.clientId = clientId;
	}

	public List<String> getMetaCIds() {
		return metaCIds;
	}

	public void setMetaCIds(List<String> metaCIds) {
		this.metaCIds = metaCIds;
	}

	public TimeSeriesSearchParam(){
		super();
	}

	public TimeSeriesSearchParam(String clientId, List<String> metaCIds) {
		super();
		this.clientId = clientId;
		this.metaCIds = metaCIds;
	}
}
