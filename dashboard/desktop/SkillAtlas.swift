import Cocoa
import WebKit

final class AtlasApp: NSObject, NSApplicationDelegate, WKNavigationDelegate, WKUIDelegate, WKDownloadDelegate {
    var window: NSWindow!
    var webView: WKWebView!
    var launcher: Process?
    var readyTimer: Timer?
    var attempts = 0
    var quitting = false
    let home = URL(string: "http://127.0.0.1:4310")!
    var workspace: String { Bundle.main.object(forInfoDictionaryKey: "AtlasWorkspace") as? String ?? "" }
    var node: String { if let resource = Bundle.main.resourceURL?.appendingPathComponent("runtime/node"), FileManager.default.isExecutableFile(atPath: resource.path) { return resource.path }; return Bundle.main.object(forInfoDictionaryKey: "AtlasNode") as? String ?? "/opt/homebrew/bin/node" }
    func applicationDidFinishLaunching(_ notification: Notification) {
        let menu = NSMenu()
        let appItem = NSMenuItem(); menu.addItem(appItem)
        let appMenu = NSMenu(); appItem.submenu = appMenu
        appMenu.addItem(withTitle: "About Skill Atlas", action: #selector(about), keyEquivalent: "")
        appMenu.addItem(withTitle: "Show Logs", action: #selector(showLogs), keyEquivalent: "l")
        appMenu.addItem(NSMenuItem.separator())
        appMenu.addItem(withTitle: "Quit Skill Atlas", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        let editItem = NSMenuItem(); menu.addItem(editItem); let edit = NSMenu(title: "Edit"); editItem.submenu = edit
        for (title, action, key) in [("Undo", "undo:", "z"),("Redo", "redo:", "Z"),("Cut", "cut:", "x"),("Copy", "copy:", "c"),("Paste", "paste:", "v"),("Select All", "selectAll:", "a")] { edit.addItem(withTitle: title, action: Selector(action), keyEquivalent: key) }
        NSApp.mainMenu = menu
        let configuration = WKWebViewConfiguration()
        webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = self; webView.uiDelegate = self
        window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 1380, height: 900), styleMask: [.titled,.closable,.miniaturizable,.resizable], backing: .buffered, defer: false)
        window.title = "Skill Atlas"; window.contentView = webView; window.setFrameAutosaveName("SkillAtlasWindow"); window.center(); window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
        webView.loadHTMLString("<html><body style='font:20px -apple-system;padding:15vh 12%;background:#edf2f7;color:#203347'><h1>Skill Atlas</h1><p>Opening your research workspace…</p></body></html>", baseURL: nil)
        startServices()
        readyTimer = Timer.scheduledTimer(withTimeInterval: 0.7, repeats: true) { [weak self] _ in self?.checkReady() }
    }
    func startServices() {
        do {
            let logs = FileManager.default.homeDirectoryForCurrentUser.appendingPathComponent("Library/Logs/Skill Atlas")
            try FileManager.default.createDirectory(at: logs, withIntermediateDirectories: true)
            let log = logs.appendingPathComponent("atlas.log"); if !FileManager.default.fileExists(atPath: log.path) { FileManager.default.createFile(atPath: log.path, contents: nil) }
            let handle = try FileHandle(forWritingTo: log); handle.seekToEndOfFile()
            let process = Process(); process.executableURL = URL(fileURLWithPath: node)
            process.arguments = [workspace + "/dashboard/scripts/start-local.mjs"]
            process.currentDirectoryURL = URL(fileURLWithPath: workspace)
            var environment = ProcessInfo.processInfo.environment
            environment["PATH"] = "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:" + (environment["PATH"] ?? "")
            process.environment = environment; process.standardOutput = handle; process.standardError = handle
            launcher = process; try process.run()
        } catch { fail("Could not launch Atlas: \(error.localizedDescription). Rebuild the application if the research folder or Node installation moved.") }
    }
    func checkReady() {
        attempts += 1
        if attempts % 10 == 0 && launcher?.isRunning != true { startServices() }
        if attempts > 180 { readyTimer?.invalidate(); fail("Atlas did not finish starting. Use Skill Atlas → Show Logs to inspect the error."); return }
        URLSession.shared.dataTask(with: home.appendingPathComponent("api/desktop-health")) { [weak self] data, response, _ in
            guard let self = self, let data = data, let json = try? JSONSerialization.jsonObject(with: data) as? [String:Any], json["workspace"] as? String == self.workspace else { return }
            DispatchQueue.main.async { guard self.readyTimer != nil else { return }; self.readyTimer?.invalidate(); self.readyTimer = nil; self.webView.load(URLRequest(url: self.home)) }
        }.resume()
    }
    func fail(_ message: String) { let alert = NSAlert(); alert.messageText = "Skill Atlas could not start"; alert.informativeText = message; alert.runModal() }
    @objc func about() { NSApp.orderFrontStandardAboutPanel(nil) }
    @objc func showLogs() { NSWorkspace.shared.open(FileManager.default.homeDirectoryForCurrentUser.appendingPathComponent("Library/Logs/Skill Atlas")) }
    func applicationShouldHandleReopen(_ sender: NSApplication, hasVisibleWindows flag: Bool) -> Bool { window.makeKeyAndOrderFront(nil); return true }
    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { false }
    func applicationShouldTerminate(_ sender: NSApplication) -> NSApplication.TerminateReply {
        if quitting { return .terminateNow }
        let alert = NSAlert(); alert.messageText = "Quit Skill Atlas?"; alert.informativeText = "Save your notes and drafts first. Active analysis will stop; saved conversations can be continued after reopening."; alert.addButton(withTitle: "Quit Skill Atlas"); alert.addButton(withTitle: "Keep Open")
        if alert.runModal() != .alertFirstButtonReturn { return .terminateCancel }
        quitting = true; readyTimer?.invalidate()
        let stop = Process(); stop.executableURL = URL(fileURLWithPath: node); stop.arguments = [workspace + "/dashboard/scripts/start-local.mjs", "--stop"]
        do { try stop.run() } catch { launcher?.terminate() }
        DispatchQueue.main.asyncAfter(deadline: .now() + 4) { NSApp.reply(toApplicationShouldTerminate: true) }
        return .terminateLater
    }
    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) { let alert = NSAlert(); alert.messageText = message; alert.addButton(withTitle: "Continue"); alert.addButton(withTitle: "Cancel"); completionHandler(alert.runModal() == .alertFirstButtonReturn) }
    func webView(_ webView: WKWebView, runOpenPanelWith parameters: WKOpenPanelParameters, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping ([URL]?) -> Void) { let panel = NSOpenPanel(); panel.allowsMultipleSelection = parameters.allowsMultipleSelection; panel.canChooseDirectories = parameters.allowsDirectories; panel.begin { result in completionHandler(result == .OK ? panel.urls : nil) } }
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url else { decisionHandler(.cancel); return }
        if navigationAction.shouldPerformDownload { decisionHandler(.download); return }
        if url.scheme == "blob" || url.scheme == "about" { decisionHandler(.allow); return }
        if url.host == "127.0.0.1" && url.port == 4310 { decisionHandler(.allow) } else { NSWorkspace.shared.open(url); decisionHandler(.cancel) }
    }
    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? { if let url = navigationAction.request.url { NSWorkspace.shared.open(url) }; return nil }
    func webView(_ webView: WKWebView, decidePolicyFor navigationResponse: WKNavigationResponse, decisionHandler: @escaping (WKNavigationResponsePolicy) -> Void) { let response = navigationResponse.response as? HTTPURLResponse; if !navigationResponse.canShowMIMEType || (response?.value(forHTTPHeaderField: "Content-Disposition")?.contains("attachment") ?? false) { decisionHandler(.download) } else { decisionHandler(.allow) } }
    func webView(_ webView: WKWebView, navigationAction: WKNavigationAction, didBecome download: WKDownload) { download.delegate = self }
    func webView(_ webView: WKWebView, navigationResponse: WKNavigationResponse, didBecome download: WKDownload) { download.delegate = self }
    func download(_ download: WKDownload, decideDestinationUsing response: URLResponse, suggestedFilename: String, completionHandler: @escaping (URL?) -> Void) { let panel = NSSavePanel(); panel.nameFieldStringValue = suggestedFilename; panel.begin { result in completionHandler(result == .OK ? panel.url : nil) } }
}
let app = NSApplication.shared
let delegate = AtlasApp()
app.delegate = delegate
app.setActivationPolicy(.regular)
app.run()
