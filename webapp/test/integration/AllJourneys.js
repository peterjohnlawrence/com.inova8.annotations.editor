jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

sap.ui.require([
		"sap/ui/test/Opa5",
		"com/inova8/annotations/test/integration/pages/Common",
		"sap/ui/test/opaQunit",
		"com/inova8/annotations/test/integration/pages/Worklist",
		"com/inova8/annotations/test/integration/pages/Object",
		"com/inova8/annotations/test/integration/pages/NotFound",
		"com/inova8/annotations/test/integration/pages/Browser",
		"com/inova8/annotations/test/integration/pages/App"
	], function (Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "com.inova8.annotations.view."
	});

	sap.ui.require([
		"com/inova8/annotations/test/integration/WorklistJourney",
		"com/inova8/annotations/test/integration/ObjectJourney",
		"com/inova8/annotations/test/integration/NavigationJourney",
		"com/inova8/annotations/test/integration/NotFoundJourney"
	], function () {
		QUnit.start();
	});
});