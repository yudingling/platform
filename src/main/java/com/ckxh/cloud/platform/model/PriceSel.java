package com.ckxh.cloud.platform.model;

import java.io.Serializable;
import java.util.HashMap;
import java.util.Map;

public class PriceSel implements Serializable {
	private static final long serialVersionUID = 4119487586792819465L;
	
	private String name;
	private String value;
	private Map<String, Object> data;
	
	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getValue() {
		return value;
	}

	public void setValue(String value) {
		this.value = value;
	}

	public Map<String, Object> getData() {
		return data;
	}

	public void setData(Map<String, Object> data) {
		this.data = data;
	}

	public PriceSel() {
		super();
	}

	public PriceSel(String name, String value) {
		super();
		this.name = name;
		this.value = value;
		this.data = new HashMap<String, Object>();
	}
	
	public void setCount(long count){
		this.data.put("count", count);
	}
	
	public void setFee(double fee){
		this.data.put("fee", fee);
	}
}
