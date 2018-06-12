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
import com.ckxh.cloud.base.daemon.ProtectDaemon;
import com.ckxh.cloud.base.util.Encrypt;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.LogUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.persistence.common.SysTool;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.model.MAIN_USER;
import com.ckxh.cloud.persistence.db.model.MAIN_WITHDRAW;
import com.ckxh.cloud.persistence.db.model.MAIN_WITHDRAW_ACCOUNT;
import com.ckxh.cloud.persistence.db.user.service.UserInfoService;
import com.ckxh.cloud.platform.withdraw.WDResult;
import com.ckxh.cloud.platform.withdraw.Withdraw;
import com.ckxh.cloud.platform.withdraw.WithdrawType;

@Scope("singleton")
@Controller
@RequestMapping("/own/user/normal/withdraw")
public class WithdrawController extends ProtectDaemon {
	@Autowired
	private UserInfoService userInfoService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String get(@RequestParam int start, @RequestParam int length, HttpServletRequest request, HttpServletResponse response){
		try{
			if(start < 0 || length <= 0){
				throw new Exception("参数错误");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			Object[] retData = this.userInfoService.getUserWithdrawList(uid, start, length);
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(retData), null, null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.POST)
	@AuthPathOnBind("get:/platformApi/own/user/normal/#")
	public String post(@RequestParam Long wdaId, @RequestParam double amount, @RequestParam String pwd,
			HttpServletRequest request, HttpServletResponse response){
		try{
			if(wdaId == null || amount <= 0 || pwd == null || pwd.length() == 0){
				throw new Exception("参数错误");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			MAIN_USER dbUser = this.userInfoService.getUserInfo_fromDB(uid);
			
			if(!Encrypt.SHA1(pwd).equals(dbUser.getU_PWD())){
				throw new Exception("密码错误");
			}
			
			MAIN_WITHDRAW_ACCOUNT account = this.userInfoService.getWithdrawAccount(uid, wdaId);
			WithdrawType wdtp = WithdrawType.valueOf(account.getWDA_TP());
			
			WDResult chk = Withdraw.accountLegal(wdtp, account);
			if(chk == null || !chk.isSuccess()){
				throw new Exception(chk != null ? chk.getError() : "账户非法");
			}
			
			amount = Withdraw.getAvailAmount(wdtp, amount);
			if(amount <= 0){
				throw new Exception("金额错误");
			}
			
			if(dbUser.getU_PROFIT() < amount){
				throw new Exception("余额不足");
			}
			
			MAIN_WITHDRAW wd = this.userInfoService.createWithdraw(account, amount);
			if(wd != null){
				WDResult ret = Withdraw.doWithdraw(wdtp, account, amount, wd.getWD_ID());
				
				if(ret != null && ret.isSuccess()){
					this.writeBack(SysTool.longUuidInLocal(), new Object[]{wd, true});
					return JsonUtil.createSuccessJson(true, null, "提现成功, 请注意查收" , null);
					
				}else{
					//roll back
					this.writeBack(SysTool.longUuidInLocal(), new Object[]{wd, false});
					return JsonUtil.createSuccessJson(false, null, ret != null ? ret.getError() : "提现失败" , null);
				}
				
			}else{
				return JsonUtil.createSuccessJson(false, null, "提现失败, 余额不足或出现内部异常" , null);
			}
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}

	@Override
	protected boolean done(Object data) {
		try{
			Object[] params = (Object[]) data;
			
			if((boolean) params[1]){
				this.userInfoService.updateOnWithdrawSuccess((MAIN_WITHDRAW) params[0]);
			}else{
				this.userInfoService.updateOnWithdrawFail((MAIN_WITHDRAW) params[0]);
			}
			
			return true;
			
		}catch(Exception ex){
			LogUtil.error(ex);
			
			return false;
		}
	}
}
