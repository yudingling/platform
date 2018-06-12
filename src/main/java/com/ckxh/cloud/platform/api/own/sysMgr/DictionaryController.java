package com.ckxh.cloud.platform.api.own.sysMgr;

import java.util.ArrayList;
import java.util.List;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import com.ckxh.cloud.base.model.mqMsg.CacheChangedMsg;
import com.ckxh.cloud.base.mq.AcMq;
import com.ckxh.cloud.base.util.ConstString;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.persistence.db.model.MAIN_DIC;
import com.ckxh.cloud.persistence.db.sys.service.DictionaryService;

@Scope("singleton")
@Controller
@RequestMapping("/own/sysMgr/dic")
public class DictionaryController {
	@Autowired
	private DictionaryService dictionaryService;
	@Autowired
	private AcMq acMq;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String post(@RequestParam(required = false) String search, HttpServletRequest request, HttpServletResponse response){
		try{
			List<MAIN_DIC> ret = this.dictionaryService.getDicList(search);
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(ret), null, null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.PUT)
	public String put(@RequestParam String dicId, @RequestParam String dicNm, @RequestParam String dicVal, 
			HttpServletRequest request, HttpServletResponse response){
		try{
			if(dicId == null || dicId.length() == 0 || dicNm == null || dicNm.length() == 0 || dicVal == null){
				throw new Exception("参数错误");
			}
			
			if(this.dictionaryService.updateDic(dicId, dicNm, dicVal)){
				//notice the cache was changed
				List<String> idList = new ArrayList<String>();
				idList.add(dicId);
				
				this.acMq.sendTopic(new CacheChangedMsg(idList), ConstString.AcTopic_cacheChanger);
			}
			
			return JsonUtil.createSuccessJson(true, null, "更新成功", null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
