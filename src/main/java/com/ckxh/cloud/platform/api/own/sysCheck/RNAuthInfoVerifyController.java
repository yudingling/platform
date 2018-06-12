package com.ckxh.cloud.platform.api.own.sysCheck;

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
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.user.service.UserInfoService;
import com.ckxh.cloud.persistence.model.SysManualCheckResult;

@Scope("singleton")
@Controller
@RequestMapping("/own/sysCheck/user/rNAuthInfoVerify")
public class RNAuthInfoVerifyController {
	@Autowired
	private UserInfoService userInfoService;

	@ResponseBody
	@RequestMapping(method = RequestMethod.PUT)
	public String update(@RequestParam String uid, @RequestParam(required = false) String rna_info, @RequestParam int rna_result, HttpServletRequest request, HttpServletResponse response) {
		try {	
			if (uid == null || uid.isEmpty()) {
				throw new Exception("参数错误");
			}
			
			SysManualCheckResult scResult = SysManualCheckResult.valueOf(rna_result);
			String rna_uid = AuthUtil.getIdFromSession(request.getSession());
			
			boolean updated = this.userInfoService.updateUserRnauthInfo(uid, rna_info, scResult, rna_uid);

			return JsonUtil.createSuccessJson(updated, null, updated ? "更新成功" : "更新失败", null);
		} catch (Exception ex) {
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
