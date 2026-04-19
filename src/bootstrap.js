var OpenMarkdown;

function log(msg) {
	Zotero.debug("Open Markdown: " + msg);
}

function install() {
	log("Installed 1.0.0");
}

async function startup({ id, version, rootURI }) {
	log("Starting 1.0.0");

	Zotero.PreferencePanes.register({
		pluginID: 'zotero-open-markdown@henryyu',
		src: rootURI + 'preferences.xhtml',
		scripts: [rootURI + 'preferences.js']
	});

	Services.scriptloader.loadSubScript(rootURI + 'open-markdown.js');
	OpenMarkdown.init({ id, version, rootURI });
	OpenMarkdown.addToAllWindows();
}

function onMainWindowLoad({ window }) {
	OpenMarkdown.addToWindow(window);
}

function onMainWindowUnload({ window }) {
	OpenMarkdown.removeFromWindow(window);
}

function shutdown() {
	log("Shutting down");
	OpenMarkdown.removeFromAllWindows();
	OpenMarkdown = undefined;
}

function uninstall() {
	log("Uninstalled");
}
