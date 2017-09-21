sap.ui.define(["sap/ui/core/Control", "sap/m/Input", "sap/ui/model/Filter", "sap/ui/model/Context"], function(Control, Input, Filter,
	Context) {
	"use strict";
	return Control.extend("com.inova8.annotations.control.InputResource", {
		metadata: {
			properties: {
				path: {
					type: "string"
				},
				boundContext: {
					type: "object"
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
				entitySet: {
					type: "string",
					defaultValue: "Contributor"
				},
				required: {
					type: "boolean",
					defaultValue: false
				}
			},
			aggregations: {
				_resource: {
					type: "sap.m.Input",
					multiple: false,
					visibility: "hidden"
				}
			}
		},
		init: function() {
			this.resourceLabel = new Input({
				showValueHelp: true,
				valueHelpRequest: this.handleValueHelp
			});
			this.setAggregation("_resource", this.resourceLabel);
		},
		setPath: function(iPath) {
			this.setProperty("path", iPath, true);
			this.resourceLabel.bindProperty("value", {
				path: iPath + "/label"
			});
		},
		getValue: function() {
			return	this.resourceLabel.getValue();
		},
		handleValueHelp: function(oEvent) {
			//Since this is launched from a fragment with this as its controller
			var thisParent = this.getParent();
			var sInputValue = oEvent.getSource().getValue();
			thisParent.setProperty("boundContext", thisParent.getBindingContext());
			thisParent.input = oEvent.getSource();
			// create value help dialog *always*
			//	if (!this._valueHelpDialog) 
			{
				this._valueHelpDialog = sap.ui.xmlfragment(
					"com.inova8.annotations.fragment.ResourceDialog",
					this
				);
				this._valueHelpDialog.setModel(this.getModel());
				this._valueHelpDialog.setTitle(thisParent.getEntitySet());

				var itemTemplate = new sap.m.CustomListItem({
					content: [new com.inova8.annotations.control.TextResource({
						path: "",
						entitySet: thisParent.getEntitySet()
					})]
				});
				//	this._valueHelpDialog.setBindingContext(thisParent.getBindingContext());
				this._valueHelpDialog.bindAggregation("items", {
					path: "/" + thisParent.getEntitySet(),
					template: itemTemplate
				});
				this._valueHelpDialog.attachSearch(thisParent._handleValueHelpSearch, thisParent);
				this._valueHelpDialog.attachConfirm(thisParent._handleValueHelpClose, thisParent);
				this._valueHelpDialog.attachCancel(thisParent._handleValueHelpClose, thisParent);
			}
			// open value help dialog filtered by the input value
			this._valueHelpDialog.open(sInputValue);
		},
		_handleValueHelpSearch: function(evt) {
			var sValue = evt.getParameter("value");
			var oFilter = new Filter(
				"label",
				sap.ui.model.FilterOperator.Contains, sValue
			);
			evt.getSource().getBinding("items").filter([oFilter]);
		},
		_handleValueHelpClose: function(evt) {
			//Since this is launched from a fragment with this as its controller
			var thisParent = this.getParent();
			var oSelectedItem = evt.getParameter("selectedItem");
			if (oSelectedItem) {
				var newResourcePath = oSelectedItem.getBindingContext().getPath();
				var currentModel = thisParent.getBindingContext().getModel();
				this.currentResource = currentModel.getObject(this.getProperty("path"), thisParent.getBindingContext());
				var targetEntityKey = ""; // "('"+ this.currentResource.subjectId.replace(':','%3A')+"')";
				if (this.currentResource) {
					//delete this.currentResource;
					/*					currentModel.remove(thisParent.getBindingContext() + "/$links/" + this.getProperty("path")+targetEntityKey, null, function() {
											currentModel.refresh(true);
											var pendingChanges = currentModel.getPendingChanges();
											var newResource = currentModel.getObject(newResourcePath);
											//	var updated = currentModel.setProperty(this.getProperty("path"), newResource, thisParent.getBindingContext(), false);
											var updated = currentModel.setProperty(this.getProperty("path"), newResource, thisParent.getBindingContext());
										}, function() {
											alert("Delete failed");
										});*/

				} else {
					var pendingChanges = currentModel.getPendingChanges();
					var newResource = currentModel.getObject(newResourcePath);
					//	var updated = currentModel.setProperty(this.getProperty("path"), newResource, thisParent.getBindingContext(), false);
					var updated = currentModel.setProperty(this.getProperty("path"), newResource, thisParent.getBindingContext());
				}

			}
		},
		renderer: function(oRM, oControl) {
			oRM.write("<div");
			oRM.writeControlData(oControl);
			oRM.addClass("resource");
			oRM.writeClasses();
			oRM.write(">");
			oRM.renderControl(oControl.getAggregation("_resource"));
			oRM.write("</div>");
		}
	});
});