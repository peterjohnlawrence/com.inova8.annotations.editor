sap.ui.define([
		"com/inova8/annotations/controller/BaseController"
	], function (BaseController) {
		"use strict";

		return BaseController.extend("com.inova8.annotations.controller.NotFound", {

			/**
			 * Navigates to the worklist when the link is pressed
			 * @public
			 */
			onLinkPressed : function () {
				this.getRouter().navTo("worklist");
			}

		});

	}
);