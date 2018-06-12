package com.ckxh.cloud.platform.util.weipay;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import org.dom4j.Document;
import org.dom4j.Element;
import org.dom4j.io.SAXReader;

import com.ckxh.cloud.base.util.LogUtil;
import com.ckxh.cloud.platform.util.CloseStream;

public class XMLUtil {

	@SuppressWarnings({ "unchecked", "rawtypes" })
	public static Map<String, String> doXMLParse(String strxml) {
		strxml = strxml.replaceFirst("encoding=\".*\"", "encoding=\"UTF-8\"");
		if (null == strxml || "".equals(strxml)) {
			return null;
		}

		Map<String, String> m = new HashMap<String, String>();
		InputStream is = null;
		try {
			is = new ByteArrayInputStream(strxml.getBytes(StandardCharsets.UTF_8));
			SAXReader reader = new SAXReader();

			Document doc = reader.read(is);
			Element root = doc.getRootElement();
			List<Object> list = root.elements();
			Iterator it = list.iterator();
			while (it.hasNext()) {
				Element e = (Element) it.next();
				String k = e.getName();
				String v = "";

				List<Object> children = e.elements();
				if (children.isEmpty()) {
					v = e.getText();
				} else {
					v = XMLUtil.getChildrenText(children);
				}
				m.put(k, v);
			}
			return m;
		} catch (Exception e) {
			LogUtil.error(e);
		} finally {
			CloseStream.close(is);
		}
		return null;
	}

	@SuppressWarnings("rawtypes")
	public static String getChildrenText(List children) {
		StringBuffer sb = new StringBuffer();
		if (!children.isEmpty()) {
			Iterator it = children.iterator();
			while (it.hasNext()) {
				Element e = (Element) it.next();
				String name = e.getName();
				String value = e.getText();
				List list = e.elements();
				sb.append("<" + name + ">");
				if (!list.isEmpty()) {
					sb.append(XMLUtil.getChildrenText(list));
				}
				sb.append(value);
				sb.append("</" + name + ">");
			}
		}
		return sb.toString();
	}
}
