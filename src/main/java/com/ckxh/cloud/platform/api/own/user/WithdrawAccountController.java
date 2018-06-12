package com.ckxh.cloud.platform.api.own.user;

import java.sql.Timestamp;
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
import com.ckxh.cloud.base.annotation.AuthPathOnBind;
import com.ckxh.cloud.base.util.DateUtil;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.persistence.common.SysTool;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.model.MAIN_WITHDRAW_ACCOUNT;
import com.ckxh.cloud.persistence.db.user.service.UserInfoService;
import com.ckxh.cloud.platform.withdraw.WithdrawType;
import com.fasterxml.jackson.core.type.TypeReference;

@Scope("singleton")
@Controller
@RequestMapping("/own/user/normal/withdrawAccount")
public class WithdrawAccountController {
	@Autowired
	private UserInfoService userInfoService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String get(HttpServletRequest request, HttpServletResponse response){
		try{
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			List<MAIN_WITHDRAW_ACCOUNT> ret = this.userInfoService.getWithdrawAccounts(uid);
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(ret), null, null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.PUT)
	@AuthPathOnBind("get:/platformApi/own/user/normal/#")
	public String update(@RequestParam Long wdaId, @RequestParam int wdaType, @RequestParam String wdaAId, @RequestParam String wdaANm,
			HttpServletRequest request, HttpServletResponse response){
		try{
			if(wdaId == null || wdaAId == null || wdaAId.length() == 0 || wdaANm == null || wdaANm.length() == 0){
				throw new Exception("参数错误");
			}
			
			WithdrawType wdtp = WithdrawType.valueOf(wdaType);
			if(wdtp.equals(WithdrawType.UnKnow)){
				throw new Exception("参数错误");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			Timestamp ts = DateUtil.getCurrentTS();
			
			MAIN_WITHDRAW_ACCOUNT account = new MAIN_WITHDRAW_ACCOUNT(wdaId, uid, wdaType, wdaAId, wdaANm, ts, ts);
			boolean updated = this.userInfoService.updateWithdrawAccount(account);
			
			return JsonUtil.createSuccessJson(updated, null, updated? "更新成功" : "更新失败", null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.POST)
	@AuthPathOnBind("get:/platformApi/own/user/normal/#")
	public String post(@RequestParam int wdaType, @RequestParam String wdaAId, @RequestParam String wdaANm,
			HttpServletRequest request, HttpServletResponse response){
		try{
			if(wdaAId == null|| wdaANm == null || wdaANm.length() == 0){
				throw new Exception("参数错误");
			}
			
			WithdrawType wdtp = WithdrawType.valueOf(wdaType);
			if(wdtp.equals(WithdrawType.UnKnow)){
				throw new Exception("参数错误");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			Timestamp ts = DateUtil.getCurrentTS();
			
			MAIN_WITHDRAW_ACCOUNT account = new MAIN_WITHDRAW_ACCOUNT(SysTool.longUuid(), uid, wdaType, wdaAId, wdaANm, ts, ts);
			boolean saved = this.userInfoService.saveWithdrawAccount(account);
			if(saved){
				return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(account), "添加成功", null);
			}else{
				return JsonUtil.createSuccessJson(false, null, "添加失败", null);
			}
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.DELETE)
	@AuthPathOnBind("get:/platformApi/own/user/normal/#")
	public String delete(@RequestParam String wdaIds, HttpServletRequest request, HttpServletResponse response){
		try{
			if(wdaIds == null || wdaIds.length() == 0){
				throw new Exception("参数错误");
			}
			
			List<Long> wdaIdList = MsgPackUtil.deserialize(wdaIds, new TypeReference<List<Long>>(){});
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			this.userInfoService.deleteWithdrawAccount(uid, wdaIdList);
			
			return JsonUtil.createSuccessJson(true, null, "删除成功", null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
