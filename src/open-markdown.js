/* Open Markdown — core logic for Zotero 7 bootstrap plugin
 *
 * Adds two right-click context menu items to the Zotero item pane:
 *   1. "Reveal Markdown in Finder" — reveals the .md file / folder in the OS file manager
 *   2. "Open Markdown File" — opens the .md file with the system default editor
 *
 * Matching algorithm:
 *   PDF attachment path:  <input_root>/<relative_path>/Paper.pdf
 *   Markdown bundle:      <markdown_root>/<relative_path>/Paper/Paper.md
 *
 * Both paths (input_root and markdown_root) are configured in the plugin preferences.
 */

OpenMarkdown = {
	id: null,
	version: null,
	rootURI: null,
	initialized: false,
	addedElementIDs: [],

	init({ id, version, rootURI }) {
		if (this.initialized) return;
		this.id = id;
		this.version = version;
		this.rootURI = rootURI;
		this.initialized = true;
	},

	log(msg) {
		Zotero.debug("Open Markdown: " + msg);
	},

	// ── Preferences helpers ──────────────────────────────────────────

	getPref(key) {
		return Zotero.Prefs.get('extensions.zotero-open-markdown.' + key, true);
	},

	getMarkdownRoot() {
		return (this.getPref('markdown_root') || '').replace(/\/+$/, '');
	},

	getInputRoot() {
		return (this.getPref('input_root') || '').replace(/\/+$/, '');
	},

	// ── File resolution ──────────────────────────────────────────────

	/**
	 * Given a Zotero item, find the PDF attachment and return its absolute path.
	 * Returns null if no PDF attachment is found.
	 */
	async getPdfPath(item) {
		// If the item itself is a PDF attachment
		if (item.isAttachment() && item.attachmentContentType === 'application/pdf') {
			let path = await item.getFilePathAsync();
			return path || null;
		}

		// If the item is a regular item, look for child PDF attachments
		if (item.isRegularItem()) {
			let attachmentIDs = item.getAttachments();
			for (let attachmentID of attachmentIDs) {
				let attachment = Zotero.Items.get(attachmentID);
				if (attachment && attachment.attachmentContentType === 'application/pdf') {
					let path = await attachment.getFilePathAsync();
					if (path) return path;
				}
			}
		}

		return null;
	},

	/**
	 * Compute the expected markdown file path for a given PDF path.
	 *
	 * Strategy:
	 *   1. If input_root is configured and the PDF is under it, compute relative path
	 *      and map to markdown_root/<relative_dir>/Stem/Stem.md
	 *   2. Otherwise, use just the PDF filename: markdown_root/<Stem>/<Stem>.md
	 *   3. Fallback: recursively search markdown_root for a folder matching the stem
	 */
	resolveMarkdownPath(pdfPath) {
		let markdownRoot = this.getMarkdownRoot();
		if (!markdownRoot) return null;

		let inputRoot = this.getInputRoot();
		let stem = this._pathStem(pdfPath);

		// Strategy 1: relative path mapping
		if (inputRoot && pdfPath.startsWith(inputRoot + '/')) {
			let relativePath = pdfPath.substring(inputRoot.length + 1); // e.g. "AI/Paper1.pdf"
			let relativeDir = this._pathDirname(relativePath); // e.g. "AI"
			let basePath = relativeDir
				? markdownRoot + '/' + relativeDir + '/' + stem
				: markdownRoot + '/' + stem;

			let mdFile = basePath + '/' + stem + '.md';
			if (this._fileExists(mdFile)) return mdFile;

			// Check if the bundle directory exists even without the .md
			if (this._dirExists(basePath)) return basePath;
		}

		// Strategy 2: flat lookup by stem name
		{
			let mdFile = markdownRoot + '/' + stem + '/' + stem + '.md';
			if (this._fileExists(mdFile)) return mdFile;

			let dir = markdownRoot + '/' + stem;
			if (this._dirExists(dir)) return dir;
		}

		// Strategy 3: recursive search (slower, last resort)
		let found = this._findBundleRecursive(markdownRoot, stem);
		if (found) return found;

		return null;
	},

	/**
	 * Search recursively under a directory for a folder named `stem`
	 * that contains `stem.md`.
	 */
	_findBundleRecursive(dir, stem) {
		try {
			let dirObj = Zotero.File.pathToFile(dir);
			if (!dirObj.exists() || !dirObj.isDirectory()) return null;

			let entries = dirObj.directoryEntries;
			while (entries.hasMoreElements()) {
				let entry = entries.getNext().QueryInterface(Components.interfaces.nsIFile);
				if (entry.isDirectory()) {
					if (entry.leafName === stem) {
						let mdPath = entry.path + '/' + stem + '.md';
						let mdFile = Zotero.File.pathToFile(mdPath);
						if (mdFile.exists()) return mdPath;
						return entry.path;
					}
					// Recurse into subdirectories
					let found = this._findBundleRecursive(entry.path, stem);
					if (found) return found;
				}
			}
		} catch (e) {
			this.log("Error searching directory: " + dir + " — " + e);
		}
		return null;
	},

	// ── Platform helpers ─────────────────────────────────────────────

	_pathStem(filePath) {
		let name = filePath.split('/').pop();
		if (!name) return '';
		let dotIndex = name.lastIndexOf('.');
		return dotIndex > 0 ? name.substring(0, dotIndex) : name;
	},

	_pathDirname(relativePath) {
		let parts = relativePath.split('/');
		parts.pop(); // remove filename
		return parts.join('/');
	},

	_fileExists(path) {
		try {
			let file = Zotero.File.pathToFile(path);
			return file.exists() && !file.isDirectory();
		} catch (e) {
			return false;
		}
	},

	_dirExists(path) {
		try {
			let file = Zotero.File.pathToFile(path);
			return file.exists() && file.isDirectory();
		} catch (e) {
			return false;
		}
	},

	// ── Context menu actions ─────────────────────────────────────────

	async revealMarkdown() {
		let items = Zotero.getActiveZoteroPane().getSelectedItems();
		if (!items || items.length === 0) return;

		let item = items[0];
		let pdfPath = await this.getPdfPath(item);

		if (!pdfPath) {
			this._showAlert('open-markdown-no-attachment');
			return;
		}

		let mdPath = this.resolveMarkdownPath(pdfPath);
		if (!mdPath) {
			this._showAlert('open-markdown-not-found');
			return;
		}

		this.log("Revealing: " + mdPath);

		try {
			let file = Zotero.File.pathToFile(mdPath);
			file.reveal();
		} catch (e) {
			this.log("Reveal failed: " + e);
			this._showAlert('open-markdown-not-found');
		}
	},

	async openMarkdown() {
		let items = Zotero.getActiveZoteroPane().getSelectedItems();
		if (!items || items.length === 0) return;

		let item = items[0];
		let pdfPath = await this.getPdfPath(item);

		if (!pdfPath) {
			this._showAlert('open-markdown-no-attachment');
			return;
		}

		let mdPath = this.resolveMarkdownPath(pdfPath);
		if (!mdPath) {
			this._showAlert('open-markdown-not-found');
			return;
		}

		// Make sure we point to the .md file, not a directory
		if (this._dirExists(mdPath)) {
			// Try to find the main .md file inside
			let stem = mdPath.split('/').pop();
			let candidateMd = mdPath + '/' + stem + '.md';
			if (this._fileExists(candidateMd)) {
				mdPath = candidateMd;
			} else {
				// Try any .md file
				try {
					let dirObj = Zotero.File.pathToFile(mdPath);
					let entries = dirObj.directoryEntries;
					while (entries.hasMoreElements()) {
						let entry = entries.getNext().QueryInterface(Components.interfaces.nsIFile);
						if (!entry.isDirectory() && entry.leafName.endsWith('.md')) {
							mdPath = entry.path;
							break;
						}
					}
				} catch (e) {
					this.log("Error scanning bundle dir: " + e);
				}
			}
		}

		this.log("Opening: " + mdPath);

		try {
			let file = Zotero.File.pathToFile(mdPath);
			file.launch();
		} catch (e) {
			this.log("Launch failed: " + e);
			this._showAlert('open-markdown-not-found');
		}
	},

	_showAlert(l10nId) {
		// Fallback messages if Fluent isn't available
		let messages = {
			'open-markdown-no-attachment': 'No PDF attachment found for this item.\n未找到该条目的 PDF 附件。',
			'open-markdown-not-found': 'Markdown file not found for this item.\n未找到该条目对应的 Markdown 文件。\n\nPlease check that your Markdown Library Root and PDF Library Root are correctly configured in the plugin preferences.\n请在插件偏好设置中检查 Markdown 库根目录和 PDF 库根目录是否正确配置。',
			'open-markdown-not-configured': 'Plugin is not configured.\n插件尚未配置。\n\nPlease set the Markdown Library Root in Zotero Preferences → Open Markdown.\n请在 Zotero 偏好设置 → Open Markdown 中设置 Markdown 库根目录。',
		};

		let msg = messages[l10nId] || l10nId;

		// Use Services.prompt for a simple alert
		Services.prompt.alert(null, 'Open Markdown', msg);
	},

	// ── UI injection ─────────────────────────────────────────────────

	addToWindow(window) {
		let doc = window.document;

		// Use Fluent for localization
		window.MozXULElement.insertFTLIfNeeded("open-markdown.ftl");

		// ---------- Menu separator ----------
		let separator = doc.createXULElement('menuseparator');
		separator.id = 'open-markdown-separator';
		doc.getElementById('zotero-itemmenu').appendChild(separator);
		this.storeAddedElement(separator);

		// ---------- "Reveal Markdown in Finder" ----------
		let menuReveal = doc.createXULElement('menuitem');
		menuReveal.id = 'open-markdown-reveal-menuitem';
		menuReveal.setAttribute('data-l10n-id', 'open-markdown-reveal');
		menuReveal.addEventListener('command', () => {
			OpenMarkdown.revealMarkdown();
		});
		doc.getElementById('zotero-itemmenu').appendChild(menuReveal);
		this.storeAddedElement(menuReveal);

		// ---------- "Open Markdown File" ----------
		let menuOpen = doc.createXULElement('menuitem');
		menuOpen.id = 'open-markdown-open-menuitem';
		menuOpen.setAttribute('data-l10n-id', 'open-markdown-open');
		menuOpen.addEventListener('command', () => {
			OpenMarkdown.openMarkdown();
		});
		doc.getElementById('zotero-itemmenu').appendChild(menuOpen);
		this.storeAddedElement(menuOpen);
	},

	addToAllWindows() {
		var windows = Zotero.getMainWindows();
		for (let win of windows) {
			if (!win.ZoteroPane) continue;
			this.addToWindow(win);
		}
	},

	storeAddedElement(elem) {
		if (!elem.id) {
			throw new Error("Element must have an id");
		}
		this.addedElementIDs.push(elem.id);
	},

	removeFromWindow(window) {
		var doc = window.document;
		for (let id of this.addedElementIDs) {
			doc.getElementById(id)?.remove();
		}
		doc.querySelector('[href="open-markdown.ftl"]')?.remove();
	},

	removeFromAllWindows() {
		var windows = Zotero.getMainWindows();
		for (let win of windows) {
			if (!win.ZoteroPane) continue;
			this.removeFromWindow(win);
		}
	},
};
