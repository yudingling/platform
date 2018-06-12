package com.ckxh.cloud.platform.auth;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

import org.springframework.context.ApplicationListener;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.stereotype.Component;

import com.ckxh.cloud.base.util.ClassFinder;
import com.ckxh.cloud.persistence.common.auth.AuthPathBindHelper;
import com.ckxh.cloud.persistence.common.auth.Authorize;

@Component
public class AuthPathBindLoader implements ApplicationListener<ContextRefreshedEvent> {
	
	@Override
	public void onApplicationEvent(ContextRefreshedEvent arg0) {
		
		if(arg0.getApplicationContext().getParent() == null){
			//spring 对应的 servlet 所配置的  UrlPattern(见 web.xml 中配置)，在查找 RequestMapping 时，产生的路径需要加上这个前缀
			//这里没有通过程序的方式去获取，而是直接写死，没有做深入的研究， 先简单处理.  todo. may improve in future
			//value like: "/api"
			String springServletUrlPattern = "/platformApi";
			
			//直接扫 platform.api 下所有内容
			Set<Class<?>> classes = ClassFinder.getClasses("com.ckxh.cloud.platform.api");
			
			Map<String, String[]> retMap = new LinkedHashMap<String, String[]>();
			
			for(Class<?> entry : classes){
				
				AuthPathBindHelper.handleMethodBind(entry, retMap, springServletUrlPattern);
				
				AuthPathBindHelper.handleClassBind(entry, retMap, springServletUrlPattern);
			}
			
			Authorize.setBindMap(retMap);
		}
	}
}
