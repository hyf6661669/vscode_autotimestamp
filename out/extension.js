'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const fs = require("fs");
const moment = require("moment");
function activate(context) {
    const config = new ExtensionConfiguration();
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
        config.onDidChangeConfiguration();
    }));
    const core = new ExtensionCore(config);
    context.subscriptions.push(vscode.workspace.onWillSaveTextDocument(e => {
        core.onWillSaveTextDocument(e);
    }));
}
exports.activate = activate;
function deactivate() {
}
exports.deactivate = deactivate;
class ExtensionCore {
    constructor(config) {
        this.m_config = config;
    }
    onWillSaveTextDocument(e) {
        if (!e.document.fileName.match(this.m_config.fileNamePattern))
            return;
        if (e.reason == vscode.TextDocumentSaveReason.AfterDelay)
            return;
        var edits = [];
        const lineIndices = this.getIndexRangeUntil(this.m_config.lineLimit, e.document.lineCount);
        for (const iLine of lineIndices) {
            const line = e.document.lineAt(iLine);
            const birthTimeRange = this.getTextRangeBetween(line, this.m_config.birthTimeStart, this.m_config.birthTimeEnd);
            if (birthTimeRange != null && birthTimeRange.isEmpty) {
                const stats = fs.statSync(e.document.fileName);
                const timeStr = moment(stats.birthtime).format(this.m_config.momentFormat);
                edits.push(vscode.TextEdit.replace(birthTimeRange, timeStr));
            }
            const modifiedTimeRange = this.getTextRangeBetween(line, this.m_config.modifiedTimeStart, this.m_config.modifiedTimeEnd);
            if (modifiedTimeRange != null) {
                const timeStr = moment().format(this.m_config.momentFormat);
                edits.push(vscode.TextEdit.replace(modifiedTimeRange, timeStr));
            }
        }
        e.waitUntil(Promise.resolve(edits));
    }
    getIndexRangeUntil(limit, count) {
        const indices = [];
        if (limit > 0) {
            let i = 0;
            const iMax = Math.min(limit, count);
            while (i < iMax) {
                indices.push(i++);
            }
        }
        else {
            let i = count - 1;
            const iMin = Math.max(count + limit, 0);
            while (i >= iMin) {
                indices.push(i--);
            }
        }
        return indices;
    }
    getTextRangeBetween(line, startPattern, endPattern) {
        const startResult = line.text.match(startPattern);
        if (startResult == null)
            return null;
        const iRangeStart = startResult.index + startResult[0].length;
        const endResult = line.text.substring(iRangeStart).match(endPattern);
        if (endResult == null)
            return null;
        const iRangeEnd = iRangeStart + endResult.index;
        const startPos = new vscode.Position(line.lineNumber, iRangeStart);
        var endPos = new vscode.Position(line.lineNumber, iRangeEnd);
        return new vscode.Range(startPos, endPos);
    }
}
class ExtensionConfiguration {
    constructor() {
        this.m_config = vscode.workspace.getConfiguration("lpubsppop01.autoTimeStamp");
    }
    onDidChangeConfiguration() {
        this.m_config = vscode.workspace.getConfiguration("lpubsppop01.autoTimeStamp");
        this.m_fileNamePattern = null;
        this.m_birthTimeStart = null;
        this.m_birthTimeEnd = null;
        this.m_modifiedTimeStart = null;
        this.m_modifiedTimeEnd = null;
    }
    getValue(propertyName, defaultValue) {
        if (this.m_config == null)
            return defaultValue;
        const value = this.m_config.get(propertyName);
        return value != null ? value : defaultValue;
    }
    get fileNamePattern() {
        if (this.m_fileNamePattern == null) {
            this.m_fileNamePattern = new RegExp(this.getValue("filenamePattern", "^(?!.*[/\\\\]\\.vscode[/\\\\]settings.json$)"));
        }
        return this.m_fileNamePattern;
    }
    get lineLimit() {
        return this.getValue("lineLimit", 10);
    }
    get birthTimeStart() {
        if (this.m_birthTimeStart == null) {
            this.m_birthTimeStart = new RegExp(this.getValue("birthTimeStart", "[cC]reated[ -][tT]ime.*: "));
        }
        return this.m_birthTimeStart;
    }
    get birthTimeEnd() {
        if (this.m_birthTimeEnd == null) {
            this.m_birthTimeEnd = new RegExp(this.getValue("birthTimeEnd", "$"));
        }
        return this.m_birthTimeEnd;
    }
    get modifiedTimeStart() {
        if (this.m_modifiedTimeStart == null) {
            this.m_modifiedTimeStart = new RegExp(this.getValue("modifiedTimeStart", "[lL]ast[ -][mM]odified[ -][tT]ime.*: "));
        }
        return this.m_modifiedTimeStart;
    }
    get modifiedTimeEnd() {
        if (this.m_modifiedTimeEnd == null) {
            this.m_modifiedTimeEnd = new RegExp(this.getValue("modifiedTimeEnd", "$"));
        }
        return this.m_modifiedTimeEnd;
    }
    get momentFormat() {
        return this.getValue("momentFormat", "YYYY-MM-DD HH:mm:ss");
    }
}
//# sourceMappingURL=extension.js.map