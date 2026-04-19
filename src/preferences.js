/* Preferences panel script for Open Markdown plugin */

function browseMarkdownRoot() {
	_browseFolder('pref-markdown-root', 'extensions.zotero-open-markdown.markdown_root', 'Select Markdown Library Root');
}

function browseInputRoot() {
	_browseFolder('pref-input-root', 'extensions.zotero-open-markdown.input_root', 'Select PDF Library Root');
}

function _browseFolder(inputId, prefKey, title) {
	let fp = Components.classes["@mozilla.org/filepicker;1"]
		.createInstance(Components.interfaces.nsIFilePicker);
	fp.init(window, title, Components.interfaces.nsIFilePicker.modeGetFolder);

	// Set initial directory from current value
	let currentVal = Zotero.Prefs.get(prefKey, true);
	if (currentVal) {
		try {
			let dir = Zotero.File.pathToFile(currentVal);
			if (dir.exists()) {
				fp.displayDirectory = dir;
			}
		} catch (e) {
			// ignore
		}
	}

	fp.open((returnValue) => {
		if (returnValue === Components.interfaces.nsIFilePicker.returnOK) {
			let path = fp.file.path;
			document.getElementById(inputId).value = path;
			Zotero.Prefs.set(prefKey, path, true);
		}
	});
}
