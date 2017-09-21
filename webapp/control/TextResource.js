/* global rdf:true */
sap.ui.define(["sap/ui/core/Control", "sap/m/Link", "sap/m/Text", "com/inova8/annotations/libs/rdf"], function(Control, Link, Text, rdf) {
	"use strict";
	return Control.extend("com.inova8.annotations.control.TextResource", {
		metadata: {
			properties: {
				path: {
					type: "string"
				},
				subjectId: {
					type: "string"
				},
				label: {
					type: "string"
				},
				comment: {
					type: "string"
				},
				withDescription: {
					type: "boolean",
					default: false
				},
				entitySet: {
					type: "string",
					defaultValue: "rdfs_Resource"
				}
			},
			aggregations: {
				_resource: {
					type: "sap.m.Link",
					multiple: false,
					visibility: "hidden"
				},
				_description: {
					type: "sap.m.Text",
					multiple: false
				}
			},
		},
		init: function() {
			this.resourceLink = new Link({
				target: "_blank"
			});
			this.setAggregation("_resource", this.resourceLink);
			this.resourceDescription = new Text({
				text: "abc"
			});
			this.setAggregation("_description", this.resourceDescription);
		},
		setPath: function(iPath) {
			this.setProperty("path", iPath, true);
			this.resourceDescription.bindProperty("text", {
				path: (iPath === "") ? "comment" : iPath + "/comment"
			});
			this.resourceLink.bindProperty("text", {
				path: (iPath === "") ? "label" : iPath + "/label"
			});
			this.resourceLink.bindProperty("href", {
				parts: [{
					path: (iPath === "") ? "subjectId" : iPath + "/subjectId",
					type: new sap.ui.model.type.String()
				}],
				formatter: function(subjectId) {
					if (subjectId === null) {
						return "";
					} else {
						return _expandPrefix(subjectId);
					}
				}
			});
		},
		renderer: function(oRM, oControl) {
			oRM.write("<div");
			oRM.writeControlData(oControl);
			oRM.addClass("resource");
			oRM.writeClasses();
			oRM.write(">");
			oRM.renderControl(oControl.getAggregation("_resource"));
			if (oControl.getProperty("withDescription")) {
				oRM.write("<p>");
				oRM.renderControl(oControl.getAggregation("_description"));
				oRM.write("</p>");
			}
			oRM.write("</div>");
		}
	});
});