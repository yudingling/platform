package com.ckxh.cloud.platform.api.own.user;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import com.ckxh.cloud.base.annotation.AuthPathOnBind;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.base.util.Validator;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.model.MAIN_USER_RNAUTH;
import com.ckxh.cloud.persistence.db.user.service.UserInfoService;

@Scope("singleton")
@Controller
@RequestMapping("/own/user/normal/rNAuthInfo")
public class RNAuthInfoController {
	@Autowired
	private UserInfoService userInfoService;

	@ResponseBody
	@RequestMapping(method = RequestMethod.GET)
	public String get(HttpServletRequest request, HttpServletResponse response) {
		try {
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			MAIN_USER_RNAUTH userRnauthInfo = this.userInfoService.getUserRnauthInfo(uid);

			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(userRnauthInfo), null, null);
		} catch (Exception ex) {
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}

	@ResponseBody
	@RequestMapping(method = RequestMethod.PUT)
	@AuthPathOnBind("get:/platformApi/own/user/normal/#")
	public String update(@RequestParam String name, @RequestParam String idNumber, @RequestParam Long idPhotoAId,
			@RequestParam Long idPhotoBId, HttpServletRequest request, HttpServletResponse response) {
		try {
			if (name == null || name.isEmpty() || idNumber == null || idNumber.isEmpty() || idPhotoAId == null || idPhotoBId == null) {
				throw new Exception("参数错误");
			}

			if (!Validator.isCardNo(idNumber)) {
				throw new Exception("身份证格式错误");
			}

			String uid = AuthUtil.getIdFromSession(request.getSession());
			boolean updated = this.userInfoService.updateUserRnauthInfo(uid, idNumber, name, idPhotoAId, idPhotoBId);
			
			MAIN_USER_RNAUTH rnInfo = null;
			if(updated){
				rnInfo = this.userInfoService.getUserRnauthInfo(uid);
			}
			
			return JsonUtil.createSuccessJson(updated, MsgPackUtil.serialize2Str(rnInfo), updated ? "更新成功" : "更新失败", null);
		} catch (Exception ex) {
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
