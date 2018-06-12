package com.ckxh.cloud.platform.util;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.OutputStreamWriter;

import com.ckxh.cloud.base.util.LogUtil;

public class CloseStream {
	public static void close(InputStream is) {
		if (is != null) {
			try {
				is.close();
			} catch (IOException e) {
				LogUtil.error(e);
			}
		}
	}
	
	public static void close(OutputStream os) {
		if (os != null) {
			try {
				os.close();
			} catch (IOException e) {
				LogUtil.error(e);
			}
		}
	}


	public static void close(InputStream is, InputStreamReader isr, BufferedReader in) {
		if (is != null) {
			try {
				is.close();
			} catch (IOException e) {
				LogUtil.error(e);
			}
		}

		if (isr != null) {
			try {
				isr.close();
			} catch (IOException e) {
				LogUtil.error(e);
			}
		}

		if (in != null) {
			try {
				in.close();
			} catch (IOException e) {
				LogUtil.error(e);
			}
		}
	}

	public static void close(OutputStream os, OutputStreamWriter osw, BufferedWriter out) {
		if (os != null) {
			try {
				os.close();
			} catch (IOException e) {
				LogUtil.error(e);
			}
		}

		if (osw != null) {
			try {
				osw.close();
			} catch (IOException e) {
				LogUtil.error(e);
			}
		}

		if (out != null) {
			try {
				out.close();
			} catch (IOException e) {
				LogUtil.error(e);
			}
		}
	}
}
