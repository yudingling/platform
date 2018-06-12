package com.ckxh.cloud.platform.model.f3rd;

import java.io.Serializable;
import java.util.List;
import java.util.Map;

public class CmdParam implements Serializable {
	private static final long serialVersionUID = 2936465048584611106L;
	
	private String clientId;
	private List<Map<String, Object>> cmds;

	public String getClientId() {
		return clientId;
	}

	public void setClientId(String clientId) {
		this.clientId = clientId;
	}

	public List<Map<String, Object>> getCmds() {
		return cmds;
	}

	public void setCmds(List<Map<String, Object>> cmds) {
		this.cmds = cmds;
	}

	public CmdParam(){
		super();
	}

	public CmdParam(String clientId, List<Map<String, Object>> cmds) {
		super();
		this.clientId = clientId;
		this.cmds = cmds;
	}
}
