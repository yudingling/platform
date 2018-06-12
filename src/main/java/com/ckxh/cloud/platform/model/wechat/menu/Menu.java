package com.ckxh.cloud.platform.model.wechat.menu;


public class Menu {
    private Button[] button;

    public Button[] getButton() {
        return button;
    }

    public void setButton(Button[] button) {
        this.button = button;
    }

	public Menu() {
		super();
	}

	public Menu(Button[] button) {
		this.button = button;
	}
}
