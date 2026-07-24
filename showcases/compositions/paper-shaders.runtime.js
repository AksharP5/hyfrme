/*!
 * Visual reference and translated composition structure:
 * https://github.com/Remocn/remocn-collections
 * Pinned source commits are recorded in catalog/showcases.json.
 *
 * This runtime contains React/ReactDOM but no Remotion runtime. HyperFrames
 * owns timing, seeking, validation, and rendering.
 */
/*!
 * Includes @paper-design/shaders-react 0.0.76 under the PolyForm Shield
 * License 1.0.0. Complete terms ship in showcases/assets/licenses.
 */
"use strict";(()=>{var kg=Object.create;var ff=Object.defineProperty;var Zg=Object.getOwnPropertyDescriptor;var Kg=Object.getOwnPropertyNames;var Wg=Object.getPrototypeOf,Jg=Object.prototype.hasOwnProperty;var je=(t,e)=>()=>{try{return e||t((e={exports:{}}).exports,e),e.exports}catch(a){throw e=0,a}};var Ig=(t,e,a,l)=>{if(e&&typeof e=="object"||typeof e=="function")for(let i of Kg(e))!Jg.call(t,i)&&i!==a&&ff(t,i,{get:()=>e[i],enumerable:!(l=Zg(e,i))||l.enumerable});return t};var B=(t,e,a)=>(a=t!=null?kg(Wg(t)):{},Ig(e||!t||!t.__esModule?ff(a,"default",{value:t,enumerable:!0}):a,t));var bf=je(w=>{"use strict";var hr=Symbol.for("react.transitional.element"),Pg=Symbol.for("react.portal"),$g=Symbol.for("react.fragment"),t1=Symbol.for("react.strict_mode"),e1=Symbol.for("react.profiler"),a1=Symbol.for("react.consumer"),l1=Symbol.for("react.context"),i1=Symbol.for("react.forward_ref"),o1=Symbol.for("react.suspense"),n1=Symbol.for("react.memo"),gf=Symbol.for("react.lazy"),r1=Symbol.for("react.activity"),mf=Symbol.iterator;function u1(t){return t===null||typeof t!="object"?null:(t=mf&&t[mf]||t["@@iterator"],typeof t=="function"?t:null)}var vf={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},yf=Object.assign,Sf={};function Al(t,e,a){this.props=t,this.context=e,this.refs=Sf,this.updater=a||vf}Al.prototype.isReactComponent={};Al.prototype.setState=function(t,e){if(typeof t!="object"&&typeof t!="function"&&t!=null)throw Error("takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,t,e,"setState")};Al.prototype.forceUpdate=function(t){this.updater.enqueueForceUpdate(this,t,"forceUpdate")};function Af(){}Af.prototype=Al.prototype;function gr(t,e,a){this.props=t,this.context=e,this.refs=Sf,this.updater=a||vf}var vr=gr.prototype=new Af;vr.constructor=gr;yf(vr,Al.prototype);vr.isPureReactComponent=!0;var pf=Array.isArray;function dr(){}var rt={H:null,A:null,T:null,S:null},xf=Object.prototype.hasOwnProperty;function yr(t,e,a){var l=a.ref;return{$$typeof:hr,type:t,key:e,ref:l!==void 0?l:null,props:a}}function s1(t,e){return yr(t.type,e,t.props)}function Sr(t){return typeof t=="object"&&t!==null&&t.$$typeof===hr}function c1(t){var e={"=":"=0",":":"=2"};return"$"+t.replace(/[=:]/g,function(a){return e[a]})}var df=/\/+/g;function pr(t,e){return typeof t=="object"&&t!==null&&t.key!=null?c1(""+t.key):e.toString(36)}function f1(t){switch(t.status){case"fulfilled":return t.value;case"rejected":throw t.reason;default:switch(typeof t.status=="string"?t.then(dr,dr):(t.status="pending",t.then(function(e){t.status==="pending"&&(t.status="fulfilled",t.value=e)},function(e){t.status==="pending"&&(t.status="rejected",t.reason=e)})),t.status){case"fulfilled":return t.value;case"rejected":throw t.reason}}throw t}function Sl(t,e,a,l,i){var o=typeof t;(o==="undefined"||o==="boolean")&&(t=null);var n=!1;if(t===null)n=!0;else switch(o){case"bigint":case"string":case"number":n=!0;break;case"object":switch(t.$$typeof){case hr:case Pg:n=!0;break;case gf:return n=t._init,Sl(n(t._payload),e,a,l,i)}}if(n)return i=i(t),n=l===""?"."+pr(t,0):l,pf(i)?(a="",n!=null&&(a=n.replace(df,"$&/")+"/"),Sl(i,e,a,"",function(s){return s})):i!=null&&(Sr(i)&&(i=s1(i,a+(i.key==null||t&&t.key===i.key?"":(""+i.key).replace(df,"$&/")+"/")+n)),e.push(i)),1;n=0;var r=l===""?".":l+":";if(pf(t))for(var u=0;u<t.length;u++)l=t[u],o=r+pr(l,u),n+=Sl(l,e,a,o,i);else if(u=u1(t),typeof u=="function")for(t=u.call(t),u=0;!(l=t.next()).done;)l=l.value,o=r+pr(l,u++),n+=Sl(l,e,a,o,i);else if(o==="object"){if(typeof t.then=="function")return Sl(f1(t),e,a,l,i);throw e=String(t),Error("Objects are not valid as a React child (found: "+(e==="[object Object]"?"object with keys {"+Object.keys(t).join(", ")+"}":e)+"). If you meant to render a collection of children, use an array instead.")}return n}function bo(t,e,a){if(t==null)return t;var l=[],i=0;return Sl(t,l,"","",function(o){return e.call(a,o,i++)}),l}function m1(t){if(t._status===-1){var e=t._result;e=e(),e.then(function(a){(t._status===0||t._status===-1)&&(t._status=1,t._result=a)},function(a){(t._status===0||t._status===-1)&&(t._status=2,t._result=a)}),t._status===-1&&(t._status=0,t._result=e)}if(t._status===1)return t._result.default;throw t._result}var hf=typeof reportError=="function"?reportError:function(t){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var e=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof t=="object"&&t!==null&&typeof t.message=="string"?String(t.message):String(t),error:t});if(!window.dispatchEvent(e))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",t);return}console.error(t)},p1={map:bo,forEach:function(t,e,a){bo(t,function(){e.apply(this,arguments)},a)},count:function(t){var e=0;return bo(t,function(){e++}),e},toArray:function(t){return bo(t,function(e){return e})||[]},only:function(t){if(!Sr(t))throw Error("React.Children.only expected to receive a single React element child.");return t}};w.Activity=r1;w.Children=p1;w.Component=Al;w.Fragment=$g;w.Profiler=e1;w.PureComponent=gr;w.StrictMode=t1;w.Suspense=o1;w.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=rt;w.__COMPILER_RUNTIME={__proto__:null,c:function(t){return rt.H.useMemoCache(t)}};w.cache=function(t){return function(){return t.apply(null,arguments)}};w.cacheSignal=function(){return null};w.cloneElement=function(t,e,a){if(t==null)throw Error("The argument must be a React element, but you passed "+t+".");var l=yf({},t.props),i=t.key;if(e!=null)for(o in e.key!==void 0&&(i=""+e.key),e)!xf.call(e,o)||o==="key"||o==="__self"||o==="__source"||o==="ref"&&e.ref===void 0||(l[o]=e[o]);var o=arguments.length-2;if(o===1)l.children=a;else if(1<o){for(var n=Array(o),r=0;r<o;r++)n[r]=arguments[r+2];l.children=n}return yr(t.type,i,l)};w.createContext=function(t){return t={$$typeof:l1,_currentValue:t,_currentValue2:t,_threadCount:0,Provider:null,Consumer:null},t.Provider=t,t.Consumer={$$typeof:a1,_context:t},t};w.createElement=function(t,e,a){var l,i={},o=null;if(e!=null)for(l in e.key!==void 0&&(o=""+e.key),e)xf.call(e,l)&&l!=="key"&&l!=="__self"&&l!=="__source"&&(i[l]=e[l]);var n=arguments.length-2;if(n===1)i.children=a;else if(1<n){for(var r=Array(n),u=0;u<n;u++)r[u]=arguments[u+2];i.children=r}if(t&&t.defaultProps)for(l in n=t.defaultProps,n)i[l]===void 0&&(i[l]=n[l]);return yr(t,o,i)};w.createRef=function(){return{current:null}};w.forwardRef=function(t){return{$$typeof:i1,render:t}};w.isValidElement=Sr;w.lazy=function(t){return{$$typeof:gf,_payload:{_status:-1,_result:t},_init:m1}};w.memo=function(t,e){return{$$typeof:n1,type:t,compare:e===void 0?null:e}};w.startTransition=function(t){var e=rt.T,a={};rt.T=a;try{var l=t(),i=rt.S;i!==null&&i(a,l),typeof l=="object"&&l!==null&&typeof l.then=="function"&&l.then(dr,hf)}catch(o){hf(o)}finally{e!==null&&a.types!==null&&(e.types=a.types),rt.T=e}};w.unstable_useCacheRefresh=function(){return rt.H.useCacheRefresh()};w.use=function(t){return rt.H.use(t)};w.useActionState=function(t,e,a){return rt.H.useActionState(t,e,a)};w.useCallback=function(t,e){return rt.H.useCallback(t,e)};w.useContext=function(t){return rt.H.useContext(t)};w.useDebugValue=function(){};w.useDeferredValue=function(t,e){return rt.H.useDeferredValue(t,e)};w.useEffect=function(t,e){return rt.H.useEffect(t,e)};w.useEffectEvent=function(t){return rt.H.useEffectEvent(t)};w.useId=function(){return rt.H.useId()};w.useImperativeHandle=function(t,e,a){return rt.H.useImperativeHandle(t,e,a)};w.useInsertionEffect=function(t,e){return rt.H.useInsertionEffect(t,e)};w.useLayoutEffect=function(t,e){return rt.H.useLayoutEffect(t,e)};w.useMemo=function(t,e){return rt.H.useMemo(t,e)};w.useOptimistic=function(t,e){return rt.H.useOptimistic(t,e)};w.useReducer=function(t,e,a){return rt.H.useReducer(t,e,a)};w.useRef=function(t){return rt.H.useRef(t)};w.useState=function(t){return rt.H.useState(t)};w.useSyncExternalStore=function(t,e,a){return rt.H.useSyncExternalStore(t,e,a)};w.useTransition=function(){return rt.H.useTransition()};w.version="19.2.3"});var H=je((H2,_f)=>{"use strict";_f.exports=bf()});var Ef=je(ee=>{"use strict";var d1=H();function Bf(t){var e="https://react.dev/errors/"+t;if(1<arguments.length){e+="?args[]="+encodeURIComponent(arguments[1]);for(var a=2;a<arguments.length;a++)e+="&args[]="+encodeURIComponent(arguments[a])}return"Minified React error #"+t+"; visit "+e+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}function xa(){}var te={d:{f:xa,r:function(){throw Error(Bf(522))},D:xa,C:xa,L:xa,m:xa,X:xa,S:xa,M:xa},p:0,findDOMNode:null},h1=Symbol.for("react.portal");function g1(t,e,a){var l=3<arguments.length&&arguments[3]!==void 0?arguments[3]:null;return{$$typeof:h1,key:l==null?null:""+l,children:t,containerInfo:e,implementation:a}}var vi=d1.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;function _o(t,e){if(t==="font")return"";if(typeof e=="string")return e==="use-credentials"?e:""}ee.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=te;ee.createPortal=function(t,e){var a=2<arguments.length&&arguments[2]!==void 0?arguments[2]:null;if(!e||e.nodeType!==1&&e.nodeType!==9&&e.nodeType!==11)throw Error(Bf(299));return g1(t,e,null,a)};ee.flushSync=function(t){var e=vi.T,a=te.p;try{if(vi.T=null,te.p=2,t)return t()}finally{vi.T=e,te.p=a,te.d.f()}};ee.preconnect=function(t,e){typeof t=="string"&&(e?(e=e.crossOrigin,e=typeof e=="string"?e==="use-credentials"?e:"":void 0):e=null,te.d.C(t,e))};ee.prefetchDNS=function(t){typeof t=="string"&&te.d.D(t)};ee.preinit=function(t,e){if(typeof t=="string"&&e&&typeof e.as=="string"){var a=e.as,l=_o(a,e.crossOrigin),i=typeof e.integrity=="string"?e.integrity:void 0,o=typeof e.fetchPriority=="string"?e.fetchPriority:void 0;a==="style"?te.d.S(t,typeof e.precedence=="string"?e.precedence:void 0,{crossOrigin:l,integrity:i,fetchPriority:o}):a==="script"&&te.d.X(t,{crossOrigin:l,integrity:i,fetchPriority:o,nonce:typeof e.nonce=="string"?e.nonce:void 0})}};ee.preinitModule=function(t,e){if(typeof t=="string")if(typeof e=="object"&&e!==null){if(e.as==null||e.as==="script"){var a=_o(e.as,e.crossOrigin);te.d.M(t,{crossOrigin:a,integrity:typeof e.integrity=="string"?e.integrity:void 0,nonce:typeof e.nonce=="string"?e.nonce:void 0})}}else e==null&&te.d.M(t)};ee.preload=function(t,e){if(typeof t=="string"&&typeof e=="object"&&e!==null&&typeof e.as=="string"){var a=e.as,l=_o(a,e.crossOrigin);te.d.L(t,a,{crossOrigin:l,integrity:typeof e.integrity=="string"?e.integrity:void 0,nonce:typeof e.nonce=="string"?e.nonce:void 0,type:typeof e.type=="string"?e.type:void 0,fetchPriority:typeof e.fetchPriority=="string"?e.fetchPriority:void 0,referrerPolicy:typeof e.referrerPolicy=="string"?e.referrerPolicy:void 0,imageSrcSet:typeof e.imageSrcSet=="string"?e.imageSrcSet:void 0,imageSizes:typeof e.imageSizes=="string"?e.imageSizes:void 0,media:typeof e.media=="string"?e.media:void 0})}};ee.preloadModule=function(t,e){if(typeof t=="string")if(e){var a=_o(e.as,e.crossOrigin);te.d.m(t,{as:typeof e.as=="string"&&e.as!=="script"?e.as:void 0,crossOrigin:a,integrity:typeof e.integrity=="string"?e.integrity:void 0})}else te.d.m(t)};ee.requestFormReset=function(t){te.d.r(t)};ee.unstable_batchedUpdates=function(t,e){return t(e)};ee.useFormState=function(t,e,a){return vi.H.useFormState(t,e,a)};ee.useFormStatus=function(){return vi.H.useHostTransitionStatus()};ee.version="19.2.3"});var Ar=je((Y2,zf)=>{"use strict";function Cf(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(Cf)}catch(t){console.error(t)}}Cf(),zf.exports=Ef()});var Vf=je(ft=>{"use strict";function Br(t,e){var a=t.length;t.push(e);t:for(;0<a;){var l=a-1>>>1,i=t[l];if(0<Bo(i,e))t[l]=e,t[a]=i,a=l;else break t}}function ke(t){return t.length===0?null:t[0]}function Co(t){if(t.length===0)return null;var e=t[0],a=t.pop();if(a!==e){t[0]=a;t:for(var l=0,i=t.length,o=i>>>1;l<o;){var n=2*(l+1)-1,r=t[n],u=n+1,s=t[u];if(0>Bo(r,a))u<i&&0>Bo(s,r)?(t[l]=s,t[u]=a,l=u):(t[l]=r,t[n]=a,l=n);else if(u<i&&0>Bo(s,a))t[l]=s,t[u]=a,l=u;else break t}}return e}function Bo(t,e){var a=t.sortIndex-e.sortIndex;return a!==0?a:t.id-e.id}ft.unstable_now=void 0;typeof performance=="object"&&typeof performance.now=="function"?(Tf=performance,ft.unstable_now=function(){return Tf.now()}):(xr=Date,Mf=xr.now(),ft.unstable_now=function(){return xr.now()-Mf});var Tf,xr,Mf,ea=[],ba=[],v1=1,Me=null,kt=3,Er=!1,yi=!1,Si=!1,Cr=!1,Df=typeof setTimeout=="function"?setTimeout:null,Of=typeof clearTimeout=="function"?clearTimeout:null,Uf=typeof setImmediate<"u"?setImmediate:null;function Eo(t){for(var e=ke(ba);e!==null;){if(e.callback===null)Co(ba);else if(e.startTime<=t)Co(ba),e.sortIndex=e.expirationTime,Br(ea,e);else break;e=ke(ba)}}function zr(t){if(Si=!1,Eo(t),!yi)if(ke(ea)!==null)yi=!0,bl||(bl=!0,xl());else{var e=ke(ba);e!==null&&Tr(zr,e.startTime-t)}}var bl=!1,Ai=-1,wf=5,Nf=-1;function Gf(){return Cr?!0:!(ft.unstable_now()-Nf<wf)}function br(){if(Cr=!1,bl){var t=ft.unstable_now();Nf=t;var e=!0;try{t:{yi=!1,Si&&(Si=!1,Of(Ai),Ai=-1),Er=!0;var a=kt;try{e:{for(Eo(t),Me=ke(ea);Me!==null&&!(Me.expirationTime>t&&Gf());){var l=Me.callback;if(typeof l=="function"){Me.callback=null,kt=Me.priorityLevel;var i=l(Me.expirationTime<=t);if(t=ft.unstable_now(),typeof i=="function"){Me.callback=i,Eo(t),e=!0;break e}Me===ke(ea)&&Co(ea),Eo(t)}else Co(ea);Me=ke(ea)}if(Me!==null)e=!0;else{var o=ke(ba);o!==null&&Tr(zr,o.startTime-t),e=!1}}break t}finally{Me=null,kt=a,Er=!1}e=void 0}}finally{e?xl():bl=!1}}}var xl;typeof Uf=="function"?xl=function(){Uf(br)}:typeof MessageChannel<"u"?(_r=new MessageChannel,Rf=_r.port2,_r.port1.onmessage=br,xl=function(){Rf.postMessage(null)}):xl=function(){Df(br,0)};var _r,Rf;function Tr(t,e){Ai=Df(function(){t(ft.unstable_now())},e)}ft.unstable_IdlePriority=5;ft.unstable_ImmediatePriority=1;ft.unstable_LowPriority=4;ft.unstable_NormalPriority=3;ft.unstable_Profiling=null;ft.unstable_UserBlockingPriority=2;ft.unstable_cancelCallback=function(t){t.callback=null};ft.unstable_forceFrameRate=function(t){0>t||125<t?console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"):wf=0<t?Math.floor(1e3/t):5};ft.unstable_getCurrentPriorityLevel=function(){return kt};ft.unstable_next=function(t){switch(kt){case 1:case 2:case 3:var e=3;break;default:e=kt}var a=kt;kt=e;try{return t()}finally{kt=a}};ft.unstable_requestPaint=function(){Cr=!0};ft.unstable_runWithPriority=function(t,e){switch(t){case 1:case 2:case 3:case 4:case 5:break;default:t=3}var a=kt;kt=t;try{return e()}finally{kt=a}};ft.unstable_scheduleCallback=function(t,e,a){var l=ft.unstable_now();switch(typeof a=="object"&&a!==null?(a=a.delay,a=typeof a=="number"&&0<a?l+a:l):a=l,t){case 1:var i=-1;break;case 2:i=250;break;case 5:i=1073741823;break;case 4:i=1e4;break;default:i=5e3}return i=a+i,t={id:v1++,callback:e,priorityLevel:t,startTime:a,expirationTime:i,sortIndex:-1},a>l?(t.sortIndex=a,Br(ba,t),ke(ea)===null&&t===ke(ba)&&(Si?(Of(Ai),Ai=-1):Si=!0,Tr(zr,a-l))):(t.sortIndex=i,Br(ea,t),yi||Er||(yi=!0,bl||(bl=!0,xl()))),t};ft.unstable_shouldYield=Gf;ft.unstable_wrapCallback=function(t){var e=kt;return function(){var a=kt;kt=e;try{return t.apply(this,arguments)}finally{kt=a}}}});var Qf=je((q2,Hf)=>{"use strict";Hf.exports=Vf()});var Id=je(Pn=>{"use strict";var Tt=Qf(),fp=H(),y1=Ar();function x(t){var e="https://react.dev/errors/"+t;if(1<arguments.length){e+="?args[]="+encodeURIComponent(arguments[1]);for(var a=2;a<arguments.length;a++)e+="&args[]="+encodeURIComponent(arguments[a])}return"Minified React error #"+t+"; visit "+e+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}function mp(t){return!(!t||t.nodeType!==1&&t.nodeType!==9&&t.nodeType!==11)}function no(t){var e=t,a=t;if(t.alternate)for(;e.return;)e=e.return;else{t=e;do e=t,(e.flags&4098)!==0&&(a=e.return),t=e.return;while(t)}return e.tag===3?a:null}function pp(t){if(t.tag===13){var e=t.memoizedState;if(e===null&&(t=t.alternate,t!==null&&(e=t.memoizedState)),e!==null)return e.dehydrated}return null}function dp(t){if(t.tag===31){var e=t.memoizedState;if(e===null&&(t=t.alternate,t!==null&&(e=t.memoizedState)),e!==null)return e.dehydrated}return null}function Yf(t){if(no(t)!==t)throw Error(x(188))}function S1(t){var e=t.alternate;if(!e){if(e=no(t),e===null)throw Error(x(188));return e!==t?null:t}for(var a=t,l=e;;){var i=a.return;if(i===null)break;var o=i.alternate;if(o===null){if(l=i.return,l!==null){a=l;continue}break}if(i.child===o.child){for(o=i.child;o;){if(o===a)return Yf(i),t;if(o===l)return Yf(i),e;o=o.sibling}throw Error(x(188))}if(a.return!==l.return)a=i,l=o;else{for(var n=!1,r=i.child;r;){if(r===a){n=!0,a=i,l=o;break}if(r===l){n=!0,l=i,a=o;break}r=r.sibling}if(!n){for(r=o.child;r;){if(r===a){n=!0,a=o,l=i;break}if(r===l){n=!0,l=o,a=i;break}r=r.sibling}if(!n)throw Error(x(189))}}if(a.alternate!==l)throw Error(x(190))}if(a.tag!==3)throw Error(x(188));return a.stateNode.current===a?t:e}function hp(t){var e=t.tag;if(e===5||e===26||e===27||e===6)return t;for(t=t.child;t!==null;){if(e=hp(t),e!==null)return e;t=t.sibling}return null}var ct=Object.assign,A1=Symbol.for("react.element"),zo=Symbol.for("react.transitional.element"),Ti=Symbol.for("react.portal"),Tl=Symbol.for("react.fragment"),gp=Symbol.for("react.strict_mode"),uu=Symbol.for("react.profiler"),vp=Symbol.for("react.consumer"),sa=Symbol.for("react.context"),ls=Symbol.for("react.forward_ref"),su=Symbol.for("react.suspense"),cu=Symbol.for("react.suspense_list"),is=Symbol.for("react.memo"),_a=Symbol.for("react.lazy"),fu=Symbol.for("react.activity"),x1=Symbol.for("react.memo_cache_sentinel"),Ff=Symbol.iterator;function xi(t){return t===null||typeof t!="object"?null:(t=Ff&&t[Ff]||t["@@iterator"],typeof t=="function"?t:null)}var b1=Symbol.for("react.client.reference");function mu(t){if(t==null)return null;if(typeof t=="function")return t.$$typeof===b1?null:t.displayName||t.name||null;if(typeof t=="string")return t;switch(t){case Tl:return"Fragment";case uu:return"Profiler";case gp:return"StrictMode";case su:return"Suspense";case cu:return"SuspenseList";case fu:return"Activity"}if(typeof t=="object")switch(t.$$typeof){case Ti:return"Portal";case sa:return t.displayName||"Context";case vp:return(t._context.displayName||"Context")+".Consumer";case ls:var e=t.render;return t=t.displayName,t||(t=e.displayName||e.name||"",t=t!==""?"ForwardRef("+t+")":"ForwardRef"),t;case is:return e=t.displayName||null,e!==null?e:mu(t.type)||"Memo";case _a:e=t._payload,t=t._init;try{return mu(t(e))}catch{}}return null}var Mi=Array.isArray,R=fp.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,Z=y1.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,al={pending:!1,data:null,method:null,action:null},pu=[],Ml=-1;function Ie(t){return{current:t}}function Ot(t){0>Ml||(t.current=pu[Ml],pu[Ml]=null,Ml--)}function ot(t,e){Ml++,pu[Ml]=t.current,t.current=e}var Je=Ie(null),ki=Ie(null),wa=Ie(null),rn=Ie(null);function un(t,e){switch(ot(wa,e),ot(ki,t),ot(Je,null),e.nodeType){case 9:case 11:t=(t=e.documentElement)&&(t=t.namespaceURI)?Km(t):0;break;default:if(t=e.tagName,e=e.namespaceURI)e=Km(e),t=Vd(e,t);else switch(t){case"svg":t=1;break;case"math":t=2;break;default:t=0}}Ot(Je),ot(Je,t)}function Zl(){Ot(Je),Ot(ki),Ot(wa)}function du(t){t.memoizedState!==null&&ot(rn,t);var e=Je.current,a=Vd(e,t.type);e!==a&&(ot(ki,t),ot(Je,a))}function sn(t){ki.current===t&&(Ot(Je),Ot(ki)),rn.current===t&&(Ot(rn),lo._currentValue=al)}var Mr,qf;function Pa(t){if(Mr===void 0)try{throw Error()}catch(a){var e=a.stack.trim().match(/\n( *(at )?)/);Mr=e&&e[1]||"",qf=-1<a.stack.indexOf(`
    at`)?" (<anonymous>)":-1<a.stack.indexOf("@")?"@unknown:0:0":""}return`
`+Mr+t+qf}var Ur=!1;function Rr(t,e){if(!t||Ur)return"";Ur=!0;var a=Error.prepareStackTrace;Error.prepareStackTrace=void 0;try{var l={DetermineComponentFrameRoot:function(){try{if(e){var d=function(){throw Error()};if(Object.defineProperty(d.prototype,"props",{set:function(){throw Error()}}),typeof Reflect=="object"&&Reflect.construct){try{Reflect.construct(d,[])}catch(h){var c=h}Reflect.construct(t,[],d)}else{try{d.call()}catch(h){c=h}t.call(d.prototype)}}else{try{throw Error()}catch(h){c=h}(d=t())&&typeof d.catch=="function"&&d.catch(function(){})}}catch(h){if(h&&c&&typeof h.stack=="string")return[h.stack,c.stack]}return[null,null]}};l.DetermineComponentFrameRoot.displayName="DetermineComponentFrameRoot";var i=Object.getOwnPropertyDescriptor(l.DetermineComponentFrameRoot,"name");i&&i.configurable&&Object.defineProperty(l.DetermineComponentFrameRoot,"name",{value:"DetermineComponentFrameRoot"});var o=l.DetermineComponentFrameRoot(),n=o[0],r=o[1];if(n&&r){var u=n.split(`
`),s=r.split(`
`);for(i=l=0;l<u.length&&!u[l].includes("DetermineComponentFrameRoot");)l++;for(;i<s.length&&!s[i].includes("DetermineComponentFrameRoot");)i++;if(l===u.length||i===s.length)for(l=u.length-1,i=s.length-1;1<=l&&0<=i&&u[l]!==s[i];)i--;for(;1<=l&&0<=i;l--,i--)if(u[l]!==s[i]){if(l!==1||i!==1)do if(l--,i--,0>i||u[l]!==s[i]){var p=`
`+u[l].replace(" at new "," at ");return t.displayName&&p.includes("<anonymous>")&&(p=p.replace("<anonymous>",t.displayName)),p}while(1<=l&&0<=i);break}}}finally{Ur=!1,Error.prepareStackTrace=a}return(a=t?t.displayName||t.name:"")?Pa(a):""}function _1(t,e){switch(t.tag){case 26:case 27:case 5:return Pa(t.type);case 16:return Pa("Lazy");case 13:return t.child!==e&&e!==null?Pa("Suspense Fallback"):Pa("Suspense");case 19:return Pa("SuspenseList");case 0:case 15:return Rr(t.type,!1);case 11:return Rr(t.type.render,!1);case 1:return Rr(t.type,!0);case 31:return Pa("Activity");default:return""}}function Lf(t){try{var e="",a=null;do e+=_1(t,a),a=t,t=t.return;while(t);return e}catch(l){return`
Error generating stack: `+l.message+`
`+l.stack}}var hu=Object.prototype.hasOwnProperty,os=Tt.unstable_scheduleCallback,Dr=Tt.unstable_cancelCallback,B1=Tt.unstable_shouldYield,E1=Tt.unstable_requestPaint,Se=Tt.unstable_now,C1=Tt.unstable_getCurrentPriorityLevel,yp=Tt.unstable_ImmediatePriority,Sp=Tt.unstable_UserBlockingPriority,cn=Tt.unstable_NormalPriority,z1=Tt.unstable_LowPriority,Ap=Tt.unstable_IdlePriority,T1=Tt.log,M1=Tt.unstable_setDisableYieldValue,ro=null,Ae=null;function Ma(t){if(typeof T1=="function"&&M1(t),Ae&&typeof Ae.setStrictMode=="function")try{Ae.setStrictMode(ro,t)}catch{}}var xe=Math.clz32?Math.clz32:D1,U1=Math.log,R1=Math.LN2;function D1(t){return t>>>=0,t===0?32:31-(U1(t)/R1|0)|0}var To=256,Mo=262144,Uo=4194304;function $a(t){var e=t&42;if(e!==0)return e;switch(t&-t){case 1:return 1;case 2:return 2;case 4:return 4;case 8:return 8;case 16:return 16;case 32:return 32;case 64:return 64;case 128:return 128;case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:return t&261888;case 262144:case 524288:case 1048576:case 2097152:return t&3932160;case 4194304:case 8388608:case 16777216:case 33554432:return t&62914560;case 67108864:return 67108864;case 134217728:return 134217728;case 268435456:return 268435456;case 536870912:return 536870912;case 1073741824:return 0;default:return t}}function Gn(t,e,a){var l=t.pendingLanes;if(l===0)return 0;var i=0,o=t.suspendedLanes,n=t.pingedLanes;t=t.warmLanes;var r=l&134217727;return r!==0?(l=r&~o,l!==0?i=$a(l):(n&=r,n!==0?i=$a(n):a||(a=r&~t,a!==0&&(i=$a(a))))):(r=l&~o,r!==0?i=$a(r):n!==0?i=$a(n):a||(a=l&~t,a!==0&&(i=$a(a)))),i===0?0:e!==0&&e!==i&&(e&o)===0&&(o=i&-i,a=e&-e,o>=a||o===32&&(a&4194048)!==0)?e:i}function uo(t,e){return(t.pendingLanes&~(t.suspendedLanes&~t.pingedLanes)&e)===0}function O1(t,e){switch(t){case 1:case 2:case 4:case 8:case 64:return e+250;case 16:case 32:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return e+5e3;case 4194304:case 8388608:case 16777216:case 33554432:return-1;case 67108864:case 134217728:case 268435456:case 536870912:case 1073741824:return-1;default:return-1}}function xp(){var t=Uo;return Uo<<=1,(Uo&62914560)===0&&(Uo=4194304),t}function Or(t){for(var e=[],a=0;31>a;a++)e.push(t);return e}function so(t,e){t.pendingLanes|=e,e!==268435456&&(t.suspendedLanes=0,t.pingedLanes=0,t.warmLanes=0)}function w1(t,e,a,l,i,o){var n=t.pendingLanes;t.pendingLanes=a,t.suspendedLanes=0,t.pingedLanes=0,t.warmLanes=0,t.expiredLanes&=a,t.entangledLanes&=a,t.errorRecoveryDisabledLanes&=a,t.shellSuspendCounter=0;var r=t.entanglements,u=t.expirationTimes,s=t.hiddenUpdates;for(a=n&~a;0<a;){var p=31-xe(a),d=1<<p;r[p]=0,u[p]=-1;var c=s[p];if(c!==null)for(s[p]=null,p=0;p<c.length;p++){var h=c[p];h!==null&&(h.lane&=-536870913)}a&=~d}l!==0&&bp(t,l,0),o!==0&&i===0&&t.tag!==0&&(t.suspendedLanes|=o&~(n&~e))}function bp(t,e,a){t.pendingLanes|=e,t.suspendedLanes&=~e;var l=31-xe(e);t.entangledLanes|=e,t.entanglements[l]=t.entanglements[l]|1073741824|a&261930}function _p(t,e){var a=t.entangledLanes|=e;for(t=t.entanglements;a;){var l=31-xe(a),i=1<<l;i&e|t[l]&e&&(t[l]|=e),a&=~i}}function Bp(t,e){var a=e&-e;return a=(a&42)!==0?1:ns(a),(a&(t.suspendedLanes|e))!==0?0:a}function ns(t){switch(t){case 2:t=1;break;case 8:t=4;break;case 32:t=16;break;case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:case 4194304:case 8388608:case 16777216:case 33554432:t=128;break;case 268435456:t=134217728;break;default:t=0}return t}function rs(t){return t&=-t,2<t?8<t?(t&134217727)!==0?32:268435456:8:2}function Ep(){var t=Z.p;return t!==0?t:(t=window.event,t===void 0?32:Kd(t.type))}function Xf(t,e){var a=Z.p;try{return Z.p=t,e()}finally{Z.p=a}}var Za=Math.random().toString(36).slice(2),Ht="__reactFiber$"+Za,pe="__reactProps$"+Za,ii="__reactContainer$"+Za,gu="__reactEvents$"+Za,N1="__reactListeners$"+Za,G1="__reactHandles$"+Za,jf="__reactResources$"+Za,co="__reactMarker$"+Za;function us(t){delete t[Ht],delete t[pe],delete t[gu],delete t[N1],delete t[G1]}function Ul(t){var e=t[Ht];if(e)return e;for(var a=t.parentNode;a;){if(e=a[ii]||a[Ht]){if(a=e.alternate,e.child!==null||a!==null&&a.child!==null)for(t=$m(t);t!==null;){if(a=t[Ht])return a;t=$m(t)}return e}t=a,a=t.parentNode}return null}function oi(t){if(t=t[Ht]||t[ii]){var e=t.tag;if(e===5||e===6||e===13||e===31||e===26||e===27||e===3)return t}return null}function Ui(t){var e=t.tag;if(e===5||e===26||e===27||e===6)return t.stateNode;throw Error(x(33))}function Yl(t){var e=t[jf];return e||(e=t[jf]={hoistableStyles:new Map,hoistableScripts:new Map}),e}function Dt(t){t[co]=!0}var Cp=new Set,zp={};function ml(t,e){Kl(t,e),Kl(t+"Capture",e)}function Kl(t,e){for(zp[t]=e,t=0;t<e.length;t++)Cp.add(e[t])}var V1=RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"),kf={},Zf={};function H1(t){return hu.call(Zf,t)?!0:hu.call(kf,t)?!1:V1.test(t)?Zf[t]=!0:(kf[t]=!0,!1)}function jo(t,e,a){if(H1(e))if(a===null)t.removeAttribute(e);else{switch(typeof a){case"undefined":case"function":case"symbol":t.removeAttribute(e);return;case"boolean":var l=e.toLowerCase().slice(0,5);if(l!=="data-"&&l!=="aria-"){t.removeAttribute(e);return}}t.setAttribute(e,""+a)}}function Ro(t,e,a){if(a===null)t.removeAttribute(e);else{switch(typeof a){case"undefined":case"function":case"symbol":case"boolean":t.removeAttribute(e);return}t.setAttribute(e,""+a)}}function aa(t,e,a,l){if(l===null)t.removeAttribute(a);else{switch(typeof l){case"undefined":case"function":case"symbol":case"boolean":t.removeAttribute(a);return}t.setAttributeNS(e,a,""+l)}}function Re(t){switch(typeof t){case"bigint":case"boolean":case"number":case"string":case"undefined":return t;case"object":return t;default:return""}}function Tp(t){var e=t.type;return(t=t.nodeName)&&t.toLowerCase()==="input"&&(e==="checkbox"||e==="radio")}function Q1(t,e,a){var l=Object.getOwnPropertyDescriptor(t.constructor.prototype,e);if(!t.hasOwnProperty(e)&&typeof l<"u"&&typeof l.get=="function"&&typeof l.set=="function"){var i=l.get,o=l.set;return Object.defineProperty(t,e,{configurable:!0,get:function(){return i.call(this)},set:function(n){a=""+n,o.call(this,n)}}),Object.defineProperty(t,e,{enumerable:l.enumerable}),{getValue:function(){return a},setValue:function(n){a=""+n},stopTracking:function(){t._valueTracker=null,delete t[e]}}}}function vu(t){if(!t._valueTracker){var e=Tp(t)?"checked":"value";t._valueTracker=Q1(t,e,""+t[e])}}function Mp(t){if(!t)return!1;var e=t._valueTracker;if(!e)return!0;var a=e.getValue(),l="";return t&&(l=Tp(t)?t.checked?"true":"false":t.value),t=l,t!==a?(e.setValue(t),!0):!1}function fn(t){if(t=t||(typeof document<"u"?document:void 0),typeof t>"u")return null;try{return t.activeElement||t.body}catch{return t.body}}var Y1=/[\n"\\]/g;function we(t){return t.replace(Y1,function(e){return"\\"+e.charCodeAt(0).toString(16)+" "})}function yu(t,e,a,l,i,o,n,r){t.name="",n!=null&&typeof n!="function"&&typeof n!="symbol"&&typeof n!="boolean"?t.type=n:t.removeAttribute("type"),e!=null?n==="number"?(e===0&&t.value===""||t.value!=e)&&(t.value=""+Re(e)):t.value!==""+Re(e)&&(t.value=""+Re(e)):n!=="submit"&&n!=="reset"||t.removeAttribute("value"),e!=null?Su(t,n,Re(e)):a!=null?Su(t,n,Re(a)):l!=null&&t.removeAttribute("value"),i==null&&o!=null&&(t.defaultChecked=!!o),i!=null&&(t.checked=i&&typeof i!="function"&&typeof i!="symbol"),r!=null&&typeof r!="function"&&typeof r!="symbol"&&typeof r!="boolean"?t.name=""+Re(r):t.removeAttribute("name")}function Up(t,e,a,l,i,o,n,r){if(o!=null&&typeof o!="function"&&typeof o!="symbol"&&typeof o!="boolean"&&(t.type=o),e!=null||a!=null){if(!(o!=="submit"&&o!=="reset"||e!=null)){vu(t);return}a=a!=null?""+Re(a):"",e=e!=null?""+Re(e):a,r||e===t.value||(t.value=e),t.defaultValue=e}l=l??i,l=typeof l!="function"&&typeof l!="symbol"&&!!l,t.checked=r?t.checked:!!l,t.defaultChecked=!!l,n!=null&&typeof n!="function"&&typeof n!="symbol"&&typeof n!="boolean"&&(t.name=n),vu(t)}function Su(t,e,a){e==="number"&&fn(t.ownerDocument)===t||t.defaultValue===""+a||(t.defaultValue=""+a)}function Fl(t,e,a,l){if(t=t.options,e){e={};for(var i=0;i<a.length;i++)e["$"+a[i]]=!0;for(a=0;a<t.length;a++)i=e.hasOwnProperty("$"+t[a].value),t[a].selected!==i&&(t[a].selected=i),i&&l&&(t[a].defaultSelected=!0)}else{for(a=""+Re(a),e=null,i=0;i<t.length;i++){if(t[i].value===a){t[i].selected=!0,l&&(t[i].defaultSelected=!0);return}e!==null||t[i].disabled||(e=t[i])}e!==null&&(e.selected=!0)}}function Rp(t,e,a){if(e!=null&&(e=""+Re(e),e!==t.value&&(t.value=e),a==null)){t.defaultValue!==e&&(t.defaultValue=e);return}t.defaultValue=a!=null?""+Re(a):""}function Dp(t,e,a,l){if(e==null){if(l!=null){if(a!=null)throw Error(x(92));if(Mi(l)){if(1<l.length)throw Error(x(93));l=l[0]}a=l}a==null&&(a=""),e=a}a=Re(e),t.defaultValue=a,l=t.textContent,l===a&&l!==""&&l!==null&&(t.value=l),vu(t)}function Wl(t,e){if(e){var a=t.firstChild;if(a&&a===t.lastChild&&a.nodeType===3){a.nodeValue=e;return}}t.textContent=e}var F1=new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));function Kf(t,e,a){var l=e.indexOf("--")===0;a==null||typeof a=="boolean"||a===""?l?t.setProperty(e,""):e==="float"?t.cssFloat="":t[e]="":l?t.setProperty(e,a):typeof a!="number"||a===0||F1.has(e)?e==="float"?t.cssFloat=a:t[e]=(""+a).trim():t[e]=a+"px"}function Op(t,e,a){if(e!=null&&typeof e!="object")throw Error(x(62));if(t=t.style,a!=null){for(var l in a)!a.hasOwnProperty(l)||e!=null&&e.hasOwnProperty(l)||(l.indexOf("--")===0?t.setProperty(l,""):l==="float"?t.cssFloat="":t[l]="");for(var i in e)l=e[i],e.hasOwnProperty(i)&&a[i]!==l&&Kf(t,i,l)}else for(var o in e)e.hasOwnProperty(o)&&Kf(t,o,e[o])}function ss(t){if(t.indexOf("-")===-1)return!1;switch(t){case"annotation-xml":case"color-profile":case"font-face":case"font-face-src":case"font-face-uri":case"font-face-format":case"font-face-name":case"missing-glyph":return!1;default:return!0}}var q1=new Map([["acceptCharset","accept-charset"],["htmlFor","for"],["httpEquiv","http-equiv"],["crossOrigin","crossorigin"],["accentHeight","accent-height"],["alignmentBaseline","alignment-baseline"],["arabicForm","arabic-form"],["baselineShift","baseline-shift"],["capHeight","cap-height"],["clipPath","clip-path"],["clipRule","clip-rule"],["colorInterpolation","color-interpolation"],["colorInterpolationFilters","color-interpolation-filters"],["colorProfile","color-profile"],["colorRendering","color-rendering"],["dominantBaseline","dominant-baseline"],["enableBackground","enable-background"],["fillOpacity","fill-opacity"],["fillRule","fill-rule"],["floodColor","flood-color"],["floodOpacity","flood-opacity"],["fontFamily","font-family"],["fontSize","font-size"],["fontSizeAdjust","font-size-adjust"],["fontStretch","font-stretch"],["fontStyle","font-style"],["fontVariant","font-variant"],["fontWeight","font-weight"],["glyphName","glyph-name"],["glyphOrientationHorizontal","glyph-orientation-horizontal"],["glyphOrientationVertical","glyph-orientation-vertical"],["horizAdvX","horiz-adv-x"],["horizOriginX","horiz-origin-x"],["imageRendering","image-rendering"],["letterSpacing","letter-spacing"],["lightingColor","lighting-color"],["markerEnd","marker-end"],["markerMid","marker-mid"],["markerStart","marker-start"],["overlinePosition","overline-position"],["overlineThickness","overline-thickness"],["paintOrder","paint-order"],["panose-1","panose-1"],["pointerEvents","pointer-events"],["renderingIntent","rendering-intent"],["shapeRendering","shape-rendering"],["stopColor","stop-color"],["stopOpacity","stop-opacity"],["strikethroughPosition","strikethrough-position"],["strikethroughThickness","strikethrough-thickness"],["strokeDasharray","stroke-dasharray"],["strokeDashoffset","stroke-dashoffset"],["strokeLinecap","stroke-linecap"],["strokeLinejoin","stroke-linejoin"],["strokeMiterlimit","stroke-miterlimit"],["strokeOpacity","stroke-opacity"],["strokeWidth","stroke-width"],["textAnchor","text-anchor"],["textDecoration","text-decoration"],["textRendering","text-rendering"],["transformOrigin","transform-origin"],["underlinePosition","underline-position"],["underlineThickness","underline-thickness"],["unicodeBidi","unicode-bidi"],["unicodeRange","unicode-range"],["unitsPerEm","units-per-em"],["vAlphabetic","v-alphabetic"],["vHanging","v-hanging"],["vIdeographic","v-ideographic"],["vMathematical","v-mathematical"],["vectorEffect","vector-effect"],["vertAdvY","vert-adv-y"],["vertOriginX","vert-origin-x"],["vertOriginY","vert-origin-y"],["wordSpacing","word-spacing"],["writingMode","writing-mode"],["xmlnsXlink","xmlns:xlink"],["xHeight","x-height"]]),L1=/^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;function ko(t){return L1.test(""+t)?"javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')":t}function ca(){}var Au=null;function cs(t){return t=t.target||t.srcElement||window,t.correspondingUseElement&&(t=t.correspondingUseElement),t.nodeType===3?t.parentNode:t}var Rl=null,ql=null;function Wf(t){var e=oi(t);if(e&&(t=e.stateNode)){var a=t[pe]||null;t:switch(t=e.stateNode,e.type){case"input":if(yu(t,a.value,a.defaultValue,a.defaultValue,a.checked,a.defaultChecked,a.type,a.name),e=a.name,a.type==="radio"&&e!=null){for(a=t;a.parentNode;)a=a.parentNode;for(a=a.querySelectorAll('input[name="'+we(""+e)+'"][type="radio"]'),e=0;e<a.length;e++){var l=a[e];if(l!==t&&l.form===t.form){var i=l[pe]||null;if(!i)throw Error(x(90));yu(l,i.value,i.defaultValue,i.defaultValue,i.checked,i.defaultChecked,i.type,i.name)}}for(e=0;e<a.length;e++)l=a[e],l.form===t.form&&Mp(l)}break t;case"textarea":Rp(t,a.value,a.defaultValue);break t;case"select":e=a.value,e!=null&&Fl(t,!!a.multiple,e,!1)}}}var wr=!1;function wp(t,e,a){if(wr)return t(e,a);wr=!0;try{var l=t(e);return l}finally{if(wr=!1,(Rl!==null||ql!==null)&&(Kn(),Rl&&(e=Rl,t=ql,ql=Rl=null,Wf(e),t)))for(e=0;e<t.length;e++)Wf(t[e])}}function Zi(t,e){var a=t.stateNode;if(a===null)return null;var l=a[pe]||null;if(l===null)return null;a=l[e];t:switch(e){case"onClick":case"onClickCapture":case"onDoubleClick":case"onDoubleClickCapture":case"onMouseDown":case"onMouseDownCapture":case"onMouseMove":case"onMouseMoveCapture":case"onMouseUp":case"onMouseUpCapture":case"onMouseEnter":(l=!l.disabled)||(t=t.type,l=!(t==="button"||t==="input"||t==="select"||t==="textarea")),t=!l;break t;default:t=!1}if(t)return null;if(a&&typeof a!="function")throw Error(x(231,e,typeof a));return a}var ha=!(typeof window>"u"||typeof window.document>"u"||typeof window.document.createElement>"u"),xu=!1;if(ha)try{_l={},Object.defineProperty(_l,"passive",{get:function(){xu=!0}}),window.addEventListener("test",_l,_l),window.removeEventListener("test",_l,_l)}catch{xu=!1}var _l,Ua=null,fs=null,Zo=null;function Np(){if(Zo)return Zo;var t,e=fs,a=e.length,l,i="value"in Ua?Ua.value:Ua.textContent,o=i.length;for(t=0;t<a&&e[t]===i[t];t++);var n=a-t;for(l=1;l<=n&&e[a-l]===i[o-l];l++);return Zo=i.slice(t,1<l?1-l:void 0)}function Ko(t){var e=t.keyCode;return"charCode"in t?(t=t.charCode,t===0&&e===13&&(t=13)):t=e,t===10&&(t=13),32<=t||t===13?t:0}function Do(){return!0}function Jf(){return!1}function de(t){function e(a,l,i,o,n){this._reactName=a,this._targetInst=i,this.type=l,this.nativeEvent=o,this.target=n,this.currentTarget=null;for(var r in t)t.hasOwnProperty(r)&&(a=t[r],this[r]=a?a(o):o[r]);return this.isDefaultPrevented=(o.defaultPrevented!=null?o.defaultPrevented:o.returnValue===!1)?Do:Jf,this.isPropagationStopped=Jf,this}return ct(e.prototype,{preventDefault:function(){this.defaultPrevented=!0;var a=this.nativeEvent;a&&(a.preventDefault?a.preventDefault():typeof a.returnValue!="unknown"&&(a.returnValue=!1),this.isDefaultPrevented=Do)},stopPropagation:function(){var a=this.nativeEvent;a&&(a.stopPropagation?a.stopPropagation():typeof a.cancelBubble!="unknown"&&(a.cancelBubble=!0),this.isPropagationStopped=Do)},persist:function(){},isPersistent:Do}),e}var pl={eventPhase:0,bubbles:0,cancelable:0,timeStamp:function(t){return t.timeStamp||Date.now()},defaultPrevented:0,isTrusted:0},Vn=de(pl),fo=ct({},pl,{view:0,detail:0}),X1=de(fo),Nr,Gr,bi,Hn=ct({},fo,{screenX:0,screenY:0,clientX:0,clientY:0,pageX:0,pageY:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,getModifierState:ms,button:0,buttons:0,relatedTarget:function(t){return t.relatedTarget===void 0?t.fromElement===t.srcElement?t.toElement:t.fromElement:t.relatedTarget},movementX:function(t){return"movementX"in t?t.movementX:(t!==bi&&(bi&&t.type==="mousemove"?(Nr=t.screenX-bi.screenX,Gr=t.screenY-bi.screenY):Gr=Nr=0,bi=t),Nr)},movementY:function(t){return"movementY"in t?t.movementY:Gr}}),If=de(Hn),j1=ct({},Hn,{dataTransfer:0}),k1=de(j1),Z1=ct({},fo,{relatedTarget:0}),Vr=de(Z1),K1=ct({},pl,{animationName:0,elapsedTime:0,pseudoElement:0}),W1=de(K1),J1=ct({},pl,{clipboardData:function(t){return"clipboardData"in t?t.clipboardData:window.clipboardData}}),I1=de(J1),P1=ct({},pl,{data:0}),Pf=de(P1),$1={Esc:"Escape",Spacebar:" ",Left:"ArrowLeft",Up:"ArrowUp",Right:"ArrowRight",Down:"ArrowDown",Del:"Delete",Win:"OS",Menu:"ContextMenu",Apps:"ContextMenu",Scroll:"ScrollLock",MozPrintableKey:"Unidentified"},tv={8:"Backspace",9:"Tab",12:"Clear",13:"Enter",16:"Shift",17:"Control",18:"Alt",19:"Pause",20:"CapsLock",27:"Escape",32:" ",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",45:"Insert",46:"Delete",112:"F1",113:"F2",114:"F3",115:"F4",116:"F5",117:"F6",118:"F7",119:"F8",120:"F9",121:"F10",122:"F11",123:"F12",144:"NumLock",145:"ScrollLock",224:"Meta"},ev={Alt:"altKey",Control:"ctrlKey",Meta:"metaKey",Shift:"shiftKey"};function av(t){var e=this.nativeEvent;return e.getModifierState?e.getModifierState(t):(t=ev[t])?!!e[t]:!1}function ms(){return av}var lv=ct({},fo,{key:function(t){if(t.key){var e=$1[t.key]||t.key;if(e!=="Unidentified")return e}return t.type==="keypress"?(t=Ko(t),t===13?"Enter":String.fromCharCode(t)):t.type==="keydown"||t.type==="keyup"?tv[t.keyCode]||"Unidentified":""},code:0,location:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,repeat:0,locale:0,getModifierState:ms,charCode:function(t){return t.type==="keypress"?Ko(t):0},keyCode:function(t){return t.type==="keydown"||t.type==="keyup"?t.keyCode:0},which:function(t){return t.type==="keypress"?Ko(t):t.type==="keydown"||t.type==="keyup"?t.keyCode:0}}),iv=de(lv),ov=ct({},Hn,{pointerId:0,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,pointerType:0,isPrimary:0}),$f=de(ov),nv=ct({},fo,{touches:0,targetTouches:0,changedTouches:0,altKey:0,metaKey:0,ctrlKey:0,shiftKey:0,getModifierState:ms}),rv=de(nv),uv=ct({},pl,{propertyName:0,elapsedTime:0,pseudoElement:0}),sv=de(uv),cv=ct({},Hn,{deltaX:function(t){return"deltaX"in t?t.deltaX:"wheelDeltaX"in t?-t.wheelDeltaX:0},deltaY:function(t){return"deltaY"in t?t.deltaY:"wheelDeltaY"in t?-t.wheelDeltaY:"wheelDelta"in t?-t.wheelDelta:0},deltaZ:0,deltaMode:0}),fv=de(cv),mv=ct({},pl,{newState:0,oldState:0}),pv=de(mv),dv=[9,13,27,32],ps=ha&&"CompositionEvent"in window,Oi=null;ha&&"documentMode"in document&&(Oi=document.documentMode);var hv=ha&&"TextEvent"in window&&!Oi,Gp=ha&&(!ps||Oi&&8<Oi&&11>=Oi),tm=" ",em=!1;function Vp(t,e){switch(t){case"keyup":return dv.indexOf(e.keyCode)!==-1;case"keydown":return e.keyCode!==229;case"keypress":case"mousedown":case"focusout":return!0;default:return!1}}function Hp(t){return t=t.detail,typeof t=="object"&&"data"in t?t.data:null}var Dl=!1;function gv(t,e){switch(t){case"compositionend":return Hp(e);case"keypress":return e.which!==32?null:(em=!0,tm);case"textInput":return t=e.data,t===tm&&em?null:t;default:return null}}function vv(t,e){if(Dl)return t==="compositionend"||!ps&&Vp(t,e)?(t=Np(),Zo=fs=Ua=null,Dl=!1,t):null;switch(t){case"paste":return null;case"keypress":if(!(e.ctrlKey||e.altKey||e.metaKey)||e.ctrlKey&&e.altKey){if(e.char&&1<e.char.length)return e.char;if(e.which)return String.fromCharCode(e.which)}return null;case"compositionend":return Gp&&e.locale!=="ko"?null:e.data;default:return null}}var yv={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};function am(t){var e=t&&t.nodeName&&t.nodeName.toLowerCase();return e==="input"?!!yv[t.type]:e==="textarea"}function Qp(t,e,a,l){Rl?ql?ql.push(l):ql=[l]:Rl=l,e=Mn(e,"onChange"),0<e.length&&(a=new Vn("onChange","change",null,a,l),t.push({event:a,listeners:e}))}var wi=null,Ki=null;function Sv(t){wd(t,0)}function Qn(t){var e=Ui(t);if(Mp(e))return t}function lm(t,e){if(t==="change")return e}var Yp=!1;ha&&(ha?(wo="oninput"in document,wo||(Hr=document.createElement("div"),Hr.setAttribute("oninput","return;"),wo=typeof Hr.oninput=="function"),Oo=wo):Oo=!1,Yp=Oo&&(!document.documentMode||9<document.documentMode));var Oo,wo,Hr;function im(){wi&&(wi.detachEvent("onpropertychange",Fp),Ki=wi=null)}function Fp(t){if(t.propertyName==="value"&&Qn(Ki)){var e=[];Qp(e,Ki,t,cs(t)),wp(Sv,e)}}function Av(t,e,a){t==="focusin"?(im(),wi=e,Ki=a,wi.attachEvent("onpropertychange",Fp)):t==="focusout"&&im()}function xv(t){if(t==="selectionchange"||t==="keyup"||t==="keydown")return Qn(Ki)}function bv(t,e){if(t==="click")return Qn(e)}function _v(t,e){if(t==="input"||t==="change")return Qn(e)}function Bv(t,e){return t===e&&(t!==0||1/t===1/e)||t!==t&&e!==e}var _e=typeof Object.is=="function"?Object.is:Bv;function Wi(t,e){if(_e(t,e))return!0;if(typeof t!="object"||t===null||typeof e!="object"||e===null)return!1;var a=Object.keys(t),l=Object.keys(e);if(a.length!==l.length)return!1;for(l=0;l<a.length;l++){var i=a[l];if(!hu.call(e,i)||!_e(t[i],e[i]))return!1}return!0}function om(t){for(;t&&t.firstChild;)t=t.firstChild;return t}function nm(t,e){var a=om(t);t=0;for(var l;a;){if(a.nodeType===3){if(l=t+a.textContent.length,t<=e&&l>=e)return{node:a,offset:e-t};t=l}t:{for(;a;){if(a.nextSibling){a=a.nextSibling;break t}a=a.parentNode}a=void 0}a=om(a)}}function qp(t,e){return t&&e?t===e?!0:t&&t.nodeType===3?!1:e&&e.nodeType===3?qp(t,e.parentNode):"contains"in t?t.contains(e):t.compareDocumentPosition?!!(t.compareDocumentPosition(e)&16):!1:!1}function Lp(t){t=t!=null&&t.ownerDocument!=null&&t.ownerDocument.defaultView!=null?t.ownerDocument.defaultView:window;for(var e=fn(t.document);e instanceof t.HTMLIFrameElement;){try{var a=typeof e.contentWindow.location.href=="string"}catch{a=!1}if(a)t=e.contentWindow;else break;e=fn(t.document)}return e}function ds(t){var e=t&&t.nodeName&&t.nodeName.toLowerCase();return e&&(e==="input"&&(t.type==="text"||t.type==="search"||t.type==="tel"||t.type==="url"||t.type==="password")||e==="textarea"||t.contentEditable==="true")}var Ev=ha&&"documentMode"in document&&11>=document.documentMode,Ol=null,bu=null,Ni=null,_u=!1;function rm(t,e,a){var l=a.window===a?a.document:a.nodeType===9?a:a.ownerDocument;_u||Ol==null||Ol!==fn(l)||(l=Ol,"selectionStart"in l&&ds(l)?l={start:l.selectionStart,end:l.selectionEnd}:(l=(l.ownerDocument&&l.ownerDocument.defaultView||window).getSelection(),l={anchorNode:l.anchorNode,anchorOffset:l.anchorOffset,focusNode:l.focusNode,focusOffset:l.focusOffset}),Ni&&Wi(Ni,l)||(Ni=l,l=Mn(bu,"onSelect"),0<l.length&&(e=new Vn("onSelect","select",null,e,a),t.push({event:e,listeners:l}),e.target=Ol)))}function Ia(t,e){var a={};return a[t.toLowerCase()]=e.toLowerCase(),a["Webkit"+t]="webkit"+e,a["Moz"+t]="moz"+e,a}var wl={animationend:Ia("Animation","AnimationEnd"),animationiteration:Ia("Animation","AnimationIteration"),animationstart:Ia("Animation","AnimationStart"),transitionrun:Ia("Transition","TransitionRun"),transitionstart:Ia("Transition","TransitionStart"),transitioncancel:Ia("Transition","TransitionCancel"),transitionend:Ia("Transition","TransitionEnd")},Qr={},Xp={};ha&&(Xp=document.createElement("div").style,"AnimationEvent"in window||(delete wl.animationend.animation,delete wl.animationiteration.animation,delete wl.animationstart.animation),"TransitionEvent"in window||delete wl.transitionend.transition);function dl(t){if(Qr[t])return Qr[t];if(!wl[t])return t;var e=wl[t],a;for(a in e)if(e.hasOwnProperty(a)&&a in Xp)return Qr[t]=e[a];return t}var jp=dl("animationend"),kp=dl("animationiteration"),Zp=dl("animationstart"),Cv=dl("transitionrun"),zv=dl("transitionstart"),Tv=dl("transitioncancel"),Kp=dl("transitionend"),Wp=new Map,Bu="abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");Bu.push("scrollEnd");function Le(t,e){Wp.set(t,e),ml(e,[t])}var mn=typeof reportError=="function"?reportError:function(t){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var e=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof t=="object"&&t!==null&&typeof t.message=="string"?String(t.message):String(t),error:t});if(!window.dispatchEvent(e))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",t);return}console.error(t)},Ue=[],Nl=0,hs=0;function Yn(){for(var t=Nl,e=hs=Nl=0;e<t;){var a=Ue[e];Ue[e++]=null;var l=Ue[e];Ue[e++]=null;var i=Ue[e];Ue[e++]=null;var o=Ue[e];if(Ue[e++]=null,l!==null&&i!==null){var n=l.pending;n===null?i.next=i:(i.next=n.next,n.next=i),l.pending=i}o!==0&&Jp(a,i,o)}}function Fn(t,e,a,l){Ue[Nl++]=t,Ue[Nl++]=e,Ue[Nl++]=a,Ue[Nl++]=l,hs|=l,t.lanes|=l,t=t.alternate,t!==null&&(t.lanes|=l)}function gs(t,e,a,l){return Fn(t,e,a,l),pn(t)}function hl(t,e){return Fn(t,null,null,e),pn(t)}function Jp(t,e,a){t.lanes|=a;var l=t.alternate;l!==null&&(l.lanes|=a);for(var i=!1,o=t.return;o!==null;)o.childLanes|=a,l=o.alternate,l!==null&&(l.childLanes|=a),o.tag===22&&(t=o.stateNode,t===null||t._visibility&1||(i=!0)),t=o,o=o.return;return t.tag===3?(o=t.stateNode,i&&e!==null&&(i=31-xe(a),t=o.hiddenUpdates,l=t[i],l===null?t[i]=[e]:l.push(e),e.lane=a|536870912),o):null}function pn(t){if(50<Xi)throw Xi=0,ju=null,Error(x(185));for(var e=t.return;e!==null;)t=e,e=t.return;return t.tag===3?t.stateNode:null}var Gl={};function Mv(t,e,a,l){this.tag=t,this.key=a,this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null,this.index=0,this.refCleanup=this.ref=null,this.pendingProps=e,this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null,this.mode=l,this.subtreeFlags=this.flags=0,this.deletions=null,this.childLanes=this.lanes=0,this.alternate=null}function ve(t,e,a,l){return new Mv(t,e,a,l)}function vs(t){return t=t.prototype,!(!t||!t.isReactComponent)}function ma(t,e){var a=t.alternate;return a===null?(a=ve(t.tag,e,t.key,t.mode),a.elementType=t.elementType,a.type=t.type,a.stateNode=t.stateNode,a.alternate=t,t.alternate=a):(a.pendingProps=e,a.type=t.type,a.flags=0,a.subtreeFlags=0,a.deletions=null),a.flags=t.flags&65011712,a.childLanes=t.childLanes,a.lanes=t.lanes,a.child=t.child,a.memoizedProps=t.memoizedProps,a.memoizedState=t.memoizedState,a.updateQueue=t.updateQueue,e=t.dependencies,a.dependencies=e===null?null:{lanes:e.lanes,firstContext:e.firstContext},a.sibling=t.sibling,a.index=t.index,a.ref=t.ref,a.refCleanup=t.refCleanup,a}function Ip(t,e){t.flags&=65011714;var a=t.alternate;return a===null?(t.childLanes=0,t.lanes=e,t.child=null,t.subtreeFlags=0,t.memoizedProps=null,t.memoizedState=null,t.updateQueue=null,t.dependencies=null,t.stateNode=null):(t.childLanes=a.childLanes,t.lanes=a.lanes,t.child=a.child,t.subtreeFlags=0,t.deletions=null,t.memoizedProps=a.memoizedProps,t.memoizedState=a.memoizedState,t.updateQueue=a.updateQueue,t.type=a.type,e=a.dependencies,t.dependencies=e===null?null:{lanes:e.lanes,firstContext:e.firstContext}),t}function Wo(t,e,a,l,i,o){var n=0;if(l=t,typeof t=="function")vs(t)&&(n=1);else if(typeof t=="string")n=Dy(t,a,Je.current)?26:t==="html"||t==="head"||t==="body"?27:5;else t:switch(t){case fu:return t=ve(31,a,e,i),t.elementType=fu,t.lanes=o,t;case Tl:return ll(a.children,i,o,e);case gp:n=8,i|=24;break;case uu:return t=ve(12,a,e,i|2),t.elementType=uu,t.lanes=o,t;case su:return t=ve(13,a,e,i),t.elementType=su,t.lanes=o,t;case cu:return t=ve(19,a,e,i),t.elementType=cu,t.lanes=o,t;default:if(typeof t=="object"&&t!==null)switch(t.$$typeof){case sa:n=10;break t;case vp:n=9;break t;case ls:n=11;break t;case is:n=14;break t;case _a:n=16,l=null;break t}n=29,a=Error(x(130,t===null?"null":typeof t,"")),l=null}return e=ve(n,a,e,i),e.elementType=t,e.type=l,e.lanes=o,e}function ll(t,e,a,l){return t=ve(7,t,l,e),t.lanes=a,t}function Yr(t,e,a){return t=ve(6,t,null,e),t.lanes=a,t}function Pp(t){var e=ve(18,null,null,0);return e.stateNode=t,e}function Fr(t,e,a){return e=ve(4,t.children!==null?t.children:[],t.key,e),e.lanes=a,e.stateNode={containerInfo:t.containerInfo,pendingChildren:null,implementation:t.implementation},e}var um=new WeakMap;function Ne(t,e){if(typeof t=="object"&&t!==null){var a=um.get(t);return a!==void 0?a:(e={value:t,source:e,stack:Lf(e)},um.set(t,e),e)}return{value:t,source:e,stack:Lf(e)}}var Vl=[],Hl=0,dn=null,Ji=0,De=[],Oe=0,La=null,Ze=1,Ke="";function ra(t,e){Vl[Hl++]=Ji,Vl[Hl++]=dn,dn=t,Ji=e}function $p(t,e,a){De[Oe++]=Ze,De[Oe++]=Ke,De[Oe++]=La,La=t;var l=Ze;t=Ke;var i=32-xe(l)-1;l&=~(1<<i),a+=1;var o=32-xe(e)+i;if(30<o){var n=i-i%5;o=(l&(1<<n)-1).toString(32),l>>=n,i-=n,Ze=1<<32-xe(e)+i|a<<i|l,Ke=o+t}else Ze=1<<o|a<<i|l,Ke=t}function ys(t){t.return!==null&&(ra(t,1),$p(t,1,0))}function Ss(t){for(;t===dn;)dn=Vl[--Hl],Vl[Hl]=null,Ji=Vl[--Hl],Vl[Hl]=null;for(;t===La;)La=De[--Oe],De[Oe]=null,Ke=De[--Oe],De[Oe]=null,Ze=De[--Oe],De[Oe]=null}function t0(t,e){De[Oe++]=Ze,De[Oe++]=Ke,De[Oe++]=La,Ze=e.id,Ke=e.overflow,La=t}var Qt=null,st=null,X=!1,Na=null,Ge=!1,Eu=Error(x(519));function Xa(t){var e=Error(x(418,1<arguments.length&&arguments[1]!==void 0&&arguments[1]?"text":"HTML",""));throw Ii(Ne(e,t)),Eu}function sm(t){var e=t.stateNode,a=t.type,l=t.memoizedProps;switch(e[Ht]=t,e[pe]=l,a){case"dialog":Q("cancel",e),Q("close",e);break;case"iframe":case"object":case"embed":Q("load",e);break;case"video":case"audio":for(a=0;a<eo.length;a++)Q(eo[a],e);break;case"source":Q("error",e);break;case"img":case"image":case"link":Q("error",e),Q("load",e);break;case"details":Q("toggle",e);break;case"input":Q("invalid",e),Up(e,l.value,l.defaultValue,l.checked,l.defaultChecked,l.type,l.name,!0);break;case"select":Q("invalid",e);break;case"textarea":Q("invalid",e),Dp(e,l.value,l.defaultValue,l.children)}a=l.children,typeof a!="string"&&typeof a!="number"&&typeof a!="bigint"||e.textContent===""+a||l.suppressHydrationWarning===!0||Gd(e.textContent,a)?(l.popover!=null&&(Q("beforetoggle",e),Q("toggle",e)),l.onScroll!=null&&Q("scroll",e),l.onScrollEnd!=null&&Q("scrollend",e),l.onClick!=null&&(e.onclick=ca),e=!0):e=!1,e||Xa(t,!0)}function cm(t){for(Qt=t.return;Qt;)switch(Qt.tag){case 5:case 31:case 13:Ge=!1;return;case 27:case 3:Ge=!0;return;default:Qt=Qt.return}}function Bl(t){if(t!==Qt)return!1;if(!X)return cm(t),X=!0,!1;var e=t.tag,a;if((a=e!==3&&e!==27)&&((a=e===5)&&(a=t.type,a=!(a!=="form"&&a!=="button")||Ju(t.type,t.memoizedProps)),a=!a),a&&st&&Xa(t),cm(t),e===13){if(t=t.memoizedState,t=t!==null?t.dehydrated:null,!t)throw Error(x(317));st=Pm(t)}else if(e===31){if(t=t.memoizedState,t=t!==null?t.dehydrated:null,!t)throw Error(x(317));st=Pm(t)}else e===27?(e=st,Ka(t.type)?(t=ts,ts=null,st=t):st=e):st=Qt?He(t.stateNode.nextSibling):null;return!0}function rl(){st=Qt=null,X=!1}function qr(){var t=Na;return t!==null&&(fe===null?fe=t:fe.push.apply(fe,t),Na=null),t}function Ii(t){Na===null?Na=[t]:Na.push(t)}var Cu=Ie(null),gl=null,fa=null;function Ea(t,e,a){ot(Cu,e._currentValue),e._currentValue=a}function pa(t){t._currentValue=Cu.current,Ot(Cu)}function zu(t,e,a){for(;t!==null;){var l=t.alternate;if((t.childLanes&e)!==e?(t.childLanes|=e,l!==null&&(l.childLanes|=e)):l!==null&&(l.childLanes&e)!==e&&(l.childLanes|=e),t===a)break;t=t.return}}function Tu(t,e,a,l){var i=t.child;for(i!==null&&(i.return=t);i!==null;){var o=i.dependencies;if(o!==null){var n=i.child;o=o.firstContext;t:for(;o!==null;){var r=o;o=i;for(var u=0;u<e.length;u++)if(r.context===e[u]){o.lanes|=a,r=o.alternate,r!==null&&(r.lanes|=a),zu(o.return,a,t),l||(n=null);break t}o=r.next}}else if(i.tag===18){if(n=i.return,n===null)throw Error(x(341));n.lanes|=a,o=n.alternate,o!==null&&(o.lanes|=a),zu(n,a,t),n=null}else n=i.child;if(n!==null)n.return=i;else for(n=i;n!==null;){if(n===t){n=null;break}if(i=n.sibling,i!==null){i.return=n.return,n=i;break}n=n.return}i=n}}function ni(t,e,a,l){t=null;for(var i=e,o=!1;i!==null;){if(!o){if((i.flags&524288)!==0)o=!0;else if((i.flags&262144)!==0)break}if(i.tag===10){var n=i.alternate;if(n===null)throw Error(x(387));if(n=n.memoizedProps,n!==null){var r=i.type;_e(i.pendingProps.value,n.value)||(t!==null?t.push(r):t=[r])}}else if(i===rn.current){if(n=i.alternate,n===null)throw Error(x(387));n.memoizedState.memoizedState!==i.memoizedState.memoizedState&&(t!==null?t.push(lo):t=[lo])}i=i.return}t!==null&&Tu(e,t,a,l),e.flags|=262144}function hn(t){for(t=t.firstContext;t!==null;){if(!_e(t.context._currentValue,t.memoizedValue))return!0;t=t.next}return!1}function ul(t){gl=t,fa=null,t=t.dependencies,t!==null&&(t.firstContext=null)}function Yt(t){return e0(gl,t)}function No(t,e){return gl===null&&ul(t),e0(t,e)}function e0(t,e){var a=e._currentValue;if(e={context:e,memoizedValue:a,next:null},fa===null){if(t===null)throw Error(x(308));fa=e,t.dependencies={lanes:0,firstContext:e},t.flags|=524288}else fa=fa.next=e;return a}var Uv=typeof AbortController<"u"?AbortController:function(){var t=[],e=this.signal={aborted:!1,addEventListener:function(a,l){t.push(l)}};this.abort=function(){e.aborted=!0,t.forEach(function(a){return a()})}},Rv=Tt.unstable_scheduleCallback,Dv=Tt.unstable_NormalPriority,_t={$$typeof:sa,Consumer:null,Provider:null,_currentValue:null,_currentValue2:null,_threadCount:0};function As(){return{controller:new Uv,data:new Map,refCount:0}}function mo(t){t.refCount--,t.refCount===0&&Rv(Dv,function(){t.controller.abort()})}var Gi=null,Mu=0,Jl=0,Ll=null;function Ov(t,e){if(Gi===null){var a=Gi=[];Mu=0,Jl=js(),Ll={status:"pending",value:void 0,then:function(l){a.push(l)}}}return Mu++,e.then(fm,fm),e}function fm(){if(--Mu===0&&Gi!==null){Ll!==null&&(Ll.status="fulfilled");var t=Gi;Gi=null,Jl=0,Ll=null;for(var e=0;e<t.length;e++)(0,t[e])()}}function wv(t,e){var a=[],l={status:"pending",value:null,reason:null,then:function(i){a.push(i)}};return t.then(function(){l.status="fulfilled",l.value=e;for(var i=0;i<a.length;i++)(0,a[i])(e)},function(i){for(l.status="rejected",l.reason=i,i=0;i<a.length;i++)(0,a[i])(void 0)}),l}var mm=R.S;R.S=function(t,e){hd=Se(),typeof e=="object"&&e!==null&&typeof e.then=="function"&&Ov(t,e),mm!==null&&mm(t,e)};var il=Ie(null);function xs(){var t=il.current;return t!==null?t:lt.pooledCache}function Jo(t,e){e===null?ot(il,il.current):ot(il,e.pool)}function a0(){var t=xs();return t===null?null:{parent:_t._currentValue,pool:t}}var ri=Error(x(460)),bs=Error(x(474)),qn=Error(x(542)),gn={then:function(){}};function pm(t){return t=t.status,t==="fulfilled"||t==="rejected"}function l0(t,e,a){switch(a=t[a],a===void 0?t.push(e):a!==e&&(e.then(ca,ca),e=a),e.status){case"fulfilled":return e.value;case"rejected":throw t=e.reason,hm(t),t;default:if(typeof e.status=="string")e.then(ca,ca);else{if(t=lt,t!==null&&100<t.shellSuspendCounter)throw Error(x(482));t=e,t.status="pending",t.then(function(l){if(e.status==="pending"){var i=e;i.status="fulfilled",i.value=l}},function(l){if(e.status==="pending"){var i=e;i.status="rejected",i.reason=l}})}switch(e.status){case"fulfilled":return e.value;case"rejected":throw t=e.reason,hm(t),t}throw ol=e,ri}}function tl(t){try{var e=t._init;return e(t._payload)}catch(a){throw a!==null&&typeof a=="object"&&typeof a.then=="function"?(ol=a,ri):a}}var ol=null;function dm(){if(ol===null)throw Error(x(459));var t=ol;return ol=null,t}function hm(t){if(t===ri||t===qn)throw Error(x(483))}var Xl=null,Pi=0;function Go(t){var e=Pi;return Pi+=1,Xl===null&&(Xl=[]),l0(Xl,t,e)}function _i(t,e){e=e.props.ref,t.ref=e!==void 0?e:null}function Vo(t,e){throw e.$$typeof===A1?Error(x(525)):(t=Object.prototype.toString.call(e),Error(x(31,t==="[object Object]"?"object with keys {"+Object.keys(e).join(", ")+"}":t)))}function i0(t){function e(f,m){if(t){var g=f.deletions;g===null?(f.deletions=[m],f.flags|=16):g.push(m)}}function a(f,m){if(!t)return null;for(;m!==null;)e(f,m),m=m.sibling;return null}function l(f){for(var m=new Map;f!==null;)f.key!==null?m.set(f.key,f):m.set(f.index,f),f=f.sibling;return m}function i(f,m){return f=ma(f,m),f.index=0,f.sibling=null,f}function o(f,m,g){return f.index=g,t?(g=f.alternate,g!==null?(g=g.index,g<m?(f.flags|=67108866,m):g):(f.flags|=67108866,m)):(f.flags|=1048576,m)}function n(f){return t&&f.alternate===null&&(f.flags|=67108866),f}function r(f,m,g,v){return m===null||m.tag!==6?(m=Yr(g,f.mode,v),m.return=f,m):(m=i(m,g),m.return=f,m)}function u(f,m,g,v){var _=g.type;return _===Tl?p(f,m,g.props.children,v,g.key):m!==null&&(m.elementType===_||typeof _=="object"&&_!==null&&_.$$typeof===_a&&tl(_)===m.type)?(m=i(m,g.props),_i(m,g),m.return=f,m):(m=Wo(g.type,g.key,g.props,null,f.mode,v),_i(m,g),m.return=f,m)}function s(f,m,g,v){return m===null||m.tag!==4||m.stateNode.containerInfo!==g.containerInfo||m.stateNode.implementation!==g.implementation?(m=Fr(g,f.mode,v),m.return=f,m):(m=i(m,g.children||[]),m.return=f,m)}function p(f,m,g,v,_){return m===null||m.tag!==7?(m=ll(g,f.mode,v,_),m.return=f,m):(m=i(m,g),m.return=f,m)}function d(f,m,g){if(typeof m=="string"&&m!==""||typeof m=="number"||typeof m=="bigint")return m=Yr(""+m,f.mode,g),m.return=f,m;if(typeof m=="object"&&m!==null){switch(m.$$typeof){case zo:return g=Wo(m.type,m.key,m.props,null,f.mode,g),_i(g,m),g.return=f,g;case Ti:return m=Fr(m,f.mode,g),m.return=f,m;case _a:return m=tl(m),d(f,m,g)}if(Mi(m)||xi(m))return m=ll(m,f.mode,g,null),m.return=f,m;if(typeof m.then=="function")return d(f,Go(m),g);if(m.$$typeof===sa)return d(f,No(f,m),g);Vo(f,m)}return null}function c(f,m,g,v){var _=m!==null?m.key:null;if(typeof g=="string"&&g!==""||typeof g=="number"||typeof g=="bigint")return _!==null?null:r(f,m,""+g,v);if(typeof g=="object"&&g!==null){switch(g.$$typeof){case zo:return g.key===_?u(f,m,g,v):null;case Ti:return g.key===_?s(f,m,g,v):null;case _a:return g=tl(g),c(f,m,g,v)}if(Mi(g)||xi(g))return _!==null?null:p(f,m,g,v,null);if(typeof g.then=="function")return c(f,m,Go(g),v);if(g.$$typeof===sa)return c(f,m,No(f,g),v);Vo(f,g)}return null}function h(f,m,g,v,_){if(typeof v=="string"&&v!==""||typeof v=="number"||typeof v=="bigint")return f=f.get(g)||null,r(m,f,""+v,_);if(typeof v=="object"&&v!==null){switch(v.$$typeof){case zo:return f=f.get(v.key===null?g:v.key)||null,u(m,f,v,_);case Ti:return f=f.get(v.key===null?g:v.key)||null,s(m,f,v,_);case _a:return v=tl(v),h(f,m,g,v,_)}if(Mi(v)||xi(v))return f=f.get(g)||null,p(m,f,v,_,null);if(typeof v.then=="function")return h(f,m,g,Go(v),_);if(v.$$typeof===sa)return h(f,m,g,No(m,v),_);Vo(m,v)}return null}function y(f,m,g,v){for(var _=null,E=null,b=m,T=m=0,z=null;b!==null&&T<g.length;T++){b.index>T?(z=b,b=null):z=b.sibling;var M=c(f,b,g[T],v);if(M===null){b===null&&(b=z);break}t&&b&&M.alternate===null&&e(f,b),m=o(M,m,T),E===null?_=M:E.sibling=M,E=M,b=z}if(T===g.length)return a(f,b),X&&ra(f,T),_;if(b===null){for(;T<g.length;T++)b=d(f,g[T],v),b!==null&&(m=o(b,m,T),E===null?_=b:E.sibling=b,E=b);return X&&ra(f,T),_}for(b=l(b);T<g.length;T++)z=h(b,f,T,g[T],v),z!==null&&(t&&z.alternate!==null&&b.delete(z.key===null?T:z.key),m=o(z,m,T),E===null?_=z:E.sibling=z,E=z);return t&&b.forEach(function(K){return e(f,K)}),X&&ra(f,T),_}function S(f,m,g,v){if(g==null)throw Error(x(151));for(var _=null,E=null,b=m,T=m=0,z=null,M=g.next();b!==null&&!M.done;T++,M=g.next()){b.index>T?(z=b,b=null):z=b.sibling;var K=c(f,b,M.value,v);if(K===null){b===null&&(b=z);break}t&&b&&K.alternate===null&&e(f,b),m=o(K,m,T),E===null?_=K:E.sibling=K,E=K,b=z}if(M.done)return a(f,b),X&&ra(f,T),_;if(b===null){for(;!M.done;T++,M=g.next())M=d(f,M.value,v),M!==null&&(m=o(M,m,T),E===null?_=M:E.sibling=M,E=M);return X&&ra(f,T),_}for(b=l(b);!M.done;T++,M=g.next())M=h(b,f,T,M.value,v),M!==null&&(t&&M.alternate!==null&&b.delete(M.key===null?T:M.key),m=o(M,m,T),E===null?_=M:E.sibling=M,E=M);return t&&b.forEach(function(It){return e(f,It)}),X&&ra(f,T),_}function A(f,m,g,v){if(typeof g=="object"&&g!==null&&g.type===Tl&&g.key===null&&(g=g.props.children),typeof g=="object"&&g!==null){switch(g.$$typeof){case zo:t:{for(var _=g.key;m!==null;){if(m.key===_){if(_=g.type,_===Tl){if(m.tag===7){a(f,m.sibling),v=i(m,g.props.children),v.return=f,f=v;break t}}else if(m.elementType===_||typeof _=="object"&&_!==null&&_.$$typeof===_a&&tl(_)===m.type){a(f,m.sibling),v=i(m,g.props),_i(v,g),v.return=f,f=v;break t}a(f,m);break}else e(f,m);m=m.sibling}g.type===Tl?(v=ll(g.props.children,f.mode,v,g.key),v.return=f,f=v):(v=Wo(g.type,g.key,g.props,null,f.mode,v),_i(v,g),v.return=f,f=v)}return n(f);case Ti:t:{for(_=g.key;m!==null;){if(m.key===_)if(m.tag===4&&m.stateNode.containerInfo===g.containerInfo&&m.stateNode.implementation===g.implementation){a(f,m.sibling),v=i(m,g.children||[]),v.return=f,f=v;break t}else{a(f,m);break}else e(f,m);m=m.sibling}v=Fr(g,f.mode,v),v.return=f,f=v}return n(f);case _a:return g=tl(g),A(f,m,g,v)}if(Mi(g))return y(f,m,g,v);if(xi(g)){if(_=xi(g),typeof _!="function")throw Error(x(150));return g=_.call(g),S(f,m,g,v)}if(typeof g.then=="function")return A(f,m,Go(g),v);if(g.$$typeof===sa)return A(f,m,No(f,g),v);Vo(f,g)}return typeof g=="string"&&g!==""||typeof g=="number"||typeof g=="bigint"?(g=""+g,m!==null&&m.tag===6?(a(f,m.sibling),v=i(m,g),v.return=f,f=v):(a(f,m),v=Yr(g,f.mode,v),v.return=f,f=v),n(f)):a(f,m)}return function(f,m,g,v){try{Pi=0;var _=A(f,m,g,v);return Xl=null,_}catch(b){if(b===ri||b===qn)throw b;var E=ve(29,b,null,f.mode);return E.lanes=v,E.return=f,E}}}var sl=i0(!0),o0=i0(!1),Ba=!1;function _s(t){t.updateQueue={baseState:t.memoizedState,firstBaseUpdate:null,lastBaseUpdate:null,shared:{pending:null,lanes:0,hiddenCallbacks:null},callbacks:null}}function Uu(t,e){t=t.updateQueue,e.updateQueue===t&&(e.updateQueue={baseState:t.baseState,firstBaseUpdate:t.firstBaseUpdate,lastBaseUpdate:t.lastBaseUpdate,shared:t.shared,callbacks:null})}function Ga(t){return{lane:t,tag:0,payload:null,callback:null,next:null}}function Va(t,e,a){var l=t.updateQueue;if(l===null)return null;if(l=l.shared,(k&2)!==0){var i=l.pending;return i===null?e.next=e:(e.next=i.next,i.next=e),l.pending=e,e=pn(t),Jp(t,null,a),e}return Fn(t,l,e,a),pn(t)}function Vi(t,e,a){if(e=e.updateQueue,e!==null&&(e=e.shared,(a&4194048)!==0)){var l=e.lanes;l&=t.pendingLanes,a|=l,e.lanes=a,_p(t,a)}}function Lr(t,e){var a=t.updateQueue,l=t.alternate;if(l!==null&&(l=l.updateQueue,a===l)){var i=null,o=null;if(a=a.firstBaseUpdate,a!==null){do{var n={lane:a.lane,tag:a.tag,payload:a.payload,callback:null,next:null};o===null?i=o=n:o=o.next=n,a=a.next}while(a!==null);o===null?i=o=e:o=o.next=e}else i=o=e;a={baseState:l.baseState,firstBaseUpdate:i,lastBaseUpdate:o,shared:l.shared,callbacks:l.callbacks},t.updateQueue=a;return}t=a.lastBaseUpdate,t===null?a.firstBaseUpdate=e:t.next=e,a.lastBaseUpdate=e}var Ru=!1;function Hi(){if(Ru){var t=Ll;if(t!==null)throw t}}function Qi(t,e,a,l){Ru=!1;var i=t.updateQueue;Ba=!1;var o=i.firstBaseUpdate,n=i.lastBaseUpdate,r=i.shared.pending;if(r!==null){i.shared.pending=null;var u=r,s=u.next;u.next=null,n===null?o=s:n.next=s,n=u;var p=t.alternate;p!==null&&(p=p.updateQueue,r=p.lastBaseUpdate,r!==n&&(r===null?p.firstBaseUpdate=s:r.next=s,p.lastBaseUpdate=u))}if(o!==null){var d=i.baseState;n=0,p=s=u=null,r=o;do{var c=r.lane&-536870913,h=c!==r.lane;if(h?(q&c)===c:(l&c)===c){c!==0&&c===Jl&&(Ru=!0),p!==null&&(p=p.next={lane:0,tag:r.tag,payload:r.payload,callback:null,next:null});t:{var y=t,S=r;c=e;var A=a;switch(S.tag){case 1:if(y=S.payload,typeof y=="function"){d=y.call(A,d,c);break t}d=y;break t;case 3:y.flags=y.flags&-65537|128;case 0:if(y=S.payload,c=typeof y=="function"?y.call(A,d,c):y,c==null)break t;d=ct({},d,c);break t;case 2:Ba=!0}}c=r.callback,c!==null&&(t.flags|=64,h&&(t.flags|=8192),h=i.callbacks,h===null?i.callbacks=[c]:h.push(c))}else h={lane:c,tag:r.tag,payload:r.payload,callback:r.callback,next:null},p===null?(s=p=h,u=d):p=p.next=h,n|=c;if(r=r.next,r===null){if(r=i.shared.pending,r===null)break;h=r,r=h.next,h.next=null,i.lastBaseUpdate=h,i.shared.pending=null}}while(!0);p===null&&(u=d),i.baseState=u,i.firstBaseUpdate=s,i.lastBaseUpdate=p,o===null&&(i.shared.lanes=0),ka|=n,t.lanes=n,t.memoizedState=d}}function n0(t,e){if(typeof t!="function")throw Error(x(191,t));t.call(e)}function r0(t,e){var a=t.callbacks;if(a!==null)for(t.callbacks=null,t=0;t<a.length;t++)n0(a[t],e)}var Il=Ie(null),vn=Ie(0);function gm(t,e){t=Sa,ot(vn,t),ot(Il,e),Sa=t|e.baseLanes}function Du(){ot(vn,Sa),ot(Il,Il.current)}function Bs(){Sa=vn.current,Ot(Il),Ot(vn)}var Be=Ie(null),Ve=null;function Ca(t){var e=t.alternate;ot(vt,vt.current&1),ot(Be,t),Ve===null&&(e===null||Il.current!==null||e.memoizedState!==null)&&(Ve=t)}function Ou(t){ot(vt,vt.current),ot(Be,t),Ve===null&&(Ve=t)}function u0(t){t.tag===22?(ot(vt,vt.current),ot(Be,t),Ve===null&&(Ve=t)):za(t)}function za(){ot(vt,vt.current),ot(Be,Be.current)}function ge(t){Ot(Be),Ve===t&&(Ve=null),Ot(vt)}var vt=Ie(0);function yn(t){for(var e=t;e!==null;){if(e.tag===13){var a=e.memoizedState;if(a!==null&&(a=a.dehydrated,a===null||Pu(a)||$u(a)))return e}else if(e.tag===19&&(e.memoizedProps.revealOrder==="forwards"||e.memoizedProps.revealOrder==="backwards"||e.memoizedProps.revealOrder==="unstable_legacy-backwards"||e.memoizedProps.revealOrder==="together")){if((e.flags&128)!==0)return e}else if(e.child!==null){e.child.return=e,e=e.child;continue}if(e===t)break;for(;e.sibling===null;){if(e.return===null||e.return===t)return null;e=e.return}e.sibling.return=e.return,e=e.sibling}return null}var ga=0,G=null,tt=null,xt=null,Sn=!1,jl=!1,cl=!1,An=0,$i=0,kl=null,Nv=0;function dt(){throw Error(x(321))}function Es(t,e){if(e===null)return!1;for(var a=0;a<e.length&&a<t.length;a++)if(!_e(t[a],e[a]))return!1;return!0}function Cs(t,e,a,l,i,o){return ga=o,G=e,e.memoizedState=null,e.updateQueue=null,e.lanes=0,R.H=t===null||t.memoizedState===null?Q0:Vs,cl=!1,o=a(l,i),cl=!1,jl&&(o=c0(e,a,l,i)),s0(t),o}function s0(t){R.H=to;var e=tt!==null&&tt.next!==null;if(ga=0,xt=tt=G=null,Sn=!1,$i=0,kl=null,e)throw Error(x(300));t===null||Bt||(t=t.dependencies,t!==null&&hn(t)&&(Bt=!0))}function c0(t,e,a,l){G=t;var i=0;do{if(jl&&(kl=null),$i=0,jl=!1,25<=i)throw Error(x(301));if(i+=1,xt=tt=null,t.updateQueue!=null){var o=t.updateQueue;o.lastEffect=null,o.events=null,o.stores=null,o.memoCache!=null&&(o.memoCache.index=0)}R.H=Y0,o=e(a,l)}while(jl);return o}function Gv(){var t=R.H,e=t.useState()[0];return e=typeof e.then=="function"?po(e):e,t=t.useState()[0],(tt!==null?tt.memoizedState:null)!==t&&(G.flags|=1024),e}function zs(){var t=An!==0;return An=0,t}function Ts(t,e,a){e.updateQueue=t.updateQueue,e.flags&=-2053,t.lanes&=~a}function Ms(t){if(Sn){for(t=t.memoizedState;t!==null;){var e=t.queue;e!==null&&(e.pending=null),t=t.next}Sn=!1}ga=0,xt=tt=G=null,jl=!1,$i=An=0,kl=null}function ae(){var t={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};return xt===null?G.memoizedState=xt=t:xt=xt.next=t,xt}function yt(){if(tt===null){var t=G.alternate;t=t!==null?t.memoizedState:null}else t=tt.next;var e=xt===null?G.memoizedState:xt.next;if(e!==null)xt=e,tt=t;else{if(t===null)throw G.alternate===null?Error(x(467)):Error(x(310));tt=t,t={memoizedState:tt.memoizedState,baseState:tt.baseState,baseQueue:tt.baseQueue,queue:tt.queue,next:null},xt===null?G.memoizedState=xt=t:xt=xt.next=t}return xt}function Ln(){return{lastEffect:null,events:null,stores:null,memoCache:null}}function po(t){var e=$i;return $i+=1,kl===null&&(kl=[]),t=l0(kl,t,e),e=G,(xt===null?e.memoizedState:xt.next)===null&&(e=e.alternate,R.H=e===null||e.memoizedState===null?Q0:Vs),t}function Xn(t){if(t!==null&&typeof t=="object"){if(typeof t.then=="function")return po(t);if(t.$$typeof===sa)return Yt(t)}throw Error(x(438,String(t)))}function Us(t){var e=null,a=G.updateQueue;if(a!==null&&(e=a.memoCache),e==null){var l=G.alternate;l!==null&&(l=l.updateQueue,l!==null&&(l=l.memoCache,l!=null&&(e={data:l.data.map(function(i){return i.slice()}),index:0})))}if(e==null&&(e={data:[],index:0}),a===null&&(a=Ln(),G.updateQueue=a),a.memoCache=e,a=e.data[e.index],a===void 0)for(a=e.data[e.index]=Array(t),l=0;l<t;l++)a[l]=x1;return e.index++,a}function va(t,e){return typeof e=="function"?e(t):e}function Io(t){var e=yt();return Rs(e,tt,t)}function Rs(t,e,a){var l=t.queue;if(l===null)throw Error(x(311));l.lastRenderedReducer=a;var i=t.baseQueue,o=l.pending;if(o!==null){if(i!==null){var n=i.next;i.next=o.next,o.next=n}e.baseQueue=i=o,l.pending=null}if(o=t.baseState,i===null)t.memoizedState=o;else{e=i.next;var r=n=null,u=null,s=e,p=!1;do{var d=s.lane&-536870913;if(d!==s.lane?(q&d)===d:(ga&d)===d){var c=s.revertLane;if(c===0)u!==null&&(u=u.next={lane:0,revertLane:0,gesture:null,action:s.action,hasEagerState:s.hasEagerState,eagerState:s.eagerState,next:null}),d===Jl&&(p=!0);else if((ga&c)===c){s=s.next,c===Jl&&(p=!0);continue}else d={lane:0,revertLane:s.revertLane,gesture:null,action:s.action,hasEagerState:s.hasEagerState,eagerState:s.eagerState,next:null},u===null?(r=u=d,n=o):u=u.next=d,G.lanes|=c,ka|=c;d=s.action,cl&&a(o,d),o=s.hasEagerState?s.eagerState:a(o,d)}else c={lane:d,revertLane:s.revertLane,gesture:s.gesture,action:s.action,hasEagerState:s.hasEagerState,eagerState:s.eagerState,next:null},u===null?(r=u=c,n=o):u=u.next=c,G.lanes|=d,ka|=d;s=s.next}while(s!==null&&s!==e);if(u===null?n=o:u.next=r,!_e(o,t.memoizedState)&&(Bt=!0,p&&(a=Ll,a!==null)))throw a;t.memoizedState=o,t.baseState=n,t.baseQueue=u,l.lastRenderedState=o}return i===null&&(l.lanes=0),[t.memoizedState,l.dispatch]}function Xr(t){var e=yt(),a=e.queue;if(a===null)throw Error(x(311));a.lastRenderedReducer=t;var l=a.dispatch,i=a.pending,o=e.memoizedState;if(i!==null){a.pending=null;var n=i=i.next;do o=t(o,n.action),n=n.next;while(n!==i);_e(o,e.memoizedState)||(Bt=!0),e.memoizedState=o,e.baseQueue===null&&(e.baseState=o),a.lastRenderedState=o}return[o,l]}function f0(t,e,a){var l=G,i=yt(),o=X;if(o){if(a===void 0)throw Error(x(407));a=a()}else a=e();var n=!_e((tt||i).memoizedState,a);if(n&&(i.memoizedState=a,Bt=!0),i=i.queue,Ds(d0.bind(null,l,i,t),[t]),i.getSnapshot!==e||n||xt!==null&&xt.memoizedState.tag&1){if(l.flags|=2048,Pl(9,{destroy:void 0},p0.bind(null,l,i,a,e),null),lt===null)throw Error(x(349));o||(ga&127)!==0||m0(l,e,a)}return a}function m0(t,e,a){t.flags|=16384,t={getSnapshot:e,value:a},e=G.updateQueue,e===null?(e=Ln(),G.updateQueue=e,e.stores=[t]):(a=e.stores,a===null?e.stores=[t]:a.push(t))}function p0(t,e,a,l){e.value=a,e.getSnapshot=l,h0(e)&&g0(t)}function d0(t,e,a){return a(function(){h0(e)&&g0(t)})}function h0(t){var e=t.getSnapshot;t=t.value;try{var a=e();return!_e(t,a)}catch{return!0}}function g0(t){var e=hl(t,2);e!==null&&me(e,t,2)}function wu(t){var e=ae();if(typeof t=="function"){var a=t;if(t=a(),cl){Ma(!0);try{a()}finally{Ma(!1)}}}return e.memoizedState=e.baseState=t,e.queue={pending:null,lanes:0,dispatch:null,lastRenderedReducer:va,lastRenderedState:t},e}function v0(t,e,a,l){return t.baseState=a,Rs(t,tt,typeof l=="function"?l:va)}function Vv(t,e,a,l,i){if(kn(t))throw Error(x(485));if(t=e.action,t!==null){var o={payload:i,action:t,next:null,isTransition:!0,status:"pending",value:null,reason:null,listeners:[],then:function(n){o.listeners.push(n)}};R.T!==null?a(!0):o.isTransition=!1,l(o),a=e.pending,a===null?(o.next=e.pending=o,y0(e,o)):(o.next=a.next,e.pending=a.next=o)}}function y0(t,e){var a=e.action,l=e.payload,i=t.state;if(e.isTransition){var o=R.T,n={};R.T=n;try{var r=a(i,l),u=R.S;u!==null&&u(n,r),vm(t,e,r)}catch(s){Nu(t,e,s)}finally{o!==null&&n.types!==null&&(o.types=n.types),R.T=o}}else try{o=a(i,l),vm(t,e,o)}catch(s){Nu(t,e,s)}}function vm(t,e,a){a!==null&&typeof a=="object"&&typeof a.then=="function"?a.then(function(l){ym(t,e,l)},function(l){return Nu(t,e,l)}):ym(t,e,a)}function ym(t,e,a){e.status="fulfilled",e.value=a,S0(e),t.state=a,e=t.pending,e!==null&&(a=e.next,a===e?t.pending=null:(a=a.next,e.next=a,y0(t,a)))}function Nu(t,e,a){var l=t.pending;if(t.pending=null,l!==null){l=l.next;do e.status="rejected",e.reason=a,S0(e),e=e.next;while(e!==l)}t.action=null}function S0(t){t=t.listeners;for(var e=0;e<t.length;e++)(0,t[e])()}function A0(t,e){return e}function Sm(t,e){if(X){var a=lt.formState;if(a!==null){t:{var l=G;if(X){if(st){e:{for(var i=st,o=Ge;i.nodeType!==8;){if(!o){i=null;break e}if(i=He(i.nextSibling),i===null){i=null;break e}}o=i.data,i=o==="F!"||o==="F"?i:null}if(i){st=He(i.nextSibling),l=i.data==="F!";break t}}Xa(l)}l=!1}l&&(e=a[0])}}return a=ae(),a.memoizedState=a.baseState=e,l={pending:null,lanes:0,dispatch:null,lastRenderedReducer:A0,lastRenderedState:e},a.queue=l,a=G0.bind(null,G,l),l.dispatch=a,l=wu(!1),o=Gs.bind(null,G,!1,l.queue),l=ae(),i={state:e,dispatch:null,action:t,pending:null},l.queue=i,a=Vv.bind(null,G,i,o,a),i.dispatch=a,l.memoizedState=t,[e,a,!1]}function Am(t){var e=yt();return x0(e,tt,t)}function x0(t,e,a){if(e=Rs(t,e,A0)[0],t=Io(va)[0],typeof e=="object"&&e!==null&&typeof e.then=="function")try{var l=po(e)}catch(n){throw n===ri?qn:n}else l=e;e=yt();var i=e.queue,o=i.dispatch;return a!==e.memoizedState&&(G.flags|=2048,Pl(9,{destroy:void 0},Hv.bind(null,i,a),null)),[l,o,t]}function Hv(t,e){t.action=e}function xm(t){var e=yt(),a=tt;if(a!==null)return x0(e,a,t);yt(),e=e.memoizedState,a=yt();var l=a.queue.dispatch;return a.memoizedState=t,[e,l,!1]}function Pl(t,e,a,l){return t={tag:t,create:a,deps:l,inst:e,next:null},e=G.updateQueue,e===null&&(e=Ln(),G.updateQueue=e),a=e.lastEffect,a===null?e.lastEffect=t.next=t:(l=a.next,a.next=t,t.next=l,e.lastEffect=t),t}function b0(){return yt().memoizedState}function Po(t,e,a,l){var i=ae();G.flags|=t,i.memoizedState=Pl(1|e,{destroy:void 0},a,l===void 0?null:l)}function jn(t,e,a,l){var i=yt();l=l===void 0?null:l;var o=i.memoizedState.inst;tt!==null&&l!==null&&Es(l,tt.memoizedState.deps)?i.memoizedState=Pl(e,o,a,l):(G.flags|=t,i.memoizedState=Pl(1|e,o,a,l))}function bm(t,e){Po(8390656,8,t,e)}function Ds(t,e){jn(2048,8,t,e)}function Qv(t){G.flags|=4;var e=G.updateQueue;if(e===null)e=Ln(),G.updateQueue=e,e.events=[t];else{var a=e.events;a===null?e.events=[t]:a.push(t)}}function _0(t){var e=yt().memoizedState;return Qv({ref:e,nextImpl:t}),function(){if((k&2)!==0)throw Error(x(440));return e.impl.apply(void 0,arguments)}}function B0(t,e){return jn(4,2,t,e)}function E0(t,e){return jn(4,4,t,e)}function C0(t,e){if(typeof e=="function"){t=t();var a=e(t);return function(){typeof a=="function"?a():e(null)}}if(e!=null)return t=t(),e.current=t,function(){e.current=null}}function z0(t,e,a){a=a!=null?a.concat([t]):null,jn(4,4,C0.bind(null,e,t),a)}function Os(){}function T0(t,e){var a=yt();e=e===void 0?null:e;var l=a.memoizedState;return e!==null&&Es(e,l[1])?l[0]:(a.memoizedState=[t,e],t)}function M0(t,e){var a=yt();e=e===void 0?null:e;var l=a.memoizedState;if(e!==null&&Es(e,l[1]))return l[0];if(l=t(),cl){Ma(!0);try{t()}finally{Ma(!1)}}return a.memoizedState=[l,e],l}function ws(t,e,a){return a===void 0||(ga&1073741824)!==0&&(q&261930)===0?t.memoizedState=e:(t.memoizedState=a,t=vd(),G.lanes|=t,ka|=t,a)}function U0(t,e,a,l){return _e(a,e)?a:Il.current!==null?(t=ws(t,a,l),_e(t,e)||(Bt=!0),t):(ga&42)===0||(ga&1073741824)!==0&&(q&261930)===0?(Bt=!0,t.memoizedState=a):(t=vd(),G.lanes|=t,ka|=t,e)}function R0(t,e,a,l,i){var o=Z.p;Z.p=o!==0&&8>o?o:8;var n=R.T,r={};R.T=r,Gs(t,!1,e,a);try{var u=i(),s=R.S;if(s!==null&&s(r,u),u!==null&&typeof u=="object"&&typeof u.then=="function"){var p=wv(u,l);Yi(t,e,p,be(t))}else Yi(t,e,l,be(t))}catch(d){Yi(t,e,{then:function(){},status:"rejected",reason:d},be())}finally{Z.p=o,n!==null&&r.types!==null&&(n.types=r.types),R.T=n}}function Yv(){}function Gu(t,e,a,l){if(t.tag!==5)throw Error(x(476));var i=D0(t).queue;R0(t,i,e,al,a===null?Yv:function(){return O0(t),a(l)})}function D0(t){var e=t.memoizedState;if(e!==null)return e;e={memoizedState:al,baseState:al,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:va,lastRenderedState:al},next:null};var a={};return e.next={memoizedState:a,baseState:a,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:va,lastRenderedState:a},next:null},t.memoizedState=e,t=t.alternate,t!==null&&(t.memoizedState=e),e}function O0(t){var e=D0(t);e.next===null&&(e=t.alternate.memoizedState),Yi(t,e.next.queue,{},be())}function Ns(){return Yt(lo)}function w0(){return yt().memoizedState}function N0(){return yt().memoizedState}function Fv(t){for(var e=t.return;e!==null;){switch(e.tag){case 24:case 3:var a=be();t=Ga(a);var l=Va(e,t,a);l!==null&&(me(l,e,a),Vi(l,e,a)),e={cache:As()},t.payload=e;return}e=e.return}}function qv(t,e,a){var l=be();a={lane:l,revertLane:0,gesture:null,action:a,hasEagerState:!1,eagerState:null,next:null},kn(t)?V0(e,a):(a=gs(t,e,a,l),a!==null&&(me(a,t,l),H0(a,e,l)))}function G0(t,e,a){var l=be();Yi(t,e,a,l)}function Yi(t,e,a,l){var i={lane:l,revertLane:0,gesture:null,action:a,hasEagerState:!1,eagerState:null,next:null};if(kn(t))V0(e,i);else{var o=t.alternate;if(t.lanes===0&&(o===null||o.lanes===0)&&(o=e.lastRenderedReducer,o!==null))try{var n=e.lastRenderedState,r=o(n,a);if(i.hasEagerState=!0,i.eagerState=r,_e(r,n))return Fn(t,e,i,0),lt===null&&Yn(),!1}catch{}if(a=gs(t,e,i,l),a!==null)return me(a,t,l),H0(a,e,l),!0}return!1}function Gs(t,e,a,l){if(l={lane:2,revertLane:js(),gesture:null,action:l,hasEagerState:!1,eagerState:null,next:null},kn(t)){if(e)throw Error(x(479))}else e=gs(t,a,l,2),e!==null&&me(e,t,2)}function kn(t){var e=t.alternate;return t===G||e!==null&&e===G}function V0(t,e){jl=Sn=!0;var a=t.pending;a===null?e.next=e:(e.next=a.next,a.next=e),t.pending=e}function H0(t,e,a){if((a&4194048)!==0){var l=e.lanes;l&=t.pendingLanes,a|=l,e.lanes=a,_p(t,a)}}var to={readContext:Yt,use:Xn,useCallback:dt,useContext:dt,useEffect:dt,useImperativeHandle:dt,useLayoutEffect:dt,useInsertionEffect:dt,useMemo:dt,useReducer:dt,useRef:dt,useState:dt,useDebugValue:dt,useDeferredValue:dt,useTransition:dt,useSyncExternalStore:dt,useId:dt,useHostTransitionStatus:dt,useFormState:dt,useActionState:dt,useOptimistic:dt,useMemoCache:dt,useCacheRefresh:dt};to.useEffectEvent=dt;var Q0={readContext:Yt,use:Xn,useCallback:function(t,e){return ae().memoizedState=[t,e===void 0?null:e],t},useContext:Yt,useEffect:bm,useImperativeHandle:function(t,e,a){a=a!=null?a.concat([t]):null,Po(4194308,4,C0.bind(null,e,t),a)},useLayoutEffect:function(t,e){return Po(4194308,4,t,e)},useInsertionEffect:function(t,e){Po(4,2,t,e)},useMemo:function(t,e){var a=ae();e=e===void 0?null:e;var l=t();if(cl){Ma(!0);try{t()}finally{Ma(!1)}}return a.memoizedState=[l,e],l},useReducer:function(t,e,a){var l=ae();if(a!==void 0){var i=a(e);if(cl){Ma(!0);try{a(e)}finally{Ma(!1)}}}else i=e;return l.memoizedState=l.baseState=i,t={pending:null,lanes:0,dispatch:null,lastRenderedReducer:t,lastRenderedState:i},l.queue=t,t=t.dispatch=qv.bind(null,G,t),[l.memoizedState,t]},useRef:function(t){var e=ae();return t={current:t},e.memoizedState=t},useState:function(t){t=wu(t);var e=t.queue,a=G0.bind(null,G,e);return e.dispatch=a,[t.memoizedState,a]},useDebugValue:Os,useDeferredValue:function(t,e){var a=ae();return ws(a,t,e)},useTransition:function(){var t=wu(!1);return t=R0.bind(null,G,t.queue,!0,!1),ae().memoizedState=t,[!1,t]},useSyncExternalStore:function(t,e,a){var l=G,i=ae();if(X){if(a===void 0)throw Error(x(407));a=a()}else{if(a=e(),lt===null)throw Error(x(349));(q&127)!==0||m0(l,e,a)}i.memoizedState=a;var o={value:a,getSnapshot:e};return i.queue=o,bm(d0.bind(null,l,o,t),[t]),l.flags|=2048,Pl(9,{destroy:void 0},p0.bind(null,l,o,a,e),null),a},useId:function(){var t=ae(),e=lt.identifierPrefix;if(X){var a=Ke,l=Ze;a=(l&~(1<<32-xe(l)-1)).toString(32)+a,e="_"+e+"R_"+a,a=An++,0<a&&(e+="H"+a.toString(32)),e+="_"}else a=Nv++,e="_"+e+"r_"+a.toString(32)+"_";return t.memoizedState=e},useHostTransitionStatus:Ns,useFormState:Sm,useActionState:Sm,useOptimistic:function(t){var e=ae();e.memoizedState=e.baseState=t;var a={pending:null,lanes:0,dispatch:null,lastRenderedReducer:null,lastRenderedState:null};return e.queue=a,e=Gs.bind(null,G,!0,a),a.dispatch=e,[t,e]},useMemoCache:Us,useCacheRefresh:function(){return ae().memoizedState=Fv.bind(null,G)},useEffectEvent:function(t){var e=ae(),a={impl:t};return e.memoizedState=a,function(){if((k&2)!==0)throw Error(x(440));return a.impl.apply(void 0,arguments)}}},Vs={readContext:Yt,use:Xn,useCallback:T0,useContext:Yt,useEffect:Ds,useImperativeHandle:z0,useInsertionEffect:B0,useLayoutEffect:E0,useMemo:M0,useReducer:Io,useRef:b0,useState:function(){return Io(va)},useDebugValue:Os,useDeferredValue:function(t,e){var a=yt();return U0(a,tt.memoizedState,t,e)},useTransition:function(){var t=Io(va)[0],e=yt().memoizedState;return[typeof t=="boolean"?t:po(t),e]},useSyncExternalStore:f0,useId:w0,useHostTransitionStatus:Ns,useFormState:Am,useActionState:Am,useOptimistic:function(t,e){var a=yt();return v0(a,tt,t,e)},useMemoCache:Us,useCacheRefresh:N0};Vs.useEffectEvent=_0;var Y0={readContext:Yt,use:Xn,useCallback:T0,useContext:Yt,useEffect:Ds,useImperativeHandle:z0,useInsertionEffect:B0,useLayoutEffect:E0,useMemo:M0,useReducer:Xr,useRef:b0,useState:function(){return Xr(va)},useDebugValue:Os,useDeferredValue:function(t,e){var a=yt();return tt===null?ws(a,t,e):U0(a,tt.memoizedState,t,e)},useTransition:function(){var t=Xr(va)[0],e=yt().memoizedState;return[typeof t=="boolean"?t:po(t),e]},useSyncExternalStore:f0,useId:w0,useHostTransitionStatus:Ns,useFormState:xm,useActionState:xm,useOptimistic:function(t,e){var a=yt();return tt!==null?v0(a,tt,t,e):(a.baseState=t,[t,a.queue.dispatch])},useMemoCache:Us,useCacheRefresh:N0};Y0.useEffectEvent=_0;function jr(t,e,a,l){e=t.memoizedState,a=a(l,e),a=a==null?e:ct({},e,a),t.memoizedState=a,t.lanes===0&&(t.updateQueue.baseState=a)}var Vu={enqueueSetState:function(t,e,a){t=t._reactInternals;var l=be(),i=Ga(l);i.payload=e,a!=null&&(i.callback=a),e=Va(t,i,l),e!==null&&(me(e,t,l),Vi(e,t,l))},enqueueReplaceState:function(t,e,a){t=t._reactInternals;var l=be(),i=Ga(l);i.tag=1,i.payload=e,a!=null&&(i.callback=a),e=Va(t,i,l),e!==null&&(me(e,t,l),Vi(e,t,l))},enqueueForceUpdate:function(t,e){t=t._reactInternals;var a=be(),l=Ga(a);l.tag=2,e!=null&&(l.callback=e),e=Va(t,l,a),e!==null&&(me(e,t,a),Vi(e,t,a))}};function _m(t,e,a,l,i,o,n){return t=t.stateNode,typeof t.shouldComponentUpdate=="function"?t.shouldComponentUpdate(l,o,n):e.prototype&&e.prototype.isPureReactComponent?!Wi(a,l)||!Wi(i,o):!0}function Bm(t,e,a,l){t=e.state,typeof e.componentWillReceiveProps=="function"&&e.componentWillReceiveProps(a,l),typeof e.UNSAFE_componentWillReceiveProps=="function"&&e.UNSAFE_componentWillReceiveProps(a,l),e.state!==t&&Vu.enqueueReplaceState(e,e.state,null)}function fl(t,e){var a=e;if("ref"in e){a={};for(var l in e)l!=="ref"&&(a[l]=e[l])}if(t=t.defaultProps){a===e&&(a=ct({},a));for(var i in t)a[i]===void 0&&(a[i]=t[i])}return a}function F0(t){mn(t)}function q0(t){console.error(t)}function L0(t){mn(t)}function xn(t,e){try{var a=t.onUncaughtError;a(e.value,{componentStack:e.stack})}catch(l){setTimeout(function(){throw l})}}function Em(t,e,a){try{var l=t.onCaughtError;l(a.value,{componentStack:a.stack,errorBoundary:e.tag===1?e.stateNode:null})}catch(i){setTimeout(function(){throw i})}}function Hu(t,e,a){return a=Ga(a),a.tag=3,a.payload={element:null},a.callback=function(){xn(t,e)},a}function X0(t){return t=Ga(t),t.tag=3,t}function j0(t,e,a,l){var i=a.type.getDerivedStateFromError;if(typeof i=="function"){var o=l.value;t.payload=function(){return i(o)},t.callback=function(){Em(e,a,l)}}var n=a.stateNode;n!==null&&typeof n.componentDidCatch=="function"&&(t.callback=function(){Em(e,a,l),typeof i!="function"&&(Ha===null?Ha=new Set([this]):Ha.add(this));var r=l.stack;this.componentDidCatch(l.value,{componentStack:r!==null?r:""})})}function Lv(t,e,a,l,i){if(a.flags|=32768,l!==null&&typeof l=="object"&&typeof l.then=="function"){if(e=a.alternate,e!==null&&ni(e,a,i,!0),a=Be.current,a!==null){switch(a.tag){case 31:case 13:return Ve===null?Cn():a.alternate===null&&ht===0&&(ht=3),a.flags&=-257,a.flags|=65536,a.lanes=i,l===gn?a.flags|=16384:(e=a.updateQueue,e===null?a.updateQueue=new Set([l]):e.add(l),au(t,l,i)),!1;case 22:return a.flags|=65536,l===gn?a.flags|=16384:(e=a.updateQueue,e===null?(e={transitions:null,markerInstances:null,retryQueue:new Set([l])},a.updateQueue=e):(a=e.retryQueue,a===null?e.retryQueue=new Set([l]):a.add(l)),au(t,l,i)),!1}throw Error(x(435,a.tag))}return au(t,l,i),Cn(),!1}if(X)return e=Be.current,e!==null?((e.flags&65536)===0&&(e.flags|=256),e.flags|=65536,e.lanes=i,l!==Eu&&(t=Error(x(422),{cause:l}),Ii(Ne(t,a)))):(l!==Eu&&(e=Error(x(423),{cause:l}),Ii(Ne(e,a))),t=t.current.alternate,t.flags|=65536,i&=-i,t.lanes|=i,l=Ne(l,a),i=Hu(t.stateNode,l,i),Lr(t,i),ht!==4&&(ht=2)),!1;var o=Error(x(520),{cause:l});if(o=Ne(o,a),Li===null?Li=[o]:Li.push(o),ht!==4&&(ht=2),e===null)return!0;l=Ne(l,a),a=e;do{switch(a.tag){case 3:return a.flags|=65536,t=i&-i,a.lanes|=t,t=Hu(a.stateNode,l,t),Lr(a,t),!1;case 1:if(e=a.type,o=a.stateNode,(a.flags&128)===0&&(typeof e.getDerivedStateFromError=="function"||o!==null&&typeof o.componentDidCatch=="function"&&(Ha===null||!Ha.has(o))))return a.flags|=65536,i&=-i,a.lanes|=i,i=X0(i),j0(i,t,a,l),Lr(a,i),!1}a=a.return}while(a!==null);return!1}var Hs=Error(x(461)),Bt=!1;function Vt(t,e,a,l){e.child=t===null?o0(e,null,a,l):sl(e,t.child,a,l)}function Cm(t,e,a,l,i){a=a.render;var o=e.ref;if("ref"in l){var n={};for(var r in l)r!=="ref"&&(n[r]=l[r])}else n=l;return ul(e),l=Cs(t,e,a,n,o,i),r=zs(),t!==null&&!Bt?(Ts(t,e,i),ya(t,e,i)):(X&&r&&ys(e),e.flags|=1,Vt(t,e,l,i),e.child)}function zm(t,e,a,l,i){if(t===null){var o=a.type;return typeof o=="function"&&!vs(o)&&o.defaultProps===void 0&&a.compare===null?(e.tag=15,e.type=o,k0(t,e,o,l,i)):(t=Wo(a.type,null,l,e,e.mode,i),t.ref=e.ref,t.return=e,e.child=t)}if(o=t.child,!Qs(t,i)){var n=o.memoizedProps;if(a=a.compare,a=a!==null?a:Wi,a(n,l)&&t.ref===e.ref)return ya(t,e,i)}return e.flags|=1,t=ma(o,l),t.ref=e.ref,t.return=e,e.child=t}function k0(t,e,a,l,i){if(t!==null){var o=t.memoizedProps;if(Wi(o,l)&&t.ref===e.ref)if(Bt=!1,e.pendingProps=l=o,Qs(t,i))(t.flags&131072)!==0&&(Bt=!0);else return e.lanes=t.lanes,ya(t,e,i)}return Qu(t,e,a,l,i)}function Z0(t,e,a,l){var i=l.children,o=t!==null?t.memoizedState:null;if(t===null&&e.stateNode===null&&(e.stateNode={_visibility:1,_pendingMarkers:null,_retryCache:null,_transitions:null}),l.mode==="hidden"){if((e.flags&128)!==0){if(o=o!==null?o.baseLanes|a:a,t!==null){for(l=e.child=t.child,i=0;l!==null;)i=i|l.lanes|l.childLanes,l=l.sibling;l=i&~o}else l=0,e.child=null;return Tm(t,e,o,a,l)}if((a&536870912)!==0)e.memoizedState={baseLanes:0,cachePool:null},t!==null&&Jo(e,o!==null?o.cachePool:null),o!==null?gm(e,o):Du(),u0(e);else return l=e.lanes=536870912,Tm(t,e,o!==null?o.baseLanes|a:a,a,l)}else o!==null?(Jo(e,o.cachePool),gm(e,o),za(e),e.memoizedState=null):(t!==null&&Jo(e,null),Du(),za(e));return Vt(t,e,i,a),e.child}function Ri(t,e){return t!==null&&t.tag===22||e.stateNode!==null||(e.stateNode={_visibility:1,_pendingMarkers:null,_retryCache:null,_transitions:null}),e.sibling}function Tm(t,e,a,l,i){var o=xs();return o=o===null?null:{parent:_t._currentValue,pool:o},e.memoizedState={baseLanes:a,cachePool:o},t!==null&&Jo(e,null),Du(),u0(e),t!==null&&ni(t,e,l,!0),e.childLanes=i,null}function $o(t,e){return e=bn({mode:e.mode,children:e.children},t.mode),e.ref=t.ref,t.child=e,e.return=t,e}function Mm(t,e,a){return sl(e,t.child,null,a),t=$o(e,e.pendingProps),t.flags|=2,ge(e),e.memoizedState=null,t}function Xv(t,e,a){var l=e.pendingProps,i=(e.flags&128)!==0;if(e.flags&=-129,t===null){if(X){if(l.mode==="hidden")return t=$o(e,l),e.lanes=536870912,Ri(null,t);if(Ou(e),(t=st)?(t=Qd(t,Ge),t=t!==null&&t.data==="&"?t:null,t!==null&&(e.memoizedState={dehydrated:t,treeContext:La!==null?{id:Ze,overflow:Ke}:null,retryLane:536870912,hydrationErrors:null},a=Pp(t),a.return=e,e.child=a,Qt=e,st=null)):t=null,t===null)throw Xa(e);return e.lanes=536870912,null}return $o(e,l)}var o=t.memoizedState;if(o!==null){var n=o.dehydrated;if(Ou(e),i)if(e.flags&256)e.flags&=-257,e=Mm(t,e,a);else if(e.memoizedState!==null)e.child=t.child,e.flags|=128,e=null;else throw Error(x(558));else if(Bt||ni(t,e,a,!1),i=(a&t.childLanes)!==0,Bt||i){if(l=lt,l!==null&&(n=Bp(l,a),n!==0&&n!==o.retryLane))throw o.retryLane=n,hl(t,n),me(l,t,n),Hs;Cn(),e=Mm(t,e,a)}else t=o.treeContext,st=He(n.nextSibling),Qt=e,X=!0,Na=null,Ge=!1,t!==null&&t0(e,t),e=$o(e,l),e.flags|=4096;return e}return t=ma(t.child,{mode:l.mode,children:l.children}),t.ref=e.ref,e.child=t,t.return=e,t}function tn(t,e){var a=e.ref;if(a===null)t!==null&&t.ref!==null&&(e.flags|=4194816);else{if(typeof a!="function"&&typeof a!="object")throw Error(x(284));(t===null||t.ref!==a)&&(e.flags|=4194816)}}function Qu(t,e,a,l,i){return ul(e),a=Cs(t,e,a,l,void 0,i),l=zs(),t!==null&&!Bt?(Ts(t,e,i),ya(t,e,i)):(X&&l&&ys(e),e.flags|=1,Vt(t,e,a,i),e.child)}function Um(t,e,a,l,i,o){return ul(e),e.updateQueue=null,a=c0(e,l,a,i),s0(t),l=zs(),t!==null&&!Bt?(Ts(t,e,o),ya(t,e,o)):(X&&l&&ys(e),e.flags|=1,Vt(t,e,a,o),e.child)}function Rm(t,e,a,l,i){if(ul(e),e.stateNode===null){var o=Gl,n=a.contextType;typeof n=="object"&&n!==null&&(o=Yt(n)),o=new a(l,o),e.memoizedState=o.state!==null&&o.state!==void 0?o.state:null,o.updater=Vu,e.stateNode=o,o._reactInternals=e,o=e.stateNode,o.props=l,o.state=e.memoizedState,o.refs={},_s(e),n=a.contextType,o.context=typeof n=="object"&&n!==null?Yt(n):Gl,o.state=e.memoizedState,n=a.getDerivedStateFromProps,typeof n=="function"&&(jr(e,a,n,l),o.state=e.memoizedState),typeof a.getDerivedStateFromProps=="function"||typeof o.getSnapshotBeforeUpdate=="function"||typeof o.UNSAFE_componentWillMount!="function"&&typeof o.componentWillMount!="function"||(n=o.state,typeof o.componentWillMount=="function"&&o.componentWillMount(),typeof o.UNSAFE_componentWillMount=="function"&&o.UNSAFE_componentWillMount(),n!==o.state&&Vu.enqueueReplaceState(o,o.state,null),Qi(e,l,o,i),Hi(),o.state=e.memoizedState),typeof o.componentDidMount=="function"&&(e.flags|=4194308),l=!0}else if(t===null){o=e.stateNode;var r=e.memoizedProps,u=fl(a,r);o.props=u;var s=o.context,p=a.contextType;n=Gl,typeof p=="object"&&p!==null&&(n=Yt(p));var d=a.getDerivedStateFromProps;p=typeof d=="function"||typeof o.getSnapshotBeforeUpdate=="function",r=e.pendingProps!==r,p||typeof o.UNSAFE_componentWillReceiveProps!="function"&&typeof o.componentWillReceiveProps!="function"||(r||s!==n)&&Bm(e,o,l,n),Ba=!1;var c=e.memoizedState;o.state=c,Qi(e,l,o,i),Hi(),s=e.memoizedState,r||c!==s||Ba?(typeof d=="function"&&(jr(e,a,d,l),s=e.memoizedState),(u=Ba||_m(e,a,u,l,c,s,n))?(p||typeof o.UNSAFE_componentWillMount!="function"&&typeof o.componentWillMount!="function"||(typeof o.componentWillMount=="function"&&o.componentWillMount(),typeof o.UNSAFE_componentWillMount=="function"&&o.UNSAFE_componentWillMount()),typeof o.componentDidMount=="function"&&(e.flags|=4194308)):(typeof o.componentDidMount=="function"&&(e.flags|=4194308),e.memoizedProps=l,e.memoizedState=s),o.props=l,o.state=s,o.context=n,l=u):(typeof o.componentDidMount=="function"&&(e.flags|=4194308),l=!1)}else{o=e.stateNode,Uu(t,e),n=e.memoizedProps,p=fl(a,n),o.props=p,d=e.pendingProps,c=o.context,s=a.contextType,u=Gl,typeof s=="object"&&s!==null&&(u=Yt(s)),r=a.getDerivedStateFromProps,(s=typeof r=="function"||typeof o.getSnapshotBeforeUpdate=="function")||typeof o.UNSAFE_componentWillReceiveProps!="function"&&typeof o.componentWillReceiveProps!="function"||(n!==d||c!==u)&&Bm(e,o,l,u),Ba=!1,c=e.memoizedState,o.state=c,Qi(e,l,o,i),Hi();var h=e.memoizedState;n!==d||c!==h||Ba||t!==null&&t.dependencies!==null&&hn(t.dependencies)?(typeof r=="function"&&(jr(e,a,r,l),h=e.memoizedState),(p=Ba||_m(e,a,p,l,c,h,u)||t!==null&&t.dependencies!==null&&hn(t.dependencies))?(s||typeof o.UNSAFE_componentWillUpdate!="function"&&typeof o.componentWillUpdate!="function"||(typeof o.componentWillUpdate=="function"&&o.componentWillUpdate(l,h,u),typeof o.UNSAFE_componentWillUpdate=="function"&&o.UNSAFE_componentWillUpdate(l,h,u)),typeof o.componentDidUpdate=="function"&&(e.flags|=4),typeof o.getSnapshotBeforeUpdate=="function"&&(e.flags|=1024)):(typeof o.componentDidUpdate!="function"||n===t.memoizedProps&&c===t.memoizedState||(e.flags|=4),typeof o.getSnapshotBeforeUpdate!="function"||n===t.memoizedProps&&c===t.memoizedState||(e.flags|=1024),e.memoizedProps=l,e.memoizedState=h),o.props=l,o.state=h,o.context=u,l=p):(typeof o.componentDidUpdate!="function"||n===t.memoizedProps&&c===t.memoizedState||(e.flags|=4),typeof o.getSnapshotBeforeUpdate!="function"||n===t.memoizedProps&&c===t.memoizedState||(e.flags|=1024),l=!1)}return o=l,tn(t,e),l=(e.flags&128)!==0,o||l?(o=e.stateNode,a=l&&typeof a.getDerivedStateFromError!="function"?null:o.render(),e.flags|=1,t!==null&&l?(e.child=sl(e,t.child,null,i),e.child=sl(e,null,a,i)):Vt(t,e,a,i),e.memoizedState=o.state,t=e.child):t=ya(t,e,i),t}function Dm(t,e,a,l){return rl(),e.flags|=256,Vt(t,e,a,l),e.child}var kr={dehydrated:null,treeContext:null,retryLane:0,hydrationErrors:null};function Zr(t){return{baseLanes:t,cachePool:a0()}}function Kr(t,e,a){return t=t!==null?t.childLanes&~a:0,e&&(t|=ye),t}function K0(t,e,a){var l=e.pendingProps,i=!1,o=(e.flags&128)!==0,n;if((n=o)||(n=t!==null&&t.memoizedState===null?!1:(vt.current&2)!==0),n&&(i=!0,e.flags&=-129),n=(e.flags&32)!==0,e.flags&=-33,t===null){if(X){if(i?Ca(e):za(e),(t=st)?(t=Qd(t,Ge),t=t!==null&&t.data!=="&"?t:null,t!==null&&(e.memoizedState={dehydrated:t,treeContext:La!==null?{id:Ze,overflow:Ke}:null,retryLane:536870912,hydrationErrors:null},a=Pp(t),a.return=e,e.child=a,Qt=e,st=null)):t=null,t===null)throw Xa(e);return $u(t)?e.lanes=32:e.lanes=536870912,null}var r=l.children;return l=l.fallback,i?(za(e),i=e.mode,r=bn({mode:"hidden",children:r},i),l=ll(l,i,a,null),r.return=e,l.return=e,r.sibling=l,e.child=r,l=e.child,l.memoizedState=Zr(a),l.childLanes=Kr(t,n,a),e.memoizedState=kr,Ri(null,l)):(Ca(e),Yu(e,r))}var u=t.memoizedState;if(u!==null&&(r=u.dehydrated,r!==null)){if(o)e.flags&256?(Ca(e),e.flags&=-257,e=Wr(t,e,a)):e.memoizedState!==null?(za(e),e.child=t.child,e.flags|=128,e=null):(za(e),r=l.fallback,i=e.mode,l=bn({mode:"visible",children:l.children},i),r=ll(r,i,a,null),r.flags|=2,l.return=e,r.return=e,l.sibling=r,e.child=l,sl(e,t.child,null,a),l=e.child,l.memoizedState=Zr(a),l.childLanes=Kr(t,n,a),e.memoizedState=kr,e=Ri(null,l));else if(Ca(e),$u(r)){if(n=r.nextSibling&&r.nextSibling.dataset,n)var s=n.dgst;n=s,l=Error(x(419)),l.stack="",l.digest=n,Ii({value:l,source:null,stack:null}),e=Wr(t,e,a)}else if(Bt||ni(t,e,a,!1),n=(a&t.childLanes)!==0,Bt||n){if(n=lt,n!==null&&(l=Bp(n,a),l!==0&&l!==u.retryLane))throw u.retryLane=l,hl(t,l),me(n,t,l),Hs;Pu(r)||Cn(),e=Wr(t,e,a)}else Pu(r)?(e.flags|=192,e.child=t.child,e=null):(t=u.treeContext,st=He(r.nextSibling),Qt=e,X=!0,Na=null,Ge=!1,t!==null&&t0(e,t),e=Yu(e,l.children),e.flags|=4096);return e}return i?(za(e),r=l.fallback,i=e.mode,u=t.child,s=u.sibling,l=ma(u,{mode:"hidden",children:l.children}),l.subtreeFlags=u.subtreeFlags&65011712,s!==null?r=ma(s,r):(r=ll(r,i,a,null),r.flags|=2),r.return=e,l.return=e,l.sibling=r,e.child=l,Ri(null,l),l=e.child,r=t.child.memoizedState,r===null?r=Zr(a):(i=r.cachePool,i!==null?(u=_t._currentValue,i=i.parent!==u?{parent:u,pool:u}:i):i=a0(),r={baseLanes:r.baseLanes|a,cachePool:i}),l.memoizedState=r,l.childLanes=Kr(t,n,a),e.memoizedState=kr,Ri(t.child,l)):(Ca(e),a=t.child,t=a.sibling,a=ma(a,{mode:"visible",children:l.children}),a.return=e,a.sibling=null,t!==null&&(n=e.deletions,n===null?(e.deletions=[t],e.flags|=16):n.push(t)),e.child=a,e.memoizedState=null,a)}function Yu(t,e){return e=bn({mode:"visible",children:e},t.mode),e.return=t,t.child=e}function bn(t,e){return t=ve(22,t,null,e),t.lanes=0,t}function Wr(t,e,a){return sl(e,t.child,null,a),t=Yu(e,e.pendingProps.children),t.flags|=2,e.memoizedState=null,t}function Om(t,e,a){t.lanes|=e;var l=t.alternate;l!==null&&(l.lanes|=e),zu(t.return,e,a)}function Jr(t,e,a,l,i,o){var n=t.memoizedState;n===null?t.memoizedState={isBackwards:e,rendering:null,renderingStartTime:0,last:l,tail:a,tailMode:i,treeForkCount:o}:(n.isBackwards=e,n.rendering=null,n.renderingStartTime=0,n.last=l,n.tail=a,n.tailMode=i,n.treeForkCount=o)}function W0(t,e,a){var l=e.pendingProps,i=l.revealOrder,o=l.tail;l=l.children;var n=vt.current,r=(n&2)!==0;if(r?(n=n&1|2,e.flags|=128):n&=1,ot(vt,n),Vt(t,e,l,a),l=X?Ji:0,!r&&t!==null&&(t.flags&128)!==0)t:for(t=e.child;t!==null;){if(t.tag===13)t.memoizedState!==null&&Om(t,a,e);else if(t.tag===19)Om(t,a,e);else if(t.child!==null){t.child.return=t,t=t.child;continue}if(t===e)break t;for(;t.sibling===null;){if(t.return===null||t.return===e)break t;t=t.return}t.sibling.return=t.return,t=t.sibling}switch(i){case"forwards":for(a=e.child,i=null;a!==null;)t=a.alternate,t!==null&&yn(t)===null&&(i=a),a=a.sibling;a=i,a===null?(i=e.child,e.child=null):(i=a.sibling,a.sibling=null),Jr(e,!1,i,a,o,l);break;case"backwards":case"unstable_legacy-backwards":for(a=null,i=e.child,e.child=null;i!==null;){if(t=i.alternate,t!==null&&yn(t)===null){e.child=i;break}t=i.sibling,i.sibling=a,a=i,i=t}Jr(e,!0,a,null,o,l);break;case"together":Jr(e,!1,null,null,void 0,l);break;default:e.memoizedState=null}return e.child}function ya(t,e,a){if(t!==null&&(e.dependencies=t.dependencies),ka|=e.lanes,(a&e.childLanes)===0)if(t!==null){if(ni(t,e,a,!1),(a&e.childLanes)===0)return null}else return null;if(t!==null&&e.child!==t.child)throw Error(x(153));if(e.child!==null){for(t=e.child,a=ma(t,t.pendingProps),e.child=a,a.return=e;t.sibling!==null;)t=t.sibling,a=a.sibling=ma(t,t.pendingProps),a.return=e;a.sibling=null}return e.child}function Qs(t,e){return(t.lanes&e)!==0?!0:(t=t.dependencies,!!(t!==null&&hn(t)))}function jv(t,e,a){switch(e.tag){case 3:un(e,e.stateNode.containerInfo),Ea(e,_t,t.memoizedState.cache),rl();break;case 27:case 5:du(e);break;case 4:un(e,e.stateNode.containerInfo);break;case 10:Ea(e,e.type,e.memoizedProps.value);break;case 31:if(e.memoizedState!==null)return e.flags|=128,Ou(e),null;break;case 13:var l=e.memoizedState;if(l!==null)return l.dehydrated!==null?(Ca(e),e.flags|=128,null):(a&e.child.childLanes)!==0?K0(t,e,a):(Ca(e),t=ya(t,e,a),t!==null?t.sibling:null);Ca(e);break;case 19:var i=(t.flags&128)!==0;if(l=(a&e.childLanes)!==0,l||(ni(t,e,a,!1),l=(a&e.childLanes)!==0),i){if(l)return W0(t,e,a);e.flags|=128}if(i=e.memoizedState,i!==null&&(i.rendering=null,i.tail=null,i.lastEffect=null),ot(vt,vt.current),l)break;return null;case 22:return e.lanes=0,Z0(t,e,a,e.pendingProps);case 24:Ea(e,_t,t.memoizedState.cache)}return ya(t,e,a)}function J0(t,e,a){if(t!==null)if(t.memoizedProps!==e.pendingProps)Bt=!0;else{if(!Qs(t,a)&&(e.flags&128)===0)return Bt=!1,jv(t,e,a);Bt=(t.flags&131072)!==0}else Bt=!1,X&&(e.flags&1048576)!==0&&$p(e,Ji,e.index);switch(e.lanes=0,e.tag){case 16:t:{var l=e.pendingProps;if(t=tl(e.elementType),e.type=t,typeof t=="function")vs(t)?(l=fl(t,l),e.tag=1,e=Rm(null,e,t,l,a)):(e.tag=0,e=Qu(null,e,t,l,a));else{if(t!=null){var i=t.$$typeof;if(i===ls){e.tag=11,e=Cm(null,e,t,l,a);break t}else if(i===is){e.tag=14,e=zm(null,e,t,l,a);break t}}throw e=mu(t)||t,Error(x(306,e,""))}}return e;case 0:return Qu(t,e,e.type,e.pendingProps,a);case 1:return l=e.type,i=fl(l,e.pendingProps),Rm(t,e,l,i,a);case 3:t:{if(un(e,e.stateNode.containerInfo),t===null)throw Error(x(387));l=e.pendingProps;var o=e.memoizedState;i=o.element,Uu(t,e),Qi(e,l,null,a);var n=e.memoizedState;if(l=n.cache,Ea(e,_t,l),l!==o.cache&&Tu(e,[_t],a,!0),Hi(),l=n.element,o.isDehydrated)if(o={element:l,isDehydrated:!1,cache:n.cache},e.updateQueue.baseState=o,e.memoizedState=o,e.flags&256){e=Dm(t,e,l,a);break t}else if(l!==i){i=Ne(Error(x(424)),e),Ii(i),e=Dm(t,e,l,a);break t}else for(t=e.stateNode.containerInfo,t.nodeType===9?t=t.body:t=t.nodeName==="HTML"?t.ownerDocument.body:t,st=He(t.firstChild),Qt=e,X=!0,Na=null,Ge=!0,a=o0(e,null,l,a),e.child=a;a;)a.flags=a.flags&-3|4096,a=a.sibling;else{if(rl(),l===i){e=ya(t,e,a);break t}Vt(t,e,l,a)}e=e.child}return e;case 26:return tn(t,e),t===null?(a=ep(e.type,null,e.pendingProps,null))?e.memoizedState=a:X||(a=e.type,t=e.pendingProps,l=Un(wa.current).createElement(a),l[Ht]=e,l[pe]=t,Ft(l,a,t),Dt(l),e.stateNode=l):e.memoizedState=ep(e.type,t.memoizedProps,e.pendingProps,t.memoizedState),null;case 27:return du(e),t===null&&X&&(l=e.stateNode=Yd(e.type,e.pendingProps,wa.current),Qt=e,Ge=!0,i=st,Ka(e.type)?(ts=i,st=He(l.firstChild)):st=i),Vt(t,e,e.pendingProps.children,a),tn(t,e),t===null&&(e.flags|=4194304),e.child;case 5:return t===null&&X&&((i=l=st)&&(l=Sy(l,e.type,e.pendingProps,Ge),l!==null?(e.stateNode=l,Qt=e,st=He(l.firstChild),Ge=!1,i=!0):i=!1),i||Xa(e)),du(e),i=e.type,o=e.pendingProps,n=t!==null?t.memoizedProps:null,l=o.children,Ju(i,o)?l=null:n!==null&&Ju(i,n)&&(e.flags|=32),e.memoizedState!==null&&(i=Cs(t,e,Gv,null,null,a),lo._currentValue=i),tn(t,e),Vt(t,e,l,a),e.child;case 6:return t===null&&X&&((t=a=st)&&(a=Ay(a,e.pendingProps,Ge),a!==null?(e.stateNode=a,Qt=e,st=null,t=!0):t=!1),t||Xa(e)),null;case 13:return K0(t,e,a);case 4:return un(e,e.stateNode.containerInfo),l=e.pendingProps,t===null?e.child=sl(e,null,l,a):Vt(t,e,l,a),e.child;case 11:return Cm(t,e,e.type,e.pendingProps,a);case 7:return Vt(t,e,e.pendingProps,a),e.child;case 8:return Vt(t,e,e.pendingProps.children,a),e.child;case 12:return Vt(t,e,e.pendingProps.children,a),e.child;case 10:return l=e.pendingProps,Ea(e,e.type,l.value),Vt(t,e,l.children,a),e.child;case 9:return i=e.type._context,l=e.pendingProps.children,ul(e),i=Yt(i),l=l(i),e.flags|=1,Vt(t,e,l,a),e.child;case 14:return zm(t,e,e.type,e.pendingProps,a);case 15:return k0(t,e,e.type,e.pendingProps,a);case 19:return W0(t,e,a);case 31:return Xv(t,e,a);case 22:return Z0(t,e,a,e.pendingProps);case 24:return ul(e),l=Yt(_t),t===null?(i=xs(),i===null&&(i=lt,o=As(),i.pooledCache=o,o.refCount++,o!==null&&(i.pooledCacheLanes|=a),i=o),e.memoizedState={parent:l,cache:i},_s(e),Ea(e,_t,i)):((t.lanes&a)!==0&&(Uu(t,e),Qi(e,null,null,a),Hi()),i=t.memoizedState,o=e.memoizedState,i.parent!==l?(i={parent:l,cache:l},e.memoizedState=i,e.lanes===0&&(e.memoizedState=e.updateQueue.baseState=i),Ea(e,_t,l)):(l=o.cache,Ea(e,_t,l),l!==i.cache&&Tu(e,[_t],a,!0))),Vt(t,e,e.pendingProps.children,a),e.child;case 29:throw e.pendingProps}throw Error(x(156,e.tag))}function la(t){t.flags|=4}function Ir(t,e,a,l,i){if((e=(t.mode&32)!==0)&&(e=!1),e){if(t.flags|=16777216,(i&335544128)===i)if(t.stateNode.complete)t.flags|=8192;else if(Ad())t.flags|=8192;else throw ol=gn,bs}else t.flags&=-16777217}function wm(t,e){if(e.type!=="stylesheet"||(e.state.loading&4)!==0)t.flags&=-16777217;else if(t.flags|=16777216,!Ld(e))if(Ad())t.flags|=8192;else throw ol=gn,bs}function Ho(t,e){e!==null&&(t.flags|=4),t.flags&16384&&(e=t.tag!==22?xp():536870912,t.lanes|=e,$l|=e)}function Bi(t,e){if(!X)switch(t.tailMode){case"hidden":e=t.tail;for(var a=null;e!==null;)e.alternate!==null&&(a=e),e=e.sibling;a===null?t.tail=null:a.sibling=null;break;case"collapsed":a=t.tail;for(var l=null;a!==null;)a.alternate!==null&&(l=a),a=a.sibling;l===null?e||t.tail===null?t.tail=null:t.tail.sibling=null:l.sibling=null}}function ut(t){var e=t.alternate!==null&&t.alternate.child===t.child,a=0,l=0;if(e)for(var i=t.child;i!==null;)a|=i.lanes|i.childLanes,l|=i.subtreeFlags&65011712,l|=i.flags&65011712,i.return=t,i=i.sibling;else for(i=t.child;i!==null;)a|=i.lanes|i.childLanes,l|=i.subtreeFlags,l|=i.flags,i.return=t,i=i.sibling;return t.subtreeFlags|=l,t.childLanes=a,e}function kv(t,e,a){var l=e.pendingProps;switch(Ss(e),e.tag){case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return ut(e),null;case 1:return ut(e),null;case 3:return a=e.stateNode,l=null,t!==null&&(l=t.memoizedState.cache),e.memoizedState.cache!==l&&(e.flags|=2048),pa(_t),Zl(),a.pendingContext&&(a.context=a.pendingContext,a.pendingContext=null),(t===null||t.child===null)&&(Bl(e)?la(e):t===null||t.memoizedState.isDehydrated&&(e.flags&256)===0||(e.flags|=1024,qr())),ut(e),null;case 26:var i=e.type,o=e.memoizedState;return t===null?(la(e),o!==null?(ut(e),wm(e,o)):(ut(e),Ir(e,i,null,l,a))):o?o!==t.memoizedState?(la(e),ut(e),wm(e,o)):(ut(e),e.flags&=-16777217):(t=t.memoizedProps,t!==l&&la(e),ut(e),Ir(e,i,t,l,a)),null;case 27:if(sn(e),a=wa.current,i=e.type,t!==null&&e.stateNode!=null)t.memoizedProps!==l&&la(e);else{if(!l){if(e.stateNode===null)throw Error(x(166));return ut(e),null}t=Je.current,Bl(e)?sm(e,t):(t=Yd(i,l,a),e.stateNode=t,la(e))}return ut(e),null;case 5:if(sn(e),i=e.type,t!==null&&e.stateNode!=null)t.memoizedProps!==l&&la(e);else{if(!l){if(e.stateNode===null)throw Error(x(166));return ut(e),null}if(o=Je.current,Bl(e))sm(e,o);else{var n=Un(wa.current);switch(o){case 1:o=n.createElementNS("http://www.w3.org/2000/svg",i);break;case 2:o=n.createElementNS("http://www.w3.org/1998/Math/MathML",i);break;default:switch(i){case"svg":o=n.createElementNS("http://www.w3.org/2000/svg",i);break;case"math":o=n.createElementNS("http://www.w3.org/1998/Math/MathML",i);break;case"script":o=n.createElement("div"),o.innerHTML="<script><\/script>",o=o.removeChild(o.firstChild);break;case"select":o=typeof l.is=="string"?n.createElement("select",{is:l.is}):n.createElement("select"),l.multiple?o.multiple=!0:l.size&&(o.size=l.size);break;default:o=typeof l.is=="string"?n.createElement(i,{is:l.is}):n.createElement(i)}}o[Ht]=e,o[pe]=l;t:for(n=e.child;n!==null;){if(n.tag===5||n.tag===6)o.appendChild(n.stateNode);else if(n.tag!==4&&n.tag!==27&&n.child!==null){n.child.return=n,n=n.child;continue}if(n===e)break t;for(;n.sibling===null;){if(n.return===null||n.return===e)break t;n=n.return}n.sibling.return=n.return,n=n.sibling}e.stateNode=o;t:switch(Ft(o,i,l),i){case"button":case"input":case"select":case"textarea":l=!!l.autoFocus;break t;case"img":l=!0;break t;default:l=!1}l&&la(e)}}return ut(e),Ir(e,e.type,t===null?null:t.memoizedProps,e.pendingProps,a),null;case 6:if(t&&e.stateNode!=null)t.memoizedProps!==l&&la(e);else{if(typeof l!="string"&&e.stateNode===null)throw Error(x(166));if(t=wa.current,Bl(e)){if(t=e.stateNode,a=e.memoizedProps,l=null,i=Qt,i!==null)switch(i.tag){case 27:case 5:l=i.memoizedProps}t[Ht]=e,t=!!(t.nodeValue===a||l!==null&&l.suppressHydrationWarning===!0||Gd(t.nodeValue,a)),t||Xa(e,!0)}else t=Un(t).createTextNode(l),t[Ht]=e,e.stateNode=t}return ut(e),null;case 31:if(a=e.memoizedState,t===null||t.memoizedState!==null){if(l=Bl(e),a!==null){if(t===null){if(!l)throw Error(x(318));if(t=e.memoizedState,t=t!==null?t.dehydrated:null,!t)throw Error(x(557));t[Ht]=e}else rl(),(e.flags&128)===0&&(e.memoizedState=null),e.flags|=4;ut(e),t=!1}else a=qr(),t!==null&&t.memoizedState!==null&&(t.memoizedState.hydrationErrors=a),t=!0;if(!t)return e.flags&256?(ge(e),e):(ge(e),null);if((e.flags&128)!==0)throw Error(x(558))}return ut(e),null;case 13:if(l=e.memoizedState,t===null||t.memoizedState!==null&&t.memoizedState.dehydrated!==null){if(i=Bl(e),l!==null&&l.dehydrated!==null){if(t===null){if(!i)throw Error(x(318));if(i=e.memoizedState,i=i!==null?i.dehydrated:null,!i)throw Error(x(317));i[Ht]=e}else rl(),(e.flags&128)===0&&(e.memoizedState=null),e.flags|=4;ut(e),i=!1}else i=qr(),t!==null&&t.memoizedState!==null&&(t.memoizedState.hydrationErrors=i),i=!0;if(!i)return e.flags&256?(ge(e),e):(ge(e),null)}return ge(e),(e.flags&128)!==0?(e.lanes=a,e):(a=l!==null,t=t!==null&&t.memoizedState!==null,a&&(l=e.child,i=null,l.alternate!==null&&l.alternate.memoizedState!==null&&l.alternate.memoizedState.cachePool!==null&&(i=l.alternate.memoizedState.cachePool.pool),o=null,l.memoizedState!==null&&l.memoizedState.cachePool!==null&&(o=l.memoizedState.cachePool.pool),o!==i&&(l.flags|=2048)),a!==t&&a&&(e.child.flags|=8192),Ho(e,e.updateQueue),ut(e),null);case 4:return Zl(),t===null&&ks(e.stateNode.containerInfo),ut(e),null;case 10:return pa(e.type),ut(e),null;case 19:if(Ot(vt),l=e.memoizedState,l===null)return ut(e),null;if(i=(e.flags&128)!==0,o=l.rendering,o===null)if(i)Bi(l,!1);else{if(ht!==0||t!==null&&(t.flags&128)!==0)for(t=e.child;t!==null;){if(o=yn(t),o!==null){for(e.flags|=128,Bi(l,!1),t=o.updateQueue,e.updateQueue=t,Ho(e,t),e.subtreeFlags=0,t=a,a=e.child;a!==null;)Ip(a,t),a=a.sibling;return ot(vt,vt.current&1|2),X&&ra(e,l.treeForkCount),e.child}t=t.sibling}l.tail!==null&&Se()>Bn&&(e.flags|=128,i=!0,Bi(l,!1),e.lanes=4194304)}else{if(!i)if(t=yn(o),t!==null){if(e.flags|=128,i=!0,t=t.updateQueue,e.updateQueue=t,Ho(e,t),Bi(l,!0),l.tail===null&&l.tailMode==="hidden"&&!o.alternate&&!X)return ut(e),null}else 2*Se()-l.renderingStartTime>Bn&&a!==536870912&&(e.flags|=128,i=!0,Bi(l,!1),e.lanes=4194304);l.isBackwards?(o.sibling=e.child,e.child=o):(t=l.last,t!==null?t.sibling=o:e.child=o,l.last=o)}return l.tail!==null?(t=l.tail,l.rendering=t,l.tail=t.sibling,l.renderingStartTime=Se(),t.sibling=null,a=vt.current,ot(vt,i?a&1|2:a&1),X&&ra(e,l.treeForkCount),t):(ut(e),null);case 22:case 23:return ge(e),Bs(),l=e.memoizedState!==null,t!==null?t.memoizedState!==null!==l&&(e.flags|=8192):l&&(e.flags|=8192),l?(a&536870912)!==0&&(e.flags&128)===0&&(ut(e),e.subtreeFlags&6&&(e.flags|=8192)):ut(e),a=e.updateQueue,a!==null&&Ho(e,a.retryQueue),a=null,t!==null&&t.memoizedState!==null&&t.memoizedState.cachePool!==null&&(a=t.memoizedState.cachePool.pool),l=null,e.memoizedState!==null&&e.memoizedState.cachePool!==null&&(l=e.memoizedState.cachePool.pool),l!==a&&(e.flags|=2048),t!==null&&Ot(il),null;case 24:return a=null,t!==null&&(a=t.memoizedState.cache),e.memoizedState.cache!==a&&(e.flags|=2048),pa(_t),ut(e),null;case 25:return null;case 30:return null}throw Error(x(156,e.tag))}function Zv(t,e){switch(Ss(e),e.tag){case 1:return t=e.flags,t&65536?(e.flags=t&-65537|128,e):null;case 3:return pa(_t),Zl(),t=e.flags,(t&65536)!==0&&(t&128)===0?(e.flags=t&-65537|128,e):null;case 26:case 27:case 5:return sn(e),null;case 31:if(e.memoizedState!==null){if(ge(e),e.alternate===null)throw Error(x(340));rl()}return t=e.flags,t&65536?(e.flags=t&-65537|128,e):null;case 13:if(ge(e),t=e.memoizedState,t!==null&&t.dehydrated!==null){if(e.alternate===null)throw Error(x(340));rl()}return t=e.flags,t&65536?(e.flags=t&-65537|128,e):null;case 19:return Ot(vt),null;case 4:return Zl(),null;case 10:return pa(e.type),null;case 22:case 23:return ge(e),Bs(),t!==null&&Ot(il),t=e.flags,t&65536?(e.flags=t&-65537|128,e):null;case 24:return pa(_t),null;case 25:return null;default:return null}}function I0(t,e){switch(Ss(e),e.tag){case 3:pa(_t),Zl();break;case 26:case 27:case 5:sn(e);break;case 4:Zl();break;case 31:e.memoizedState!==null&&ge(e);break;case 13:ge(e);break;case 19:Ot(vt);break;case 10:pa(e.type);break;case 22:case 23:ge(e),Bs(),t!==null&&Ot(il);break;case 24:pa(_t)}}function ho(t,e){try{var a=e.updateQueue,l=a!==null?a.lastEffect:null;if(l!==null){var i=l.next;a=i;do{if((a.tag&t)===t){l=void 0;var o=a.create,n=a.inst;l=o(),n.destroy=l}a=a.next}while(a!==i)}}catch(r){J(e,e.return,r)}}function ja(t,e,a){try{var l=e.updateQueue,i=l!==null?l.lastEffect:null;if(i!==null){var o=i.next;l=o;do{if((l.tag&t)===t){var n=l.inst,r=n.destroy;if(r!==void 0){n.destroy=void 0,i=e;var u=a,s=r;try{s()}catch(p){J(i,u,p)}}}l=l.next}while(l!==o)}}catch(p){J(e,e.return,p)}}function P0(t){var e=t.updateQueue;if(e!==null){var a=t.stateNode;try{r0(e,a)}catch(l){J(t,t.return,l)}}}function $0(t,e,a){a.props=fl(t.type,t.memoizedProps),a.state=t.memoizedState;try{a.componentWillUnmount()}catch(l){J(t,e,l)}}function Fi(t,e){try{var a=t.ref;if(a!==null){switch(t.tag){case 26:case 27:case 5:var l=t.stateNode;break;case 30:l=t.stateNode;break;default:l=t.stateNode}typeof a=="function"?t.refCleanup=a(l):a.current=l}}catch(i){J(t,e,i)}}function We(t,e){var a=t.ref,l=t.refCleanup;if(a!==null)if(typeof l=="function")try{l()}catch(i){J(t,e,i)}finally{t.refCleanup=null,t=t.alternate,t!=null&&(t.refCleanup=null)}else if(typeof a=="function")try{a(null)}catch(i){J(t,e,i)}else a.current=null}function td(t){var e=t.type,a=t.memoizedProps,l=t.stateNode;try{t:switch(e){case"button":case"input":case"select":case"textarea":a.autoFocus&&l.focus();break t;case"img":a.src?l.src=a.src:a.srcSet&&(l.srcset=a.srcSet)}}catch(i){J(t,t.return,i)}}function Pr(t,e,a){try{var l=t.stateNode;py(l,t.type,a,e),l[pe]=e}catch(i){J(t,t.return,i)}}function ed(t){return t.tag===5||t.tag===3||t.tag===26||t.tag===27&&Ka(t.type)||t.tag===4}function $r(t){t:for(;;){for(;t.sibling===null;){if(t.return===null||ed(t.return))return null;t=t.return}for(t.sibling.return=t.return,t=t.sibling;t.tag!==5&&t.tag!==6&&t.tag!==18;){if(t.tag===27&&Ka(t.type)||t.flags&2||t.child===null||t.tag===4)continue t;t.child.return=t,t=t.child}if(!(t.flags&2))return t.stateNode}}function Fu(t,e,a){var l=t.tag;if(l===5||l===6)t=t.stateNode,e?(a.nodeType===9?a.body:a.nodeName==="HTML"?a.ownerDocument.body:a).insertBefore(t,e):(e=a.nodeType===9?a.body:a.nodeName==="HTML"?a.ownerDocument.body:a,e.appendChild(t),a=a._reactRootContainer,a!=null||e.onclick!==null||(e.onclick=ca));else if(l!==4&&(l===27&&Ka(t.type)&&(a=t.stateNode,e=null),t=t.child,t!==null))for(Fu(t,e,a),t=t.sibling;t!==null;)Fu(t,e,a),t=t.sibling}function _n(t,e,a){var l=t.tag;if(l===5||l===6)t=t.stateNode,e?a.insertBefore(t,e):a.appendChild(t);else if(l!==4&&(l===27&&Ka(t.type)&&(a=t.stateNode),t=t.child,t!==null))for(_n(t,e,a),t=t.sibling;t!==null;)_n(t,e,a),t=t.sibling}function ad(t){var e=t.stateNode,a=t.memoizedProps;try{for(var l=t.type,i=e.attributes;i.length;)e.removeAttributeNode(i[0]);Ft(e,l,a),e[Ht]=t,e[pe]=a}catch(o){J(t,t.return,o)}}var ua=!1,bt=!1,tu=!1,Nm=typeof WeakSet=="function"?WeakSet:Set,Rt=null;function Kv(t,e){if(t=t.containerInfo,Ku=wn,t=Lp(t),ds(t)){if("selectionStart"in t)var a={start:t.selectionStart,end:t.selectionEnd};else t:{a=(a=t.ownerDocument)&&a.defaultView||window;var l=a.getSelection&&a.getSelection();if(l&&l.rangeCount!==0){a=l.anchorNode;var i=l.anchorOffset,o=l.focusNode;l=l.focusOffset;try{a.nodeType,o.nodeType}catch{a=null;break t}var n=0,r=-1,u=-1,s=0,p=0,d=t,c=null;e:for(;;){for(var h;d!==a||i!==0&&d.nodeType!==3||(r=n+i),d!==o||l!==0&&d.nodeType!==3||(u=n+l),d.nodeType===3&&(n+=d.nodeValue.length),(h=d.firstChild)!==null;)c=d,d=h;for(;;){if(d===t)break e;if(c===a&&++s===i&&(r=n),c===o&&++p===l&&(u=n),(h=d.nextSibling)!==null)break;d=c,c=d.parentNode}d=h}a=r===-1||u===-1?null:{start:r,end:u}}else a=null}a=a||{start:0,end:0}}else a=null;for(Wu={focusedElem:t,selectionRange:a},wn=!1,Rt=e;Rt!==null;)if(e=Rt,t=e.child,(e.subtreeFlags&1028)!==0&&t!==null)t.return=e,Rt=t;else for(;Rt!==null;){switch(e=Rt,o=e.alternate,t=e.flags,e.tag){case 0:if((t&4)!==0&&(t=e.updateQueue,t=t!==null?t.events:null,t!==null))for(a=0;a<t.length;a++)i=t[a],i.ref.impl=i.nextImpl;break;case 11:case 15:break;case 1:if((t&1024)!==0&&o!==null){t=void 0,a=e,i=o.memoizedProps,o=o.memoizedState,l=a.stateNode;try{var y=fl(a.type,i);t=l.getSnapshotBeforeUpdate(y,o),l.__reactInternalSnapshotBeforeUpdate=t}catch(S){J(a,a.return,S)}}break;case 3:if((t&1024)!==0){if(t=e.stateNode.containerInfo,a=t.nodeType,a===9)Iu(t);else if(a===1)switch(t.nodeName){case"HEAD":case"HTML":case"BODY":Iu(t);break;default:t.textContent=""}}break;case 5:case 26:case 27:case 6:case 4:case 17:break;default:if((t&1024)!==0)throw Error(x(163))}if(t=e.sibling,t!==null){t.return=e.return,Rt=t;break}Rt=e.return}}function ld(t,e,a){var l=a.flags;switch(a.tag){case 0:case 11:case 15:oa(t,a),l&4&&ho(5,a);break;case 1:if(oa(t,a),l&4)if(t=a.stateNode,e===null)try{t.componentDidMount()}catch(n){J(a,a.return,n)}else{var i=fl(a.type,e.memoizedProps);e=e.memoizedState;try{t.componentDidUpdate(i,e,t.__reactInternalSnapshotBeforeUpdate)}catch(n){J(a,a.return,n)}}l&64&&P0(a),l&512&&Fi(a,a.return);break;case 3:if(oa(t,a),l&64&&(t=a.updateQueue,t!==null)){if(e=null,a.child!==null)switch(a.child.tag){case 27:case 5:e=a.child.stateNode;break;case 1:e=a.child.stateNode}try{r0(t,e)}catch(n){J(a,a.return,n)}}break;case 27:e===null&&l&4&&ad(a);case 26:case 5:oa(t,a),e===null&&l&4&&td(a),l&512&&Fi(a,a.return);break;case 12:oa(t,a);break;case 31:oa(t,a),l&4&&nd(t,a);break;case 13:oa(t,a),l&4&&rd(t,a),l&64&&(t=a.memoizedState,t!==null&&(t=t.dehydrated,t!==null&&(a=ly.bind(null,a),xy(t,a))));break;case 22:if(l=a.memoizedState!==null||ua,!l){e=e!==null&&e.memoizedState!==null||bt,i=ua;var o=bt;ua=l,(bt=e)&&!o?na(t,a,(a.subtreeFlags&8772)!==0):oa(t,a),ua=i,bt=o}break;case 30:break;default:oa(t,a)}}function id(t){var e=t.alternate;e!==null&&(t.alternate=null,id(e)),t.child=null,t.deletions=null,t.sibling=null,t.tag===5&&(e=t.stateNode,e!==null&&us(e)),t.stateNode=null,t.return=null,t.dependencies=null,t.memoizedProps=null,t.memoizedState=null,t.pendingProps=null,t.stateNode=null,t.updateQueue=null}var mt=null,ce=!1;function ia(t,e,a){for(a=a.child;a!==null;)od(t,e,a),a=a.sibling}function od(t,e,a){if(Ae&&typeof Ae.onCommitFiberUnmount=="function")try{Ae.onCommitFiberUnmount(ro,a)}catch{}switch(a.tag){case 26:bt||We(a,e),ia(t,e,a),a.memoizedState?a.memoizedState.count--:a.stateNode&&(a=a.stateNode,a.parentNode.removeChild(a));break;case 27:bt||We(a,e);var l=mt,i=ce;Ka(a.type)&&(mt=a.stateNode,ce=!1),ia(t,e,a),ji(a.stateNode),mt=l,ce=i;break;case 5:bt||We(a,e);case 6:if(l=mt,i=ce,mt=null,ia(t,e,a),mt=l,ce=i,mt!==null)if(ce)try{(mt.nodeType===9?mt.body:mt.nodeName==="HTML"?mt.ownerDocument.body:mt).removeChild(a.stateNode)}catch(o){J(a,e,o)}else try{mt.removeChild(a.stateNode)}catch(o){J(a,e,o)}break;case 18:mt!==null&&(ce?(t=mt,Jm(t.nodeType===9?t.body:t.nodeName==="HTML"?t.ownerDocument.body:t,a.stateNode),li(t)):Jm(mt,a.stateNode));break;case 4:l=mt,i=ce,mt=a.stateNode.containerInfo,ce=!0,ia(t,e,a),mt=l,ce=i;break;case 0:case 11:case 14:case 15:ja(2,a,e),bt||ja(4,a,e),ia(t,e,a);break;case 1:bt||(We(a,e),l=a.stateNode,typeof l.componentWillUnmount=="function"&&$0(a,e,l)),ia(t,e,a);break;case 21:ia(t,e,a);break;case 22:bt=(l=bt)||a.memoizedState!==null,ia(t,e,a),bt=l;break;default:ia(t,e,a)}}function nd(t,e){if(e.memoizedState===null&&(t=e.alternate,t!==null&&(t=t.memoizedState,t!==null))){t=t.dehydrated;try{li(t)}catch(a){J(e,e.return,a)}}}function rd(t,e){if(e.memoizedState===null&&(t=e.alternate,t!==null&&(t=t.memoizedState,t!==null&&(t=t.dehydrated,t!==null))))try{li(t)}catch(a){J(e,e.return,a)}}function Wv(t){switch(t.tag){case 31:case 13:case 19:var e=t.stateNode;return e===null&&(e=t.stateNode=new Nm),e;case 22:return t=t.stateNode,e=t._retryCache,e===null&&(e=t._retryCache=new Nm),e;default:throw Error(x(435,t.tag))}}function Qo(t,e){var a=Wv(t);e.forEach(function(l){if(!a.has(l)){a.add(l);var i=iy.bind(null,t,l);l.then(i,i)}})}function ue(t,e){var a=e.deletions;if(a!==null)for(var l=0;l<a.length;l++){var i=a[l],o=t,n=e,r=n;t:for(;r!==null;){switch(r.tag){case 27:if(Ka(r.type)){mt=r.stateNode,ce=!1;break t}break;case 5:mt=r.stateNode,ce=!1;break t;case 3:case 4:mt=r.stateNode.containerInfo,ce=!0;break t}r=r.return}if(mt===null)throw Error(x(160));od(o,n,i),mt=null,ce=!1,o=i.alternate,o!==null&&(o.return=null),i.return=null}if(e.subtreeFlags&13886)for(e=e.child;e!==null;)ud(e,t),e=e.sibling}var qe=null;function ud(t,e){var a=t.alternate,l=t.flags;switch(t.tag){case 0:case 11:case 14:case 15:ue(e,t),se(t),l&4&&(ja(3,t,t.return),ho(3,t),ja(5,t,t.return));break;case 1:ue(e,t),se(t),l&512&&(bt||a===null||We(a,a.return)),l&64&&ua&&(t=t.updateQueue,t!==null&&(l=t.callbacks,l!==null&&(a=t.shared.hiddenCallbacks,t.shared.hiddenCallbacks=a===null?l:a.concat(l))));break;case 26:var i=qe;if(ue(e,t),se(t),l&512&&(bt||a===null||We(a,a.return)),l&4){var o=a!==null?a.memoizedState:null;if(l=t.memoizedState,a===null)if(l===null)if(t.stateNode===null){t:{l=t.type,a=t.memoizedProps,i=i.ownerDocument||i;e:switch(l){case"title":o=i.getElementsByTagName("title")[0],(!o||o[co]||o[Ht]||o.namespaceURI==="http://www.w3.org/2000/svg"||o.hasAttribute("itemprop"))&&(o=i.createElement(l),i.head.insertBefore(o,i.querySelector("head > title"))),Ft(o,l,a),o[Ht]=t,Dt(o),l=o;break t;case"link":var n=lp("link","href",i).get(l+(a.href||""));if(n){for(var r=0;r<n.length;r++)if(o=n[r],o.getAttribute("href")===(a.href==null||a.href===""?null:a.href)&&o.getAttribute("rel")===(a.rel==null?null:a.rel)&&o.getAttribute("title")===(a.title==null?null:a.title)&&o.getAttribute("crossorigin")===(a.crossOrigin==null?null:a.crossOrigin)){n.splice(r,1);break e}}o=i.createElement(l),Ft(o,l,a),i.head.appendChild(o);break;case"meta":if(n=lp("meta","content",i).get(l+(a.content||""))){for(r=0;r<n.length;r++)if(o=n[r],o.getAttribute("content")===(a.content==null?null:""+a.content)&&o.getAttribute("name")===(a.name==null?null:a.name)&&o.getAttribute("property")===(a.property==null?null:a.property)&&o.getAttribute("http-equiv")===(a.httpEquiv==null?null:a.httpEquiv)&&o.getAttribute("charset")===(a.charSet==null?null:a.charSet)){n.splice(r,1);break e}}o=i.createElement(l),Ft(o,l,a),i.head.appendChild(o);break;default:throw Error(x(468,l))}o[Ht]=t,Dt(o),l=o}t.stateNode=l}else ip(i,t.type,t.stateNode);else t.stateNode=ap(i,l,t.memoizedProps);else o!==l?(o===null?a.stateNode!==null&&(a=a.stateNode,a.parentNode.removeChild(a)):o.count--,l===null?ip(i,t.type,t.stateNode):ap(i,l,t.memoizedProps)):l===null&&t.stateNode!==null&&Pr(t,t.memoizedProps,a.memoizedProps)}break;case 27:ue(e,t),se(t),l&512&&(bt||a===null||We(a,a.return)),a!==null&&l&4&&Pr(t,t.memoizedProps,a.memoizedProps);break;case 5:if(ue(e,t),se(t),l&512&&(bt||a===null||We(a,a.return)),t.flags&32){i=t.stateNode;try{Wl(i,"")}catch(y){J(t,t.return,y)}}l&4&&t.stateNode!=null&&(i=t.memoizedProps,Pr(t,i,a!==null?a.memoizedProps:i)),l&1024&&(tu=!0);break;case 6:if(ue(e,t),se(t),l&4){if(t.stateNode===null)throw Error(x(162));l=t.memoizedProps,a=t.stateNode;try{a.nodeValue=l}catch(y){J(t,t.return,y)}}break;case 3:if(ln=null,i=qe,qe=Rn(e.containerInfo),ue(e,t),qe=i,se(t),l&4&&a!==null&&a.memoizedState.isDehydrated)try{li(e.containerInfo)}catch(y){J(t,t.return,y)}tu&&(tu=!1,sd(t));break;case 4:l=qe,qe=Rn(t.stateNode.containerInfo),ue(e,t),se(t),qe=l;break;case 12:ue(e,t),se(t);break;case 31:ue(e,t),se(t),l&4&&(l=t.updateQueue,l!==null&&(t.updateQueue=null,Qo(t,l)));break;case 13:ue(e,t),se(t),t.child.flags&8192&&t.memoizedState!==null!=(a!==null&&a.memoizedState!==null)&&(Zn=Se()),l&4&&(l=t.updateQueue,l!==null&&(t.updateQueue=null,Qo(t,l)));break;case 22:i=t.memoizedState!==null;var u=a!==null&&a.memoizedState!==null,s=ua,p=bt;if(ua=s||i,bt=p||u,ue(e,t),bt=p,ua=s,se(t),l&8192)t:for(e=t.stateNode,e._visibility=i?e._visibility&-2:e._visibility|1,i&&(a===null||u||ua||bt||el(t)),a=null,e=t;;){if(e.tag===5||e.tag===26){if(a===null){u=a=e;try{if(o=u.stateNode,i)n=o.style,typeof n.setProperty=="function"?n.setProperty("display","none","important"):n.display="none";else{r=u.stateNode;var d=u.memoizedProps.style,c=d!=null&&d.hasOwnProperty("display")?d.display:null;r.style.display=c==null||typeof c=="boolean"?"":(""+c).trim()}}catch(y){J(u,u.return,y)}}}else if(e.tag===6){if(a===null){u=e;try{u.stateNode.nodeValue=i?"":u.memoizedProps}catch(y){J(u,u.return,y)}}}else if(e.tag===18){if(a===null){u=e;try{var h=u.stateNode;i?Im(h,!0):Im(u.stateNode,!1)}catch(y){J(u,u.return,y)}}}else if((e.tag!==22&&e.tag!==23||e.memoizedState===null||e===t)&&e.child!==null){e.child.return=e,e=e.child;continue}if(e===t)break t;for(;e.sibling===null;){if(e.return===null||e.return===t)break t;a===e&&(a=null),e=e.return}a===e&&(a=null),e.sibling.return=e.return,e=e.sibling}l&4&&(l=t.updateQueue,l!==null&&(a=l.retryQueue,a!==null&&(l.retryQueue=null,Qo(t,a))));break;case 19:ue(e,t),se(t),l&4&&(l=t.updateQueue,l!==null&&(t.updateQueue=null,Qo(t,l)));break;case 30:break;case 21:break;default:ue(e,t),se(t)}}function se(t){var e=t.flags;if(e&2){try{for(var a,l=t.return;l!==null;){if(ed(l)){a=l;break}l=l.return}if(a==null)throw Error(x(160));switch(a.tag){case 27:var i=a.stateNode,o=$r(t);_n(t,o,i);break;case 5:var n=a.stateNode;a.flags&32&&(Wl(n,""),a.flags&=-33);var r=$r(t);_n(t,r,n);break;case 3:case 4:var u=a.stateNode.containerInfo,s=$r(t);Fu(t,s,u);break;default:throw Error(x(161))}}catch(p){J(t,t.return,p)}t.flags&=-3}e&4096&&(t.flags&=-4097)}function sd(t){if(t.subtreeFlags&1024)for(t=t.child;t!==null;){var e=t;sd(e),e.tag===5&&e.flags&1024&&e.stateNode.reset(),t=t.sibling}}function oa(t,e){if(e.subtreeFlags&8772)for(e=e.child;e!==null;)ld(t,e.alternate,e),e=e.sibling}function el(t){for(t=t.child;t!==null;){var e=t;switch(e.tag){case 0:case 11:case 14:case 15:ja(4,e,e.return),el(e);break;case 1:We(e,e.return);var a=e.stateNode;typeof a.componentWillUnmount=="function"&&$0(e,e.return,a),el(e);break;case 27:ji(e.stateNode);case 26:case 5:We(e,e.return),el(e);break;case 22:e.memoizedState===null&&el(e);break;case 30:el(e);break;default:el(e)}t=t.sibling}}function na(t,e,a){for(a=a&&(e.subtreeFlags&8772)!==0,e=e.child;e!==null;){var l=e.alternate,i=t,o=e,n=o.flags;switch(o.tag){case 0:case 11:case 15:na(i,o,a),ho(4,o);break;case 1:if(na(i,o,a),l=o,i=l.stateNode,typeof i.componentDidMount=="function")try{i.componentDidMount()}catch(s){J(l,l.return,s)}if(l=o,i=l.updateQueue,i!==null){var r=l.stateNode;try{var u=i.shared.hiddenCallbacks;if(u!==null)for(i.shared.hiddenCallbacks=null,i=0;i<u.length;i++)n0(u[i],r)}catch(s){J(l,l.return,s)}}a&&n&64&&P0(o),Fi(o,o.return);break;case 27:ad(o);case 26:case 5:na(i,o,a),a&&l===null&&n&4&&td(o),Fi(o,o.return);break;case 12:na(i,o,a);break;case 31:na(i,o,a),a&&n&4&&nd(i,o);break;case 13:na(i,o,a),a&&n&4&&rd(i,o);break;case 22:o.memoizedState===null&&na(i,o,a),Fi(o,o.return);break;case 30:break;default:na(i,o,a)}e=e.sibling}}function Ys(t,e){var a=null;t!==null&&t.memoizedState!==null&&t.memoizedState.cachePool!==null&&(a=t.memoizedState.cachePool.pool),t=null,e.memoizedState!==null&&e.memoizedState.cachePool!==null&&(t=e.memoizedState.cachePool.pool),t!==a&&(t!=null&&t.refCount++,a!=null&&mo(a))}function Fs(t,e){t=null,e.alternate!==null&&(t=e.alternate.memoizedState.cache),e=e.memoizedState.cache,e!==t&&(e.refCount++,t!=null&&mo(t))}function Fe(t,e,a,l){if(e.subtreeFlags&10256)for(e=e.child;e!==null;)cd(t,e,a,l),e=e.sibling}function cd(t,e,a,l){var i=e.flags;switch(e.tag){case 0:case 11:case 15:Fe(t,e,a,l),i&2048&&ho(9,e);break;case 1:Fe(t,e,a,l);break;case 3:Fe(t,e,a,l),i&2048&&(t=null,e.alternate!==null&&(t=e.alternate.memoizedState.cache),e=e.memoizedState.cache,e!==t&&(e.refCount++,t!=null&&mo(t)));break;case 12:if(i&2048){Fe(t,e,a,l),t=e.stateNode;try{var o=e.memoizedProps,n=o.id,r=o.onPostCommit;typeof r=="function"&&r(n,e.alternate===null?"mount":"update",t.passiveEffectDuration,-0)}catch(u){J(e,e.return,u)}}else Fe(t,e,a,l);break;case 31:Fe(t,e,a,l);break;case 13:Fe(t,e,a,l);break;case 23:break;case 22:o=e.stateNode,n=e.alternate,e.memoizedState!==null?o._visibility&2?Fe(t,e,a,l):qi(t,e):o._visibility&2?Fe(t,e,a,l):(o._visibility|=2,Cl(t,e,a,l,(e.subtreeFlags&10256)!==0||!1)),i&2048&&Ys(n,e);break;case 24:Fe(t,e,a,l),i&2048&&Fs(e.alternate,e);break;default:Fe(t,e,a,l)}}function Cl(t,e,a,l,i){for(i=i&&((e.subtreeFlags&10256)!==0||!1),e=e.child;e!==null;){var o=t,n=e,r=a,u=l,s=n.flags;switch(n.tag){case 0:case 11:case 15:Cl(o,n,r,u,i),ho(8,n);break;case 23:break;case 22:var p=n.stateNode;n.memoizedState!==null?p._visibility&2?Cl(o,n,r,u,i):qi(o,n):(p._visibility|=2,Cl(o,n,r,u,i)),i&&s&2048&&Ys(n.alternate,n);break;case 24:Cl(o,n,r,u,i),i&&s&2048&&Fs(n.alternate,n);break;default:Cl(o,n,r,u,i)}e=e.sibling}}function qi(t,e){if(e.subtreeFlags&10256)for(e=e.child;e!==null;){var a=t,l=e,i=l.flags;switch(l.tag){case 22:qi(a,l),i&2048&&Ys(l.alternate,l);break;case 24:qi(a,l),i&2048&&Fs(l.alternate,l);break;default:qi(a,l)}e=e.sibling}}var Di=8192;function El(t,e,a){if(t.subtreeFlags&Di)for(t=t.child;t!==null;)fd(t,e,a),t=t.sibling}function fd(t,e,a){switch(t.tag){case 26:El(t,e,a),t.flags&Di&&t.memoizedState!==null&&Oy(a,qe,t.memoizedState,t.memoizedProps);break;case 5:El(t,e,a);break;case 3:case 4:var l=qe;qe=Rn(t.stateNode.containerInfo),El(t,e,a),qe=l;break;case 22:t.memoizedState===null&&(l=t.alternate,l!==null&&l.memoizedState!==null?(l=Di,Di=16777216,El(t,e,a),Di=l):El(t,e,a));break;default:El(t,e,a)}}function md(t){var e=t.alternate;if(e!==null&&(t=e.child,t!==null)){e.child=null;do e=t.sibling,t.sibling=null,t=e;while(t!==null)}}function Ei(t){var e=t.deletions;if((t.flags&16)!==0){if(e!==null)for(var a=0;a<e.length;a++){var l=e[a];Rt=l,dd(l,t)}md(t)}if(t.subtreeFlags&10256)for(t=t.child;t!==null;)pd(t),t=t.sibling}function pd(t){switch(t.tag){case 0:case 11:case 15:Ei(t),t.flags&2048&&ja(9,t,t.return);break;case 3:Ei(t);break;case 12:Ei(t);break;case 22:var e=t.stateNode;t.memoizedState!==null&&e._visibility&2&&(t.return===null||t.return.tag!==13)?(e._visibility&=-3,en(t)):Ei(t);break;default:Ei(t)}}function en(t){var e=t.deletions;if((t.flags&16)!==0){if(e!==null)for(var a=0;a<e.length;a++){var l=e[a];Rt=l,dd(l,t)}md(t)}for(t=t.child;t!==null;){switch(e=t,e.tag){case 0:case 11:case 15:ja(8,e,e.return),en(e);break;case 22:a=e.stateNode,a._visibility&2&&(a._visibility&=-3,en(e));break;default:en(e)}t=t.sibling}}function dd(t,e){for(;Rt!==null;){var a=Rt;switch(a.tag){case 0:case 11:case 15:ja(8,a,e);break;case 23:case 22:if(a.memoizedState!==null&&a.memoizedState.cachePool!==null){var l=a.memoizedState.cachePool.pool;l!=null&&l.refCount++}break;case 24:mo(a.memoizedState.cache)}if(l=a.child,l!==null)l.return=a,Rt=l;else t:for(a=t;Rt!==null;){l=Rt;var i=l.sibling,o=l.return;if(id(l),l===a){Rt=null;break t}if(i!==null){i.return=o,Rt=i;break t}Rt=o}}}var Jv={getCacheForType:function(t){var e=Yt(_t),a=e.data.get(t);return a===void 0&&(a=t(),e.data.set(t,a)),a},cacheSignal:function(){return Yt(_t).controller.signal}},Iv=typeof WeakMap=="function"?WeakMap:Map,k=0,lt=null,Y=null,q=0,W=0,he=null,Ra=!1,ui=!1,qs=!1,Sa=0,ht=0,ka=0,nl=0,Ls=0,ye=0,$l=0,Li=null,fe=null,qu=!1,Zn=0,hd=0,Bn=1/0,En=null,Ha=null,zt=0,Qa=null,ti=null,da=0,Lu=0,Xu=null,gd=null,Xi=0,ju=null;function be(){return(k&2)!==0&&q!==0?q&-q:R.T!==null?js():Ep()}function vd(){if(ye===0)if((q&536870912)===0||X){var t=Mo;Mo<<=1,(Mo&3932160)===0&&(Mo=262144),ye=t}else ye=536870912;return t=Be.current,t!==null&&(t.flags|=32),ye}function me(t,e,a){(t===lt&&(W===2||W===9)||t.cancelPendingCommit!==null)&&(ei(t,0),Da(t,q,ye,!1)),so(t,a),((k&2)===0||t!==lt)&&(t===lt&&((k&2)===0&&(nl|=a),ht===4&&Da(t,q,ye,!1)),Pe(t))}function yd(t,e,a){if((k&6)!==0)throw Error(x(327));var l=!a&&(e&127)===0&&(e&t.expiredLanes)===0||uo(t,e),i=l?ty(t,e):eu(t,e,!0),o=l;do{if(i===0){ui&&!l&&Da(t,e,0,!1);break}else{if(a=t.current.alternate,o&&!Pv(a)){i=eu(t,e,!1),o=!1;continue}if(i===2){if(o=e,t.errorRecoveryDisabledLanes&o)var n=0;else n=t.pendingLanes&-536870913,n=n!==0?n:n&536870912?536870912:0;if(n!==0){e=n;t:{var r=t;i=Li;var u=r.current.memoizedState.isDehydrated;if(u&&(ei(r,n).flags|=256),n=eu(r,n,!1),n!==2){if(qs&&!u){r.errorRecoveryDisabledLanes|=o,nl|=o,i=4;break t}o=fe,fe=i,o!==null&&(fe===null?fe=o:fe.push.apply(fe,o))}i=n}if(o=!1,i!==2)continue}}if(i===1){ei(t,0),Da(t,e,0,!0);break}t:{switch(l=t,o=i,o){case 0:case 1:throw Error(x(345));case 4:if((e&4194048)!==e)break;case 6:Da(l,e,ye,!Ra);break t;case 2:fe=null;break;case 3:case 5:break;default:throw Error(x(329))}if((e&62914560)===e&&(i=Zn+300-Se(),10<i)){if(Da(l,e,ye,!Ra),Gn(l,0,!0)!==0)break t;da=e,l.timeoutHandle=Hd(Gm.bind(null,l,a,fe,En,qu,e,ye,nl,$l,Ra,o,"Throttled",-0,0),i);break t}Gm(l,a,fe,En,qu,e,ye,nl,$l,Ra,o,null,-0,0)}}break}while(!0);Pe(t)}function Gm(t,e,a,l,i,o,n,r,u,s,p,d,c,h){if(t.timeoutHandle=-1,d=e.subtreeFlags,d&8192||(d&16785408)===16785408){d={stylesheets:null,count:0,imgCount:0,imgBytes:0,suspenseyImages:[],waitingForImages:!0,waitingForViewTransition:!1,unsuspend:ca},fd(e,o,d);var y=(o&62914560)===o?Zn-Se():(o&4194048)===o?hd-Se():0;if(y=wy(d,y),y!==null){da=o,t.cancelPendingCommit=y(Hm.bind(null,t,e,o,a,l,i,n,r,u,p,d,null,c,h)),Da(t,o,n,!s);return}}Hm(t,e,o,a,l,i,n,r,u)}function Pv(t){for(var e=t;;){var a=e.tag;if((a===0||a===11||a===15)&&e.flags&16384&&(a=e.updateQueue,a!==null&&(a=a.stores,a!==null)))for(var l=0;l<a.length;l++){var i=a[l],o=i.getSnapshot;i=i.value;try{if(!_e(o(),i))return!1}catch{return!1}}if(a=e.child,e.subtreeFlags&16384&&a!==null)a.return=e,e=a;else{if(e===t)break;for(;e.sibling===null;){if(e.return===null||e.return===t)return!0;e=e.return}e.sibling.return=e.return,e=e.sibling}}return!0}function Da(t,e,a,l){e&=~Ls,e&=~nl,t.suspendedLanes|=e,t.pingedLanes&=~e,l&&(t.warmLanes|=e),l=t.expirationTimes;for(var i=e;0<i;){var o=31-xe(i),n=1<<o;l[o]=-1,i&=~n}a!==0&&bp(t,a,e)}function Kn(){return(k&6)===0?(go(0,!1),!1):!0}function Xs(){if(Y!==null){if(W===0)var t=Y.return;else t=Y,fa=gl=null,Ms(t),Xl=null,Pi=0,t=Y;for(;t!==null;)I0(t.alternate,t),t=t.return;Y=null}}function ei(t,e){var a=t.timeoutHandle;a!==-1&&(t.timeoutHandle=-1,gy(a)),a=t.cancelPendingCommit,a!==null&&(t.cancelPendingCommit=null,a()),da=0,Xs(),lt=t,Y=a=ma(t.current,null),q=e,W=0,he=null,Ra=!1,ui=uo(t,e),qs=!1,$l=ye=Ls=nl=ka=ht=0,fe=Li=null,qu=!1,(e&8)!==0&&(e|=e&32);var l=t.entangledLanes;if(l!==0)for(t=t.entanglements,l&=e;0<l;){var i=31-xe(l),o=1<<i;e|=t[i],l&=~o}return Sa=e,Yn(),a}function Sd(t,e){G=null,R.H=to,e===ri||e===qn?(e=dm(),W=3):e===bs?(e=dm(),W=4):W=e===Hs?8:e!==null&&typeof e=="object"&&typeof e.then=="function"?6:1,he=e,Y===null&&(ht=1,xn(t,Ne(e,t.current)))}function Ad(){var t=Be.current;return t===null?!0:(q&4194048)===q?Ve===null:(q&62914560)===q||(q&536870912)!==0?t===Ve:!1}function xd(){var t=R.H;return R.H=to,t===null?to:t}function bd(){var t=R.A;return R.A=Jv,t}function Cn(){ht=4,Ra||(q&4194048)!==q&&Be.current!==null||(ui=!0),(ka&134217727)===0&&(nl&134217727)===0||lt===null||Da(lt,q,ye,!1)}function eu(t,e,a){var l=k;k|=2;var i=xd(),o=bd();(lt!==t||q!==e)&&(En=null,ei(t,e)),e=!1;var n=ht;t:do try{if(W!==0&&Y!==null){var r=Y,u=he;switch(W){case 8:Xs(),n=6;break t;case 3:case 2:case 9:case 6:Be.current===null&&(e=!0);var s=W;if(W=0,he=null,Ql(t,r,u,s),a&&ui){n=0;break t}break;default:s=W,W=0,he=null,Ql(t,r,u,s)}}$v(),n=ht;break}catch(p){Sd(t,p)}while(!0);return e&&t.shellSuspendCounter++,fa=gl=null,k=l,R.H=i,R.A=o,Y===null&&(lt=null,q=0,Yn()),n}function $v(){for(;Y!==null;)_d(Y)}function ty(t,e){var a=k;k|=2;var l=xd(),i=bd();lt!==t||q!==e?(En=null,Bn=Se()+500,ei(t,e)):ui=uo(t,e);t:do try{if(W!==0&&Y!==null){e=Y;var o=he;e:switch(W){case 1:W=0,he=null,Ql(t,e,o,1);break;case 2:case 9:if(pm(o)){W=0,he=null,Vm(e);break}e=function(){W!==2&&W!==9||lt!==t||(W=7),Pe(t)},o.then(e,e);break t;case 3:W=7;break t;case 4:W=5;break t;case 7:pm(o)?(W=0,he=null,Vm(e)):(W=0,he=null,Ql(t,e,o,7));break;case 5:var n=null;switch(Y.tag){case 26:n=Y.memoizedState;case 5:case 27:var r=Y;if(n?Ld(n):r.stateNode.complete){W=0,he=null;var u=r.sibling;if(u!==null)Y=u;else{var s=r.return;s!==null?(Y=s,Wn(s)):Y=null}break e}}W=0,he=null,Ql(t,e,o,5);break;case 6:W=0,he=null,Ql(t,e,o,6);break;case 8:Xs(),ht=6;break t;default:throw Error(x(462))}}ey();break}catch(p){Sd(t,p)}while(!0);return fa=gl=null,R.H=l,R.A=i,k=a,Y!==null?0:(lt=null,q=0,Yn(),ht)}function ey(){for(;Y!==null&&!B1();)_d(Y)}function _d(t){var e=J0(t.alternate,t,Sa);t.memoizedProps=t.pendingProps,e===null?Wn(t):Y=e}function Vm(t){var e=t,a=e.alternate;switch(e.tag){case 15:case 0:e=Um(a,e,e.pendingProps,e.type,void 0,q);break;case 11:e=Um(a,e,e.pendingProps,e.type.render,e.ref,q);break;case 5:Ms(e);default:I0(a,e),e=Y=Ip(e,Sa),e=J0(a,e,Sa)}t.memoizedProps=t.pendingProps,e===null?Wn(t):Y=e}function Ql(t,e,a,l){fa=gl=null,Ms(e),Xl=null,Pi=0;var i=e.return;try{if(Lv(t,i,e,a,q)){ht=1,xn(t,Ne(a,t.current)),Y=null;return}}catch(o){if(i!==null)throw Y=i,o;ht=1,xn(t,Ne(a,t.current)),Y=null;return}e.flags&32768?(X||l===1?t=!0:ui||(q&536870912)!==0?t=!1:(Ra=t=!0,(l===2||l===9||l===3||l===6)&&(l=Be.current,l!==null&&l.tag===13&&(l.flags|=16384))),Bd(e,t)):Wn(e)}function Wn(t){var e=t;do{if((e.flags&32768)!==0){Bd(e,Ra);return}t=e.return;var a=kv(e.alternate,e,Sa);if(a!==null){Y=a;return}if(e=e.sibling,e!==null){Y=e;return}Y=e=t}while(e!==null);ht===0&&(ht=5)}function Bd(t,e){do{var a=Zv(t.alternate,t);if(a!==null){a.flags&=32767,Y=a;return}if(a=t.return,a!==null&&(a.flags|=32768,a.subtreeFlags=0,a.deletions=null),!e&&(t=t.sibling,t!==null)){Y=t;return}Y=t=a}while(t!==null);ht=6,Y=null}function Hm(t,e,a,l,i,o,n,r,u){t.cancelPendingCommit=null;do Jn();while(zt!==0);if((k&6)!==0)throw Error(x(327));if(e!==null){if(e===t.current)throw Error(x(177));if(o=e.lanes|e.childLanes,o|=hs,w1(t,a,o,n,r,u),t===lt&&(Y=lt=null,q=0),ti=e,Qa=t,da=a,Lu=o,Xu=i,gd=l,(e.subtreeFlags&10256)!==0||(e.flags&10256)!==0?(t.callbackNode=null,t.callbackPriority=0,oy(cn,function(){return Md(),null})):(t.callbackNode=null,t.callbackPriority=0),l=(e.flags&13878)!==0,(e.subtreeFlags&13878)!==0||l){l=R.T,R.T=null,i=Z.p,Z.p=2,n=k,k|=4;try{Kv(t,e,a)}finally{k=n,Z.p=i,R.T=l}}zt=1,Ed(),Cd(),zd()}}function Ed(){if(zt===1){zt=0;var t=Qa,e=ti,a=(e.flags&13878)!==0;if((e.subtreeFlags&13878)!==0||a){a=R.T,R.T=null;var l=Z.p;Z.p=2;var i=k;k|=4;try{ud(e,t);var o=Wu,n=Lp(t.containerInfo),r=o.focusedElem,u=o.selectionRange;if(n!==r&&r&&r.ownerDocument&&qp(r.ownerDocument.documentElement,r)){if(u!==null&&ds(r)){var s=u.start,p=u.end;if(p===void 0&&(p=s),"selectionStart"in r)r.selectionStart=s,r.selectionEnd=Math.min(p,r.value.length);else{var d=r.ownerDocument||document,c=d&&d.defaultView||window;if(c.getSelection){var h=c.getSelection(),y=r.textContent.length,S=Math.min(u.start,y),A=u.end===void 0?S:Math.min(u.end,y);!h.extend&&S>A&&(n=A,A=S,S=n);var f=nm(r,S),m=nm(r,A);if(f&&m&&(h.rangeCount!==1||h.anchorNode!==f.node||h.anchorOffset!==f.offset||h.focusNode!==m.node||h.focusOffset!==m.offset)){var g=d.createRange();g.setStart(f.node,f.offset),h.removeAllRanges(),S>A?(h.addRange(g),h.extend(m.node,m.offset)):(g.setEnd(m.node,m.offset),h.addRange(g))}}}}for(d=[],h=r;h=h.parentNode;)h.nodeType===1&&d.push({element:h,left:h.scrollLeft,top:h.scrollTop});for(typeof r.focus=="function"&&r.focus(),r=0;r<d.length;r++){var v=d[r];v.element.scrollLeft=v.left,v.element.scrollTop=v.top}}wn=!!Ku,Wu=Ku=null}finally{k=i,Z.p=l,R.T=a}}t.current=e,zt=2}}function Cd(){if(zt===2){zt=0;var t=Qa,e=ti,a=(e.flags&8772)!==0;if((e.subtreeFlags&8772)!==0||a){a=R.T,R.T=null;var l=Z.p;Z.p=2;var i=k;k|=4;try{ld(t,e.alternate,e)}finally{k=i,Z.p=l,R.T=a}}zt=3}}function zd(){if(zt===4||zt===3){zt=0,E1();var t=Qa,e=ti,a=da,l=gd;(e.subtreeFlags&10256)!==0||(e.flags&10256)!==0?zt=5:(zt=0,ti=Qa=null,Td(t,t.pendingLanes));var i=t.pendingLanes;if(i===0&&(Ha=null),rs(a),e=e.stateNode,Ae&&typeof Ae.onCommitFiberRoot=="function")try{Ae.onCommitFiberRoot(ro,e,void 0,(e.current.flags&128)===128)}catch{}if(l!==null){e=R.T,i=Z.p,Z.p=2,R.T=null;try{for(var o=t.onRecoverableError,n=0;n<l.length;n++){var r=l[n];o(r.value,{componentStack:r.stack})}}finally{R.T=e,Z.p=i}}(da&3)!==0&&Jn(),Pe(t),i=t.pendingLanes,(a&261930)!==0&&(i&42)!==0?t===ju?Xi++:(Xi=0,ju=t):Xi=0,go(0,!1)}}function Td(t,e){(t.pooledCacheLanes&=e)===0&&(e=t.pooledCache,e!=null&&(t.pooledCache=null,mo(e)))}function Jn(){return Ed(),Cd(),zd(),Md()}function Md(){if(zt!==5)return!1;var t=Qa,e=Lu;Lu=0;var a=rs(da),l=R.T,i=Z.p;try{Z.p=32>a?32:a,R.T=null,a=Xu,Xu=null;var o=Qa,n=da;if(zt=0,ti=Qa=null,da=0,(k&6)!==0)throw Error(x(331));var r=k;if(k|=4,pd(o.current),cd(o,o.current,n,a),k=r,go(0,!1),Ae&&typeof Ae.onPostCommitFiberRoot=="function")try{Ae.onPostCommitFiberRoot(ro,o)}catch{}return!0}finally{Z.p=i,R.T=l,Td(t,e)}}function Qm(t,e,a){e=Ne(a,e),e=Hu(t.stateNode,e,2),t=Va(t,e,2),t!==null&&(so(t,2),Pe(t))}function J(t,e,a){if(t.tag===3)Qm(t,t,a);else for(;e!==null;){if(e.tag===3){Qm(e,t,a);break}else if(e.tag===1){var l=e.stateNode;if(typeof e.type.getDerivedStateFromError=="function"||typeof l.componentDidCatch=="function"&&(Ha===null||!Ha.has(l))){t=Ne(a,t),a=X0(2),l=Va(e,a,2),l!==null&&(j0(a,l,e,t),so(l,2),Pe(l));break}}e=e.return}}function au(t,e,a){var l=t.pingCache;if(l===null){l=t.pingCache=new Iv;var i=new Set;l.set(e,i)}else i=l.get(e),i===void 0&&(i=new Set,l.set(e,i));i.has(a)||(qs=!0,i.add(a),t=ay.bind(null,t,e,a),e.then(t,t))}function ay(t,e,a){var l=t.pingCache;l!==null&&l.delete(e),t.pingedLanes|=t.suspendedLanes&a,t.warmLanes&=~a,lt===t&&(q&a)===a&&(ht===4||ht===3&&(q&62914560)===q&&300>Se()-Zn?(k&2)===0&&ei(t,0):Ls|=a,$l===q&&($l=0)),Pe(t)}function Ud(t,e){e===0&&(e=xp()),t=hl(t,e),t!==null&&(so(t,e),Pe(t))}function ly(t){var e=t.memoizedState,a=0;e!==null&&(a=e.retryLane),Ud(t,a)}function iy(t,e){var a=0;switch(t.tag){case 31:case 13:var l=t.stateNode,i=t.memoizedState;i!==null&&(a=i.retryLane);break;case 19:l=t.stateNode;break;case 22:l=t.stateNode._retryCache;break;default:throw Error(x(314))}l!==null&&l.delete(e),Ud(t,a)}function oy(t,e){return os(t,e)}var zn=null,zl=null,ku=!1,Tn=!1,lu=!1,Oa=0;function Pe(t){t!==zl&&t.next===null&&(zl===null?zn=zl=t:zl=zl.next=t),Tn=!0,ku||(ku=!0,ry())}function go(t,e){if(!lu&&Tn){lu=!0;do for(var a=!1,l=zn;l!==null;){if(!e)if(t!==0){var i=l.pendingLanes;if(i===0)var o=0;else{var n=l.suspendedLanes,r=l.pingedLanes;o=(1<<31-xe(42|t)+1)-1,o&=i&~(n&~r),o=o&201326741?o&201326741|1:o?o|2:0}o!==0&&(a=!0,Ym(l,o))}else o=q,o=Gn(l,l===lt?o:0,l.cancelPendingCommit!==null||l.timeoutHandle!==-1),(o&3)===0||uo(l,o)||(a=!0,Ym(l,o));l=l.next}while(a);lu=!1}}function ny(){Rd()}function Rd(){Tn=ku=!1;var t=0;Oa!==0&&hy()&&(t=Oa);for(var e=Se(),a=null,l=zn;l!==null;){var i=l.next,o=Dd(l,e);o===0?(l.next=null,a===null?zn=i:a.next=i,i===null&&(zl=a)):(a=l,(t!==0||(o&3)!==0)&&(Tn=!0)),l=i}zt!==0&&zt!==5||go(t,!1),Oa!==0&&(Oa=0)}function Dd(t,e){for(var a=t.suspendedLanes,l=t.pingedLanes,i=t.expirationTimes,o=t.pendingLanes&-62914561;0<o;){var n=31-xe(o),r=1<<n,u=i[n];u===-1?((r&a)===0||(r&l)!==0)&&(i[n]=O1(r,e)):u<=e&&(t.expiredLanes|=r),o&=~r}if(e=lt,a=q,a=Gn(t,t===e?a:0,t.cancelPendingCommit!==null||t.timeoutHandle!==-1),l=t.callbackNode,a===0||t===e&&(W===2||W===9)||t.cancelPendingCommit!==null)return l!==null&&l!==null&&Dr(l),t.callbackNode=null,t.callbackPriority=0;if((a&3)===0||uo(t,a)){if(e=a&-a,e===t.callbackPriority)return e;switch(l!==null&&Dr(l),rs(a)){case 2:case 8:a=Sp;break;case 32:a=cn;break;case 268435456:a=Ap;break;default:a=cn}return l=Od.bind(null,t),a=os(a,l),t.callbackPriority=e,t.callbackNode=a,e}return l!==null&&l!==null&&Dr(l),t.callbackPriority=2,t.callbackNode=null,2}function Od(t,e){if(zt!==0&&zt!==5)return t.callbackNode=null,t.callbackPriority=0,null;var a=t.callbackNode;if(Jn()&&t.callbackNode!==a)return null;var l=q;return l=Gn(t,t===lt?l:0,t.cancelPendingCommit!==null||t.timeoutHandle!==-1),l===0?null:(yd(t,l,e),Dd(t,Se()),t.callbackNode!=null&&t.callbackNode===a?Od.bind(null,t):null)}function Ym(t,e){if(Jn())return null;yd(t,e,!0)}function ry(){vy(function(){(k&6)!==0?os(yp,ny):Rd()})}function js(){if(Oa===0){var t=Jl;t===0&&(t=To,To<<=1,(To&261888)===0&&(To=256)),Oa=t}return Oa}function Fm(t){return t==null||typeof t=="symbol"||typeof t=="boolean"?null:typeof t=="function"?t:ko(""+t)}function qm(t,e){var a=e.ownerDocument.createElement("input");return a.name=e.name,a.value=e.value,t.id&&a.setAttribute("form",t.id),e.parentNode.insertBefore(a,e),t=new FormData(t),a.parentNode.removeChild(a),t}function uy(t,e,a,l,i){if(e==="submit"&&a&&a.stateNode===i){var o=Fm((i[pe]||null).action),n=l.submitter;n&&(e=(e=n[pe]||null)?Fm(e.formAction):n.getAttribute("formAction"),e!==null&&(o=e,n=null));var r=new Vn("action","action",null,l,i);t.push({event:r,listeners:[{instance:null,listener:function(){if(l.defaultPrevented){if(Oa!==0){var u=n?qm(i,n):new FormData(i);Gu(a,{pending:!0,data:u,method:i.method,action:o},null,u)}}else typeof o=="function"&&(r.preventDefault(),u=n?qm(i,n):new FormData(i),Gu(a,{pending:!0,data:u,method:i.method,action:o},o,u))},currentTarget:i}]})}}for(Yo=0;Yo<Bu.length;Yo++)Fo=Bu[Yo],Lm=Fo.toLowerCase(),Xm=Fo[0].toUpperCase()+Fo.slice(1),Le(Lm,"on"+Xm);var Fo,Lm,Xm,Yo;Le(jp,"onAnimationEnd");Le(kp,"onAnimationIteration");Le(Zp,"onAnimationStart");Le("dblclick","onDoubleClick");Le("focusin","onFocus");Le("focusout","onBlur");Le(Cv,"onTransitionRun");Le(zv,"onTransitionStart");Le(Tv,"onTransitionCancel");Le(Kp,"onTransitionEnd");Kl("onMouseEnter",["mouseout","mouseover"]);Kl("onMouseLeave",["mouseout","mouseover"]);Kl("onPointerEnter",["pointerout","pointerover"]);Kl("onPointerLeave",["pointerout","pointerover"]);ml("onChange","change click focusin focusout input keydown keyup selectionchange".split(" "));ml("onSelect","focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));ml("onBeforeInput",["compositionend","keypress","textInput","paste"]);ml("onCompositionEnd","compositionend focusout keydown keypress keyup mousedown".split(" "));ml("onCompositionStart","compositionstart focusout keydown keypress keyup mousedown".split(" "));ml("onCompositionUpdate","compositionupdate focusout keydown keypress keyup mousedown".split(" "));var eo="abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "),sy=new Set("beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(eo));function wd(t,e){e=(e&4)!==0;for(var a=0;a<t.length;a++){var l=t[a],i=l.event;l=l.listeners;t:{var o=void 0;if(e)for(var n=l.length-1;0<=n;n--){var r=l[n],u=r.instance,s=r.currentTarget;if(r=r.listener,u!==o&&i.isPropagationStopped())break t;o=r,i.currentTarget=s;try{o(i)}catch(p){mn(p)}i.currentTarget=null,o=u}else for(n=0;n<l.length;n++){if(r=l[n],u=r.instance,s=r.currentTarget,r=r.listener,u!==o&&i.isPropagationStopped())break t;o=r,i.currentTarget=s;try{o(i)}catch(p){mn(p)}i.currentTarget=null,o=u}}}}function Q(t,e){var a=e[gu];a===void 0&&(a=e[gu]=new Set);var l=t+"__bubble";a.has(l)||(Nd(e,t,2,!1),a.add(l))}function iu(t,e,a){var l=0;e&&(l|=4),Nd(a,t,l,e)}var qo="_reactListening"+Math.random().toString(36).slice(2);function ks(t){if(!t[qo]){t[qo]=!0,Cp.forEach(function(a){a!=="selectionchange"&&(sy.has(a)||iu(a,!1,t),iu(a,!0,t))});var e=t.nodeType===9?t:t.ownerDocument;e===null||e[qo]||(e[qo]=!0,iu("selectionchange",!1,e))}}function Nd(t,e,a,l){switch(Kd(e)){case 2:var i=Vy;break;case 8:i=Hy;break;default:i=Js}a=i.bind(null,e,a,t),i=void 0,!xu||e!=="touchstart"&&e!=="touchmove"&&e!=="wheel"||(i=!0),l?i!==void 0?t.addEventListener(e,a,{capture:!0,passive:i}):t.addEventListener(e,a,!0):i!==void 0?t.addEventListener(e,a,{passive:i}):t.addEventListener(e,a,!1)}function ou(t,e,a,l,i){var o=l;if((e&1)===0&&(e&2)===0&&l!==null)t:for(;;){if(l===null)return;var n=l.tag;if(n===3||n===4){var r=l.stateNode.containerInfo;if(r===i)break;if(n===4)for(n=l.return;n!==null;){var u=n.tag;if((u===3||u===4)&&n.stateNode.containerInfo===i)return;n=n.return}for(;r!==null;){if(n=Ul(r),n===null)return;if(u=n.tag,u===5||u===6||u===26||u===27){l=o=n;continue t}r=r.parentNode}}l=l.return}wp(function(){var s=o,p=cs(a),d=[];t:{var c=Wp.get(t);if(c!==void 0){var h=Vn,y=t;switch(t){case"keypress":if(Ko(a)===0)break t;case"keydown":case"keyup":h=iv;break;case"focusin":y="focus",h=Vr;break;case"focusout":y="blur",h=Vr;break;case"beforeblur":case"afterblur":h=Vr;break;case"click":if(a.button===2)break t;case"auxclick":case"dblclick":case"mousedown":case"mousemove":case"mouseup":case"mouseout":case"mouseover":case"contextmenu":h=If;break;case"drag":case"dragend":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"dragstart":case"drop":h=k1;break;case"touchcancel":case"touchend":case"touchmove":case"touchstart":h=rv;break;case jp:case kp:case Zp:h=W1;break;case Kp:h=sv;break;case"scroll":case"scrollend":h=X1;break;case"wheel":h=fv;break;case"copy":case"cut":case"paste":h=I1;break;case"gotpointercapture":case"lostpointercapture":case"pointercancel":case"pointerdown":case"pointermove":case"pointerout":case"pointerover":case"pointerup":h=$f;break;case"toggle":case"beforetoggle":h=pv}var S=(e&4)!==0,A=!S&&(t==="scroll"||t==="scrollend"),f=S?c!==null?c+"Capture":null:c;S=[];for(var m=s,g;m!==null;){var v=m;if(g=v.stateNode,v=v.tag,v!==5&&v!==26&&v!==27||g===null||f===null||(v=Zi(m,f),v!=null&&S.push(ao(m,v,g))),A)break;m=m.return}0<S.length&&(c=new h(c,y,null,a,p),d.push({event:c,listeners:S}))}}if((e&7)===0){t:{if(c=t==="mouseover"||t==="pointerover",h=t==="mouseout"||t==="pointerout",c&&a!==Au&&(y=a.relatedTarget||a.fromElement)&&(Ul(y)||y[ii]))break t;if((h||c)&&(c=p.window===p?p:(c=p.ownerDocument)?c.defaultView||c.parentWindow:window,h?(y=a.relatedTarget||a.toElement,h=s,y=y?Ul(y):null,y!==null&&(A=no(y),S=y.tag,y!==A||S!==5&&S!==27&&S!==6)&&(y=null)):(h=null,y=s),h!==y)){if(S=If,v="onMouseLeave",f="onMouseEnter",m="mouse",(t==="pointerout"||t==="pointerover")&&(S=$f,v="onPointerLeave",f="onPointerEnter",m="pointer"),A=h==null?c:Ui(h),g=y==null?c:Ui(y),c=new S(v,m+"leave",h,a,p),c.target=A,c.relatedTarget=g,v=null,Ul(p)===s&&(S=new S(f,m+"enter",y,a,p),S.target=g,S.relatedTarget=A,v=S),A=v,h&&y)e:{for(S=cy,f=h,m=y,g=0,v=f;v;v=S(v))g++;v=0;for(var _=m;_;_=S(_))v++;for(;0<g-v;)f=S(f),g--;for(;0<v-g;)m=S(m),v--;for(;g--;){if(f===m||m!==null&&f===m.alternate){S=f;break e}f=S(f),m=S(m)}S=null}else S=null;h!==null&&jm(d,c,h,S,!1),y!==null&&A!==null&&jm(d,A,y,S,!0)}}t:{if(c=s?Ui(s):window,h=c.nodeName&&c.nodeName.toLowerCase(),h==="select"||h==="input"&&c.type==="file")var E=lm;else if(am(c))if(Yp)E=_v;else{E=xv;var b=Av}else h=c.nodeName,!h||h.toLowerCase()!=="input"||c.type!=="checkbox"&&c.type!=="radio"?s&&ss(s.elementType)&&(E=lm):E=bv;if(E&&(E=E(t,s))){Qp(d,E,a,p);break t}b&&b(t,c,s),t==="focusout"&&s&&c.type==="number"&&s.memoizedProps.value!=null&&Su(c,"number",c.value)}switch(b=s?Ui(s):window,t){case"focusin":(am(b)||b.contentEditable==="true")&&(Ol=b,bu=s,Ni=null);break;case"focusout":Ni=bu=Ol=null;break;case"mousedown":_u=!0;break;case"contextmenu":case"mouseup":case"dragend":_u=!1,rm(d,a,p);break;case"selectionchange":if(Ev)break;case"keydown":case"keyup":rm(d,a,p)}var T;if(ps)t:{switch(t){case"compositionstart":var z="onCompositionStart";break t;case"compositionend":z="onCompositionEnd";break t;case"compositionupdate":z="onCompositionUpdate";break t}z=void 0}else Dl?Vp(t,a)&&(z="onCompositionEnd"):t==="keydown"&&a.keyCode===229&&(z="onCompositionStart");z&&(Gp&&a.locale!=="ko"&&(Dl||z!=="onCompositionStart"?z==="onCompositionEnd"&&Dl&&(T=Np()):(Ua=p,fs="value"in Ua?Ua.value:Ua.textContent,Dl=!0)),b=Mn(s,z),0<b.length&&(z=new Pf(z,t,null,a,p),d.push({event:z,listeners:b}),T?z.data=T:(T=Hp(a),T!==null&&(z.data=T)))),(T=hv?gv(t,a):vv(t,a))&&(z=Mn(s,"onBeforeInput"),0<z.length&&(b=new Pf("onBeforeInput","beforeinput",null,a,p),d.push({event:b,listeners:z}),b.data=T)),uy(d,t,s,a,p)}wd(d,e)})}function ao(t,e,a){return{instance:t,listener:e,currentTarget:a}}function Mn(t,e){for(var a=e+"Capture",l=[];t!==null;){var i=t,o=i.stateNode;if(i=i.tag,i!==5&&i!==26&&i!==27||o===null||(i=Zi(t,a),i!=null&&l.unshift(ao(t,i,o)),i=Zi(t,e),i!=null&&l.push(ao(t,i,o))),t.tag===3)return l;t=t.return}return[]}function cy(t){if(t===null)return null;do t=t.return;while(t&&t.tag!==5&&t.tag!==27);return t||null}function jm(t,e,a,l,i){for(var o=e._reactName,n=[];a!==null&&a!==l;){var r=a,u=r.alternate,s=r.stateNode;if(r=r.tag,u!==null&&u===l)break;r!==5&&r!==26&&r!==27||s===null||(u=s,i?(s=Zi(a,o),s!=null&&n.unshift(ao(a,s,u))):i||(s=Zi(a,o),s!=null&&n.push(ao(a,s,u)))),a=a.return}n.length!==0&&t.push({event:e,listeners:n})}var fy=/\r\n?/g,my=/\u0000|\uFFFD/g;function km(t){return(typeof t=="string"?t:""+t).replace(fy,`
`).replace(my,"")}function Gd(t,e){return e=km(e),km(t)===e}function $(t,e,a,l,i,o){switch(a){case"children":typeof l=="string"?e==="body"||e==="textarea"&&l===""||Wl(t,l):(typeof l=="number"||typeof l=="bigint")&&e!=="body"&&Wl(t,""+l);break;case"className":Ro(t,"class",l);break;case"tabIndex":Ro(t,"tabindex",l);break;case"dir":case"role":case"viewBox":case"width":case"height":Ro(t,a,l);break;case"style":Op(t,l,o);break;case"data":if(e!=="object"){Ro(t,"data",l);break}case"src":case"href":if(l===""&&(e!=="a"||a!=="href")){t.removeAttribute(a);break}if(l==null||typeof l=="function"||typeof l=="symbol"||typeof l=="boolean"){t.removeAttribute(a);break}l=ko(""+l),t.setAttribute(a,l);break;case"action":case"formAction":if(typeof l=="function"){t.setAttribute(a,"javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')");break}else typeof o=="function"&&(a==="formAction"?(e!=="input"&&$(t,e,"name",i.name,i,null),$(t,e,"formEncType",i.formEncType,i,null),$(t,e,"formMethod",i.formMethod,i,null),$(t,e,"formTarget",i.formTarget,i,null)):($(t,e,"encType",i.encType,i,null),$(t,e,"method",i.method,i,null),$(t,e,"target",i.target,i,null)));if(l==null||typeof l=="symbol"||typeof l=="boolean"){t.removeAttribute(a);break}l=ko(""+l),t.setAttribute(a,l);break;case"onClick":l!=null&&(t.onclick=ca);break;case"onScroll":l!=null&&Q("scroll",t);break;case"onScrollEnd":l!=null&&Q("scrollend",t);break;case"dangerouslySetInnerHTML":if(l!=null){if(typeof l!="object"||!("__html"in l))throw Error(x(61));if(a=l.__html,a!=null){if(i.children!=null)throw Error(x(60));t.innerHTML=a}}break;case"multiple":t.multiple=l&&typeof l!="function"&&typeof l!="symbol";break;case"muted":t.muted=l&&typeof l!="function"&&typeof l!="symbol";break;case"suppressContentEditableWarning":case"suppressHydrationWarning":case"defaultValue":case"defaultChecked":case"innerHTML":case"ref":break;case"autoFocus":break;case"xlinkHref":if(l==null||typeof l=="function"||typeof l=="boolean"||typeof l=="symbol"){t.removeAttribute("xlink:href");break}a=ko(""+l),t.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",a);break;case"contentEditable":case"spellCheck":case"draggable":case"value":case"autoReverse":case"externalResourcesRequired":case"focusable":case"preserveAlpha":l!=null&&typeof l!="function"&&typeof l!="symbol"?t.setAttribute(a,""+l):t.removeAttribute(a);break;case"inert":case"allowFullScreen":case"async":case"autoPlay":case"controls":case"default":case"defer":case"disabled":case"disablePictureInPicture":case"disableRemotePlayback":case"formNoValidate":case"hidden":case"loop":case"noModule":case"noValidate":case"open":case"playsInline":case"readOnly":case"required":case"reversed":case"scoped":case"seamless":case"itemScope":l&&typeof l!="function"&&typeof l!="symbol"?t.setAttribute(a,""):t.removeAttribute(a);break;case"capture":case"download":l===!0?t.setAttribute(a,""):l!==!1&&l!=null&&typeof l!="function"&&typeof l!="symbol"?t.setAttribute(a,l):t.removeAttribute(a);break;case"cols":case"rows":case"size":case"span":l!=null&&typeof l!="function"&&typeof l!="symbol"&&!isNaN(l)&&1<=l?t.setAttribute(a,l):t.removeAttribute(a);break;case"rowSpan":case"start":l==null||typeof l=="function"||typeof l=="symbol"||isNaN(l)?t.removeAttribute(a):t.setAttribute(a,l);break;case"popover":Q("beforetoggle",t),Q("toggle",t),jo(t,"popover",l);break;case"xlinkActuate":aa(t,"http://www.w3.org/1999/xlink","xlink:actuate",l);break;case"xlinkArcrole":aa(t,"http://www.w3.org/1999/xlink","xlink:arcrole",l);break;case"xlinkRole":aa(t,"http://www.w3.org/1999/xlink","xlink:role",l);break;case"xlinkShow":aa(t,"http://www.w3.org/1999/xlink","xlink:show",l);break;case"xlinkTitle":aa(t,"http://www.w3.org/1999/xlink","xlink:title",l);break;case"xlinkType":aa(t,"http://www.w3.org/1999/xlink","xlink:type",l);break;case"xmlBase":aa(t,"http://www.w3.org/XML/1998/namespace","xml:base",l);break;case"xmlLang":aa(t,"http://www.w3.org/XML/1998/namespace","xml:lang",l);break;case"xmlSpace":aa(t,"http://www.w3.org/XML/1998/namespace","xml:space",l);break;case"is":jo(t,"is",l);break;case"innerText":case"textContent":break;default:(!(2<a.length)||a[0]!=="o"&&a[0]!=="O"||a[1]!=="n"&&a[1]!=="N")&&(a=q1.get(a)||a,jo(t,a,l))}}function Zu(t,e,a,l,i,o){switch(a){case"style":Op(t,l,o);break;case"dangerouslySetInnerHTML":if(l!=null){if(typeof l!="object"||!("__html"in l))throw Error(x(61));if(a=l.__html,a!=null){if(i.children!=null)throw Error(x(60));t.innerHTML=a}}break;case"children":typeof l=="string"?Wl(t,l):(typeof l=="number"||typeof l=="bigint")&&Wl(t,""+l);break;case"onScroll":l!=null&&Q("scroll",t);break;case"onScrollEnd":l!=null&&Q("scrollend",t);break;case"onClick":l!=null&&(t.onclick=ca);break;case"suppressContentEditableWarning":case"suppressHydrationWarning":case"innerHTML":case"ref":break;case"innerText":case"textContent":break;default:if(!zp.hasOwnProperty(a))t:{if(a[0]==="o"&&a[1]==="n"&&(i=a.endsWith("Capture"),e=a.slice(2,i?a.length-7:void 0),o=t[pe]||null,o=o!=null?o[a]:null,typeof o=="function"&&t.removeEventListener(e,o,i),typeof l=="function")){typeof o!="function"&&o!==null&&(a in t?t[a]=null:t.hasAttribute(a)&&t.removeAttribute(a)),t.addEventListener(e,l,i);break t}a in t?t[a]=l:l===!0?t.setAttribute(a,""):jo(t,a,l)}}}function Ft(t,e,a){switch(e){case"div":case"span":case"svg":case"path":case"a":case"g":case"p":case"li":break;case"img":Q("error",t),Q("load",t);var l=!1,i=!1,o;for(o in a)if(a.hasOwnProperty(o)){var n=a[o];if(n!=null)switch(o){case"src":l=!0;break;case"srcSet":i=!0;break;case"children":case"dangerouslySetInnerHTML":throw Error(x(137,e));default:$(t,e,o,n,a,null)}}i&&$(t,e,"srcSet",a.srcSet,a,null),l&&$(t,e,"src",a.src,a,null);return;case"input":Q("invalid",t);var r=o=n=i=null,u=null,s=null;for(l in a)if(a.hasOwnProperty(l)){var p=a[l];if(p!=null)switch(l){case"name":i=p;break;case"type":n=p;break;case"checked":u=p;break;case"defaultChecked":s=p;break;case"value":o=p;break;case"defaultValue":r=p;break;case"children":case"dangerouslySetInnerHTML":if(p!=null)throw Error(x(137,e));break;default:$(t,e,l,p,a,null)}}Up(t,o,r,u,s,n,i,!1);return;case"select":Q("invalid",t),l=n=o=null;for(i in a)if(a.hasOwnProperty(i)&&(r=a[i],r!=null))switch(i){case"value":o=r;break;case"defaultValue":n=r;break;case"multiple":l=r;default:$(t,e,i,r,a,null)}e=o,a=n,t.multiple=!!l,e!=null?Fl(t,!!l,e,!1):a!=null&&Fl(t,!!l,a,!0);return;case"textarea":Q("invalid",t),o=i=l=null;for(n in a)if(a.hasOwnProperty(n)&&(r=a[n],r!=null))switch(n){case"value":l=r;break;case"defaultValue":i=r;break;case"children":o=r;break;case"dangerouslySetInnerHTML":if(r!=null)throw Error(x(91));break;default:$(t,e,n,r,a,null)}Dp(t,l,i,o);return;case"option":for(u in a)a.hasOwnProperty(u)&&(l=a[u],l!=null)&&(u==="selected"?t.selected=l&&typeof l!="function"&&typeof l!="symbol":$(t,e,u,l,a,null));return;case"dialog":Q("beforetoggle",t),Q("toggle",t),Q("cancel",t),Q("close",t);break;case"iframe":case"object":Q("load",t);break;case"video":case"audio":for(l=0;l<eo.length;l++)Q(eo[l],t);break;case"image":Q("error",t),Q("load",t);break;case"details":Q("toggle",t);break;case"embed":case"source":case"link":Q("error",t),Q("load",t);case"area":case"base":case"br":case"col":case"hr":case"keygen":case"meta":case"param":case"track":case"wbr":case"menuitem":for(s in a)if(a.hasOwnProperty(s)&&(l=a[s],l!=null))switch(s){case"children":case"dangerouslySetInnerHTML":throw Error(x(137,e));default:$(t,e,s,l,a,null)}return;default:if(ss(e)){for(p in a)a.hasOwnProperty(p)&&(l=a[p],l!==void 0&&Zu(t,e,p,l,a,void 0));return}}for(r in a)a.hasOwnProperty(r)&&(l=a[r],l!=null&&$(t,e,r,l,a,null))}function py(t,e,a,l){switch(e){case"div":case"span":case"svg":case"path":case"a":case"g":case"p":case"li":break;case"input":var i=null,o=null,n=null,r=null,u=null,s=null,p=null;for(h in a){var d=a[h];if(a.hasOwnProperty(h)&&d!=null)switch(h){case"checked":break;case"value":break;case"defaultValue":u=d;default:l.hasOwnProperty(h)||$(t,e,h,null,l,d)}}for(var c in l){var h=l[c];if(d=a[c],l.hasOwnProperty(c)&&(h!=null||d!=null))switch(c){case"type":o=h;break;case"name":i=h;break;case"checked":s=h;break;case"defaultChecked":p=h;break;case"value":n=h;break;case"defaultValue":r=h;break;case"children":case"dangerouslySetInnerHTML":if(h!=null)throw Error(x(137,e));break;default:h!==d&&$(t,e,c,h,l,d)}}yu(t,n,r,u,s,p,o,i);return;case"select":h=n=r=c=null;for(o in a)if(u=a[o],a.hasOwnProperty(o)&&u!=null)switch(o){case"value":break;case"multiple":h=u;default:l.hasOwnProperty(o)||$(t,e,o,null,l,u)}for(i in l)if(o=l[i],u=a[i],l.hasOwnProperty(i)&&(o!=null||u!=null))switch(i){case"value":c=o;break;case"defaultValue":r=o;break;case"multiple":n=o;default:o!==u&&$(t,e,i,o,l,u)}e=r,a=n,l=h,c!=null?Fl(t,!!a,c,!1):!!l!=!!a&&(e!=null?Fl(t,!!a,e,!0):Fl(t,!!a,a?[]:"",!1));return;case"textarea":h=c=null;for(r in a)if(i=a[r],a.hasOwnProperty(r)&&i!=null&&!l.hasOwnProperty(r))switch(r){case"value":break;case"children":break;default:$(t,e,r,null,l,i)}for(n in l)if(i=l[n],o=a[n],l.hasOwnProperty(n)&&(i!=null||o!=null))switch(n){case"value":c=i;break;case"defaultValue":h=i;break;case"children":break;case"dangerouslySetInnerHTML":if(i!=null)throw Error(x(91));break;default:i!==o&&$(t,e,n,i,l,o)}Rp(t,c,h);return;case"option":for(var y in a)c=a[y],a.hasOwnProperty(y)&&c!=null&&!l.hasOwnProperty(y)&&(y==="selected"?t.selected=!1:$(t,e,y,null,l,c));for(u in l)c=l[u],h=a[u],l.hasOwnProperty(u)&&c!==h&&(c!=null||h!=null)&&(u==="selected"?t.selected=c&&typeof c!="function"&&typeof c!="symbol":$(t,e,u,c,l,h));return;case"img":case"link":case"area":case"base":case"br":case"col":case"embed":case"hr":case"keygen":case"meta":case"param":case"source":case"track":case"wbr":case"menuitem":for(var S in a)c=a[S],a.hasOwnProperty(S)&&c!=null&&!l.hasOwnProperty(S)&&$(t,e,S,null,l,c);for(s in l)if(c=l[s],h=a[s],l.hasOwnProperty(s)&&c!==h&&(c!=null||h!=null))switch(s){case"children":case"dangerouslySetInnerHTML":if(c!=null)throw Error(x(137,e));break;default:$(t,e,s,c,l,h)}return;default:if(ss(e)){for(var A in a)c=a[A],a.hasOwnProperty(A)&&c!==void 0&&!l.hasOwnProperty(A)&&Zu(t,e,A,void 0,l,c);for(p in l)c=l[p],h=a[p],!l.hasOwnProperty(p)||c===h||c===void 0&&h===void 0||Zu(t,e,p,c,l,h);return}}for(var f in a)c=a[f],a.hasOwnProperty(f)&&c!=null&&!l.hasOwnProperty(f)&&$(t,e,f,null,l,c);for(d in l)c=l[d],h=a[d],!l.hasOwnProperty(d)||c===h||c==null&&h==null||$(t,e,d,c,l,h)}function Zm(t){switch(t){case"css":case"script":case"font":case"img":case"image":case"input":case"link":return!0;default:return!1}}function dy(){if(typeof performance.getEntriesByType=="function"){for(var t=0,e=0,a=performance.getEntriesByType("resource"),l=0;l<a.length;l++){var i=a[l],o=i.transferSize,n=i.initiatorType,r=i.duration;if(o&&r&&Zm(n)){for(n=0,r=i.responseEnd,l+=1;l<a.length;l++){var u=a[l],s=u.startTime;if(s>r)break;var p=u.transferSize,d=u.initiatorType;p&&Zm(d)&&(u=u.responseEnd,n+=p*(u<r?1:(r-s)/(u-s)))}if(--l,e+=8*(o+n)/(i.duration/1e3),t++,10<t)break}}if(0<t)return e/t/1e6}return navigator.connection&&(t=navigator.connection.downlink,typeof t=="number")?t:5}var Ku=null,Wu=null;function Un(t){return t.nodeType===9?t:t.ownerDocument}function Km(t){switch(t){case"http://www.w3.org/2000/svg":return 1;case"http://www.w3.org/1998/Math/MathML":return 2;default:return 0}}function Vd(t,e){if(t===0)switch(e){case"svg":return 1;case"math":return 2;default:return 0}return t===1&&e==="foreignObject"?0:t}function Ju(t,e){return t==="textarea"||t==="noscript"||typeof e.children=="string"||typeof e.children=="number"||typeof e.children=="bigint"||typeof e.dangerouslySetInnerHTML=="object"&&e.dangerouslySetInnerHTML!==null&&e.dangerouslySetInnerHTML.__html!=null}var nu=null;function hy(){var t=window.event;return t&&t.type==="popstate"?t===nu?!1:(nu=t,!0):(nu=null,!1)}var Hd=typeof setTimeout=="function"?setTimeout:void 0,gy=typeof clearTimeout=="function"?clearTimeout:void 0,Wm=typeof Promise=="function"?Promise:void 0,vy=typeof queueMicrotask=="function"?queueMicrotask:typeof Wm<"u"?function(t){return Wm.resolve(null).then(t).catch(yy)}:Hd;function yy(t){setTimeout(function(){throw t})}function Ka(t){return t==="head"}function Jm(t,e){var a=e,l=0;do{var i=a.nextSibling;if(t.removeChild(a),i&&i.nodeType===8)if(a=i.data,a==="/$"||a==="/&"){if(l===0){t.removeChild(i),li(e);return}l--}else if(a==="$"||a==="$?"||a==="$~"||a==="$!"||a==="&")l++;else if(a==="html")ji(t.ownerDocument.documentElement);else if(a==="head"){a=t.ownerDocument.head,ji(a);for(var o=a.firstChild;o;){var n=o.nextSibling,r=o.nodeName;o[co]||r==="SCRIPT"||r==="STYLE"||r==="LINK"&&o.rel.toLowerCase()==="stylesheet"||a.removeChild(o),o=n}}else a==="body"&&ji(t.ownerDocument.body);a=i}while(a);li(e)}function Im(t,e){var a=t;t=0;do{var l=a.nextSibling;if(a.nodeType===1?e?(a._stashedDisplay=a.style.display,a.style.display="none"):(a.style.display=a._stashedDisplay||"",a.getAttribute("style")===""&&a.removeAttribute("style")):a.nodeType===3&&(e?(a._stashedText=a.nodeValue,a.nodeValue=""):a.nodeValue=a._stashedText||""),l&&l.nodeType===8)if(a=l.data,a==="/$"){if(t===0)break;t--}else a!=="$"&&a!=="$?"&&a!=="$~"&&a!=="$!"||t++;a=l}while(a)}function Iu(t){var e=t.firstChild;for(e&&e.nodeType===10&&(e=e.nextSibling);e;){var a=e;switch(e=e.nextSibling,a.nodeName){case"HTML":case"HEAD":case"BODY":Iu(a),us(a);continue;case"SCRIPT":case"STYLE":continue;case"LINK":if(a.rel.toLowerCase()==="stylesheet")continue}t.removeChild(a)}}function Sy(t,e,a,l){for(;t.nodeType===1;){var i=a;if(t.nodeName.toLowerCase()!==e.toLowerCase()){if(!l&&(t.nodeName!=="INPUT"||t.type!=="hidden"))break}else if(l){if(!t[co])switch(e){case"meta":if(!t.hasAttribute("itemprop"))break;return t;case"link":if(o=t.getAttribute("rel"),o==="stylesheet"&&t.hasAttribute("data-precedence"))break;if(o!==i.rel||t.getAttribute("href")!==(i.href==null||i.href===""?null:i.href)||t.getAttribute("crossorigin")!==(i.crossOrigin==null?null:i.crossOrigin)||t.getAttribute("title")!==(i.title==null?null:i.title))break;return t;case"style":if(t.hasAttribute("data-precedence"))break;return t;case"script":if(o=t.getAttribute("src"),(o!==(i.src==null?null:i.src)||t.getAttribute("type")!==(i.type==null?null:i.type)||t.getAttribute("crossorigin")!==(i.crossOrigin==null?null:i.crossOrigin))&&o&&t.hasAttribute("async")&&!t.hasAttribute("itemprop"))break;return t;default:return t}}else if(e==="input"&&t.type==="hidden"){var o=i.name==null?null:""+i.name;if(i.type==="hidden"&&t.getAttribute("name")===o)return t}else return t;if(t=He(t.nextSibling),t===null)break}return null}function Ay(t,e,a){if(e==="")return null;for(;t.nodeType!==3;)if((t.nodeType!==1||t.nodeName!=="INPUT"||t.type!=="hidden")&&!a||(t=He(t.nextSibling),t===null))return null;return t}function Qd(t,e){for(;t.nodeType!==8;)if((t.nodeType!==1||t.nodeName!=="INPUT"||t.type!=="hidden")&&!e||(t=He(t.nextSibling),t===null))return null;return t}function Pu(t){return t.data==="$?"||t.data==="$~"}function $u(t){return t.data==="$!"||t.data==="$?"&&t.ownerDocument.readyState!=="loading"}function xy(t,e){var a=t.ownerDocument;if(t.data==="$~")t._reactRetry=e;else if(t.data!=="$?"||a.readyState!=="loading")e();else{var l=function(){e(),a.removeEventListener("DOMContentLoaded",l)};a.addEventListener("DOMContentLoaded",l),t._reactRetry=l}}function He(t){for(;t!=null;t=t.nextSibling){var e=t.nodeType;if(e===1||e===3)break;if(e===8){if(e=t.data,e==="$"||e==="$!"||e==="$?"||e==="$~"||e==="&"||e==="F!"||e==="F")break;if(e==="/$"||e==="/&")return null}}return t}var ts=null;function Pm(t){t=t.nextSibling;for(var e=0;t;){if(t.nodeType===8){var a=t.data;if(a==="/$"||a==="/&"){if(e===0)return He(t.nextSibling);e--}else a!=="$"&&a!=="$!"&&a!=="$?"&&a!=="$~"&&a!=="&"||e++}t=t.nextSibling}return null}function $m(t){t=t.previousSibling;for(var e=0;t;){if(t.nodeType===8){var a=t.data;if(a==="$"||a==="$!"||a==="$?"||a==="$~"||a==="&"){if(e===0)return t;e--}else a!=="/$"&&a!=="/&"||e++}t=t.previousSibling}return null}function Yd(t,e,a){switch(e=Un(a),t){case"html":if(t=e.documentElement,!t)throw Error(x(452));return t;case"head":if(t=e.head,!t)throw Error(x(453));return t;case"body":if(t=e.body,!t)throw Error(x(454));return t;default:throw Error(x(451))}}function ji(t){for(var e=t.attributes;e.length;)t.removeAttributeNode(e[0]);us(t)}var Qe=new Map,tp=new Set;function Rn(t){return typeof t.getRootNode=="function"?t.getRootNode():t.nodeType===9?t:t.ownerDocument}var Aa=Z.d;Z.d={f:by,r:_y,D:By,C:Ey,L:Cy,m:zy,X:My,S:Ty,M:Uy};function by(){var t=Aa.f(),e=Kn();return t||e}function _y(t){var e=oi(t);e!==null&&e.tag===5&&e.type==="form"?O0(e):Aa.r(t)}var si=typeof document>"u"?null:document;function Fd(t,e,a){var l=si;if(l&&typeof e=="string"&&e){var i=we(e);i='link[rel="'+t+'"][href="'+i+'"]',typeof a=="string"&&(i+='[crossorigin="'+a+'"]'),tp.has(i)||(tp.add(i),t={rel:t,crossOrigin:a,href:e},l.querySelector(i)===null&&(e=l.createElement("link"),Ft(e,"link",t),Dt(e),l.head.appendChild(e)))}}function By(t){Aa.D(t),Fd("dns-prefetch",t,null)}function Ey(t,e){Aa.C(t,e),Fd("preconnect",t,e)}function Cy(t,e,a){Aa.L(t,e,a);var l=si;if(l&&t&&e){var i='link[rel="preload"][as="'+we(e)+'"]';e==="image"&&a&&a.imageSrcSet?(i+='[imagesrcset="'+we(a.imageSrcSet)+'"]',typeof a.imageSizes=="string"&&(i+='[imagesizes="'+we(a.imageSizes)+'"]')):i+='[href="'+we(t)+'"]';var o=i;switch(e){case"style":o=ai(t);break;case"script":o=ci(t)}Qe.has(o)||(t=ct({rel:"preload",href:e==="image"&&a&&a.imageSrcSet?void 0:t,as:e},a),Qe.set(o,t),l.querySelector(i)!==null||e==="style"&&l.querySelector(vo(o))||e==="script"&&l.querySelector(yo(o))||(e=l.createElement("link"),Ft(e,"link",t),Dt(e),l.head.appendChild(e)))}}function zy(t,e){Aa.m(t,e);var a=si;if(a&&t){var l=e&&typeof e.as=="string"?e.as:"script",i='link[rel="modulepreload"][as="'+we(l)+'"][href="'+we(t)+'"]',o=i;switch(l){case"audioworklet":case"paintworklet":case"serviceworker":case"sharedworker":case"worker":case"script":o=ci(t)}if(!Qe.has(o)&&(t=ct({rel:"modulepreload",href:t},e),Qe.set(o,t),a.querySelector(i)===null)){switch(l){case"audioworklet":case"paintworklet":case"serviceworker":case"sharedworker":case"worker":case"script":if(a.querySelector(yo(o)))return}l=a.createElement("link"),Ft(l,"link",t),Dt(l),a.head.appendChild(l)}}}function Ty(t,e,a){Aa.S(t,e,a);var l=si;if(l&&t){var i=Yl(l).hoistableStyles,o=ai(t);e=e||"default";var n=i.get(o);if(!n){var r={loading:0,preload:null};if(n=l.querySelector(vo(o)))r.loading=5;else{t=ct({rel:"stylesheet",href:t,"data-precedence":e},a),(a=Qe.get(o))&&Zs(t,a);var u=n=l.createElement("link");Dt(u),Ft(u,"link",t),u._p=new Promise(function(s,p){u.onload=s,u.onerror=p}),u.addEventListener("load",function(){r.loading|=1}),u.addEventListener("error",function(){r.loading|=2}),r.loading|=4,an(n,e,l)}n={type:"stylesheet",instance:n,count:1,state:r},i.set(o,n)}}}function My(t,e){Aa.X(t,e);var a=si;if(a&&t){var l=Yl(a).hoistableScripts,i=ci(t),o=l.get(i);o||(o=a.querySelector(yo(i)),o||(t=ct({src:t,async:!0},e),(e=Qe.get(i))&&Ks(t,e),o=a.createElement("script"),Dt(o),Ft(o,"link",t),a.head.appendChild(o)),o={type:"script",instance:o,count:1,state:null},l.set(i,o))}}function Uy(t,e){Aa.M(t,e);var a=si;if(a&&t){var l=Yl(a).hoistableScripts,i=ci(t),o=l.get(i);o||(o=a.querySelector(yo(i)),o||(t=ct({src:t,async:!0,type:"module"},e),(e=Qe.get(i))&&Ks(t,e),o=a.createElement("script"),Dt(o),Ft(o,"link",t),a.head.appendChild(o)),o={type:"script",instance:o,count:1,state:null},l.set(i,o))}}function ep(t,e,a,l){var i=(i=wa.current)?Rn(i):null;if(!i)throw Error(x(446));switch(t){case"meta":case"title":return null;case"style":return typeof a.precedence=="string"&&typeof a.href=="string"?(e=ai(a.href),a=Yl(i).hoistableStyles,l=a.get(e),l||(l={type:"style",instance:null,count:0,state:null},a.set(e,l)),l):{type:"void",instance:null,count:0,state:null};case"link":if(a.rel==="stylesheet"&&typeof a.href=="string"&&typeof a.precedence=="string"){t=ai(a.href);var o=Yl(i).hoistableStyles,n=o.get(t);if(n||(i=i.ownerDocument||i,n={type:"stylesheet",instance:null,count:0,state:{loading:0,preload:null}},o.set(t,n),(o=i.querySelector(vo(t)))&&!o._p&&(n.instance=o,n.state.loading=5),Qe.has(t)||(a={rel:"preload",as:"style",href:a.href,crossOrigin:a.crossOrigin,integrity:a.integrity,media:a.media,hrefLang:a.hrefLang,referrerPolicy:a.referrerPolicy},Qe.set(t,a),o||Ry(i,t,a,n.state))),e&&l===null)throw Error(x(528,""));return n}if(e&&l!==null)throw Error(x(529,""));return null;case"script":return e=a.async,a=a.src,typeof a=="string"&&e&&typeof e!="function"&&typeof e!="symbol"?(e=ci(a),a=Yl(i).hoistableScripts,l=a.get(e),l||(l={type:"script",instance:null,count:0,state:null},a.set(e,l)),l):{type:"void",instance:null,count:0,state:null};default:throw Error(x(444,t))}}function ai(t){return'href="'+we(t)+'"'}function vo(t){return'link[rel="stylesheet"]['+t+"]"}function qd(t){return ct({},t,{"data-precedence":t.precedence,precedence:null})}function Ry(t,e,a,l){t.querySelector('link[rel="preload"][as="style"]['+e+"]")?l.loading=1:(e=t.createElement("link"),l.preload=e,e.addEventListener("load",function(){return l.loading|=1}),e.addEventListener("error",function(){return l.loading|=2}),Ft(e,"link",a),Dt(e),t.head.appendChild(e))}function ci(t){return'[src="'+we(t)+'"]'}function yo(t){return"script[async]"+t}function ap(t,e,a){if(e.count++,e.instance===null)switch(e.type){case"style":var l=t.querySelector('style[data-href~="'+we(a.href)+'"]');if(l)return e.instance=l,Dt(l),l;var i=ct({},a,{"data-href":a.href,"data-precedence":a.precedence,href:null,precedence:null});return l=(t.ownerDocument||t).createElement("style"),Dt(l),Ft(l,"style",i),an(l,a.precedence,t),e.instance=l;case"stylesheet":i=ai(a.href);var o=t.querySelector(vo(i));if(o)return e.state.loading|=4,e.instance=o,Dt(o),o;l=qd(a),(i=Qe.get(i))&&Zs(l,i),o=(t.ownerDocument||t).createElement("link"),Dt(o);var n=o;return n._p=new Promise(function(r,u){n.onload=r,n.onerror=u}),Ft(o,"link",l),e.state.loading|=4,an(o,a.precedence,t),e.instance=o;case"script":return o=ci(a.src),(i=t.querySelector(yo(o)))?(e.instance=i,Dt(i),i):(l=a,(i=Qe.get(o))&&(l=ct({},a),Ks(l,i)),t=t.ownerDocument||t,i=t.createElement("script"),Dt(i),Ft(i,"link",l),t.head.appendChild(i),e.instance=i);case"void":return null;default:throw Error(x(443,e.type))}else e.type==="stylesheet"&&(e.state.loading&4)===0&&(l=e.instance,e.state.loading|=4,an(l,a.precedence,t));return e.instance}function an(t,e,a){for(var l=a.querySelectorAll('link[rel="stylesheet"][data-precedence],style[data-precedence]'),i=l.length?l[l.length-1]:null,o=i,n=0;n<l.length;n++){var r=l[n];if(r.dataset.precedence===e)o=r;else if(o!==i)break}o?o.parentNode.insertBefore(t,o.nextSibling):(e=a.nodeType===9?a.head:a,e.insertBefore(t,e.firstChild))}function Zs(t,e){t.crossOrigin==null&&(t.crossOrigin=e.crossOrigin),t.referrerPolicy==null&&(t.referrerPolicy=e.referrerPolicy),t.title==null&&(t.title=e.title)}function Ks(t,e){t.crossOrigin==null&&(t.crossOrigin=e.crossOrigin),t.referrerPolicy==null&&(t.referrerPolicy=e.referrerPolicy),t.integrity==null&&(t.integrity=e.integrity)}var ln=null;function lp(t,e,a){if(ln===null){var l=new Map,i=ln=new Map;i.set(a,l)}else i=ln,l=i.get(a),l||(l=new Map,i.set(a,l));if(l.has(t))return l;for(l.set(t,null),a=a.getElementsByTagName(t),i=0;i<a.length;i++){var o=a[i];if(!(o[co]||o[Ht]||t==="link"&&o.getAttribute("rel")==="stylesheet")&&o.namespaceURI!=="http://www.w3.org/2000/svg"){var n=o.getAttribute(e)||"";n=t+n;var r=l.get(n);r?r.push(o):l.set(n,[o])}}return l}function ip(t,e,a){t=t.ownerDocument||t,t.head.insertBefore(a,e==="title"?t.querySelector("head > title"):null)}function Dy(t,e,a){if(a===1||e.itemProp!=null)return!1;switch(t){case"meta":case"title":return!0;case"style":if(typeof e.precedence!="string"||typeof e.href!="string"||e.href==="")break;return!0;case"link":if(typeof e.rel!="string"||typeof e.href!="string"||e.href===""||e.onLoad||e.onError)break;return e.rel==="stylesheet"?(t=e.disabled,typeof e.precedence=="string"&&t==null):!0;case"script":if(e.async&&typeof e.async!="function"&&typeof e.async!="symbol"&&!e.onLoad&&!e.onError&&e.src&&typeof e.src=="string")return!0}return!1}function Ld(t){return!(t.type==="stylesheet"&&(t.state.loading&3)===0)}function Oy(t,e,a,l){if(a.type==="stylesheet"&&(typeof l.media!="string"||matchMedia(l.media).matches!==!1)&&(a.state.loading&4)===0){if(a.instance===null){var i=ai(l.href),o=e.querySelector(vo(i));if(o){e=o._p,e!==null&&typeof e=="object"&&typeof e.then=="function"&&(t.count++,t=Dn.bind(t),e.then(t,t)),a.state.loading|=4,a.instance=o,Dt(o);return}o=e.ownerDocument||e,l=qd(l),(i=Qe.get(i))&&Zs(l,i),o=o.createElement("link"),Dt(o);var n=o;n._p=new Promise(function(r,u){n.onload=r,n.onerror=u}),Ft(o,"link",l),a.instance=o}t.stylesheets===null&&(t.stylesheets=new Map),t.stylesheets.set(a,e),(e=a.state.preload)&&(a.state.loading&3)===0&&(t.count++,a=Dn.bind(t),e.addEventListener("load",a),e.addEventListener("error",a))}}var ru=0;function wy(t,e){return t.stylesheets&&t.count===0&&on(t,t.stylesheets),0<t.count||0<t.imgCount?function(a){var l=setTimeout(function(){if(t.stylesheets&&on(t,t.stylesheets),t.unsuspend){var o=t.unsuspend;t.unsuspend=null,o()}},6e4+e);0<t.imgBytes&&ru===0&&(ru=62500*dy());var i=setTimeout(function(){if(t.waitingForImages=!1,t.count===0&&(t.stylesheets&&on(t,t.stylesheets),t.unsuspend)){var o=t.unsuspend;t.unsuspend=null,o()}},(t.imgBytes>ru?50:800)+e);return t.unsuspend=a,function(){t.unsuspend=null,clearTimeout(l),clearTimeout(i)}}:null}function Dn(){if(this.count--,this.count===0&&(this.imgCount===0||!this.waitingForImages)){if(this.stylesheets)on(this,this.stylesheets);else if(this.unsuspend){var t=this.unsuspend;this.unsuspend=null,t()}}}var On=null;function on(t,e){t.stylesheets=null,t.unsuspend!==null&&(t.count++,On=new Map,e.forEach(Ny,t),On=null,Dn.call(t))}function Ny(t,e){if(!(e.state.loading&4)){var a=On.get(t);if(a)var l=a.get(null);else{a=new Map,On.set(t,a);for(var i=t.querySelectorAll("link[data-precedence],style[data-precedence]"),o=0;o<i.length;o++){var n=i[o];(n.nodeName==="LINK"||n.getAttribute("media")!=="not all")&&(a.set(n.dataset.precedence,n),l=n)}l&&a.set(null,l)}i=e.instance,n=i.getAttribute("data-precedence"),o=a.get(n)||l,o===l&&a.set(null,i),a.set(n,i),this.count++,l=Dn.bind(this),i.addEventListener("load",l),i.addEventListener("error",l),o?o.parentNode.insertBefore(i,o.nextSibling):(t=t.nodeType===9?t.head:t,t.insertBefore(i,t.firstChild)),e.state.loading|=4}}var lo={$$typeof:sa,Provider:null,Consumer:null,_currentValue:al,_currentValue2:al,_threadCount:0};function Gy(t,e,a,l,i,o,n,r,u){this.tag=1,this.containerInfo=t,this.pingCache=this.current=this.pendingChildren=null,this.timeoutHandle=-1,this.callbackNode=this.next=this.pendingContext=this.context=this.cancelPendingCommit=null,this.callbackPriority=0,this.expirationTimes=Or(-1),this.entangledLanes=this.shellSuspendCounter=this.errorRecoveryDisabledLanes=this.expiredLanes=this.warmLanes=this.pingedLanes=this.suspendedLanes=this.pendingLanes=0,this.entanglements=Or(0),this.hiddenUpdates=Or(null),this.identifierPrefix=l,this.onUncaughtError=i,this.onCaughtError=o,this.onRecoverableError=n,this.pooledCache=null,this.pooledCacheLanes=0,this.formState=u,this.incompleteTransitions=new Map}function Xd(t,e,a,l,i,o,n,r,u,s,p,d){return t=new Gy(t,e,a,n,u,s,p,d,r),e=1,o===!0&&(e|=24),o=ve(3,null,null,e),t.current=o,o.stateNode=t,e=As(),e.refCount++,t.pooledCache=e,e.refCount++,o.memoizedState={element:l,isDehydrated:a,cache:e},_s(o),t}function jd(t){return t?(t=Gl,t):Gl}function kd(t,e,a,l,i,o){i=jd(i),l.context===null?l.context=i:l.pendingContext=i,l=Ga(e),l.payload={element:a},o=o===void 0?null:o,o!==null&&(l.callback=o),a=Va(t,l,e),a!==null&&(me(a,t,e),Vi(a,t,e))}function op(t,e){if(t=t.memoizedState,t!==null&&t.dehydrated!==null){var a=t.retryLane;t.retryLane=a!==0&&a<e?a:e}}function Ws(t,e){op(t,e),(t=t.alternate)&&op(t,e)}function Zd(t){if(t.tag===13||t.tag===31){var e=hl(t,67108864);e!==null&&me(e,t,67108864),Ws(t,67108864)}}function np(t){if(t.tag===13||t.tag===31){var e=be();e=ns(e);var a=hl(t,e);a!==null&&me(a,t,e),Ws(t,e)}}var wn=!0;function Vy(t,e,a,l){var i=R.T;R.T=null;var o=Z.p;try{Z.p=2,Js(t,e,a,l)}finally{Z.p=o,R.T=i}}function Hy(t,e,a,l){var i=R.T;R.T=null;var o=Z.p;try{Z.p=8,Js(t,e,a,l)}finally{Z.p=o,R.T=i}}function Js(t,e,a,l){if(wn){var i=es(l);if(i===null)ou(t,e,l,Nn,a),rp(t,l);else if(Yy(i,t,e,a,l))l.stopPropagation();else if(rp(t,l),e&4&&-1<Qy.indexOf(t)){for(;i!==null;){var o=oi(i);if(o!==null)switch(o.tag){case 3:if(o=o.stateNode,o.current.memoizedState.isDehydrated){var n=$a(o.pendingLanes);if(n!==0){var r=o;for(r.pendingLanes|=2,r.entangledLanes|=2;n;){var u=1<<31-xe(n);r.entanglements[1]|=u,n&=~u}Pe(o),(k&6)===0&&(Bn=Se()+500,go(0,!1))}}break;case 31:case 13:r=hl(o,2),r!==null&&me(r,o,2),Kn(),Ws(o,2)}if(o=es(l),o===null&&ou(t,e,l,Nn,a),o===i)break;i=o}i!==null&&l.stopPropagation()}else ou(t,e,l,null,a)}}function es(t){return t=cs(t),Is(t)}var Nn=null;function Is(t){if(Nn=null,t=Ul(t),t!==null){var e=no(t);if(e===null)t=null;else{var a=e.tag;if(a===13){if(t=pp(e),t!==null)return t;t=null}else if(a===31){if(t=dp(e),t!==null)return t;t=null}else if(a===3){if(e.stateNode.current.memoizedState.isDehydrated)return e.tag===3?e.stateNode.containerInfo:null;t=null}else e!==t&&(t=null)}}return Nn=t,null}function Kd(t){switch(t){case"beforetoggle":case"cancel":case"click":case"close":case"contextmenu":case"copy":case"cut":case"auxclick":case"dblclick":case"dragend":case"dragstart":case"drop":case"focusin":case"focusout":case"input":case"invalid":case"keydown":case"keypress":case"keyup":case"mousedown":case"mouseup":case"paste":case"pause":case"play":case"pointercancel":case"pointerdown":case"pointerup":case"ratechange":case"reset":case"resize":case"seeked":case"submit":case"toggle":case"touchcancel":case"touchend":case"touchstart":case"volumechange":case"change":case"selectionchange":case"textInput":case"compositionstart":case"compositionend":case"compositionupdate":case"beforeblur":case"afterblur":case"beforeinput":case"blur":case"fullscreenchange":case"focus":case"hashchange":case"popstate":case"select":case"selectstart":return 2;case"drag":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"mousemove":case"mouseout":case"mouseover":case"pointermove":case"pointerout":case"pointerover":case"scroll":case"touchmove":case"wheel":case"mouseenter":case"mouseleave":case"pointerenter":case"pointerleave":return 8;case"message":switch(C1()){case yp:return 2;case Sp:return 8;case cn:case z1:return 32;case Ap:return 268435456;default:return 32}default:return 32}}var as=!1,Ya=null,Fa=null,qa=null,io=new Map,oo=new Map,Ta=[],Qy="mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(" ");function rp(t,e){switch(t){case"focusin":case"focusout":Ya=null;break;case"dragenter":case"dragleave":Fa=null;break;case"mouseover":case"mouseout":qa=null;break;case"pointerover":case"pointerout":io.delete(e.pointerId);break;case"gotpointercapture":case"lostpointercapture":oo.delete(e.pointerId)}}function Ci(t,e,a,l,i,o){return t===null||t.nativeEvent!==o?(t={blockedOn:e,domEventName:a,eventSystemFlags:l,nativeEvent:o,targetContainers:[i]},e!==null&&(e=oi(e),e!==null&&Zd(e)),t):(t.eventSystemFlags|=l,e=t.targetContainers,i!==null&&e.indexOf(i)===-1&&e.push(i),t)}function Yy(t,e,a,l,i){switch(e){case"focusin":return Ya=Ci(Ya,t,e,a,l,i),!0;case"dragenter":return Fa=Ci(Fa,t,e,a,l,i),!0;case"mouseover":return qa=Ci(qa,t,e,a,l,i),!0;case"pointerover":var o=i.pointerId;return io.set(o,Ci(io.get(o)||null,t,e,a,l,i)),!0;case"gotpointercapture":return o=i.pointerId,oo.set(o,Ci(oo.get(o)||null,t,e,a,l,i)),!0}return!1}function Wd(t){var e=Ul(t.target);if(e!==null){var a=no(e);if(a!==null){if(e=a.tag,e===13){if(e=pp(a),e!==null){t.blockedOn=e,Xf(t.priority,function(){np(a)});return}}else if(e===31){if(e=dp(a),e!==null){t.blockedOn=e,Xf(t.priority,function(){np(a)});return}}else if(e===3&&a.stateNode.current.memoizedState.isDehydrated){t.blockedOn=a.tag===3?a.stateNode.containerInfo:null;return}}}t.blockedOn=null}function nn(t){if(t.blockedOn!==null)return!1;for(var e=t.targetContainers;0<e.length;){var a=es(t.nativeEvent);if(a===null){a=t.nativeEvent;var l=new a.constructor(a.type,a);Au=l,a.target.dispatchEvent(l),Au=null}else return e=oi(a),e!==null&&Zd(e),t.blockedOn=a,!1;e.shift()}return!0}function up(t,e,a){nn(t)&&a.delete(e)}function Fy(){as=!1,Ya!==null&&nn(Ya)&&(Ya=null),Fa!==null&&nn(Fa)&&(Fa=null),qa!==null&&nn(qa)&&(qa=null),io.forEach(up),oo.forEach(up)}function Lo(t,e){t.blockedOn===e&&(t.blockedOn=null,as||(as=!0,Tt.unstable_scheduleCallback(Tt.unstable_NormalPriority,Fy)))}var Xo=null;function sp(t){Xo!==t&&(Xo=t,Tt.unstable_scheduleCallback(Tt.unstable_NormalPriority,function(){Xo===t&&(Xo=null);for(var e=0;e<t.length;e+=3){var a=t[e],l=t[e+1],i=t[e+2];if(typeof l!="function"){if(Is(l||a)===null)continue;break}var o=oi(a);o!==null&&(t.splice(e,3),e-=3,Gu(o,{pending:!0,data:i,method:a.method,action:l},l,i))}}))}function li(t){function e(u){return Lo(u,t)}Ya!==null&&Lo(Ya,t),Fa!==null&&Lo(Fa,t),qa!==null&&Lo(qa,t),io.forEach(e),oo.forEach(e);for(var a=0;a<Ta.length;a++){var l=Ta[a];l.blockedOn===t&&(l.blockedOn=null)}for(;0<Ta.length&&(a=Ta[0],a.blockedOn===null);)Wd(a),a.blockedOn===null&&Ta.shift();if(a=(t.ownerDocument||t).$$reactFormReplay,a!=null)for(l=0;l<a.length;l+=3){var i=a[l],o=a[l+1],n=i[pe]||null;if(typeof o=="function")n||sp(a);else if(n){var r=null;if(o&&o.hasAttribute("formAction")){if(i=o,n=o[pe]||null)r=n.formAction;else if(Is(i)!==null)continue}else r=n.action;typeof r=="function"?a[l+1]=r:(a.splice(l,3),l-=3),sp(a)}}}function Jd(){function t(o){o.canIntercept&&o.info==="react-transition"&&o.intercept({handler:function(){return new Promise(function(n){return i=n})},focusReset:"manual",scroll:"manual"})}function e(){i!==null&&(i(),i=null),l||setTimeout(a,20)}function a(){if(!l&&!navigation.transition){var o=navigation.currentEntry;o&&o.url!=null&&navigation.navigate(o.url,{state:o.getState(),info:"react-transition",history:"replace"})}}if(typeof navigation=="object"){var l=!1,i=null;return navigation.addEventListener("navigate",t),navigation.addEventListener("navigatesuccess",e),navigation.addEventListener("navigateerror",e),setTimeout(a,100),function(){l=!0,navigation.removeEventListener("navigate",t),navigation.removeEventListener("navigatesuccess",e),navigation.removeEventListener("navigateerror",e),i!==null&&(i(),i=null)}}}function Ps(t){this._internalRoot=t}In.prototype.render=Ps.prototype.render=function(t){var e=this._internalRoot;if(e===null)throw Error(x(409));var a=e.current,l=be();kd(a,l,t,e,null,null)};In.prototype.unmount=Ps.prototype.unmount=function(){var t=this._internalRoot;if(t!==null){this._internalRoot=null;var e=t.containerInfo;kd(t.current,2,null,t,null,null),Kn(),e[ii]=null}};function In(t){this._internalRoot=t}In.prototype.unstable_scheduleHydration=function(t){if(t){var e=Ep();t={blockedOn:null,target:t,priority:e};for(var a=0;a<Ta.length&&e!==0&&e<Ta[a].priority;a++);Ta.splice(a,0,t),a===0&&Wd(t)}};var cp=fp.version;if(cp!=="19.2.3")throw Error(x(527,cp,"19.2.3"));Z.findDOMNode=function(t){var e=t._reactInternals;if(e===void 0)throw typeof t.render=="function"?Error(x(188)):(t=Object.keys(t).join(","),Error(x(268,t)));return t=S1(e),t=t!==null?hp(t):null,t=t===null?null:t.stateNode,t};var qy={bundleType:0,version:"19.2.3",rendererPackageName:"react-dom",currentDispatcherRef:R,reconcilerVersion:"19.2.3"};if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<"u"&&(zi=__REACT_DEVTOOLS_GLOBAL_HOOK__,!zi.isDisabled&&zi.supportsFiber))try{ro=zi.inject(qy),Ae=zi}catch{}var zi;Pn.createRoot=function(t,e){if(!mp(t))throw Error(x(299));var a=!1,l="",i=F0,o=q0,n=L0;return e!=null&&(e.unstable_strictMode===!0&&(a=!0),e.identifierPrefix!==void 0&&(l=e.identifierPrefix),e.onUncaughtError!==void 0&&(i=e.onUncaughtError),e.onCaughtError!==void 0&&(o=e.onCaughtError),e.onRecoverableError!==void 0&&(n=e.onRecoverableError)),e=Xd(t,1,!1,null,null,a,l,null,i,o,n,Jd),t[ii]=e.current,ks(t),new Ps(e)};Pn.hydrateRoot=function(t,e,a){if(!mp(t))throw Error(x(299));var l=!1,i="",o=F0,n=q0,r=L0,u=null;return a!=null&&(a.unstable_strictMode===!0&&(l=!0),a.identifierPrefix!==void 0&&(i=a.identifierPrefix),a.onUncaughtError!==void 0&&(o=a.onUncaughtError),a.onCaughtError!==void 0&&(n=a.onCaughtError),a.onRecoverableError!==void 0&&(r=a.onRecoverableError),a.formState!==void 0&&(u=a.formState)),e=Xd(t,1,!0,e,a??null,l,i,u,o,n,r,Jd),e.context=jd(null),a=e.current,l=be(),l=ns(l),i=Ga(l),i.callback=null,Va(a,i,l),a=l,e.current.lanes=a,so(e,a),Pe(e),t[ii]=e.current,ks(t),new In(e)};Pn.version="19.2.3"});var th=je((X2,$d)=>{"use strict";function Pd(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(Pd)}catch(t){console.error(t)}}Pd(),$d.exports=Id()});var dh=je(tr=>{"use strict";var ky=Symbol.for("react.transitional.element"),Zy=Symbol.for("react.fragment");function ph(t,e,a){var l=null;if(a!==void 0&&(l=""+a),e.key!==void 0&&(l=""+e.key),"key"in e){a={};for(var i in e)i!=="key"&&(a[i]=e[i])}else a=e;return e=a.ref,{$$typeof:ky,type:t,key:l,ref:e!==void 0?e:null,props:a}}tr.Fragment=Zy;tr.jsx=ph;tr.jsxs=ph});var U=je((I2,hh)=>{"use strict";hh.exports=dh()});var qg=B(H()),Lg=B(Ar()),Xg=B(th());var Ee=B(H()),eh=(t,e,a,l)=>{if(l==="identity")return{identity:!0,value:t};if(l==="clamp")return{identity:!1,value:Math.min(a,Math.max(e,t))};if(l==="wrap"){let i=a-e;return{identity:!1,value:i===0?e:((t-e)%i+i)%i+e}}return{identity:!1,value:t}},V=(t,e,a,l={})=>{if(e.length!==a.length||e.length<2)throw new Error("Hyfrme interpolate() requires matching ranges with at least two values");let i=e[0],o=e[e.length-1],n=t<i?eh(t,i,o,l.extrapolateLeft??"extend"):t>o?eh(t,i,o,l.extrapolateRight??"extend"):{identity:!1,value:t};if(n.identity)return n.value;let r=n.value,u=e.length-2;for(let S=0;S<e.length-1;S+=1)if(r<e[S+1]){u=S;break}let s=e[u],p=e[u+1],d=a[u],c=a[u+1],h=p===s?1:(r-s)/(p-s),y=l.easing?l.easing(h):h;return d+(c-d)*y},ah=(t,e,a)=>{let l=1-t;return 3*l*l*t*e+3*l*t*t*a+t*t*t},lh=(t,e,a,l)=>i=>{let o=Math.min(1,Math.max(0,i));if(o===0||o===1)return o;let n=0,r=1;for(let u=0;u<36;u+=1){let s=(n+r)/2;ah(s,t,a)<o?n=s:r=s}return ah((n+r)/2,e,l)},wt=class{static step0(e){return e>0?1:0}static step1(e){return e>=1?1:0}static linear(e){return e}static quad(e){return e*e}static cubic(e){return e*e*e}static ease(e){return lh(.42,0,1,1)(e)}static elastic(e=1){let a=e*Math.PI;return l=>1-Math.cos(l*Math.PI/2)**3*Math.cos(l*a)}static sin(e){return 1-Math.cos(e*Math.PI/2)}static circle(e){let a=Math.min(1,Math.max(0,e));return 1-Math.sqrt(1-a*a)}static exp(e){return 2**(10*(e-1))}static poly(e){return a=>a**e}static back(e=1.70158){return a=>a*a*((e+1)*a-e)}static bounce(e){let a=Math.min(1,Math.max(0,e));if(a<1/2.75)return 7.5625*a*a;if(a<2/2.75){let i=a-.5454545454545454;return 7.5625*i*i+.75}if(a<2.5/2.75){let i=a-.8181818181818182;return 7.5625*i*i+.9375}let l=a-2.625/2.75;return 7.5625*l*l+.984375}static in(e){return e}static out(e){return a=>1-e(1-a)}static inOut(e){return a=>a<.5?e(a*2)/2:1-e((1-a)*2)/2}static bezier(e,a,l,i){return lh(e,a,l,i)}};var ih=(t,e,a={})=>{if(t<=0)return 0;let l=a.stiffness??100,i=a.damping??10,o=a.mass??1,n=a.velocity??0,r=t/e,u=Math.sqrt(l/o),s=i/(2*Math.sqrt(l*o)),p;if(s>=1)p=1-Math.exp(-u*r)*(1+(u-n)*r);else{let d=u*Math.sqrt(1-s*s);p=1-Math.exp(-s*u*r)*(Math.cos(d*r)+(s*u-n)/d*Math.sin(d*r))}return a.overshootClamping?Math.min(1,Math.max(0,p)):p},Ly=(t,e,a)=>{let l=-1;for(let i=0;i<=t*20;i+=1)Math.abs(1-ih(i,t,e))>=a&&(l=i);return l+1},So=({frame:t,fps:e,config:a={},from:l=0,to:i=1,durationInFrames:o,durationRestThreshold:n=.005})=>{let r=o===void 0?t:t*Ly(e,a,n)/o,u=ih(r,e,a);return l+(i-l)*u};var oh=0,nh={fps:30,width:1280,height:720,durationInFrames:1},rh=(0,Ee.createContext)(null);var et=()=>{},N=()=>(0,Ee.useContext)(rh)??oh,F=()=>nh;var Ce=({children:t,className:e,style:a,...l})=>Ee.default.createElement("div",{...l,className:e,style:{position:"absolute",inset:0,width:"100%",height:"100%",display:"flex",flexDirection:"column",...a}},t),$s=({from:t=0,durationInFrames:e=1/0,children:a,layout:l,style:i,className:o})=>{let n=N()-t;if(n<0||n>=e)return null;let r=Ee.default.createElement(rh.Provider,{value:n},a);return l==="none"?r:Ee.default.createElement("div",{className:o,style:{position:"absolute",inset:0,...i}},r)},uh=()=>null,$n=({children:t})=>{let e=0,a=[];for(let[l,i]of Ee.default.Children.toArray(t).entries())!Ee.default.isValidElement(i)||i.type!==uh||(e+=i.props.offset??0,a.push(Ee.default.createElement($s,{key:i.key??l,from:e,durationInFrames:i.props.durationInFrames,layout:i.props.layout,style:i.props.style,className:i.props.className},i.props.children)),e+=i.props.durationInFrames);return Ee.default.createElement(Ee.default.Fragment,null,...a)};$n.Sequence=uh;var sh=(t,e)=>{oh=t,nh=e};var $e=B(H());var tc=()=>null,ch=()=>null,Ao=({durationInFrames:t,easing:e})=>({getDurationInFrames:()=>t,getProgress:({frame:a})=>V(a,[0,t],[0,1],{easing:e,extrapolateLeft:"clamp",extrapolateRight:"clamp"})}),le=({children:t})=>{let e=N(),{fps:a}=F(),l=$e.default.Children.toArray(t),i=0,o=0,n=[];for(let r=0;r<l.length;r+=1){let u=l[r];if(!$e.default.isValidElement(u)||u.type!==ch)continue;let s=l[r-1],p=l[r+1],d=$e.default.isValidElement(s)&&s.type===tc?s:null,c=$e.default.isValidElement(p)&&p.type===tc?p:null,h=i+(u.props.offset??0);d&&(o-=d.props.timing.getDurationInFrames({fps:a}));let y=Math.max(0,h+o);i+=u.props.durationInFrames+(u.props.offset??0);let S=u.props.children;if(c){let A=c.props.timing.getDurationInFrames({fps:a}),f=c.props.timing.getProgress({frame:e-y-u.props.durationInFrames+A,fps:a}),m=c.props.presentation,g=m.component;S=$e.default.createElement(g,{passedProps:m.props??{},presentationDirection:"exiting",presentationProgress:f,presentationDurationInFrames:A,bothEnteringAndExiting:!1},S)}if(d){let A=d.props.timing.getDurationInFrames({fps:a}),f=d.props.timing.getProgress({frame:e-y,fps:a}),m=d.props.presentation,g=m.component;S=$e.default.createElement(g,{passedProps:m.props??{},presentationDirection:"entering",presentationProgress:f,presentationDurationInFrames:A,bothEnteringAndExiting:!1},S)}n.push($e.default.createElement($s,{key:u.key??r,from:y,durationInFrames:u.props.durationInFrames},S))}return $e.default.createElement($e.default.Fragment,null,...n)};le.Sequence=ch;le.Transition=tc;var Xy="Manrope",fh=()=>({fontFamily:Xy,waitUntilDone:()=>Promise.resolve()});var jy="Geist Mono",mh=()=>({fontFamily:jy,waitUntilDone:()=>Promise.resolve()});var er=B(U());function gh({text:t,staggerDelay:e=1,fontSize:a=72,color:l="#171717",fontWeight:i=600,speed:o=1,className:n}){let r=N()*o,{durationInFrames:u}=F(),s=t.split(" "),p=17,d=14,c=wt.bezier(.22,1,.36,1),h=wt.bezier(.64,0,.78,0),y=p+(s.length-1)*e,S=Math.max(y,u-d-(s.length-1)*e);return(0,er.jsx)("div",{style:{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"transparent"},children:(0,er.jsx)("span",{className:n,style:{fontSize:a,fontWeight:i,color:l,letterSpacing:"-0.03em",fontFamily:"var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif"},children:s.map((A,f)=>{let m=r-f*e,g=r-S-f*e,v=V(m,[0,p],[0,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp",easing:c}),_=V(g,[0,d],[0,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp",easing:h}),E=v*(1-_),b=V(m,[0,p],[10,0],{extrapolateLeft:"clamp",extrapolateRight:"clamp",easing:c}),T=V(g,[0,d],[0,-14],{extrapolateLeft:"clamp",extrapolateRight:"clamp",easing:h}),z=b+T,M=V(m,[0,p],[6,0],{extrapolateLeft:"clamp",extrapolateRight:"clamp",easing:c}),K=V(g,[0,d],[0,8],{extrapolateLeft:"clamp",extrapolateRight:"clamp",easing:h}),It=M+K;return(0,er.jsx)("span",{style:{display:"inline-block",marginRight:"0.25em",transformOrigin:"50% 55%",opacity:E,transform:`translateY(${z}px)`,filter:`blur(${It}px)`},children:A},f)})})})}var ar=B(U());function vh({text:t,distance:e=24,staggerDelay:a=3,fontSize:l=72,color:i="#171717",fontWeight:o=600,speed:n=1,className:r}){let u=N()*n,s=t.split(" "),p=16,d=6,c=wt.bezier(.2,.8,.2,1),h=V(u,[0,p],[-e,0],{extrapolateLeft:"clamp",extrapolateRight:"clamp",easing:c}),y=V(u,[0,p],[1.2,0],{extrapolateLeft:"clamp",extrapolateRight:"clamp",easing:c});return(0,ar.jsx)("div",{style:{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"transparent"},children:(0,ar.jsx)("span",{className:r,style:{fontSize:l,fontWeight:o,color:i,letterSpacing:"-0.03em",fontFamily:"var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",display:"inline-block",transform:`translateX(${h}px)`,filter:`blur(${y}px)`},children:s.map((S,A)=>{let f=V(u-A*a,[0,d],[0,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp",easing:c});return(0,ar.jsx)("span",{style:{display:"inline-block",marginRight:"0.25em",opacity:f},children:S},A)})})})}var lr=B(U());function yh({text:t,distance:e=48,fontSize:a=72,color:l="#171717",fontWeight:i=600,speed:o=1,className:n}){let r=N()*o,{durationInFrames:u}=F(),s=t.split(`
`),p=27,d=18,c=4,h=2,y=wt.bezier(.22,1,.36,1),S=wt.bezier(.64,0,.78,0),A=p+(s.length-1)*c,f=Math.max(A,u-d-(s.length-1)*h);return(0,lr.jsx)("div",{style:{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"transparent"},children:(0,lr.jsx)("span",{className:n,style:{fontSize:a,fontWeight:i,color:l,letterSpacing:"-0.03em",lineHeight:1.1,textAlign:"left",fontFamily:"var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif"},children:s.map((m,g)=>{let v=r-g*c,_=r-f-g*h,E=V(v,[0,p],[0,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp",easing:y}),b=V(_,[0,d],[0,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp",easing:S}),T=E*(1-b),z=V(v,[0,p],[-e,0],{extrapolateLeft:"clamp",extrapolateRight:"clamp",easing:y}),M=V(_,[0,d],[0,e],{extrapolateLeft:"clamp",extrapolateRight:"clamp",easing:S}),K=z+M;return(0,lr.jsx)("span",{style:{display:"block",transformOrigin:"0% 50%",opacity:T,transform:`translateX(${K}px)`},children:m},g)})})})}var ir=B(H());var or=B(U()),Ky="var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",Wy='-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';function Jy(t,e,a){if(typeof document>"u")return t.map(i=>i.length*e*.55);let l=document.createElement("canvas").getContext("2d");return l?(l.font=`${a} ${e}px ${Wy}`,t.map(i=>l.measureText(i).width)):t.map(i=>i.length*e*.55)}function Sh({text:t,entryOffset:e=88,fontSize:a=72,color:l="#171717",fontWeight:i=600,speed:o=1,measureScale:n=1,className:r}){let u=N()*o,s=(0,ir.useMemo)(()=>t.split(" "),[t]),p=(0,ir.useMemo)(()=>Jy(s,a,i).map(_=>_*n),[s,a,i,n]),d=10,c=10,h=13,y=.992,S=3.5,A=.8,f=6,m=wt.bezier(.2,.8,.2,1),g=(0,ir.useMemo)(()=>{let _=[];for(let E=1;E<=s.length;E++){let b=d*(E-1);for(let M=0;M<E;M++)b+=p[M];let T=-b/2,z=[];for(let M=0;M<E;M++)z.push(T+p[M]/2),T+=p[M]+d;_.push(z)}return _},[s,p]),v=s.length;return(0,or.jsx)("div",{style:{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"transparent"},children:(0,or.jsx)("div",{className:r,style:{position:"relative",fontSize:a,fontWeight:i,color:l,letterSpacing:"-0.03em",fontFamily:Ky,whiteSpace:"nowrap"},children:s.map((_,E)=>{let b=E===0?0:c+(E-1)*h,T=b+(E===0?c:h),z=g[E][E],M=E===0?0:z+e,K=z,It=1,ta=1,Pt=0,ze=0;if(u<b)It=0,K=M,ta=y,Pt=S,ze=E===0?f:0;else if(u<=T){let Xt=[b,T],jt={extrapolateLeft:"clamp",extrapolateRight:"clamp",easing:m};K=V(u,Xt,[M,z],jt),It=V(u,Xt,[0,1],jt),ta=V(u,Xt,[y,1],jt),Pt=V(u,Xt,[S,0],jt),ze=E===0?V(u,Xt,[f,0],jt):0}else for(let Xt=E+1;Xt<v;Xt++){let jt=c+(Xt-1)*h,Ja=jt+h,Te=g[Xt-1][E],re=g[Xt][E];if(u>=Ja)K=re;else if(u>=jt){K=V(u,[jt,Ja],[Te,re],{extrapolateLeft:"clamp",extrapolateRight:"clamp",easing:m}),Pt=V(u,[jt,(jt+Ja)/2,Ja],[0,A,0],{extrapolateLeft:"clamp",extrapolateRight:"clamp"});break}else{K=Te;break}}return(0,or.jsx)("span",{style:{position:"absolute",left:"50%",top:"50%",whiteSpace:"nowrap",backfaceVisibility:"hidden",transform:`translate(-50%, -50%) translate3d(${K}px, ${ze}px, 0) scale(${ta})`,filter:`blur(${Pt}px)`,opacity:It},children:_},E)})})})}var oe=B(H(),1);var Ah=`#version 300 es
precision mediump float;

layout(location = 0) in vec4 a_position;

uniform vec2 u_resolution;
uniform float u_pixelRatio;
uniform float u_imageAspectRatio;
uniform float u_originX;
uniform float u_originY;
uniform float u_worldWidth;
uniform float u_worldHeight;
uniform float u_fit;
uniform float u_scale;
uniform float u_rotation;
uniform float u_offsetX;
uniform float u_offsetY;

out vec2 v_objectUV;
out vec2 v_objectBoxSize;
out vec2 v_responsiveUV;
out vec2 v_responsiveBoxGivenSize;
out vec2 v_patternUV;
out vec2 v_patternBoxSize;
out vec2 v_imageUV;

vec3 getBoxSize(float boxRatio, vec2 givenBoxSize) {
  vec2 box = vec2(0.);
  // fit = none
  box.x = boxRatio * min(givenBoxSize.x / boxRatio, givenBoxSize.y);
  float noFitBoxWidth = box.x;
  if (u_fit == 1.) { // fit = contain
    box.x = boxRatio * min(u_resolution.x / boxRatio, u_resolution.y);
  } else if (u_fit == 2.) { // fit = cover
    box.x = boxRatio * max(u_resolution.x / boxRatio, u_resolution.y);
  }
  box.y = box.x / boxRatio;
  return vec3(box, noFitBoxWidth);
}

void main() {
  gl_Position = a_position;

  vec2 uv = gl_Position.xy * .5;
  vec2 boxOrigin = vec2(.5 - u_originX, u_originY - .5);
  vec2 givenBoxSize = vec2(u_worldWidth, u_worldHeight);
  givenBoxSize = max(givenBoxSize, vec2(1.)) * u_pixelRatio;
  float r = u_rotation * 3.14159265358979323846 / 180.;
  mat2 graphicRotation = mat2(cos(r), sin(r), -sin(r), cos(r));
  vec2 graphicOffset = vec2(-u_offsetX, u_offsetY);


  // ===================================================

  float fixedRatio = 1.;
  vec2 fixedRatioBoxGivenSize = vec2(
  (u_worldWidth == 0.) ? u_resolution.x : givenBoxSize.x,
  (u_worldHeight == 0.) ? u_resolution.y : givenBoxSize.y
  );

  v_objectBoxSize = getBoxSize(fixedRatio, fixedRatioBoxGivenSize).xy;
  vec2 objectWorldScale = u_resolution.xy / v_objectBoxSize;

  v_objectUV = uv;
  v_objectUV *= objectWorldScale;
  v_objectUV += boxOrigin * (objectWorldScale - 1.);
  v_objectUV += graphicOffset;
  v_objectUV /= u_scale;
  v_objectUV = graphicRotation * v_objectUV;

  // ===================================================

  v_responsiveBoxGivenSize = vec2(
  (u_worldWidth == 0.) ? u_resolution.x : givenBoxSize.x,
  (u_worldHeight == 0.) ? u_resolution.y : givenBoxSize.y
  );
  float responsiveRatio = v_responsiveBoxGivenSize.x / v_responsiveBoxGivenSize.y;
  vec2 responsiveBoxSize = getBoxSize(responsiveRatio, v_responsiveBoxGivenSize).xy;
  vec2 responsiveBoxScale = u_resolution.xy / responsiveBoxSize;

  #ifdef ADD_HELPERS
  v_responsiveHelperBox = uv;
  v_responsiveHelperBox *= responsiveBoxScale;
  v_responsiveHelperBox += boxOrigin * (responsiveBoxScale - 1.);
  #endif

  v_responsiveUV = uv;
  v_responsiveUV *= responsiveBoxScale;
  v_responsiveUV += boxOrigin * (responsiveBoxScale - 1.);
  v_responsiveUV += graphicOffset;
  v_responsiveUV /= u_scale;
  v_responsiveUV.x *= responsiveRatio;
  v_responsiveUV = graphicRotation * v_responsiveUV;
  v_responsiveUV.x /= responsiveRatio;

  // ===================================================

  float patternBoxRatio = givenBoxSize.x / givenBoxSize.y;
  vec2 patternBoxGivenSize = vec2(
  (u_worldWidth == 0.) ? u_resolution.x : givenBoxSize.x,
  (u_worldHeight == 0.) ? u_resolution.y : givenBoxSize.y
  );
  patternBoxRatio = patternBoxGivenSize.x / patternBoxGivenSize.y;

  vec3 boxSizeData = getBoxSize(patternBoxRatio, patternBoxGivenSize);
  v_patternBoxSize = boxSizeData.xy;
  float patternBoxNoFitBoxWidth = boxSizeData.z;
  vec2 patternBoxScale = u_resolution.xy / v_patternBoxSize;

  v_patternUV = uv;
  v_patternUV += graphicOffset / patternBoxScale;
  v_patternUV += boxOrigin;
  v_patternUV -= boxOrigin / patternBoxScale;
  v_patternUV *= u_resolution.xy;
  v_patternUV /= u_pixelRatio;
  if (u_fit > 0.) {
    v_patternUV *= (patternBoxNoFitBoxWidth / v_patternBoxSize.x);
  }
  v_patternUV /= u_scale;
  v_patternUV = graphicRotation * v_patternUV;
  v_patternUV += boxOrigin / patternBoxScale;
  v_patternUV -= boxOrigin;
  // x100 is a default multiplier between vertex and fragmant shaders
  // we use it to avoid UV presision issues
  v_patternUV *= .01;

  // ===================================================

  vec2 imageBoxSize;
  if (u_fit == 1.) { // contain
    imageBoxSize.x = min(u_resolution.x / u_imageAspectRatio, u_resolution.y) * u_imageAspectRatio;
  } else if (u_fit == 2.) { // cover
    imageBoxSize.x = max(u_resolution.x / u_imageAspectRatio, u_resolution.y) * u_imageAspectRatio;
  } else {
    imageBoxSize.x = min(10.0, 10.0 / u_imageAspectRatio * u_imageAspectRatio);
  }
  imageBoxSize.y = imageBoxSize.x / u_imageAspectRatio;
  vec2 imageBoxScale = u_resolution.xy / imageBoxSize;

  v_imageUV = uv;
  v_imageUV *= imageBoxScale;
  v_imageUV += boxOrigin * (imageBoxScale - 1.);
  v_imageUV += graphicOffset;
  v_imageUV /= u_scale;
  v_imageUV.x *= u_imageAspectRatio;
  v_imageUV = graphicRotation * v_imageUV;
  v_imageUV.x /= u_imageAspectRatio;

  v_imageUV += .5;
  v_imageUV.y = 1. - v_imageUV.y;
}`;var xh=1920*1080*4,xo=class{parentElement;canvasElement;gl;program=null;uniformLocations={};fragmentShader;rafId=null;lastRenderTime=0;currentFrame=0;speed=0;currentSpeed=0;providedUniforms;mipmaps=[];hasBeenDisposed=!1;resolutionChanged=!0;textures=new Map;minPixelRatio;maxPixelCount;isSafari=$y();uniformCache={};textureUnitMap=new Map;ownerDocument;constructor(e,a,l,i,o=0,n=0,r=2,u=xh,s=[]){if(e?.nodeType===1)this.parentElement=e;else throw new Error("Paper Shaders: parent element must be an HTMLElement");if(this.ownerDocument=e.ownerDocument,!this.ownerDocument.querySelector("style[data-paper-shader]")){let c=this.ownerDocument.createElement("style");c.innerHTML=Py,c.setAttribute("data-paper-shader",""),this.ownerDocument.head.prepend(c)}let p=this.ownerDocument.createElement("canvas");this.canvasElement=p,this.parentElement.prepend(p),this.fragmentShader=a,this.providedUniforms=l,this.mipmaps=s,this.currentFrame=n,this.minPixelRatio=r,this.maxPixelCount=u;let d=p.getContext("webgl2",i);if(!d)throw new Error("Paper Shaders: WebGL is not supported in this browser");this.gl=d,this.initProgram(),this.setupPositionAttribute(),this.setupUniforms(),this.setUniformValues(this.providedUniforms),this.setupResizeObserver(),visualViewport?.addEventListener("resize",this.handleVisualViewportChange),this.setSpeed(o),this.parentElement.setAttribute("data-paper-shader",""),this.parentElement.paperShaderMount=this,this.ownerDocument.addEventListener("visibilitychange",this.handleDocumentVisibilityChange)}initProgram=()=>{let e=Iy(this.gl,Ah,this.fragmentShader);e&&(this.program=e)};setupPositionAttribute=()=>{let e=this.gl.getAttribLocation(this.program,"a_position"),a=this.gl.createBuffer();this.gl.bindBuffer(this.gl.ARRAY_BUFFER,a);let l=[-1,-1,1,-1,-1,1,-1,1,1,-1,1,1];this.gl.bufferData(this.gl.ARRAY_BUFFER,new Float32Array(l),this.gl.STATIC_DRAW),this.gl.enableVertexAttribArray(e),this.gl.vertexAttribPointer(e,2,this.gl.FLOAT,!1,0,0)};setupUniforms=()=>{let e={u_time:this.gl.getUniformLocation(this.program,"u_time"),u_pixelRatio:this.gl.getUniformLocation(this.program,"u_pixelRatio"),u_resolution:this.gl.getUniformLocation(this.program,"u_resolution")};Object.entries(this.providedUniforms).forEach(([a,l])=>{if(e[a]=this.gl.getUniformLocation(this.program,a),l instanceof HTMLImageElement){let i=`${a}AspectRatio`;e[i]=this.gl.getUniformLocation(this.program,i)}}),this.uniformLocations=e};renderScale=1;parentWidth=0;parentHeight=0;parentDevicePixelWidth=0;parentDevicePixelHeight=0;devicePixelsSupported=!1;resizeObserver=null;setupResizeObserver=()=>{this.resizeObserver=new ResizeObserver(([e])=>{if(e?.borderBoxSize[0]){let a=e.devicePixelContentBoxSize?.[0];a!==void 0&&(this.devicePixelsSupported=!0,this.parentDevicePixelWidth=a.inlineSize,this.parentDevicePixelHeight=a.blockSize),this.parentWidth=e.borderBoxSize[0].inlineSize,this.parentHeight=e.borderBoxSize[0].blockSize}this.handleResize()}),this.resizeObserver.observe(this.parentElement)};handleVisualViewportChange=()=>{this.resizeObserver?.disconnect(),this.setupResizeObserver()};handleResize=()=>{let e=0,a=0,l=Math.max(1,window.devicePixelRatio),i=visualViewport?.scale??1;if(this.devicePixelsSupported){let p=Math.max(1,this.minPixelRatio/l);e=this.parentDevicePixelWidth*p*i,a=this.parentDevicePixelHeight*p*i}else{let p=Math.max(l,this.minPixelRatio)*i;if(this.isSafari){let d=t2(this.ownerDocument);p*=Math.max(1,d)}e=Math.round(this.parentWidth)*p,a=Math.round(this.parentHeight)*p}let o=Math.sqrt(this.maxPixelCount)/Math.sqrt(e*a),n=Math.min(1,o),r=Math.round(e*n),u=Math.round(a*n),s=r/Math.round(this.parentWidth);(this.canvasElement.width!==r||this.canvasElement.height!==u||this.renderScale!==s)&&(this.renderScale=s,this.canvasElement.width=r,this.canvasElement.height=u,this.resolutionChanged=!0,this.gl.viewport(0,0,this.gl.canvas.width,this.gl.canvas.height),this.render(performance.now()))};render=e=>{if(this.hasBeenDisposed)return;if(this.program===null){console.warn("Tried to render before program or gl was initialized");return}let a=e-this.lastRenderTime;this.lastRenderTime=e,this.currentSpeed!==0&&(this.currentFrame+=a*this.currentSpeed),this.gl.clear(this.gl.COLOR_BUFFER_BIT),this.gl.useProgram(this.program),this.gl.uniform1f(this.uniformLocations.u_time,this.currentFrame*.001),this.resolutionChanged&&(this.gl.uniform2f(this.uniformLocations.u_resolution,this.gl.canvas.width,this.gl.canvas.height),this.gl.uniform1f(this.uniformLocations.u_pixelRatio,this.renderScale),this.resolutionChanged=!1),this.gl.drawArrays(this.gl.TRIANGLES,0,6),this.currentSpeed!==0?this.requestRender():this.rafId=null};requestRender=()=>{this.rafId!==null&&cancelAnimationFrame(this.rafId),this.rafId=requestAnimationFrame(this.render)};setTextureUniform=(e,a)=>{if(!a.complete||a.naturalWidth===0)throw new Error(`Paper Shaders: image for uniform ${e} must be fully loaded`);let l=this.textures.get(e);l&&this.gl.deleteTexture(l),this.textureUnitMap.has(e)||this.textureUnitMap.set(e,this.textureUnitMap.size);let i=this.textureUnitMap.get(e);this.gl.activeTexture(this.gl.TEXTURE0+i);let o=this.gl.createTexture();this.gl.bindTexture(this.gl.TEXTURE_2D,o),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_WRAP_S,this.gl.CLAMP_TO_EDGE),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_WRAP_T,this.gl.CLAMP_TO_EDGE),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_MIN_FILTER,this.gl.LINEAR),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_MAG_FILTER,this.gl.LINEAR),this.gl.texImage2D(this.gl.TEXTURE_2D,0,this.gl.RGBA,this.gl.RGBA,this.gl.UNSIGNED_BYTE,a),this.mipmaps.includes(e)&&(this.gl.generateMipmap(this.gl.TEXTURE_2D),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_MIN_FILTER,this.gl.LINEAR_MIPMAP_LINEAR));let n=this.gl.getError();if(n!==this.gl.NO_ERROR||o===null){console.error("Paper Shaders: WebGL error when uploading texture:",n);return}this.textures.set(e,o);let r=this.uniformLocations[e];if(r){this.gl.uniform1i(r,i);let u=`${e}AspectRatio`,s=this.uniformLocations[u];if(s){let p=a.naturalWidth/a.naturalHeight;this.gl.uniform1f(s,p)}}};areUniformValuesEqual=(e,a)=>e===a?!0:Array.isArray(e)&&Array.isArray(a)&&e.length===a.length?e.every((l,i)=>this.areUniformValuesEqual(l,a[i])):!1;setUniformValues=e=>{this.gl.useProgram(this.program),Object.entries(e).forEach(([a,l])=>{let i=l;if(l instanceof HTMLImageElement&&(i=`${l.src.slice(0,200)}|${l.naturalWidth}x${l.naturalHeight}`),this.areUniformValuesEqual(this.uniformCache[a],i))return;this.uniformCache[a]=i;let o=this.uniformLocations[a];if(!o){console.warn(`Uniform location for ${a} not found`);return}if(l instanceof HTMLImageElement)this.setTextureUniform(a,l);else if(Array.isArray(l)){let n=null,r=null;if(l[0]!==void 0&&Array.isArray(l[0])){let u=l[0].length;if(l.every(s=>s.length===u))n=l.flat(),r=u;else{console.warn(`All child arrays must be the same length for ${a}`);return}}else n=l,r=n.length;switch(r){case 2:this.gl.uniform2fv(o,n);break;case 3:this.gl.uniform3fv(o,n);break;case 4:this.gl.uniform4fv(o,n);break;case 9:this.gl.uniformMatrix3fv(o,!1,n);break;case 16:this.gl.uniformMatrix4fv(o,!1,n);break;default:console.warn(`Unsupported uniform array length: ${r}`)}}else typeof l=="number"?this.gl.uniform1f(o,l):typeof l=="boolean"?this.gl.uniform1i(o,l?1:0):console.warn(`Unsupported uniform type for ${a}: ${typeof l}`)})};getCurrentFrame=()=>this.currentFrame;setFrame=e=>{this.currentFrame=e,this.lastRenderTime=performance.now(),this.render(performance.now())};setSpeed=(e=1)=>{this.speed=e,this.setCurrentSpeed(this.ownerDocument.hidden?0:e)};setCurrentSpeed=e=>{this.currentSpeed=e,this.rafId===null&&e!==0&&(this.lastRenderTime=performance.now(),this.rafId=requestAnimationFrame(this.render)),this.rafId!==null&&e===0&&(cancelAnimationFrame(this.rafId),this.rafId=null)};setMaxPixelCount=(e=xh)=>{this.maxPixelCount=e,this.handleResize()};setMinPixelRatio=(e=2)=>{this.minPixelRatio=e,this.handleResize()};setUniforms=e=>{this.setUniformValues(e),this.providedUniforms={...this.providedUniforms,...e},this.render(performance.now())};handleDocumentVisibilityChange=()=>{this.setCurrentSpeed(this.ownerDocument.hidden?0:this.speed)};dispose=()=>{this.hasBeenDisposed=!0,this.rafId!==null&&(cancelAnimationFrame(this.rafId),this.rafId=null),this.gl&&this.program&&(this.textures.forEach(e=>{this.gl.deleteTexture(e)}),this.textures.clear(),this.gl.deleteProgram(this.program),this.program=null,this.gl.bindBuffer(this.gl.ARRAY_BUFFER,null),this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER,null),this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,null),this.gl.bindFramebuffer(this.gl.FRAMEBUFFER,null),this.gl.getError()),this.resizeObserver&&(this.resizeObserver.disconnect(),this.resizeObserver=null),visualViewport?.removeEventListener("resize",this.handleVisualViewportChange),this.ownerDocument.removeEventListener("visibilitychange",this.handleDocumentVisibilityChange),this.uniformLocations={},this.canvasElement.remove(),delete this.parentElement.paperShaderMount}};function bh(t,e,a){let l=t.createShader(e);return l?(t.shaderSource(l,a),t.compileShader(l),t.getShaderParameter(l,t.COMPILE_STATUS)?l:(console.error("An error occurred compiling the shaders: "+t.getShaderInfoLog(l)),t.deleteShader(l),null)):null}function Iy(t,e,a){let l=t.getShaderPrecisionFormat(t.FRAGMENT_SHADER,t.MEDIUM_FLOAT),i=l?l.precision:null;i&&i<23&&(e=e.replace(/precision\s+(lowp|mediump)\s+float;/g,"precision highp float;"),a=a.replace(/precision\s+(lowp|mediump)\s+float/g,"precision highp float").replace(/\b(uniform|varying|attribute)\s+(lowp|mediump)\s+(\w+)/g,"$1 highp $3"));let o=bh(t,t.VERTEX_SHADER,e),n=bh(t,t.FRAGMENT_SHADER,a);if(!o||!n)return null;let r=t.createProgram();return r?(t.attachShader(r,o),t.attachShader(r,n),t.linkProgram(r),t.getProgramParameter(r,t.LINK_STATUS)?(t.detachShader(r,o),t.detachShader(r,n),t.deleteShader(o),t.deleteShader(n),r):(console.error("Unable to initialize the shader program: "+t.getProgramInfoLog(r)),t.deleteProgram(r),t.deleteShader(o),t.deleteShader(n),null)):null}var Py=`@layer paper-shaders {
  :where([data-paper-shader]) {
    isolation: isolate;
    position: relative;

    & canvas {
      contain: strict;
      display: block;
      position: absolute;
      inset: 0;
      z-index: -1;
      width: 100%;
      height: 100%;
      border-radius: inherit;
      corner-shape: inherit;
    }
  }
}`;function $y(){let t=navigator.userAgent.toLowerCase();return t.includes("safari")&&!t.includes("chrome")&&!t.includes("android")}function t2(t){let e=visualViewport?.scale??1,a=visualViewport?.width??window.innerWidth,l=window.innerWidth-t.documentElement.clientWidth,i=e*a+l,o=outerWidth/i,n=Math.round(100*o);return n%5===0?n/100:n===33?1/3:n===67?2/3:n===133?4/3:o}var D={fit:"contain",scale:1,rotation:0,offsetX:0,offsetY:0,originX:.5,originY:.5,worldWidth:0,worldHeight:0},L={fit:"none",scale:1,rotation:0,offsetX:0,offsetY:0,originX:.5,originY:.5,worldWidth:0,worldHeight:0},I={none:0,contain:1,cover:2};var nt=`
#define TWO_PI 6.28318530718
#define PI 3.14159265358979323846
`,Nt=`
vec2 rotate(vec2 uv, float th) {
  return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
}
`,fi=`
  float hash11(float p) {
    p = fract(p * 0.3183099) + 0.1;
    p *= p + 19.19;
    return fract(p * p);
  }
`,nr=`
  float hash21(vec2 p) {
    p = fract(p * vec2(0.3183099, 0.3678794)) + 0.1;
    p += dot(p, p + 19.19);
    return fract(p.x * p.y);
  }
`;var Wa=`
  float randomR(vec2 p) {
    vec2 uv = floor(p) / 100. + .5;
    return texture(u_noiseTexture, fract(uv)).r;
  }
`,mi=`
  vec2 randomGB(vec2 p) {
    vec2 uv = floor(p) / 100. + .5;
    return texture(u_noiseTexture, fract(uv)).gb;
  }
`,Zt=`
  color += 1. / 256. * (fract(sin(dot(.014 * gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453123) - .5);
`,Ye=`
vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
    -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
      dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
`;var ec={maxColorCount:10},ac=`#version 300 es
precision mediump float;

uniform float u_time;

uniform vec4 u_colors[${ec.maxColorCount}];
uniform float u_colorsCount;

uniform float u_distortion;
uniform float u_swirl;
uniform float u_grainMixer;
uniform float u_grainOverlay;

in vec2 v_objectUV;
out vec4 fragColor;

${nt}
${Nt}
${nr}

float valueNoise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  float x1 = mix(a, b, u.x);
  float x2 = mix(c, d, u.x);
  return mix(x1, x2, u.y);
}

float noise(vec2 n, vec2 seedOffset) {
  return valueNoise(n + seedOffset);
}

vec2 getPosition(int i, float t) {
  float a = float(i) * .37;
  float b = .6 + fract(float(i) / 3.) * .9;
  float c = .8 + fract(float(i + 1) / 4.);

  float x = sin(t * b + a);
  float y = cos(t * c + a * 1.5);

  return .5 + .5 * vec2(x, y);
}

void main() {
  vec2 uv = v_objectUV;
  uv += .5;
  vec2 grainUV = uv * 1000.;

  float grain = noise(grainUV, vec2(0.));
  float mixerGrain = .4 * u_grainMixer * (grain - .5);

  const float firstFrameOffset = 41.5;
  float t = .5 * (u_time + firstFrameOffset);

  float radius = smoothstep(0., 1., length(uv - .5));
  float center = 1. - radius;
  for (float i = 1.; i <= 2.; i++) {
    uv.x += u_distortion * center / i * sin(t + i * .4 * smoothstep(.0, 1., uv.y)) * cos(.2 * t + i * 2.4 * smoothstep(.0, 1., uv.y));
    uv.y += u_distortion * center / i * cos(t + i * 2. * smoothstep(.0, 1., uv.x));
  }

  vec2 uvRotated = uv;
  uvRotated -= vec2(.5);
  float angle = 3. * u_swirl * radius;
  uvRotated = rotate(uvRotated, -angle);
  uvRotated += vec2(.5);

  vec3 color = vec3(0.);
  float opacity = 0.;
  float totalWeight = 0.;

  for (int i = 0; i < ${ec.maxColorCount}; i++) {
    if (i >= int(u_colorsCount)) break;

    vec2 pos = getPosition(i, t) + mixerGrain;
    vec3 colorFraction = u_colors[i].rgb * u_colors[i].a;
    float opacityFraction = u_colors[i].a;

    float dist = length(uvRotated - pos);

    dist = pow(dist, 3.5);
    float weight = 1. / (dist + 1e-3);
    color += colorFraction * weight;
    opacity += opacityFraction * weight;
    totalWeight += weight;
  }

  color /= max(1e-4, totalWeight);
  opacity /= max(1e-4, totalWeight);

  float grainOverlay = valueNoise(rotate(grainUV, 1.) + vec2(3.));
  grainOverlay = mix(grainOverlay, valueNoise(rotate(grainUV, 2.) + vec2(-1.)), .5);
  grainOverlay = pow(grainOverlay, 1.3);

  float grainOverlayV = grainOverlay * 2. - 1.;
  vec3 grainOverlayColor = vec3(step(0., grainOverlayV));
  float grainOverlayStrength = u_grainOverlay * abs(grainOverlayV);
  grainOverlayStrength = pow(grainOverlayStrength, .8);
  color = mix(color, grainOverlayColor, .35 * grainOverlayStrength);

  opacity += .5 * grainOverlayStrength;
  opacity = clamp(opacity, 0., 1.);

  fragColor = vec4(color, opacity);
}
`;var lc=`#version 300 es
precision mediump float;

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_pixelRatio;

uniform vec4 u_colorFront;
uniform vec4 u_colorMid;
uniform vec4 u_colorBack;
uniform float u_brightness;
uniform float u_contrast;

in vec2 v_patternUV;

out vec4 fragColor;

${Nt}

float neuroShape(vec2 uv, float t) {
  vec2 sine_acc = vec2(0.);
  vec2 res = vec2(0.);
  float scale = 8.;

  for (int j = 0; j < 15; j++) {
    uv = rotate(uv, 1.);
    sine_acc = rotate(sine_acc, 1.);
    vec2 layer = uv * scale + float(j) + sine_acc - t;
    sine_acc += sin(layer);
    res += (.5 + .5 * cos(layer)) / scale;
    scale *= (1.2);
  }
  return res.x + res.y;
}

void main() {
  vec2 shape_uv = v_patternUV;
  shape_uv *= .13;

  float t = .5 * u_time;

  float noise = neuroShape(shape_uv, t);

  noise = (1. + u_brightness) * noise * noise;
  noise = pow(noise, .7 + 6. * u_contrast);
  noise = min(1.4, noise);

  float blend = smoothstep(0.7, 1.4, noise);

  vec4 frontC = u_colorFront;
  frontC.rgb *= frontC.a;
  vec4 midC = u_colorMid;
  midC.rgb *= midC.a;
  vec4 blendFront = mix(midC, frontC, blend);

  float safeNoise = max(noise, 0.0);
  vec3 color = blendFront.rgb * safeNoise;
  float opacity = clamp(blendFront.a * safeNoise, 0., 1.);

  vec3 bgColor = u_colorBack.rgb * u_colorBack.a;
  color = color + bgColor * (1. - opacity);
  opacity = opacity + u_colorBack.a * (1. - opacity);

  ${Zt}

  fragColor = vec4(color, opacity);
}
`;var ic={maxColorCount:10},oc=`#version 300 es
precision mediump float;

uniform float u_time;

uniform sampler2D u_noiseTexture;

uniform vec4 u_colorBack;
uniform vec4 u_colors[${ic.maxColorCount}];
uniform float u_colorsCount;
uniform float u_stepsPerColor;
uniform float u_size;
uniform float u_sizeRange;
uniform float u_spreading;

in vec2 v_patternUV;

out vec4 fragColor;

${nt}
${Nt}
${Wa}
${mi}


vec3 voronoiShape(vec2 uv, float time) {
  vec2 i_uv = floor(uv);
  vec2 f_uv = fract(uv);

  float spreading = .25 * clamp(u_spreading, 0., 1.);

  float minDist = 1.;
  vec2 randomizer = vec2(0.);
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 tileOffset = vec2(float(x), float(y));
      vec2 rand = randomGB(i_uv + tileOffset);
      vec2 cellCenter = vec2(.5 + 1e-4);
      cellCenter += spreading * cos(time + TWO_PI * rand);
      cellCenter -= .5;
      cellCenter = rotate(cellCenter, randomR(vec2(rand.x, rand.y)) + .1 * time);
      cellCenter += .5;
      float dist = length(tileOffset + cellCenter - f_uv);
      if (dist < minDist) {
        minDist = dist;
        randomizer = rand;
      }
    }
  }

  return vec3(minDist, randomizer);
}

void main() {

  vec2 shape_uv = v_patternUV;
  shape_uv *= 1.5;

  const float firstFrameOffset = -10.;
  float t = u_time + firstFrameOffset;

  vec3 voronoi = voronoiShape(shape_uv, t) + 1e-4;

  float radius = .25 * clamp(u_size, 0., 1.) - .5 * clamp(u_sizeRange, 0., 1.) * voronoi[2];
  float dist = voronoi[0];
  float edgeWidth = fwidth(dist);
  float dots = 1. - smoothstep(radius - edgeWidth, radius + edgeWidth, dist);

  float shape = voronoi[1];

  float mixer = shape * (u_colorsCount - 1.);
  mixer = (shape - .5 / u_colorsCount) * u_colorsCount;
  float steps = max(1., u_stepsPerColor);

  vec4 gradient = u_colors[0];
  gradient.rgb *= gradient.a;
  for (int i = 1; i < ${ic.maxColorCount}; i++) {
    if (i >= int(u_colorsCount)) break;
    float localT = clamp(mixer - float(i - 1), 0.0, 1.0);
    localT = round(localT * steps) / steps;
    vec4 c = u_colors[i];
    c.rgb *= c.a;
    gradient = mix(gradient, c, localT);
  }

  if ((mixer < 0.) || (mixer > (u_colorsCount - 1.))) {
    float localT = mixer + 1.;
    if (mixer > (u_colorsCount - 1.)) {
      localT = mixer - (u_colorsCount - 1.);
    }
    localT = round(localT * steps) / steps;
    vec4 cFst = u_colors[0];
    cFst.rgb *= cFst.a;
    vec4 cLast = u_colors[int(u_colorsCount - 1.)];
    cLast.rgb *= cLast.a;
    gradient = mix(cLast, cFst, localT);
  }

  vec3 color = gradient.rgb * dots;
  float opacity = gradient.a * dots;

  vec3 bgColor = u_colorBack.rgb * u_colorBack.a;
  color = color + bgColor * (1. - opacity);
  opacity = opacity + u_colorBack.a * (1. - opacity);

  fragColor = vec4(color, opacity);
}
`;var rr={maxColorCount:8,maxBallsCount:20},nc=`#version 300 es
precision mediump float;

uniform float u_time;

uniform sampler2D u_noiseTexture;

uniform vec4 u_colorBack;
uniform vec4 u_colors[${rr.maxColorCount}];
uniform float u_colorsCount;
uniform float u_size;
uniform float u_sizeRange;
uniform float u_count;

in vec2 v_objectUV;

out vec4 fragColor;

${nt}
${Wa}
float noise(float x) {
  float i = floor(x);
  float f = fract(x);
  float u = f * f * (3.0 - 2.0 * f);
  vec2 p0 = vec2(i, 0.0);
  vec2 p1 = vec2(i + 1.0, 0.0);
  return mix(randomR(p0), randomR(p1), u);
}

float getBallShape(vec2 uv, vec2 c, float p) {
  float s = .5 * length(uv - c);
  s = 1. - clamp(s, 0., 1.);
  s = pow(s, p);
  return s;
}

void main() {
  vec2 shape_uv = v_objectUV;

  shape_uv += .5;

  const float firstFrameOffset = 2503.4;
  float t = .2 * (u_time + firstFrameOffset);

  vec3 totalColor = vec3(0.);
  float totalShape = 0.;
  float totalOpacity = 0.;

  for (int i = 0; i < ${rr.maxBallsCount}; i++) {
    if (i >= int(ceil(u_count))) break;

    float idxFract = float(i) / float(${rr.maxBallsCount});
    float angle = TWO_PI * idxFract;

    float speed = 1. - .2 * idxFract;
    float noiseX = noise(angle * 10. + float(i) + t * speed);
    float noiseY = noise(angle * 20. + float(i) - t * speed);

    vec2 pos = vec2(.5) + 1e-4 + .9 * (vec2(noiseX, noiseY) - .5);

    int safeIndex = i % int(u_colorsCount + 0.5);
    vec4 ballColor = u_colors[safeIndex];
    ballColor.rgb *= ballColor.a;

    float sizeFrac = 1.;
    if (float(i) > floor(u_count - 1.)) {
      sizeFrac *= fract(u_count);
    }

    float shape = getBallShape(shape_uv, pos, 45. - 30. * u_size * sizeFrac);
    shape *= pow(u_size, .2);
    shape = smoothstep(0., 1., shape);

    totalColor += ballColor.rgb * shape;
    totalShape += shape;
    totalOpacity += ballColor.a * shape;
  }

  totalColor /= max(totalShape, 1e-4);
  totalOpacity /= max(totalShape, 1e-4);

  float edge_width = fwidth(totalShape);
  float finalShape = smoothstep(.4, .4 + edge_width, totalShape);

  vec3 color = totalColor * finalShape;
  float opacity = totalOpacity * finalShape;

  vec3 bgColor = u_colorBack.rgb * u_colorBack.a;
  color = color + bgColor * (1. - opacity);
  opacity = opacity + u_colorBack.a * (1. - opacity);

  ${Zt}

  fragColor = vec4(color, opacity);
}
`;var rc={maxColorCount:5},uc=`#version 300 es
precision mediump float;

uniform float u_time;

uniform float u_scale;

uniform sampler2D u_noiseTexture;

uniform vec4 u_colors[${rc.maxColorCount}];
uniform float u_colorsCount;

uniform float u_stepsPerColor;
uniform vec4 u_colorGlow;
uniform vec4 u_colorGap;
uniform float u_distortion;
uniform float u_gap;
uniform float u_glow;

in vec2 v_patternUV;

out vec4 fragColor;

${nt}
${mi}

vec4 voronoi(vec2 x, float t) {
  vec2 ip = floor(x);
  vec2 fp = fract(x);

  vec2 mg, mr;
  float md = 8.;
  float rand = 0.;

  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 o = randomGB(ip + g);
      float raw_hash = o.x;
      o = .5 + u_distortion * sin(t + TWO_PI * o);
      vec2 r = g + o - fp;
      float d = dot(r, r);

      if (d < md) {
        md = d;
        mr = r;
        mg = g;
        rand = raw_hash;
      }
    }
  }

  md = 8.;
  for (int j = -2; j <= 2; j++) {
    for (int i = -2; i <= 2; i++) {
      vec2 g = mg + vec2(float(i), float(j));
      vec2 o = randomGB(ip + g);
      o = .5 + u_distortion * sin(t + TWO_PI * o);
      vec2 r = g + o - fp;
      if (dot(mr - r, mr - r) > .00001) {
        md = min(md, dot(.5 * (mr + r), normalize(r - mr)));
      }
    }
  }

  return vec4(md, mr, rand);
}

void main() {
  vec2 shape_uv = v_patternUV;
  shape_uv *= 1.25;

  float t = u_time;

  vec4 voronoiRes = voronoi(shape_uv, t);

  float shape = clamp(voronoiRes.w, 0., 1.);
  float mixer = shape * (u_colorsCount - 1.);
  mixer = (shape - .5 / u_colorsCount) * u_colorsCount;
  float steps = max(1., u_stepsPerColor);

  vec4 gradient = u_colors[0];
  gradient.rgb *= gradient.a;
  for (int i = 1; i < ${rc.maxColorCount}; i++) {
    if (i >= int(u_colorsCount)) break;
    float localT = clamp(mixer - float(i - 1), 0.0, 1.0);
    localT = round(localT * steps) / steps;
    vec4 c = u_colors[i];
    c.rgb *= c.a;
    gradient = mix(gradient, c, localT);
  }

  if ((mixer < 0.) || (mixer > (u_colorsCount - 1.))) {
    float localT = mixer + 1.;
    if (mixer > (u_colorsCount - 1.)) {
      localT = mixer - (u_colorsCount - 1.);
    }
    localT = round(localT * steps) / steps;
    vec4 cFst = u_colors[0];
    cFst.rgb *= cFst.a;
    vec4 cLast = u_colors[int(u_colorsCount - 1.)];
    cLast.rgb *= cLast.a;
    gradient = mix(cLast, cFst, localT);
  }

  vec3 cellColor = gradient.rgb;
  float cellOpacity = gradient.a;

  float glows = length(voronoiRes.yz * u_glow);
  glows = pow(glows, 1.5);

  vec3 color = mix(cellColor, u_colorGlow.rgb * u_colorGlow.a, u_colorGlow.a * glows);
  float opacity = cellOpacity + u_colorGlow.a * glows;

  float edge = voronoiRes.x;
  float smoothEdge = .02 / (2. * u_scale) * (1. + .5 * u_gap);
  edge = smoothstep(u_gap - smoothEdge, u_gap + smoothEdge, edge);

  color = mix(u_colorGap.rgb * u_colorGap.a, color, edge);
  opacity = mix(u_colorGap.a, opacity, edge);

  fragColor = vec4(color, opacity);
}
`;var sc={maxColorCount:10},cc=`#version 300 es
precision mediump float;

uniform float u_time;
uniform float u_scale;

uniform sampler2D u_noiseTexture;

uniform vec4 u_colors[${sc.maxColorCount}];
uniform float u_colorsCount;
uniform float u_proportion;
uniform float u_softness;
uniform float u_shape;
uniform float u_shapeScale;
uniform float u_distortion;
uniform float u_swirl;
uniform float u_swirlIterations;

in vec2 v_patternUV;

out vec4 fragColor;

${nt}
${Nt}
float randomG(vec2 p) {
  vec2 uv = floor(p) / 100. + .5;
  return texture(u_noiseTexture, fract(uv)).g;
}
float valueNoise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  float a = randomG(i);
  float b = randomG(i + vec2(1.0, 0.0));
  float c = randomG(i + vec2(0.0, 1.0));
  float d = randomG(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  float x1 = mix(a, b, u.x);
  float x2 = mix(c, d, u.x);
  return mix(x1, x2, u.y);
}


void main() {
  vec2 uv = v_patternUV;
  uv *= .5;

  const float firstFrameOffset = 118.;
  float t = 0.0625 * (u_time + firstFrameOffset);

  float n1 = valueNoise(uv * 1. + t);
  float n2 = valueNoise(uv * 2. - t);
  float angle = n1 * TWO_PI;
  uv.x += 4. * u_distortion * n2 * cos(angle);
  uv.y += 4. * u_distortion * n2 * sin(angle);

  float swirl = u_swirl;
  for (int i = 1; i <= 20; i++) {
    if (i >= int(u_swirlIterations)) break;
    float iFloat = float(i);
    //    swirl *= (1. - smoothstep(.0, .25, length(fwidth(uv))));
    uv.x += swirl / iFloat * cos(t + iFloat * 1.5 * uv.y);
    uv.y += swirl / iFloat * cos(t + iFloat * 1. * uv.x);
  }

  float proportion = clamp(u_proportion, 0., 1.);

  float shape = 0.;
  if (u_shape < .5) {
    vec2 checksShape_uv = uv * (.5 + 3.5 * u_shapeScale);
    shape = .5 + .5 * sin(checksShape_uv.x) * cos(checksShape_uv.y);
    shape += .48 * sign(proportion - .5) * pow(abs(proportion - .5), .5);
  } else if (u_shape < 1.5) {
    vec2 stripesShape_uv = uv * (2. * u_shapeScale);
    float f = fract(stripesShape_uv.y);
    shape = smoothstep(.0, .55, f) * (1.0 - smoothstep(.45, 1., f));
    shape += .48 * sign(proportion - .5) * pow(abs(proportion - .5), .5);
  } else {
    float shapeScaling = 5. * (1. - u_shapeScale);
    float e0 = 0.45 - shapeScaling;
    float e1 = 0.55 + shapeScaling;
    shape = smoothstep(min(e0, e1), max(e0, e1), 1.0 - uv.y + 0.3 * (proportion - 0.5));
  }

  float mixer = shape * (u_colorsCount - 1.);
  vec4 gradient = u_colors[0];
  gradient.rgb *= gradient.a;
  float aa = fwidth(shape);
  for (int i = 1; i < ${sc.maxColorCount}; i++) {
    if (i >= int(u_colorsCount)) break;
    float m = clamp(mixer - float(i - 1), 0.0, 1.0);

    float localMixerStart = floor(m);
    float softness = .5 * u_softness + fwidth(m);
    float smoothed = smoothstep(max(0., .5 - softness - aa), min(1., .5 + softness + aa), m - localMixerStart);
    float stepped = localMixerStart + smoothed;

    m = mix(stepped, m, u_softness);

    vec4 c = u_colors[i];
    c.rgb *= c.a;
    gradient = mix(gradient, c, m);
  }

  vec3 color = gradient.rgb;
  float opacity = gradient.a;

  ${Zt}

  fragColor = vec4(color, opacity);
}
`,fc={checks:0,stripes:1,edge:2};var mc={maxColorCount:5},pc=`#version 300 es
precision mediump float;

uniform float u_time;

uniform sampler2D u_noiseTexture;

uniform vec4 u_colorBack;
uniform vec4 u_colorBloom;
uniform vec4 u_colors[${mc.maxColorCount}];
uniform float u_colorsCount;

uniform float u_density;
uniform float u_spotty;
uniform float u_midSize;
uniform float u_midIntensity;
uniform float u_intensity;
uniform float u_bloom;

in vec2 v_objectUV;

out vec4 fragColor;

${nt}
${Nt}
${Wa}
float valueNoise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  float a = randomR(i);
  float b = randomR(i + vec2(1.0, 0.0));
  float c = randomR(i + vec2(0.0, 1.0));
  float d = randomR(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  float x1 = mix(a, b, u.x);
  float x2 = mix(c, d, u.x);
  return mix(x1, x2, u.y);
}

${fi}

float raysShape(vec2 uv, float r, float freq, float intensity, float radius) {
  float a = atan(uv.y, uv.x);
  vec2 left = vec2(a * freq, r);
  vec2 right = vec2(fract(a / TWO_PI) * TWO_PI * freq, r);
  float n_left = pow(valueNoise(left), intensity);
  float n_right = pow(valueNoise(right), intensity);
  float shape = mix(n_right, n_left, smoothstep(-.15, .15, uv.x));
  return shape;
}

void main() {
  vec2 shape_uv = v_objectUV;

  float t = .2 * u_time;

  float radius = length(shape_uv);
  float spots = 6.5 * abs(u_spotty);

  float intensity = 4. - 3. * clamp(u_intensity, 0., 1.);

  float delta = 1. - smoothstep(0., 1., radius);

  float midSize = 10. * abs(u_midSize);
  float ms_lo = 0.02 * midSize;
  float ms_hi = max(midSize, 1e-6);
  float middleShape = pow(u_midIntensity, 0.3) * (1. - smoothstep(ms_lo, ms_hi, 3.0 * radius));
  middleShape = pow(middleShape, 5.0);

  vec3 accumColor = vec3(0.0);
  float accumAlpha = 0.0;

  for (int i = 0; i < ${mc.maxColorCount}; i++) {
    if (i >= int(u_colorsCount)) break;

    vec2 rotatedUV = rotate(shape_uv, float(i) + 1.0);

    float r1 = radius * (1.0 + 0.4 * float(i)) - 3.0 * t;
    float r2 = 0.5 * radius * (1.0 + spots) - 2.0 * t;
    float density = 6. * u_density + step(.5, u_density) * pow(4.5 * (u_density - .5), 4.);
    float f = mix(1.0, 3.0 + 0.5 * float(i), hash11(float(i) * 15.)) * density;

    float ray = raysShape(rotatedUV, r1, 5.0 * f, intensity, radius);
    ray *= raysShape(rotatedUV, r2, 4.0 * f, intensity, radius);
    ray += (1. + 4. * ray) * middleShape;
    ray = clamp(ray, 0.0, 1.0);

    float srcAlpha = u_colors[i].a * ray;
    vec3 srcColor = u_colors[i].rgb * srcAlpha;

    vec3 alphaBlendColor = accumColor + (1.0 - accumAlpha) * srcColor;
    float alphaBlendAlpha = accumAlpha + (1.0 - accumAlpha) * srcAlpha;

    vec3 addBlendColor = accumColor + srcColor;
    float addBlendAlpha = accumAlpha + srcAlpha;

    accumColor = mix(alphaBlendColor, addBlendColor, u_bloom);
    accumAlpha = mix(alphaBlendAlpha, addBlendAlpha, u_bloom);
  }

  float overlayAlpha = u_colorBloom.a;
  vec3 overlayColor = u_colorBloom.rgb * overlayAlpha;

  vec3 colorWithOverlay = accumColor + accumAlpha * overlayColor;
  accumColor = mix(accumColor, colorWithOverlay, u_bloom);

  vec3 bgColor = u_colorBack.rgb * u_colorBack.a;

  vec3 color = accumColor + (1. - accumAlpha) * bgColor;
  float opacity = accumAlpha + (1. - accumAlpha) * u_colorBack.a;
  color = clamp(color, 0., 1.);
  opacity = clamp(opacity, 0., 1.);

  ${Zt}

  fragColor = vec4(color, opacity);
}
`;var dc=`#version 300 es
precision mediump float;

uniform float u_time;

uniform vec4 u_colorBack;
uniform vec4 u_colorFront;
uniform float u_density;
uniform float u_distortion;
uniform float u_strokeWidth;
uniform float u_strokeCap;
uniform float u_strokeTaper;
uniform float u_noise;
uniform float u_noiseFrequency;
uniform float u_softness;

in vec2 v_patternUV;

out vec4 fragColor;

${nt}
${Ye}

void main() {
  vec2 uv = 2. * v_patternUV;

  float t = u_time;
  float l = length(uv);
  float density = clamp(u_density, 0., 1.);
  l = pow(max(l, 1e-6), density);
  float angle = atan(uv.y, uv.x) - t;
  float angleNormalised = angle / TWO_PI;

  angleNormalised += .125 * u_noise * snoise(16. * pow(u_noiseFrequency, 3.) * uv);

  float offset = l + angleNormalised;
  offset -= u_distortion * (sin(4. * l - .5 * t) * cos(PI + l + .5 * t));
  float stripe = fract(offset);

  float shape = 2. * abs(stripe - .5);
  float width = 1. - clamp(u_strokeWidth, .005 * u_strokeTaper, 1.);


  float wCap = mix(width, (1. - stripe) * (1. - step(.5, stripe)), (1. - clamp(l, 0., 1.)));
  width = mix(width, wCap, u_strokeCap);
  width *= (1. - clamp(u_strokeTaper, 0., 1.) * l);

  float fw = fwidth(offset);
  float fwMult = 4. - 3. * (smoothstep(.05, .4, 2. * u_strokeWidth) * smoothstep(.05, .4, 2. * (1. - u_strokeWidth)));
  float pixelSize = mix(fwMult * fw, fwidth(shape), clamp(fw, 0., 1.));
  pixelSize = mix(pixelSize, .002, u_strokeCap * (1. - clamp(l, 0., 1.)));

  float res = smoothstep(width - pixelSize - u_softness, width + pixelSize + u_softness, shape);

  vec3 fgColor = u_colorFront.rgb * u_colorFront.a;
  float fgOpacity = u_colorFront.a;
  vec3 bgColor = u_colorBack.rgb * u_colorBack.a;
  float bgOpacity = u_colorBack.a;

  vec3 color = fgColor * res;
  float opacity = fgOpacity * res;

  color += bgColor * (1. - opacity);
  opacity += bgOpacity * (1. - opacity);

  ${Zt}

  fragColor = vec4(color, opacity);
}
`;var hc={maxColorCount:10},gc=`#version 300 es
precision mediump float;

uniform float u_time;

uniform vec4 u_colorBack;
uniform vec4 u_colors[${hc.maxColorCount}];
uniform float u_colorsCount;
uniform float u_bandCount;
uniform float u_twist;
uniform float u_center;
uniform float u_proportion;
uniform float u_softness;
uniform float u_noise;
uniform float u_noiseFrequency;

in vec2 v_objectUV;

out vec4 fragColor;

${nt}
${Ye}
${Nt}

void main() {
  vec2 shape_uv = v_objectUV;

  float l = length(shape_uv);
  l = max(1e-4, l);

  float t = u_time;

  float angle = ceil(u_bandCount) * atan(shape_uv.y, shape_uv.x) + t;
  float angle_norm = angle / TWO_PI;

  float twist = 3. * clamp(u_twist, 0., 1.);
  float offset = pow(l, -twist) + angle_norm;

  float shape = fract(offset);
  shape = 1. - abs(2. * shape - 1.);
  shape += u_noise * snoise(15. * pow(u_noiseFrequency, 2.) * shape_uv);

  float mid = smoothstep(.2, .2 + .8 * u_center, pow(l, twist));
  shape = mix(0., shape, mid);

  float proportion = clamp(u_proportion, 0., 1.);
  float exponent = mix(.25, 1., proportion * 2.);
  exponent = mix(exponent, 10., max(0., proportion * 2. - 1.));
  shape = pow(shape, exponent);

  float mixer = shape * u_colorsCount;
  vec4 gradient = u_colors[0];
  gradient.rgb *= gradient.a;

  float outerShape = 0.;
  for (int i = 1; i < ${hc.maxColorCount+1}; i++) {
    if (i > int(u_colorsCount)) break;

    float m = clamp(mixer - float(i - 1), 0., 1.);
    float aa = fwidth(m);
    m = smoothstep(.5 - .5 * u_softness - aa, .5 + .5 * u_softness + aa, m);

    if (i == 1) {
      outerShape = m;
    }

    vec4 c = u_colors[i - 1];
    c.rgb *= c.a;
    gradient = mix(gradient, c, m);
  }

  float midAA = .1 * fwidth(pow(l, -twist));
  float outerMid = smoothstep(.2, .2 + midAA, pow(l, twist));
  outerShape = mix(0., outerShape, outerMid);

  vec3 color = gradient.rgb * outerShape;
  float opacity = gradient.a * outerShape;

  vec3 bgColor = u_colorBack.rgb * u_colorBack.a;
  color = color + bgColor * (1.0 - opacity);
  opacity = opacity + u_colorBack.a * (1.0 - opacity);

  ${Zt}

  fragColor = vec4(color, opacity);
}
`;var vc=`#version 300 es
precision mediump float;

uniform float u_time;

uniform vec2 u_resolution;
uniform float u_pixelRatio;
uniform float u_originX;
uniform float u_originY;
uniform float u_worldWidth;
uniform float u_worldHeight;
uniform float u_fit;
uniform float u_scale;
uniform float u_rotation;
uniform float u_offsetX;
uniform float u_offsetY;

uniform float u_pxSize;
uniform vec4 u_colorBack;
uniform vec4 u_colorFront;
uniform float u_shape;
uniform float u_type;

out vec4 fragColor;

${Ye}
${nt}
${fi}
${nr}

float getSimplexNoise(vec2 uv, float t) {
  float noise = .5 * snoise(uv - vec2(0., .3 * t));
  noise += .5 * snoise(2. * uv + vec2(0., .32 * t));

  return noise;
}

const int bayer2x2[4] = int[4](0, 2, 3, 1);
const int bayer4x4[16] = int[16](
0, 8, 2, 10,
12, 4, 14, 6,
3, 11, 1, 9,
15, 7, 13, 5
);

const int bayer8x8[64] = int[64](
0, 32, 8, 40, 2, 34, 10, 42,
48, 16, 56, 24, 50, 18, 58, 26,
12, 44, 4, 36, 14, 46, 6, 38,
60, 28, 52, 20, 62, 30, 54, 22,
3, 35, 11, 43, 1, 33, 9, 41,
51, 19, 59, 27, 49, 17, 57, 25,
15, 47, 7, 39, 13, 45, 5, 37,
63, 31, 55, 23, 61, 29, 53, 21
);

float getBayerValue(vec2 uv, int size) {
  ivec2 pos = ivec2(fract(uv / float(size)) * float(size));
  int index = pos.y * size + pos.x;

  if (size == 2) {
    return float(bayer2x2[index]) / 4.0;
  } else if (size == 4) {
    return float(bayer4x4[index]) / 16.0;
  } else if (size == 8) {
    return float(bayer8x8[index]) / 64.0;
  }
  return 0.0;
}


void main() {
  float t = .5 * u_time;

  float pxSize = u_pxSize * u_pixelRatio;
  vec2 pxSizeUV = gl_FragCoord.xy - .5 * u_resolution;
  pxSizeUV /= pxSize;
  vec2 canvasPixelizedUV = (floor(pxSizeUV) + .5) * pxSize;
  vec2 normalizedUV = canvasPixelizedUV / u_resolution;

  vec2 ditheringNoiseUV = canvasPixelizedUV;
  vec2 shapeUV = normalizedUV;

  vec2 boxOrigin = vec2(.5 - u_originX, u_originY - .5);
  vec2 givenBoxSize = vec2(u_worldWidth, u_worldHeight);
  givenBoxSize = max(givenBoxSize, vec2(1.)) * u_pixelRatio;
  float r = u_rotation * PI / 180.;
  mat2 graphicRotation = mat2(cos(r), sin(r), -sin(r), cos(r));
  vec2 graphicOffset = vec2(-u_offsetX, u_offsetY);

  float patternBoxRatio = givenBoxSize.x / givenBoxSize.y;
  vec2 boxSize = vec2(
  (u_worldWidth == 0.) ? u_resolution.x : givenBoxSize.x,
  (u_worldHeight == 0.) ? u_resolution.y : givenBoxSize.y
  );

  if (u_shape > 3.5) {
    vec2 objectBoxSize = vec2(0.);
    // fit = none
    objectBoxSize.x = min(boxSize.x, boxSize.y);
    if (u_fit == 1.) { // fit = contain
      objectBoxSize.x = min(u_resolution.x, u_resolution.y);
    } else if (u_fit == 2.) { // fit = cover
      objectBoxSize.x = max(u_resolution.x, u_resolution.y);
    }
    objectBoxSize.y = objectBoxSize.x;
    vec2 objectWorldScale = u_resolution.xy / objectBoxSize;

    shapeUV *= objectWorldScale;
    shapeUV += boxOrigin * (objectWorldScale - 1.);
    shapeUV += vec2(-u_offsetX, u_offsetY);
    shapeUV /= u_scale;
    shapeUV = graphicRotation * shapeUV;
  } else {
    vec2 patternBoxSize = vec2(0.);
    // fit = none
    patternBoxSize.x = patternBoxRatio * min(boxSize.x / patternBoxRatio, boxSize.y);
    float patternWorldNoFitBoxWidth = patternBoxSize.x;
    if (u_fit == 1.) { // fit = contain
      patternBoxSize.x = patternBoxRatio * min(u_resolution.x / patternBoxRatio, u_resolution.y);
    } else if (u_fit == 2.) { // fit = cover
      patternBoxSize.x = patternBoxRatio * max(u_resolution.x / patternBoxRatio, u_resolution.y);
    }
    patternBoxSize.y = patternBoxSize.x / patternBoxRatio;
    vec2 patternWorldScale = u_resolution.xy / patternBoxSize;

    shapeUV += vec2(-u_offsetX, u_offsetY) / patternWorldScale;
    shapeUV += boxOrigin;
    shapeUV -= boxOrigin / patternWorldScale;
    shapeUV *= u_resolution.xy;
    shapeUV /= u_pixelRatio;
    if (u_fit > 0.) {
      shapeUV *= (patternWorldNoFitBoxWidth / patternBoxSize.x);
    }
    shapeUV /= u_scale;
    shapeUV = graphicRotation * shapeUV;
    shapeUV += boxOrigin / patternWorldScale;
    shapeUV -= boxOrigin;
    shapeUV += .5;
  }

  float shape = 0.;
  if (u_shape < 1.5) {
    // Simplex noise
    shapeUV *= .001;

    shape = 0.5 + 0.5 * getSimplexNoise(shapeUV, t);
    shape = smoothstep(0.3, 0.9, shape);

  } else if (u_shape < 2.5) {
    // Warp
    shapeUV *= .003;

    for (float i = 1.0; i < 6.0; i++) {
      shapeUV.x += 0.6 / i * cos(i * 2.5 * shapeUV.y + t);
      shapeUV.y += 0.6 / i * cos(i * 1.5 * shapeUV.x + t);
    }

    shape = .15 / max(0.001, abs(sin(t - shapeUV.y - shapeUV.x)));
    shape = smoothstep(0.02, 1., shape);

  } else if (u_shape < 3.5) {
    // Dots
    shapeUV *= .05;

    float stripeIdx = floor(2. * shapeUV.x / TWO_PI);
    float rand = hash11(stripeIdx * 10.);
    rand = sign(rand - .5) * pow(.1 + abs(rand), .4);
    shape = sin(shapeUV.x) * cos(shapeUV.y - 5. * rand * t);
    shape = pow(abs(shape), 6.);

  } else if (u_shape < 4.5) {
    // Sine wave
    shapeUV *= 4.;

    float wave = cos(.5 * shapeUV.x - 2. * t) * sin(1.5 * shapeUV.x + t) * (.75 + .25 * cos(3. * t));
    shape = 1. - smoothstep(-1., 1., shapeUV.y + wave);

  } else if (u_shape < 5.5) {
    // Ripple

    float dist = length(shapeUV);
    float waves = sin(pow(dist, 1.7) * 7. - 3. * t) * .5 + .5;
    shape = waves;

  } else if (u_shape < 6.5) {
    // Swirl

    float l = length(shapeUV);
    float angle = 6. * atan(shapeUV.y, shapeUV.x) + 4. * t;
    float twist = 1.2;
    float offset = 1. / pow(max(l, 1e-6), twist) + angle / TWO_PI;
    float mid = smoothstep(0., 1., pow(l, twist));
    shape = mix(0., fract(offset), mid);

  } else {
    // Sphere
    shapeUV *= 2.;

    float d = 1. - pow(length(shapeUV), 2.);
    vec3 pos = vec3(shapeUV, sqrt(max(0., d)));
    vec3 lightPos = normalize(vec3(cos(1.5 * t), .8, sin(1.25 * t)));
    shape = .5 + .5 * dot(lightPos, pos);
    shape *= step(0., d);
  }


  int type = int(floor(u_type));
  float dithering = 0.0;

  switch (type) {
    case 1: {
      dithering = step(hash21(ditheringNoiseUV), shape);
    } break;
    case 2:
    dithering = getBayerValue(pxSizeUV, 2);
    break;
    case 3:
    dithering = getBayerValue(pxSizeUV, 4);
    break;
    default :
    dithering = getBayerValue(pxSizeUV, 8);
    break;
  }

  dithering -= .5;
  float res = step(.5, shape + dithering);

  vec3 fgColor = u_colorFront.rgb * u_colorFront.a;
  float fgOpacity = u_colorFront.a;
  vec3 bgColor = u_colorBack.rgb * u_colorBack.a;
  float bgOpacity = u_colorBack.a;

  vec3 color = fgColor * res;
  float opacity = fgOpacity * res;

  color += bgColor * (1. - opacity);
  opacity += bgOpacity * (1. - opacity);

  fragColor = vec4(color, opacity);
}
`,yc={simplex:1,warp:2,dots:3,wave:4,ripple:5,swirl:6,sphere:7},Sc={random:1,"2x2":2,"4x4":3,"8x8":4};var Ac={maxColorCount:7},xc=`#version 300 es
precision lowp float;

uniform mediump float u_time;
uniform mediump vec2 u_resolution;
uniform mediump float u_pixelRatio;

uniform sampler2D u_noiseTexture;

uniform vec4 u_colorBack;
uniform vec4 u_colors[${Ac.maxColorCount}];
uniform float u_colorsCount;
uniform float u_softness;
uniform float u_intensity;
uniform float u_noise;
uniform float u_shape;

uniform mediump float u_originX;
uniform mediump float u_originY;
uniform mediump float u_worldWidth;
uniform mediump float u_worldHeight;
uniform mediump float u_fit;

uniform mediump float u_scale;
uniform mediump float u_rotation;
uniform mediump float u_offsetX;
uniform mediump float u_offsetY;

in vec2 v_objectUV;
in vec2 v_patternUV;
in vec2 v_objectBoxSize;
in vec2 v_patternBoxSize;

out vec4 fragColor;

${nt}
${Ye}
${Nt}
${Wa}

float valueNoiseR(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  float a = randomR(i);
  float b = randomR(i + vec2(1.0, 0.0));
  float c = randomR(i + vec2(0.0, 1.0));
  float d = randomR(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  float x1 = mix(a, b, u.x);
  float x2 = mix(c, d, u.x);
  return mix(x1, x2, u.y);
}
vec4 fbmR(vec2 n0, vec2 n1, vec2 n2, vec2 n3) {
  float amplitude = 0.2;
  vec4 total = vec4(0.);
  for (int i = 0; i < 3; i++) {
    n0 = rotate(n0, 0.3);
    n1 = rotate(n1, 0.3);
    n2 = rotate(n2, 0.3);
    n3 = rotate(n3, 0.3);
    total.x += valueNoiseR(n0) * amplitude;
    total.y += valueNoiseR(n1) * amplitude;
    total.z += valueNoiseR(n2) * amplitude;
    total.z += valueNoiseR(n3) * amplitude;
    n0 *= 1.99;
    n1 *= 1.99;
    n2 *= 1.99;
    n3 *= 1.99;
    amplitude *= 0.6;
  }
  return total;
}

${fi}

vec2 truchet(vec2 uv, float idx){
  idx = fract(((idx - .5) * 2.));
  if (idx > 0.75) {
    uv = vec2(1.0) - uv;
  } else if (idx > 0.5) {
    uv = vec2(1.0 - uv.x, uv.y);
  } else if (idx > 0.25) {
    uv = 1.0 - vec2(1.0 - uv.x, uv.y);
  }
  return uv;
}

void main() {

  const float firstFrameOffset = 7.;
  float t = .1 * (u_time + firstFrameOffset);

  vec2 shape_uv = vec2(0.);
  vec2 grain_uv = vec2(0.);

  float r = u_rotation * PI / 180.;
  float cr = cos(r);
  float sr = sin(r);
  mat2 graphicRotation = mat2(cr, sr, -sr, cr);
  vec2 graphicOffset = vec2(-u_offsetX, u_offsetY);

  if (u_shape > 3.5) {
    shape_uv = v_objectUV;
    grain_uv = shape_uv;

    // apply inverse transform to grain_uv so it respects the originXY
    grain_uv = transpose(graphicRotation) * grain_uv;
    grain_uv *= u_scale;
    grain_uv -= graphicOffset;
    grain_uv *= v_objectBoxSize;
    grain_uv *= .7;
  } else {
    shape_uv = .5 * v_patternUV;
    grain_uv = 100. * v_patternUV;

    // apply inverse transform to grain_uv so it respects the originXY
    grain_uv = transpose(graphicRotation) * grain_uv;
    grain_uv *= u_scale;
    if (u_fit > 0.) {
      vec2 givenBoxSize = vec2(u_worldWidth, u_worldHeight);
      givenBoxSize = max(givenBoxSize, vec2(1.)) * u_pixelRatio;
      float patternBoxRatio = givenBoxSize.x / givenBoxSize.y;
      vec2 patternBoxGivenSize = vec2(
      (u_worldWidth == 0.) ? u_resolution.x : givenBoxSize.x,
      (u_worldHeight == 0.) ? u_resolution.y : givenBoxSize.y
      );
      patternBoxRatio = patternBoxGivenSize.x / patternBoxGivenSize.y;
      float patternBoxNoFitBoxWidth = patternBoxRatio * min(patternBoxGivenSize.x / patternBoxRatio, patternBoxGivenSize.y);
      grain_uv /= (patternBoxNoFitBoxWidth / v_patternBoxSize.x);
    }
    vec2 patternBoxScale = u_resolution.xy / v_patternBoxSize;
    grain_uv -= graphicOffset / patternBoxScale;
    grain_uv *= 1.6;
  }


  float shape = 0.;

  if (u_shape < 1.5) {
    // Sine wave

    float wave = cos(.5 * shape_uv.x - 4. * t) * sin(1.5 * shape_uv.x + 2. * t) * (.75 + .25 * cos(6. * t));
    shape = 1. - smoothstep(-1., 1., shape_uv.y + wave);

  } else if (u_shape < 2.5) {
    // Grid (dots)

    float stripeIdx = floor(2. * shape_uv.x / TWO_PI);
    float rand = hash11(stripeIdx * 100.);
    rand = sign(rand - .5) * pow(4. * abs(rand), .3);
    shape = sin(shape_uv.x) * cos(shape_uv.y - 5. * rand * t);
    shape = pow(abs(shape), 4.);

  } else if (u_shape < 3.5) {
    // Truchet pattern

    float n2 = valueNoiseR(shape_uv * .4 - 3.75 * t);
    shape_uv.x += 10.;
    shape_uv *= .6;

    vec2 tile = truchet(fract(shape_uv), randomR(floor(shape_uv)));

    float distance1 = length(tile);
    float distance2 = length(tile - vec2(1.));

    n2 -= .5;
    n2 *= .1;
    shape = smoothstep(.2, .55, distance1 + n2) * (1. - smoothstep(.45, .8, distance1 - n2));
    shape += smoothstep(.2, .55, distance2 + n2) * (1. - smoothstep(.45, .8, distance2 - n2));

    shape = pow(shape, 1.5);

  } else if (u_shape < 4.5) {
    // Corners

    shape_uv *= .6;
    vec2 outer = vec2(.5);

    vec2 bl = smoothstep(vec2(0.), outer, shape_uv + vec2(.1 + .1 * sin(3. * t), .2 - .1 * sin(5.25 * t)));
    vec2 tr = smoothstep(vec2(0.), outer, 1. - shape_uv);
    shape = 1. - bl.x * bl.y * tr.x * tr.y;

    shape_uv = -shape_uv;
    bl = smoothstep(vec2(0.), outer, shape_uv + vec2(.1 + .1 * sin(3. * t), .2 - .1 * cos(5.25 * t)));
    tr = smoothstep(vec2(0.), outer, 1. - shape_uv);
    shape -= bl.x * bl.y * tr.x * tr.y;

    shape = 1. - smoothstep(0., 1., shape);

  } else if (u_shape < 5.5) {
    // Ripple

    shape_uv *= 2.;
    float dist = length(.4 * shape_uv);
    float waves = sin(pow(dist, 1.2) * 5. - 3. * t) * .5 + .5;
    shape = waves;

  } else if (u_shape < 6.5) {
    // Blob

    t *= 2.;

    vec2 f1_traj = .25 * vec2(1.3 * sin(t), .2 + 1.3 * cos(.6 * t + 4.));
    vec2 f2_traj = .2 * vec2(1.2 * sin(-t), 1.3 * sin(1.6 * t));
    vec2 f3_traj = .25 * vec2(1.7 * cos(-.6 * t), cos(-1.6 * t));
    vec2 f4_traj = .3 * vec2(1.4 * cos(.8 * t), 1.2 * sin(-.6 * t - 3.));

    shape = .5 * pow(1. - clamp(0., 1., length(shape_uv + f1_traj)), 5.);
    shape += .5 * pow(1. - clamp(0., 1., length(shape_uv + f2_traj)), 5.);
    shape += .5 * pow(1. - clamp(0., 1., length(shape_uv + f3_traj)), 5.);
    shape += .5 * pow(1. - clamp(0., 1., length(shape_uv + f4_traj)), 5.);

    shape = smoothstep(.0, .9, shape);
    float edge = smoothstep(.25, .3, shape);
    shape = mix(.0, shape, edge);

  } else {
    // Sphere

    shape_uv *= 2.;
    float d = 1. - pow(length(shape_uv), 2.);
    vec3 pos = vec3(shape_uv, sqrt(max(d, 0.)));
    vec3 lightPos = normalize(vec3(cos(1.5 * t), .8, sin(1.25 * t)));
    shape = .5 + .5 * dot(lightPos, pos);
    shape *= step(0., d);
  }

  float baseNoise = snoise(grain_uv * .5);
  vec4 fbmVals = fbmR(
  .002 * grain_uv + 10.,
  .003 * grain_uv,
  .001 * grain_uv,
  rotate(.4 * grain_uv, 2.)
  );
  float grainDist = baseNoise * snoise(grain_uv * .2) - fbmVals.x - fbmVals.y;
  float rawNoise = .75 * baseNoise - fbmVals.w - fbmVals.z;
  float noise = clamp(rawNoise, 0., 1.);

  shape += u_intensity * 2. / u_colorsCount * (grainDist + .5);
  shape += u_noise * 10. / u_colorsCount * noise;

  float aa = fwidth(shape);

  shape = clamp(shape - .5 / u_colorsCount, 0., 1.);
  float totalShape = smoothstep(0., u_softness + 2. * aa, clamp(shape * u_colorsCount, 0., 1.));
  float mixer = shape * (u_colorsCount - 1.);

  int cntStop = int(u_colorsCount) - 1;
  vec4 gradient = u_colors[0];
  gradient.rgb *= gradient.a;
  for (int i = 1; i < ${Ac.maxColorCount}; i++) {
    if (i > cntStop) break;

    float localT = clamp(mixer - float(i - 1), 0., 1.);
    localT = smoothstep(.5 - .5 * u_softness - aa, .5 + .5 * u_softness + aa, localT);

    vec4 c = u_colors[i];
    c.rgb *= c.a;
    gradient = mix(gradient, c, localT);
  }

  vec3 color = gradient.rgb * totalShape;
  float opacity = gradient.a * totalShape;

  vec3 bgColor = u_colorBack.rgb * u_colorBack.a;
  color = color + bgColor * (1.0 - opacity);
  opacity = opacity + u_colorBack.a * (1.0 - opacity);

  fragColor = vec4(color, opacity);
}
`,bc={wave:1,dots:2,truchet:3,corners:4,ripple:5,blob:6,sphere:7};var ur={maxColorCount:5,maxSpots:4},_c=`#version 300 es
precision lowp float;

uniform float u_time;

uniform vec4 u_colorBack;
uniform vec4 u_colors[${ur.maxColorCount}];
uniform float u_colorsCount;
uniform float u_roundness;
uniform float u_thickness;
uniform float u_marginLeft;
uniform float u_marginRight;
uniform float u_marginTop;
uniform float u_marginBottom;
uniform float u_aspectRatio;
uniform float u_softness;
uniform float u_intensity;
uniform float u_bloom;
uniform float u_spotSize;
uniform float u_spots;
uniform float u_pulse;
uniform float u_smoke;
uniform float u_smokeSize;

uniform sampler2D u_noiseTexture;

in vec2 v_responsiveUV;
in vec2 v_responsiveBoxGivenSize;
in vec2 v_patternUV;

out vec4 fragColor;

${nt}

float beat(float time) {
  float first = pow(abs(sin(time * TWO_PI)), 10.);
  float second = pow(abs(sin((time - .15) * TWO_PI)), 10.);

  return clamp(first + 0.6 * second, 0.0, 1.0);
}

float sst(float edge0, float edge1, float x) {
  return smoothstep(edge0, edge1, x);
}

float roundedBox(vec2 uv, vec2 halfSize, float distance, float cornerDistance, float thickness, float softness) {
  float borderDistance = abs(distance);
  float aa = 2. * fwidth(distance);
  float border = 1. - sst(min(mix(thickness, -thickness, softness), thickness + aa), max(mix(thickness, -thickness, softness), thickness + aa), borderDistance);
  float cornerFadeCircles = 0.;
  cornerFadeCircles = mix(1., cornerFadeCircles, sst(0., 1., length((uv + halfSize) / thickness)));
  cornerFadeCircles = mix(1., cornerFadeCircles, sst(0., 1., length((uv - vec2(-halfSize.x, halfSize.y)) / thickness)));
  cornerFadeCircles = mix(1., cornerFadeCircles, sst(0., 1., length((uv - vec2(halfSize.x, -halfSize.y)) / thickness)));
  cornerFadeCircles = mix(1., cornerFadeCircles, sst(0., 1., length((uv - halfSize) / thickness)));
  aa = fwidth(cornerDistance);
  float cornerFade = sst(0., mix(aa, thickness, softness), cornerDistance);
  cornerFade *= cornerFadeCircles;
  border += cornerFade;
  return border;
}

${mi}

float randomG(vec2 p) {
  vec2 uv = floor(p) / 100. + .5;
  return texture(u_noiseTexture, fract(uv)).g;
}
float valueNoise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  float a = randomG(i);
  float b = randomG(i + vec2(1.0, 0.0));
  float c = randomG(i + vec2(0.0, 1.0));
  float d = randomG(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  float x1 = mix(a, b, u.x);
  float x2 = mix(c, d, u.x);
  return mix(x1, x2, u.y);
}

void main() {
  const float firstFrameOffset = 109.;
  float t = 1.2 * (u_time + firstFrameOffset);

  vec2 borderUV = v_responsiveUV;
  float pulse = u_pulse * beat(.18 * u_time);

  float canvasRatio = v_responsiveBoxGivenSize.x / v_responsiveBoxGivenSize.y;
  vec2 halfSize = vec2(.5);
  borderUV.x *= max(canvasRatio, 1.);
  borderUV.y /= min(canvasRatio, 1.);
  halfSize.x *= max(canvasRatio, 1.);
  halfSize.y /= min(canvasRatio, 1.);

  float mL = u_marginLeft;
  float mR = u_marginRight;
  float mT = u_marginTop;
  float mB = u_marginBottom;
  float mX = mL + mR;
  float mY = mT + mB;

  if (u_aspectRatio > 0.) {
    float shapeRatio = canvasRatio * (1. - mX) / max(1. - mY, 1e-6);
    float freeX = shapeRatio > 1. ? (1. - mX) * (1. - 1. / max(abs(shapeRatio), 1e-6)) : 0.;
    float freeY = shapeRatio < 1. ? (1. - mY) * (1. - shapeRatio) : 0.;
    mL += freeX * 0.5;
    mR += freeX * 0.5;
    mT += freeY * 0.5;
    mB += freeY * 0.5;
    mX = mL + mR;
    mY = mT + mB;
  }

  float thickness = .5 * u_thickness * min(halfSize.x, halfSize.y);

  halfSize.x *= (1. - mX);
  halfSize.y *= (1. - mY);

  vec2 centerShift = vec2(
  (mL - mR) * max(canvasRatio, 1.) * 0.5,
  (mB - mT) / min(canvasRatio, 1.) * 0.5
  );

  borderUV -= centerShift;
  halfSize -= mix(thickness, 0., u_softness);

  float radius = mix(0., min(halfSize.x, halfSize.y), u_roundness);
  vec2 d = abs(borderUV) - halfSize + radius;
  float outsideDistance = length(max(d, .0001)) - radius;
  float insideDistance = min(max(d.x, d.y), .0001);
  float cornerDistance = abs(min(max(d.x, d.y) - .45 * radius, .0));
  float distance = outsideDistance + insideDistance;

  float borderThickness = mix(thickness, 3. * thickness, u_softness);
  float border = roundedBox(borderUV, halfSize, distance, cornerDistance, borderThickness, u_softness);
  border = pow(border, 1. + u_softness);

  vec2 smokeUV = .3 * u_smokeSize * v_patternUV;
  float smoke = clamp(3. * valueNoise(2.7 * smokeUV + .5 * t), 0., 1.);
  smoke -= valueNoise(3.4 * smokeUV - .5 * t);
  float smokeThickness = thickness + .2;
  smokeThickness = min(.4, max(smokeThickness, .1));
  smoke *= roundedBox(borderUV, halfSize, distance, cornerDistance, smokeThickness, 1.);
  smoke = 30. * smoke * smoke;
  smoke *= mix(0., .5, pow(u_smoke, 2.));
  smoke *= mix(1., pulse, u_pulse);
  smoke = clamp(smoke, 0., 1.);
  border += smoke;

  border = clamp(border, 0., 1.);

  vec3 blendColor = vec3(0.);
  float blendAlpha = 0.;
  vec3 addColor = vec3(0.);
  float addAlpha = 0.;

  float bloom = 4. * u_bloom;
  float intensity = 1. + (1. + 4. * u_softness) * u_intensity;

  float angle = atan(borderUV.y, borderUV.x) / TWO_PI;

  for (int colorIdx = 0; colorIdx < ${ur.maxColorCount}; colorIdx++) {
    if (colorIdx >= int(u_colorsCount)) break;
    float colorIdxF = float(colorIdx);

    vec3 c = u_colors[colorIdx].rgb * u_colors[colorIdx].a;
    float a = u_colors[colorIdx].a;

    for (int spotIdx = 0; spotIdx < ${ur.maxSpots}; spotIdx++) {
      if (spotIdx >= int(u_spots)) break;
      float spotIdxF = float(spotIdx);

      vec2 randVal = randomGB(vec2(spotIdxF * 10. + 2., 40. + colorIdxF));

      float time = (.1 + .15 * abs(sin(spotIdxF * (2. + colorIdxF)) * cos(spotIdxF * (2. + 2.5 * colorIdxF)))) * t + randVal.x * 3.;
      time *= mix(1., -1., step(.5, randVal.y));

      float mask = .5 + .5 * mix(
      sin(t + spotIdxF * (5. - 1.5 * colorIdxF)),
      cos(t + spotIdxF * (3. + 1.3 * colorIdxF)),
      step(mod(colorIdxF, 2.), .5)
      );

      float p = clamp(2. * u_pulse - randVal.x, 0., 1.);
      mask = mix(mask, pulse, p);

      float atg1 = fract(angle + time);
      float spotSize = .05 + .6 * pow(u_spotSize, 2.) + .05 * randVal.x;
      spotSize = mix(spotSize, .1, p);
      float sector = sst(.5 - spotSize, .5, atg1) * (1. - sst(.5, .5 + spotSize, atg1));

      sector *= mask;
      sector *= border;
      sector *= intensity;
      sector = clamp(sector, 0., 1.);

      vec3 srcColor = c * sector;
      float srcAlpha = a * sector;

      blendColor += ((1. - blendAlpha) * srcColor);
      blendAlpha = blendAlpha + (1. - blendAlpha) * srcAlpha;
      addColor += srcColor;
      addAlpha += srcAlpha;
    }
  }

  vec3 accumColor = mix(blendColor, addColor, bloom);
  float accumAlpha = mix(blendAlpha, addAlpha, bloom);
  accumAlpha = clamp(accumAlpha, 0., 1.);

  vec3 bgColor = u_colorBack.rgb * u_colorBack.a;
  vec3 color = accumColor + (1. - accumAlpha) * bgColor;
  float opacity = accumAlpha + (1. - accumAlpha) * u_colorBack.a;

  ${Zt}

  fragColor = vec4(color, opacity);
}`,Bc={auto:0,square:1};var Ec=`#version 300 es
precision mediump float;

uniform float u_time;

uniform vec4 u_colorBack;
uniform vec4 u_colorHighlight;

uniform sampler2D u_image;
uniform float u_imageAspectRatio;

uniform float u_size;
uniform float u_highlights;
uniform float u_layering;
uniform float u_edges;
uniform float u_caustic;
uniform float u_waves;

in vec2 v_imageUV;

out vec4 fragColor;

${nt}
${Nt}
${Ye}

float getUvFrame(vec2 uv) {
  float aax = 2. * fwidth(uv.x);
  float aay = 2. * fwidth(uv.y);

  float left   = smoothstep(0., aax, uv.x);
  float right = 1.0 - smoothstep(1. - aax, 1., uv.x);
  float bottom = smoothstep(0., aay, uv.y);
  float top = 1.0 - smoothstep(1. - aay, 1., uv.y);

  return left * right * bottom * top;
}

mat2 rotate2D(float r) {
  return mat2(cos(r), sin(r), -sin(r), cos(r));
}

float getCausticNoise(vec2 uv, float t, float scale) {
  vec2 n = vec2(.1);
  vec2 N = vec2(.1);
  mat2 m = rotate2D(.5);
  for (int j = 0; j < 6; j++) {
    uv *= m;
    n *= m;
    vec2 q = uv * scale + float(j) + n + (.5 + .5 * float(j)) * (mod(float(j), 2.) - 1.) * t;
    n += sin(q);
    N += cos(q) / scale;
    scale *= 1.1;
  }
  return (N.x + N.y + 1.);
}

void main() {
  vec2 imageUV = v_imageUV;
  vec2 patternUV = v_imageUV - .5;
  patternUV = (patternUV * vec2(u_imageAspectRatio, 1.));
  patternUV /= (.01 + .09 * u_size);

  float t = u_time;

  float wavesNoise = snoise((.3 + .1 * sin(t)) * .1 * patternUV + vec2(0., .4 * t));

  float causticNoise = getCausticNoise(patternUV + u_waves * vec2(1., -1.) * wavesNoise, 2. * t, 1.5);

  causticNoise += u_layering * getCausticNoise(patternUV + 2. * u_waves * vec2(1., -1.) * wavesNoise, 1.5 * t, 2.);
  causticNoise = causticNoise * causticNoise;

  float edgesDistortion = smoothstep(0., .1, imageUV.x);
  edgesDistortion *= smoothstep(0., .1, imageUV.y);
  edgesDistortion *= (smoothstep(1., 1.1, imageUV.x) + (1.0 - smoothstep(.8, .95, imageUV.x)));
  edgesDistortion *= (1.0 - smoothstep(.9, 1., imageUV.y));
  edgesDistortion = mix(edgesDistortion, 1., u_edges);

  float causticNoiseDistortion = .02 * causticNoise * edgesDistortion;

  float wavesDistortion = .1 * u_waves * wavesNoise;

  imageUV += vec2(wavesDistortion, -wavesDistortion);
  imageUV += (u_caustic * causticNoiseDistortion);

  float frame = getUvFrame(imageUV);

  vec4 image = texture(u_image, imageUV);
  vec4 backColor = u_colorBack;
  backColor.rgb *= backColor.a;

  vec3 color = mix(backColor.rgb, image.rgb, image.a * frame);
  float opacity = backColor.a + image.a * frame;

  causticNoise = max(-.2, causticNoise);

  float hightlight = .025 * u_highlights * causticNoise;
  hightlight *= u_colorHighlight.a;
  color = mix(color, u_colorHighlight.rgb, .05 * u_highlights * causticNoise);
  opacity += hightlight;

  color += hightlight * (.5 + .5 * wavesNoise);
  opacity += hightlight * (.5 + .5 * wavesNoise);

  opacity = clamp(opacity, 0., 1.);

  fragColor = vec4(color, opacity);
}
`;var Cc=`#version 300 es
precision mediump float;

uniform sampler2D u_image;
uniform float u_imageAspectRatio;

uniform vec2 u_resolution;
uniform float u_time;

uniform vec4 u_colorBack;
uniform vec4 u_colorTint;

uniform float u_softness;
uniform float u_repetition;
uniform float u_shiftRed;
uniform float u_shiftBlue;
uniform float u_distortion;
uniform float u_contour;
uniform float u_angle;

uniform float u_shape;
uniform bool u_isImage;

in vec2 v_objectUV;
in vec2 v_responsiveUV;
in vec2 v_responsiveBoxGivenSize;
in vec2 v_imageUV;

out vec4 fragColor;

${nt}
${Nt}
${Ye}

float getColorChanges(float c1, float c2, float stripe_p, vec3 w, float blur, float bump, float tint) {

  float ch = mix(c2, c1, smoothstep(.0, 2. * blur, stripe_p));

  float border = w[0];
  ch = mix(ch, c2, smoothstep(border, border + 2. * blur, stripe_p));

  if (u_isImage == true) {
    bump = smoothstep(.2, .8, bump);
  }
  border = w[0] + .4 * (1. - bump) * w[1];
  ch = mix(ch, c1, smoothstep(border, border + 2. * blur, stripe_p));

  border = w[0] + .5 * (1. - bump) * w[1];
  ch = mix(ch, c2, smoothstep(border, border + 2. * blur, stripe_p));

  border = w[0] + w[1];
  ch = mix(ch, c1, smoothstep(border, border + 2. * blur, stripe_p));

  float gradient_t = (stripe_p - w[0] - w[1]) / w[2];
  float gradient = mix(c1, c2, smoothstep(0., 1., gradient_t));
  ch = mix(ch, gradient, smoothstep(border, border + .5 * blur, stripe_p));

  // Tint color is applied with color burn blending
  ch = mix(ch, 1. - min(1., (1. - ch) / max(tint, 0.0001)), u_colorTint.a);
  return ch;
}

float getImgFrame(vec2 uv, float th) {
  float frame = 1.;
  frame *= smoothstep(0., th, uv.y);
  frame *= 1.0 - smoothstep(1. - th, 1., uv.y);
  frame *= smoothstep(0., th, uv.x);
  frame *= 1.0 - smoothstep(1. - th, 1., uv.x);
  return frame;
}

float blurEdge3x3(sampler2D tex, vec2 uv, vec2 dudx, vec2 dudy, float radius, float centerSample) {
  vec2 texel = 1.0 / vec2(textureSize(tex, 0));
  vec2 r = radius * texel;

  float w1 = 1.0, w2 = 2.0, w4 = 4.0;
  float norm = 16.0;
  float sum = w4 * centerSample;

  sum += w2 * textureGrad(tex, uv + vec2(0.0, -r.y), dudx, dudy).r;
  sum += w2 * textureGrad(tex, uv + vec2(0.0, r.y), dudx, dudy).r;
  sum += w2 * textureGrad(tex, uv + vec2(-r.x, 0.0), dudx, dudy).r;
  sum += w2 * textureGrad(tex, uv + vec2(r.x, 0.0), dudx, dudy).r;

  sum += w1 * textureGrad(tex, uv + vec2(-r.x, -r.y), dudx, dudy).r;
  sum += w1 * textureGrad(tex, uv + vec2(r.x, -r.y), dudx, dudy).r;
  sum += w1 * textureGrad(tex, uv + vec2(-r.x, r.y), dudx, dudy).r;
  sum += w1 * textureGrad(tex, uv + vec2(r.x, r.y), dudx, dudy).r;

  return sum / norm;
}

float lst(float edge0, float edge1, float x) {
  return clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
}

void main() {

  const float firstFrameOffset = 2.8;
  float t = .3 * (u_time + firstFrameOffset);

  vec2 uv = v_imageUV;
  vec2 dudx = dFdx(v_imageUV);
  vec2 dudy = dFdy(v_imageUV);
  vec4 img = textureGrad(u_image, uv, dudx, dudy);

  if (u_isImage == false) {
    uv = v_objectUV + .5;
    uv.y = 1. - uv.y;
  }

  float cycleWidth = u_repetition;
  float edge = 0.;
  float contOffset = 1.;

  vec2 rotatedUV = uv - vec2(.5);
  float angle = (-u_angle + 70.) * PI / 180.;
  float cosA = cos(angle);
  float sinA = sin(angle);
  rotatedUV = vec2(
  rotatedUV.x * cosA - rotatedUV.y * sinA,
  rotatedUV.x * sinA + rotatedUV.y * cosA
  ) + vec2(.5);

  if (u_isImage == true) {
    float edgeRaw = img.r;
    edge = blurEdge3x3(u_image, uv, dudx, dudy, 6., edgeRaw);
    edge = pow(edge, 1.6);
    edge *= mix(0.0, 1.0, smoothstep(0.0, 0.4, u_contour));
  } else {
    if (u_shape < 1.) {
      // full-fill on canvas
      vec2 borderUV = v_responsiveUV + .5;
      float ratio = v_responsiveBoxGivenSize.x / v_responsiveBoxGivenSize.y;
      vec2 mask = min(borderUV, 1. - borderUV);
      vec2 pixel_thickness = min(250. / v_responsiveBoxGivenSize, vec2(.5));
      float maskX = smoothstep(0.0, pixel_thickness.x, mask.x);
      float maskY = smoothstep(0.0, pixel_thickness.y, mask.y);
      maskX = pow(maskX, .25);
      maskY = pow(maskY, .25);
      edge = clamp(1. - maskX * maskY, 0., 1.);

      uv = v_responsiveUV;
      if (ratio > 1.) {
        uv.y /= ratio;
      } else {
        uv.x *= ratio;
      }
      uv += .5;
      uv.y = 1. - uv.y;

      cycleWidth *= 2.;
      contOffset = 1.5;

    } else if (u_shape < 2.) {
      // circle
      vec2 shapeUV = uv - .5;
      shapeUV *= .67;
      edge = pow(clamp(3. * length(shapeUV), 0., 1.), 18.);
    } else if (u_shape < 3.) {
      // daisy
      vec2 shapeUV = uv - .5;
      shapeUV *= 1.68;

      float r = length(shapeUV) * 2.;
      float a = atan(shapeUV.y, shapeUV.x) + .2;
      r *= (1. + .05 * sin(3. * a + 2. * t));
      float f = abs(cos(a * 3.));
      edge = smoothstep(f, f + .7, r);
      edge *= edge;

      uv *= .8;
      cycleWidth *= 1.6;

    } else if (u_shape < 4.) {
      // diamond
      vec2 shapeUV = uv - .5;
      shapeUV = rotate(shapeUV, .25 * PI);
      shapeUV *= 1.42;
      shapeUV += .5;
      vec2 mask = min(shapeUV, 1. - shapeUV);
      vec2 pixel_thickness = vec2(.15);
      float maskX = smoothstep(0.0, pixel_thickness.x, mask.x);
      float maskY = smoothstep(0.0, pixel_thickness.y, mask.y);
      maskX = pow(maskX, .25);
      maskY = pow(maskY, .25);
      edge = clamp(1. - maskX * maskY, 0., 1.);
    } else if (u_shape < 5.) {
      // metaballs
      vec2 shapeUV = uv - .5;
      shapeUV *= 1.3;
      edge = 0.;
      for (int i = 0; i < 5; i++) {
        float fi = float(i);
        float speed = 1.5 + 2./3. * sin(fi * 12.345);
        float angle = -fi * 1.5;
        vec2 dir1 = vec2(cos(angle), sin(angle));
        vec2 dir2 = vec2(cos(angle + 1.57), sin(angle + 1.));
        vec2 traj = .4 * (dir1 * sin(t * speed + fi * 1.23) + dir2 * cos(t * (speed * 0.7) + fi * 2.17));
        float d = length(shapeUV + traj);
        edge += pow(1.0 - clamp(d, 0.0, 1.0), 4.0);
      }
      edge = 1. - smoothstep(.65, .9, edge);
      edge = pow(edge, 4.);
    }

    edge = mix(smoothstep(.9 - 2. * fwidth(edge), .9, edge), edge, smoothstep(0.0, 0.4, u_contour));

  }

  float opacity = 0.;
  if (u_isImage == true) {
    opacity = img.g;
    float frame = getImgFrame(v_imageUV, 0.);
    opacity *= frame;
  } else {
    opacity = 1. - smoothstep(.9 - 2. * fwidth(edge), .9, edge);
    if (u_shape < 2.) {
      edge = 1.2 * edge;
    } else if (u_shape < 5.) {
      edge = 1.8 * pow(edge, 1.5);
    }
  }

  float diagBLtoTR = rotatedUV.x - rotatedUV.y;
  float diagTLtoBR = rotatedUV.x + rotatedUV.y;

  vec3 color = vec3(0.);
  vec3 color1 = vec3(.98, 0.98, 1.);
  vec3 color2 = vec3(.1, .1, .1 + .1 * smoothstep(.7, 1.3, diagTLtoBR));

  vec2 grad_uv = uv - .5;

  float dist = length(grad_uv + vec2(0., .2 * diagBLtoTR));
  grad_uv = rotate(grad_uv, (.25 - .2 * diagBLtoTR) * PI);
  float direction = grad_uv.x;

  float bump = pow(1.8 * dist, 1.2);
  bump = 1. - bump;
  bump *= pow(uv.y, .3);


  float thin_strip_1_ratio = .12 / cycleWidth * (1. - .4 * bump);
  float thin_strip_2_ratio = .07 / cycleWidth * (1. + .4 * bump);
  float wide_strip_ratio = (1. - thin_strip_1_ratio - thin_strip_2_ratio);

  float thin_strip_1_width = cycleWidth * thin_strip_1_ratio;
  float thin_strip_2_width = cycleWidth * thin_strip_2_ratio;

  float noise = snoise(uv - t);

  edge += (1. - edge) * u_distortion * noise;

  direction += diagBLtoTR;
  float contour = 0.;
  direction -= 2. * noise * diagBLtoTR * (smoothstep(0., 1., edge) * (1.0 - smoothstep(0., 1., edge)));
  direction *= mix(1., 1. - edge, smoothstep(.5, 1., u_contour));
  direction -= 1.7 * edge * smoothstep(.5, 1., u_contour);
  direction += .2 * pow(u_contour, 4.) * (1.0 - smoothstep(0., 1., edge));

  bump *= clamp(pow(uv.y, .1), .3, 1.);
  direction *= (.1 + (1.1 - edge) * bump);

  direction *= (.4 + .6 * (1.0 - smoothstep(.5, 1., edge)));
  direction += .18 * (smoothstep(.1, .2, uv.y) * (1.0 - smoothstep(.2, .4, uv.y)));
  direction += .03 * (smoothstep(.1, .2, 1. - uv.y) * (1.0 - smoothstep(.2, .4, 1. - uv.y)));

  direction *= (.5 + .5 * pow(uv.y, 2.));
  direction *= cycleWidth;
  direction -= t;


  float colorDispersion = (1. - bump);
  colorDispersion = clamp(colorDispersion, 0., 1.);
  float dispersionRed = colorDispersion;
  dispersionRed += .03 * bump * noise;
  dispersionRed += 5. * (smoothstep(-.1, .2, uv.y) * (1.0 - smoothstep(.1, .5, uv.y))) * (smoothstep(.4, .6, bump) * (1.0 - smoothstep(.4, 1., bump)));
  dispersionRed -= diagBLtoTR;

  float dispersionBlue = colorDispersion;
  dispersionBlue *= 1.3;
  dispersionBlue += (smoothstep(0., .4, uv.y) * (1.0 - smoothstep(.1, .8, uv.y))) * (smoothstep(.4, .6, bump) * (1.0 - smoothstep(.4, .8, bump)));
  dispersionBlue -= .2 * edge;

  dispersionRed *= (u_shiftRed / 20.);
  dispersionBlue *= (u_shiftBlue / 20.);

  float blur = 0.;
  float rExtraBlur = 0.;
  float gExtraBlur = 0.;
  if (u_isImage == true) {
    float softness = 0.05 * u_softness;
    blur = softness + .5 * smoothstep(1., 10., u_repetition) * smoothstep(.0, 1., edge);
    float smallCanvasT = 1.0 - smoothstep(100., 500., min(u_resolution.x, u_resolution.y));
    blur += smallCanvasT * smoothstep(.0, 1., edge);
    rExtraBlur = softness * (0.05 + .1 * (u_shiftRed / 20.) * bump);
    gExtraBlur = softness * 0.05 / max(0.001, abs(1. - diagBLtoTR));
  } else {
    blur = u_softness / 15. + .3 * contour;
  }

  vec3 w = vec3(thin_strip_1_width, thin_strip_2_width, wide_strip_ratio);
  w[1] -= .02 * smoothstep(.0, 1., edge + bump);
  float stripe_r = fract(direction + dispersionRed);
  float r = getColorChanges(color1.r, color2.r, stripe_r, w, blur + fwidth(stripe_r) + rExtraBlur, bump, u_colorTint.r);
  float stripe_g = fract(direction);
  float g = getColorChanges(color1.g, color2.g, stripe_g, w, blur + fwidth(stripe_g) + gExtraBlur, bump, u_colorTint.g);
  float stripe_b = fract(direction - dispersionBlue);
  float b = getColorChanges(color1.b, color2.b, stripe_b, w, blur + fwidth(stripe_b), bump, u_colorTint.b);

  color = vec3(r, g, b);
  color *= opacity;

  vec3 bgColor = u_colorBack.rgb * u_colorBack.a;
  color = color + bgColor * (1. - opacity);
  opacity = opacity + u_colorBack.a * (1. - opacity);

  ${Zt}

  fragColor = vec4(color, opacity);
}
`,vl={measurePerformance:!1,workingSize:512,iterations:40};function sr(t){let e=document.createElement("canvas"),a=e.getContext("2d"),l=typeof t=="string"&&t.startsWith("blob:");return new Promise((i,o)=>{if(!t||!a){o(new Error("Invalid file or canvas context"));return}let n=l&&fetch(t).then(s=>s.headers.get("Content-Type")),r=new Image;r.crossOrigin="anonymous";let u=performance.now();r.onload=async()=>{let s,p=await n;p?s=p==="image/svg+xml":typeof t=="string"?s=t.endsWith(".svg")||t.startsWith("data:image/svg+xml"):s=t.type==="image/svg+xml";let d=r.width||r.naturalWidth,c=r.height||r.naturalHeight;if(s){let it=d/c;d>c?(d=4096,c=4096/it):(c=4096,d=4096*it),r.width=d,r.height=c}let h=Math.min(d,c),S=vl.workingSize/h,A=Math.round(d*S),f=Math.round(c*S);vl.measurePerformance&&(console.log("[Processing Mode]"),console.log(`  Original: ${d}\xD7${c}`),console.log(`  Working: ${A}\xD7${f} (${(S*100).toFixed(1)}% scale)`),S<1&&console.log(`  Speedup: ~${Math.round(1/(S*S))}\xD7`)),e.width=d,e.height=c;let m=document.createElement("canvas");m.width=A,m.height=f;let g=m.getContext("2d");g.drawImage(r,0,0,A,f);let v=performance.now(),E=g.getImageData(0,0,A,f).data,b=new Uint8Array(A*f),T=new Uint8Array(A*f),z=0;for(let j=0,it=0;j<E.length;j+=4,it++){let $t=E[j+3]===0?0:1;b[it]=$t,z+=$t}let M=[],K=[];for(let j=0;j<f;j++)for(let it=0;it<A;it++){let pt=j*A+it;if(!b[pt])continue;let $t=!1;it===0||it===A-1||j===0||j===f-1?$t=!0:$t=!b[pt-1]||!b[pt+1]||!b[pt-A]||!b[pt+A]||!b[pt-A-1]||!b[pt-A+1]||!b[pt+A-1]||!b[pt+A+1],$t?(T[pt]=1,M.push(pt)):K.push(pt)}vl.measurePerformance&&(console.log(`[Mask Building] Time: ${(performance.now()-v).toFixed(2)}ms`),console.log(`  Shape pixels: ${z} / ${A*f} (${(z/(A*f)*100).toFixed(1)}%)`),console.log(`  Interior pixels: ${K.length}`),console.log(`  Boundary pixels: ${M.length}`));let It=e2(b,T,new Uint32Array(K),new Uint32Array(M),A,f),ta=performance.now(),Pt=a2(It,b,T,A,f);vl.measurePerformance&&console.log(`[Poisson Solve] Time: ${(performance.now()-ta).toFixed(2)}ms`);let ze=0,Xt;for(let j=0;j<K.length;j++){let it=K[j];Pt[it]>ze&&(ze=Pt[it])}let jt=document.createElement("canvas");jt.width=A,jt.height=f;let Ja=jt.getContext("2d"),Te=Ja.createImageData(A,f);for(let j=0;j<f;j++)for(let it=0;it<A;it++){let pt=j*A+it,$t=pt*4;if(!b[pt])Te.data[$t]=255,Te.data[$t+1]=255,Te.data[$t+2]=255,Te.data[$t+3]=0;else{let mr=255*(1-Pt[pt]/ze);Te.data[$t]=mr,Te.data[$t+1]=mr,Te.data[$t+2]=mr,Te.data[$t+3]=255}}Ja.putImageData(Te,0,0),a.imageSmoothingEnabled=!0,a.imageSmoothingQuality="high",a.drawImage(jt,0,0,A,f,0,0,d,c);let re=a.getImageData(0,0,d,c),fr=document.createElement("canvas");fr.width=d,fr.height=c;let cf=fr.getContext("2d");cf.drawImage(r,0,0,d,c);let jg=cf.getImageData(0,0,d,c);for(let j=0;j<re.data.length;j+=4){let it=jg.data[j+3],pt=re.data[j+3];it===0?(re.data[j]=255,re.data[j+1]=0):(re.data[j]=pt===0?0:re.data[j],re.data[j+1]=it),re.data[j+2]=255,re.data[j+3]=255}a.putImageData(re,0,0),Xt=re,e.toBlob(j=>{if(!j){o(new Error("Failed to create PNG blob"));return}if(vl.measurePerformance){let it=performance.now()-u;if(console.log(`[Total Processing Time] ${it.toFixed(2)}ms`),S<1){let pt=it*Math.pow(d*c/(A*f),1.5);console.log(`[Estimated time at full resolution] ~${pt.toFixed(0)}ms`),console.log(`[Time saved] ~${(pt-it).toFixed(0)}ms (${Math.round(pt/it)}\xD7 faster)`)}}i({imageData:Xt,pngBlob:j})},"image/png")},r.onerror=()=>o(new Error("Failed to load image")),r.src=typeof t=="string"?t:URL.createObjectURL(t)})}function e2(t,e,a,l,i,o){let n=a.length,r=new Int32Array(n*4);for(let u=0;u<n;u++){let s=a[u],p=s%i,d=Math.floor(s/i);r[u*4+0]=p<i-1&&t[s+1]?s+1:-1,r[u*4+1]=p>0&&t[s-1]?s-1:-1,r[u*4+2]=d>0&&t[s-i]?s-i:-1,r[u*4+3]=d<o-1&&t[s+i]?s+i:-1}return{interiorPixels:a,boundaryPixels:l,pixelCount:n,neighborIndices:r}}function a2(t,e,a,l,i){let o=vl.iterations,n=.01,r=new Float32Array(l*i),{interiorPixels:u,neighborIndices:s,pixelCount:p}=t,d=performance.now(),c=1.9,h=[],y=[];for(let S=0;S<p;S++){let A=u[S],f=A%l,m=Math.floor(A/l);(f+m)%2===0?h.push(S):y.push(S)}for(let S=0;S<o;S++){for(let A of h){let f=u[A],m=s[A*4+0],g=s[A*4+1],v=s[A*4+2],_=s[A*4+3],E=0;m>=0&&(E+=r[m]),g>=0&&(E+=r[g]),v>=0&&(E+=r[v]),_>=0&&(E+=r[_]);let b=(n+E)/4;r[f]=c*b+(1-c)*r[f]}for(let A of y){let f=u[A],m=s[A*4+0],g=s[A*4+1],v=s[A*4+2],_=s[A*4+3],E=0;m>=0&&(E+=r[m]),g>=0&&(E+=r[g]),v>=0&&(E+=r[v]),_>=0&&(E+=r[_]);let b=(n+E)/4;r[f]=c*b+(1-c)*r[f]}}if(vl.measurePerformance){let S=performance.now()-d;console.log(`[Optimized Poisson Solver (SOR \u03C9=${c})]`),console.log(`  Working size: ${l}\xD7${i}`),console.log(`  Iterations: ${o}`),console.log(`  Time: ${S.toFixed(2)}ms`),console.log(`  Interior pixels processed: ${p}`),console.log(`  Speed: ${(o*p/(S*1e3)).toFixed(2)} Mpixels/sec`)}return r}var zc={none:0,circle:1,daisy:2,diamond:3,metaballs:4};function O(t){if(Array.isArray(t))return t.length===4?t:t.length===3?[...t,1]:Tc;if(typeof t!="string")return Tc;let e,a,l,i=1;if(t.startsWith("#"))[e,a,l,i]=l2(t);else if(t.startsWith("rgb"))[e,a,l,i]=i2(t);else if(t.startsWith("hsl"))[e,a,l,i]=n2(o2(t));else return console.error("Unsupported color format",t),Tc;return[cr(e,0,1),cr(a,0,1),cr(l,0,1),cr(i,0,1)]}function l2(t){t=t.replace(/^#/,""),t.length===3&&(t=t.split("").map(o=>o+o).join("")),t.length===6&&(t=t+"ff");let e=parseInt(t.slice(0,2),16)/255,a=parseInt(t.slice(2,4),16)/255,l=parseInt(t.slice(4,6),16)/255,i=parseInt(t.slice(6,8),16)/255;return[e,a,l,i]}function i2(t){let e=t.match(/^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([0-9.]+))?\s*\)$/i);return e?[parseInt(e[1]??"0")/255,parseInt(e[2]??"0")/255,parseInt(e[3]??"0")/255,e[4]===void 0?1:parseFloat(e[4])]:[0,0,0,1]}function o2(t){let e=t.match(/^hsla?\s*\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(?:,\s*([0-9.]+))?\s*\)$/i);return e?[parseInt(e[1]??"0"),parseInt(e[2]??"0"),parseInt(e[3]??"0"),e[4]===void 0?1:parseFloat(e[4])]:[0,0,0,1]}function n2(t){let[e,a,l,i]=t,o=e/360,n=a/100,r=l/100,u,s,p;if(a===0)u=s=p=r;else{let d=(y,S,A)=>(A<0&&(A+=1),A>1&&(A-=1),A<.16666666666666666?y+(S-y)*6*A:A<.5?S:A<.6666666666666666?y+(S-y)*(.6666666666666666-A)*6:y),c=r<.5?r*(1+n):r+n-r*n,h=2*r-c;u=d(h,c,o+1/3),s=d(h,c,o),p=d(h,c,o-1/3)}return[u,s,p,i]}var cr=(t,e,a)=>Math.min(Math.max(t,e),a),Tc=[0,0,0,1];function ie(){if(typeof window>"u")return;let t=new Image;return t.src=r2,t}var r2="data:image/png;base64,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";var Mc="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";var pi=B(H(),1);function _h(t){let e=pi.useRef(void 0),a=pi.useCallback(l=>{let i=t.map(o=>{if(o!=null){if(typeof o=="function"){let n=o,r=n(l);return typeof r=="function"?r:()=>{n(null)}}return o.current=l,()=>{o.current=null}}});return()=>{i.forEach(o=>o?.())}},t);return pi.useMemo(()=>t.every(l=>l==null)?null:l=>{e.current&&(e.current(),e.current=void 0),l!=null&&(e.current=a(l))},t)}function Uc(t){if(t.naturalWidth<1024&&t.naturalHeight<1024){if(t.naturalWidth<1||t.naturalHeight<1)return;let e=t.naturalWidth/t.naturalHeight;t.width=Math.round(e>1?1024*e:1024),t.height=Math.round(e>1?1024:1024/e)}}var Eh=B(U(),1);async function Bh(t){let e={},a=[],l=o=>{try{return o.startsWith("/")||new URL(o),!0}catch{return!1}},i=o=>{try{return o.startsWith("/")?!1:new URL(o,window.location.origin).origin!==window.location.origin}catch{return!1}};return Object.entries(t).forEach(([o,n])=>{if(typeof n=="string"){let r=n||Mc;if(!l(r)){console.warn(`Uniform "${o}" has invalid URL "${r}". Skipping image loading.`);return}let u=new Promise((s,p)=>{let d=new Image;i(r)&&(d.crossOrigin="anonymous"),d.onload=()=>{Uc(d),e[o]=d,s()},d.onerror=()=>{console.error(`Could not set uniforms. Failed to load image at ${r}`),p()},d.src=r});a.push(u)}else n instanceof HTMLImageElement&&Uc(n),e[o]=n}),await Promise.all(a),e}var P=(0,oe.forwardRef)(function({fragmentShader:e,uniforms:a,webGlContextAttributes:l,speed:i=0,frame:o=0,width:n,height:r,minPixelRatio:u,maxPixelCount:s,mipmaps:p,style:d,...c},h){let[y,S]=(0,oe.useState)(!1),A=(0,oe.useRef)(null),f=(0,oe.useRef)(null),m=(0,oe.useRef)(l);(0,oe.useEffect)(()=>((async()=>{let _=await Bh(a);A.current&&!f.current&&(f.current=new xo(A.current,e,_,m.current,i,o,u,s,p),S(!0))})(),()=>{f.current?.dispose(),f.current=null}),[e]),(0,oe.useEffect)(()=>{let v=!1;return(async()=>{let E=await Bh(a);v||f.current?.setUniforms(E)})(),()=>{v=!0}},[a,y]),(0,oe.useEffect)(()=>{f.current?.setSpeed(i)},[i,y]),(0,oe.useEffect)(()=>{f.current?.setMaxPixelCount(s)},[s,y]),(0,oe.useEffect)(()=>{f.current?.setMinPixelRatio(u)},[u,y]),(0,oe.useEffect)(()=>{f.current?.setFrame(o)},[o,y]);let g=_h([A,h]);return(0,Eh.jsx)("div",{ref:g,style:n!==void 0||r!==void 0?{width:typeof n=="string"&&isNaN(+n)===!1?+n:n,height:typeof r=="string"&&isNaN(+r)===!1?+r:r,...d}:d,...c})});P.displayName="ShaderMount";var Ch=B(H(),1);function gt(t,e){for(let a in t){if(a==="colors"){let l=Array.isArray(t.colors),i=Array.isArray(e.colors);if(!l||!i){if(Object.is(t.colors,e.colors)===!1)return!1;continue}if(t.colors?.length!==e.colors?.length||!t.colors?.every((o,n)=>o===e.colors?.[n]))return!1;continue}if(Object.is(t[a],e[a])===!1)return!1}return!0}var zh=B(U(),1),Kt={name:"Default",params:{...D,speed:1,frame:0,colors:["#e0eaff","#241d9a","#f75092","#9f50d3"],distortion:.8,swirl:.1,grainMixer:0,grainOverlay:0}},SA={name:"Purple",params:{...D,speed:.6,frame:0,colors:["#aaa7d7","#3c2b8e"],distortion:1,swirl:1,grainMixer:0,grainOverlay:0}},AA={name:"Beach",params:{...D,speed:.1,frame:0,colors:["#bcecf6","#00aaff","#00f7ff","#ffd447"],distortion:.8,swirl:.35,grainMixer:0,grainOverlay:0}},xA={name:"Ink",params:{...D,speed:1,frame:0,colors:["#ffffff","#000000"],distortion:1,swirl:.2,rotation:90,grainMixer:0,grainOverlay:0}};var Rc=(0,Ch.memo)(function({speed:e=Kt.params.speed,frame:a=Kt.params.frame,colors:l=Kt.params.colors,distortion:i=Kt.params.distortion,swirl:o=Kt.params.swirl,grainMixer:n=Kt.params.grainMixer,grainOverlay:r=Kt.params.grainOverlay,fit:u=Kt.params.fit,rotation:s=Kt.params.rotation,scale:p=Kt.params.scale,originX:d=Kt.params.originX,originY:c=Kt.params.originY,offsetX:h=Kt.params.offsetX,offsetY:y=Kt.params.offsetY,worldWidth:S=Kt.params.worldWidth,worldHeight:A=Kt.params.worldHeight,...f}){let m={u_colors:l.map(O),u_colorsCount:l.length,u_distortion:i,u_swirl:o,u_grainMixer:n,u_grainOverlay:r,u_fit:I[u],u_rotation:s,u_scale:p,u_offsetX:h,u_offsetY:y,u_originX:d,u_originY:c,u_worldWidth:S,u_worldHeight:A};return(0,zh.jsx)(P,{...f,speed:e,frame:a,fragmentShader:ac,uniforms:m})},gt);var Th=B(H(),1);var Mh=B(U(),1),Wt={name:"Default",params:{...L,speed:1,frame:0,colorFront:"#ffffff",colorMid:"#47a6ff",colorBack:"#000000",brightness:.05,contrast:.3}},CA={name:"Sensation",params:{...L,speed:1,frame:0,colorFront:"#00c8ff",colorMid:"#fbff00",colorBack:"#8b42ff",brightness:.19,contrast:.12,scale:3}},zA={name:"Bloodstream",params:{...L,speed:1,frame:0,colorFront:"#ff0000",colorMid:"#ff0000",colorBack:"#ffffff",brightness:.24,contrast:.17,scale:.7}},TA={name:"Ghost",params:{...L,speed:1,frame:0,colorFront:"#ffffff",colorMid:"#000000",colorBack:"#ffffff",brightness:0,contrast:1,scale:.55}};var Dc=(0,Th.memo)(function({speed:e=Wt.params.speed,frame:a=Wt.params.frame,colorFront:l=Wt.params.colorFront,colorMid:i=Wt.params.colorMid,colorBack:o=Wt.params.colorBack,brightness:n=Wt.params.brightness,contrast:r=Wt.params.contrast,fit:u=Wt.params.fit,scale:s=Wt.params.scale,rotation:p=Wt.params.rotation,originX:d=Wt.params.originX,originY:c=Wt.params.originY,offsetX:h=Wt.params.offsetX,offsetY:y=Wt.params.offsetY,worldWidth:S=Wt.params.worldWidth,worldHeight:A=Wt.params.worldHeight,...f}){let m={u_colorFront:O(l),u_colorMid:O(i),u_colorBack:O(o),u_brightness:n,u_contrast:r,u_fit:I[u],u_scale:s,u_rotation:p,u_offsetX:h,u_offsetY:y,u_originX:d,u_originY:c,u_worldWidth:S,u_worldHeight:A};return(0,Mh.jsx)(P,{...f,speed:e,frame:a,fragmentShader:lc,uniforms:m})},gt);var Uh=B(H(),1);var Rh=B(U(),1),qt={name:"Default",params:{...L,speed:1.5,frame:0,colorBack:"#000000",colors:["#ffc96b","#ff6200","#ff2f00","#421100","#1a0000"],size:1,sizeRange:0,spreading:1,stepsPerColor:4}},OA={name:"Shine",params:{...L,speed:.1,frame:0,colors:["#ffffff","#006aff","#fff675"],colorBack:"#000000",stepsPerColor:4,size:.3,sizeRange:.2,spreading:1,scale:.4}},wA={name:"Bubbles",params:{...L,speed:.4,frame:0,colors:["#D0D2D5"],colorBack:"#989CA4",stepsPerColor:2,size:.9,sizeRange:.7,spreading:1,scale:1.64}},NA={name:"Hallucinatory",params:{...L,speed:5,frame:0,colors:["#000000"],colorBack:"#ffe500",stepsPerColor:2,size:.65,sizeRange:0,spreading:.3,scale:.5}};var Oc=(0,Uh.memo)(function({speed:e=qt.params.speed,frame:a=qt.params.frame,colorBack:l=qt.params.colorBack,colors:i=qt.params.colors,size:o=qt.params.size,sizeRange:n=qt.params.sizeRange,spreading:r=qt.params.spreading,stepsPerColor:u=qt.params.stepsPerColor,fit:s=qt.params.fit,scale:p=qt.params.scale,rotation:d=qt.params.rotation,originX:c=qt.params.originX,originY:h=qt.params.originY,offsetX:y=qt.params.offsetX,offsetY:S=qt.params.offsetY,worldWidth:A=qt.params.worldWidth,worldHeight:f=qt.params.worldHeight,...m}){let g={u_colorBack:O(l),u_colors:i.map(O),u_colorsCount:i.length,u_size:o,u_sizeRange:n,u_spreading:r,u_stepsPerColor:u,u_noiseTexture:ie(),u_fit:I[s],u_scale:p,u_rotation:d,u_offsetX:y,u_offsetY:S,u_originX:c,u_originY:h,u_worldWidth:A,u_worldHeight:f};return(0,Rh.jsx)(P,{...m,speed:e,frame:a,fragmentShader:oc,uniforms:g})},gt);var Dh=B(H(),1);var Oh=B(U(),1),ne={name:"Default",params:{...D,scale:1,speed:1,frame:0,colorBack:"#000000",colors:["#6e33cc","#ff5500","#ffc105","#ffc800","#f585ff"],count:10,size:.83}},YA={name:"Ink Drops",params:{...D,scale:1,speed:2,frame:0,colorBack:"#ffffff00",colors:["#000000"],count:18,size:.1}},FA={name:"Background",params:{...D,speed:.5,frame:0,colors:["#ae00ff","#00ff95","#ffc105"],colorBack:"#2a273f",count:13,size:.81,scale:4,rotation:0,offsetX:-.3}},qA={name:"Solar",params:{...D,speed:1,frame:0,colors:["#ffc800","#ff5500","#ffc105"],colorBack:"#102f84",count:7,size:.75,scale:1}};var wc=(0,Dh.memo)(function({speed:e=ne.params.speed,frame:a=ne.params.frame,colorBack:l=ne.params.colorBack,colors:i=ne.params.colors,size:o=ne.params.size,count:n=ne.params.count,fit:r=ne.params.fit,rotation:u=ne.params.rotation,scale:s=ne.params.scale,originX:p=ne.params.originX,originY:d=ne.params.originY,offsetX:c=ne.params.offsetX,offsetY:h=ne.params.offsetY,worldWidth:y=ne.params.worldWidth,worldHeight:S=ne.params.worldHeight,...A}){let f={u_colorBack:O(l),u_colors:i.map(O),u_colorsCount:i.length,u_size:o,u_count:n,u_noiseTexture:ie(),u_fit:I[r],u_rotation:u,u_scale:s,u_offsetX:c,u_offsetY:h,u_originX:p,u_originY:d,u_worldWidth:y,u_worldHeight:S};return(0,Oh.jsx)(P,{...A,speed:e,frame:a,fragmentShader:nc,uniforms:f})},gt);var wh=B(H(),1);var Nh=B(U(),1),Gt={name:"Default",params:{...L,speed:.5,frame:0,colors:["#ff8247","#ffe53d"],stepsPerColor:3,colorGlow:"#ffffff",colorGap:"#2e0000",distortion:.4,gap:.04,glow:0,scale:.5}},ZA={name:"Cells",params:{...L,scale:.5,speed:.5,frame:0,colors:["#ffffff"],stepsPerColor:1,colorGlow:"#ffffff",colorGap:"#000000",distortion:.5,gap:.03,glow:.8}},KA={name:"Bubbles",params:{...L,scale:.75,speed:.5,frame:0,colors:["#83c9fb"],stepsPerColor:1,colorGlow:"#ffffff",colorGap:"#ffffff",distortion:.4,gap:0,glow:1}},WA={name:"Lights",params:{...L,scale:3.3,speed:.5,frame:0,colors:["#fffffffc","#bbff00","#00ffff"],colorGlow:"#ff00d0",colorGap:"#ff00d0",stepsPerColor:2,distortion:.38,gap:0,glow:1}};var Nc=(0,wh.memo)(function({speed:e=Gt.params.speed,frame:a=Gt.params.frame,colors:l=Gt.params.colors,stepsPerColor:i=Gt.params.stepsPerColor,colorGlow:o=Gt.params.colorGlow,colorGap:n=Gt.params.colorGap,distortion:r=Gt.params.distortion,gap:u=Gt.params.gap,glow:s=Gt.params.glow,fit:p=Gt.params.fit,scale:d=Gt.params.scale,rotation:c=Gt.params.rotation,originX:h=Gt.params.originX,originY:y=Gt.params.originY,offsetX:S=Gt.params.offsetX,offsetY:A=Gt.params.offsetY,worldWidth:f=Gt.params.worldWidth,worldHeight:m=Gt.params.worldHeight,...g}){let v={u_colors:l.map(O),u_colorsCount:l.length,u_stepsPerColor:i,u_colorGlow:O(o),u_colorGap:O(n),u_distortion:r,u_gap:u,u_glow:s,u_noiseTexture:ie(),u_fit:I[p],u_scale:d,u_rotation:c,u_offsetX:S,u_offsetY:A,u_originX:h,u_originY:y,u_worldWidth:f,u_worldHeight:m};return(0,Nh.jsx)(P,{...g,speed:e,frame:a,fragmentShader:uc,uniforms:v})},gt);var Gh=B(H(),1);var Vh=B(U(),1),Mt={name:"Default",params:{...L,rotation:0,speed:1,frame:0,colors:["#121212","#9470ff","#121212","#8838ff"],proportion:.45,softness:1,distortion:.25,swirl:.8,swirlIterations:10,shapeScale:.1,shape:"checks"}},tx={name:"Cauldron Pot",params:{...L,scale:.9,rotation:160,speed:10,frame:0,colors:["#a7e58b","#324472","#0a180d"],proportion:.64,softness:1.5,distortion:.2,swirl:.86,swirlIterations:7,shapeScale:.6,shape:"edge"}},ex={name:"Live Ink",params:{...L,scale:1.2,rotation:44,offsetY:-.3,speed:2.5,frame:0,colors:["#111314","#9faeab","#f3fee7","#f3fee7"],proportion:.05,softness:0,distortion:.25,swirl:.8,swirlIterations:10,shapeScale:.28,shape:"checks"}},ax={name:"Kelp",params:{...L,scale:.8,rotation:50,speed:20,frame:0,colors:["#dbff8f","#404f3e","#091316"],proportion:.67,softness:0,distortion:0,swirl:.2,swirlIterations:3,shapeScale:1,shape:"stripes"}},lx={name:"Nectar",params:{...L,scale:2,offsetY:.6,rotation:0,speed:4.2,frame:0,colors:["#151310","#d3a86b","#f0edea"],proportion:.24,softness:1,distortion:.21,swirl:.57,swirlIterations:10,shapeScale:.75,shape:"edge"}},ix={name:"Passion",params:{...L,scale:2.5,rotation:1.35,speed:3,frame:0,colors:["#3b1515","#954751","#ffc085"],proportion:.5,softness:1,distortion:.09,swirl:.9,swirlIterations:6,shapeScale:.25,shape:"checks"}};var Gc=(0,Gh.memo)(function({speed:e=Mt.params.speed,frame:a=Mt.params.frame,colors:l=Mt.params.colors,proportion:i=Mt.params.proportion,softness:o=Mt.params.softness,distortion:n=Mt.params.distortion,swirl:r=Mt.params.swirl,swirlIterations:u=Mt.params.swirlIterations,shapeScale:s=Mt.params.shapeScale,shape:p=Mt.params.shape,fit:d=Mt.params.fit,scale:c=Mt.params.scale,rotation:h=Mt.params.rotation,originX:y=Mt.params.originX,originY:S=Mt.params.originY,offsetX:A=Mt.params.offsetX,offsetY:f=Mt.params.offsetY,worldWidth:m=Mt.params.worldWidth,worldHeight:g=Mt.params.worldHeight,...v}){let _={u_colors:l.map(O),u_colorsCount:l.length,u_proportion:i,u_softness:o,u_distortion:n,u_swirl:r,u_swirlIterations:u,u_shapeScale:s,u_shape:fc[p],u_noiseTexture:ie(),u_scale:c,u_rotation:h,u_fit:I[d],u_offsetX:A,u_offsetY:f,u_originX:y,u_originY:S,u_worldWidth:m,u_worldHeight:g};return(0,Vh.jsx)(P,{...v,speed:e,frame:a,fragmentShader:cc,uniforms:_})},gt);var Hh=B(H(),1);var Qh=B(U(),1),Et={name:"Default",params:{...D,offsetX:0,offsetY:-.55,colorBack:"#000000",colorBloom:"#0000ff",colors:["#a600ff6e","#6200fff0","#ffffff","#33fff5"],density:.3,spotty:.3,midIntensity:.4,midSize:.2,intensity:.8,bloom:.4,speed:.75,frame:0}},sx={name:"Warp",params:{...D,colorBack:"#000000",colorBloom:"#222288",colors:["#ff47d4","#ff8c00","#ffffff"],density:.45,spotty:.15,midIntensity:.4,midSize:.33,intensity:.79,bloom:.4,speed:2,frame:0}},cx={name:"Linear",params:{...D,offsetX:.2,offsetY:-.8,colorBack:"#000000",colorBloom:"#eeeeee",colors:["#ffffff1f","#ffffff3d","#ffffff29"],density:.41,spotty:.25,midSize:.1,midIntensity:.75,intensity:.79,bloom:1,speed:.5,frame:0}},fx={name:"Ether",params:{...D,offsetX:-.6,colorBack:"#090f1d",colorBloom:"#ffffff",colors:["#148effa6","#c4dffebe","#232a47"],density:.03,spotty:.77,midSize:.1,midIntensity:.6,intensity:.6,bloom:.6,speed:1,frame:0}};var Vc=(0,Hh.memo)(function({speed:e=Et.params.speed,frame:a=Et.params.frame,colorBloom:l=Et.params.colorBloom,colorBack:i=Et.params.colorBack,colors:o=Et.params.colors,density:n=Et.params.density,spotty:r=Et.params.spotty,midIntensity:u=Et.params.midIntensity,midSize:s=Et.params.midSize,intensity:p=Et.params.intensity,bloom:d=Et.params.bloom,fit:c=Et.params.fit,scale:h=Et.params.scale,rotation:y=Et.params.rotation,originX:S=Et.params.originX,originY:A=Et.params.originY,offsetX:f=Et.params.offsetX,offsetY:m=Et.params.offsetY,worldWidth:g=Et.params.worldWidth,worldHeight:v=Et.params.worldHeight,..._}){let E={u_colorBloom:O(l),u_colorBack:O(i),u_colors:o.map(O),u_colorsCount:o.length,u_density:n,u_spotty:r,u_midIntensity:u,u_midSize:s,u_intensity:p,u_bloom:d,u_noiseTexture:ie(),u_fit:I[c],u_scale:h,u_rotation:y,u_offsetX:f,u_offsetY:m,u_originX:S,u_originY:A,u_worldWidth:g,u_worldHeight:v};return(0,Qh.jsx)(P,{..._,speed:e,frame:a,fragmentShader:pc,uniforms:E})},gt);var Yh=B(H(),1);var Fh=B(U(),1),St={name:"Default",params:{...L,scale:1,colorBack:"#001429",colorFront:"#79D1FF",density:1,distortion:0,strokeWidth:.5,strokeTaper:0,strokeCap:0,noise:0,noiseFrequency:0,softness:0,speed:1,frame:0}},gx={name:"Droplet",params:{...L,colorBack:"#effafe",colorFront:"#bf40a0",density:.9,distortion:0,strokeWidth:.75,strokeTaper:.18,strokeCap:1,noise:.74,noiseFrequency:.33,softness:.02,speed:1,frame:0}},vx={name:"Jungle",params:{...L,scale:1.3,density:.5,colorBack:"#a0ef2a",colorFront:"#288b18",distortion:0,strokeWidth:.5,strokeTaper:0,strokeCap:0,noise:1,noiseFrequency:.25,softness:0,speed:.75,frame:0}},yx={name:"Swirl",params:{...L,scale:.45,colorBack:"#b3e6d9",colorFront:"#1a2b4d",density:.2,distortion:0,strokeWidth:.5,strokeTaper:0,strokeCap:0,noise:0,noiseFrequency:.3,softness:.5,speed:1,frame:0}};var Hc=(0,Yh.memo)(function({speed:e=St.params.speed,frame:a=St.params.frame,colorBack:l=St.params.colorBack,colorFront:i=St.params.colorFront,density:o=St.params.density,distortion:n=St.params.distortion,strokeWidth:r=St.params.strokeWidth,strokeTaper:u=St.params.strokeTaper,strokeCap:s=St.params.strokeCap,noiseFrequency:p=St.params.noiseFrequency,noise:d=St.params.noise,softness:c=St.params.softness,fit:h=St.params.fit,rotation:y=St.params.rotation,scale:S=St.params.scale,originX:A=St.params.originX,originY:f=St.params.originY,offsetX:m=St.params.offsetX,offsetY:g=St.params.offsetY,worldWidth:v=St.params.worldWidth,worldHeight:_=St.params.worldHeight,...E}){let b={u_colorBack:O(l),u_colorFront:O(i),u_density:o,u_distortion:n,u_strokeWidth:r,u_strokeTaper:u,u_strokeCap:s,u_noiseFrequency:p,u_noise:d,u_softness:c,u_fit:I[h],u_scale:S,u_rotation:y,u_offsetX:m,u_offsetY:g,u_originX:A,u_originY:f,u_worldWidth:v,u_worldHeight:_};return(0,Fh.jsx)(P,{...E,speed:e,frame:a,fragmentShader:dc,uniforms:b})},gt);var qh=B(H(),1);var Lh=B(U(),1),Ct={name:"Default",params:{...D,speed:.32,frame:0,colorBack:"#330000",colors:["#ffd1d1","#ff8a8a","#660000"],bandCount:4,twist:.1,center:.2,proportion:.5,softness:0,noiseFrequency:.4,noise:.2}},_x={name:"Opening",params:{...D,offsetX:-.4,offsetY:1,speed:.5,frame:0,colorBack:"#ff8b61",colors:["#fefff0","#ffd8bd","#ff8b61"],bandCount:2,twist:.3,center:.2,proportion:.5,softness:0,noiseFrequency:0,noise:0,scale:1}},Bx={name:"007",params:{...D,speed:1,frame:0,colorBack:"#E9E7DA",colors:["#000000"],bandCount:5,twist:.3,center:0,proportion:0,softness:0,noiseFrequency:.5,noise:0}},Ex={name:"Candy",params:{...D,speed:1,frame:0,colorBack:"#ffcd66",colors:["#6bbceb","#d7b3ff","#ff9fff"],bandCount:2,twist:.15,center:.2,proportion:.5,softness:1,noiseFrequency:.5,noise:0}};var Qc=(0,qh.memo)(function({speed:e=Ct.params.speed,frame:a=Ct.params.frame,colorBack:l=Ct.params.colorBack,colors:i=Ct.params.colors,bandCount:o=Ct.params.bandCount,twist:n=Ct.params.twist,center:r=Ct.params.center,proportion:u=Ct.params.proportion,softness:s=Ct.params.softness,noiseFrequency:p=Ct.params.noiseFrequency,noise:d=Ct.params.noise,fit:c=Ct.params.fit,rotation:h=Ct.params.rotation,scale:y=Ct.params.scale,originX:S=Ct.params.originX,originY:A=Ct.params.originY,offsetX:f=Ct.params.offsetX,offsetY:m=Ct.params.offsetY,worldWidth:g=Ct.params.worldWidth,worldHeight:v=Ct.params.worldHeight,..._}){let E={u_colorBack:O(l),u_colors:i.map(O),u_colorsCount:i.length,u_bandCount:o,u_twist:n,u_center:r,u_proportion:u,u_softness:s,u_noiseFrequency:p,u_noise:d,u_fit:I[c],u_scale:y,u_rotation:h,u_offsetX:f,u_offsetY:m,u_originX:S,u_originY:A,u_worldWidth:g,u_worldHeight:v};return(0,Lh.jsx)(P,{..._,speed:e,frame:a,fragmentShader:gc,uniforms:E})},gt);var Xh=B(H(),1);var jh=B(U(),1),Jt={name:"Default",params:{...L,speed:1,frame:0,scale:.6,colorBack:"#000000",colorFront:"#00b2ff",shape:"sphere",type:"4x4",size:2}},Ux={name:"Sine Wave",params:{...L,speed:1,frame:0,colorBack:"#730d54",colorFront:"#00becc",shape:"wave",type:"4x4",size:11,scale:1.2}},Rx={name:"Bugs",params:{...L,speed:1,frame:0,colorBack:"#000000",colorFront:"#008000",shape:"dots",type:"random",size:9}},Dx={name:"Ripple",params:{...D,speed:1,frame:0,colorBack:"#603520",colorFront:"#c67953",shape:"ripple",type:"2x2",size:3}},Ox={name:"Swirl",params:{...D,speed:1,frame:0,colorBack:"#00000000",colorFront:"#47a8e1",shape:"swirl",type:"8x8",size:2}},wx={name:"Warp",params:{...D,speed:1,frame:0,colorBack:"#301c2a",colorFront:"#56ae6c",shape:"warp",type:"4x4",size:2.5}};var Yc=(0,Xh.memo)(function({speed:e=Jt.params.speed,frame:a=Jt.params.frame,colorBack:l=Jt.params.colorBack,colorFront:i=Jt.params.colorFront,shape:o=Jt.params.shape,type:n=Jt.params.type,pxSize:r,size:u=r===void 0?Jt.params.size:r,fit:s=Jt.params.fit,scale:p=Jt.params.scale,rotation:d=Jt.params.rotation,originX:c=Jt.params.originX,originY:h=Jt.params.originY,offsetX:y=Jt.params.offsetX,offsetY:S=Jt.params.offsetY,worldWidth:A=Jt.params.worldWidth,worldHeight:f=Jt.params.worldHeight,...m}){let g={u_colorBack:O(l),u_colorFront:O(i),u_shape:yc[o],u_type:Sc[n],u_pxSize:u,u_fit:I[s],u_scale:p,u_rotation:d,u_offsetX:y,u_offsetY:S,u_originX:c,u_originY:h,u_worldWidth:A,u_worldHeight:f};return(0,jh.jsx)(P,{...m,speed:e,frame:a,fragmentShader:vc,uniforms:g})});var kh=B(H(),1);var Zh=B(U(),1),Lt={name:"Default",params:{...D,speed:1,frame:0,colorBack:"#000000",colors:["#7300ff","#eba8ff","#00bfff","#2a00ff"],softness:.5,intensity:.5,noise:.25,shape:"corners"}},Hx={name:"Wave",params:{...L,speed:1,frame:0,colorBack:"#000a0f",colors:["#c4730b","#bdad5f","#d8ccc7"],softness:.7,intensity:.15,noise:.5,shape:"wave"}},Qx={name:"Dots",params:{...L,scale:.6,speed:1,frame:0,colorBack:"#0a0000",colors:["#6f0000","#0080ff","#f2ebc9","#33cc33"],softness:1,intensity:1,noise:.7,shape:"dots"}},Yx={name:"Truchet",params:{...L,speed:1,frame:0,colorBack:"#0a0000",colors:["#6f2200","#eabb7c","#39b523"],softness:0,intensity:.2,noise:1,shape:"truchet"}},Fx={name:"Ripple",params:{...D,scale:.5,speed:1,frame:0,colorBack:"#140a00",colors:["#6f2d00","#88ddae","#2c0b1d"],softness:.5,intensity:.5,noise:.5,shape:"ripple"}},qx={name:"Blob",params:{...D,scale:1.3,speed:1,frame:0,colorBack:"#0f0e18",colors:["#3e6172","#a49b74","#568c50"],softness:0,intensity:.15,noise:.5,shape:"blob"}};var Fc=(0,kh.memo)(function({speed:e=Lt.params.speed,frame:a=Lt.params.frame,colorBack:l=Lt.params.colorBack,colors:i=Lt.params.colors,softness:o=Lt.params.softness,intensity:n=Lt.params.intensity,noise:r=Lt.params.noise,shape:u=Lt.params.shape,fit:s=Lt.params.fit,scale:p=Lt.params.scale,rotation:d=Lt.params.rotation,originX:c=Lt.params.originX,originY:h=Lt.params.originY,offsetX:y=Lt.params.offsetX,offsetY:S=Lt.params.offsetY,worldWidth:A=Lt.params.worldWidth,worldHeight:f=Lt.params.worldHeight,...m}){let g={u_colorBack:O(l),u_colors:i.map(O),u_colorsCount:i.length,u_softness:o,u_intensity:n,u_noise:r,u_shape:bc[u],u_noiseTexture:ie(),u_fit:I[s],u_scale:p,u_rotation:d,u_offsetX:y,u_offsetY:S,u_originX:c,u_originY:h,u_worldWidth:A,u_worldHeight:f};return(0,Zh.jsx)(P,{...m,speed:e,frame:a,fragmentShader:xc,uniforms:g})});var Kh=B(H(),1);var Wh=B(U(),1),at={name:"Default",params:{...D,speed:1,frame:0,scale:.6,colorBack:"#000000",colors:["#0dc1fd","#d915ef","#ff3f2ecc"],roundness:.25,thickness:.1,margin:0,marginLeft:0,marginRight:0,marginTop:0,marginBottom:0,aspectRatio:"auto",softness:.75,intensity:.2,bloom:.25,spots:5,spotSize:.5,pulse:.25,smoke:.3,smokeSize:.6}},Kx={name:"Circle",params:{...D,aspectRatio:"square",scale:.6,speed:1,frame:0,colorBack:"#000000",colors:["#0dc1fd","#d915ef","#ff3f2ecc"],roundness:1,margin:0,marginLeft:0,marginRight:0,marginTop:0,marginBottom:0,thickness:0,softness:.75,intensity:.2,bloom:.45,spots:3,spotSize:.4,pulse:.5,smoke:1,smokeSize:0}},Wx={name:"Northern lights",params:{...D,speed:.18,scale:1.1,frame:0,colors:["#4c4794","#774a7d","#12694a","#0aff78","#4733cc"],colorBack:"#0c182c",roundness:0,thickness:1,softness:1,margin:0,marginLeft:0,marginRight:0,marginTop:0,marginBottom:0,aspectRatio:"auto",intensity:.1,bloom:.2,spots:4,spotSize:.25,pulse:0,smoke:.32,smokeSize:.5}},Jx={name:"Solid line",params:{...D,speed:1,frame:0,colors:["#81ADEC"],colorBack:"#00000000",roundness:0,thickness:.05,margin:0,marginLeft:0,marginRight:0,marginTop:0,marginBottom:0,aspectRatio:"auto",softness:0,intensity:0,bloom:.15,spots:4,spotSize:1,pulse:0,smoke:0,smokeSize:0}};var qc=(0,Kh.memo)(function({speed:e=at.params.speed,frame:a=at.params.frame,colors:l=at.params.colors,colorBack:i=at.params.colorBack,roundness:o=at.params.roundness,thickness:n=at.params.thickness,aspectRatio:r=at.params.aspectRatio,softness:u=at.params.softness,bloom:s=at.params.bloom,intensity:p=at.params.intensity,spots:d=at.params.spots,spotSize:c=at.params.spotSize,pulse:h=at.params.pulse,smoke:y=at.params.smoke,smokeSize:S=at.params.smokeSize,margin:A,marginLeft:f=A??at.params.marginLeft,marginRight:m=A??at.params.marginRight,marginTop:g=A??at.params.marginTop,marginBottom:v=A??at.params.marginBottom,fit:_=at.params.fit,rotation:E=at.params.rotation,scale:b=at.params.scale,originX:T=at.params.originX,originY:z=at.params.originY,offsetX:M=at.params.offsetX,offsetY:K=at.params.offsetY,worldWidth:It=at.params.worldWidth,worldHeight:ta=at.params.worldHeight,...Pt}){let ze={u_colorBack:O(i),u_colors:l.map(O),u_colorsCount:l.length,u_roundness:o,u_thickness:n,u_marginLeft:f,u_marginRight:m,u_marginTop:g,u_marginBottom:v,u_aspectRatio:Bc[r],u_softness:u,u_intensity:p,u_bloom:s,u_spots:d,u_spotSize:c,u_pulse:h,u_smoke:y,u_smokeSize:S,u_noiseTexture:ie(),u_fit:I[_],u_rotation:E,u_scale:b,u_offsetX:M,u_offsetY:K,u_originX:T,u_originY:z,u_worldWidth:It,u_worldHeight:ta};return(0,Wh.jsx)(P,{...Pt,speed:e,frame:a,fragmentShader:_c,uniforms:ze})},gt);var Jh=B(H(),1);var Ih=B(U(),1),Ut={name:"Default",params:{...D,scale:.8,speed:1,frame:0,colorBack:"#909090",colorHighlight:"#ffffff",highlights:.07,layering:.5,edges:.8,waves:.3,caustic:.1,size:1}},eb={name:"Abstract",params:{...D,fit:"cover",scale:3,speed:1,frame:0,colorBack:"#909090",colorHighlight:"#ffffff",highlights:0,layering:0,edges:1,waves:1,caustic:.4,size:.15}},ab={name:"Streaming",params:{...D,fit:"contain",scale:.4,speed:2,frame:0,colorBack:"#909090",colorHighlight:"#ffffff",highlights:0,layering:0,edges:0,waves:.5,caustic:0,size:.5}},lb={name:"Slow-mo",params:{...D,fit:"cover",scale:1,speed:.1,frame:0,colorBack:"#909090",colorHighlight:"#ffffff",highlights:.4,layering:0,edges:0,waves:0,caustic:.2,size:.7}};var Lc=(0,Jh.memo)(function({speed:e=Ut.params.speed,frame:a=Ut.params.frame,colorBack:l=Ut.params.colorBack,colorHighlight:i=Ut.params.colorHighlight,image:o="",highlights:n=Ut.params.highlights,layering:r=Ut.params.layering,waves:u=Ut.params.waves,edges:s=Ut.params.edges,caustic:p=Ut.params.caustic,effectScale:d,size:c=d===void 0?Ut.params.size:10/9/d-1/9,fit:h=Ut.params.fit,scale:y=Ut.params.scale,rotation:S=Ut.params.rotation,originX:A=Ut.params.originX,originY:f=Ut.params.originY,offsetX:m=Ut.params.offsetX,offsetY:g=Ut.params.offsetY,worldWidth:v=Ut.params.worldWidth,worldHeight:_=Ut.params.worldHeight,...E}){let b={u_image:o,u_colorBack:O(l),u_colorHighlight:O(i),u_highlights:n,u_layering:r,u_waves:u,u_edges:s,u_caustic:p,u_size:c,u_fit:I[h],u_rotation:S,u_scale:y,u_offsetX:m,u_offsetY:g,u_originX:A,u_originY:f,u_worldWidth:v,u_worldHeight:_};return(0,Ih.jsx)(P,{...E,speed:e,frame:a,fragmentShader:Ec,mipmaps:["u_image"],uniforms:b})},gt);var Xc="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";var u2=t=>typeof t=="object"&&typeof t.then=="function",Ph=[];function s2(t,e){if(t===e)return!0;if(!t||!e)return!1;let a=t.length;if(e.length!==a)return!1;for(let l=0;l<a;l++)if(t[l]!==e[l])return!1;return!0}function c2(t,e=null){e===null&&(e=[t]);for(let l of Ph)if(s2(e,l.keys)){if(Object.prototype.hasOwnProperty.call(l,"error"))throw l.error;if(Object.prototype.hasOwnProperty.call(l,"response"))return l.response;throw l.promise}let a={keys:e,promise:(u2(t)?t:t(...e)).then(l=>{a.response=l}).catch(l=>a.error=l)};throw Ph.push(a),a.promise}var $h=(t,e)=>c2(t,e);var di=B(H(),1);var tg=B(U(),1),At={name:"Default",params:{...D,scale:.6,speed:1,frame:0,colorBack:"#AAAAAC",colorTint:"#ffffff",distortion:.07,repetition:2,shiftRed:.3,shiftBlue:.3,contour:.4,softness:.1,angle:70,shape:"diamond"}},fb={name:"Noir",params:{...D,scale:.6,speed:1,frame:0,colorBack:"#000000",colorTint:"#606060",softness:.45,repetition:1.5,shiftRed:0,shiftBlue:0,distortion:0,contour:0,angle:90,shape:"diamond"}},mb={name:"Backdrop",params:{...D,speed:1,frame:0,scale:1,colorBack:"#AAAAAC",colorTint:"#ffffff",softness:.05,repetition:1.5,shiftRed:.3,shiftBlue:.3,distortion:.1,contour:.4,shape:"none",angle:90,worldWidth:0,worldHeight:0}},pb={name:"Stripes",params:{...D,speed:1,frame:0,scale:.6,colorBack:"#000000",colorTint:"#2c5d72",softness:.8,repetition:6,shiftRed:1,shiftBlue:-1,distortion:.4,contour:.4,shape:"circle",angle:0}};var jc=(0,di.memo)(function({colorBack:e=At.params.colorBack,colorTint:a=At.params.colorTint,speed:l=At.params.speed,frame:i=At.params.frame,image:o="",contour:n=At.params.contour,distortion:r=At.params.distortion,softness:u=At.params.softness,repetition:s=At.params.repetition,shiftRed:p=At.params.shiftRed,shiftBlue:d=At.params.shiftBlue,angle:c=At.params.angle,shape:h=At.params.shape,suspendWhenProcessingImage:y=!1,fit:S=At.params.fit,scale:A=At.params.scale,rotation:f=At.params.rotation,originX:m=At.params.originX,originY:g=At.params.originY,offsetX:v=At.params.offsetX,offsetY:_=At.params.offsetY,worldWidth:E=At.params.worldWidth,worldHeight:b=At.params.worldHeight,...T}){let z=typeof o=="string"?o:o.src,[M,K]=(0,di.useState)(Xc),It;y&&typeof window<"u"&&z?It=$h(()=>sr(z).then(Pt=>URL.createObjectURL(Pt.pngBlob)),[z,"liquid-metal"]):It=M,(0,di.useLayoutEffect)(()=>{if(y)return;if(!z){K(Xc);return}let Pt,ze=!0;return sr(z).then(Xt=>{ze&&(Pt=URL.createObjectURL(Xt.pngBlob),K(Pt))}),()=>{ze=!1}},[z,y]);let ta={u_colorBack:O(e),u_colorTint:O(a),u_image:It,u_contour:n,u_distortion:r,u_softness:u,u_repetition:s,u_shiftRed:p,u_shiftBlue:d,u_angle:c,u_isImage:!!o,u_shape:zc[h],u_fit:I[S],u_scale:A,u_rotation:f,u_offsetX:v,u_offsetY:_,u_originX:m,u_originY:g,u_worldWidth:E,u_worldHeight:b};return(0,tg.jsx)(P,{...T,speed:l,frame:i,fragmentShader:Cc,mipmaps:["u_image"],uniforms:ta})});var eg=B(H());var kc=B(U()),f2=["#3a3a52","#4a4a68","#5a5a7e"];function ag({speed:t=1,colors:e=f2,colorBack:a="#12121a",softness:l=.6,intensity:i=.2,noise:o=.15,className:n,...r}){let u=N(),{fps:s,width:p,height:d}=F(),c=0,h=(0,eg.useCallback)(y=>{y&&requestAnimationFrame(()=>requestAnimationFrame(()=>et(c)))},[c]);return(0,kc.jsx)("div",{ref:h,className:n,style:{position:"absolute",inset:0},children:(0,kc.jsx)(Fc,{speed:0,frame:u/s*t*1e3,colors:e,colorBack:a,softness:l,intensity:i,noise:o,fit:"cover",width:p,height:d,...r})})}var lg=B(H());var Zc=B(U()),m2=["#12121a","#232338","#3a3a5c","#52527a"];function ig({speed:t=1,colors:e=m2,distortion:a=.6,swirl:l=.1,className:i,...o}){let n=N(),{fps:r,width:u,height:s}=F(),p=0,d=(0,lg.useCallback)(c=>{c&&requestAnimationFrame(()=>requestAnimationFrame(()=>et(p)))},[p]);return(0,Zc.jsx)("div",{ref:d,className:i,style:{position:"absolute",inset:0},children:(0,Zc.jsx)(Rc,{speed:0,frame:n/r*t*1e3,colors:e,distortion:a,swirl:l,fit:"cover",width:u,height:s,...o})})}var og=B(H());var Kc=B(U()),p2=["#12121a","#3a3a5c","#12121a","#52527a"];function ng({speed:t=1,colors:e=p2,proportion:a=.5,softness:l=1,distortion:i=.2,swirl:o=.4,className:n,...r}){let u=N(),{fps:s,width:p,height:d}=F(),c=0,h=(0,og.useCallback)(y=>{y&&requestAnimationFrame(()=>requestAnimationFrame(()=>et(c)))},[c]);return(0,Kc.jsx)("div",{ref:h,className:n,style:{position:"absolute",inset:0},children:(0,Kc.jsx)(Gc,{speed:0,frame:u/s*t*1e3,colors:e,proportion:a,softness:l,distortion:i,swirl:o,fit:"cover",width:p,height:d,...r})})}var rg=B(H());var Wc=B(U());function ug({speed:t=1,colorBack:e="#2a2a30",colorTint:a="#8a8a95",distortion:l=.1,repetition:i=1.5,contour:o=.4,softness:n=.05,shape:r="none",className:u,...s}){let p=N(),{fps:d,width:c,height:h}=F(),y=0,S=(0,rg.useCallback)(A=>{A&&requestAnimationFrame(()=>requestAnimationFrame(()=>et(y)))},[y]);return(0,Wc.jsx)("div",{ref:S,className:u,style:{position:"absolute",inset:0},children:(0,Wc.jsx)(jc,{speed:0,frame:p/d*t*1e3,colorBack:e,colorTint:a,distortion:l,repetition:i,contour:o,softness:n,shape:r,fit:"cover",width:c,height:h,...s})})}var sg=B(H());var Jc=B(U()),d2=["#5a5a7e","#8a8a95","#ffffff","#3a3a5c"];function cg({speed:t=1,colorBack:e="#12121a",colorBloom:a="#3a3a5c",colors:l=d2,intensity:i=.8,density:o=.3,bloom:n=.4,className:r,...u}){let s=N(),{fps:p,width:d,height:c}=F(),h=0,y=(0,sg.useCallback)(S=>{S&&requestAnimationFrame(()=>requestAnimationFrame(()=>et(h)))},[h]);return(0,Jc.jsx)("div",{ref:y,className:r,style:{position:"absolute",inset:0},children:(0,Jc.jsx)(Vc,{speed:0,frame:s/p*t*1e3,colorBack:e,colorBloom:a,colors:l,intensity:i,density:o,bloom:n,fit:"cover",width:d,height:c,...u})})}var fg=B(H());var Ic=B(U());function mg({speed:t=1,colorFront:e="#8a8a95",colorMid:a="#4a4a68",colorBack:l="#12121a",brightness:i=.05,contrast:o=.3,className:n,...r}){let u=N(),{fps:s,width:p,height:d}=F(),c=0,h=(0,fg.useCallback)(y=>{y&&requestAnimationFrame(()=>requestAnimationFrame(()=>et(c)))},[c]);return(0,Ic.jsx)("div",{ref:h,className:n,style:{position:"absolute",inset:0},children:(0,Ic.jsx)(Dc,{speed:0,frame:u/s*t*1e3,colorFront:e,colorMid:a,colorBack:l,brightness:i,contrast:o,fit:"cover",width:p,height:d,...r})})}var pg=B(H());var Pc=B(U()),h2=["#3a3a5c","#52527a"];function dg({speed:t=1,colors:e=h2,colorGap:a="#12121a",distortion:l=.4,gap:i=.04,glow:o=0,className:n,...r}){let u=N(),{fps:s,width:p,height:d}=F(),c=0,h=(0,pg.useCallback)(y=>{y&&requestAnimationFrame(()=>requestAnimationFrame(()=>et(c)))},[c]);return(0,Pc.jsx)("div",{ref:h,className:n,style:{position:"absolute",inset:0},children:(0,Pc.jsx)(Nc,{speed:0,frame:u/s*t*1e3,colors:e,colorGap:a,distortion:l,gap:i,glow:o,fit:"cover",width:p,height:d,...r})})}var hg=B(H());var $c=B(U()),g2=["#4a4a68","#52527a","#3a3a5c"];function gg({speed:t=1,colorBack:e="#12121a",colors:a=g2,size:l=1,spreading:i=1,className:o,...n}){let r=N(),{fps:u,width:s,height:p}=F(),d=0,c=(0,hg.useCallback)(h=>{h&&requestAnimationFrame(()=>requestAnimationFrame(()=>et(d)))},[d]);return(0,$c.jsx)("div",{ref:c,className:o,style:{position:"absolute",inset:0},children:(0,$c.jsx)(Oc,{speed:0,frame:r/u*t*1e3,colorBack:e,colors:a,size:l,spreading:i,fit:"cover",width:s,height:p,...n})})}var vg=B(H());var tf=B(U()),v2=["#3a3a5c","#52527a","#8a8a95"];function yg({speed:t=1,colorBack:e="#12121a",colors:a=v2,count:l=10,size:i=.83,className:o,...n}){let r=N(),{fps:u,width:s,height:p}=F(),d=0,c=(0,vg.useCallback)(h=>{h&&requestAnimationFrame(()=>requestAnimationFrame(()=>et(d)))},[d]);return(0,tf.jsx)("div",{ref:c,className:o,style:{position:"absolute",inset:0},children:(0,tf.jsx)(wc,{speed:0,frame:r/u*t*1e3,colorBack:e,colors:a,count:l,size:i,fit:"cover",width:s,height:p,...n})})}var Sg=B(H());var ef=B(U());function Ag({speed:t=1,colorBack:e="#16202b",colorHighlight:a="#5a6a7a",highlights:l=.06,waves:i=.3,caustic:o=.08,className:n,...r}){let u=N(),{fps:s,width:p,height:d}=F(),c=0,h=(0,Sg.useCallback)(y=>{y&&requestAnimationFrame(()=>requestAnimationFrame(()=>et(c)))},[c]);return(0,ef.jsx)("div",{ref:h,className:n,style:{position:"absolute",inset:0},children:(0,ef.jsx)(Lc,{speed:0,frame:u/s*t*1e3,colorBack:e,colorHighlight:a,highlights:l,waves:i,caustic:o,fit:"cover",width:p,height:d,...r})})}var xg=B(H());var af=B(U());function bg({speed:t=1,colorBack:e="#12121a",colorFront:a="#52527a",density:l=1,strokeWidth:i=.5,softness:o=.2,className:n,...r}){let u=N(),{fps:s,width:p,height:d}=F(),c=0,h=(0,xg.useCallback)(y=>{y&&requestAnimationFrame(()=>requestAnimationFrame(()=>et(c)))},[c]);return(0,af.jsx)("div",{ref:h,className:n,style:{position:"absolute",inset:0},children:(0,af.jsx)(Hc,{speed:0,frame:u/s*t*1e3,colorBack:e,colorFront:a,density:l,strokeWidth:i,softness:o,fit:"cover",width:p,height:d,...r})})}var _g=B(H());var lf=B(U()),y2=["#52527a","#3a3a5c","#232338"];function Bg({speed:t=1,colors:e=y2,colorBack:a="#12121a",bandCount:l=4,twist:i=.1,softness:o=.2,className:n,...r}){let u=N(),{fps:s,width:p,height:d}=F(),c=0,h=(0,_g.useCallback)(y=>{y&&requestAnimationFrame(()=>requestAnimationFrame(()=>et(c)))},[c]);return(0,lf.jsx)("div",{ref:h,className:n,style:{position:"absolute",inset:0},children:(0,lf.jsx)(Qc,{speed:0,frame:u/s*t*1e3,colors:e,colorBack:a,bandCount:l,twist:i,softness:o,fit:"cover",width:p,height:d,...r})})}var Eg=B(H());var of=B(U());function Cg({speed:t=1,colorBack:e="#12121a",colorFront:a="#6a6a85",shape:l="wave",type:i="4x4",size:o=2,className:n,...r}){let u=N(),{fps:s,width:p,height:d}=F(),c=0,h=(0,Eg.useCallback)(y=>{y&&requestAnimationFrame(()=>requestAnimationFrame(()=>et(c)))},[c]);return(0,of.jsx)("div",{ref:h,className:n,style:{position:"absolute",inset:0},children:(0,of.jsx)(Yc,{speed:0,frame:u/s*t*1e3,colorBack:e,colorFront:a,shape:l,type:i,size:o,fit:"cover",width:p,height:d,...r})})}var zg=B(H());var nf=B(U()),S2=["#52527a","#8a8a95","#3a3a5c"];function Tg({speed:t=1,colorBack:e="#12121a",colors:a=S2,roundness:l=.25,thickness:i=.1,intensity:o=.2,bloom:n=.25,className:r,...u}){let s=N(),{fps:p,width:d,height:c}=F(),h=0,y=(0,zg.useCallback)(S=>{S&&requestAnimationFrame(()=>requestAnimationFrame(()=>et(h)))},[h]);return(0,nf.jsx)("div",{ref:y,className:r,style:{position:"absolute",inset:0},children:(0,nf.jsx)(qc,{speed:0,frame:s/p*t*1e3,colorBack:e,colors:a,roundness:l,thickness:i,intensity:o,bloom:n,fit:"cover",width:d,height:c,...u})})}var C=B(U()),{fontFamily:A2}=fh("normal",{subsets:["latin"],weights:["400","500","600","700","800"]}),{fontFamily:x2}=mh("normal",{subsets:["latin"],weights:["400","500"]}),hi="var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",b2=`${x2}, ui-monospace, SFMono-Regular, monospace`,yl="#fafafa",Mg="rgba(250,250,250,0.62)",uf="rgba(250,250,250,0.4)",sf="#81ADEC",Xe={extrapolateLeft:"clamp",extrapolateRight:"clamp"},Ug=78,Rg=112,Dg=76,Og=36,wg=92,Ng=104,Gg=156,Vg=18,gi=16,Hg=({size:t})=>(0,C.jsx)("svg",{viewBox:"0 0 39 39",fill:"none",width:t,height:t,children:(0,C.jsx)("path",{d:"M39 24H24V6H6V24H24V39H0V6H6V0H39V24Z",fill:sf})}),Qg=[{name:"shader-mesh-gradient",node:(0,C.jsx)(ig,{speed:2,colors:["#12102a","#3b2a80","#7c5cff","#c9b8ff"],distortion:.8,swirl:.2})},{name:"shader-warp",node:(0,C.jsx)(ng,{speed:2,colors:["#041418","#0d4f5c","#2fb7c4","#c8f4f7"],swirl:.6})},{name:"shader-liquid-metal",node:(0,C.jsx)(ug,{speed:2,colorBack:"#17171c",colorTint:"#c9c9d6"})},{name:"shader-god-rays",node:(0,C.jsx)(cg,{speed:2,colorBack:"#0d0a05",colorBloom:"#6b4e17",colors:["#ffe4b3","#f6b352","#fff6e0","#8a6a2a"],intensity:1,bloom:.55})},{name:"shader-neuro-noise",node:(0,C.jsx)(mg,{speed:2,colorFront:"#7ef0c0",colorMid:"#14503a",colorBack:"#03100a",contrast:.4})},{name:"shader-voronoi",node:(0,C.jsx)(dg,{speed:2,colors:["#0e2a55","#2b6cb0","#66b2f0","#cfe8ff"],colorGap:"#04080f",glow:.15})},{name:"shader-dot-orbit",node:(0,C.jsx)(gg,{speed:2,colorBack:"#0a0a12",colors:["#81adec","#5a8fd8","#e8f0fb","#33538a"]})},{name:"shader-metaballs",node:(0,C.jsx)(yg,{speed:2,colorBack:"#150a16",colors:["#ff6b9d","#ff9e64","#ffd166","#c084fc"]})},{name:"shader-water",node:(0,C.jsx)(Ag,{speed:2,colorBack:"#06121c",colorHighlight:"#aee3f2",highlights:.12,caustic:.12})},{name:"shader-spiral",node:(0,C.jsx)(bg,{speed:2,colorBack:"#0a0a0a",colorFront:"#ececf2"})},{name:"shader-dithering",node:(0,C.jsx)(Cg,{speed:2,colorBack:"#0a0a10",colorFront:sf,size:3})},{name:"shader-pulsing-border",node:(0,C.jsx)(Tg,{speed:2,colorBack:"#0b0b10",colors:["#81adec","#a9c7f2","#4a76b8","#dfe9fa"],intensity:.35,bloom:.4,thickness:.12})}],Yg=Qg.length*Og,_2=()=>(0,C.jsx)(Ce,{style:{background:"#0a0a0a"},children:(0,C.jsx)($n,{children:Qg.map(t=>(0,C.jsx)($n.Sequence,{durationInFrames:Og,children:(0,C.jsx)(Ce,{style:{background:"#0a0a0a"},children:t.node})},t.name))})}),B2=()=>(0,C.jsx)(Ce,{style:{padding:"0 90px"},children:(0,C.jsx)(gh,{text:"Paper just open-sourced their shaders",fontSize:58,fontWeight:600,color:yl,staggerDelay:2})}),E2=()=>{let t=N(),{fps:e}=F(),a=So({frame:t,fps:e,config:{damping:15,stiffness:120,mass:.9}}),l=V(a,[0,1],[-44,0]),i=So({frame:t-10,fps:e,config:{damping:11,stiffness:170,mass:.7}}),o=V(t,[10,22],[0,1],Xe),n=V(i,[0,1],[.4,1]),r=So({frame:t-16,fps:e,config:{damping:14,stiffness:130,mass:.9}}),u=V(r,[0,1],[44,0]),s=V(t,[16,30],[0,1],Xe),p=Math.sin((t-40)/22)*3,d=V(t,[52,70],[0,1],Xe),c=V(t,[52,72],[14,0],{...Xe,easing:wt.out(wt.cubic)}),h=V(t,[52,70],[8,0],Xe);return(0,C.jsxs)(Ce,{style:{alignItems:"center",justifyContent:"center"},children:[(0,C.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:36,transform:"translateY(-26px)"},children:[(0,C.jsx)("span",{style:{fontFamily:hi,fontWeight:700,fontSize:76,letterSpacing:"-0.03em",color:yl,opacity:a,transform:`translateX(${l}px)`,whiteSpace:"nowrap"},children:"Remocn"}),(0,C.jsx)("span",{style:{fontFamily:hi,fontWeight:400,fontSize:54,color:uf,opacity:o,transform:`scale(${n})`},children:"+"}),(0,C.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:22,opacity:s,transform:`translateX(${u}px)`},children:[(0,C.jsx)("div",{style:{transform:`translateY(${t>40?p:0}px)`},children:(0,C.jsx)(Hg,{size:78})}),(0,C.jsx)("span",{style:{fontFamily:hi,fontWeight:700,fontSize:76,letterSpacing:"-0.03em",color:yl,whiteSpace:"nowrap"},children:"Paper"})]})]}),(0,C.jsx)("span",{style:{position:"absolute",top:448,fontFamily:hi,fontWeight:500,fontSize:28,color:Mg,opacity:d,transform:`translateY(${c}px)`,filter:`blur(${h}px)`},children:"Their shaders, now wrapped for Remotion"})]})},C2=()=>(0,C.jsx)(Ce,{children:(0,C.jsx)(vh,{text:"Introducing Remocn Shaders",fontSize:66,fontWeight:700,color:yl})}),z2=()=>(0,C.jsx)(Ce,{children:(0,C.jsx)(yh,{text:`18 shaders on the GPU
Frozen to the current frame
Deterministic on every render`,fontSize:52,fontWeight:600,color:yl})}),T2=()=>{let t=N(),e=V(t,[52,68],[0,1],Xe),a=V(t,[52,72],[16,0],{...Xe,easing:wt.out(wt.cubic)}),l=V(t,[52,68],[6,0],Xe);return(0,C.jsxs)(Ce,{children:[(0,C.jsx)("div",{style:{position:"absolute",inset:0,transform:"translateY(-42px)"},children:(0,C.jsx)(Sh,{text:"Any shader, one command",fontSize:56,fontWeight:700,color:yl})}),(0,C.jsx)("div",{style:{position:"absolute",left:0,right:0,top:418,display:"flex",justifyContent:"center",opacity:e,transform:`translateY(${a}px)`,filter:`blur(${l}px)`},children:(0,C.jsxs)("span",{style:{fontFamily:b2,fontSize:28,color:Mg},children:[(0,C.jsx)("span",{style:{color:uf},children:"$ "}),"npx shadcn add"," ",(0,C.jsx)("span",{style:{color:sf},children:"@remocn/shader-warp"})]})})]})},M2=()=>{let t=N(),{fps:e}=F(),a=V(t,[14,48,72,112],[1,0,0,1],{...Xe,easing:wt.bezier(.42,0,.58,1)}),l=So({frame:t-102,fps:e,config:{damping:14,stiffness:130,mass:.9}}),i=V(l,[0,1],[.92,1]),o=V(t,[102,118],[10,0],Xe),n=V(t,[122,140],[0,1],Xe);return(0,C.jsxs)(Ce,{style:{alignItems:"center",justifyContent:"center",background:"#0a0a0a"},children:[(0,C.jsx)(Bg,{twist:a,colors:["#1d2c4a","#3f6cb0","#81adec"],colorBack:"#0a0a0e",bandCount:10,softness:.35}),(0,C.jsx)("span",{style:{fontFamily:hi,fontWeight:800,fontSize:92,letterSpacing:"-0.03em",color:yl,opacity:l,transform:`scale(${i})`,filter:`blur(${o}px)`,position:"relative"},children:"Remocn"}),(0,C.jsxs)("div",{style:{position:"absolute",bottom:44,display:"flex",alignItems:"center",gap:12,opacity:n},children:[(0,C.jsx)(Hg,{size:20}),(0,C.jsx)("span",{style:{fontFamily:hi,fontSize:20,color:uf},children:"Shaders by Paper"})]})]})},U2=({children:t,presentationProgress:e,presentationDirection:a})=>{let i=a==="entering"?e:1-e;return(0,C.jsx)(Ce,{style:{opacity:i},children:t})},rf=()=>({component:U2,props:{}}),R2=({children:t,presentationProgress:e,presentationDirection:a})=>{let l=a==="entering",i=e,o=l?{opacity:i,transform:`scale(${.9+i*.1})`,filter:i<1?`blur(${(1-i)*16}px)`:void 0}:{opacity:1-i,transform:`scale(${1+i*.12})`,filter:i>0?`blur(${i*16}px)`:void 0};return(0,C.jsx)(Ce,{style:o,children:t})},D2=()=>({component:R2,props:{}}),T5=Ug+Rg+Dg+Yg+wg+Ng+Gg-(Vg+gi+gi+gi),Fg=()=>(0,C.jsxs)(Ce,{style:{"--font-geist-sans":A2,background:"#0a0a0a"},children:[(0,C.jsx)(ag,{speed:.5}),(0,C.jsx)(Ce,{style:{background:"radial-gradient(120% 120% at 50% 42%, rgba(10,10,10,0.35) 0%, rgba(10,10,10,0.8) 100%)"}}),(0,C.jsxs)(le,{children:[(0,C.jsx)(le.Sequence,{durationInFrames:Ug,children:(0,C.jsx)(B2,{})}),(0,C.jsx)(le.Transition,{timing:Ao({durationInFrames:Vg}),presentation:D2()}),(0,C.jsx)(le.Sequence,{durationInFrames:Rg,children:(0,C.jsx)(E2,{})}),(0,C.jsx)(le.Transition,{timing:Ao({durationInFrames:gi}),presentation:rf()}),(0,C.jsx)(le.Sequence,{durationInFrames:Dg,children:(0,C.jsx)(C2,{})}),(0,C.jsx)(le.Sequence,{durationInFrames:Yg,children:(0,C.jsx)(_2,{})}),(0,C.jsx)(le.Sequence,{durationInFrames:wg,children:(0,C.jsx)(z2,{})}),(0,C.jsx)(le.Transition,{timing:Ao({durationInFrames:gi}),presentation:rf()}),(0,C.jsx)(le.Sequence,{durationInFrames:Ng,children:(0,C.jsx)(T2,{})}),(0,C.jsx)(le.Transition,{timing:Ao({durationInFrames:gi}),presentation:rf()}),(0,C.jsx)(le.Sequence,{durationInFrames:Gg,children:(0,C.jsx)(M2,{})})]})]});var O2=(0,Xg.createRoot)(document.getElementById("hyfrme-showcase-root")),w2={fps:30,width:1280,height:720,durationInFrames:984};window.__hyfrmeRenderFrame=t=>{sh(t,w2),(0,Lg.flushSync)(()=>O2.render(qg.default.createElement(Fg)))};window.__hyfrmeRenderFrame(0);})();
/*! Bundled license information:

react/cjs/react.production.js:
  (**
   * @license React
   * react.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react-dom/cjs/react-dom.production.js:
  (**
   * @license React
   * react-dom.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

scheduler/cjs/scheduler.production.js:
  (**
   * @license React
   * scheduler.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react-dom/cjs/react-dom-client.production.js:
  (**
   * @license React
   * react-dom-client.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react/cjs/react-jsx-runtime.production.js:
  (**
   * @license React
   * react-jsx-runtime.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)
*/
