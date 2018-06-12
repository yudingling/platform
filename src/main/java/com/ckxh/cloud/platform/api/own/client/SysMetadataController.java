package com.ckxh.cloud.platform.api.own.client;

import java.util.List;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.persistence.db.client.service.ClientInfoService;
import com.ckxh.cloud.persistence.model.ClientTreeNode;
import com.fasterxml.jackson.core.JsonProcessingException;

@Scope("singleton")
@Controller
@RequestMapping("/own/client/normal/sysMetadata")
public class SysMetadataController {
	@Autowired
	private ClientInfoService clientInfoService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String get(HttpServletRequest request, HttpServletResponse response){
		try {
			
			List<ClientTreeNode> treeNode=clientInfoService.getSysMetadataTree();
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(treeNode), null, null);
		} catch (JsonProcessingException e) {
			return JsonUtil.createSuccessJson(false, null, e.getMessage(),null);
		}
	}
}
