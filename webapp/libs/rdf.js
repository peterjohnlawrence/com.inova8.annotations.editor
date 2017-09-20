function _expandPrefix(decodedEntityKey) {
	var colon = decodedEntityKey.indexOf(':');
	if (colon < 0)
		return decodedEntityKey;
	else {
		var uri = _prefixToURI(decodedEntityKey.substring(0, colon));
		return uri == null ? decodedEntityKey : uri + decodedEntityKey.substring(colon + 1);
	}
}

function _prefixToURI(prefix) {
	var prefixToURI = sap.ui.getCore().getModel("prefixes").getData().prefixes;
	var url = prefixToURI[prefix];
	if (url === undefined) {
		var prefixElements = prefix.split("_");
		if (prefixElements.length > 0) {
			for (var i = prefixElements.length - 1; i > 0; i--) {
				var subPrefix = prefixElements.slice(0, i).join("_");
				if (prefixToURI[subPrefix] !== undefined) {
					var constructedUrl= prefixToURI[subPrefix];
					for(var j = i; j < prefixElements.length ; j++){
						constructedUrl += prefixElements[j] + "/";
					}
					prefixToURI[prefix] = constructedUrl;
					return constructedUrl;
				}
				return "";
			}
		} else {
			return "";
		}
	} else {
		return prefixToURI[prefix];
	}

}

function proxy(url, useProxy) {
	if (useProxy) {
		return url.replace("http://", "proxy/http/");
	} else {
		return url;
	}
}

function lensUriLabel(uri, sSubjectId, sLabel) {
	if (sLabel) {
		return sLabel;
	} else if (sSubjectId) {
		return decodeURIComponent(sSubjectId);
	} else
		return jQuery.isEmptyObject(uri) ? "" : decodeURIComponent(decodeURIComponent(uri).split("/").pop());
}

function lensUri(uri, type, serviceCode, sSubjectId, sLabel) {
	// Workaround to avoid issue with sapui5 router that will not ignore '=' even if encoded
	return jQuery.isEmptyObject(uri) ? "" : ".." + document.location.pathname + "#/" + serviceCode + "/lens?type=" + type + "&uri=" + uri.replace(
		/=/g, "~") + "&label=" + lensUriLabel(uri, sSubjectId, sLabel);
}

function lensDeferredUriLabel(uri, sSubjectId, sLabel) {
	var navProperty;
	if (jQuery.isEmptyObject(uri)) {
		navProperty = "";
	} else {
		navProperty = decodeURIComponent(decodeURIComponent(uri).split("/").pop());
	}
	if (sLabel) {
		return sLabel + "/" + navProperty;
	} else if (sSubjectId) {
		return decodeURIComponent(sSubjectId) + "/" + navProperty;
	} else {
		return navProperty;
	}
}

function lensDeferredUri(uri, serviceCode, sSubjectId, sLabel, me) {
	if (jQuery.isEmptyObject(uri)) {
		return "";
	} else {
		var parts = uri.split("/");
		var collection = parts.pop();
		// Workaround to avoid issue with sapui5 router that will not ignore '=' even if encoded
		return ".." + document.location.pathname + "#/" + serviceCode + "/lens?deferred=true&type=" + me.deferredEntityTypeMap[collection] +
			"&uri=" + uri.replace(/=/g, "~") + "&label=" + lensDeferredUriLabel(uri, sSubjectId, sLabel);
	}
}

function parseDeferredUri(sDeferredUri) {
	var matches = /.*\/(.*?)\((.*?)\)\/(.*?)$/g.exec(sDeferredUri);
	var deferredUri = {
		entityType: matches[1],
		entity: matches[2],
		navigationProperty: matches[3]
	};
	return deferredUri;
}

function parseMetadataUri(sMetadataUri) {
	var matches = /.*\/(.*?)\((.*?)\)$/g.exec(sMetadataUri);
	var metadataUri = {
		entityType: matches[1],
		entity: matches[2]
	};

	return metadataUri;
}

function validateUrl(sUrl) {
	var oParser = document.createElement('a');
	oParser.href = sUrl;
	return (oParser.hostname && oParser.host !== window.location.host) ? oParser : false;
}