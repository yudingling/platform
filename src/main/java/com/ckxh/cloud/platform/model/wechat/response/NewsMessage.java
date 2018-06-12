package com.ckxh.cloud.platform.model.wechat.response;

import java.util.List;

public class NewsMessage extends BaseMessage {

	private int ArticleCount;
	private List<Article> Articles;

	public List<Article> getArticles() {
		return Articles;
	}

	public void setArticles(List<Article> articles) {
		Articles = articles;
	}

	public int getArticleCount() {
		return ArticleCount;
	}

	public void setArticleCount(int articleCount) {
		ArticleCount = articleCount;
	}

	public NewsMessage() {
		super();
	}

	public NewsMessage(int articleCount, List<Article> articles) {
		ArticleCount = articleCount;
		Articles = articles;
	}

}
