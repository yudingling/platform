package com.ckxh.cloud.platform.api.open.paycb;

import javax.annotation.PostConstruct;

import com.ckxh.cloud.base.daemon.IWriteBack;

public abstract class CBGetter {
	protected IWriteBack wb;
	
	@PostConstruct
	private void init(){
		this.wb = this.getWriteBack();
	}
	
	protected abstract IWriteBack getWriteBack();
}
