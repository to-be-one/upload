/**
*超轻量前端模板引擎，支持无限嵌套，逻辑嵌套模板，模板嵌套逻辑；标准js语法，灵活易用，超便捷指定数据
*
*作者：张少龙
*mail：369669902@qq.com
*/
var Simplite = function (){
	var templateCache = {};
	var lineCommentsReg = /(['"])?[^'"]*\/\/[^\n]*(\1)?[^'"]*(?:\n|$)/g;//此正则只能处理简单的单行注释或者排除字符串中的//，不能处理复杂情况。
	var toString = Object.prototype.toString;
	var isType = function (type) {
		return function (target) {
			return toString.call(target) === '[object ' + type + ']';
		};
	};
	var isString = isType('String');
	var isArray = isType('Array');
	var getNode = function (idOrNode) {
		if (isString(idOrNode)) {
			return document.getElementById(idOrNode);
		} else if (idOrNode.nodeName) {
			return idOrNode;
		} else {
			return idOrNode[0];
		}
	};
	var getTemplate = function (idOrNodeOrHtml) {
		var node = getNode(idOrNodeOrHtml);
		if (node) {
			return node.innerHTML;
		} else {
			return idOrNodeOrHtml;
		}
	};
	var stringify = function (code) {
		return "'" + code
		.replace(/('|\\)/g, '\\$1')
		.replace(/\r/g, '\\r')
		.replace(/\n/g, '\\n') + "'";
	};
	var htmlMeta = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#39;',
		'\\': '\\\\',
		'\"': '\\"'
	};
	var escapeHTML = function (txt) {
		if (typeof txt === 'undefined') {
			return '';
		}
		if (typeof txt !== 'string') {
			return txt;
		}
		return txt.replace(/\\|\"|&|<|>|"|'/g, function (ch) {
			return htmlMeta[ch];
		});
	};
	var trimTemplate = function (text) {
		return text.replace(/\s+/g, ' ');
	};
	var trim = function (str) {
		return str.replace(/^\s+|\s+$/, '');
	};
	var trimLineComment = function (text) {
		return text.replace(lineCommentsReg, function (all, quote){
			if (!quote) return '';
			return all;
		});
	};
	var parseOpenTag = function (text) {
		return text.split(Simplite.openTag);
	};
	var parseCloseTag = function (segment) {
		return segment.split(Simplite.closeTag);
	};
	var parser = function (text) {
		var out = 'var out = "";';
		text = trimLineComment(text);
		text = trimTemplate(text);
		var segments = parseOpenTag(text);
		for (var i=0,len=segments.length; i<len; i++) {
			var segment = segments[i];
			var jsAndHtml = parseCloseTag(segment);
			var js = jsAndHtml[0];
			var html = jsAndHtml[1];
			if(html === undefined){
				html = js;
				js = '';
			}
			js = trim(js);
			if (/^=(.)/.test(js)) {
				if(RegExp.$1 === '#'){
					js = 'out += Simplite.escapeHTML(' + js.substr(2) + ');';
				} else {
					js = 'out += ' + js.substr(1) + ';';
				}
			} else if (/^include\s*\(([^\)]+)\)$/.test(js)) {
				var args = RegExp.$1;
				if(args.indexOf(',') < 0){//不应该有第一个字符为“,”的情况。
					args = args + ',_this';
				}
				js = 'out += Simplite.include(' + args + ');';
			}
			if (/[^\{;]$/.test(js)) {
				js += '\n';
			}
			out += js;
			html = trim(html);
			if (html) {
				out += 'out += ' + stringify(html) + ';';
			}
		}
		return out;
	};
	var compile = function (template) {
		var dataLoader = templateCache[template];
		if (!dataLoader) {
			var code = parser(template);
			dataLoader = templateCache[template] = new Function ('obj', 'with (obj) {var _this = obj;' + code + '; return out;}');
		}
		return dataLoader;
	};
	var include = function (template, data) {
		template = getTemplate(template);
		return toHtml(template, data);
	};
	var toHtml = function (template, data) {
		return compile(template)(data);
	};
	var render = function (target, html, fun) {
		target = getNode(target);
		target.innerHTML = html;
		fun && fun(target);
	};
	var Simplite = function (options) {
		this.target = getNode(options.target);
		this.template = getTemplate(options.template);
	};
	Simplite.prototype.compile = function () {
		return compile(this.template);
	};
	Simplite.prototype.render = function (data) {
		this.beforerender(data);
		render(this.target, toHtml(this.template, data), this.afterrender);
	};
	Simplite.prototype.beforerender = function (data) {};
	Simplite.prototype.afterrender = function (node) {};
	Simplite.openTag = '<%';
	Simplite.closeTag = '%>';
	Simplite.escapeHTML = escapeHTML;
	Simplite.getTemplate = getTemplate;
	Simplite.trimTemplate = trimTemplate;
	Simplite.include = include;
	Simplite.compile = compile;
	Simplite.toHtml = toHtml;
	Simplite.render = render;
	return Simplite;
}();