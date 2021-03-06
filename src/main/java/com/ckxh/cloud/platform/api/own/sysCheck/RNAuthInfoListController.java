package com.ckxh.cloud.platform.api.own.sysCheck;

import java.text.SimpleDateFormat;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.persistence.db.user.service.UserInfoService;
import com.ckxh.cloud.persistence.model.SysManualCheckResult;

@Scope("singleton")
@Controller
@RequestMapping("/own/sysCheck/user/rNAuthInfoList")
public class RNAuthInfoListController {
	@Autowired
	private UserInfoService userInfoService;

	@ResponseBody
	@RequestMapping(method = RequestMethod.GET)
	public String get(@RequestParam(required = false) String search, @RequestParam int result, @RequestParam int start, @RequestParam int length,HttpServletRequest request, HttpServletResponse response) {
		try {
			if(start < 0 || length < 0){
				throw new Exception("参数异常");
			}
			
			SysManualCheckResult scResult = SysManualCheckResult.valueOf(result);
		
			Object[] userRnauthInfoList = this.userInfoService.getUserRnauthInfoList(search, scResult, start, length);

			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(userRnauthInfoList, new SimpleDateFormat("yyyy/MM/dd")), null, null);
		} catch (Exception ex) {
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
