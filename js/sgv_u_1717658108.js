const ls = [];
const botDetectionResult = {
	isBot: false,
	name: 'JS_Browser_Emulator',
	category: '',
	producer: 'JS_BotD'
};

let usesAdBlocker = false;
let isIncognito = false;
let clientSideDetectionExecuted = false;


// window.onAdBlockerDetected = function () {
// 	const targetBlankLinks = document.querySelectorAll('a[target="_blank"]');
// 	targetBlankLinks.forEach(link => link.removeAttribute('target'));
// }

async function getPageLoadDuration() {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			const [navigationEntry] = performance.getEntriesByType('navigation');

			if (navigationEntry) {
				const loadTime = Math.round(navigationEntry.loadEventEnd - navigationEntry.startTime);
				const renderTime = Math.round(navigationEntry.loadEventEnd - navigationEntry.domInteractive);
				return resolve({
					loadTime,
					renderTime
				});
			}

			reject(new Error('Page load timing not available'));
		}, 0);
	});
}

window.onload = async function () {
	let browserTimings = null;
	let loadDuration = null;
	let executionDuration = null;
	try {
		browserTimings = await getPageLoadDuration();
		
		if (browserTimings && browserTimings.loadTime) {
			loadDuration = browserTimings.loadTime;
		}
		
		if (browserTimings && browserTimings.renderTime) {
			executionDuration = browserTimings.renderTime;
		}
	} catch (e) {
		// console.error(e);
	}
	
	var idAnalytics = await getIdAnalyticsT();

	if (!clientSideDetectionExecuted) {
		usesAdBlocker = hasAdBlocker();
		await detectBot(botDetectionResult);
		await detectIncognitoMode();
		incrementRequestCount();
		clientSideDetectionExecuted = true;
		
		
		if (usesAdBlocker) {
			if (typeof window.onAdBlockerDetected === 'function') {
				try {
					window.onAdBlockerDetected();
				} catch (e) { console.error(e); }

			}
		}
	}
	
	
	const idGA4 = await getIdGA4();
	if(idGA4!="no_cid"){
		idAnalytics=idGA4;
	}

	//console.log(idGA4);
	var updData = {
		id_request: id_request,
		id_session: id_session,
		id_user,
		user_returning: (typeof retur_user !== 'undefined') ? retur_user : user_returning,
		user_adblocker: usesAdBlocker,
		user_incognito: Number(isIncognito),
		bot: Number(botDetectionResult.isBot),
		bot_name: botDetectionResult.isBot ? botDetectionResult.name : null,
		bot_category: botDetectionResult.isBot ? `JS_${botDetectionResult.category}` : null,
		bot_producer: botDetectionResult.isBot ? botDetectionResult.producer : null,
		browser_page_load_time: loadDuration,
		browser_execution_time: executionDuration,
		id_analytics: idAnalytics,
		time_user: Math.floor(Date.now() / 1000)
	};
	sendAnalytics(updData);
	setTimeout(() => {
		sgv_detect();
	}, 1000);
};

window.sgv_detect = async function () {
	if (!clientSideDetectionExecuted) {
		usesAdBlocker = hasAdBlocker();
		await detectBot(botDetectionResult);
		await detectIncognitoMode();
		incrementRequestCount();
		clientSideDetectionExecuted = true;

		if (usesAdBlocker) {
			if (typeof window.onAdBlockerDetected === 'function') {
				try {
					window.onAdBlockerDetected();
				} catch (e) {
					console.error(e);
				}
			}
		}
	}
	
	try {
		window.dataLayer = window.dataLayer || [];
		window.dataLayer.push({
			sgv_b_js: new Boolean(botDetectionResult.isBot).valueOf(),
			sgv_a_bl: usesAdBlocker,
			sgv_i_wi: isIncognito,
			event: 'DetectionCompleted'
		});
	} catch (e) {
		console.error("SGV GTM detection error");
		console.error(e);
	}
}

function incrementRequestCount() {
	let oldCount = readCookie('sgv_req_count') || 0;
	if (oldCount) {
		setCookie('sgv_req_count', '', -1);
	}

	let count = readCookie('sgv_requests_count') || 0;
	count++;
	setCookie('sgv_requests_count', count, 30);
	return count;
}

const sendEvent = function (evName, evCategory, evAction, evValue) {

	var evRetryvn = evName + evCategory + evAction + evValue;
	if (ls[evRetryvn]) {
		ls[evRetryvn] = Number(ls[evRetryvn]) + 1;
	} else {
		ls[evRetryvn] = 1;
	}

	var evData = {
		id_request: id_request,
		id_session: id_session,
		event_name: evName,
		event_category: evCategory,
		event_action: evAction,
		event_value: evValue,
		event_retry: ls[evRetryvn]

	};
	//sendAnalytics(evData);
}

const sendAnalytics = function (data) {
	let url='/js/api';
	//if domain is sinitest.com
	if(window.location.hostname.indexOf("findmysoft.com")>-1){
		url='https://www.signidata.com/js/api';
	}
	$.ajax({
		url,
		method: 'post',
		crossDomain: true,
		dataType: "json",
		data: JSON.stringify(data)
	}).done(function (response) {
		//console.log(response);
	});
}
const frm=function(str){
    var ret=""
    for(i = 0, len = str.length; i < len;  i++) {
      if(i===8 || i===12 || i===16 || i===20){
        ret+="-";
      }
      ret+=str[i]
     }
   
     return ret
  }

  const sendTRacker=function(){
	ga(function() {   
		// look for a tracker called 'identified' (exists
		//   only after login)
		var tracker = ga.getByName('identified');
		if (typeof(tracker) == 'undefined') {
		  // if does not exist, send the event using 
		  //   the default tracker
		  //ga('send', 'pageview');
		  ga('send', 'event', 'authentication', 'user-id available');
		} else {
		  // if exists, send the event using that tracker
		  //ga('identified.send', 'pageview');
		  ga('identified.send', 'event', 'authentication', 'user-id available');
		}
	  });
	
}
const sendImpression=function(impression){
		var updData = {impression:impression};
		//sendAnalytics(updData);
 }

const getIdAnalyticsT = function () {
	var interval = 0;
	var ret_id = "";
	return new Promise(function (res, rej) {
		var int = setInterval(function () {
			if (typeof ga === "function") {
				
				if (typeof ga.getAll === "function") {
					var cl_id=frm(id_request);
					//ga('create',ga.getAll()[0].b.data.values[':trackingId'] , {'clientId':  cl_id});
					var trackers = ga.getAll();
					var i, len;
					for (i = 0, len = trackers.length; i < len; i += 1) {
						ret_id = trackers[i].get('clientId').toLowerCase().trim();
						clearInterval(int);
						res(ret_id);
					}
				}
			}
			interval++;
			if (interval > 20) {
				clearInterval(int);
				res("no_cid");
			}
		}, 50);
	});
};

const getIdGA4 = function(){
	//console.log(typeof gtag);
	if(typeof gtag==="function"){
		return new Promise(resolve => {
			gtag('get', 'G-MTVG2FWD4H', 'client_id', (client_id) => {
				//console.log(client_id);
				resolve(client_id);
			  })
		  });
	}
	return "no_cid";

}
/**
 * Simple adblock detection
 */
function hasAdBlocker() {
  function hasFairAdBlocker() {
    const style = document.getElementById('stndz-style');
    return style !== null;
  }

  function hasEasyListBasedBlocker() {
    const bait = document.createElement('div');
    bait.setAttribute('class', 'zn-sponsored-outbrain-cl pub_300x250 pub_300x250m pub_728x90 text-ad textAd text_ad text_ads text-ads text-ad-links ad-text adSense adBlock adContent adBanner');
    bait.setAttribute('style', 'width: 1px !important; height: 1px !important; position: absolute !important; top: -10px !important; left: -10px; color: rgba(0, 0, 0, 0); background-color: rgba(0, 0, 0, 0)');
    document.body.appendChild(bait);

    if(bait.offsetParent === null
      || bait.offsetHeight == 0
      || bait.offsetTop == 0
      || bait.offsetLeft == 0
      || bait.offsetWidth == 0
      || bait.clientHeight == 0
      || bait.clientWidth == 0) {
      return true;
    } else if(window.getComputedStyle !== undefined) {
      const baitCS = window.getComputedStyle(bait, null);
      if(baitCS && (baitCS.getPropertyValue('display') == 'none' || baitCS.getPropertyValue('visibility') == 'hidden')) {
        return true;
      }
    }

    return false;
  }


  if (hasFairAdBlocker())  {
    return true;
  }

  return hasEasyListBasedBlocker();
}

async function detectBot(detectionResult = {}) {
	if (typeof BotD === 'undefined') {
		return;
	}
	
	const botCategoryAbbr = {
		'unknown': 'unknown',
		'headless_chrome': 'head_chr',
		'phantomjs': 'phantomjs',
		'nightmare': 'nightmare',
		'selenium': 'selenium',
		'electron': 'electr',
		'nodejs': 'nodejs',
		'rhino': 'rhino',
		'couchjs': 'couchjs',
		'sequentum': 'sequentum',
		'slimerjs': 'slimerjs',
		'cefsharp': 'cefsharp'
}

    try {
		const botd = await BotD.load();
        const result = await botd.detect();
		detectionResult.isBot = Number(result.bot);
		if (detectionResult.isBot) {
			try {

				detectionResult.category = botCategoryAbbr[result.botKind];
				if (!detectionResult.category) {
					detectionResult.category = result.botKind.slice(0, 10);
				}
			} catch (e) {
				// console.error(e);
				detectionResult.category = 'unknown';
			}
			
			detectionResult.category = detectionResult.category.replace(/ /g, ' ');
		}
    } catch (e) {
        return null;
    }
}

async function detectIncognitoMode() {
	if (typeof detectIncognito !== 'function') {
		return;
	}
	
	try {
		const result = await detectIncognito();
		isIncognito = result.isPrivate;
	} catch (e) {
		// console.error('Failed to detect incognito mode');
		// console.error(e);
	}
}


if (typeof getRootDomain === 'undefined') {
	function getRootDomain() {
		const hostname = window.location.hostname;
		const parts = hostname.split('.').reverse();

		if (parts.length >= 2) {
			const rootDomain = parts[1] + '.' + parts[0];
			// Handle cases like "co.uk" or "com.au"
			if (parts.length > 2 && parts[1].length <= 3 && parts[0].length <= 3) {
				return parts[2] + '.' + rootDomain;
			}
			return rootDomain;
		}

		return hostname;
	}
}

if (typeof setCookie === 'undefined') {
	function setCookie(cname, cvalue, exdays) {
	    var domain = getRootDomain();
        var d = new Date();
        d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
        var expires = "expires=" + d.toUTCString();
	    var cookieDomain = "domain=." + domain;
        document.cookie = cname + "=" + cvalue + ";" + expires + ";" + cookieDomain + ";path=/";
	}
}

if (typeof readCookie === 'undefined') {
	function readCookie(name) {
		var nameEQ = encodeURIComponent(name) + "=";
		var ca = document.cookie.split(';');
		for (var i = 0; i < ca.length; i++) {
			var c = ca[i];
			while (c.charAt(0) === ' ')
				c = c.substring(1, c.length);
			if (c.indexOf(nameEQ) === 0)
				return decodeURIComponent(c.substring(nameEQ.length, c.length));
		}
		return null;
	}
}

var BotD=function(e){"use strict";var n=function(e,t){return n=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(e,n){e.__proto__=n}||function(e,n){for(var t in n)Object.prototype.hasOwnProperty.call(n,t)&&(e[t]=n[t])},n(e,t)};function t(e,n,t,r){return new(t||(t=Promise))((function(i,o){function a(e){try{s(r.next(e))}catch(e){o(e)}}function u(e){try{s(r.throw(e))}catch(e){o(e)}}function s(e){var n;e.done?i(e.value):(n=e.value,n instanceof t?n:new t((function(e){e(n)}))).then(a,u)}s((r=r.apply(e,n||[])).next())}))}function r(e,n){var t,r,i,o,a={label:0,sent:function(){if(1&i[0])throw i[1];return i[1]},trys:[],ops:[]};return o={next:u(0),throw:u(1),return:u(2)},"function"==typeof Symbol&&(o[Symbol.iterator]=function(){return this}),o;function u(u){return function(s){return function(u){if(t)throw new TypeError("Generator is already executing.");for(;o&&(o=0,u[0]&&(a=0)),a;)try{if(t=1,r&&(i=2&u[0]?r.return:u[0]?r.throw||((i=r.return)&&i.call(r),0):r.next)&&!(i=i.call(r,u[1])).done)return i;switch(r=0,i&&(u=[2&u[0],i.value]),u[0]){case 0:case 1:i=u;break;case 4:return a.label++,{value:u[1],done:!1};case 5:a.label++,r=u[1],u=[0];continue;case 7:u=a.ops.pop(),a.trys.pop();continue;default:if(!(i=a.trys,(i=i.length>0&&i[i.length-1])||6!==u[0]&&2!==u[0])){a=0;continue}if(3===u[0]&&(!i||u[1]>i[0]&&u[1]<i[3])){a.label=u[1];break}if(6===u[0]&&a.label<i[1]){a.label=i[1],i=u;break}if(i&&a.label<i[2]){a.label=i[2],a.ops.push(u);break}i[2]&&a.ops.pop(),a.trys.pop();continue}u=n.call(e,a)}catch(e){u=[6,e],r=0}finally{t=i=0}if(5&u[0])throw u[1];return{value:u[0]?u[1]:void 0,done:!0}}([u,s])}}}function i(e,n,t){if(t||2===arguments.length)for(var r,i=0,o=n.length;i<o;i++)!r&&i in n||(r||(r=Array.prototype.slice.call(n,0,i)),r[i]=n[i]);return e.concat(r||Array.prototype.slice.call(n))}var o="1.9.1",a={Awesomium:"awesomium",Cef:"cef",CefSharp:"cefsharp",CoachJS:"coachjs",Electron:"electron",FMiner:"fminer",Geb:"geb",NightmareJS:"nightmarejs",Phantomas:"phantomas",PhantomJS:"phantomjs",Rhino:"rhino",Selenium:"selenium",Sequentum:"sequentum",SlimerJS:"slimerjs",WebDriverIO:"webdriverio",WebDriver:"webdriver",HeadlessChrome:"headless_chrome",Unknown:"unknown"},u=function(e){function t(n,r){var i=e.call(this,r)||this;return i.state=n,i.name="BotdError",Object.setPrototypeOf(i,t.prototype),i}return function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Class extends value "+String(t)+" is not a constructor or null");function r(){this.constructor=e}n(e,t),e.prototype=null===t?Object.create(t):(r.prototype=t.prototype,new r)}(t,e),t}(Error);function s(e,n){var t={},r={bot:!1};for(var i in n){var o=(0,n[i])(e),u={bot:!1};"string"==typeof o?u={bot:!0,botKind:o}:o&&(u={bot:!0,botKind:a.Unknown}),t[i]=u,u.bot&&(r=u)}return[t,r]}function c(e){return t(this,void 0,void 0,(function(){var n,i,o=this;return r(this,(function(a){switch(a.label){case 0:return n={},i=Object.keys(e),[4,Promise.all(i.map((function(i){return t(o,void 0,void 0,(function(){var t,o,a,s,c;return r(this,(function(r){switch(r.label){case 0:t=e[i],r.label=1;case 1:return r.trys.push([1,3,,4]),o=n,a=i,c={},[4,t()];case 2:return o[a]=(c.value=r.sent(),c.state=0,c),[3,4];case 3:return s=r.sent(),n[i]=s instanceof u?{state:s.state,error:"".concat(s.name,": ").concat(s.message)}:{state:-3,error:s instanceof Error?"".concat(s.name,": ").concat(s.message):String(s)},[3,4];case 4:return[2]}}))}))})))];case 1:return a.sent(),[2,n]}}))}))}function d(e,n){return-1!==e.indexOf(n)}function l(e,n){return-1!==e.indexOf(n)}function f(e){return Object.getOwnPropertyNames(e)}function v(e){for(var n=[],t=1;t<arguments.length;t++)n[t-1]=arguments[t];for(var r=function(n){if("string"==typeof n){if(d(e,n))return{value:!0}}else if(null!=function(e,n){if("find"in e)return e.find(n);for(var t=0;t<e.length;t++)if(n(e[t],t,e))return e[t]}(e,(function(e){return n.test(e)})))return{value:!0}},i=0,o=n;i<o.length;i++){var a=r(o[i]);if("object"==typeof a)return a.value}return!1}function w(e){return e.reduce((function(e,n){return e+(n?1:0)}),0)}var m={detectAppVersion:function(e){var n=e.appVersion;return 0===n.state&&(/headless/i.test(n.value)?a.HeadlessChrome:/electron/i.test(n.value)?a.Electron:/slimerjs/i.test(n.value)?a.SlimerJS:void 0)},detectDocumentAttributes:function(e){var n=e.documentElementKeys;return 0===n.state&&(v(n.value,"selenium","webdriver","driver")?a.Selenium:void 0)},detectErrorTrace:function(e){var n=e.errorTrace;return 0===n.state&&(/PhantomJS/i.test(n.value)?a.PhantomJS:void 0)},detectEvalLengthInconsistency:function(e){var n=e.evalLength,t=e.browserKind,r=e.browserEngineKind;if(0===n.state&&0===t.state&&0===r.state){var i=n.value;return"unknown"!==r.value&&(37===i&&!d(["webkit","gecko"],r.value)||39===i&&!d(["internet_explorer"],t.value)||33===i&&!d(["chromium"],r.value))}},detectFunctionBind:function(e){if(-2===e.functionBind.state)return a.PhantomJS},detectLanguagesLengthInconsistency:function(e){var n=e.languages;if(0===n.state&&0===n.value.length)return a.HeadlessChrome},detectNotificationPermissions:function(e){var n=e.notificationPermissions,t=e.browserKind;return 0===t.state&&"chrome"===t.value&&(0===n.state&&n.value?a.HeadlessChrome:void 0)},detectPluginsArray:function(e){var n=e.pluginsArray;if(0===n.state&&!n.value)return a.HeadlessChrome},detectPluginsLengthInconsistency:function(e){var n=e.pluginsLength,t=e.android,r=e.browserKind,i=e.browserEngineKind;if(0===n.state&&0===t.state&&0===r.state&&0===i.state&&"chrome"===r.value&&!t.value&&"chromium"===i.value)return 0===n.value?a.HeadlessChrome:void 0},detectProcess:function(e){var n,t=e.process;return 0===t.state&&("renderer"===t.value.type||null!=(null===(n=t.value.versions)||void 0===n?void 0:n.electron)?a.Electron:void 0)},detectUserAgent:function(e){var n=e.userAgent;return 0===n.state&&(/PhantomJS/i.test(n.value)?a.PhantomJS:/Headless/i.test(n.value)?a.HeadlessChrome:/Electron/i.test(n.value)?a.Electron:/slimerjs/i.test(n.value)?a.SlimerJS:void 0)},detectWebDriver:function(e){var n=e.webDriver;if(0===n.state&&n.value)return a.HeadlessChrome},detectWebGL:function(e){var n=e.webGL;if(0===n.state){var t=n.value,r=t.vendor,i=t.renderer;if("Brian Paul"==r&&"Mesa OffScreen"==i)return a.HeadlessChrome}},detectWindowExternal:function(e){var n=e.windowExternal;return 0===n.state&&(/Sequentum/i.test(n.value)?a.Sequentum:void 0)},detectWindowSize:function(e){var n=e.windowSize,t=e.documentFocus;if(0!==n.state||0!==t.state)return!1;var r=n.value,i=r.outerWidth,o=r.outerHeight;return t.value&&0===i&&0===o?a.HeadlessChrome:void 0},detectMimeTypesConsistent:function(e){var n=e.mimeTypesConsistent;if(0===n.state&&!n.value)return a.Unknown},detectProductSub:function(e){var n=e.productSub,t=e.browserKind;return 0===n.state&&0===t.state&&("chrome"!==t.value&&"safari"!==t.value&&"opera"!==t.value&&"wechat"!==t.value||"20030107"===n.value?void 0:a.Unknown)},detectDistinctiveProperties:function(e){var n=e.distinctiveProps;if(0!==n.state)return!1;var t,r=n.value;for(t in r)if(r[t])return t}};function p(){var e,n,t=window,r=navigator;return w(["webkitPersistentStorage"in r,"webkitTemporaryStorage"in r,0===r.vendor.indexOf("Google"),"webkitResolveLocalFileSystemURL"in t,"BatteryManager"in t,"webkitMediaStream"in t,"webkitSpeechGrammar"in t])>=5?"chromium":w(["ApplePayError"in t,"CSSPrimitiveValue"in t,"Counter"in t,0===r.vendor.indexOf("Apple"),"getStorageUpdates"in r,"WebKitMediaKeys"in t])>=4?"webkit":w(["buildID"in navigator,"MozAppearance"in(null!==(n=null===(e=document.documentElement)||void 0===e?void 0:e.style)&&void 0!==n?n:{}),"onmozfullscreenchange"in t,"mozInnerScreenX"in t,"CSSMozDocumentRule"in t,"CanvasCaptureMediaStream"in t])>=4?"gecko":"unknown"}var h={android:function(){var e=p(),n="chromium"===e,t="gecko"===e;if(!n&&!t)return!1;var r=window;return w(["onorientationchange"in r,"orientation"in r,n&&!("SharedWorker"in r),t&&/android/i.test(navigator.appVersion)])>=2},browserKind:function(){var e,n=null===(e=navigator.userAgent)||void 0===e?void 0:e.toLowerCase();return l(n,"edg/")?"edge":l(n,"trident")||l(n,"msie")?"internet_explorer":l(n,"wechat")?"wechat":l(n,"firefox")?"firefox":l(n,"opera")||l(n,"opr")?"opera":l(n,"chrome")?"chrome":l(n,"safari")?"safari":"unknown"},browserEngineKind:p,documentFocus:function(){return void 0!==document.hasFocus&&document.hasFocus()},userAgent:function(){return navigator.userAgent},appVersion:function(){var e=navigator.appVersion;if(null==e)throw new u(-1,"navigator.appVersion is undefined");return e},rtt:function(){if(void 0===navigator.connection)throw new u(-1,"navigator.connection is undefined");if(void 0===navigator.connection.rtt)throw new u(-1,"navigator.connection.rtt is undefined");return navigator.connection.rtt},windowSize:function(){return{outerWidth:window.outerWidth,outerHeight:window.outerHeight,innerWidth:window.innerWidth,innerHeight:window.innerHeight}},pluginsLength:function(){if(void 0===navigator.plugins)throw new u(-1,"navigator.plugins is undefined");if(void 0===navigator.plugins.length)throw new u(-3,"navigator.plugins.length is undefined");return navigator.plugins.length},pluginsArray:function(){if(void 0===navigator.plugins)throw new u(-1,"navigator.plugins is undefined");if(void 0===window.PluginArray)throw new u(-1,"window.PluginArray is undefined");return navigator.plugins instanceof PluginArray},errorTrace:function(){try{null[0]()}catch(e){if(e instanceof Error&&null!=e.stack)return e.stack.toString()}throw new u(-3,"errorTrace signal unexpected behaviour")},productSub:function(){var e=navigator.productSub;if(void 0===e)throw new u(-1,"navigator.productSub is undefined");return e},windowExternal:function(){if(void 0===window.external)throw new u(-1,"window.external is undefined");var e=window.external;if("function"!=typeof e.toString)throw new u(-2,"window.external.toString is not a function");return e.toString()},mimeTypesConsistent:function(){if(void 0===navigator.mimeTypes)throw new u(-1,"navigator.mimeTypes is undefined");for(var e=navigator.mimeTypes,n=Object.getPrototypeOf(e)===MimeTypeArray.prototype,t=0;t<e.length;t++)n&&(n=Object.getPrototypeOf(e[t])===MimeType.prototype);return n},evalLength:function(){return eval.toString().length},webGL:function(){var e=document.createElement("canvas");if("function"!=typeof e.getContext)throw new u(-2,"HTMLCanvasElement.getContext is not a function");var n=e.getContext("webgl");if(null===n)throw new u(-4,"WebGLRenderingContext is null");if("function"!=typeof n.getParameter)throw new u(-2,"WebGLRenderingContext.getParameter is not a function");return{vendor:n.getParameter(n.VENDOR),renderer:n.getParameter(n.RENDERER)}},webDriver:function(){if(null==navigator.webdriver)throw new u(-1,"navigator.webdriver is undefined");return navigator.webdriver},languages:function(){var e,n=navigator,t=[],r=n.language||n.userLanguage||n.browserLanguage||n.systemLanguage;if(void 0!==r&&t.push([r]),Array.isArray(n.languages))"chromium"===p()&&w([!("MediaSettingsRange"in(e=window)),"RTCEncodedAudioFrame"in e,""+e.Intl=="[object Intl]",""+e.Reflect=="[object Reflect]"])>=3||t.push(n.languages);else if("string"==typeof n.languages){var i=n.languages;i&&t.push(i.split(","))}return t},notificationPermissions:function(){return t(this,void 0,void 0,(function(){var e,n;return r(this,(function(t){switch(t.label){case 0:if(void 0===window.Notification)throw new u(-1,"window.Notification is undefined");if(void 0===navigator.permissions)throw new u(-1,"navigator.permissions is undefined");if("function"!=typeof(e=navigator.permissions).query)throw new u(-2,"navigator.permissions.query is not a function");t.label=1;case 1:return t.trys.push([1,3,,4]),[4,e.query({name:"notifications"})];case 2:return n=t.sent(),[2,"denied"===window.Notification.permission&&"prompt"===n.state];case 3:throw t.sent(),new u(-3,"notificationPermissions signal unexpected behaviour");case 4:return[2]}}))}))},documentElementKeys:function(){if(void 0===document.documentElement)throw new u(-1,"document.documentElement is undefined");var e=document.documentElement;if("function"!=typeof e.getAttributeNames)throw new u(-2,"document.documentElement.getAttributeNames is not a function");return e.getAttributeNames()},functionBind:function(){if(void 0===Function.prototype.bind)throw new u(-2,"Function.prototype.bind is undefined");return Function.prototype.bind.toString()},process:function(){var e=window.process,n="window.process is";if(void 0===e)throw new u(-1,"".concat(n," undefined"));if(e&&"object"!=typeof e)throw new u(-3,"".concat(n," not an object"));return e},distinctiveProps:function(){var e,n,t=((e={})[a.Awesomium]={window:["awesomium"]},e[a.Cef]={window:["RunPerfTest"]},e[a.CefSharp]={window:["CefSharp"]},e[a.CoachJS]={window:["emit"]},e[a.FMiner]={window:["fmget_targets"]},e[a.Geb]={window:["geb"]},e[a.NightmareJS]={window:["__nightmare","nightmare"]},e[a.Phantomas]={window:["__phantomas"]},e[a.PhantomJS]={window:["callPhantom","_phantom"]},e[a.Rhino]={window:["spawn"]},e[a.Selenium]={window:["_Selenium_IDE_Recorder","_selenium","calledSelenium",/^([a-z]){3}_.*_(Array|Promise|Symbol)$/],document:["__selenium_evaluate","selenium-evaluate","__selenium_unwrapped"]},e[a.WebDriverIO]={window:["wdioElectron"]},e[a.WebDriver]={window:["webdriver","__webdriverFunc","__lastWatirAlert","__lastWatirConfirm","__lastWatirPrompt","_WEBDRIVER_ELEM_CACHE","ChromeDriverw"],document:["__webdriver_script_fn","__driver_evaluate","__webdriver_evaluate","__fxdriver_evaluate","__driver_unwrapped","__webdriver_unwrapped","__fxdriver_unwrapped","__webdriver_script_fn","__webdriver_script_func","__webdriver_script_function","$cdc_asdjflasutopfhvcZLmcf","$cdc_asdjflasutopfhvcZLmcfl_","$chrome_asyncScriptInfo","__$webdriverAsyncExecutor"]},e[a.HeadlessChrome]={window:["domAutomation","domAutomationController"]},e),r={},o=f(window),u=[];for(n in void 0!==window.document&&(u=f(window.document)),t){var s=t[n];if(void 0!==s){var c=void 0!==s.window&&v.apply(void 0,i([o],s.window,!1)),d=!(void 0===s.document||!u.length)&&v.apply(void 0,i([u],s.document,!1));r[n]=c||d}}return r}},g=function(){function e(){this.components=void 0,this.detections=void 0}return e.prototype.getComponents=function(){return this.components},e.prototype.getDetections=function(){return this.detections},e.prototype.detect=function(){if(void 0===this.components)throw new Error("BotDetector.detect can't be called before BotDetector.collect");var e=s(this.components,m),n=e[0],t=e[1];return this.detections=n,t},e.prototype.collect=function(){return t(this,void 0,void 0,(function(){var e;return r(this,(function(n){switch(n.label){case 0:return e=this,[4,c(h)];case 1:return e.components=n.sent(),[2,this.components]}}))}))},e}();function b(e){var n=(void 0===e?{}:e).monitoring,i=void 0===n||n;return t(this,void 0,void 0,(function(){var e;return r(this,(function(n){switch(n.label){case 0:return i&&function(){if(!(window.__fpjs_d_m||Math.random()>=.001))try{var e=new XMLHttpRequest;e.open("get","https://m1.openfpcdn.io/botd/v".concat(o,"/npm-monitoring"),!0),e.send()}catch(e){console.error(e)}}(),[4,(e=new g).collect()];case 1:return n.sent(),[2,e]}}))}))}var y={load:b};return e.BotKind=a,e.BotdError=u,e.collect=c,e.default=y,e.detect=s,e.detectors=m,e.load=b,e.sources=h,Object.defineProperty(e,"__esModule",{value:!0}),e}({});

/*!
 *
 * detectIncognito v1.3.5
 *
 * https://github.com/Joe12387/detectIncognito
 *
 * MIT License
 *
 * Copyright (c) 2021 - 2024 Joe Rutkowski <Joe@dreggle.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * Please keep this comment intact in order to properly abide by the MIT License.
 *
 **/
!function(e,t){"object"==typeof exports&&"object"==typeof module?module.exports=t():"function"==typeof define&&define.amd?define([],t):"object"==typeof exports?exports.detectIncognito=t():e.detectIncognito=t()}(this,(function(){return function(){"use strict";var e={};return{598:function(e,t){var n=this&&this.__awaiter||function(e,t,n,o){return new(n||(n=Promise))((function(r,i){function a(e){try{u(o.next(e))}catch(e){i(e)}}function c(e){try{u(o.throw(e))}catch(e){i(e)}}function u(e){var t;e.done?r(e.value):(t=e.value,t instanceof n?t:new n((function(e){e(t)}))).then(a,c)}u((o=o.apply(e,t||[])).next())}))},o=this&&this.__generator||function(e,t){var n,o,r,i,a={label:0,sent:function(){if(1&r[0])throw r[1];return r[1]},trys:[],ops:[]};return i={next:c(0),throw:c(1),return:c(2)},"function"==typeof Symbol&&(i[Symbol.iterator]=function(){return this}),i;function c(c){return function(u){return function(c){if(n)throw new TypeError("Generator is already executing.");for(;i&&(i=0,c[0]&&(a=0)),a;)try{if(n=1,o&&(r=2&c[0]?o.return:c[0]?o.throw||((r=o.return)&&r.call(o),0):o.next)&&!(r=r.call(o,c[1])).done)return r;switch(o=0,r&&(c=[2&c[0],r.value]),c[0]){case 0:case 1:r=c;break;case 4:return a.label++,{value:c[1],done:!1};case 5:a.label++,o=c[1],c=[0];continue;case 7:c=a.ops.pop(),a.trys.pop();continue;default:if(!(r=a.trys,(r=r.length>0&&r[r.length-1])||6!==c[0]&&2!==c[0])){a=0;continue}if(3===c[0]&&(!r||c[1]>r[0]&&c[1]<r[3])){a.label=c[1];break}if(6===c[0]&&a.label<r[1]){a.label=r[1],r=c;break}if(r&&a.label<r[2]){a.label=r[2],a.ops.push(c);break}r[2]&&a.ops.pop(),a.trys.pop();continue}c=t.call(e,a)}catch(e){c=[6,e],o=0}finally{n=r=0}if(5&c[0])throw c[1];return{value:c[0]?c[1]:void 0,done:!0}}([c,u])}}};function r(){return n(this,void 0,Promise,(function(){return o(this,(function(e){switch(e.label){case 0:return[4,new Promise((function(e,t){var n,o,r="Unknown";function i(t){e({isPrivate:t,browserName:r})}function a(e){return e===eval.toString().length}function c(){void 0!==navigator.maxTouchPoints?function(){var e=String(Math.random());try{window.indexedDB.open(e,1).onupgradeneeded=function(t){var n,o,r=null===(n=t.target)||void 0===n?void 0:n.result;try{r.createObjectStore("test",{autoIncrement:!0}).put(new Blob),i(!1)}catch(e){var a=e;return e instanceof Error&&(a=null!==(o=e.message)&&void 0!==o?o:e),"string"!=typeof a?void i(!1):void i(a.includes("BlobURLs are not yet supported"))}finally{r.close(),window.indexedDB.deleteDatabase(e)}}}catch(e){i(!1)}}():function(){var e=window.openDatabase,t=window.localStorage;try{e(null,null,null,null)}catch(e){return void i(!0)}try{t.setItem("test","1"),t.removeItem("test")}catch(e){return void i(!0)}i(!1)}()}function u(){navigator.webkitTemporaryStorage.queryUsageAndQuota((function(e,t){var n;i(Math.round(t/1048576)<2*Math.round((void 0!==(n=window).performance&&void 0!==n.performance.memory&&void 0!==n.performance.memory.jsHeapSizeLimit?performance.memory.jsHeapSizeLimit:1073741824)/1048576))}),(function(e){t(new Error("detectIncognito somehow failed to query storage quota: "+e.message))}))}function d(){void 0!==self.Promise&&void 0!==self.Promise.allSettled?u():(0,window.webkitRequestFileSystem)(0,1,(function(){i(!1)}),(function(){i(!0)}))}void 0!==(o=navigator.vendor)&&0===o.indexOf("Apple")&&a(37)?(r="Safari",c()):function(){var e=navigator.vendor;return void 0!==e&&0===e.indexOf("Google")&&a(33)}()?(n=navigator.userAgent,r=n.match(/Chrome/)?void 0!==navigator.brave?"Brave":n.match(/Edg/)?"Edge":n.match(/OPR/)?"Opera":"Chrome":"Chromium",d()):void 0!==document.documentElement&&void 0!==document.documentElement.style.MozAppearance&&a(37)?(r="Firefox",i(void 0===navigator.serviceWorker)):void 0!==navigator.msSaveBlob&&a(39)?(r="Internet Explorer",i(void 0===window.indexedDB)):t(new Error("detectIncognito cannot determine the browser"))}))];case 1:return[2,e.sent()]}}))}))}Object.defineProperty(t,"__esModule",{value:!0}),t.detectIncognito=void 0,t.detectIncognito=r,"undefined"!=typeof window&&(window.detectIncognito=r),t.default=r}}[598](0,e),e=e.default}()}));
