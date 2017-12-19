/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ({

/***/ "./build/assets.json":
/***/ (function(module, exports) {

module.exports = {"client":{"js":"/static/js/bundle.f98f5ad1.js","css":"/static/css/bundle.5487eb26.css"}}

/***/ }),

/***/ "./node_modules/css-loader/lib/css-base.js":
/***/ (function(module, exports) {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
// css base code, injected by the css-loader
module.exports = function(useSourceMap) {
	var list = [];

	// return the list of modules as css string
	list.toString = function toString() {
		return this.map(function (item) {
			var content = cssWithMappingToString(item, useSourceMap);
			if(item[2]) {
				return "@media " + item[2] + "{" + content + "}";
			} else {
				return content;
			}
		}).join("");
	};

	// import a list of modules into the list
	list.i = function(modules, mediaQuery) {
		if(typeof modules === "string")
			modules = [[null, modules, ""]];
		var alreadyImportedModules = {};
		for(var i = 0; i < this.length; i++) {
			var id = this[i][0];
			if(typeof id === "number")
				alreadyImportedModules[id] = true;
		}
		for(i = 0; i < modules.length; i++) {
			var item = modules[i];
			// skip already imported module
			// this implementation is not 100% perfect for weird media query combinations
			//  when a module is imported multiple times with different media queries.
			//  I hope this will never occur (Hey this way we have smaller bundles)
			if(typeof item[0] !== "number" || !alreadyImportedModules[item[0]]) {
				if(mediaQuery && !item[2]) {
					item[2] = mediaQuery;
				} else if(mediaQuery) {
					item[2] = "(" + item[2] + ") and (" + mediaQuery + ")";
				}
				list.push(item);
			}
		}
	};
	return list;
};

function cssWithMappingToString(item, useSourceMap) {
	var content = item[1] || '';
	var cssMapping = item[3];
	if (!cssMapping) {
		return content;
	}

	if (useSourceMap && typeof btoa === 'function') {
		var sourceMapping = toComment(cssMapping);
		var sourceURLs = cssMapping.sources.map(function (source) {
			return '/*# sourceURL=' + cssMapping.sourceRoot + source + ' */'
		});

		return [content].concat(sourceURLs).concat([sourceMapping]).join('\n');
	}

	return [content].join('\n');
}

// Adapted from convert-source-map (MIT)
function toComment(sourceMap) {
	// eslint-disable-next-line no-undef
	var base64 = btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap))));
	var data = 'sourceMappingURL=data:application/json;charset=utf-8;base64,' + base64;

	return '/*# ' + data + ' */';
}


/***/ }),

/***/ "./src/App.css":
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__("./node_modules/css-loader/lib/css-base.js")(undefined);
// imports


// module
exports.push([module.i, "body {\n  margin: 0;\n  padding: 0;\n  font-family: sans-serif;\n}", ""]);

// exports


/***/ }),

/***/ "./src/App.js":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_react__ = __webpack_require__("react");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_react___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_react__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_react_router_dom_Route__ = __webpack_require__("react-router-dom/Route");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_react_router_dom_Route___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_react_router_dom_Route__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_react_router_dom_Switch__ = __webpack_require__("react-router-dom/Switch");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_react_router_dom_Switch___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2_react_router_dom_Switch__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__Home__ = __webpack_require__("./src/Home.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__App_css__ = __webpack_require__("./src/App.css");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__App_css___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_4__App_css__);






var App = function App() {
  return __WEBPACK_IMPORTED_MODULE_0_react___default.a.createElement(
    __WEBPACK_IMPORTED_MODULE_2_react_router_dom_Switch___default.a,
    null,
    __WEBPACK_IMPORTED_MODULE_0_react___default.a.createElement(__WEBPACK_IMPORTED_MODULE_1_react_router_dom_Route___default.a, { exact: true, path: '/', component: __WEBPACK_IMPORTED_MODULE_3__Home__["a" /* default */] })
  );
};

/* harmony default export */ __webpack_exports__["a"] = (App);

/***/ }),

/***/ "./src/Home.css":
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__("./node_modules/css-loader/lib/css-base.js")(undefined);
// imports


// module
exports.push([module.i, ".Container {\n  display: flex;\n  flex-direction: column;\n  min-height: 100vh;\n  justify-content: center;\n  width: 100vw;\n}\n\n.Home {\n  flex: 0 1 auto;\n  text-align: center;\n}\n\n.Home h1 {\n  margin-bottom: 0;\n}\n\n.Home p {\n  color: #818181;\n  margin-top: 5px;\n  text-transform: uppercase;\n}\n\nbutton.next {\n  background: #fff;\n  border: 0;\n  border-radius: 40%;\n  color: #b1b1b1;\n  cursor: pointer;\n  font-size: 28px;\n  line-height: 1;\n  padding: 5px 10px 7px;\n  transition: 0.25s all ease-in-out;\n}\n\nbutton.next:focus {\n  outline: none;\n}\n\nbutton.next:hover {\n  color: #d290d4;\n}\n\n.Main {\n  flex: 1 1 auto;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n}\n\n#svg,\n#controls {\n  position: relative;\n  flex: 0 1 auto;\n  display: flex;\n  flex-wrap: wrap;\n  justify-content: space-around;\n}\n\n#svg {\n  z-index: 0;\n}\n\n#svg .left-gutter {\n  border-bottom: 1px solid #eee;\n  border-left: 1px solid #eee;\n  border-top: 1px solid #eee;\n  border-top-left-radius: 4px;\n  border-bottom-left-radius: 4px;\n  box-shadow: 0 2px 2px rgba(0, 0, 0, 0.15);\n  display: flex;\n  order: 1;\n  padding: 4px;\n}\n\n#svg .right-gutter {\n  border-bottom: 1px solid #eee;\n  border-right: 1px solid #eee;\n  border-top: 1px solid #eee;\n  border-top-right-radius: 4px;\n  border-bottom-right-radius: 4px;\n  box-shadow: 0 2px 2px rgba(0, 0, 0, 0.15);\n  display: flex;\n  order: 3;\n  padding: 4px;\n}\n\n#svg > svg {\n  box-shadow: 0 2px 2px rgba(0, 0, 0, 0.15);\n  order: 2;\n}\n\n#controls {\n  z-index: 1;\n}\n\n.loader {\n  display: inline-block;\n  width: 30px;\n  height: 30px;\n  position: relative;\n  border: 4px solid #242F3F;\n  top: 50%;\n  animation: loader 2s infinite ease;\n}\n\n.loader-inner {\n  vertical-align: top;\n  display: inline-block;\n  width: 100%;\n  background-color: #242F3F;\n  animation: loader-inner 2s infinite ease-in;\n}\n\n.names {\n  align-items: center;\n  display: flex;\n  flex: 0 1 200px;\n  overflow: scroll;\n  position: relative;\n  width: 33vw;\n}\n\n.names-list {\n  position: absolute;\n  top: 0;\n}\n\n.name {\n  margin: 5px 0;\n  padding: 5px 0;\n  font-size: 18px;\n  line-height: 1;\n}\n\n.name.same {\n  font-weight: bold;\n}\n\n.name-form {\n  display: flex;\n  flex: 1 1 auto;\n}\n\n.names input {\n  border: 0;\n  border-bottom: 2px solid #818181;\n  height: 40px;\n  flex: 1 1 auto;\n  transition: 0.3s all ease-in-out;\n}\n\n.names input:focus {\n  outline: none;\n  border-bottom: 2px solid #414141;\n}\n\n.names button {\n  border: 0;\n  height: 40px;\n  flex: 0 0 auto;\n}\n\n.name-submit {\n  color: #33aa0e;\n  transition: 0.3s all ease-in-out;\n}\n\n.name-submit:disabled,\n.name-submit[disabled] {\n  color: #939393;\n}\n\n.download-buttons {\n  flex: 1 1 auto;\n  display: flex;\n  flex-flow: column wrap;\n  justify-content: center;\n}\n\n.download-buttons button.btn.btn-secondary {\n  align-items: center;\n  background: #fff;\n  border: 0;\n  display: flex;\n  flex: 0 0 50px;\n  flex-flow: column wrap;\n  justify-content: center;\n  margin: 5px 0;\n  width: 50px;\n}\n\n@keyframes loader {\n  0% {\n    transform: rotate(0deg);\n  }\n  \n  25% {\n    transform: rotate(180deg);\n  }\n  \n  50% {\n    transform: rotate(180deg);\n  }\n  \n  75% {\n    transform: rotate(360deg);\n  }\n  \n  100% {\n    transform: rotate(360deg);\n  }\n}\n\n@keyframes loader-inner {\n  0% {\n    height: 100%;\n  }\n  \n  25% {\n    height: 100%;\n  }\n  \n  50% {\n    height: 0%;\n  }\n  \n  75% {\n    height: 0%;\n  }\n  \n  100% {\n    height: 100%;\n  }\n}", ""]);

// exports


/***/ }),

/***/ "./src/Home.js":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_babel_runtime_core_js_json_stringify__ = __webpack_require__("babel-runtime/core-js/json/stringify");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_babel_runtime_core_js_json_stringify___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_babel_runtime_core_js_json_stringify__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_babel_runtime_core_js_object_get_prototype_of__ = __webpack_require__("babel-runtime/core-js/object/get-prototype-of");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_babel_runtime_core_js_object_get_prototype_of___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_babel_runtime_core_js_object_get_prototype_of__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_babel_runtime_helpers_classCallCheck__ = __webpack_require__("babel-runtime/helpers/classCallCheck");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_babel_runtime_helpers_classCallCheck___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2_babel_runtime_helpers_classCallCheck__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_babel_runtime_helpers_createClass__ = __webpack_require__("babel-runtime/helpers/createClass");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_babel_runtime_helpers_createClass___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3_babel_runtime_helpers_createClass__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_babel_runtime_helpers_possibleConstructorReturn__ = __webpack_require__("babel-runtime/helpers/possibleConstructorReturn");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_babel_runtime_helpers_possibleConstructorReturn___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_4_babel_runtime_helpers_possibleConstructorReturn__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5_babel_runtime_helpers_inherits__ = __webpack_require__("babel-runtime/helpers/inherits");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5_babel_runtime_helpers_inherits___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_5_babel_runtime_helpers_inherits__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__react_svg__ = __webpack_require__("./src/react.svg");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__react_svg___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_6__react_svg__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7_mathjs__ = __webpack_require__("mathjs");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7_mathjs___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_7_mathjs__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8_react__ = __webpack_require__("react");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8_react___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_8_react__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_9_svg_js__ = __webpack_require__("svg.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_9_svg_js___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_9_svg_js__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_10_tinycolor2__ = __webpack_require__("tinycolor2");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_10_tinycolor2___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_10_tinycolor2__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_11_underscore__ = __webpack_require__("underscore");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_11_underscore___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_11_underscore__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_12_react_icons_lib_fa_arrow_circle_o_down__ = __webpack_require__("react-icons/lib/fa/arrow-circle-o-down");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_12_react_icons_lib_fa_arrow_circle_o_down___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_12_react_icons_lib_fa_arrow_circle_o_down__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_13_react_icons_lib_ti_arrow_right_thick__ = __webpack_require__("react-icons/lib/ti/arrow-right-thick");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_13_react_icons_lib_ti_arrow_right_thick___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_13_react_icons_lib_ti_arrow_right_thick__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_14__Home_css__ = __webpack_require__("./src/Home.css");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_14__Home_css___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_14__Home_css__);


















var PRELOAD_COUNT = 20;

var Home = function (_Component) {
  __WEBPACK_IMPORTED_MODULE_5_babel_runtime_helpers_inherits___default()(Home, _Component);

  function Home(props) {
    __WEBPACK_IMPORTED_MODULE_2_babel_runtime_helpers_classCallCheck___default()(this, Home);

    var _this = __WEBPACK_IMPORTED_MODULE_4_babel_runtime_helpers_possibleConstructorReturn___default()(this, (Home.__proto__ || __WEBPACK_IMPORTED_MODULE_1_babel_runtime_core_js_object_get_prototype_of___default()(Home)).call(this, props));

    var fgColor = _this.props.fgColor || '#ffffff';
    var bgColor = _this.props.bgColor || __WEBPACK_IMPORTED_MODULE_10_tinycolor2___default.a.random().toHexString();

    _this.state = {
      bgColor: bgColor,
      currentPath: null,
      currentNames: null,
      fgColor: fgColor,
      name: '',
      named: false,
      pageToFetch: 1,
      pathId: null,
      pathPool: []
    };
    _this.loading = true;
    _this.svg = null;
    return _this;
  }

  __WEBPACK_IMPORTED_MODULE_3_babel_runtime_helpers_createClass___default()(Home, [{
    key: 'swapColors',
    value: function swapColors(svg) {
      var _this2 = this;

      var elements = svg.childNodes;
      this.setState({
        fgColor: this.state.bgColor,
        bgColor: this.state.fgColor
      });

      elements.forEach(function (node) {
        if (node.constructor.name === "SVGRectElement") {
          node.setAttribute("fill", _this2.state.bgColor);
        }

        if (node.constructor.name === "SVGPathElement") {
          node.setAttribute("fill", _this2.state.fgColor);
        }
      });
    }
  }, {
    key: 'nextPath',
    value: function nextPath() {
      var pathPool = this.state.pathPool;
      var pathObj = pathPool.pop();
      var pathId = pathObj.id;
      var currentNames = pathObj.names;
      var currentPath = pathObj.d;
      var name = localStorage.getItem('named' + pathId) || '';
      var named = name !== '';
      this.setState({
        pathPool: pathPool,
        pathId: pathId,
        currentNames: currentNames,
        currentPath: currentPath,
        name: name,
        named: named
      });
      if (this.state.pathPool.length === 0) {
        this.updatePool();
      }
      this.drawSVG();
    }
  }, {
    key: 'updateName',
    value: function updateName(name) {
      this.setState({ name: name });
    }
  }, {
    key: 'updatePool',
    value: function updatePool() {
      var _this3 = this;

      var url = 'https://699de3fa.ngrok.io/api/paths?page=' + this.state.pageToFetch;
      var headers = new Headers();
      headers.append('Content-Type', 'application/json');
      fetch(url, {
        method: 'GET',
        headers: { Accept: "application/json" }
      }).then(function (resp) {
        return resp.json();
      }).then(function (resp) {
        _this3.loading = false;
        var pathPool = resp.objects;
        var pathObj = pathPool.pop();
        var pathId = pathObj.id;
        var currentNames = pathObj.names;
        var currentPath = pathObj.d;
        var pageToFetch = _this3.state.pageToFetch + 1;
        var name = localStorage.getItem('named' + pathId) || '';
        var named = name !== '';
        _this3.setState({ pathPool: pathPool, currentNames: currentNames, currentPath: currentPath, pathId: pathId, name: name, named: named, pageToFetch: pageToFetch });
        _this3.drawSVG();
      });
    }
  }, {
    key: 'renderNames',
    value: function renderNames() {
      var _this4 = this;

      var names = __WEBPACK_IMPORTED_MODULE_8_react___default.a.createElement(
        'div',
        null,
        'No one has named me'
      );

      if (this.state.currentNames) {
        var uniqueNames = [];
        for (var i = 0; i < this.state.currentNames.length; i++) {}

        names = __WEBPACK_IMPORTED_MODULE_11_underscore___default.a.map(this.state.currentNames, function (name) {
          return __WEBPACK_IMPORTED_MODULE_8_react___default.a.createElement(
            'div',
            { 'data-key': name.path_id, key: name.id, className: _this4.state.name === name.name ? 'name same' : 'name' },
            name.name
          );
        });

        return names;
      }
    }
  }, {
    key: 'generatePath',
    value: function generatePath() {
      var _this5 = this;

      this.loading = true;
      fetch('https://699de3fa.ngrok.io/generate/3').then(function (d) {
        var resp = d.json();
        if (typeof resp.path !== 'undefined') {
          _this5.loading = false;
          var paths = _this5.state.paths.unshift(resp.path);
          _this5.setState({ paths: paths });
        }
      });
    }
  }, {
    key: 'updateColor',
    value: function updateColor(svg, event) {
      console.log(event);
    }
  }, {
    key: 'submitName',
    value: function submitName() {
      var _this6 = this;

      if (this.state.name.length < 2) return;
      this.setState({ named: true });
      this.loading = true;
      var name = this.state.name;
      var path_id = this.state.pathId;
      var url = 'https://699de3fa.ngrok.io/api/names';
      fetch(url, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: __WEBPACK_IMPORTED_MODULE_0_babel_runtime_core_js_json_stringify___default()({ name: name, path_id: path_id })
      }).then(function (resp) {
        return resp.json();
      }).then(function (resp) {
        _this6.loading = false;
        debugger;
        localStorage.setItem('named' + resp.id, resp.name);
        _this6.setState({
          currentNames: _this6.state.currentNames.push(resp)
        });
      });
    }
  }, {
    key: 'drawSVG',
    value: function drawSVG() {
      var _this7 = this;

      if (this.svg) this.svg.remove();
      var maxScale = 0.667;
      var size = window.innerHeight * 0.5;
      var bb = void 0;
      var _draw = __WEBPACK_IMPORTED_MODULE_9_svg_js___default()('svg').size(size, size);
      var noBg = __WEBPACK_IMPORTED_MODULE_7_mathjs___default.a.randomInt(1);
      var newColor = __WEBPACK_IMPORTED_MODULE_10_tinycolor2___default.a.random().toHexString();
      var _drawnPath = void 0;

      if (this.state.bgColor !== '#ffffff') {
        _draw.rect(size, size).fill(newColor).move(0, 0);
        _drawnPath = _draw.path(this.state.currentPath).fill('#ffffff');
      } else {
        _draw.rect(size, size).fill('#ffffff').move(0, 0);
        _drawnPath = _draw.path(this.state.currentPath).fill(newColor);
      }

      bb = _drawnPath.bbox();
      var widthScale = maxScale / (bb.w / size);
      var heightScale = maxScale / (bb.h / size);
      _drawnPath.scale(widthScale, heightScale);
      bb = _drawnPath.bbox();

      var xMove = _drawnPath.transform().x + (size - bb.w) / 2 - bb.x;
      var yMove = _drawnPath.transform().y + (size - bb.h) / 2 - bb.y;
      _drawnPath.translate(xMove, yMove);

      // Bind some methods
      _draw.click(function () {
        return _this7.swapColors(_draw.node);
      });
      _draw.mousemove(function (e) {
        return _this7.updateColor(_this7, e);
      });
      this.svg = _draw;
    }
  }, {
    key: 'componentDidMount',
    value: function componentDidMount() {
      this.updatePool();
    }
  }, {
    key: 'render',
    value: function render() {
      var _this8 = this;

      return __WEBPACK_IMPORTED_MODULE_8_react___default.a.createElement(
        'div',
        { className: 'Container' },
        __WEBPACK_IMPORTED_MODULE_8_react___default.a.createElement(
          'div',
          { className: 'Home' },
          __WEBPACK_IMPORTED_MODULE_8_react___default.a.createElement(
            'h1',
            null,
            'Shaperator'
          ),
          __WEBPACK_IMPORTED_MODULE_8_react___default.a.createElement(
            'p',
            { className: 'Home-intro' },
            'Shapes drawn by AI'
          )
        ),
        __WEBPACK_IMPORTED_MODULE_8_react___default.a.createElement(
          'div',
          { className: 'Main' },
          __WEBPACK_IMPORTED_MODULE_8_react___default.a.createElement(
            'div',
            { id: 'svg' },
            !this.loading && this.state.currentPath && __WEBPACK_IMPORTED_MODULE_8_react___default.a.createElement(
              'div',
              { className: 'left-gutter' },
              __WEBPACK_IMPORTED_MODULE_8_react___default.a.createElement(
                'div',
                { className: 'download-buttons' },
                __WEBPACK_IMPORTED_MODULE_8_react___default.a.createElement(
                  'button',
                  {
                    className: 'btn btn-secondary',
                    type: 'button',
                    onClick: function onClick() {
                      return _this8.saveSVG();
                    } },
                  __WEBPACK_IMPORTED_MODULE_8_react___default.a.createElement(__WEBPACK_IMPORTED_MODULE_12_react_icons_lib_fa_arrow_circle_o_down___default.a, null),
                  'SVG'
                ),
                __WEBPACK_IMPORTED_MODULE_8_react___default.a.createElement(
                  'button',
                  {
                    className: 'btn btn-secondary',
                    type: 'button',
                    onClick: function onClick() {
                      return _this8.savePNG();
                    } },
                  __WEBPACK_IMPORTED_MODULE_8_react___default.a.createElement(__WEBPACK_IMPORTED_MODULE_12_react_icons_lib_fa_arrow_circle_o_down___default.a, null),
                  'PNG'
                )
              )
            ),
            !this.loading && this.state.currentPath && __WEBPACK_IMPORTED_MODULE_8_react___default.a.createElement(
              'div',
              { className: 'right-gutter' },
              __WEBPACK_IMPORTED_MODULE_8_react___default.a.createElement(
                'button',
                { className: 'next', onClick: function onClick() {
                    return _this8.nextPath();
                  } },
                __WEBPACK_IMPORTED_MODULE_8_react___default.a.createElement(__WEBPACK_IMPORTED_MODULE_13_react_icons_lib_ti_arrow_right_thick___default.a, null)
              )
            )
          ),
          __WEBPACK_IMPORTED_MODULE_8_react___default.a.createElement(
            'div',
            { className: 'names' },
            !this.state.loading && !this.state.named && __WEBPACK_IMPORTED_MODULE_8_react___default.a.createElement(
              'form',
              { onSubmit: function onSubmit() {
                  return _this8.submitName();
                }, className: 'name-form' },
              __WEBPACK_IMPORTED_MODULE_8_react___default.a.createElement('input', {
                type: 'text',
                placeholder: 'What should we call me?',
                className: 'name-input',
                value: this.state.name,
                onChange: function onChange(e) {
                  return _this8.updateName(e.currentTarget.value);
                }
              }),
              __WEBPACK_IMPORTED_MODULE_8_react___default.a.createElement(
                'span',
                { className: 'input-group-btn' },
                __WEBPACK_IMPORTED_MODULE_8_react___default.a.createElement(
                  'button',
                  {
                    className: 'name-submit',
                    disabled: this.state.name.length < 2,
                    type: 'button',
                    onClick: function onClick() {
                      return _this8.submitName();
                    }
                  },
                  'Submit'
                )
              )
            ),
            !this.state.loading && this.state.named && __WEBPACK_IMPORTED_MODULE_8_react___default.a.createElement(
              'div',
              { className: 'names-list' },
              this.renderNames()
            )
          )
        )
      );
    }
  }]);

  return Home;
}(__WEBPACK_IMPORTED_MODULE_8_react__["Component"]);

/* harmony default export */ __webpack_exports__["a"] = (Home);

/***/ }),

/***/ "./src/index.js":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__server__ = __webpack_require__("./src/server.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_http__ = __webpack_require__("http");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_http___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_http__);



//import 'bootstrap/dist/css/bootstrap.css';
//import 'node_modules/bootstrap/dist/css/bootstrap.css';

var server = __WEBPACK_IMPORTED_MODULE_1_http___default.a.createServer(__WEBPACK_IMPORTED_MODULE_0__server__["a" /* default */]);

var currentApp = __WEBPACK_IMPORTED_MODULE_0__server__["a" /* default */];

server.listen(3000 || 3000);

if (false) {
  console.log('✅  Server-side HMR Enabled!');

  module.hot.accept('./server', function () {
    console.log('🔁  HMR Reloading `./server`...');
    server.removeListener('request', currentApp);
    var newApp = require('./server').default;
    server.on('request', newApp);
    currentApp = newApp;
  });
}

/***/ }),

/***/ "./src/react.svg":
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "static/media/react.9a28da9f.svg";

/***/ }),

/***/ "./src/server.js":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__App__ = __webpack_require__("./src/App.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_react__ = __webpack_require__("react");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_react___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_react__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_react_router_dom__ = __webpack_require__("react-router-dom");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_react_router_dom___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2_react_router_dom__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_express__ = __webpack_require__("express");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_express___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3_express__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_react_dom_server__ = __webpack_require__("react-dom/server");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_react_dom_server___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_4_react_dom_server__);






var assets = __webpack_require__("./build/assets.json");

var server = __WEBPACK_IMPORTED_MODULE_3_express___default()();
server.disable('x-powered-by').use(__WEBPACK_IMPORTED_MODULE_3_express___default.a.static("/Users/nate/Dev/shaperator/build/public")).get('/*', function (req, res) {
  var context = {};
  var markup = Object(__WEBPACK_IMPORTED_MODULE_4_react_dom_server__["renderToString"])(__WEBPACK_IMPORTED_MODULE_1_react___default.a.createElement(
    __WEBPACK_IMPORTED_MODULE_2_react_router_dom__["StaticRouter"],
    { context: context, location: req.url },
    __WEBPACK_IMPORTED_MODULE_1_react___default.a.createElement(__WEBPACK_IMPORTED_MODULE_0__App__["a" /* default */], null)
  ));

  if (context.url) {
    res.redirect(context.url);
  } else {
    res.status(200).send('<!doctype html>\n    <html lang="">\n    <head>\n        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />\n        <meta charSet=\'utf-8\' />\n        <title>Welcome to Razzle</title>\n        <meta name="viewport" content="width=device-width, initial-scale=1">\n        ' + (assets.client.css ? '<link rel="stylesheet" href="' + assets.client.css + '">' : '') + '\n        ' + ( true ? '<script src="' + assets.client.js + '" defer></script>' : '<script src="' + assets.client.js + '" defer crossorigin></script>') + '\n    </head>\n    <body>\n        <div id="root">' + markup + '</div>\n    </body>\n</html>');
  }
});

/* harmony default export */ __webpack_exports__["a"] = (server);

/***/ }),

/***/ 0:
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__("./src/index.js");


/***/ }),

/***/ "babel-runtime/core-js/json/stringify":
/***/ (function(module, exports) {

module.exports = require("babel-runtime/core-js/json/stringify");

/***/ }),

/***/ "babel-runtime/core-js/object/get-prototype-of":
/***/ (function(module, exports) {

module.exports = require("babel-runtime/core-js/object/get-prototype-of");

/***/ }),

/***/ "babel-runtime/helpers/classCallCheck":
/***/ (function(module, exports) {

module.exports = require("babel-runtime/helpers/classCallCheck");

/***/ }),

/***/ "babel-runtime/helpers/createClass":
/***/ (function(module, exports) {

module.exports = require("babel-runtime/helpers/createClass");

/***/ }),

/***/ "babel-runtime/helpers/inherits":
/***/ (function(module, exports) {

module.exports = require("babel-runtime/helpers/inherits");

/***/ }),

/***/ "babel-runtime/helpers/possibleConstructorReturn":
/***/ (function(module, exports) {

module.exports = require("babel-runtime/helpers/possibleConstructorReturn");

/***/ }),

/***/ "express":
/***/ (function(module, exports) {

module.exports = require("express");

/***/ }),

/***/ "http":
/***/ (function(module, exports) {

module.exports = require("http");

/***/ }),

/***/ "mathjs":
/***/ (function(module, exports) {

module.exports = require("mathjs");

/***/ }),

/***/ "react":
/***/ (function(module, exports) {

module.exports = require("react");

/***/ }),

/***/ "react-dom/server":
/***/ (function(module, exports) {

module.exports = require("react-dom/server");

/***/ }),

/***/ "react-icons/lib/fa/arrow-circle-o-down":
/***/ (function(module, exports) {

module.exports = require("react-icons/lib/fa/arrow-circle-o-down");

/***/ }),

/***/ "react-icons/lib/ti/arrow-right-thick":
/***/ (function(module, exports) {

module.exports = require("react-icons/lib/ti/arrow-right-thick");

/***/ }),

/***/ "react-router-dom":
/***/ (function(module, exports) {

module.exports = require("react-router-dom");

/***/ }),

/***/ "react-router-dom/Route":
/***/ (function(module, exports) {

module.exports = require("react-router-dom/Route");

/***/ }),

/***/ "react-router-dom/Switch":
/***/ (function(module, exports) {

module.exports = require("react-router-dom/Switch");

/***/ }),

/***/ "svg.js":
/***/ (function(module, exports) {

module.exports = require("svg.js");

/***/ }),

/***/ "tinycolor2":
/***/ (function(module, exports) {

module.exports = require("tinycolor2");

/***/ }),

/***/ "underscore":
/***/ (function(module, exports) {

module.exports = require("underscore");

/***/ })

/******/ });
//# sourceMappingURL=server.js.map