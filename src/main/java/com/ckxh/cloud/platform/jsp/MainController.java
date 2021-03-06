package com.ckxh.cloud.platform.jsp;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

/**
 * main 目录下 jsp 的访问 controller
 * @author zuodan
 *
 */
@Scope("singleton")
@Controller
public class MainController {
	
	@RequestMapping(path="/{jspName}", method=RequestMethod.GET)
	public String get(@PathVariable String jspName, HttpServletRequest request, HttpServletResponse response){
		return jspName;
	}
}
