package com.ckxh.cloud.platform.model.f3rd;

import java.io.Serializable;

public class PeriodDataItem implements Serializable {
	private static final long serialVersionUID = 7835511844513732111L;
	
	private Long tm;
	private Object value;

	public Long getTm() {
		return tm;
	}

	public void setTm(Long tm) {
		this.tm = tm;
	}

	public Object getValue() {
		return value;
	}

	public void setValue(Object value) {
		this.value = value;
	}

	public PeriodDataItem(){
		super();
	}

	public PeriodDataItem(Long tm, Object value) {
		super();
		this.tm = tm;
		this.value = value;
	}
}
