sap.ui.define([
	"com/inova8/annotations/controller/BaseController",
	"sap/ui/model/json/JSONModel", "sap/ui/core/routing/History",
	"sap/m/MessageBox"

], function(BaseController, JSONModel, History, MessageBox) {
	"use strict";

	return BaseController.extend("com.inova8.annotations.controller.Object", {

		_oBinding: {},

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		onInit: function() {
			var that = this;
			this.getRouter().getTargets().getTarget("object").attachDisplay(null, this._onDisplay, this);

			//	this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

			this._oODataModel = this.getOwnerComponent().getModel();
			this._oResourceBundle = this.getResourceBundle();
			this._oViewModel = new JSONModel({
				enableCreate: false, //,
				delay: 0,
				busy: false,
				mode: "create",
				viewTitle: "",
				fullEdit: true,
				keyword: true
			});
			this.setModel(this._oViewModel, "viewModel");
			this._oKeywordModel = new sap.ui.model.json.JSONModel({
				keywords: "",
				formattedtext: ""
			});
			this.setModel(this._oKeywordModel, "keywordModel");
			// Register the view with the message manager
			sap.ui.getCore().getMessageManager().registerObject(this.getView(), true);
			var oMessagesModel = sap.ui.getCore().getMessageManager().getMessageModel();
			this._oBinding = new sap.ui.model.Binding(oMessagesModel, "/", oMessagesModel.getContext("/"));
			this._oBinding.attachChange(function(oEvent) {
				var aMessages = oEvent.getSource().getModel().getData();
				for (var i = 0; i < aMessages.length; i++) {
					if (aMessages[i].type === "Error" && !aMessages[i].technical) {
						that._oViewModel.setProperty("/enableCreate", false);
					}
				}
			});

			var iOriginalBusyDelay,
				oViewModel = new JSONModel({
					busy: false,
					delay: 0
				});

			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

			// Store original busy indicator delay, so it can be restored later on
			iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();
			this.setModel(oViewModel, "objectView");
			this.getOwnerComponent().getModel().metadataLoaded().then(function() {
				// Restore original busy indicator delay for the object view
				//	oViewModel.setProperty("/delay", iOriginalBusyDelay);
			});
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Event handler (attached declaratively) for the view save button. Saves the changes added by the user. 
		 * @function
		 * @public
		 */
		onRichText: function() {
			if (this._oViewModel.getProperty("/fullEdit")) {
				this._oViewModel.setProperty("/fullEdit", false);
			} else {
				this._oViewModel.setProperty("/fullEdit", true);
			}
		},
		onKeyword: function() {
			if (this._oViewModel.getProperty("/keyword")) {
				this._oViewModel.setProperty("/keyword", false);
			} else {
				this._oViewModel.setProperty("/keyword", true);
			}
		},
		onBlur: function(oEvent) {
			var keywordsObject = oEvent.getParameters().keywords;
			var suggestedkeywords = "";
			for (var keyword in keywordsObject) {
				if (keywordsObject.hasOwnProperty(keyword)) {
					suggestedkeywords += "<strong>" + keyword + "</strong>(" + keywordsObject[keyword].length + "@[" + keywordsObject[keyword].join(
							',') +
						"]) ";
				}
			}
			this._oKeywordModel.setProperty("/keywords", suggestedkeywords);
			this._oKeywordModel.setProperty("/formattedText", oEvent.getParameters().formattedText);
		},
		onVerify: function() {
			var that = this,
				oModel = this.getModel();
			// abort if the  model has not been changed
			if (!oModel.hasPendingChanges()) {
				MessageBox.information(
					"Nothing has changed!", {
						id: "noChangesInfoMessageBox",
						styleClass: that.getOwnerComponent().getContentDensityClass()
					}
				);
				return;
			}
			if (this._oViewModel.getProperty("/mode") === "edit") {
				// attach to the request completed event of the batch
				MessageBox.information(
					"This would send text for verification", {
						id: "noChangesInfoMessageBox",
						styleClass: that.getOwnerComponent().getContentDensityClass()
					}
				);

			}
		},
		onDelete: function(oEvent) {
			var entity = oEvent.getSource().getBindingContext().getPath();
			this._showConfirmDelete(entity);

		},
		onSave: function() {
			var that = this,
				oModel = this.getModel();

			// abort if the  model has not been changed
			if (!oModel.hasPendingChanges()) {
				MessageBox.information(
					this._oResourceBundle.getText("noChangesMessage"), {
						id: "noChangesInfoMessageBox",
						styleClass: that.getOwnerComponent().getContentDensityClass()
					}
				);
				return;
			}
			//TODO temporary for debugging	this.getModel("appView").setProperty("/busy", true);
			if (this._oViewModel.getProperty("/mode") === "edit") {
				// attach to the request completed event of the batch
				oModel.attachEventOnce("batchRequestCompleted", function(oEvent) {
					if (that._checkIfBatchRequestSucceeded(oEvent)) {
						that._fnUpdateSuccess();
					} else {
						that._fnEntityCreationFailed();
						MessageBox.error(that._oResourceBundle.getText("updateError"));
					}
				});
			}

			//Assume only one changed at a time
			var pendingChanges = oModel.getPendingChanges();
			var pendingChange = pendingChanges[Object.keys(pendingChanges)[0]];
			var pendingEntity = (Object.keys(pendingChanges)[0]);

			//Now need to distiguish between an Update and a Create
			if (this._oViewModel.getProperty("/mode") === "edit") {
				//assume create so add all the bits required
				var updateEntry = this.buildEntry(pendingChange);
				//because we cannot do deep or associative inserts 
				oModel.resetChanges();
				oModel.update("/" + pendingEntity, updateEntry);

			} else {
				//assume create so add all the bits required
				pendingEntity = pendingEntity.replace("id-", "annotation_pending~");
				var positionKey = pendingEntity.indexOf("('");
				var pendingKey = pendingEntity.substring(positionKey + 2, pendingEntity.length - 2);
				var createEntry = this.buildEntry(pendingChange);
				createEntry.subjectId = pendingKey;
				createEntry.label = pendingKey;
				createEntry.substanceAnnotation_bodyText = that.getView().byId("substanceAnnotation_bodyText_id").getValue();
				//TODO Date not being added to pending for some reason. Add manually using this format: 2017-07-26T11:00:22.298
				createEntry["substanceAnnotation_annotationCreated"] = that.getView().byId("substanceAnnotation_annotationCreated_id").getDateValue()
					.toISOString().slice(0, 23);

				//because we cannot do deep or associative inserts 
				oModel.resetChanges();
				oModel.create("/SubstanceAnnotation", createEntry);
			}

		},
		buildEntry: function(pendingChange) {
			var entry = {};
			for (var property in pendingChange) {
				if ((property !== "__metadata") && (pendingChange[property] !== undefined)) {
					if (pendingChange[property] instanceof Date) {
						entry[property] = pendingChange[property];
					} else if (pendingChange[property] instanceof Object) {
						entry[property] = {
							__metadata: {
								uri: pendingChange[property]["__metadata"]["uri"]
							}
						};

					} else {
						entry[property] = pendingChange[property];
					}
				}
			}
			return entry;
		},
		/**
		 * Event handler  for navigating back.
		 * It there is a history entry we go one step back in the browser history
		 * If not, it will replace the current entry of the browser history with the worklist route.
		 * @public
		 */
		onNavBack: function() {
			var sPreviousHash = History.getInstance().getPreviousHash();

			if (sPreviousHash !== undefined) {
				history.go(-1);
			} else {
				this._navBack();
			}
		},

		/**
		 * Event handler (attached declaratively) for the view cancel button. Asks the user confirmation to discard the changes. 
		 * @function
		 * @public
		 */
		onCancel: function() {
			// check if the model has been changed
			if (this.getModel().hasPendingChanges()) {
				// get user confirmation first
				this._showConfirmQuitChanges(); // some other thing here....
			} else {
				this.getModel("appView").setProperty("/addEnabled", true);
				// cancel without confirmation
				this._navBack();
			}
		},

		/* =========================================================== */
		/* Internal functions
		/* =========================================================== */

		/**
		 * Binds the view to the object path.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched: function(oEvent) {
			var sObjectId = oEvent.getParameter("arguments").objectId;
			this.getModel().metadataLoaded().then(function() {
				var sObjectPath = this.getModel().createKey("SubstanceAnnotation", {
					subjectId: sObjectId
				});
				this._bindView("/" + sObjectPath);
			}.bind(this));
		},
		/**
		 * Binds the view to the object path.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound
		 * @private
		 */
		_bindView: function(sObjectPath) {
			var oViewModel = this.getModel("objectView"),
				oDataModel = this.getModel();

			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this)
				}
			});
		},

		_checkIfBatchRequestSucceeded: function(oEvent) {
			var oParams = oEvent.getParameters();
			var aRequests = oEvent.getParameters().requests;
			var oRequest;
			if (oParams.success) {
				if (aRequests) {
					for (var i = 0; i < aRequests.length; i++) {
						oRequest = oEvent.getParameters().requests[i];
						if (!oRequest.success) {
							return false;
						}
					}
				}
				return true;
			} else {
				return false;
			}
		},
		/**
		 * Navigates back in the browser history, if the entry was created by this app.
		 * If not, it navigates to the Details page
		 * @private
		 */
		_navBack: function() {
			var oHistory = sap.ui.core.routing.History.getInstance(),
				sPreviousHash = oHistory.getPreviousHash();

			this.getView().unbindObject();
			if (sPreviousHash !== undefined) {
				// The history contains a previous entry
				history.go(-1);
			} else {
				this.getRouter().getTargets().display("worklist");
			}
		},

		/**
		 * Opens a dialog letting the user either confirm or cancel the quit and discard of changes.
		 * @private
		 */
		_showConfirmQuitChanges: function() {
			var oComponent = this.getOwnerComponent(),
				oModel = this.getModel();
			var that = this;
			MessageBox.confirm(
				this._oResourceBundle.getText("confirmCancelMessage"), {
					styleClass: oComponent.getContentDensityClass(),
					onClose: function(oAction) {
						if (oAction === sap.m.MessageBox.Action.OK) {
							that.getModel("appView").setProperty("/addEnabled", true);
							oModel.resetChanges();
							that._navBack();
						}
					}
				}
			);
		},
		/**
		 * Opens a dialog letting the user either confirm or cancel the quit and discard of changes.
		 * @private
		 */
		_showConfirmDelete: function(entity) {
			var oComponent = this.getOwnerComponent(),
				oModel = this.getModel();
			var that = this;
			MessageBox.confirm(
				this._oResourceBundle.getText("confirmDeleteMessage"), {
					styleClass: oComponent.getContentDensityClass(),
					onClose: function(oAction) {
						if (oAction === sap.m.MessageBox.Action.OK) {
							oModel.remove(entity, {
								method: "DELETE",
								success: function(data) {
									that._navBack();
								},
								error: function(e) {
									sap.m.MessageBox.error("Cannot confirm delet, a problem occurred", {
										title: "Delete Error", // default
										onClose: null, // default
										styleClass: "", // default
										initialFocus: null, // default
										textDirection: sap.ui.core.TextDirection.Inherit // default
									});
								}
							});
						}
					}
				}
			);
		},
		/**
		 * Prepares the view for editing the selected object
		 * @param {sap.ui.base.Event} oEvent the  display event
		 * @private
		 */
		_onEdit: function(oEvent) {
			var oData = oEvent.getParameter("data"),
				oView = this.getView();
			this._oViewModel.setProperty("/mode", "edit");
			this._oViewModel.setProperty("/enableCreate", true);
			this._oViewModel.setProperty("/viewTitle", this._oResourceBundle.getText("editViewTitle"));

			oView.bindElement({
				path: oData.objectPath
			});
			//Clear the formatted text and keywords since new edit
			this._oKeywordModel.setProperty("/keywords", "");
			this._oKeywordModel.setProperty("/formattedText", "");
		},

		/**
		 * Prepares the view for creating new object
		 * @param {sap.ui.base.Event} oEvent the  display event
		 * @private
		 */

		_onCreate: function(oEvent) {
			if (oEvent.getParameter("name") && oEvent.getParameter("name") !== "create") {
				this._oViewModel.setProperty("/enableCreate", false);
				this.getRouter().getTargets().detachDisplay(null, this._onDisplay, this);
				this.getView().unbindObject();
				return;
			}
			this._oViewModel.setProperty("/viewTitle", this._oResourceBundle.getText("createViewTitle"));
			this._oViewModel.setProperty("/mode", "create");
			//TODO initialize data from any query paramters on Edit line
			var oContext = this._oODataModel.createEntry("SubstanceAnnotation", {
				properties: {
					substanceAnnotation_annotationCreated: new Date()
				},
				success: this._fnEntityCreated.bind(this),
				error: this._fnEntityCreationFailed.bind(this)
			});
			this.getView().setBindingContext(oContext);
			//Clear the formatted text and keywords since new edit
			this._oKeywordModel.setProperty("/keywords", "");
			this._oKeywordModel.setProperty("/formattedText", "");
		},

		/**
		 * Checks if the save button can be enabled
		 * @private
		 */
		_validateSaveEnablement: function() {
			var aInputControls = this._getFormFields(this.byId("newEntitySimpleForm"));
			var oControl;
			for (var m = 0; m < aInputControls.length; m++) {
				oControl = aInputControls[m].control;
				if (aInputControls[m].required) {
					var sValue = oControl.getValue();
					if (!sValue) {
						this._oViewModel.setProperty("/enableCreate", false);
						return;
					}
				}
			}
			this._checkForErrorMessages();
		},

		/**
		 * Checks if there is any wrong inputs that can not be saved.
		 * @private
		 */

		_checkForErrorMessages: function() {
			var aMessages = this._oBinding.oModel.oData;
			if (aMessages.length > 0) {
				var bEnableCreate = true;
				for (var i = 0; i < aMessages.length; i++) {
					if (aMessages[i].type === "Error" && !aMessages[i].technical) {
						bEnableCreate = false;
						break;
					}
				}
				this._oViewModel.setProperty("/enableCreate", bEnableCreate);
			} else {
				this._oViewModel.setProperty("/enableCreate", true);
			}
		},

		/**
		 * Handles the success of updating an object
		 * @private
		 */
		_fnUpdateSuccess: function() {
			this.getModel("appView").setProperty("/busy", false);
			this._navback();
			/*			this.getView().unbindObject();
						this.getRouter().getTargets().display("object");*/
		},

		/**
		 * Handles the success of creating an object
		 *@param {object} oData the response of the save action
		 * @private
		 */
		_fnEntityCreated: function(oData) {
			var sObjectPath = this.getModel().createKey("SubstanceAnnotation", oData);
			this.getModel("appView").setProperty("/itemToSelect", "/" + sObjectPath); //save last created
			this.getModel("appView").setProperty("/busy", false);
			this.getRouter().getTargets().display("object");
		},

		/**
		 * Handles the failure of creating/updating an object
		 * @private
		 */
		_fnEntityCreationFailed: function() {
			this.getModel("appView").setProperty("/busy", false);
		},

		/**
		 * Handles the onDisplay event which is triggered when this view is displayed 
		 * @param {sap.ui.base.Event} oEvent the on display event
		 * @private
		 */
		_onDisplay: function(oEvent) {
			var oData = oEvent.getParameter("data");
			if (oData && oData.mode === "update") {
				this._onEdit(oEvent);
			} else {
				this._onCreate(oEvent);
			}
		},

		/**
		 * Gets the form fields
		 * @param {sap.ui.layout.form} oSimpleForm the form in the view.
		 * @private
		 */
		_getFormFields: function(oSimpleForm) {
			var aControls = [];
			var aFormContent = oSimpleForm.getContent();
			var sControlType;
			for (var i = 0; i < aFormContent.length; i++) {
				sControlType = aFormContent[i].getMetadata().getName();
				if (sControlType === "sap.m.Input" || sControlType === "sap.m.DateTimeInput" || sControlType ===
					"com.inova8.annotations.control.InputResource" ||
					sControlType === "sap.m.CheckBox" || sControlType === "sap.m.TextArea" || sControlType === "sap.m.DateTimePicker") {
					aControls.push({
						control: aFormContent[i],
						required: aFormContent[i].getRequired && aFormContent[i].getRequired()
					});
				}
			}
			return aControls;
		}
	});

});