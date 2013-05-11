!function(a){"use strict";function d(){a(b).each(function(){e(a(this)).removeClass("open")})}function e(b){var d,c=b.attr("data-target");return c||(c=b.attr("href"),c=c&&/#/.test(c)&&c.replace(/.*(?=#[^\s]*$)/,"")),d=c&&a(c),d&&d.length||(d=b.parent()),d}var b="[data-toggle=dropdown]",c=function(b){var c=a(b).on("click.dropdown.data-api",this.toggle);a("html").on("click.dropdown.data-api",function(){c.parent().removeClass("open")})};c.prototype={constructor:c,toggle:function(){var f,g,c=a(this);if(!c.is(".disabled, :disabled"))return f=e(c),g=f.hasClass("open"),d(),g||f.toggleClass("open"),c.focus(),!1},keydown:function(c){var d,f,h,i,j;if(/(38|40|27)/.test(c.keyCode)&&(d=a(this),c.preventDefault(),c.stopPropagation(),!d.is(".disabled, :disabled"))){if(h=e(d),i=h.hasClass("open"),!i||i&&27==c.keyCode)return 27==c.which&&h.find(b).focus(),d.click();f=a("[role=menu] li:not(.divider):visible a",h),f.length&&(j=f.index(f.filter(":focus")),38==c.keyCode&&j>0&&j--,40==c.keyCode&&f.length-1>j&&j++,~j||(j=0),f.eq(j).focus())}}};var f=a.fn.dropdown;a.fn.dropdown=function(b){return this.each(function(){var d=a(this),e=d.data("dropdown");e||d.data("dropdown",e=new c(this)),"string"==typeof b&&e[b].call(d)})},a.fn.dropdown.Constructor=c,a.fn.dropdown.noConflict=function(){return a.fn.dropdown=f,this},a(document).on("click.dropdown.data-api",d).on("click.dropdown.data-api",".dropdown form",function(a){a.stopPropagation()}).on(".dropdown-menu",function(a){a.stopPropagation()}).on("click.dropdown.data-api",b,c.prototype.toggle).on("keydown.dropdown.data-api",b+", [role=menu]",c.prototype.keydown)}(window.jQuery),!function(a){"use strict";var b=function(a,b){this.init("tooltip",a,b)};b.prototype={constructor:b,init:function(b,c,d){var e,f,g,h,i;for(this.type=b,this.$element=a(c),this.options=this.getOptions(d),this.enabled=!0,g=this.options.trigger.split(" "),i=g.length;i--;)h=g[i],"click"==h?this.$element.on("click."+this.type,this.options.selector,a.proxy(this.toggle,this)):"manual"!=h&&(e="hover"==h?"mouseenter":"focus",f="hover"==h?"mouseleave":"blur",this.$element.on(e+"."+this.type,this.options.selector,a.proxy(this.enter,this)),this.$element.on(f+"."+this.type,this.options.selector,a.proxy(this.leave,this)));this.options.selector?this._options=a.extend({},this.options,{trigger:"manual",selector:""}):this.fixTitle()},getOptions:function(b){return b=a.extend({},a.fn[this.type].defaults,this.$element.data(),b),b.delay&&"number"==typeof b.delay&&(b.delay={show:b.delay,hide:b.delay}),b},enter:function(b){var c=a(b.currentTarget)[this.type](this._options).data(this.type);return c.options.delay&&c.options.delay.show?(clearTimeout(this.timeout),c.hoverState="in",this.timeout=setTimeout(function(){"in"==c.hoverState&&c.show()},c.options.delay.show),void 0):c.show()},leave:function(b){var c=a(b.currentTarget)[this.type](this._options).data(this.type);return this.timeout&&clearTimeout(this.timeout),c.options.delay&&c.options.delay.hide?(c.hoverState="out",this.timeout=setTimeout(function(){"out"==c.hoverState&&c.hide()},c.options.delay.hide),void 0):c.hide()},show:function(){var b,c,d,e,f,g,h=a.Event("show");if(this.hasContent()&&this.enabled){if(this.$element.trigger(h),h.isDefaultPrevented())return;switch(b=this.tip(),this.setContent(),this.options.animation&&b.addClass("fade"),f="function"==typeof this.options.placement?this.options.placement.call(this,b[0],this.$element[0]):this.options.placement,b.detach().css({top:0,left:0,display:"block"}),this.options.container?b.appendTo(this.options.container):b.insertAfter(this.$element),c=this.getPosition(),d=b[0].offsetWidth,e=b[0].offsetHeight,("left"==f||"right"==f)&&c.top+c.height/2-e/2+this.options.top+e>=a("body").height()&&(f="top"),f){case"bottom":g={top:c.top+c.height,left:c.left+c.width/2-d/2};break;case"top":g={top:c.top-e,left:c.left+c.width/2-d/2};break;case"left":g={top:c.top+c.height/2-e/2+this.options.top,left:c.left-d};break;case"right":g={top:c.top+c.height/2-e/2+this.options.top,left:c.left+c.width}}this.applyPlacement(g,f),this.$element.trigger("shown")}},applyPlacement:function(a,b){var f,g,h,i,c=this.tip(),d=c[0].offsetWidth,e=c[0].offsetHeight;c.offset(a).addClass(b).addClass("in"),f=c[0].offsetWidth,g=c[0].offsetHeight,"top"==b&&g!=e&&(a.top=a.top+e-g,i=!0),"bottom"==b||"top"==b?(h=0,0>a.left&&(h=-2*a.left,a.left=0,c.offset(a),f=c[0].offsetWidth,g=c[0].offsetHeight),this.replaceArrow(h-d+f,f,"left")):this.replaceArrow(g-e,g,"top"),i&&c.offset(a)},replaceArrow:function(a,b,c){this.arrow().css(c,a?50*(1-a/b)+"%":"")},setContent:function(){var a=this.tip(),b=this.getTitle();a.find(".tooltip-inner")[this.options.html?"html":"text"](b),a.removeClass("fade in top bottom left right")},hide:function(){function e(){var b=setTimeout(function(){c.off(a.support.transition.end).detach()},500);c.one(a.support.transition.end,function(){clearTimeout(b),c.detach()})}var c=this.tip(),d=a.Event("hide");return this.$element.trigger(d),d.isDefaultPrevented()?void 0:(c.removeClass("in"),a.support.transition&&this.$tip.hasClass("fade")?e():c.detach(),this.$element.trigger("hidden"),this)},fixTitle:function(){var a=this.$element;(a.attr("title")||"string"!=typeof a.attr("data-original-title"))&&a.attr("data-original-title",a.attr("title")||"").attr("title","")},hasContent:function(){return this.getTitle()},getPosition:function(){var b=this.$element[0];return a.extend({},"function"==typeof b.getBoundingClientRect?b.getBoundingClientRect():{width:b.offsetWidth,height:b.offsetHeight},this.$element.offset())},getTitle:function(){var a,b=this.$element,c=this.options;return a=b.attr("data-original-title")||("function"==typeof c.title?c.title.call(b[0]):c.title)},tip:function(){return this.$tip=this.$tip||a(this.options.template)},arrow:function(){return this.$arrow=this.$arrow||this.tip().find(".tooltip-arrow")},validate:function(){this.$element[0].parentNode||(this.hide(),this.$element=null,this.options=null)},enable:function(){this.enabled=!0},disable:function(){this.enabled=!1},toggleEnabled:function(){this.enabled=!this.enabled},toggle:function(b){var c=b?a(b.currentTarget)[this.type](this._options).data(this.type):this;c.tip().hasClass("in")?c.hide():c.show()},destroy:function(){this.hide().$element.off("."+this.type).removeData(this.type)}};var c=a.fn.tooltip;a.fn.tooltip=function(c){return this.each(function(){var d=a(this),e=d.data("tooltip"),f="object"==typeof c&&c;e||d.data("tooltip",e=new b(this,f)),"string"==typeof c&&e[c]()})},a.fn.tooltip.Constructor=b,a.fn.tooltip.defaults={animation:!0,placement:"top",selector:!1,template:'<div class="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',trigger:"hover focus",title:"",delay:0,html:!1,container:!1,top:0},a.fn.tooltip.noConflict=function(){return a.fn.tooltip=c,this}}(window.jQuery),!function(a){"use strict";var b=function(a,b){b.top="left"==b.placement||"right"==b.placement?28:0,this.init("popover",a,b)};b.prototype=a.extend({},a.fn.tooltip.Constructor.prototype,{constructor:b,setContent:function(){var a=this.tip(),b=this.getTitle(),c=this.getContent();a.find(".popover-title")[this.options.html?"html":"text"](b),a.find(".popover-content")[this.options.html?"html":"text"](c),a.removeClass("fade top bottom left right in")},hasContent:function(){return this.getTitle()||this.getContent()},getContent:function(){var a,b=this.$element,c=this.options;return a=("function"==typeof c.content?c.content.call(b[0]):c.content)||b.attr("data-content")},tip:function(){return this.$tip||(this.$tip=a(this.options.template)),this.$tip},destroy:function(){this.hide().$element.off("."+this.type).removeData(this.type)}});var c=a.fn.popover;a.fn.popover=function(c){return this.each(function(){var d=a(this),e=d.data("popover"),f="object"==typeof c&&c;e||d.data("popover",e=new b(this,f)),"string"==typeof c&&e[c]()})},a.fn.popover.Constructor=b,a.fn.popover.defaults=a.extend({},a.fn.tooltip.defaults,{placement:"right",trigger:"click",content:"",template:'<div class="popover"><div class="arrow"></div><div class="popover-title"></div><div class="popover-content"></div></div>'}),a.fn.popover.noConflict=function(){return a.fn.popover=c,this}}(window.jQuery),function(a){function c(b,c,d,e){var f={data:e||(c?c.data:{}),_wrap:c?c._wrap:null,tmpl:null,parent:c||null,nodes:[],calls:k,nest:l,wrap:m,html:n,update:o};return b&&a.extend(f,b,{nodes:[],parent:c}),d&&(f.tmpl=d,f._ctnt=f._ctnt||f.tmpl(a,f),f.key=++w,(y.length?t:s)[w]=f),f}function d(b,c,f){var g,h=f?a.map(f,function(a){return"string"==typeof a?b.key?a.replace(/(<\w+)(?=[\s>])(?![^>]*_tmplitem)([^>]*)/g,"$1 "+q+'="'+b.key+'" $2'):a:d(a,b,a._ctnt)}):b;return c?h:(h=h.join(""),h.replace(/^\s*([^<\s][^<]*)?(<[\w\W]+>)([^>]*[^>\s])?\s*$/,function(b,c,d,f){g=a(d).get(),j(g),c&&(g=e(c).concat(g)),f&&(g=g.concat(e(f)))}),g?g:e(h))}function e(b){var c=document.createElement("div");return c.innerHTML=b,a.makeArray(c.childNodes)}function f(b){return Function("jQuery","$item","var $=jQuery,call,_=[],$data=$item.data;with($data){_.push('"+a.trim(b).replace(/([\\'])/g,"\\$1").replace(/[\r\t\n]/g," ").replace(/\$\{([^\}]*)\}/g,"{{= $1}}").replace(/\{\{(\/?)(\w+|.)(?:\(((?:[^\}]|\}(?!\}))*?)?\))?(?:\s+(.*?)?)?(\(((?:[^\}]|\}(?!\}))*?)\))?\s*\}\}/g,function(b,c,d,e,f,g,i){var k,l,m,j=a.tmpl.tag[d];if(!j)throw"Template command not found: "+d;return k=j._default||[],g&&!/\w$/.test(f)&&(f+=g,g=""),f?(f=h(f),i=i?","+h(i)+")":g?")":"",l=g?f.indexOf(".")>-1?f+g:"("+f+").call($item"+i:f,m=g?l:"(typeof("+f+")==='function'?("+f+").call($item):("+f+"))"):m=l=k.$1||"null",e=h(e),"');"+j[c?"close":"open"].split("$notnull_1").join(f?"typeof("+f+")!=='undefined' && ("+f+")!=null":"true").split("$1a").join(m).split("$1").join(l).split("$2").join(e?e.replace(/\s*([^\(]+)\s*(\((.*?)\))?/g,function(a,b,c,d){return d=d?","+d+")":c?")":"",d?"("+b+").call($item"+d:a}):k.$2||"")+"_.push('"})+"');}return _;")}function g(b,c){b._wrap=d(b,!0,a.isArray(c)?c:[r.test(c)?c:a(c).html()]).join("")}function h(a){return a?a.replace(/\\'/g,"'").replace(/\\\\/g,"\\"):null}function i(a){var b=document.createElement("div");return b.appendChild(a.cloneNode(!0)),b.innerHTML}function j(b){function d(b){function d(a){a+=e,j=h[a]=h[a]||c(j,s[j.parent.key+e]||j.parent,null,!0)}var f,i,j,k,g=b;if(k=b.getAttribute(q)){for(;g.parentNode&&1===(g=g.parentNode).nodeType&&!(f=g.getAttribute(q)););f!==k&&(g=g.parentNode?11===g.nodeType?0:g.getAttribute(q)||0:0,(j=s[k])||(j=t[k],j=c(j,s[g]||t[g],null,!0),j.key=++w,s[w]=j),x&&d(k)),b.removeAttribute(q)}else x&&(j=a.data(b,"tmplItem"))&&(d(j.key),s[j.key]=j,g=a.data(b.parentNode,"tmplItem"),g=g?g.key:0);if(j){for(i=j;i&&i.key!=g;)i.nodes.push(b),i=i.parent;delete j._ctnt,delete j._wrap,a.data(b,"tmplItem",j)}}var f,g,i,j,k,e="_"+x,h={};for(i=0,j=b.length;j>i;i++)if(1===(f=b[i]).nodeType){for(g=f.getElementsByTagName("*"),k=g.length-1;k>=0;k--)d(g[k]);d(f)}}function k(a,b,c,d){return a?(y.push({_:a,tmpl:b,item:this,data:c,options:d}),void 0):y.pop()}function l(b,c,d){return a.tmpl(a.template(b),c,d,this)}function m(b,c){var d=b.options||{};return d.wrapped=c,a.tmpl(a.template(b.tmpl),b.data,d,b.item)}function n(b,c){var d=this._wrap;return a.map(a(a.isArray(d)?d.join(""):d).filter(b||"*"),function(a){return c?a.innerText||a.textContent:a.outerHTML||i(a)})}function o(){var b=this.nodes;a.tmpl(null,null,null,this).insertBefore(b[0]),a(b).remove()}var u,p=a.fn.domManip,q="_tmplitem",r=/^[^<]*(<[\w\W]+>)[^>]*$|\{\{\! /,s={},t={},v={key:0,data:{}},w=0,x=0,y=[];a.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(b,c){a.fn[b]=function(d){var g,h,i,j,e=[],f=a(d),k=1===this.length&&this[0].parentNode;if(u=s||{},k&&11===k.nodeType&&1===k.childNodes.length&&1===f.length)f[c](this[0]),e=this;else{for(h=0,i=f.length;i>h;h++)x=h,g=(h>0?this.clone(!0):this).get(),a.fn[c].apply(a(f[h]),g),e=e.concat(g);x=0,e=this.pushStack(e,b,f.selector)}return j=u,u=null,a.tmpl.complete(j),e}}),a.fn.extend({tmpl:function(b,c,d){return a.tmpl(this[0],b,c,d)},tmplItem:function(){return a.tmplItem(this[0])},template:function(b){return a.template(b,this[0])},domManip:function(b,c,d){if(b[0]&&b[0].nodeType){for(var i,f=a.makeArray(arguments),g=b.length,h=0;g>h&&!(i=a.data(b[h++],"tmplItem")););g>1&&(f[0]=[a.makeArray(b)]),i&&x&&(f[2]=function(b){a.tmpl.afterManip(this,b,d)}),p.apply(this,f)}else p.apply(this,arguments);return x=0,u||a.tmpl.complete(s),this}}),a.extend({tmpl:function(b,e,f,h){var i,j=!h;if(j)h=v,b=a.template[b]||a.template(null,b),t={};else if(!b)return b=h.tmpl,s[h.key]=h,h.nodes=[],h.wrapped&&g(h,h.wrapped),a(d(h,null,h.tmpl(a,h)));return b?("function"==typeof e&&(e=e.call(h||{})),f&&f.wrapped&&g(f,f.wrapped),i=a.isArray(e)?a.map(e,function(a){return a?c(f,h,b,a):null}):[c(f,h,b,e)],j?a(d(h,null,i)):i):[]},tmplItem:function(b){var c;for(b instanceof a&&(b=b[0]);b&&1===b.nodeType&&!(c=a.data(b,"tmplItem"))&&(b=b.parentNode););return c||v},template:function(b,c){return c?("string"==typeof c?c=f(c):c instanceof a&&(c=c[0]||{}),c.nodeType&&(c=a.data(c,"tmpl")||a.data(c,"tmpl",f(c.innerHTML))),"string"==typeof b?a.template[b]=c:c):b?"string"!=typeof b?a.template(null,b):a.template[b]||a.template(null,r.test(b)?b:a(b)):null},encode:function(a){return(""+a).split("<").join("<").split(">").join(">").split('"').join("&#34;").split("'").join("&#39;")}}),a.extend(a.tmpl,{tag:{tmpl:{_default:{$2:"null"},open:"if($notnull_1){_=_.concat($item.nest($1,$2));}"},wrap:{_default:{$2:"null"},open:"$item.calls(_,$1,$2);_=[];",close:"call=$item.calls();_=call._.concat($item.wrap(call,_));"},each:{_default:{$2:"$index, $value"},open:"if($notnull_1){$.each($1a,function($2){with(this){",close:"}});}"},"if":{open:"if(($notnull_1) && $1a){",close:"}"},"else":{_default:{$1:"true"},open:"}else if(($notnull_1) && $1a){"},html:{open:"if($notnull_1){_.push($1a);}"},"=":{_default:{$1:"$data"},open:"if($notnull_1){_.push($.encode($1a));}"},"!":{open:""}},complete:function(){s={}},afterManip:function(b,c,d){var e=11===c.nodeType?a.makeArray(c.childNodes):1===c.nodeType?[c]:[];d.call(b,c),j(e),x++}})}(jQuery),function(a){a.cookie=function(b,c,d){if(arguments.length>1&&(!/Object/.test(Object.prototype.toString.call(c))||null===c||void 0===c)){if(d=a.extend({},d),(null===c||void 0===c)&&(d.expires=-1),"number"==typeof d.expires){var e=d.expires,f=d.expires=new Date;f.setDate(f.getDate()+e)}return c+="",document.cookie=[encodeURIComponent(b),"=",d.raw?c:encodeURIComponent(c),d.expires?"; expires="+d.expires.toUTCString():"",d.path?"; path="+d.path:"",d.domain?"; domain="+d.domain:"",d.secure?"; secure":""].join("")}d=c||{};for(var j,g=d.raw?function(a){return a}:decodeURIComponent,h=document.cookie.split("; "),i=0;j=h[i]&&h[i].split("=");i++)if(g(j[0])===b)return g(j[1]||"");return null}}(jQuery),function(a){function b(a,b){var d,e,c=this;return function(){return e=Array.prototype.slice.call(arguments,0),d=clearTimeout(d,e),d=setTimeout(function(){a.apply(c,e),d=0},b),this}}a.extend(a.fn,{debounce:function(a,c,d){this.bind(a,b.apply(this,[c,d]))}})}(jQuery),function($){$.extend({tablesorter:new function(){function benchmark(a,b){log(a+","+((new Date).getTime()-b.getTime())+"ms")}function log(a){"undefined"!=typeof console&&console.debug!==void 0?console.log(a):alert(a)}function buildParserCache(a,b){if(a.config.debug)var c="";if(0!=a.tBodies.length){var d=a.tBodies[0].rows;if(d[0])for(var e=[],f=d[0].cells,g=f.length,h=0;g>h;h++){var i=!1;$.metadata&&$(b[h]).metadata()&&$(b[h]).metadata().sorter?i=getParserById($(b[h]).metadata().sorter):a.config.headers[h]&&a.config.headers[h].sorter&&(i=getParserById(a.config.headers[h].sorter)),i||(i=detectParserForColumn(a,d,-1,h)),a.config.debug&&(c+="column:"+h+" parser:"+i.id+"\n"),e.push(i)}return a.config.debug&&log(c),e}}function detectParserForColumn(a,b,c,d){for(var e=parsers.length,f=!1,g=!1,h=!0;""==g&&h;)c++,b[c]?(f=getNodeFromRowAndCellIndex(b,c,d),g=trimAndGetNodeText(a.config,f),a.config.debug&&log("Checking if value was empty on row:"+c)):h=!1;for(var i=1;e>i;i++)if(parsers[i].is(g,a,f))return parsers[i];return parsers[0]}function getNodeFromRowAndCellIndex(a,b,c){return a[b].cells[c]}function trimAndGetNodeText(a,b){return $.trim(getElementText(a,b))}function getParserById(a){for(var b=parsers.length,c=0;b>c;c++)if(parsers[c].id.toLowerCase()==a.toLowerCase())return parsers[c];return!1}function buildCache(a){if(a.config.debug)var b=new Date;for(var c=a.tBodies[0]&&a.tBodies[0].rows.length||0,d=a.tBodies[0].rows[0]&&a.tBodies[0].rows[0].cells.length||0,e=a.config.parsers,f={row:[],normalized:[]},g=0;c>g;++g){var h=$(a.tBodies[0].rows[g]),i=[];if(h.hasClass(a.config.cssChildRow))f.row[f.row.length-1]=f.row[f.row.length-1].add(h);else{f.row.push(h);for(var j=0;d>j;++j)i.push(e[j].format(getElementText(a.config,h[0].cells[j]),a,h[0].cells[j]));i.push(f.normalized.length),f.normalized.push(i),i=null}}return a.config.debug&&benchmark("Building cache for "+c+" rows:",b),f}function getElementText(a,b){var c="";return b?(a.supportsTextContent||(a.supportsTextContent=b.textContent||!1),c="simple"==a.textExtraction?a.supportsTextContent?b.textContent:b.childNodes[0]&&b.childNodes[0].hasChildNodes()?b.childNodes[0].innerHTML:b.innerHTML:"function"==typeof a.textExtraction?a.textExtraction(b):$(b).text()):""}function appendToTable(a,b){if(a.config.debug)var c=new Date;for(var d=b,e=d.row,f=d.normalized,g=f.length,h=f[0].length-1,i=$(a.tBodies[0]),j=[],k=0;g>k;k++){var l=f[k][h];if(j.push(e[l]),!a.config.appender)for(var m=e[l].length,n=0;m>n;n++)i[0].appendChild(e[l][n])}a.config.appender&&a.config.appender(a,j),j=null,a.config.debug&&benchmark("Rebuilt table:",c),applyWidget(a),setTimeout(function(){$(a).trigger("sortEnd")},0)}function buildHeaders(a){if(a.config.debug)var b=new Date;$.metadata?!0:!1;var d=computeTableHeaderCellIndexes(a);return $tableHeaders=$(a.config.selectorHeaders,a).each(function(b){if(this.column=d[this.parentNode.rowIndex+"-"+this.cellIndex],this.order=formatSortingOrder(a.config.sortInitialOrder),this.count=this.order,(checkHeaderMetadata(this)||checkHeaderOptions(a,b))&&(this.sortDisabled=!0),checkHeaderOptionsSortingLocked(a,b)&&(this.order=this.lockedOrder=checkHeaderOptionsSortingLocked(a,b)),!this.sortDisabled){var c=$(this).addClass(a.config.cssHeader);a.config.onRenderHeader&&a.config.onRenderHeader.apply(c)}a.config.headerList[b]=this}),a.config.debug&&(benchmark("Built headers:",b),log($tableHeaders)),$tableHeaders}function computeTableHeaderCellIndexes(a){for(var b=[],c={},d=a.getElementsByTagName("THEAD")[0],e=d.getElementsByTagName("TR"),f=0;e.length>f;f++)for(var g=e[f].cells,h=0;g.length>h;h++){var n,i=g[h],j=i.parentNode.rowIndex,k=j+"-"+i.cellIndex,l=i.rowSpan||1,m=i.colSpan||1;b[j]===void 0&&(b[j]=[]);for(var o=0;b[j].length+1>o;o++)if(b[j][o]===void 0){n=o;break}c[k]=n;for(var o=j;j+l>o;o++){b[o]===void 0&&(b[o]=[]);for(var p=b[o],q=n;n+m>q;q++)p[q]="x"}}return c}function checkCellColSpan(a,b,c){for(var d=[],e=a.tHead.rows,f=e[c].cells,g=0;f.length>g;g++){var h=f[g];h.colSpan>1?d=d.concat(checkCellColSpan(a,headerArr,c++)):(1==a.tHead.length||h.rowSpan>1||!e[c+1])&&d.push(h)}return d}function checkHeaderMetadata(a){return $.metadata&&$(a).metadata().sorter===!1?!0:!1}function checkHeaderOptions(a,b){return a.config.headers[b]&&a.config.headers[b].sorter===!1?!0:!1}function checkHeaderOptionsSortingLocked(a,b){return a.config.headers[b]&&a.config.headers[b].lockedOrder?a.config.headers[b].lockedOrder:!1}function applyWidget(a){for(var b=a.config.widgets,c=b.length,d=0;c>d;d++)getWidgetById(b[d]).format(a)}function getWidgetById(a){for(var b=widgets.length,c=0;b>c;c++)if(widgets[c].id.toLowerCase()==a.toLowerCase())return widgets[c]}function formatSortingOrder(a){return"Number"!=typeof a?"desc"==a.toLowerCase()?1:0:1==a?1:0}function isValueInArray(a,b){for(var c=b.length,d=0;c>d;d++)if(b[d][0]==a)return!0;return!1}function setHeadersCss(a,b,c,d){b.removeClass(d[0]).removeClass(d[1]);var e=[];b.each(function(){this.sortDisabled||(e[this.column]=$(this))});for(var f=c.length,g=0;f>g;g++)e[c[g][0]].addClass(d[c[g][1]])}function fixColumnWidth(a){var c=a.config;if(c.widthFixed){var d=$("<colgroup>");$("tr:first td",a.tBodies[0]).each(function(){d.append($("<col>").css("width",$(this).width()))}),$(a).prepend(d)}}function updateHeaderSortCount(a,b){for(var c=a.config,d=b.length,e=0;d>e;e++){var f=b[e],g=c.headerList[f[0]];g.count=f[1],g.count++}}function multisort(table,sortList,cache){if(table.config.debug)var sortTime=new Date;for(var dynamicExp="var sortWrapper = function(a,b) {",l=sortList.length,i=0;l>i;i++){var c=sortList[i][0],order=sortList[i][1],s="text"==table.config.parsers[c].type?0==order?makeSortFunction("text","asc",c):makeSortFunction("text","desc",c):0==order?makeSortFunction("numeric","asc",c):makeSortFunction("numeric","desc",c),e="e"+i;dynamicExp+="var "+e+" = "+s,dynamicExp+="if("+e+") { return "+e+"; } ",dynamicExp+="else { "}var orgOrderCol=cache.normalized[0].length-1;dynamicExp+="return a["+orgOrderCol+"]-b["+orgOrderCol+"];";for(var i=0;l>i;i++)dynamicExp+="}; ";return dynamicExp+="return 0; ",dynamicExp+="}; ",table.config.debug&&benchmark("Evaling expression:"+dynamicExp,new Date),eval(dynamicExp),cache.normalized.sort(sortWrapper),table.config.debug&&benchmark("Sorting on "+(""+sortList)+" and dir "+order+" time:",sortTime),cache}function makeSortFunction(a,b,c){var d="a["+c+"]",e="b["+c+"]";return"text"==a&&"asc"==b?"("+d+" == "+e+" ? 0 : ("+d+" === null ? Number.POSITIVE_INFINITY : ("+e+" === null ? Number.NEGATIVE_INFINITY : ("+d+" < "+e+") ? -1 : 1 )));":"text"==a&&"desc"==b?"("+d+" == "+e+" ? 0 : ("+d+" === null ? Number.POSITIVE_INFINITY : ("+e+" === null ? Number.NEGATIVE_INFINITY : ("+e+" < "+d+") ? -1 : 1 )));":"numeric"==a&&"asc"==b?"("+d+" === null && "+e+" === null) ? 0 :("+d+" === null ? Number.POSITIVE_INFINITY : ("+e+" === null ? Number.NEGATIVE_INFINITY : "+d+" - "+e+"));":"numeric"==a&&"desc"==b?"("+d+" === null && "+e+" === null) ? 0 :("+d+" === null ? Number.POSITIVE_INFINITY : ("+e+" === null ? Number.NEGATIVE_INFINITY : "+e+" - "+d+"));":void 0}function makeSortText(a){return"((a["+a+"] < b["+a+"]) ? -1 : ((a["+a+"] > b["+a+"]) ? 1 : 0));"}function makeSortTextDesc(a){return"((b["+a+"] < a["+a+"]) ? -1 : ((b["+a+"] > a["+a+"]) ? 1 : 0));"}function makeSortNumeric(a){return"a["+a+"]-b["+a+"];"}function makeSortNumericDesc(a){return"b["+a+"]-a["+a+"];"}function sortText(a,b){return table.config.sortLocaleCompare?a.localeCompare(b):b>a?-1:a>b?1:0}function sortTextDesc(a,b){return table.config.sortLocaleCompare?b.localeCompare(a):a>b?-1:b>a?1:0}function sortNumeric(a,b){return a-b}function sortNumericDesc(a,b){return b-a}function getCachedSortType(a,b){return a[b].type}var parsers=[],widgets=[];this.defaults={cssHeader:"header",cssAsc:"headerSortUp",cssDesc:"headerSortDown",cssChildRow:"expand-child",sortInitialOrder:"asc",sortMultiSortKey:"shiftKey",sortForce:null,sortAppend:null,sortLocaleCompare:!0,textExtraction:"simple",parsers:{},widgets:[],widgetZebra:{css:["even","odd"]},headers:{},widthFixed:!1,cancelSelection:!0,sortList:[],headerList:[],dateFormat:"us",decimal:"/.|,/g",onRenderHeader:null,selectorHeaders:"thead th",debug:!1},this.benchmark=benchmark,this.construct=function(a){return this.each(function(){if(this.tHead&&this.tBodies){var b,d,e,f;this.config={},f=$.extend(this.config,$.tablesorter.defaults,a),b=$(this),$.data(this,"tablesorter",f),d=buildHeaders(this),this.config.parsers=buildParserCache(this,d),e=buildCache(this);var i=[f.cssDesc,f.cssAsc];fixColumnWidth(this),d.click(function(a){var c=b[0].tBodies[0]&&b[0].tBodies[0].rows.length||0;if(!this.sortDisabled&&c>0){b.trigger("sortStart"),$(this);var h=this.column;if(this.order=this.count++%2,this.lockedOrder&&(this.order=this.lockedOrder),a[f.sortMultiSortKey])if(isValueInArray(h,f.sortList))for(var k=0;f.sortList.length>k;k++){var l=f.sortList[k],m=f.headerList[l[0]];l[0]==h&&(m.count=l[1],m.count++,l[1]=m.count%2)}else f.sortList.push([h,this.order]);else{if(f.sortList=[],null!=f.sortForce)for(var j=f.sortForce,k=0;j.length>k;k++)j[k][0]!=h&&f.sortList.push(j[k]);f.sortList.push([h,this.order])}return setTimeout(function(){setHeadersCss(b[0],d,f.sortList,i),appendToTable(b[0],multisort(b[0],f.sortList,e))},1),!1}}).mousedown(function(){return f.cancelSelection?(this.onselectstart=function(){return!1},!1):void 0}),b.bind("update",function(){var a=this;setTimeout(function(){a.config.parsers=buildParserCache(a,d),e=buildCache(a)},1)}).bind("updateCell",function(a,b){var c=this.config,d=[b.parentNode.rowIndex-1,b.cellIndex];e.normalized[d[0]][d[1]]=c.parsers[d[1]].format(getElementText(c,b),b)}).bind("sorton",function(a,b){$(this).trigger("sortStart"),f.sortList=b;var c=f.sortList;updateHeaderSortCount(this,c),setHeadersCss(this,d,c,i),appendToTable(this,multisort(this,c,e))}).bind("appendCache",function(){appendToTable(this,e)}).bind("applyWidgetId",function(a,b){getWidgetById(b).format(this)}).bind("applyWidgets",function(){applyWidget(this)}),$.metadata&&$(this).metadata()&&$(this).metadata().sortlist&&(f.sortList=$(this).metadata().sortlist),f.sortList.length>0&&b.trigger("sorton",[f.sortList]),applyWidget(this)}})},this.addParser=function(a){for(var b=parsers.length,c=!0,d=0;b>d;d++)parsers[d].id.toLowerCase()==a.id.toLowerCase()&&(c=!1);c&&parsers.push(a)},this.addWidget=function(a){widgets.push(a)},this.formatFloat=function(a){var b=parseFloat(a);return isNaN(b)?0:b},this.formatInt=function(a){var b=parseInt(a);return isNaN(b)?0:b},this.isDigit=function(a){return/^[-+]?\d*$/.test($.trim(a.replace(/[,.']/g,"")))},this.clearTableBody=function(a){function b(){for(;this.firstChild;)this.removeChild(this.firstChild)}$.browser.msie?b.apply(a.tBodies[0]):a.tBodies[0].innerHTML=""}}}),$.fn.extend({tablesorter:$.tablesorter.construct});var ts=$.tablesorter;ts.addParser({id:"text",is:function(){return!0},format:function(a){return $.trim(a.toLocaleLowerCase())},type:"text"}),ts.addParser({id:"digit",is:function(a,b){var c=b.config;return $.tablesorter.isDigit(a,c)},format:function(a){return $.tablesorter.formatFloat(a)},type:"numeric"}),ts.addParser({id:"currency",is:function(a){return/^[\u00c2\u00a3$\u00e2\u201a\u00ac?.]/.test(a)},format:function(a){return $.tablesorter.formatFloat(a.replace(RegExp(/[\u00c2\u00a3$\u00e2\u201a\u00ac]/g),""))},type:"numeric"}),ts.addParser({id:"ipAddress",is:function(a){return/^\d{2,3}[\.]\d{2,3}[\.]\d{2,3}[\.]\d{2,3}$/.test(a)},format:function(a){for(var b=a.split("."),c="",d=b.length,e=0;d>e;e++){var f=b[e];c+=2==f.length?"0"+f:f}return $.tablesorter.formatFloat(c)},type:"numeric"}),ts.addParser({id:"url",is:function(a){return/^(https?|ftp|file):\/\/$/.test(a)},format:function(a){return jQuery.trim(a.replace(RegExp(/(https?|ftp|file):\/\//),""))},type:"text"}),ts.addParser({id:"isoDate",is:function(a){return/^\d{4}[\/-]\d{1,2}[\/-]\d{1,2}$/.test(a)},format:function(a){return $.tablesorter.formatFloat(""!=a?new Date(a.replace(RegExp(/-/g),"/")).getTime():"0")},type:"numeric"}),ts.addParser({id:"percent",is:function(a){return/\%$/.test($.trim(a))},format:function(a){return $.tablesorter.formatFloat(a.replace(RegExp(/%/g),""))},type:"numeric"}),ts.addParser({id:"usLongDate",is:function(a){return a.match(RegExp(/^[A-Za-z]{3,10}\.? [0-9]{1,2}, ([0-9]{4}|'?[0-9]{2}) (([0-2]?[0-9]:[0-5][0-9])|([0-1]?[0-9]:[0-5][0-9]\s(AM|PM)))$/))},format:function(a){return $.tablesorter.formatFloat(new Date(a).getTime())},type:"numeric"}),ts.addParser({id:"shortDate",is:function(a){return/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(a)},format:function(a,b){var c=b.config;return a=a.replace(/\-/g,"/"),"us"==c.dateFormat?a=a.replace(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,"$3/$1/$2"):"uk"==c.dateFormat?a=a.replace(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,"$3/$2/$1"):("dd/mm/yy"==c.dateFormat||"dd-mm-yy"==c.dateFormat)&&(a=a.replace(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})/,"$1/$2/$3")),$.tablesorter.formatFloat(new Date(a).getTime())},type:"numeric"}),ts.addParser({id:"time",is:function(a){return/^(([0-2]?[0-9]:[0-5][0-9])|([0-1]?[0-9]:[0-5][0-9]\s(am|pm)))$/.test(a)},format:function(a){return $.tablesorter.formatFloat(new Date("2000/01/01 "+a).getTime())},type:"numeric"}),ts.addParser({id:"metadata",is:function(){return!1},format:function(a,b,c){var d=b.config,e=d.parserMetadataName?d.parserMetadataName:"sortValue";return $(c).metadata()[e]},type:"numeric"}),ts.addWidget({id:"zebra",format:function(a){if(a.config.debug)var b=new Date;var c,e,d=-1;$("tr:visible",a.tBodies[0]).each(function(){c=$(this),c.hasClass(a.config.cssChildRow)||d++,e=0==d%2,c.removeClass(a.config.widgetZebra.css[e?0:1]).addClass(a.config.widgetZebra.css[e?1:0])}),a.config.debug&&$.tablesorter.benchmark("Applying Zebra widget",b)}})}(jQuery);

;(function($){var h=$.scrollTo=function(a,b,c){$(window).scrollTo(a,b,c)};h.defaults={axis:'xy',duration:parseFloat($.fn.jquery)>=1.3?0:1,limit:true};h.window=function(a){return $(window)._scrollable()};$.fn._scrollable=function(){return this.map(function(){var a=this,isWin=!a.nodeName||$.inArray(a.nodeName.toLowerCase(),['iframe','#document','html','body'])!=-1;if(!isWin)return a;var b=(a.contentWindow||a).document||a.ownerDocument||a;return/webkit/i.test(navigator.userAgent)||b.compatMode=='BackCompat'?b.body:b.documentElement})};$.fn.scrollTo=function(e,f,g){if(typeof f=='object'){g=f;f=0}if(typeof g=='function')g={onAfter:g};if(e=='max')e=9e9;g=$.extend({},h.defaults,g);f=f||g.duration;g.queue=g.queue&&g.axis.length>1;if(g.queue)f/=2;g.offset=both(g.offset);g.over=both(g.over);return this._scrollable().each(function(){if(e==null)return;var d=this,$elem=$(d),targ=e,toff,attr={},win=$elem.is('html,body');switch(typeof targ){case'number':case'string':if(/^([+-]=)?\d+(\.\d+)?(px|%)?$/.test(targ)){targ=both(targ);break}targ=$(targ,this);if(!targ.length)return;case'object':if(targ.is||targ.style)toff=(targ=$(targ)).offset()}$.each(g.axis.split(''),function(i,a){var b=a=='x'?'Left':'Top',pos=b.toLowerCase(),key='scroll'+b,old=d[key],max=h.max(d,a);if(toff){attr[key]=toff[pos]+(win?0:old-$elem.offset()[pos]);if(g.margin){attr[key]-=parseInt(targ.css('margin'+b))||0;attr[key]-=parseInt(targ.css('border'+b+'Width'))||0}attr[key]+=g.offset[pos]||0;if(g.over[pos])attr[key]+=targ[a=='x'?'width':'height']()*g.over[pos]}else{var c=targ[pos];attr[key]=c.slice&&c.slice(-1)=='%'?parseFloat(c)/100*max:c}if(g.limit&&/^\d+$/.test(attr[key]))attr[key]=attr[key]<=0?0:Math.min(attr[key],max);if(!i&&g.queue){if(old!=attr[key])animate(g.onAfterFirst);delete attr[key]}});animate(g.onAfter);function animate(a){$elem.animate(attr,f,g.easing,a&&function(){a.call(this,e,g)})}}).end()};h.max=function(a,b){var c=b=='x'?'Width':'Height',scroll='scroll'+c;if(!$(a).is('html,body'))return a[scroll]-$(a)[c.toLowerCase()]();var d='client'+c,html=a.ownerDocument.documentElement,body=a.ownerDocument.body;return Math.max(html[scroll],body[scroll])-Math.min(html[d],body[d])};function both(a){return typeof a=='object'?a:{top:a,left:a}}})(jQuery);// Underscore.js 1.3.1
// (c) 2009-2012 Jeremy Ashkenas, DocumentCloud Inc.
// Underscore is freely distributable under the MIT license.
// Portions of Underscore are inspired or borrowed from Prototype,
// Oliver Steele's Functional, and John Resig's Micro-Templating.
// For all details and documentation:
// http://documentcloud.github.com/underscore
(function(){function q(a,c,d){if(a===c)return a!==0||1/a==1/c;if(a==null||c==null)return a===c;if(a._chain)a=a._wrapped;if(c._chain)c=c._wrapped;if(a.isEqual&&b.isFunction(a.isEqual))return a.isEqual(c);if(c.isEqual&&b.isFunction(c.isEqual))return c.isEqual(a);var e=l.call(a);if(e!=l.call(c))return false;switch(e){case "[object String]":return a==String(c);case "[object Number]":return a!=+a?c!=+c:a==0?1/a==1/c:a==+c;case "[object Date]":case "[object Boolean]":return+a==+c;case "[object RegExp]":return a.source==
c.source&&a.global==c.global&&a.multiline==c.multiline&&a.ignoreCase==c.ignoreCase}if(typeof a!="object"||typeof c!="object")return false;for(var f=d.length;f--;)if(d[f]==a)return true;d.push(a);var f=0,g=true;if(e=="[object Array]"){if(f=a.length,g=f==c.length)for(;f--;)if(!(g=f in a==f in c&&q(a[f],c[f],d)))break}else{if("constructor"in a!="constructor"in c||a.constructor!=c.constructor)return false;for(var h in a)if(b.has(a,h)&&(f++,!(g=b.has(c,h)&&q(a[h],c[h],d))))break;if(g){for(h in c)if(b.has(c,
h)&&!f--)break;g=!f}}d.pop();return g}var r=this,G=r._,n={},k=Array.prototype,o=Object.prototype,i=k.slice,H=k.unshift,l=o.toString,I=o.hasOwnProperty,w=k.forEach,x=k.map,y=k.reduce,z=k.reduceRight,A=k.filter,B=k.every,C=k.some,p=k.indexOf,D=k.lastIndexOf,o=Array.isArray,J=Object.keys,s=Function.prototype.bind,b=function(a){return new m(a)};if(typeof exports!=="undefined"){if(typeof module!=="undefined"&&module.exports)exports=module.exports=b;exports._=b}else r._=b;b.VERSION="1.3.1";var j=b.each=
b.forEach=function(a,c,d){if(a!=null)if(w&&a.forEach===w)a.forEach(c,d);else if(a.length===+a.length)for(var e=0,f=a.length;e<f;e++){if(e in a&&c.call(d,a[e],e,a)===n)break}else for(e in a)if(b.has(a,e)&&c.call(d,a[e],e,a)===n)break};b.map=b.collect=function(a,c,b){var e=[];if(a==null)return e;if(x&&a.map===x)return a.map(c,b);j(a,function(a,g,h){e[e.length]=c.call(b,a,g,h)});if(a.length===+a.length)e.length=a.length;return e};b.reduce=b.foldl=b.inject=function(a,c,d,e){var f=arguments.length>2;a==
null&&(a=[]);if(y&&a.reduce===y)return e&&(c=b.bind(c,e)),f?a.reduce(c,d):a.reduce(c);j(a,function(a,b,i){f?d=c.call(e,d,a,b,i):(d=a,f=true)});if(!f)throw new TypeError("Reduce of empty array with no initial value");return d};b.reduceRight=b.foldr=function(a,c,d,e){var f=arguments.length>2;a==null&&(a=[]);if(z&&a.reduceRight===z)return e&&(c=b.bind(c,e)),f?a.reduceRight(c,d):a.reduceRight(c);var g=b.toArray(a).reverse();e&&!f&&(c=b.bind(c,e));return f?b.reduce(g,c,d,e):b.reduce(g,c)};b.find=b.detect=
function(a,c,b){var e;E(a,function(a,g,h){if(c.call(b,a,g,h))return e=a,true});return e};b.filter=b.select=function(a,c,b){var e=[];if(a==null)return e;if(A&&a.filter===A)return a.filter(c,b);j(a,function(a,g,h){c.call(b,a,g,h)&&(e[e.length]=a)});return e};b.reject=function(a,c,b){var e=[];if(a==null)return e;j(a,function(a,g,h){c.call(b,a,g,h)||(e[e.length]=a)});return e};b.every=b.all=function(a,c,b){var e=true;if(a==null)return e;if(B&&a.every===B)return a.every(c,b);j(a,function(a,g,h){if(!(e=
e&&c.call(b,a,g,h)))return n});return e};var E=b.some=b.any=function(a,c,d){c||(c=b.identity);var e=false;if(a==null)return e;if(C&&a.some===C)return a.some(c,d);j(a,function(a,b,h){if(e||(e=c.call(d,a,b,h)))return n});return!!e};b.include=b.contains=function(a,c){var b=false;if(a==null)return b;return p&&a.indexOf===p?a.indexOf(c)!=-1:b=E(a,function(a){return a===c})};b.invoke=function(a,c){var d=i.call(arguments,2);return b.map(a,function(a){return(b.isFunction(c)?c||a:a[c]).apply(a,d)})};b.pluck=
function(a,c){return b.map(a,function(a){return a[c]})};b.max=function(a,c,d){if(!c&&b.isArray(a))return Math.max.apply(Math,a);if(!c&&b.isEmpty(a))return-Infinity;var e={computed:-Infinity};j(a,function(a,b,h){b=c?c.call(d,a,b,h):a;b>=e.computed&&(e={value:a,computed:b})});return e.value};b.min=function(a,c,d){if(!c&&b.isArray(a))return Math.min.apply(Math,a);if(!c&&b.isEmpty(a))return Infinity;var e={computed:Infinity};j(a,function(a,b,h){b=c?c.call(d,a,b,h):a;b<e.computed&&(e={value:a,computed:b})});
return e.value};b.shuffle=function(a){var b=[],d;j(a,function(a,f){f==0?b[0]=a:(d=Math.floor(Math.random()*(f+1)),b[f]=b[d],b[d]=a)});return b};b.sortBy=function(a,c,d){return b.pluck(b.map(a,function(a,b,g){return{value:a,criteria:c.call(d,a,b,g)}}).sort(function(a,b){var c=a.criteria,d=b.criteria;return c<d?-1:c>d?1:0}),"value")};b.groupBy=function(a,c){var d={},e=b.isFunction(c)?c:function(a){return a[c]};j(a,function(a,b){var c=e(a,b);(d[c]||(d[c]=[])).push(a)});return d};b.sortedIndex=function(a,
c,d){d||(d=b.identity);for(var e=0,f=a.length;e<f;){var g=e+f>>1;d(a[g])<d(c)?e=g+1:f=g}return e};b.toArray=function(a){return!a?[]:a.toArray?a.toArray():b.isArray(a)?i.call(a):b.isArguments(a)?i.call(a):b.values(a)};b.size=function(a){return b.toArray(a).length};b.first=b.head=function(a,b,d){return b!=null&&!d?i.call(a,0,b):a[0]};b.initial=function(a,b,d){return i.call(a,0,a.length-(b==null||d?1:b))};b.last=function(a,b,d){return b!=null&&!d?i.call(a,Math.max(a.length-b,0)):a[a.length-1]};b.rest=
b.tail=function(a,b,d){return i.call(a,b==null||d?1:b)};b.compact=function(a){return b.filter(a,function(a){return!!a})};b.flatten=function(a,c){return b.reduce(a,function(a,e){if(b.isArray(e))return a.concat(c?e:b.flatten(e));a[a.length]=e;return a},[])};b.without=function(a){return b.difference(a,i.call(arguments,1))};b.uniq=b.unique=function(a,c,d){var d=d?b.map(a,d):a,e=[];b.reduce(d,function(d,g,h){if(0==h||(c===true?b.last(d)!=g:!b.include(d,g)))d[d.length]=g,e[e.length]=a[h];return d},[]);
return e};b.union=function(){return b.uniq(b.flatten(arguments,true))};b.intersection=b.intersect=function(a){var c=i.call(arguments,1);return b.filter(b.uniq(a),function(a){return b.every(c,function(c){return b.indexOf(c,a)>=0})})};b.difference=function(a){var c=b.flatten(i.call(arguments,1));return b.filter(a,function(a){return!b.include(c,a)})};b.zip=function(){for(var a=i.call(arguments),c=b.max(b.pluck(a,"length")),d=Array(c),e=0;e<c;e++)d[e]=b.pluck(a,""+e);return d};b.indexOf=function(a,c,
d){if(a==null)return-1;var e;if(d)return d=b.sortedIndex(a,c),a[d]===c?d:-1;if(p&&a.indexOf===p)return a.indexOf(c);for(d=0,e=a.length;d<e;d++)if(d in a&&a[d]===c)return d;return-1};b.lastIndexOf=function(a,b){if(a==null)return-1;if(D&&a.lastIndexOf===D)return a.lastIndexOf(b);for(var d=a.length;d--;)if(d in a&&a[d]===b)return d;return-1};b.range=function(a,b,d){arguments.length<=1&&(b=a||0,a=0);for(var d=arguments[2]||1,e=Math.max(Math.ceil((b-a)/d),0),f=0,g=Array(e);f<e;)g[f++]=a,a+=d;return g};
var F=function(){};b.bind=function(a,c){var d,e;if(a.bind===s&&s)return s.apply(a,i.call(arguments,1));if(!b.isFunction(a))throw new TypeError;e=i.call(arguments,2);return d=function(){if(!(this instanceof d))return a.apply(c,e.concat(i.call(arguments)));F.prototype=a.prototype;var b=new F,g=a.apply(b,e.concat(i.call(arguments)));return Object(g)===g?g:b}};b.bindAll=function(a){var c=i.call(arguments,1);c.length==0&&(c=b.functions(a));j(c,function(c){a[c]=b.bind(a[c],a)});return a};b.memoize=function(a,
c){var d={};c||(c=b.identity);return function(){var e=c.apply(this,arguments);return b.has(d,e)?d[e]:d[e]=a.apply(this,arguments)}};b.delay=function(a,b){var d=i.call(arguments,2);return setTimeout(function(){return a.apply(a,d)},b)};b.defer=function(a){return b.delay.apply(b,[a,1].concat(i.call(arguments,1)))};b.throttle=function(a,c){var d,e,f,g,h,i=b.debounce(function(){h=g=false},c);return function(){d=this;e=arguments;var b;f||(f=setTimeout(function(){f=null;h&&a.apply(d,e);i()},c));g?h=true:
a.apply(d,e);i();g=true}};b.debounce=function(a,b){var d;return function(){var e=this,f=arguments;clearTimeout(d);d=setTimeout(function(){d=null;a.apply(e,f)},b)}};b.once=function(a){var b=false,d;return function(){if(b)return d;b=true;return d=a.apply(this,arguments)}};b.wrap=function(a,b){return function(){var d=[a].concat(i.call(arguments,0));return b.apply(this,d)}};b.compose=function(){var a=arguments;return function(){for(var b=arguments,d=a.length-1;d>=0;d--)b=[a[d].apply(this,b)];return b[0]}};
b.after=function(a,b){return a<=0?b():function(){if(--a<1)return b.apply(this,arguments)}};b.keys=J||function(a){if(a!==Object(a))throw new TypeError("Invalid object");var c=[],d;for(d in a)b.has(a,d)&&(c[c.length]=d);return c};b.values=function(a){return b.map(a,b.identity)};b.functions=b.methods=function(a){var c=[],d;for(d in a)b.isFunction(a[d])&&c.push(d);return c.sort()};b.extend=function(a){j(i.call(arguments,1),function(b){for(var d in b)a[d]=b[d]});return a};b.defaults=function(a){j(i.call(arguments,
1),function(b){for(var d in b)a[d]==null&&(a[d]=b[d])});return a};b.clone=function(a){return!b.isObject(a)?a:b.isArray(a)?a.slice():b.extend({},a)};b.tap=function(a,b){b(a);return a};b.isEqual=function(a,b){return q(a,b,[])};b.isEmpty=function(a){if(b.isArray(a)||b.isString(a))return a.length===0;for(var c in a)if(b.has(a,c))return false;return true};b.isElement=function(a){return!!(a&&a.nodeType==1)};b.isArray=o||function(a){return l.call(a)=="[object Array]"};b.isObject=function(a){return a===Object(a)};
b.isArguments=function(a){return l.call(a)=="[object Arguments]"};if(!b.isArguments(arguments))b.isArguments=function(a){return!(!a||!b.has(a,"callee"))};b.isFunction=function(a){return l.call(a)=="[object Function]"};b.isString=function(a){return l.call(a)=="[object String]"};b.isNumber=function(a){return l.call(a)=="[object Number]"};b.isNaN=function(a){return a!==a};b.isBoolean=function(a){return a===true||a===false||l.call(a)=="[object Boolean]"};b.isDate=function(a){return l.call(a)=="[object Date]"};
b.isRegExp=function(a){return l.call(a)=="[object RegExp]"};b.isNull=function(a){return a===null};b.isUndefined=function(a){return a===void 0};b.has=function(a,b){return I.call(a,b)};b.noConflict=function(){r._=G;return this};b.identity=function(a){return a};b.times=function(a,b,d){for(var e=0;e<a;e++)b.call(d,e)};b.escape=function(a){return(""+a).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#x27;").replace(/\//g,"&#x2F;")};b.mixin=function(a){j(b.functions(a),
function(c){K(c,b[c]=a[c])})};var L=0;b.uniqueId=function(a){var b=L++;return a?a+b:b};b.templateSettings={evaluate:/<%([\s\S]+?)%>/g,interpolate:/<%=([\s\S]+?)%>/g,escape:/<%-([\s\S]+?)%>/g};var t=/.^/,u=function(a){return a.replace(/\\\\/g,"\\").replace(/\\'/g,"'")};b.template=function(a,c){var d=b.templateSettings,d="var __p=[],print=function(){__p.push.apply(__p,arguments);};with(obj||{}){__p.push('"+a.replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(d.escape||t,function(a,b){return"',_.escape("+
u(b)+"),'"}).replace(d.interpolate||t,function(a,b){return"',"+u(b)+",'"}).replace(d.evaluate||t,function(a,b){return"');"+u(b).replace(/[\r\n\t]/g," ")+";__p.push('"}).replace(/\r/g,"\\r").replace(/\n/g,"\\n").replace(/\t/g,"\\t")+"');}return __p.join('');",e=new Function("obj","_",d);return c?e(c,b):function(a){return e.call(this,a,b)}};b.chain=function(a){return b(a).chain()};var m=function(a){this._wrapped=a};b.prototype=m.prototype;var v=function(a,c){return c?b(a).chain():a},K=function(a,c){m.prototype[a]=
function(){var a=i.call(arguments);H.call(a,this._wrapped);return v(c.apply(b,a),this._chain)}};b.mixin(b);j("pop,push,reverse,shift,sort,splice,unshift".split(","),function(a){var b=k[a];m.prototype[a]=function(){var d=this._wrapped;b.apply(d,arguments);var e=d.length;(a=="shift"||a=="splice")&&e===0&&delete d[0];return v(d,this._chain)}});j(["concat","join","slice"],function(a){var b=k[a];m.prototype[a]=function(){return v(b.apply(this._wrapped,arguments),this._chain)}});m.prototype.chain=function(){this._chain=
true;return this};m.prototype.value=function(){return this._wrapped}}).call(this);

// Backbone.js 0.9.1

// (c) 2010-2012 Jeremy Ashkenas, DocumentCloud Inc.
// Backbone may be freely distributed under the MIT license.
// For all details and documentation:
// http://backbonejs.org
(function(){var i=this,r=i.Backbone,s=Array.prototype.slice,t=Array.prototype.splice,g;g="undefined"!==typeof exports?exports:i.Backbone={};g.VERSION="0.9.1";var f=i._;!f&&"undefined"!==typeof require&&(f=require("underscore"));var h=i.jQuery||i.Zepto||i.ender;g.setDomLibrary=function(a){h=a};g.noConflict=function(){i.Backbone=r;return this};g.emulateHTTP=!1;g.emulateJSON=!1;g.Events={on:function(a,b,c){for(var d,a=a.split(/\s+/),e=this._callbacks||(this._callbacks={});d=a.shift();){d=e[d]||(e[d]=
{});var f=d.tail||(d.tail=d.next={});f.callback=b;f.context=c;d.tail=f.next={}}return this},off:function(a,b,c){var d,e,f;if(a){if(e=this._callbacks)for(a=a.split(/\s+/);d=a.shift();)if(f=e[d],delete e[d],b&&f)for(;(f=f.next)&&f.next;)if(!(f.callback===b&&(!c||f.context===c)))this.on(d,f.callback,f.context)}else delete this._callbacks;return this},trigger:function(a){var b,c,d,e;if(!(d=this._callbacks))return this;e=d.all;for((a=a.split(/\s+/)).push(null);b=a.shift();)e&&a.push({next:e.next,tail:e.tail,
event:b}),(c=d[b])&&a.push({next:c.next,tail:c.tail});for(e=s.call(arguments,1);c=a.pop();){b=c.tail;for(d=c.event?[c.event].concat(e):e;(c=c.next)!==b;)c.callback.apply(c.context||this,d)}return this}};g.Events.bind=g.Events.on;g.Events.unbind=g.Events.off;g.Model=function(a,b){var c;a||(a={});b&&b.parse&&(a=this.parse(a));if(c=j(this,"defaults"))a=f.extend({},c,a);b&&b.collection&&(this.collection=b.collection);this.attributes={};this._escapedAttributes={};this.cid=f.uniqueId("c");if(!this.set(a,
{silent:!0}))throw Error("Can't create an invalid model");delete this._changed;this._previousAttributes=f.clone(this.attributes);this.initialize.apply(this,arguments)};f.extend(g.Model.prototype,g.Events,{idAttribute:"id",initialize:function(){},toJSON:function(){return f.clone(this.attributes)},get:function(a){return this.attributes[a]},escape:function(a){var b;if(b=this._escapedAttributes[a])return b;b=this.attributes[a];return this._escapedAttributes[a]=f.escape(null==b?"":""+b)},has:function(a){return null!=
this.attributes[a]},set:function(a,b,c){var d,e;f.isObject(a)||null==a?(d=a,c=b):(d={},d[a]=b);c||(c={});if(!d)return this;d instanceof g.Model&&(d=d.attributes);if(c.unset)for(e in d)d[e]=void 0;if(!this._validate(d,c))return!1;this.idAttribute in d&&(this.id=d[this.idAttribute]);var b=this.attributes,k=this._escapedAttributes,n=this._previousAttributes||{},h=this._setting;this._changed||(this._changed={});this._setting=!0;for(e in d)if(a=d[e],f.isEqual(b[e],a)||delete k[e],c.unset?delete b[e]:b[e]=
a,this._changing&&!f.isEqual(this._changed[e],a)&&(this.trigger("change:"+e,this,a,c),this._moreChanges=!0),delete this._changed[e],!f.isEqual(n[e],a)||f.has(b,e)!=f.has(n,e))this._changed[e]=a;h||(!c.silent&&this.hasChanged()&&this.change(c),this._setting=!1);return this},unset:function(a,b){(b||(b={})).unset=!0;return this.set(a,null,b)},clear:function(a){(a||(a={})).unset=!0;return this.set(f.clone(this.attributes),a)},fetch:function(a){var a=a?f.clone(a):{},b=this,c=a.success;a.success=function(d,
e,f){if(!b.set(b.parse(d,f),a))return!1;c&&c(b,d)};a.error=g.wrapError(a.error,b,a);return(this.sync||g.sync).call(this,"read",this,a)},save:function(a,b,c){var d,e;f.isObject(a)||null==a?(d=a,c=b):(d={},d[a]=b);c=c?f.clone(c):{};c.wait&&(e=f.clone(this.attributes));a=f.extend({},c,{silent:!0});if(d&&!this.set(d,c.wait?a:c))return!1;var k=this,h=c.success;c.success=function(a,b,e){b=k.parse(a,e);c.wait&&(b=f.extend(d||{},b));if(!k.set(b,c))return!1;h?h(k,a):k.trigger("sync",k,a,c)};c.error=g.wrapError(c.error,
k,c);b=this.isNew()?"create":"update";b=(this.sync||g.sync).call(this,b,this,c);c.wait&&this.set(e,a);return b},destroy:function(a){var a=a?f.clone(a):{},b=this,c=a.success,d=function(){b.trigger("destroy",b,b.collection,a)};if(this.isNew())return d();a.success=function(e){a.wait&&d();c?c(b,e):b.trigger("sync",b,e,a)};a.error=g.wrapError(a.error,b,a);var e=(this.sync||g.sync).call(this,"delete",this,a);a.wait||d();return e},url:function(){var a=j(this.collection,"url")||j(this,"urlRoot")||o();return this.isNew()?
a:a+("/"==a.charAt(a.length-1)?"":"/")+encodeURIComponent(this.id)},parse:function(a){return a},clone:function(){return new this.constructor(this.attributes)},isNew:function(){return null==this.id},change:function(a){if(this._changing||!this.hasChanged())return this;this._moreChanges=this._changing=!0;for(var b in this._changed)this.trigger("change:"+b,this,this._changed[b],a);for(;this._moreChanges;)this._moreChanges=!1,this.trigger("change",this,a);this._previousAttributes=f.clone(this.attributes);
delete this._changed;this._changing=!1;return this},hasChanged:function(a){return!arguments.length?!f.isEmpty(this._changed):this._changed&&f.has(this._changed,a)},changedAttributes:function(a){if(!a)return this.hasChanged()?f.clone(this._changed):!1;var b,c=!1,d=this._previousAttributes,e;for(e in a)if(!f.isEqual(d[e],b=a[e]))(c||(c={}))[e]=b;return c},previous:function(a){return!arguments.length||!this._previousAttributes?null:this._previousAttributes[a]},previousAttributes:function(){return f.clone(this._previousAttributes)},
isValid:function(){return!this.validate(this.attributes)},_validate:function(a,b){if(b.silent||!this.validate)return!0;var a=f.extend({},this.attributes,a),c=this.validate(a,b);if(!c)return!0;b&&b.error?b.error(this,c,b):this.trigger("error",this,c,b);return!1}});g.Collection=function(a,b){b||(b={});b.comparator&&(this.comparator=b.comparator);this._reset();this.initialize.apply(this,arguments);a&&this.reset(a,{silent:!0,parse:b.parse})};f.extend(g.Collection.prototype,g.Events,{model:g.Model,initialize:function(){},
toJSON:function(){return this.map(function(a){return a.toJSON()})},add:function(a,b){var c,d,e,g,h,i={},j={};b||(b={});a=f.isArray(a)?a.slice():[a];for(c=0,d=a.length;c<d;c++){if(!(e=a[c]=this._prepareModel(a[c],b)))throw Error("Can't add an invalid model to a collection");if(i[g=e.cid]||this._byCid[g]||null!=(h=e.id)&&(j[h]||this._byId[h]))throw Error("Can't add the same model to a collection twice");i[g]=j[h]=e}for(c=0;c<d;c++)(e=a[c]).on("all",this._onModelEvent,this),this._byCid[e.cid]=e,null!=
e.id&&(this._byId[e.id]=e);this.length+=d;t.apply(this.models,[null!=b.at?b.at:this.models.length,0].concat(a));this.comparator&&this.sort({silent:!0});if(b.silent)return this;for(c=0,d=this.models.length;c<d;c++)if(i[(e=this.models[c]).cid])b.index=c,e.trigger("add",e,this,b);return this},remove:function(a,b){var c,d,e,g;b||(b={});a=f.isArray(a)?a.slice():[a];for(c=0,d=a.length;c<d;c++)if(g=this.getByCid(a[c])||this.get(a[c]))delete this._byId[g.id],delete this._byCid[g.cid],e=this.indexOf(g),this.models.splice(e,
1),this.length--,b.silent||(b.index=e,g.trigger("remove",g,this,b)),this._removeReference(g);return this},get:function(a){return null==a?null:this._byId[null!=a.id?a.id:a]},getByCid:function(a){return a&&this._byCid[a.cid||a]},at:function(a){return this.models[a]},sort:function(a){a||(a={});if(!this.comparator)throw Error("Cannot sort a set without a comparator");var b=f.bind(this.comparator,this);1==this.comparator.length?this.models=this.sortBy(b):this.models.sort(b);a.silent||this.trigger("reset",
this,a);return this},pluck:function(a){return f.map(this.models,function(b){return b.get(a)})},reset:function(a,b){a||(a=[]);b||(b={});for(var c=0,d=this.models.length;c<d;c++)this._removeReference(this.models[c]);this._reset();this.add(a,{silent:!0,parse:b.parse});b.silent||this.trigger("reset",this,b);return this},fetch:function(a){a=a?f.clone(a):{};void 0===a.parse&&(a.parse=!0);var b=this,c=a.success;a.success=function(d,e,f){b[a.add?"add":"reset"](b.parse(d,f),a);c&&c(b,d)};a.error=g.wrapError(a.error,
b,a);return(this.sync||g.sync).call(this,"read",this,a)},create:function(a,b){var c=this,b=b?f.clone(b):{},a=this._prepareModel(a,b);if(!a)return!1;b.wait||c.add(a,b);var d=b.success;b.success=function(e,f){b.wait&&c.add(e,b);d?d(e,f):e.trigger("sync",a,f,b)};a.save(null,b);return a},parse:function(a){return a},chain:function(){return f(this.models).chain()},_reset:function(){this.length=0;this.models=[];this._byId={};this._byCid={}},_prepareModel:function(a,b){a instanceof g.Model?a.collection||
(a.collection=this):(b.collection=this,a=new this.model(a,b),a._validate(a.attributes,b)||(a=!1));return a},_removeReference:function(a){this==a.collection&&delete a.collection;a.off("all",this._onModelEvent,this)},_onModelEvent:function(a,b,c,d){("add"==a||"remove"==a)&&c!=this||("destroy"==a&&this.remove(b,d),b&&a==="change:"+b.idAttribute&&(delete this._byId[b.previous(b.idAttribute)],this._byId[b.id]=b),this.trigger.apply(this,arguments))}});f.each("forEach,each,map,reduce,reduceRight,find,detect,filter,select,reject,every,all,some,any,include,contains,invoke,max,min,sortBy,sortedIndex,toArray,size,first,initial,rest,last,without,indexOf,shuffle,lastIndexOf,isEmpty,groupBy".split(","),
function(a){g.Collection.prototype[a]=function(){return f[a].apply(f,[this.models].concat(f.toArray(arguments)))}});g.Router=function(a){a||(a={});a.routes&&(this.routes=a.routes);this._bindRoutes();this.initialize.apply(this,arguments)};var u=/:\w+/g,v=/\*\w+/g,w=/[-[\]{}()+?.,\\^$|#\s]/g;f.extend(g.Router.prototype,g.Events,{initialize:function(){},route:function(a,b,c){g.history||(g.history=new g.History);f.isRegExp(a)||(a=this._routeToRegExp(a));c||(c=this[b]);g.history.route(a,f.bind(function(d){d=
this._extractParameters(a,d);c&&c.apply(this,d);this.trigger.apply(this,["route:"+b].concat(d));g.history.trigger("route",this,b,d)},this));return this},navigate:function(a,b){g.history.navigate(a,b)},_bindRoutes:function(){if(this.routes){var a=[],b;for(b in this.routes)a.unshift([b,this.routes[b]]);b=0;for(var c=a.length;b<c;b++)this.route(a[b][0],a[b][1],this[a[b][1]])}},_routeToRegExp:function(a){a=a.replace(w,"\\$&").replace(u,"([^/]+)").replace(v,"(.*?)");return RegExp("^"+a+"$")},_extractParameters:function(a,
b){return a.exec(b).slice(1)}});g.History=function(){this.handlers=[];f.bindAll(this,"checkUrl")};var m=/^[#\/]/,x=/msie [\w.]+/,l=!1;f.extend(g.History.prototype,g.Events,{interval:50,getFragment:function(a,b){if(null==a)if(this._hasPushState||b){var a=window.location.pathname,c=window.location.search;c&&(a+=c)}else a=window.location.hash;a=decodeURIComponent(a);a.indexOf(this.options.root)||(a=a.substr(this.options.root.length));return a.replace(m,"")},start:function(a){if(l)throw Error("Backbone.history has already been started");
this.options=f.extend({},{root:"/"},this.options,a);this._wantsHashChange=!1!==this.options.hashChange;this._wantsPushState=!!this.options.pushState;this._hasPushState=!(!this.options.pushState||!window.history||!window.history.pushState);var a=this.getFragment(),b=document.documentMode;if(b=x.exec(navigator.userAgent.toLowerCase())&&(!b||7>=b))this.iframe=h('<iframe src="javascript:0" tabindex="-1" />').hide().appendTo("body")[0].contentWindow,this.navigate(a);this._hasPushState?h(window).bind("popstate",
this.checkUrl):this._wantsHashChange&&"onhashchange"in window&&!b?h(window).bind("hashchange",this.checkUrl):this._wantsHashChange&&(this._checkUrlInterval=setInterval(this.checkUrl,this.interval));this.fragment=a;l=!0;a=window.location;b=a.pathname==this.options.root;if(this._wantsHashChange&&this._wantsPushState&&!this._hasPushState&&!b)return this.fragment=this.getFragment(null,!0),window.location.replace(this.options.root+"#"+this.fragment),!0;this._wantsPushState&&this._hasPushState&&b&&a.hash&&
(this.fragment=a.hash.replace(m,""),window.history.replaceState({},document.title,a.protocol+"//"+a.host+this.options.root+this.fragment));if(!this.options.silent)return this.loadUrl()},stop:function(){h(window).unbind("popstate",this.checkUrl).unbind("hashchange",this.checkUrl);clearInterval(this._checkUrlInterval);l=!1},route:function(a,b){this.handlers.unshift({route:a,callback:b})},checkUrl:function(){var a=this.getFragment();a==this.fragment&&this.iframe&&(a=this.getFragment(this.iframe.location.hash));
if(a==this.fragment||a==decodeURIComponent(this.fragment))return!1;this.iframe&&this.navigate(a);this.loadUrl()||this.loadUrl(window.location.hash)},loadUrl:function(a){var b=this.fragment=this.getFragment(a);return f.any(this.handlers,function(a){if(a.route.test(b))return a.callback(b),!0})},navigate:function(a,b){if(!l)return!1;if(!b||!0===b)b={trigger:b};var c=(a||"").replace(m,"");this.fragment==c||this.fragment==decodeURIComponent(c)||(this._hasPushState?(0!=c.indexOf(this.options.root)&&(c=
this.options.root+c),this.fragment=c,window.history[b.replace?"replaceState":"pushState"]({},document.title,c)):this._wantsHashChange?(this.fragment=c,this._updateHash(window.location,c,b.replace),this.iframe&&c!=this.getFragment(this.iframe.location.hash)&&(b.replace||this.iframe.document.open().close(),this._updateHash(this.iframe.location,c,b.replace))):window.location.assign(this.options.root+a),b.trigger&&this.loadUrl(a))},_updateHash:function(a,b,c){c?a.replace(a.toString().replace(/(javascript:|#).*$/,
"")+"#"+b):a.hash=b}});g.View=function(a){this.cid=f.uniqueId("view");this._configure(a||{});this._ensureElement();this.initialize.apply(this,arguments);this.delegateEvents()};var y=/^(\S+)\s*(.*)$/,p="model,collection,el,id,attributes,className,tagName".split(",");f.extend(g.View.prototype,g.Events,{tagName:"div",$:function(a){return this.$el.find(a)},initialize:function(){},render:function(){return this},remove:function(){this.$el.remove();return this},make:function(a,b,c){a=document.createElement(a);
b&&h(a).attr(b);c&&h(a).html(c);return a},setElement:function(a,b){this.$el=h(a);this.el=this.$el[0];!1!==b&&this.delegateEvents();return this},delegateEvents:function(a){if(a||(a=j(this,"events"))){this.undelegateEvents();for(var b in a){var c=a[b];f.isFunction(c)||(c=this[a[b]]);if(!c)throw Error('Event "'+a[b]+'" does not exist');var d=b.match(y),e=d[1],d=d[2],c=f.bind(c,this),e=e+(".delegateEvents"+this.cid);""===d?this.$el.bind(e,c):this.$el.delegate(d,e,c)}}},undelegateEvents:function(){this.$el.unbind(".delegateEvents"+
this.cid)},_configure:function(a){this.options&&(a=f.extend({},this.options,a));for(var b=0,c=p.length;b<c;b++){var d=p[b];a[d]&&(this[d]=a[d])}this.options=a},_ensureElement:function(){if(this.el)this.setElement(this.el,!1);else{var a=j(this,"attributes")||{};this.id&&(a.id=this.id);this.className&&(a["class"]=this.className);this.setElement(this.make(this.tagName,a),!1)}}});g.Model.extend=g.Collection.extend=g.Router.extend=g.View.extend=function(a,b){var c=z(this,a,b);c.extend=this.extend;return c};
var A={create:"POST",update:"PUT","delete":"DELETE",read:"GET"};g.sync=function(a,b,c){var d=A[a],e={type:d,dataType:"json"};c.url||(e.url=j(b,"url")||o());if(!c.data&&b&&("create"==a||"update"==a))e.contentType="application/json",e.data=JSON.stringify(b.toJSON());g.emulateJSON&&(e.contentType="application/x-www-form-urlencoded",e.data=e.data?{model:e.data}:{});if(g.emulateHTTP&&("PUT"===d||"DELETE"===d))g.emulateJSON&&(e.data._method=d),e.type="POST",e.beforeSend=function(a){a.setRequestHeader("X-HTTP-Method-Override",
d)};"GET"!==e.type&&!g.emulateJSON&&(e.processData=!1);return h.ajax(f.extend(e,c))};g.wrapError=function(a,b,c){return function(d,e){e=d===b?e:d;a?a(b,e,c):b.trigger("error",b,e,c)}};var q=function(){},z=function(a,b,c){var d;d=b&&b.hasOwnProperty("constructor")?b.constructor:function(){a.apply(this,arguments)};f.extend(d,a);q.prototype=a.prototype;d.prototype=new q;b&&f.extend(d.prototype,b);c&&f.extend(d,c);d.prototype.constructor=d;d.__super__=a.prototype;return d},j=function(a,b){return!a||!a[b]?
null:f.isFunction(a[b])?a[b]():a[b]},o=function(){throw Error('A "url" property or function must be specified');}}).call(this);var Templates = {
	
	/*
	 * Templates::preDefine
	 *
	 * Pre defines all the templates so $.tmpl() takes a string, keeps us from re-requesting
	 * template every time, tiny tiny bit of overhead saved, but every save is better, plus
	 * it's a bit neater. If this isn't called none of our $.tmpl() calls will work
	 */
	preDefine: function()
	{
		$.template('messageRowAction', this.messageRow(true));
		$.template('messageRow', this.messageRow(false));
		$.template('noticeRow', this.noticeRow());
		$.template('otherRow', this.otherRow());
		$.template('collapsedHeadingRow', this.collapsedHeadingRow());
		$.template('windowNoticeRow', this.windowNoticeRow());
		$.template('dividerRow', this.dividerRow());
		$.template('tabLinkNetworkLocked', this.tabLinkNetwork(true));
		$.template('tabLinkNetworkUnlocked', this.tabLinkNetwork(false));
		$.template('tabLink', this.tabLink());
		$.template('tabHtmlWindow', this.tabHtmlWindow());
		$.template('tabHtmlChannel', this.tabHtmlChannel());
		$.template('tabHtmlOther', this.tabHtmlOther());
	},

	/*
	 * Templates::messageRow
	 *
	 * Return a predefined html template for message rows.
	 *
	 * Parameters: action (boolean) (whether the message is an action or not ie /me)
	 */
	messageRow: function(action)
	{
		if (action)
		{
			return '<div class="clear row${cssClass}" data-type="privmsg" data-id="${id}" data-self="${self}" data-read="${read}" data-highlight="${highlight}" data-time="${date}">' +
				'<span class="column3 time" data-format-1="${time_f1}" data-format-2="${time_f2}"></span>' +
				'<span class="column2 action">' +
					'{{html userLink}}' +
					'{{html parsedMessage}}' +
				'</span>' +
			'</div>';
			// the template for /me is slightly different
		}
		else
		{
			return '<div class="clear row${cssClass}" data-type="privmsg" data-id="${id}" data-self="${self}" data-read="${read}" data-highlight="${highlight}" data-time="${date}">' +
				'<span class="column3 time" data-format-1="${time_f1}" data-format-2="${time_f2}"></span>' +
				'<span class="column2 message">' +
					'{{html userLink}}' +
					'{{html parsedMessage}}' +
				'</span>' +
			'</div>';
			// normal message row
		}
	},

	/*
	 * Templates::noticeRow
	 *
	 * Return a predefined html template for notice rows
	 */
	noticeRow: function()
	{
		return '<div class="row clear" data-type="notice" data-read="${read}" data-id="${id}" data-time="${date}">' +
			'<span class="column3 time" data-format-1="${time_f1}" data-format-2="${time_f2}"></span>' +
			'<span class="column2 message">' + 
				'{{html userLink}}' +
				'{{html parsedMessage}}' +
			'</span>' +
		'</div>';
	},

	/*
	 * Templates::otherRow
	 *
	 * Return a predefined html template for other rows (join/part etc)
	 */
	otherRow: function()
	{
		return '<div class="row clear${cssClass}" data-type="${type}" data-id="${id}" data-time="${date}">' +
			'<span class="column3 time" data-format-1="${time_f1}" data-format-2="${time_f2}"></span>' +
			'<span class="column2 ${messageCssClass}">' + 
				'{{html message}}' +
			'</span>' +
		'</div>';
	},

	/*
	 * Templates::collapsedHeadingRow
	 *
	 * Return a predefined html template for collapsable heading rows
	 */
	collapsedHeadingRow: function()
	{
		return '<div class="row otherRow clear collapsed-head" data-type="collapse" data-time="${date}">' +
			'<span class="column3 time" data-format-1="${time_f1}" data-format-2="${time_f2}"></span>' +
			'<span class="column2 event">' + 
				'{{html message}}' +
			'</span>' +
		'</div>' +
		'<div class="collapsed row otherRow hide" data-type="collapse" data-time="${date}"></div>';
	},

	/*
	 * Templates::windowNoticeRow
	 *
	 * Return a window notice row
	 */
	windowNoticeRow: function()
	{
		return '<div class="row clear" data-type="window-notice" data-id="${id}" data-time="${date}">' +
			'<div class="divider">' +
				'{{html message}}' +
			'</div>' +
		'</div>';
	},

	/*
	 * Templates::dividerRow
	 *
	 * Return a divider row
	 */
	dividerRow: function()
	{
		return '<div class="row clear" data-type="${type}">' +
			'<fieldset>' +
				'<legend align="center">' +
					'{{html message}}' +
				'</legend>' +
			'</fieldset>' +
		'</div>';
	},

	/*
	 * Templates::tabLinkNetwork
	 *
	 * Return a tab link for a network window
	 *
	 * Parameters: locked (boolean) (whether the network is locked or not)
	 */
	tabLinkNetwork: function(locked)
	{
		if (locked)
		{
			return '<li class="title clear" id="link-${id}" data-type="window">' +
				'<a href="${hash}" title="${title}" class="locked">' +
					'<span class="link net-loader">${chan}</span>' +
				'</a>' +
				//'{{html closeLink}}' +
			'</li>';
		}
		else
		{
			return '<li class="title clear" id="link-${id}" data-type="window">' +
				'<a href="${hash}" title="${title}">' +
					'<span class="link net-loader">${chan}</span>' +
				'</a>' +
				//'{{html closeLink}}' +
			'</li>';
		}
	},

	/*
	 * Templates::tabLink
	 *
	 * Return a tab link
	 */
	tabLink: function()
	{
		return '<li class="clear" id="link-${id}" data-type="${type}">' +
			'<a href="${hash}" title="${title}">' +
				'<span class="link ${cssClass}">${chan}</span>' +
			'</a>' +
			//'<a href="#" class="close">&times;</a>' +
		'</li>';
	},

	/*
	 * Templates::tabHtmlWindow
	 *
	 * Return the full html for a window/privmsg tab
	 */
	tabHtmlWindow: function()
	{
		return '<div id="tab-${id}" class="tab clear">' +
			'<div id="msgs-${id}" class="wmsg_container">' +
				'<div class="mcontainer content">' +
					'<div class="overlay-bar"></div>' +
					'<div class="top-message-bar message-bar clear">' +
						'<span class="left">' +
							'<span class="last hide">0</span>' +
							'<span class="message-number"></span>' +
						'</span>' +
						'<span class="right">' +
							'<a href="#" id="read-backlog">Mark as read</a>' +
						'</span>' +
					'</div>' +
					'<div class="row clear hide" data-type="initial-divider"></div>' +
				'</div>' +
			'</div>' +
		'</div>';
	},

	/*
	 * Templates::tabHtmlChannel
	 *
	 * Return the full html for a channel tab
	 */
	tabHtmlChannel: function()
	{
		return '<div id="tab-${id}" class="tab clear">' +
			'<div id="msgs-${id}" class="msg_container">' +
				'<div class="mcontainer content">' +
					'<div class="overlay-bar"></div>' +
					'<div class="top-message-bar message-bar clear">' +
						'<span class="left">' +
							'<span class="last hide">0</span>' +
							'<span class="message-number"></span>' +
						'</span>' +
						'<span class="right">' +
							'<a href="#" id="read-backlog">Mark as read</a>' +
						'</span>' +
					'</div>' +
					'<div class="row clear hide" data-type="initial-divider"></div>' +
				'</div>' +
			'</div>' +
			'<div class="userlist" id="list-${id}">' +
				'<div class="content"></div>' +
			'</div>' +
		'</div>';
	},

	/*
	 * Templates::tabHtmlOther
	 *
	 * Return the full html for a 'other' tab (ie list/links)
	 */
	tabHtmlOther: function()
	{
		return '<div id="tab-${id}" class="tab clear">' +
			'<div id="msgs-${id}" class="wmsg_container t_container">' +
				'<div class="mcontainer content">' +
					'<div class="overlay-bar"></div>' +
					'<div class="top-message-bar message-bar clear">' +
						'<span class="left">' +
							'<span class="last hide">0</span>' +
							'<span class="message-number"></span>' +
						'</span>' +
						'<span class="right">' +
							'<a href="#" id="read-backlog">Mark as read</a>' +
						'</span>' +
					'</div>' +
					'<table id="table-${id}" class="tablesorter"></table>' +
				'</div>' +
			'</div>' +
		'</div>';
	}
};var Helper = {
	
	collapseableTypes: [
		'collapse',
		'join',
		'part',
		'nick',
		'quit',
		'mode',
		'topic',
		'kick'
	],

	isChannel: function(network, channel)
	{
		var firstChar = (channel == '') ? '' : channel.charAt(0),
			types = (network.extra == undefined || network.extra.channelTypes == undefined) ? ['#'] : network.extra.channelTypes;
			types = (typeof types == 'string') ? types.split('') : types;
		// if we can't find any types or it isnt an array we reset it

		if (types.indexOf(firstChar) > -1)
			return true;
		// if the channel is a valid type then return true

		return false;
	},

	encodeChannel: function(channel)
	{
		return channel
				.replace('#', '%23')
				.replace('&', '%26')
				.replace('+', '%2B')
				.replace('!', '%21');
	},

	decodeChannel: function(channel)
	{
		return channel
				.replace('%23', '#')
				.replace('%26', '&')
				.replace('%2B', '+')
				.replace('%21', '!');
	},

	generateUserLink: function(network, nick, ident, hostname, prefix, away, showPrefix)
	{
		if (prefix == 'Z' || prefix == '')
			prefixClass = '';
		else if (prefix == '+')
			prefixClass = ' voice';
		else if (prefix == '%')
			prefixClass = ' halfop';
		else 
			prefixClass = ' op';
		// setup a different colour for different prefixes :3

		var away = (away == undefined) ? true : away,
			showPrefix = (showPrefix == undefined) ? true : showPrefix,
			awayClass = (away) ? ' class="away clear"' : ' class="clear"',
			prefixIcon = (prefix == 'Z' || prefix == '') ? '&nbsp;' : prefix,
			prefixSpan = (showPrefix) ? '<span class="prefix' + prefixClass + '">' + prefixIcon + '</span>' : '';

		return '<a href="#!/' + userInfo.networks[network].url + '/' + nick + '" rel="user-link" data-nick="' + nick + '"  data-prefix="' + prefixIcon + '" data-ident="' + ident + '" data-hostname="' + hostname + '"' + awayClass + '>' + prefixSpan + '<span class="name">' + nick + '</span></a></li>';
		// return the element
	},

	generateCollapsedHeading: function(tab, head, type, el)
	{
		var prefixes = {
				'join': '&rarr;',
				'part': '&larr;',
				'nick': '&dash;',
				'quit': '&larr;',
				'mode': '&dash;',
				'topic': '&dash;',
				'kick': '&larr;'
			},
			suffixes = {
				'join': 'has joined',
				'part': 'has left',
				'quit': 'has quit'
			},
			prefix = prefixes[type],
			userLink = el.find('a:first-child'),
			collapsed = tab.$msgs.find('div.collapsed:last');
		// we just get passed in el which we extract everything we need from it.
		// first off we'll see if the head already has an element for this type

		if (type == 'mode' || type == 'nick' || type == 'topic')
		{
			element = $('<span class="ht ' + type + '">' + el.find('.event').html() + '</span>');

			head.append(element);
		}
		else if ((type != 'mode' && type != 'nick' && type != 'topic') && userLink[0] != undefined)
		{
			var suffix = (suffixes[type] == undefined) ? '' : ' ' + suffixes[type],
				element = $('<span class="ht ' + type + '">' + prefix + ' ' + userLink[0].outerHTML + suffix + '</span>');

			head.append(element);
		}
	},

	reOrganiseChannelEvents: function(tab, time, me)
	{
		var _this = this,
			prev = me.prev(),
			next = me.next(),
			parent = me.parent();

		if (tab.get('type') != 'chan' || me.attr('data-type') == 'collapse')
			return;

		function callback(el)
		{
			if (el !== undefined)
			{
				if (client.settings.timestamp_format == 0)
					el.find('span.time').text(el.find('span.time').attr('data-format-1'));
				else
					el.find('span.time').text(el.find('span.time').attr('data-format-2'));
			}

			if (!parent.hasClass('collapsed') && _this.collapseableTypes.indexOf(me.attr('data-type')) > -1)
			{
				me.prevAll('div.collapsed:first').append(me);
				// lastly we move the me element into collapsed, so we can hide it

				_this.generateCollapsedHeading(tab, me.parent().prevAll('div.collapsed-head:first').find('span.event'), me.attr('data-type'), me);
				// firstly we start populating the head based on what we've just moved
			}
		};
		
		if (_this.collapseableTypes.indexOf(prev.attr('data-type')) == -1 && _this.collapseableTypes.indexOf(me.attr('data-type')) > -1)
		{
			if (_this.collapseableTypes.indexOf(next.attr('data-type')) == -1)
				return;

			el = $.tmpl('collapsedHeadingRow', {
				message: '',
				time_f1: $.generateTime(time, false),
				time_f2: $.generateTimestamp(time),
				date: time
			});
			
			el.find('.column2').width(tab.$msgs.width() - 120);
			// compile an object so we can render a template with $.tmpl()
			// also resize our new .$el object so it fits

			$.when(el.insertBefore(me)).done(callback.bind(el));
		}
		// add the collapsed-head which in turn will just be a normal row
		// and the collapsed div for all the collapsed joins/parts/mode changes etc.
		else
		{
			callback();
		}
	},

	insertDateDividers: function(tab)
	{
		var _this = this;

		tab.$msgs.find('div.mcontainer div.row[data-type=date-divider]').remove();
		tab.$msgs.find('div.mcontainer div.row').each(function()
		{
			var me = $(this),
				prev = me.prev(),
				time = new Date(me.attr('data-time')),
				markup = $.dateTimeBar(tab, time, true);
			// determine if we have date markup

			if (markup != null)
			{
				if (prev.attr('data-type') == 'collapse' && prev.children().length == 1)
				{
					prev.prev().remove();
					prev.children().unwrap();
				}
				// remove any previous elements broken up by the datebar

				$.when(markup.insertBefore(me)).done(_this.reOrganiseChannelEvents(tab, time, me));
			}
			else
			{
				_this.reOrganiseChannelEvents(tab, time, me);
			}

			if (prev.attr('data-type') == 'window-notice' && me.attr('data-type') == 'window-notice')
			{
				var html = me.find('div.divider p')[0].outerHTML,
					pHtml = prev.find('div.divider p')[0].outerHTML;
					prev.find('div.divider').empty().html(html + pHtml);

				prev.attr('data-id', this._id);
				me.empty().remove();
			}

			if (client.settings.timestamp_format == 0)
				me.find('span.time').text(me.find('span.time').attr('data-format-1'));
			else
				me.find('span.time').text(me.find('span.time').attr('data-format-2'));
		});
	}
};var IRCParser = {

	// Parser. Loosely based on IRCCloud's implementation
	// Fairly modified

	initialised: false,

	initialise: function()
	{
		var c = 0,
			v, open;
		
		for (var k in this.tags)
		{
			c++;
			this.token_const['OPEN_' + k] = c;
			
			v = this.tags[k];
			open = '<wbr><' + v[0];
			
			if (v[1])
				open += ' class="' + v[1] + '"';
			
			open += '>';
			this.token_tags[c] = open;
			
			c++;
			this.token_const['CLOSE_' + k] = c;
			this.token_tags[c] = '</' + v[0] + '>';
		}
		c++;

		this.token_const['CLOSE_COLOR'] = c;
		this.token_tags[c] = '</span>';

		this.initialised = true;
	},
	// this function sets up our token_const and token_tags
	// variables, this allows us to determine what to do with
	// our colour objects etc.
	// 
	// we only call this once, it will get too expensive to call
	// it every time we call exec(), if it hasn't been called when
	// we try to exec() that will return the original string unparsed.

	tokens: {
		'\u0002': 'BOLD',
		'\u0011': 'MONOSPACE',
		'\u0012': 'INVERSE',
		'\u0016': 'ITALIC',
		'\u001d': 'ITALIC',
		'\u001f': 'UNDERLINE'
	},

	color: '\u0003',
	rgb: '\u0004',
	clear: '\u000f',
	// mIRC formatting codes, such as colour, clear etc

	color_map: {
		'00': 'white',
		'0': 'white',
		'01': 'black',
		'1': 'black',
		'02': 'navy',
		'2': 'navy',
		'03': 'green',
		'3': 'green',
		'04': 'red',
		'4': 'red',
		'05': 'maroon',
		'5': 'maroon',
		'06': 'purple',
		'6': 'purple',
		'07': 'orange',
		'7': 'orange',
		'08': 'yellow',
		'8': 'yellow',
		'09': 'lime',
		'9': 'lime',
		'10': 'teal',
		'11': 'cyan',
		'12': 'blue',
		'13': 'magenta',
		'14': 'grey',
		'15': 'silver'
	},
	// colour map
	// maps to our css classes

	tags: {
		BOLD: ['b'],
		MONOSPACE: ['tt'],
		INVERSE: ['span', 'inverse'],
		ITALIC: ['i'],
		UNDERLINE: ['u']
	},
	// these are the tags we use for formatting
	
	token_tags: {},
	token_const: {},
	// token objects

	lastIndexOf: function(value, array)
	{
		if (array.lastIndexOf)
			return array.lastIndexOf(value);
		if (!array.length)
			return -1;

		for (var i = array.length - 1; i >= 0; i--)
			if (array[i] === value) return i;
		
		return -1;
	},
	// helper function to check if a value is
	// the last index of an array

	tokenize: function(text)
	{
		var list = [],
			state = [];
		
		for (var i = 0; i < text.length; i++)
			this.parseToken(text[i], list, state);

		this.clearState(list, state);
		// clear all state

		return list;
	},
	// tokenize a string into tokens

	parseColor: function(chr, colorObj, list, state)
	{
		// <code><color> - change foreground color
		// <code><color>,<color> - change foreground and background color
		// <code><color>, - change foreground, restore default background
		// <code>,<color> - change background, restore default foreground
		// <code>, - restore default foreground and background
		// <code><text> - restore default foreground and background
		
		if (chr === ',' && !colorObj.bg)
		{
			colorObj.bg = true;
			// comma, indicates a background
		}
		else if (!isNaN(parseInt(chr, 10)) || (colorObj.rgb && chr.match(/[a-f]/)))
		{
			if (colorObj.bg === true)
			{
				colorObj.bg = chr;
				// background indicated, start it
			}
			else if (colorObj.bg)
			{
				if (colorObj.rgb && colorObj.bg.length === 6)
					this.endColorParse(chr, list, state);
				else
					colorObj.bg += chr;
			}
			else if (colorObj.fg)
			{
				if (colorObj.rgb && colorObj.fg.length === 6)
					this.endColorParse(chr, list, state);
				else
					colorObj.fg += chr;
			}
			else
			{
				colorObj.fg = chr;
				// start foreground
			}
			// color code, store it appropriately
		}
		else
		{			
			if (colorObj.bg === true)
				delete colorObj.bg;
			// background indicated but never specified, clear it
			
			if (this.isEmptyColor(colorObj))
			{
				this.clearEmptyColor(list, state);
				list.push(chr);
				// color obj is empty, must have been a closer. Character starts a new string
			}
			else
			{
				this.endColorParse(chr, list, state);
				// color obj has value, end the parser and start a new string
			}
			// invalid color code character
		}
	},
	// parses a colour string mIRC style. You can see a brief documentation
	// at the top of the function on how it works

	parseToken: function(chr, list, state)
	{
		var token = this.tokens[chr];
		
		if (chr == this.clear)
		{
			this.clearState(list, state);
		}
		else if (chr == this.color)
		{
			this.clearEmptyColor(list, state);
			list.push({});
		}
		else if (chr == this.rgb)
		{
			this.clearEmptyColor(list, state);
			list.push({rgb: true});
		}
		else if (token)
		{
			this.clearEmptyColor(list, state);
			this.pushToken(token, list, state);
		}
		else
		{
			if (list.length)
			{
				var prevIdx = list.length-1;
				
				if (typeof list[prevIdx] == 'string')
					list[prevIdx] += chr;
				else if (typeof list[prevIdx] == 'object')
					this.parseColor(chr, list[prevIdx], list, state);
				else
					list.push(chr);
			}
			else
			{
				list.push(chr);
			}
		}
	},
	// parses the non-formatted string into tokens, for example
	// looks for colours, bold, underline, etc.
	// nothing to do with the likes of links etc

	pushToken: function(token, list, state)
	{
		var lastStateIndex = this.lastIndexOf(token, state);
		
		if (lastStateIndex !== -1)
		{
			state.splice(lastStateIndex, 1);
			list.push(this.token_const['CLOSE_' + token]);
			// character is a close, push the code onto the list and remove state token
		}
		else
		{
			state.push(token);
			list.push(this.token_const['OPEN_' + token]);
			// character is an open tag, push the code onto the list and add a state token
		}
	},
	// push a new token to the list, altering the state
	// and existing token list

	clearState: function(list, state)
	{
		this.clearEmptyColor(list, state);
		while (state.length)
		{
			var token = state.pop();
			list.push(this.token_const['CLOSE_' + token]);
		}
	},
	// clears all current state, equivalent to \u000f
	// which clears all formatting, closing all tags

	endColorParse: function(chr, list, state)
	{
		state.push('COLOR');
		list.push(chr);
	},
	// finished parsing colour, this is usually found when
	// a colour tag exists but no colour, such as \u0003

	closeColor: function(list, state)
	{
		for (var i = state.length - 1; i >= 0; i--)
		{
			if (state[i] === 'COLOR')
			{
				state.splice(i, 1);
				list.push(this.token_const.CLOSE_COLOR);
			}
		}
	},
	// a function to close any open colour tags

	clearEmptyColor: function(list, state)
	{
		if (list.length && this.isEmptyColor(list[list.length - 1]))
		{
			list.pop();
			this.closeColor(list, state);
			// empty color object, remove it and update state and token list
		}
	},
	// a function to clear the current colour state

	isEmptyColor: function(obj)
	{
		return (typeof obj == 'object' && !obj.fg && !obj.bg);
	},
	// helper function to determine if the colour object is emtpty

	escapeHtml: function(text)
	{
		return text
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
	},
	// escape html function,
	// basically escapehtmlchars in PHP

	renderTokenHtml: function(token)
	{
		if (typeof token == 'string')
			return this.escapeHtml(token);
		else if (typeof token == 'number')
			return this.token_tags[token];
		else if (typeof token == 'object')
			return this.renderColorHtml(token);
		else
			return '';
		// format strings, numbers and objects. As the token could be either
	},
	// renders a token into html based on what it is
	// if its a number we return the tag related to it
	// if its an object it needs to be formatted for colour
	// and a string just needs escaped

	renderColorHtml: function(colorToken)
	{
		var classNames = [],
			styles = [];

		if (colorToken.fg)
		{
			if (colorToken.rgb)
				styles.push('color:#' + colorToken.fg);
			else if (this.color_map[colorToken.fg])
				classNames.push(this.color_map[colorToken.fg]);
		}
		
		if (colorToken.bg)
		{
			if (colorToken.rgb)
				styles.push('background-color:#' + colorToken.bg);
			else if (this.color_map[colorToken.bg])
				classNames.push('bg-' + this.color_map[colorToken.bg]);
		}

		var classAttr = '',
			styleAttr = '';
		
		if (classNames.length)
			classAttr = ' class="' + classNames.join(' ') + '"';
		if (styles.length)
			styleAttr = ' style="' + styles.join(';') + '"';

		return '<wbr><span' + classAttr + styleAttr + '>';
	},
	// a function to render colour objects into html
	// based on the tokens we've got

	cleanup: function(tokens)
	{
		for (var i = tokens.length - 1; i >= 0; i--)
		{
			var token = tokens[i];
			
			if (typeof token == 'number')
				continue;
			
			if (typeof token == 'string')
				break;
			
			if (typeof token == 'object')
				delete tokens[i];
		}
		// check if any opening objects are on the end

		return tokens;
	},
	// cleanup function, here we check if any objects need
	// closed or anything else needs sorted out prior to the next step

	parseLinks: function(text, network)
	{
		var regex = /(\()((?:ht|f)tps?:\/\/[a-z0-9\-._~!$&'()*+,;=:\/?#[\]@%]+)(\))|(\[)((?:ht|f)tps?:\/\/[a-z0-9\-._~!$&'()*+,;=:\/?#[\]@%]+)(\])|(\{)((?:ht|f)tps?:\/\/[a-z0-9\-._~!$&'()*+,;=:\/?#[\]@%]+)(\})|(<|&(?:lt|#60|#x3c);)((?:ht|f)tps?:\/\/[a-z0-9\-._~!$&'()*+,;=:\/?#[\]@%]+)(>|&(?:gt|#62|#x3e);)|((?:^|[^=\s'"\]])\s*['"]?|[^=\s]\s+)(\b(?:ht|f)tps?:\/\/[a-z0-9\-._~!$'()*+,;=:\/?#[\]@%]+(?:(?!&(?:gt|#0*62|#x0*3e);|&(?:amp|apos|quot|#0*3[49]|#x0*2[27]);[.!&',:?;]?(?:[^a-z0-9\-._~!$&'()*+,;=:\/?#[\]@%]|$))&[a-z0-9\-._~!$'()*+,;=:\/?#[\]@%]*)*[a-z0-9\-_~$()*+=\/#[\]@%])/img,
			text = text.replace(regex, '$1$4$7$10$13<a href="$2$5$8$11$14" target="_blank">$2$5$8$11$14</a>$3$6$9$12');
		// parse http links and www. urls (http://jmrware.com/articles/2010/linkifyurl/linkify.html)

		text = text.replace(/(^|[ ]+)(#\S+)/ig, function(input, match, match2) {
			return (match == ' ') ? ' <a href="/#!/' + network.url + '/' + Helper.encodeChannel(match2) + '" rel="channel-link">' + match2 + '</a>' : '<a href="#!/' + network.url + '/' + Helper.encodeChannel(match2) + '" rel="channel-link">' + match2 + '</a>';
		});
		// parse channel into link

		return text;
	},
	// this function should be called on an already formatted
	// text string from calling renderTokenHtml..

	exec: function(text, network)
	{
		if (!this.initialised || text == '')
			return text;
		else if (text == undefined)
			return '';

		var tokens = this.tokenize(text),
			output = '';

		tokens = this.cleanup(tokens);
		// cleanup

		for (var i = 0; i < tokens.length; i++)
			output += this.renderTokenHtml(tokens[i]);
		// output has been rendered and formatted

		output = this.parseLinks(output, network);
		// one thing that hasn't been formatted at all are urls
		// we do that here

		return output;
	}
	// exec, this is the base for all the parsing
	// colour parsing and then urls and other stuff
};SocketEngine = Backbone.Model.extend({

	socket: null,
	endpoint: null,
	account: '',
	session_id: '',
	settings: {},
	forceDisconnect: false,
	disconnectReason: '',

	initialize: function(options)
	{
		this.listBuffer = {};
	},

	connect: function(data, connect)
	{
		var connect = connect || true;

		if (data != null)
		{
			this.endpoint = data.endpoint;
			this.account = data.username;
			this.session_id = data.session_id;
			this.settings = data.settings;

			if (data.settings !== undefined && typeof data.settings == 'object')
			{
				data.settings.timestamp_format = data.settings.timestamp_format || 0;
				
				$('div.mcontainer div.row').each(function()
				{
					var me = $(this),
						type = (data.settings.timestamp_format == 0) ? me.find('span.time').attr('data-format-1') : me.find('span.time').attr('data-format-2');

					me.find('span.time').text(type);
				});
			}
			// check some settings data
		}
		// set our variables

		if (connect && !connected)
		{
			if (this.endpoint == null)
				this.onClose();
			// node is offline

			this.socket = io.connect(this.endpoint, {
				'reconnect': false,
				'auto connect': true,
				'force new connection': true
			});
			// open the socket

			this.socket.on('connect', this.onOpen.bind(this));
			this.socket.on('data', this.onData.bind(this));
			this.socket.on('userlist', this.onUserList);
			this.socket.on('userinfo', this.onUserInfo);
			this.socket.on('networks', this.onNetworks);
			this.socket.on('channelUpdate', this.onChannelUpdate);
			this.socket.on('error', this.onError);
			this.socket.on('disconnect', this.onClose);
			this.socket.on('reconnect_failed', this.onReconnectFailed);
			this.socket.on('changeTab', this.onChangeTab);
			this.socket.on('updateNetwork', this.onUpdateNetwork);
			this.socket.on('addNetwork', this.onAddNetwork);
			this.socket.on('networkStatus', this.onNetworkStatus);
			this.socket.on('backlog', this.onBackLog.bind(this));
			this.socket.on('chanlistStart', this.onChanListStart.bind(this));
			this.socket.on('chanlist', this.onChanList.bind(this));
			this.socket.on('whois', this.onWhois.bind(this));
			// attach the event handlers
		}
		// connect to the node
	},

	onOpen: function()
	{
		$('div#login-box').empty().remove();
		$('div#sidebar').height($(document).height() - ($('div.sidebar div.header').outerHeight() + $('div.sidebar div#footer').outerHeight())).empty().html('<div class="content overthrow"><div id="network" class="network"></div></div>');
		$('div#channel-window-data, div#userlist').empty();
		$('label#nick-button').empty();
		$('div#not-connected, ul#home-menu, div#home-content').hide();
		$('div#sidebar-header, ul#options-menu, div#add-network').show();
		// clear any previous data

		client.socket.emit('login', {account: this.account, session_id: this.session_id, user_agent: navigator.userAgent});
		connected = true;
		// login
	},

	onData: function(data, options)
	{
		this.data(data, {
			modify: true,
			prepend: false,
			divider: false
		});
	},

	data: function(data, options)
	{
		data.command = data.command.toUpperCase();
		data.network = data.network;
		data.prepend = options.prepend || false;
		data.last = options.last || false;

		switch (data.command)
		{
			case 'PRIVMSG':
				parser.message(data);
				break;
			case 'NOTICE':
				parser.notice(data);
				break;
			case 'JOIN':
				eventHandler.join(data, options.modify);
				break;
			case 'PART':
				eventHandler.part(data, options.modify);
				break;
			case 'QUIT':
				eventHandler.quit(data, options.modify);
				break;
			case 'NICK':
				eventHandler.nick(data, options.modify);
				break;
			case 'MODE':
				eventHandler.mode(data);
				break;
			case 'KICK':
				eventHandler.kick(data, options.modify);
				break;
			case 'AWAY':
				eventHandler.away(data);
				break;
			case 'RPL_TOPIC':
				eventHandler.topic(data, options.modify);
				break;
			case 'RPL_CHANNELMODEIS':
				eventHandler.mode(data);
				break;
			case 'RPL_LINKS':
				eventHandler.links(data);
				break;
			case 'RPL_ENDOFLINKS':
				eventHandler.linksEnd(data);
				break;
			case '333':
				eventHandler.topic(data, options.modify);
				break;
			case 'TOPIC':
				eventHandler.topic(data, options.modify);
				break;
			case 'RPL_MOTDSTART':
				eventHandler.motdStart(data);
				break;
			case 'RPL_MOTD':
				eventHandler.motd(data);
				break;
			case 'RPL_ENDOFMOTD':
				eventHandler.motdEnd(data);
				break;
			case '005':
				eventHandler.numeric(data);
				break;
			case 'INVITE':
				eventHandler.invite(data);
				break;
			case 'RPL_INVITING':
				eventHandler.invited(data);
				break;
			case '328':
				parser.other(mem[data.network + '-chan-' + data.args[1].toLowerCase().substr(1)], '', IRCParser.exec(data.args[2], userInfo.networks[data.network]), 'event', data);
				break;
			case 'RPL_NAMREPLY':
				//parser.other(mem[data.network + '-chan-' + data.args[2].substr(1).toLowerCase()], data.args[2].substr(1), 'Users on ' + data.args[2].substr(1) + ': ' + data.args.slice(3).join(' '), 'event', data);
				break;
			// --- ignore
			case 'PING':
				break;
			case 'PONG':
				break;
			case 'RPL_ENDOFWHO':
				break;
			case 'RPL_NOTOPIC':
				break;
			case 'RPL_ENDOFNAMES':
				break;
			case 'ERR_NOTONCHANNEL':
				break;
			case 'CAP':
				break;
			case 'AUTHENTICATE':
				break;
			case '329':
				break;
			// --- ignore
			// --- custom commands / errors
			case 'ERROR':
				eventHandler.error(data);
				break;
			case 'ERR_NICKNAMEINUSE':
				actions.nickNameInUse(data.network, mem[data.network + '-window'], data);
				break;
			case 'DISCONNECT_BANNER':
				actions.windowConnectState(data.network, mem[data.network + '-window'], 'disconnected', true, data);
				break;
			case 'CONNECT_BANNER':
				actions.windowConnectState(data.network, mem[data.network + '-window'], 'connected', true, data);
				break;
			case 'CONNECTING_BANNER':
				actions.windowConnectState(data.network, mem[data.network + '-window'], 'connecting', true, data);
				break;
			// --- custom commands / errors
			default:
				parser.other(mem[data.network + '-window'], '', data.args.slice(1).join(' '), 'event', data);
				break;
		}
		// parse IRCDATA
	},

	onError: function(data, fn)
	{
		if (data.error_type == 'WS_CLOSE')
		{
			this.forceDisconnect = true;
			this.disconnectReason = data.error;
			fn('recieved');
		}
		// websocket has been forcefully closed from the backend
		else if (data.error_type == 'ADD' || data.error_type == 'UPDATE')
		{
			//$('div#edit-warning').hide();
			$('div#connect-error').empty().html('<ul></ul>').show();
			for (var msg in data.error)
				$('div#connect-error ul').append('<li>' + data.error[msg] + '</li>');
		}
		// add / update network form errors
		else if (data.error_type == 'CONNECT' || data.error_type == 'DISCONNECT')
		{
			parser.windowNotice(mem[data.network + '-window'], data.error, false);
		}
		// connect / disconnect event errors
		else if (data.error_type == 'GETCHANLIST')
		{
			eventHandler.listError(data.network, data.error);
		}
		// channel list cant be retrieved, usually too big.

		console.log(data);
	},

	onUserList: function(data)
	{
		eventHandler.who(data.network, data.chan.toLowerCase(), data.list);
	},

	onUserInfo: function(data)
	{
		userInfoParser.incoming(data);
	},

	onNetworks: function(data)
	{
		userInfoParser.networks(data);
	},

	onChannelUpdate: function(data)
	{
		var tabId = mem[data.network + '-chan-' + data.chan.substr(1).toLowerCase()],
			tab = tabCollections.getByCid(tabId);

		eventHandler.handleTopic(tab, data);
		eventHandler.handleMode(tab, data);
		eventHandler.handleUsers(tab, data);
		// handle all these commands individually for ease
	},

	onAddNetwork: function(data)
	{
		if (data.success)
		{
			window.location.hash = '#!/';
			userInfoParser.addNetwork(data.netName, data.network, true, function ()
			{
				var tabId = mem[data.netName + '-window'];
				
				actions.selectTab(tabId);
				actions.windowConnectState(data.netName, tabId, 'disconnected', true, false);
			});
		}
	},

	onChangeTab: function(data)
	{
		var tabId = mem[data.tab];

		if (tabId != undefined)
			actions.selectTab(tabId);
	},

	onUpdateNetwork: function(data)
	{
		window.location.hash = '#!/';
		userInfoParser.addNetwork(data.netName, data.network, false, function()
		{
			var tabId = mem[data.netName + '-window'];
			actions.selectTab(tabId);
			actions.windowConnectState(data.netName, tabId, 'disconnected', true, false);
			parser.windowNotice(tabId, 'Your settings for ' + userInfo.networks[network].name + ' have been updated.', false);
		});
	},

	onNetworkStatus: function(data)
	{
		var tab = tabCollections.getByCid(mem[data.network + '-window']);
			tab.set({finishedPlayback: true, prependHTML: ''});

		userInfo.networks[data.network].status = data.status;
		// change the status here
		
		actions.windowConnectState(data.network, tab.cid, data.status, true, false);
		// handle the status change here
	},

	finishPlayback: function(data, tab, topEventId)
	{
		if (data == undefined || tab == undefined) return;

		var lastTime = tab.get('lastTimeP'),
			markup = $.dateTimeBar(tab, lastTime, true, true);

		tab.set({toUnreadId: data.firstUnread, scrollLock: false});
		// tab settings

		var lastElement = tab.$msgs.find('div.mcontainer div.row[data-id=' + topEventId + ']'),
			scrollPosition = (lastElement[0] != undefined) ? lastElement[0].offsetTop : 0,
			status = userInfo.networks[data.network].status;
		// get the scroll position
		
		tab.defaultMessageBar(data.unreadMessages, data.highlightCount);
		tab.scrollHandler();
		// setup message bar

		tab.get('view').cleanup(true, true, scrollPosition);
		// cleanup the interface and scroll

		if (tab.get('type') == 'window')
			actions.windowConnectState(data.network, mem[data.network + '-window'], status, true, false);
		// perform some actions now
	},
	
	onBackLog: function(data)
	{
		if (data.url == undefined)
			return;

		$.get(this.endpoint + data.url, function(data)
		{
			var queryUsers = (data.status) ? data.unreadPrivmsgs : [],
				playBackCheck = null,
				topDivId = '0';

			if (data.status && queryUsers.length > 0)
			{
				for (var user in queryUsers)
				{
					var tId = mem[data.network + '-query-' + queryUsers[user].toLowerCase()];
					// get tab id and stuff

					if (tabCollections.getByCid(tId) == undefined)
						tId = actions.createWindow(data.network, queryUsers[user], 'query');
					// if the tab is undefined create the window, this will request the logs
				}
				// loop through the users we have messages from
			}
			// we need to figure out what to do with our queryUsers array

			if (!data.status)
			{
				var delimiter = (Helper.isChannel(userInfo.networks[data.network], data.target)) ? 'chan' : 'query',
					target = (delimiter == 'chan') ? data.target.toLowerCase().substr(1) : data.target.toLowerCase(),
					tabId = mem[data.network + '-' + delimiter + '-' + target],
					tab = tabCollections.getByCid(tabId);
			}
			else
			{
				var tabId = mem[data.network + '-window'],
					tab = tabCollections.getByCid(tabId);	
				
				if (data.topId == null)
					data.messages.reverse();
			}

			if (data.messages.length == 0)
			{
				tab.set({playbackData: {data: data, topDivId: null}});
				tab.set({finishedPlayback: true, prependHTML: ''});
			}
			else
			{
				tab.set({finishedPlayback: false, prependHTML: ''});
			}

			for (var i = 0, l = data.messages.length; i < l; i++)
			{
				this.data(data.messages[i], {
					modify: false,
					prepend: true,
					last: ((data.messages.length - 1) == i) ? true : false
				});
				// handle the command

				if (i == 0 || (data.messages.length - 1) == i)
				{
					if (i == 0)
					{
						topDivId = tab.get('topEventId');
						if (i != (data.messages.length - 1))
							continue;
					}

					setTimeout(function() {
						tab.set({playbackData: {data: data, topDivId: topDivId}});
						tab.set({finishedPlayback: true, prependHTML: ''});
					}, 200);
				}
			}
			// execute this first

		}.bind(this), 'json');
	},

	onChanListStart: function(data)
	{
		this.listBuffer[data.network] = [];
		eventHandler.listStart(data.network);
		// start building the list
	},
	// this function is an indicator to tell the frontend that the backend
	// has started to retrieve lists. Reason for this is because when the list gets
	// large ish ~ 1000 or so channels there is a slight wait.

	onChanList: function(data)
	{
		var odata = data;
		if (odata.url == undefined)
			return;

		$.get(this.endpoint + odata.url, function(data)
		{
			if (this.listBuffer[data.network] == undefined || mem[data.network + '-other-list'] == undefined)
				this.onChanListStart(odata).bind(this);
			// check if the tab is still open, theoretically it should be
			// but some idiot might have closed it thinking it was taking too long.

			for (var i = 0, l = data.channels.length; i < l; i++)
				this.listBuffer[data.network].push(data.channels[i]);
			// loop through the lists

			if (this.listBuffer[data.network] != undefined)
				eventHandler.listEnd(data.network, this.listBuffer[data.network]);
			this.listBuffer[data.network].length = 0;
			// done finish building the list

		}.bind(this), 'json');
	},

	onWhois: function(data)
	{
		eventHandler.whois(data);
	},
	// handle whois data

	onClose: function(reason)
	{
		connected = false;
		countdownFrom = currentSecond = 31;
		// global variable

		if (this.forceDisconnect && reason == 'booted')
			var message = this.disconnectReason;
		else
			var message = 'IRCAnywhere is currently unable to connect at the moment, Please wait around, we will attempt to reconnect you in <span id="second-timer">' + countdownFrom + '</span> seconds.';
		// we've been forcefully disconnected. OH OHH

		function disconnect()
		{
			$('div#not-connected').empty().html('<h3>Oh-oh!</h3><p>' + message + '</p>');
			// change the error message

			$('div#sidebar').empty().height(0);
			$('div#login-box').empty().remove();
			$('div#channel-window-data, div#userlist').empty();
			$('div#home-content, div#channel-window-data, div#channel-input, div#sidebar-header, ul#options-menu, div#add-network').hide();
			$('div#not-connected').show();
			$('ul#home-menu').show();
			$('label#nick-button').empty();
			client.hideLoading();
			// lost connection? notify the user and try to reconnect soon.

			userInfo = {};
			netinfo = {};
			mem = {};
			selectedNet = null;
			selectedChan = null;
			selectedTab = null;
			tabCollections.reset();
			// reset some variables

			if (!this.forceDisconnect)
				countTimer();
			// should we attempt to reconnect?
		}

		function countTimer()
		{
			if (currentSecond != 0)
			{
				currentSecond--;
				$('span#second-timer').text(currentSecond);
			}
			else
			{
				countdownFrom = 31,
				currentSecond = countdownFrom;

				client.showLoading();
				setTimeout(executeInitJSON(), 1000);
				return;
			}

			setTimeout(countTimer, 1000);
			// change the second timer
		}

		setTimeout(disconnect.bind(this), 500);
	},

	onReconnectFailed: function()
	{
		client.showLoading();
		executeInitJSON();
		// attempt to start from the top again these changes scrap our own reconnect method and
		// use socket.io's it seems to be a bit more reliable and hopefully will fix the hanging
		// on nodejitsu, also fixes the hanging when the node is offline
	},

	onLoggedOut: function()
	{
		if (window.location.hash == '' || window.location.hash == '#' || window.location.hash == '#?/')
			window.location.hash = '#?/home';

		$('div#sidebar, div#channel-window-data, div#userlist').empty();
		$('div#channel-input, div#sidebar-header, ul#options-menu, div#add-network').hide();
		$('ul#home-menu, div#login-box, div#home-content').show();

		try {
			Backbone.history.start();
		} catch(e) {}
		// probably not started but we'll try anyway
	},

	showLoading: function()
	{
		$('div#loading').show();
		$('div#channel-input, div#channel-window-data, div#home-content, div#no-networks, div#not-connected').hide();
		return this;
	},
	// show loading page

	hideLoading: function()
	{
		$('div#loading').hide();
		return this;
	},
	// hide loading page

	showNoNetworks: function()
	{
		$('div#no-networks').show();
		$('div#channel-input, div#channel-window-data').hide();
		return this;
	},

	hideNoNetworks: function()
	{
		$('div#no-networks').hide();
		$('div#channel-input, div#channel-window-data').show();
		return this;
	}
});

var client = new SocketEngine();var Workspace = Backbone.Router.extend({

	routes: {
		'!/:network/*chan': 'chan',
		'!/:network': 'network',

		'?/add-network': 'addNetwork',
		'?/settings': 'settings',
		'?/edit-network/:network': 'editNetwork'
	},

	updateHash: function(hash)
	{
		if (previousHashes.length == 0 || hash != previousHashes[previousHashes.length - 1])
            previousHashes.push(hash);
        if (previousHashes.length > 10)
            previousHashes.shift();
        // update previousHashes
	},

	loadStatic: function(page, background, execute)
	{
		execute = execute || null;
		if (tabCollections.getByCid(selectedTab) != undefined)
			tabCollections.getByCid(selectedTab).get('view').hide();
		// hide current tab

		//if (userInfo.is_connected && (userInfo.networks.length == 0 || userInfo.networks == undefined))
		//	return;
		// TODO - Revise

		client.showLoading();
		$.get(page, function(data)
		{
			if (background)
				$('div#home-content').addClass('home-background').show();
			else
				$('div#home-content').removeClass('home-background').show();

			$('div#channel-window-data').hide();
			client.hideLoading();

			$('div#home-content div.content').html(data);

			if (execute != null)
				execute();
		});
		// load the desired page
	},

	addNetwork: function()
	{
		if (client.socket == null)
		{
			$('div#channel-input, div#home-content, div#no-networks').hide();
			$('div#not-connected').show();
		}
		else
		{
			this.loadStatic('/network', true, function()
			{
				$('div#footer div.link').addClass('selected');
				tabCollections.changeTopicBar('Add Network', '', '', '');
				
				//$('div#home-content div#edit-warning').html('<p>You are on a free plan and have one network left to join. Please consider upgrading for raised limits.</p>').show();
				$('div#home-content div#edit-warning').remove();
				$('div#home-content input#server-nickname').val(userInfo.nickname);
				$('div#home-content input#server-realname').val(userInfo.realname);
			});
			// show the add network form :3
		}
	},

	settings: function()
	{
		tabCollections.changeTopicBar('Settings', '', '', '');
		this.loadStatic('/settings', true);
	},

	editNetwork: function(network)
	{
		if (client.socket == null) return $('div#not-connected').show();

		var network = $.findNetworkFromId(network),
			networkData = userInfo.networks[network];
			editNet = network;

		if (networkData == undefined) return;
		// doesn't exit, let's bail.

		this.loadStatic('/network', true, function()
		{
			tabCollections.changeTopicBar('Edit Network', networkData.name, '', '');

			$('form#network-form').attr('data-content', 'edit-network');
			$('div#home-content input[type=submit]').show().val('Update');
			$('div#home-content h3').text('Edit ' + networkData.name);
			$('div#home-content form#network-form').reset();
			$('div#home-content input#submit-type').val('edit-network');
			$('div#home-content div#edit-warning').html('<p>You will be reconnected upon updating connection information.</p>').show();
			// clear the network form and update modal info

			if (networkData.secure)
				$('div#home-content input#server-secure').attr('checked', 'checked').parents('.add-on').addClass('active');
			
			$('div#home-content input#server-hostname').val(networkData.host);
			$('div#home-content input#server-port').val(networkData.port);
			$('div#home-content input#server-nickname').val(networkData.nick);
			$('div#home-content input#server-password').val(networkData.password);
			$('div#home-content input#server-realname').val(networkData.real);
			$('div#home-content textarea#autojoin-chans').val(networkData.autojoin_chans);
			$('div#home-content textarea#connect-commands').val(networkData.connect_commands);
			// populate form fields

			$('div#home-content div#connect-error').addClass('hide');
			// we use the same form for add/edit network but just alter it slightly

			if (!userInfo.account_type.canRemove && networkData.locked)
			{
				$('div#home-content div#edit-warning').hide();
				$('div#home-content div#connect-error').empty().html('<p>You are on a free account and this network is locked which means you cannot edit it\'s connection settings.</p>').show();
				$('div#home-content input#server-hostname').attr('disabled', 'disabled');
			}
		});
		// show the network form
	},

	network: function(network)
	{
		var found = false;
		
		tabCollections.each(function(tab)
		{
			var netinfoN = userInfo.networks[tab.get('network')];
				exists = (netinfoN == undefined || netinfoN.url != network) ? false : true;

			if (exists)
			{
				var tabId = mem[tab.get('network') + '-window'];
				actions.selectTab(tabId);
				this.updateHash(tabId);
				found = true;
				return false;
			}
			// find the network
		}.bind(this));
		// traverse our tabs

		if (!found)
		{
			if (tabCollections.length > 0)
			{
				var tab = tabCollections.at(0);
				actions.selectTab(tab.get('id'));
				this.updateHash(tab.get('id'));
			}
			// if we have tabs then boom, show the first one
			else if (connected)
				client.showNetworks().hideLoading();
			// otherwise show the no networks page
		}
		// if we havent found a matching tab
	},

	chan: function(network, chan)
	{
		var netExists = null,
			found = false;

		tabCollections.each(function(tab)
		{
			var netinfoN = userInfo.networks[tab.get('network')];
				exists = (netinfoN == undefined || netinfoN.url != network) ? false : true,
				chan = Helper.decodeChannel(chan).replace('@', '/');

			if (exists)
				netExists = tab.get('network');

			if (exists && (tab.get('name') == chan.toLowerCase()))
			{
				var delim = (Helper.isChannel(netinfoN, tab.get('name'))) ? '-chan-' + tab.get('name').substr(1) : '-query-' + tab.get('name'),
					delim = (tab.get('name').substr(0, 1) == '/') ? '-other-' + tab.get('name').substr(1) : delim,
					tabId = mem[tab.get('network') + delim];

				actions.selectTab(tabId);
				this.updateHash(tabId);
				found = true;
				return false;
			}
			// find the network

		}.bind(this));
		// traverse our tabs

		if (netExists == null)
		{
			if (tabCollections.length > 0)
			{
				var tab = tabCollections.at(0);
				actions.selectTab(tab.get('id'));
				this.updateHash(tab.get('id'));
			}
			// if we have tabs then boom, show the first one
			else if (connected)
				client.showNoNetworks().hideLoading();
			// otherwise show the no networks page
		}

		if (netExists != null && !found)
		{
			if (Helper.isChannel(userInfo.networks[netExists], chan))
			{
				client.socket.emit('data', {network: netExists, command: 'JOIN ' + Helper.decodeChannel(chan)});
			}
			else
			{
				var newTab = actions.createWindow(netExists, chan, 'query');
				actions.selectTab(newTab);
			}
		}
		// if we haven't found a matching tab
	}
});

var appRouter = new Workspace;var InputView = Backbone.View.extend({

	tagName: 'input',
	id: 'chat',
	
	attributes: {
		name: 'chat',
		type: 'text',
		tabindex: '1'
	},

	setValue: function(value)
	{
		this.$el.val(value);
	},

	getValue: function()
	{
		return this.$el.val();
	},

	events: {
		'keydown': 'onKeyDown'
	},

	onKeyDown: function(e)
	{
		var keyCode = e.keyCode || e.which,
			key = { enter: 13, up: 38, down: 40, tab: 9 },
			tab = tabCollections.getByCid(selectedTab);

		if (userInfo.networks == undefined || selectedNet == null || tab == undefined || tab.get('disabled'))
			return;

		if (keyCode == key.enter && loggedIn)
		{
			var value = this.getValue(),
				buffer = tab.get('buffer');
			
			buffer.unshift(value);
			tab.set({buffer: buffer});
			// add the line to the buffer

			this.send(tab, value);
			this.setValue('');
			// send the item and reset the chat box

			e.preventDefault();
		}
		else if (keyCode == key.tab)
		{
			var users = tab.get('ulCollection').models,
				newId = tab.get('newId'),
				newInputs = tab.get('newInputs'),
				input = this.getValue(),
				currentInputs = input.split(' '),
				currentInput = currentInputs.pop().replace(client.settings.autocompletion, '').trim();

			if (input.trim() == '')
				return;
			// empty string

			if (newId == 0)
				tab.set({defaultInput: input});

			if (newInputs.length == 0)
			{
				var newInputs = [];
				for (var i = 1; i < users.length; i++)
				{
					var user = users[i].user,
						regex = new RegExp('^' + $.escape(currentInput) + '(.*)', 'i');

					if (user.match(regex))
						newInputs.push(users[i].user);
				}

				tab.set({newInputs: newInputs});
			}	
			// loop through the users checking them for matches

			if (newId < newInputs.length)
			{
				var defaultInputs = tab.get('defaultInput').split(' ');
					newId = (newId < 0 || newId > newInputs.length) ? 0 : newId + 1;
				tab.set({newId: newId});

				if (defaultInputs.length == 1)
				{
					this.setValue(newInputs[newId - 1] + client.settings.autocompletion + ' ');
				}
				else
				{
					defaultInputs.pop();
					// knock the last element off

					var firstPart = (defaultInputs.length > 0) ? defaultInputs.join(' ') + ' ' : '',
						secondPart = client.settings.autocompletion + ' ';
					// split the string up and pop the end off

					this.setValue(firstPart + newInputs[newId - 1] + secondPart);
				}
			}
			// loop through the current nicks for the last word
			else if (newId == newInputs.length)
			{
				newId = 0;
				tab.set({newId: newId, newInputs: []});
				
				this.setValue(tab.get('defaultInput'));
				// replace the orignal string info
			}
			// loop back round to the start

			e.preventDefault();
		}
		else if (keyCode == key.up)
		{
			var buffer = tab.get('buffer'),
				bufferIndex = tab.get('bufferIndex');
			
			if (bufferIndex < 0 || buffer[bufferIndex + 1] != undefined)
				this.setValue(buffer[++bufferIndex]);
			
			tab.set({bufferIndex: bufferIndex});
			// on key up, retrieve earlier messages

			e.preventDefault();
		}
		else if (keyCode == key.down)
		{
			var buffer = tab.get('buffer'),
				bufferIndex = tab.get('bufferIndex');

			if (bufferIndex < 0)
				this.setValue('');
			else
				this.setValue(buffer[--bufferIndex]);

			tab.set({bufferIndex: bufferIndex});
			// on key down, retrieve later messages

			e.preventDefault();
		}
	},

	/* 
	 * handleCommand
	 * 
	 * handle typed commands like (/j)
	 */
	handleCommand: function(command)
	{
		var split = command.split(' '),
			newData = split.slice(1),
			rCommand = split[0].toLowerCase();

		if (userInfo.networks[selectedNet].status == 'connected')
		{
			if (rCommand == 'msg' || rCommand == 'privmsg')
			{
				this.sendPrivMsg(newData[0], newData.slice(1).join(' '), false);
				
				return true;
			}
			else if (rCommand == 'notice')
			{
				client.socket.emit('data', {network: selectedNet, command: 'NOTICE ' + newData[0] + ' :' + newData.slice(1).join(' ')});
				
				return true;
			}
			else if (rCommand == 'me')
			{
				if (newData.join(' ') == '') return true;
				// bail if empty string

				this.sendPrivMsg(selectedChan, newData.join(' '), true, false);
				
				return true;
			}
			else if (rCommand == 'nick')
			{
				if (newData.join(' ') == '') return true;
				// bail if empty string

				client.socket.emit('data', {network: selectedNet, command: 'NICK ' + newData[0]});
				// send the command

				return true;
			}
			else if (rCommand == 'topic')
			{
				if (newData.join(' ') == '') return true;
				// bail if empty string

				client.socket.emit('data', {network: selectedNet, command: 'TOPIC ' + newData.join(' ')});
				// send the command

				return true;
			}
			else if (rCommand == 'mode')
			{
				if (newData.join(' ') == '') return true;
				// bail if empty string

				client.socket.emit('data', {network: selectedNet, command: 'MODE ' + newData.join(' ')});
				//send the command

				return true;
			}
			else if (rCommand == 'quit' || rCommand == 'disconnect')
			{
				client.socket.emit('disconnectNetwork', {network: selectedNet});
				// disconnect this way, not by using QUIT
			}
			else if (rCommand == 'query' || rCommand == 'q')
			{
				if (Helper.isChannel(userInfo.networks[selectedNet], newData[0]))
					return false;
				// make sure newData[0] isnt a channel

				var tabId = actions.createWindow(selectedNet, newData[0], 'query');
				actions.selectTab(tabId);
				// create a window
				
				return true;
			}
			else if (rCommand == 'close')
			{
				var tab = tabCollections.getByCid(selectedTab);
				if ((tab.get('type') != 'window' && tab.get('disabled')) || (tab.get('type') != 'window' && !tab.get('type') != 'chan') || (tab.get('type') != 'window' && !tab.get('disabled') && tab.get('type') != 'chan'))
					actions.destroyWindow(selectedTab, true);
				
				return true;
			}
			else if (rCommand == 'j' || rCommand == 'join')
			{
				client.socket.emit('data', {network: selectedNet, command: 'JOIN ' + newData.join(' ')});
				
				return true;
			}
			else if (rCommand == 'cycle' || rCommand == 'hop')
			{
				client.socket.emit('data', {network: selectedNet, command: 'PART ' + selectedChan});
				client.socket.emit('data', {network: selectedNet, command: 'JOIN ' + selectedChan});
				
				return true;
			}
			else if (rCommand == 'part' || rCommand == 'leave' || rCommand == 'p')
			{
				var chan = newData[0] || selectedChan;
				client.socket.emit('data', {network: selectedNet, command: 'PART ' + chan});
				
				return true;
			}
			else if (rCommand == 'invite')
			{
				if (newData.join(' ') == '') return true;
				// bail if empty string

				var nickname = newData[0],
					channel = newData[1] || selectedChan;
				client.socket.emit('data', {network: selectedNet, command: 'INVITE ' + nickname + ' ' + channel});
				
				return true;
			}
			else if (rCommand == 'kick' || rCommand == 'kickban')
			{
				if (newData.join(' ') == '') return true;
				// bail if empty string

				var tab = tabCollections.getByCid(selectedTab),
					nickname = newData[0].toLowerCase(),
					user = tab.get('ulCollection').filter(function(model) {
						if (model.get('user') != undefined)
							return model.get('user').toLowerCase() == nickname;
					});
					host = (user[0] == undefined) ? nickname : user[0].hostname;
					reason = newData.slice(1).join(' ') || '';

				if (rCommand == 'kickban')
					client.socket.emit('data', {network: selectedNet, command: 'MODE ' + ' ' + selectedChan + ' +b ' + host});
				
				client.socket.emit('data', {network: selectedNet, command: 'KICK ' + selectedChan + ' ' + nickname + ' ' + reason});
				
				return true;
			}
			else if (rCommand == 'ban' || rCommand == 'unban')
			{
				if (newData.join(' ') == '') return true;
				// bail if empty string

				var mask = newData[0],
					mode = (rCommand == 'ban') ? '+b' : '-b';
				client.socket.emit('data', {network: selectedNet, command: 'MODE ' + selectedChan + ' ' + mode + ' ' + mask});
				
				return true;
			}
			else if (rCommand == 'list')
			{
				client.socket.emit('getChanList', {network: selectedNet});
				
				return true;
			}
			else if (rCommand == 'links')
			{
				var tabId = mem[selectedNet + '-other-links'],
					tab = tabCollections.getByCid(selectedTab);

				this.setValue('');
				tab.set({storedInput: ''});
				// clear this, for some reason its sticking
				
				if (tabId == undefined)
				{
					tabId = actions.createWindow(selectedNet, '/links', 'other');
					tab = tabCollections.getByCid(tabId);
				}
				
				actions.selectTab(tabId);

				tab.$table.empty().append('<thead><tr class="heading"><th>Server / Hub</th><th>Description</th></tr></thead><tbody></tbody>');
				// if the table is empty, add a heading row

				client.socket.emit('data', {network: selectedNet, command: 'LINKS'});
				
				return true;
			}
			else if (rCommand == 'away')
			{
				var message = (newData[0] == '') ? '' : ' :' + newData.join(' ');
				client.socket.emit('data', {network: selectedNet, command: 'AWAY' + message});
				
				return true;
			}
			else if (rCommand == 'raw' || rCommand == 'quote')
			{
				if (newData.join(' ') == '') return true;

				client.socket.emit('data', {network: selectedNet, command: newData.join(' ')});
				
				return true;
			}
			// commands to evaluate when connected
		}
		else
		{
			if (rCommand == 'connect' || rCommand == 'reconnect')
			{
				client.socket.emit('connectNetwork', {network: selectedNet});
				return true;
				// reconnect
			}
			// commands to execute when disconnected
		}
		
		return false;
	},

	send: function(tab, text)
	{
		if (text != null && text.length > 0)
		{
			if (text.substr(0, 1) != '/' && (selectedChan != '' && selectedChan != undefined) || (text.substr(0, 2) == '//'))
			{
				if (tab.get('type') == 'window' || tab.get('type') == 'other')
					return;
				
				this.sendPrivMsg(selectedChan, text, false, false);
			}
			// not a command, send it straight out :3
			else if (text.substr(0, 1) == '/' && text.substr(1, 1) != '/')
			{
				if (!this.handleCommand(text.substr(1)))
					client.socket.emit('data', {network: selectedNet, command: text.substr(1)});
			}
			// seems to be a / command
		}
	},

	sendPrivMsg: function(chan, text, action)
	{
		if (text.substr(0, 2) == '//') text = text.substr(1);
		text = (!action) ? text : '\u0001ACTION ' + text + '\u0001';
		// if it's // just strip the first / off and send it :3
		
		client.socket.emit('data', {network: selectedNet, command: 'PRIVMSG ' + chan + ' :' + text});
	}
});var MainView = Backbone.View.extend({

	initialize: function()
	{
		$(window).focus(function()
		{
			if (this.isActive === false && client.connected)
				client.socket.emit('changeTab', {tab: selectedTab, active: true});
			// tell the backend we're active again

			main.$chat.focus();
			this.isActive = true;
			// mark the window is active

			var tab = tabCollections.getByCid(selectedTab);
			if (tab != null)
			{
				tab.reCalculateScrollState();
				// setup scroll handler incase theres new messages
			}
			// do some work on selectedTab
		});

		$(window).blur(function()
		{
			if (this.isActive === true && client.connected)
				client.socket.emit('changeTab', {tab: selectedTab, active: false});
			// tell the backend we're active again
			
			this.isActive = false;
		});
		// window blurs

		$('body').tooltip({
			selector: 'a[rel=twipsy]',
			placement: 'right',
			trigger: 'hover'
		});
		// rel links, which means they should always be prevented, but do something other than tabbing

		fullContentWidth = ($(window).width() - $('#sidebar').outerWidth());
		height = $(document).height();
		tabHeight = height - (inputPadding + $('.topbar').outerHeight());
		// set some widths up
		
		$('div#content-container div#content, div#inner-content').height($('div#holder').outerHeight() - $('.topbar').outerHeight() - 4);
		// resize the content

		this.currentSettingsTab = 'settings';
		// set the current settings tab

		this.chat = new InputView();
		this.$chat = this.chat.$el;
		$('div#channel-input span').html(this.$chat);
		// setup the input field
	},

	events:
	{
		'keypress': 'onKeyPress',
		'keydown': 'onKeyDown',

		'click a[rel=twipsy]': 'preventDefault',
		'mouseenter div.overlay-bar': 'chanDescEnter',
		'mouseleave div.overlay-bar': 'chanDescLeave',
		'mouseenter div.topic-wrap': 'chanDescEnter',
		'mouseleave div.topic-wrap': 'chanDescLeave',

		'click': 'userLinkDblClick',
		'click a#open-link': 'openWindowClick',
		'click a#whois-link': 'whoisUserClick',
		'click span.alert.unread': 'backlogReadClick',

		'click input.submit-modal-form': 'modalFormSubmit',
		'click input#settings-submit': 'settingsFormSubmit',

		'click .add-on input:checkbox': 'checkBoxClick',
		'click ul.setting-tabs li a': 'changeSettingsTab',

		'click a#set-topic-link': 'setTopicClick',
		'click a#hide-users-link': 'hideUsersClick',
		'click a#hide-extra-link': 'hideExtraClick',
		'click a#view-logs-link': 'viewLogsClick',
		'click a#leave-chan-link, a#close-link': 'leaveChanClick',
		'click a.connect-link': 'connectClick',
		'click label#nick-button': 'changeNickClick'
	},

	onKeyPress: function(e)
	{
		var keyCode = e.keyCode || e.which,
			key = { enter: 13, space: 32 },
			tab = tabCollections.getByCid(selectedTab);

		if (userInfo.networks == undefined || selectedNet == null || tab == undefined || tab.get('disabled'))
			return;

		if (keyCode == key.enter && loggedIn)
		{
			var value = this.chat.getValue(),
				buffer = tab.get('buffer');
			
			buffer.unshift(value);
			tab.set({buffer: buffer});
			// add the line to the buffer

			this.chat.send(tab, value);
			this.chat.setValue('');
			// send the item and reset the chat box

			e.preventDefault();
		}
		else
		{
			if (keyCode == key.space)
				tab.set({newId: 0, newInputs: []});
			// reset new inputs and id

			this.$chat.focus();
			// focus the field so the character is forced into it
		}
	},

	onKeyDown: function(e)
	{
		var keyCode = e.keyCode || e.which,
			tab = tabCollections.getByCid(selectedTab);

		if (keyCode == 8)
		{
			tab.set({newId: 0, newInputs: []});
			// reset new inputs and id

			if (!this.$chat.is(':focus'))
			{
				var input = this.chat.getValue();
				this.$chat.focus();
			}
			// if chat bar isnt focused then enter the backspace
		}
	},

	preventDefault: function(e)
	{
		e.preventDefault();
	},

	chanDescEnter: function(e)
	{
		var element = $('span.chan-desc'),
			tab = tabCollections.getByCid(element.attr('data-id')),
			timeinId = setTimeout(function()
			{
				if (tab != undefined)
				{
					if (tab.get != undefined && tab.get('type') != 'other')
						tab.$msgs.find('div.overlay-bar').slideDown('fast');
				}
			}, 500);

		element.attr('data-timeinId', timeinId);
		clearTimeout(element.attr('data-timeoutId'));
	},

	chanDescLeave: function(e)
	{
		var element = $('span.chan-desc'),
			tab = tabCollections.getByCid(element.attr('data-id')),
			timeoutId = setTimeout(function()
			{
				if (tab != undefined)
				{
					if (tab.get != undefined && tab.get('type') != 'other')
						tab.$msgs.find('div.overlay-bar').slideUp('fast');
				}
			}, 500);	
		
		element.attr('data-timeoutId', timeoutId);
		clearTimeout(element.attr('data-timeinId'));
	},

	userLinkDblClick: function(e)
	{
		var target = $(e.target),
			thisLink = (target[0].tagName == 'SPAN') ? target.parent() : target,
			popOver = $('div.popover');

		if (thisLink.attr('rel') != 'user-link' && target.parents('div.popover').length == 0 && target != popOver && popOver.length > 0)
			$('a[rel=user-link]').popover('destroy');
	},

	openWindowClick: function(e)
	{
		$('a[rel=user-link]').popover('destroy');
	},

	whoisUserClick: function(e)
	{
		client.socket.emit('data', {network: selectedNet, command: 'WHOIS ' + $(e.currentTarget).attr('data-nick')});
		// send the whois out

		$('a[rel=user-link]').popover('destroy');
		// close the popup

		actions.selectTab(mem[selectedNet + '-window']);
		// change tab

		e.preventDefault();
	},

	backlogReadClick: function(e)
	{
		var me = $(e.currentTarget),
			parent = me.parents('li'),
			id = parent.attr('id').replace('link-', ''),
			tab = tabCollections.getByCid(id);

		if (tab != undefined)
			tab.get('view').backlogReadClick(e);
	},

	modalFormSubmit: function(e)
	{
		var form = $('form#network-form');
		if ($('input#submit-type').val() == 'add-network')
		{
			var emitEvent = 'addNetwork',
				params = form.serializeObject();
			
			client.socket.emit(emitEvent, params);
		}
		else if ($('input#submit-type').val() == 'edit-network')
		{
			var emitEvent = 'updateNetwork',
				params = form.serializeObject();
				params.networkId = selectedNet;

			if (!userInfo.account_type.canRemove && userInfo.networks[selectedNet].locked)
				params['server-hostname'] = form.find('input#server-hostname').val();
			// insert this manually if the form isn't editable

			client.socket.emit(emitEvent, params);
		}
		// update the information, GOGO.

		$('div#home-content').scrollTop(0);
		
		e.preventDefault();
	},
	// handle the add/edit network form. we bind to a live click event rather than a submit
	// because the browser autocorrects my html and cuts the buttons out of the form :@
	// we also handle two forms here, two birds with one stone basically!

	settingsFormSubmit: function(e)
	{
		var type = $(e.currentTarget).attr('data-content'),
			postUrl = '/settings/' + type;
		// get the url
		
		$.post(postUrl, $('form#' + type + '-form').serialize(), function(data)
		{
			if (data.error)
			{
				$('div#' + type + '-message-holder').empty().html('<br /><div class="alert-message block-message error"><ul></ul></div>');
				for (var msg in data.error_message)
					$('div#' + type + '-message-holder div ul').append('<li>' + data.error_message[msg] + '</li>');
			}
			// if data.error = true then show the error etc.
			else
			{
				$('div#' + type + '-message-holder').empty().html('<br /><div class="alert-message block-message success"><p>' + data.success_message + '</p></div>');

				if (type != 'settings')
					$('form#' + type + '-form').reset();
				// display the success message and reset the form
				else if (updateInitJSON != undefined)
					$.getJSON('/init', updateInitJSON);
				// reset the data variable
			}

			$('div#home-content').scrollTop(0);
			
		}, 'json');

		e.preventDefault();
	},

	checkBoxClick: function(e)
	{
		if (e.currentTarget.checked)
			$(e.currentTarget).parents('.add-on').addClass('active');
		else
			$(e.currentTarget).parents('.add-on').removeClass('active');
	},
	// bootstrap checkbox addon logic

	changeSettingsTab: function(e)
	{
		var newTab = $(e.target).attr('data-content');
		
		$('ul.setting-tabs li').removeClass('active');
		$(e.target).parent().addClass('active');

		$('div.left-set div#tab-' + this.currentSettingsTab).hide();
		this.currentSettingsTab = newTab;
		
		$('div.left-set div#tab-' + this.currentSettingsTab).show();
		$('div.modal-footer #settings-submit').attr('data-content', this.currentSettingsTab);
		
		e.preventDefault();
	},

	setTopicClick: function(e)
	{
		if (tabCollections.getByCid(selectedTab).get('type') != 'chan') return;
		// only work on channels

		main.chat.setValue('/topic ' + selectedChan + ' ');
		main.$chat.focus();

		e.preventDefault();
	},
	// handle the 'Set Topic' link

	hideUsersClick: function(e)
	{
		if ($(e.currentTarget).text() == 'Hide Users')
			this.toggleUserList(tabCollections.getByCid(selectedTab), true);
		else
			this.toggleUserList(tabCollections.getByCid(selectedTab), false);

		e.preventDefault();
	},
	// handle the 'Show/Hide Users' link

	toggleUserList: function(tab, show)
	{
		if (tab.get('type') != 'chan') return;
		// bail from netwindow tabs, this causes (css) problems

		if (show)
		{
			tab.set({hide_userlist: true});
			cookieData[tab.get('name').toLowerCase() + ':userlist'] = true;

			$('a#hide-users-link').text('Show Users');
			tab.$list.width(0);
			tab.$msgs.width(fullContentWidth - borderPadding).addClass('wmsg_container').removeClass('msg_container');
			tab.$msgs.find('div.overlay-bar, div.message-bar').width(fullContentWidth - borderPadding);
		}
		else
		{
			tab.set({hide_userlist: false});
			delete cookieData[tab.get('name').toLowerCase() + ':userlist'];

			$('a#hide-users-link').text('Hide Users');
			tab.$msgs.width(fullContentWidth - borderPadding - userListWidth).addClass('msg_container').removeClass('wmsg_container');
			tab.$list.width(userListWidth);
			tab.$msgs.find('div.overlay-bar, div.message-bar').width(fullContentWidth - borderPadding - userListWidth);
		}

		tab.get('view').reDraw(true);
		// wait till the width has adjusted

		(JSON.stringify(cookieData) != '{}') ? $.cookie('tab-options', JSON.stringify(cookieData)) : $.cookie('tab-options', null);
	},
	// toggle show/hide users

	hideExtraClick: function(e)
	{
		if ($(e.currentTarget).text() == 'Hide Joins/Parts')
			this.toggleExtra(tabCollections.getByCid(selectedTab), true);
		else
			this.toggleExtra(tabCollections.getByCid(selectedTab), false);

		e.preventDefault();
	},
	// handle the 'Show/Hide Joins' link

	toggleExtra: function(tab, show)
	{
		if (tab.get('type') != 'chan') return;
		// bail from netwindow tabs, this causes (css) problems

		if (show)
		{
			tab.set({hide_joinsparts: true});
			cookieData[tab.get('name').toLowerCase() + ':hideextra'] = true;

			$('a#hide-extra-link').text('Show Joins/Parts');
			tab.$msgs.find('div.row[data-type=join], div.row[data-type=part], div.row[data-type=quit], div.row[data-type=nick]').hide();
		}
		else
		{
			tab.set({hide_joinsparts: false});
			delete cookieData[tab.get('name').toLowerCase() + ':hideextra'];
			
			$('a#hide-extra-link').text('Hide Joins/Parts');
			tab.$msgs.find('div.row[data-type=join], div.row[data-type=part], div.row[data-type=quit], div.row[data-type=nick]').show();
		}

		(JSON.stringify(cookieData) != '{}') ? $.cookie('tab-options', JSON.stringify(cookieData)) : $.cookie('tab-options', null);
	},
	// toggle extra

	viewLogsClick: function(e)
	{
		if (tabCollections.getByCid(selectedTab).get('type') != 'chan') return;
		// bail from netwindow tabs, this causes (css) problems

		return;
	},
	// view logs link

	leaveChanClick: function(e)
	{
		if (tabCollections.getByCid(selectedTab).get('type') == 'window') return;
		// bail from netwindow tabs, this also causes problems

		if ($(e.currentTarget).text() == 'Leave')
			actions.destroyWindow(selectedTab, true);
		else if ($(e.currentTarget).text() == 'Close')
			actions.destroyWindow(selectedTab, true);
		// perform the close

		e.preventDefault();
	},
	// handle the 'Leave' link

	connectClick: function(e)
	{
		if ($(e.currentTarget).attr('id') == 'close-link' && $(e.currentTarget).text() == 'Close')
		{
			actions.destroyWindow(selectedTab, true);
			return e.preventDefault();
		}
		// destroy a tab if its marked as close

		if (userInfo.networks[selectedNet].status == 'connected' || userInfo.networks[selectedNet].status == 'connecting')
			client.socket.emit('disconnectNetwork', {network: selectedNet});
		else
			client.socket.emit('connectNetwork', {network: selectedNet});
			
		e.preventDefault();
	},
	// handle the 'Connect/Disconnect' links

	changeNickClick: function(e)
	{
		main.chat.setValue('/nick ');
		main.$chat.focus();

		e.preventDefault();
	}
	// handle change nickname click
});

$(document).ready(function() {
	main = new MainView({el: $('body')});
});var UserListView = Backbone.View.extend({

	initialize: function(options)
	{
		this.ulId = options.ulId;
		this.tabId = options.tabId;
		this.tab = options.tab;
		this.el = 'div#list-' + this.tabId + ' div.content';
	},

	create: function()
	{
		$(this.el).prepend('<div class="members-title clear"><span class="left">Users</span><span class="right"></span></div><ul></ul>');
	}
});TabView = Backbone.View.extend({

	initialize: function(options)
	{
		this.ulId = $(options.ulId);
		this.tabId = options.tabId;
		this.tab = options.tab;
		this.userList = new UserListView(options);

		this.render(options);
	},

	events:
	{
		'hover div.overlay-bar': 'overlayHover',
		
		'click a[rel=channel-link]': 'channelLinkClick',
		'click a[rel=user-link]': 'userLinkClick',
		'dblclick a[rel=user-link]': 'userLinkDblClick',
		
		'click div.collapsed-head': 'toggleCollapsedClick',
		'click div.top-message-bar a#read-backlog': 'backlogReadClick',
		'click div.top-message-bar span.alert.highlight': 'backlogHighlightClick',
		'click div.top-message-bar': 'backlogBarClick'
	},

	overlayHover: function(e)
	{
		if (e.type == 'mouseenter')
		{
			clearTimeout($('span.chan-desc').attr('data-timeoutId'));
		}
		else
		{
			var element = 'span.chan-desc',
				tab = tabCollections.getByCid($(element).attr('data-id')),
				timeoutId = setTimeout(function() {
					tab.$msgs.find('div.overlay-bar').slideUp('fast');
				}, 650);	
			
			$(element).attr('data-timeoutId', timeoutId);
		}
	},

	channelLinkClick: function(e)
	{
		var chan = $(e.currentTarget).text(),
			tabId = mem[this.tab.get('network') + '-chan-' + chan.substr(1).toLowerCase()];

		if (tabCollections.getByCid(tabId) == undefined)
			client.socket.emit('data', {network: this.tab.get('network'), command: 'JOIN ' + chan});
		else
			actions.selectTab(tabId);

		e.preventDefault();
	},
	// handle #channel links

	userLinkClick: function(e)
	{
		var target = $(e.target),
			thisLink = (target[0].tagName == 'SPAN') ? target.parent() : target,
			popOver = $('div.popover'),
			prefix = thisLink.find('span.prefix'),
			prefixHTML = (prefix.length == 0 || (prefix.length > 0 && prefix.html() == '&nbsp;')) ? '' : prefix[0].outerHTML,
			action = (popOver.length == 0) ? 'show' : 'destroy';

		if (popOver.length > 0)
			$('a[rel=user-link]').popover('destroy');
		// remove any existing elements

		thisLink.popover({
			placement: 'left',
			trigger: '',
			html: true,
			title: '<h3>' + prefixHTML + thisLink.attr('data-nick') + '</h3><span class="mini">' + thisLink.attr('data-ident') + '@' + thisLink.attr('data-hostname') + '</span>',
			content: '<ul><li><a href="' + thisLink.attr('href') + '" id="open-link">Open</a></li><li><a href="#" id="whois-link" data-nick="' + thisLink.attr('data-nick') + '">Whois</a></li></ul>',
			container: 'body'
		}).popover(action);
		// create a new popover

		e.preventDefault();
	},
	// handle user links

	userLinkDblClick: function(e)
	{
		var target = $(e.target),
			thisLink = (target[0].tagName == 'SPAN') ? target.parent() : target,
			popOver = $('div.popover');

		if (thisLink.attr('rel') != 'user-link' && target.parents('div.popover').length == 0 && target != popOver && popOver.length > 0)
			$('a[rel=user-link]').popover('destroy');
	},

	toggleCollapsedClick: function(e)
	{
		var me = $(e.currentTarget),
			next = me.next();
			next.slideToggle();

		if (me.hasClass('open'))
			me.removeClass('open');
		else
			me.addClass('open');
		// alter the class and toggle it
	},

	backlogBarClick: function(e)
	{
		var tab = this.tab,
			unreadId = tab.get('toUnreadId'),
			selector = tab.$msgs.find('div.row[data-id=' + unreadId + ']');
		// get the tab and the unread id

		if (selector.length == 0)
		{
			tab.$msgs.find('div.mcontainer').find('div.row[data-type=privmsg][data-read=false]').attr('data-read', 'true');
			
			tab.$msgs.unbind('scroll');
			tab.$msgs.scrollTop(0);
			tab.scrollHandler();
		}
		else
		{
			tab.$msgs.scrollTo(selector);
		}
		// if the selector isnt found then it isnt out of the backlog yet, scroll to the top

		e.preventDefault();
	},
	// handle the onclick backlog bar

	backlogReadClick: function(e)
	{
		var tab = this.tab,
			messageBar = tab.$msgs.find('div.top-message-bar');

		messageBar.find('.hide').text(0);
		tab.markAsRead(true);
		// mark the messages as read

		tab.set({unread: 0, highlights: 0});
		// remove unread and highlight badges

		e.stopPropagation();
		e.preventDefault();
		// stop event bubbling etc
	},
	// handle the backlog read click

	backlogHighlightClick: function(e)
	{
		var tab = this.tab,
			selector = tab.$msgs.find('div.mcontainer div.row[data-read=false][data-highlight=true]').last().prev();
		// get the tab and the unread id

		if (selector.length == 0)
		{
			tab.$msgs.find('div.mcontainer').find('div.row[data-type=privmsg][data-read=false]').attr('data-read', 'true');
			
			tab.$msgs.unbind('scroll');
			tab.$msgs.scrollTo(selector);
			tab.scrollHandler();
		}
		else
		{
			tab.$msgs.scrollTo(selector);
		}
		// if the selector isnt found then it isnt out of the backlog yet, scroll to the top

		e.stopPropagation();
		e.preventDefault();
		// stop event bubbling etc
	},
	// handle the backlog highlight click

	handleHighlight: function(data, msg)
	{
		this.tab.set({highlights: this.tab.get('highlights') + 1});
		// increase the highlight number
			
		notifier.notify(data._id, data.network, data.args[0], msg);
	},

	cleanup: function(prepend, last, scrollPosition, force)
	{
		scrollPosition = scrollPosition || 0;
		force = force || false;

		if (prepend)
		{
			if (last && scrollPosition > 0)
				this.tab.$msgs.scrollTop(scrollPosition);
			// determine whether we need to scroll to a certain position

			this.tab.$msgs.find('div.mcontainer div.row:first').addClass('hide').removeClass('historyLoad').empty();
		}
		// replace the scrollbar into the previous position
		else if ((!prepend && this.tab.$msgs.isAtBottom()) || force)
		{
			this.tab.$msgs.scrollTop(this.tab.$msgs.find('.content').height());
		}
		// we re-initialise the scrollbar, to stop stuff getting ugly

		return this;
	},

	removeLast: function()
	{
		// TODO
		/*var actualRows = $('div#msgs-' + this.tabId + ' div.row:not([data-type="initial-divider"])').length - $('div#msgs-' + this.tabId + ' div.row[data-type*="divider"]').length,
			privmsgs = this.tab.get('privmsgs'),
			maxRows = 10,
			firstRow = $('div#msgs-' + this.tabId + ' div.row:not([data-type*="divider"]):first');
		
		if (actualRows > maxRows)
		{
			if (firstRow.attr('data-type') == 'privmsg')
				this.tab.set({privmsgs: privmsgs - 1});
			// is the first row a privmsg?

			firstRow.empty().remove();
			// remove the element

			var nextRow = firstRow.next(),
				firstMessage = $('div#msgs-' + this.tabId + ' div.row[data-type="privmsg"]:first');
			// get the next row

			this.tab.set({topEventId: nextRow.attr('data-id'), topMessageId: firstMessage.attr('data-id')});
			// update the top event id
		}*/

		return this;
	},

	addUIElement: function(options)
	{
		var netinfoN = (this.tab.get('type') != 'other') ? userInfo.networks[this.tab.get('network')] : {},
			closeLink = (this.tab.get('type') != 'other' && (!userInfo.account_type.canRemove && userInfo.networks[this.tab.get('network')].locked)) ? '' : '<a href="#" class="close">&times;</a>';
		// are we restricted?

		if (this.tab.get('type') == 'window' && (!userInfo.account_type.canRemove && netinfoN.locked))
			var template = 'tabLinkNetworkLocked';
		else if (this.tab.get('type') == 'window' && (userInfo.account_type.canRemove || !netinfoN.locked))
			var template = 'tabLinkNetworkUnlocked';
		else if (this.tab.get('type') == 'chan' || this.tab.get('type') == 'query')
			var template = 'tabLink';
		else
			var template = 'tabLink';
		// change the template based on the network and the user

		this.ulId.append($.tmpl(template, {
			id: this.tabId,
			type: this.tab.get('type'),
			hash: this.tab.get('hash'),
			title: this.tab.get('title'),
			cssClass: (this.tab.get('type') == 'chan' || this.tab.get('type') == 'query') ? '' : 'net-loader',
			chan: options.oChan,
			closeLink: closeLink
		}));
		// setup our tab link template

		this.tab.$link = $('li#link-' + this.tabId);
		// assign the tab link element to the tab

		$('div#network').on('click', 'li#link-' + this.tabId, function(e)
		{
			if (this.tab.get('highlights') > 0 && !notifier.checkPermissions())
				notifier.requestPermission();
		}.bind(this));

		$('div#network').on('click', 'li#link-' + this.tabId + ' a.close', {tabId: this.tabId}, function(e)
		{
			actions.destroyWindow(e.data.tabId, true);
			e.preventDefault();
		});
		// the reason this is here rather than elsewhere is that this can only be called from a user action, eg click.

		var elements = this.ulId.children('li').get();
			this.ulId.empty();
		// create the link in the ul's

		elements.sort(function(a, b)
		{
			var compA = $(a).children('a:first').text().toUpperCase(),
				compB = $(b).children('a:first').text().toUpperCase();

			if ($(a).attr('data-type') == 'window')
				compA = 'A' + compA;
			else if ($(a).attr('data-type') == 'chan')
				compA = 'B' + compA.substr(1);
			else if ($(a).attr('data-type') == 'query')
				compA = 'C' + compA;
			else
				compA = 'D' + compA.substr(1);

			if ($(b).attr('data-type') == 'window')
				compB = 'A' + compB;
			else if ($(b).attr('data-type') == 'chan')
				compB = 'B' + compB.substr(1);
			else if ($(b).attr('data-type') == 'query')
				compB = 'C' + compB;
			else
				compB = 'D' + compB.substr(1);

			return (compA < compB) ? -1 : (compA > compB) ? 1 : 0;
		});
		
		$.each(elements, function(idx, itm) { this.ulId.append(itm); }.bind(this));
	},

	addWindowElement: function(callback)
	{
		if (this.tab.get('type') != 'chan')
		{
			var template = (this.tab.get('type') == 'other') ? 'tabHtmlOther' : 'tabHtmlWindow';
			this.$el = $.tmpl(template, {
				id: this.tabId
			});

			$('div#channel-window-data').prepend(this.$el);
			// render the html and insert it
		}
		else
		{
			this.$el = $.tmpl('tabHtmlChannel', {
				id: this.tabId
			});
			
			$('div#channel-window-data').prepend(this.$el);
			// render the html and insert it

			this.userList.create();
			// setup the user list
		}
		// create the tab window

		this.tab.$tab = this.$el;
		this.tab.$msgs = this.$el.find('#msgs-' + this.tabId);
		this.tab.$list = this.$el.find('#list-' + this.tabId);
		this.tab.$table = this.$el.find('#table-' + this.tabId);
		// setup our cached elements

		callback();
	},

	hide: function()
	{
		if (this.tab.get('hidden') === true)
			return;
		// already hidden, let's forget this call

		var inner = this.$el.find('div.mcontainer'),
			scrollPosition = inner[0].scrollHeight - inner.height();

		this.tab.set({hidden: true, storedInput: main.chat.getValue()});
		// mark the tab as hidden and store the input

		this.tab.$link.removeClass('selected');
		this.tab.$link.find('a span.alerts').empty().remove();
		this.tab.$link.removeClass('hide');
		// alter the link styles
		
		client.hideNoNetworks();
		this.tab.$tab.hide();
		
		main.chat.setValue('');
		// hide the tab window and blank the input
	},

	show: function()
	{
		var oldTab = selectedTab;
		// tab is undefined, return.

		selectedNet = this.tab.get('network');
		selectedChan = this.tab.get('chan');
		selectedTab = this.tabId;
		// reset some variables

		if (this.tab.get('loading') == true)
		{
			client.showLoading();
			return;
		}
		else
		{
			client.hideLoading();
			$('div#channel-input, div#channel-window-data').show();
		}
		// don't show the tab if we're still loading..

		this.tab.set({hidden: false});
		// mark the tab as not hidden
		
		this.tab.$tab.show();
		this.tab.$link.addClass('selected');
		// alter some css styles and show the tab

		if (userInfo.networks != undefined && userInfo.networks[this.tab.get('network')] != undefined)
			$('label#nick-button').text(userInfo.networks[this.tab.get('network')].nick);
		// reset some styles and stuff

		this.setupLinks();
		// setup all the buttons and links
		 
		var date = new Date(),
			day = (date.getDate() < 10) ? '0' + date.getDate() : date.getDate(),
			month = ((date.getMonth() + 1) < 10) ? '0' + (date.getMonth() + 1) : (date.getMonth() + 1),
			curDate = day + '-' + month + '-' + date.getFullYear();
		// get the current date in our standard log date format
		// TODO - I do this a lot, maybe I should wrap it in a function?

		if (this.tab.get('type') != 'window')
		{
			if (window.location.hash != this.tab.get('hash'))
				window.location.hash = this.tab.get('hash');
			
			document.title = userInfo.networks[this.tab.get('network')].name + ' / ' + this.tab.get('title') + ' / IRCAnywhere';
			$('a#view-logs-link').attr('href', '/logs/' + userInfo.networks[this.tab.get('network')].url + '/' + encodeURIComponent(this.tab.get('name')) + '/' + curDate);
		}
		else
		{
			if (window.location.hash != this.tab.get('hash'))
				window.location.hash = this.tab.get('hash');
			
			document.title = this.tab.get('title') + ' / IRCAnywhere';
			$('a#view-logs-link').attr('href', '/logs/' + userInfo.networks[this.tab.get('network')].url + '/' + userInfo.networks[this.tab.get('network')].host + '/' + curDate);
		}
		// set some variables.

		this.tab.reCalculateScrollState();
		// start setting up a new messages scrollbar

		tabHeight = (this.tab.get('type') == 'other') ? height - (borderPadding + $('.topbar').outerHeight()) : height - (inputPadding + $('.topbar').outerHeight());
		this.reDraw();
		// hide the input box on other boxes
	},

	setupLinks: function()
	{
		if (this.tab.get('type') == 'query')
		{
			var network = userInfo.networks[selectedNet];

			tabCollections.changeTopicBar(network.name, '', '', this.tab.$link.find('a:first span').text());
			$('a#view-logs-link, a#hide-extra-link, a#hide-users-link, a#set-topic-link, span#divider1').parent().hide();
			// set the channel description crack up
		}
		else if (this.tab.get('type') != 'window' && this.tab.get('type') != 'other')
		{
			tabCollections.resetTopicBar(this.tab);
			$('a#view-logs-link, a#hide-extra-link, a#hide-users-link, a#leave-chan-link, a#edit-network-link, a#connect-link, span#divider1, span#divider2').parent().show();
			$('a#close-link').removeClass('danger connect-link').text('Close');
		}
		else if (this.tab.get('type') == 'window')
		{
			var network = userInfo.networks[selectedNet],
				closeText = (network.status == 'connected' || network.status == 'connecting') ? 'Disconnect' : 'Close';

			tabCollections.changeTopicBar(network.name, '', selectedTab, userInfo.networks[this.tab.get('network')].url)
			
			$('a#hide-extra-link, a#hide-users-link, a#leave-chan-link, a#set-topic-link, span#divider2').parent().hide();
			$('a#view-logs-link, a#edit-network-link, a#connect-link, span#divider1, span#divider2').parent().show();
			$('a#close-link').addClass('danger connect-link').text(closeText);
			// set the channel description up and alter link titles etc

			var divHtml = $('<span class="channel-name">' + network.name + '</span> <span class="topic">' + userInfo.networks[this.tab.get('network')].url + '</span>');
			this.tab.$msgs.find('div.overlay-bar').empty().html(divHtml);
		}
		else
		{
			var network = userInfo.networks[selectedNet];
			tabCollections.changeTopicBar(network.name, '', '', this.tab.$link.find('a:first span').text());
			$('a#view-logs-link, a#hide-extra-link, a#hide-users-link, a#leave-chan-link, a#set-topic-link, span#divider1').parent().hide();
			$('a#edit-network-link, a#connect-link, span#divider2').parent().show();
			$('a#close-link').removeClass('danger connect-link').text('Close');
			// hide the menus
		}
		// set some data in the channel header

		var me = this.tab.get('ulCollection').filter(function(model) { return model.get('user') == userInfo.networks[this.tab.get('network')].nick; }.bind(this)),
			modes = (me[0] == undefined) ? '' : me[0].modes;

		$('a#edit-network-link').attr('href', '#?/edit-network/' + userInfo.networks[this.tab.get('network')].url);

		if (modes == '' || modes == 'v')
			$('a#set-topic-link').hide();
		else
			$('a#set-topic-link').show();
		// determine whether we're able to set the topic or not

		if (this.tab.get('hide_userlist'))
			$('a#hide-users-link').text('Show Users');
		else
			$('a#hide-users-link').text('Hide Users');
		// hide users link

		if (this.tab.get('hide_joinsparts'))
			$('a#hide-extra-link').text('Show Joins/Parts');
		else
			$('a#hide-extra-link').text('Hide Joins/Parts');
		// hide joins/parts link

		if (userInfo.networks != undefined && userInfo.networks[this.tab.get('network')] != undefined && userInfo.networks[selectedNet].status == 'connected')
			$('a#connect-link').text('Disconnect').attr('data-content', selectedNet);
		else
			$('a#connect-link').text('Connect').attr('data-content', selectedNet);
		// change the connect links

		if (this.tab.get('type') != 'window' && this.tab.get('type') != 'chan')
			$('a#leave-chan-link').text('Close');
		else
			$('a#leave-chan-link').text('Leave');
		// change the leave channel link

		if (this.tab.get('type') == 'other')
			$('div#channel-input').hide();
		else
			$('div#channel-input').show();
		// change the channel input

		if (this.tab.get('disabled'))
		{
			main.$chat.attr('disabled', 'disabled');
			main.chat.setValue(this.tab.get('storedInput'));
		}
		else if (!this.tab.get('disabled'))
		{
			main.$chat.removeAttr('disabled').focus();
			main.chat.setValue(this.tab.get('storedInput'));
		}
		// does the input form need to be disabled? also reload the input
	},

	reDraw: function(soft)
	{
		var soft = soft || false;
		// check if the rows need to be redrawn, this is expensive so we only need to do it on resize

		if (this.tab.get('seenBefore') === false)
			this.tab.set({scrollPosition: 0, seenBefore: true});
		// reset the scroll position

		if (this.tab.get('type') == 'chan' && !this.tab.get('hide_userlist'))
		{
			var mheight = this.tab.$msgs.find('div.mcontainer').height(),
				bPadding = ((tabHeight + borderPadding) < mheight) ? 3 : dblBorderPadding;
			
			this.tab.$msgs.find('div.overlay-bar, div.message-bar').width(fullContentWidth - userListWidth - 20);
			
			if (this.tab.get('scrollPosition') - this.tab.$msgs.height() <= 0 || this.tab.$msgs.isAtBottom())
				this.tab.$msgs.scrollTop(this.tab.$msgs.find('.content').height());
		}
		else if (this.tab.get('type') != 'other')
		{
			this.tab.$msgs.find('div.overlay-bar, div.message-bar').width(fullContentWidth - 20);
			
			if (this.tab.get('scrollPosition') - this.tab.$msgs.height() <= 0 || this.tab.$msgs.isAtBottom())
				this.tab.$msgs.scrollTop(this.tab.$msgs.find('.content').height());
		}
		else
		{
			this.tab.$msgs.find('div.overlay-bar, div.message-bar').width(fullContentWidth - 20);
		}
		// we re-initialise the scrollbar, to stop stuff getting ugly

		this.tab.$msgs.find('span.column2').width(this.tab.$msgs.width() - 120);
		// TODO - Revise this, I'll definitely be able to speed it up some how

		if (!soft)
			this.setupLinks();
		// resetup the links

		return this;
	},

	destroy: function(remove)
	{
		var network = this.tab.get('network'),
			tabId = this.tab.get('id'),
			rTabId = this.tab.get('rId'),
			chan = this.tab.get('name'),
			type = this.tab.get('type'),
			chan = (type == 'chan' || type == 'other') ? chan.substr(1) : chan,
			tabId = mem[rTabId];

		if (type == 'chan')
		{
			client.socket.emit('data', {network: network, command: 'PART ' + this.tab.get('name')});
			
			delete cookieData[this.tab.get('name').toLowerCase() + ':userlist'], cookieData[this.tab.get('name').toLowerCase() + ':hideextra'];
			(JSON.stringify(cookieData) != '{}') ? $.cookie('tab-options', JSON.stringify(cookieData)) : $.cookie('tab-options', null);
		}
		// if it's a channel we shall PART it

		if (type == 'window')
		{
			if (!userInfo.account_type.canRemove && userInfo.networks[network].locked)
				return;

			_.clone(tabCollections).each(function(tab)
			{
				if (tab.get('network') == network)
				{
					tab.$tab.empty().remove();
					delete mem[tab.get('rId')];
					tabCollections.remove(tab);
					// remove the tab and it's div
				}
			});

			delete netinfo[network];
			delete mem[rTabId];
			tabCollections.remove(tabCollections.getByCid(tabId));
			
			$('ul#network-' + $.fastEncode(network)).empty().remove();
			this.$el.empty().remove();
			// remove the ul

			if (remove)
				client.socket.emit('removeNetwork', {network: network});
			// remove the network.
		}
		// if the tab is a network we just remove the entire ul and sod off
		else
		{
			this.tab.$link.empty().remove();
			this.tab.$tab.empty().remove();

			delete mem[rTabId];
			tabCollections.remove(tabCollections.getByCid(tabId));
		}
		// remove the object and swap to the next tab

		if (previousHashes[previousHashes.length - 1] == undefined)
		{
			client.showNoNetworks().hideLoading();
		}
		else
		{
			var hashes = previousHashes,
				found = false;
				hashes.reverse();

			for (var hash in hashes)
			{
				if (tabCollections.getByCid(hashes[hash]) != undefined)
				{
					actions.selectTab(hashes[hash]);
					found = true;
					break;
				}
			}
			// if the tab isn't defined, check the next one

			if (!found && tabCollections.length > 0)
			{
				var tab = tabCollections.at(0);
				actions.selectTab(tab.get('id'));
			}
			// if we have tabs then boom, show the first one
			else if (!$('div#home-content').is(':visible') && !found && tabCollections.length == 0)
			{
				client.showNoNetworks();
			}
		}
		// determine whether we go to the next tab or not.
	},

	render: function(options)
	{
		this.addUIElement(options);
		this.addWindowElement(function() {
			this.tab.playbackHandler();
		}.bind(this));
		// add the elements and then setup event handlers

		this.$el.hide();
		this.delegateEvents(this.events);
		// do some css stuff

		return this;
	},
});BufferListView = Backbone.Model.extend({

	initialize: function(options)
	{
		this.tabId = options.tabId;
		this.network = options.network;
		this.list = options.list;
		this.tab = tabCollections.getByCid(this.tabId);

		this.render();
	},

	render: function()
	{
		var htmlBuffer = '';
		for (var item in this.list)
		{
			var data = this.list[item],
				channel = data.name,
				channelUrl = '#!/' + userInfo.networks[selectedNet].url + '/' + encodeURIComponent(channel);
				users = data.users,
				topic = (data.topic == '') ? '&nbsp;' : IRCParser.exec(data.topic, userInfo.networks[this.network]);

			htmlBuffer += '<tr><td class="column1"><a href="' + channelUrl + '" rel="channel-link">' + channel + '</a></td><td class="column2">' + users + '</td><td class="column3">' + topic + '</td></tr>';
			// not sure if it's worth using our Templates class here, as this could be entering max 1 or 2 thousand rows?
			// it needs to be as speedy as possible, and this is the best way for it to be.
		}

		this.tab.$msgs.find('div.mcontainer table tbody').html(htmlBuffer);
		// add the data, we sort it when we recieve the end of list
	}
});BufferMessageView = Backbone.Model.extend({

	tagName: 'div',
	className: 'row',

	initialize: function(parser, options)
	{
		this.parser = parser;
		this.options = options;
		this._id = this.options._id;
		this.msg = this.options.args.slice(1).join(' ');
		this.privMsg = false;
		this.ctcp = false;
		this.pause = false;
		this.extraRow = '';
		this.action = (/\u0001ACTION(.*?)\u0001/.test(this.msg)) ? true : false;
		this.time = (this.options.time == undefined) ? new Date() : new Date(this.options.time);
		this.options.read = (this.options.read == undefined) ? true : this.options.read;
		this.port = (userInfo.networks[this.options.network].secure) ? '+' + userInfo.networks[this.options.network].port : userInfo.networks[this.options.network].port;

		if (this.msg == undefined || this.msg == '')
			return;
		// empty message, bizarre but we don't continue

		this.housekeep();
	},

	isAction: function()
	{
		if (/^\u0001(?:(?!ACTION).)*\u0001/.test(this.msg))
			return true;
		return false;
	},

	housekeep: function()
	{
		var forcePush = false;

		if (this.isAction())
		{
			this.tabId = mem[this.options.network + '-window'];
			this.tab = tabCollections.getByCid(this.tabId);
			this.nick = '&nbsp;';
			this.ctcp = true;
			this.extraRow = ' otherRow';
			this.command = /\u0001(.*?)\u0001/.exec(this.msg)[0].replace(/\W+/g, '');
			this.msg = 'Recieved a CTCP ' + this.command + ' from ' + this.options.nick;
			// set some variables
		}
		// if it's an ACTION/CTCP we need to determine how to format it

		if (!this.ctcp && Helper.isChannel(userInfo.networks[this.options.network], this.options.args[0]))
		{
			this.tabId = mem[this.options.network + '-chan-' + this.options.args[0].substr(1).toLowerCase()];
			this.tab = tabCollections.getByCid(this.tabId);
			this.nick = this.options.nick;
		}
		else if (!this.ctcp)
		{
			var tabPart = (this.options.self) ? this.options.args[0] : this.options.nick;
			this.tabId = mem[this.options.network + '-query-' + tabPart.toLowerCase()];
			this.tab = tabCollections.getByCid(this.tabId);
			this.nick = this.options.nick;
			this.privMsg = true;

			if (this.tabId == undefined && this.tab == undefined)
			{
				this.tabId = actions.createWindow(this.options.network, tabPart, 'query', {bottomMessageId: this._id, finishedPlayback: false, prependHTML: ''});
				this.tab = tabCollections.getByCid(this.tabId);
				this.pause = true;
				forcePush = true;
			}
			// tab dunt exist? create it.
		}
		// if it's a user, we find out if we've got a query window open for this user
		
		if (this.options.prepend || this.tab.get('finishedPlayback') || forcePush)
		{
			this.cont();
		}
		else
		{
			var backlog = this.tab.get('backLog');
				backlog.push(this);
			this.tab.set({backLog: backlog});
		}
		// only continue if the playback has finished
	},

	cont: function()
	{
		if (this.pause)
			setTimeout(function() { this.render() }.bind(this), 300);
		// enough time for the message to be inserted prior to the user having a look at it
		else
			this.render();

		this.tab.set({privmsgs: this.tab.get('privmsgs') + 1});
		// some housekeeping ie setting variables

		var condition1 = (this.tab.get('type') == 'query' && !this.options.self),
			condition2 = (this.options.highlight && !this.options.prepend),
			condition3 = (!window.isActive || this.tab.cid != selectedTab);

		if ((condition1 || condition2) && condition3 && !this.options.read)
			this.tab.get('view').handleHighlight(this.options, this.msg);
		// again final check for highlights, here we display a desktop notification
		// notice regardless of the fact a highlight is always a highlight, we go through other checks to determine if the user needs to know about it (for example it could be a backlog highlight)
	},

	render: function()
	{
		var _this = this,
			user = this.tab.get('ulCollection').filter(function(model) { return model.get('user') == this.nick; }.bind(this)),
			userLink = (user[0] == undefined) ? Helper.generateUserLink(this.options.network, this.nick, this.options.user, this.options.host, this.options.userPrefix, false, true) : user[0].userLink(true),
			template = (this.action) ? 'messageRowAction' : 'messageRow';
		// pretty up the nick, with prefixes and such
		// (network, nick, hostname, prefix)

		this.$el = $.tmpl(template, {
			cssClass: this.extraRow,
			id: this._id,
			read: this.options.read,
			highlight: this.options.highlight,
			userLink: userLink,
			parsedMessage: IRCParser.exec(this.msg.replace(/\u0001ACTION(.*?)\u0001/, '$1'), userInfo.networks[this.options.network]),
			time_f1: $.generateTime(this.time, false),
			time_f2: $.generateTimestamp(this.time),
			self: this.options.self,
			date: this.time
		});

		this.$el.find('.column2').width(this.tab.$msgs.width() - 120);
		// compile an object so we can render a template with $.tmpl()
		// also resize our new .$el object so it fits

		if (this.options.prepend)
		{
			var prependHTML = this.tab.get('prependHTML'),
				selector = this.tab.$msgs.find('div.mcontainer > div.row[data-type=initial-divider]');
			
			this.tab.set({topEventId: this._id});
			this.tab.set({topMessageId: this._id});

			prependHTML = this.$el[0].outerHTML + prependHTML;
			this.tab.set({prependHTML: prependHTML});

			if (this.options.last)
			{
				var insert = $(prependHTML).insertAfter(selector);
				$.when(insert, {el: selector}).then(Helper.insertDateDividers(_this.tab));
			}
		}
		else
		{
			var markup = $.dateTimeBar(this.tab, this.time, this.options.prepend),
				selector = this.tab.$msgs.find('div.mcontainer > div.row:last');
			// determine if we have date markup

			$.when(this.$el.insertAfter(selector), {el: selector}).then(function(el, obj)
			{
				if (markup != null)
					markup.insertBefore(obj.el);

				this.tab.reCalculateScrollState();
				// do we do recalc scroll state here?

				if (client.settings.timestamp_format == 0)
					_this.$el.find('span.time').text(_this.$el.find('span.time').attr('data-format-1'));
				else
					_this.$el.find('span.time').text(_this.$el.find('span.time').attr('data-format-2'));

			}.bind(this));
		}
		// where do we insert it?

		if (!this.options.prepend)
			this.tab.get('view').cleanup(this.options.prepend, this.options.last, 0).removeLast();
	}
});BufferNoticeView = Backbone.Model.extend({

	tagName: 'div',
	className: 'row',

	initialize: function(options)
	{
		this.options = options;
		this._id = this.options._id;
		this.msg = this.options.args.splice(1).join(' ');
		this.time = (this.options.time == undefined) ? new Date() : new Date(this.options.time);
		
		if (this.msg == undefined || this.msg == '')
			return;
		// bail if msg is empty

		this.housekeep();
	},

	housekeep: function()
	{
		if (Helper.isChannel(userInfo.networks[this.options.network], this.options.args[0]))
		{
			this.tabId = mem[this.options.network + '-chan-' + this.options.args[0].substr(1).toLowerCase()];
			this.nick = '-' + this.options.nick + '/' + this.options.args[0] + '-';
			this.cssClass = ' notice';
			this.nick = (this.options.nick == undefined) ? this.options.args[0] : this.nick;
		}
		// first we determine whether its a channel.
		else
		{
			this.nick = (this.options.nick == undefined) ? '-' + this.options.prefix + '-' : '-' + this.options.nick + '-';
			this.nick = (this.msg.substr(0, 3) == '***') ? '' : this.nick;
			this.cssClass = (this.nick == '') ? '' : ' notice';
			this.msg = (this.msg.substr(0, 3) == '***' && this.nick == '') ? this.msg.substr(4) : this.msg;
			this.tabId = (this.options.prepend || selectedNet != this.options.network || this.nick == '') ? mem[this.options.network + '-window'] : selectedTab;
		}

		this.tab = tabCollections.getByCid(this.tabId);

		if (this.options.prepend || this.tab.get('finishedPlayback'))
		{
			this.cont();
		}
		else
		{
			var backlog = this.tab.get('backLog');
				backlog.push(this);
				this.tab.set({backLog: backlog});
		}
		// only continue if the playback has finished
	},

	cont: function()
	{
		this.render();
	},

	render: function()
	{
		var _this = this,
			user = this.tab.get('ulCollection').filter(function(model) { return model.get('user') == this.nick; }.bind(this)),
			userLink = (user[0] == undefined) ? Helper.generateUserLink(this.options.network, this.nick, this.options.user, this.options.host, this.options.userPrefix, false, false) : user[0].userLink(false);
			userLink = (this.nick == '' || this.nick.indexOf('.') >= 0) ? this.nick : userLink;

		this.$el = $.tmpl('noticeRow', {
			id: this._id,
			userLink: userLink,
			parsedMessage: IRCParser.exec(this.msg, userInfo.networks[this.options.network]),
			time_f1: $.generateTime(this.options.time, false),
			time_f2: $.generateTimestamp(this.options.time),
			read: this.options.read,
			date: this.time
		});
		
		this.$el.find('.column2').width(this.tab.$msgs.width() - 120);
		// compile an object so we can render a template with $.tmpl()
		// also resize our new .$el object so it fits

		if (this.options.prepend)
		{
			var prependHTML = this.tab.get('prependHTML'),
				selector = this.tab.$msgs.find('div.mcontainer > div.row[data-type=initial-divider]');
			
			this.tab.set({topEventId: this._id});

			prependHTML = this.$el[0].outerHTML + prependHTML;
			this.tab.set({prependHTML: prependHTML});

			if (this.options.last)
			{
				var insert = $(prependHTML).insertAfter(selector);
				$.when(insert, {el: selector}).then(Helper.insertDateDividers(_this.tab));
			}
		}
		else
		{
			var markup = $.dateTimeBar(this.tab, this.time, this.options.prepend),
				selector = this.tab.$msgs.find('div.mcontainer > div.row:last');

			$.when(this.$el.insertAfter(selector), {el: selector}).then(function(el, obj)
			{
				if (markup != null)
					markup.insertBefore(obj.el);

				this.tab.reCalculateScrollState();
				// do we do recalc scroll state here?
				
				if (client.settings.timestamp_format == 0)
					_this.$el.find('span.time').text(_this.$el.find('span.time').attr('data-format-1'));
				else
					_this.$el.find('span.time').text(_this.$el.find('span.time').attr('data-format-2'));
				
			}.bind(this));
		}

		if (!this.options.prepend)
			this.tab.get('view').cleanup(this.options.prepend, this.options.last).removeLast();
	}
});BufferOtherView = Backbone.Model.extend({

	tagName: 'div',
	className: 'row',
	types: [
		'join',
		'part',
		'nick',
		'quit',
		'mode',
		'topic',
		'kick'
	],

	initialize: function(options)
	{
		this.options = options;
		this.tabId = this.options.tabId;
		this._id = this.options._id;
		this.chan = this.options.chan;
		this.msg = this.options.msg;
		this.type = this.options.type;
		this.tab = tabCollections.getByCid(this.tabId);
		this.network = (this.tab == undefined) ? '' : this.tab.get('network');
		this.time = (options.time == undefined) ? new Date() : new Date(options.time);
		this.extraCss = (this.type != 'motd') ? ' otherRow' : ' motdRow';
		this.extraCss = (this.tab.get('hide_joinsparts') == true) ? this.extraCss + ' hide' : this.extraCss;
		this.cssType = (this.types.indexOf(this.type) >= 0) ? 'event' : this.type;

		if (this.tab == undefined || this.msg == '' || this.msg == undefined)
			return;
		// bail.

		this.housekeep();
	},

	housekeep: function()
	{
		if (this.type != 'other')
		{
			if (this.options.prepend || this.tab.get('finishedPlayback'))
			{
				this.cont();
			}
			else
			{
				var backlog = this.tab.get('backLog');
					backlog.push(this);
					this.tab.set({backLog: backlog});
			}
			// only continue if the playback has finished
		}
		else if (this.type == 'other' && this.chan == 'links')
		{
			var data = this.msg.split(' ').splice(1);
			this.server = '<strong>' + data[0] + '</strong> <- ' + data[1],
			this.descData = data.splice(3);
			this.desc = (this.descData.join(' ') == '') ? '&nbsp;' :this. descData.join(' ');
			
			this.renderLinks();
		}
	},

	cont: function()
	{
		this.renderNormal();
	},

	renderNormal: function()
	{
		var _this = this;

		this.$el = $.tmpl('otherRow', {
			id: this._id,
			cssClass: this.extraCss,
			type: this.type,
			messageCssClass: this.cssType,
			message: this.msg,
			time_f1: $.generateTime(this.time, false),
			time_f2: $.generateTimestamp(this.time, false),
			date: this.time
		});
		
		this.$el.find('.column2').width(this.tab.$msgs.width() - 120);
		// compile an object so we can render a template with $.tmpl()
		// also resize our new .$el object so it fits

		if (this.options.prepend)
		{
			var prependHTML = this.tab.get('prependHTML'),
				selector = this.tab.$msgs.find('div.mcontainer > div.row[data-type=initial-divider]');
			
			this.tab.set({topEventId: this._id});

			prependHTML = this.$el[0].outerHTML + prependHTML;
			this.tab.set({prependHTML: prependHTML});

			if (this.options.last)
			{
				var insert = $(prependHTML).insertAfter(selector);
				$.when(insert, {el: selector}).then(Helper.insertDateDividers(_this.tab));
			}
		}
		else
		{
			var markup = (this.options.noDate) ? null : $.dateTimeBar(this.tab, this.time, this.options.prepend),
				selector = this.tab.$msgs.find('div.mcontainer > div.row:last');

			$.when(this.$el.insertAfter(selector), {el: selector}).then(function(el, obj)
			{
				if (markup != null)
					markup.insertBefore(obj.el);
				// insert a new time bar if need be

				Helper.reOrganiseChannelEvents(_this.tab, _this.time, obj.el.next());
				// now determine whether this needs to be collapsed and moved into the new section

				if (client.settings.timestamp_format == 0)
					_this.$el.find('span.time').text(_this.$el.find('span.time').attr('data-format-1'));
				else
					_this.$el.find('span.time').text(_this.$el.find('span.time').attr('data-format-2'));
				
			});
		}
		// where do we insert it?

		if (!this.options.prepend)
			this.tab.get('view').cleanup(this.options.prepend, this.options.last).removeLast();
	},

	renderLinks: function()
	{
		this.$el = $('<tr><td class="column4">' + this.server + '</td><td class="column5">' + this.desc + '</td></tr>');
		this.tab.$table.find('tbody').append(this.$el);
		// add the data row

		this.tab.$msgs.scrollTop(0);
	}
});BufferWhoisView = Backbone.Model.extend({

	initialize: function(options)
	{
		this.network = options.network;
		this.user = options.user;
		this.tabId = mem[this.network + '-window'];
		this.tab = tabCollections.getByCid(this.tabId);
	},

	render: function(data)
	{
		for (var line in data)
			parser.other(this.tabId, '', '[' + this.user + '] ' + data[line], 'motd', {prepend: false, noDate: true});
		// insert whois info
	}
});BufferWindowNoticeView = Backbone.Model.extend({

	tagName: 'div',
	className: 'row',

	initialize: function(options)
	{
		this.options = options;
		this.tabId = this.options.tabId;
		this.msg = this.options.msg;
		this.tab = tabCollections.getByCid(this.tabId);
		this.time = (this.options.time == null) ? new Date() : new Date(this.options.time);
		// set some variables

		this._id = $.fastEncode(Math.floor((Math.random()*100)+1) + this.msg + this.time + Math.floor((Math.random()*100)+1)).toString();
		this._id = (this._id.substr(0, 1) == '-') ? this._id : '-' + this._id;
		// generate a random id that we use instead of the buffer id's, which are md5 hashes, although we just sack it off
		// we make sure it starts with a - so we can move to the next one when we're asking for more buffers from the backend

		this.render();
		this.housekeep();
	},

	housekeep: function()
	{
		this.tab.get('view').cleanup(false, false, 0, true);
	},

	render: function()
	{
		this.html = '<p>' + this.msg + '</p>';
		this.$el = $.tmpl('windowNoticeRow', {
			id: this._id,
			message: this.html,
			date: this.time
		});
		// setup template

		if (this.options.prepend)
		{
			var prependHTML = this.tab.get('prependHTML'),
				selector = this.tab.$msgs.find('div.mcontainer > div.row[data-type=initial-divider]');

			this.tab.set({topEventId: this._id});
			prependHTML = this.$el[0].outerHTML + prependHTML;
			this.tab.set({prependHTML: prependHTML});

			if (this.options.last)
			{
				var insert = $(prependHTML).insertAfter(selector);
				$.when(insert, {el: selector}).then(Helper.insertDateDividers(_this.tab));
			}
		}
		else
		{
			var markup = $.dateTimeBar(this.tab, this.time, this.options.prepend),
				selector = this.tab.$msgs.find('div.mcontainer > div.row:last');

			if (this.tab.$msgs.find('div.mcontainer > div.row:last div.divider').length > 0)
	        {
	        	if (this.tab.$msgs.find('div.mcontainer > div.row:last div.divider p:last')[0].outerHTML != this.html)
	        		this.tab.$msgs.find('div.mcontainer > div.row div.divider:last').append(this.html);
	        }
	        else
	        {
	        	$.when(this.$el.insertAfter(selector), {el: selector}).then(function(el, obj)
				{
					if (markup != null)
						markup.insertBefore(obj.el);
				});
			}
		}
        // need to insert a divider etc.
	}
});TabModel = Backbone.Model.extend({

	/* called when a new tabModal is created */
	initialize: function(options)
	{
		var type = options.type,
			rTabId = options.rId,
			chan = options.chan,
			network = options.network,
			ulId = options.ulId,
			url = userInfo.networks[network].url,
			hashParts = window.location.hash.split('/');
			
		if (type == 'window')
			var hash = '#!/' + url;
		else if (type == 'other')
			var hash = '#!/' + url + '/' + encodeURIComponent(chan).replace('%2F', '%40');
		else if (type != 'other' && type != 'window')
			var hash = '#!/' + url + '/' + encodeURIComponent(chan);
		// create the hash

		var newDate = new Date(1970, 01, 01),
			newPDate = new Date(),
			settings = {
				id: this.cid,
				rId: rTabId,
				network: network,
				type: type,
				name: chan.toLowerCase(),
				title: chan,
				hash: hash,
				hide_userlist: false,
				disabled: false,
				seenBefore: false,
				topic: '',
				modes: '',
				lastTime: newDate,
				lastTimeP: newPDate,
				privmsgs: 0,
				unread: 0,
				highlights: 0,
				scrollPosition: -10,
				topMessageId: null,
				topEventId: null,
				toUnreadId: null,
				finishedPlayback: false,
				loading: (type == 'chan') ? true : false,
				hidden: true,
				scrollLock: false,
				backLog: [],
				playbackData: {},
				prependHTML: '',
				buffer: [],
				bufferIndex: -1,
				storedInput: '',
				defaultInput: '',
				newInputs: [],
				newId: 0
			};

		$.extend(settings, options.extra);
		// extend the settings

		this.set(settings);
		// setup the tab

		mem[rTabId] = this.cid;
		tabCollections.add(this);

		var view = new TabView({tabId: this.cid, tab: this, oNetwork: network, oChan: chan, ulId: ulId});
			this.set({view: view});
		// setup the view

		var ulCollection = new UserCollection({tab: this, view: view});
			this.set({ulCollection: ulCollection});
		// setup the user listcollection
		
		if (type == 'chan')
		{
			this.handleTabOptions(chan);
			client.socket.emit('getBacklog', {network: network, target: chan, id: null, status: false, limit: 100});
		}
		else if (type == 'query')
		{
			var topId = this.get('topMessageId'),
				bottomId = this.get('bottomMessageId');
			client.socket.emit('getBacklog', {network: network, from: userInfo.networks[network].nick, target: chan, id: topId, btmId: bottomId, status: false, limit: 30});
		}
		// load the previous messages in query windows

		this.handleEvents();
	},

	handleTabOptions: function(chan)
	{
		cookieData = (JSON.parse($.cookie('tab-options')) == null) ? {} : JSON.parse($.cookie('tab-options'));
		if (cookieData[chan.toLowerCase() + ':userlist'] != undefined)
			main.toggleUserList(this, true);
		if (cookieData[chan.toLowerCase() + ':hideextra'] != undefined)
			main.toggleExtra(this, true);
	},

	handleEvents: function()
	{
		this.on('change:finishedPlayback', function(model, finished)
		{
			if (finished)
			{
				var playbackData = model.get('playbackData');
				client.finishPlayback(playbackData.data, model, playbackData.topDivId);
				
				var backlog = model.get('backLog');
				for (var i in backlog)
				{
					var bufferItem = backlog[i];
					bufferItem.cont();
				}

				model.set({playbackData: {}});
				model.set({backLog: []});
			}
			// if tab is finished

			var allFinished = true;
			tabCollections.each(function(tab) {
				allFinished = (!tab.get('finishedPlayback')) ? false : true;
			});
			// check if all tabs are finished

			if (allFinished)
			{
				try {
					Backbone.history.start();
				} catch(e) {}
				// try to start backbone history, or update the hash
			}
		});
		// handle the finished playback backlog

		this.on('change:disabled', function(model, disabled)
		{
			if (selectedTab == model.cid && disabled)
				main.$chat.attr('disabled', 'disabled');
			else if (selectedTab == model.cid && !disabled)
				main.$chat.removeAttr('disabled');
			// disable the input form field
		});
		// disabled boolean

		this.on('change:loading', function(model, loading)
		{
			if (!loading && model.get('id') == selectedTab)
			{
				client.hideLoading();
				model.get('view').show();
			}
			else if (loading)
			{
				client.showLoading();
			}
		});
		// loading boolean

		this.on('change:unread', function(model, unread)
		{
			this.updateUnreadIcon(unread);
		});

		this.on('change:highlights', function(model, highlights)
		{
			this.updateHighlightIcon(highlights);

			totalHighlights = 0;
			tabCollections.each(function(tab) {
				totalHighlights = totalHighlights + tab.get('highlights');
			});
			// calculate number of highlights

			if (totalHighlights == 0)
				$('#favicon').attr('href', hostUrl + '/static/images/favicon.ico');
			else if (totalHighlights <= 10)
				$('#favicon').attr('href', hostUrl + '/static/images/' + totalHighlights + 'favicon.ico');
			else
				$('#favicon').attr('href', hostUrl + '/static/images/10pfavicon.ico');
			// update the favicon

			if (totalHighlights == 0)
				document.title = document.title.replace(/\([-0-9]+\) (.*)$/, '$1');
			else
				document.title = '(' + totalHighlights + ') ' + document.title.replace(/\([-0-9]+\) (.*)$/, '$1');
			// alter document title to add the highlight number to the front aswell.
		});
		// when highlights changes
	},

	playbackHandler: function()
	{
		var _this = this;
		this.$msgs.debounce('scroll', function(e)
		{
			if (_this.$msgs[0].scrollTop !== 0)
				return;
			// bail if its not at the top

			if ((this.get('type') == 'chan' || this.get('type') == 'query' || this.get('type') == 'window') && this.get('scrollLock') === false)
			{
				var network = this.get('network'),
					fromId = this.get('topEventId'),
					status = (this.get('type') == 'window') ? true : false,
					target = (status) ? userInfo.networks[network].nick.toLowerCase() : this.get('name');

				this.set({scrollLock: true, scrollPosition: -10, finishedPlayback: false, prependHTML: ''});
				// set the tab as locked so the user can't hit the top scroll again, could insert
				// double the messages and lock the fuck out of the browser, and all they need to do is hit
				// up a couple of times during loading.

				if (fromId == null || fromId == undefined || (fromId != undefined && fromId.charAt(0) == '-'))
				{
					this.$msgs.find('div.mcontainer div.row[data-id=' + fromId + ']').nextAll().each(function(index, element)
					{
						fromId = $(element).attr('data-id');
						if (fromId != undefined && fromId.charAt(0) != '-')
							return false;
					});
				}
				// determine if the topId is valid?
				
				this.$msgs.find('div.mcontainer div.row:first').addClass('historyLoad').removeClass('hide').empty().html('<div class="loader"><img src="/static/images/loader-1.gif" alt="Loading..." /></div>');
				// show the loading previous history message

				client.socket.emit('getBacklog', {network: network, target: target, id: fromId, status: status, limit: 100});
			}
		}.bind(this), 250);
		// create the top scroll events
	},

	updateUnreadIcon: function(count)
	{
		if (this.get('type') != 'chan' && this.get('type') != 'window')
			return;
		// skip other tabs other than channels

		var linkLi = this.$link.find('a:first-child'),
			linkSpan = linkLi.find('span.link'),
			unreadIcon = linkLi.find('span.unread'),
			highlightIcon = linkLi.find('span.highlight'),
			resetLinkSpan = '<span class="link">' + this.get('title') + '</span>';

		if (unreadIcon[0] == undefined && highlightIcon[0] == undefined && count > 0)
			linkLi.empty().html('<span class="alert unread">' + count + '</span>' + resetLinkSpan);
		else if (unreadIcon[0] == undefined && highlightIcon[0] != undefined && count > 0)
			linkLi.empty().html('<span class="alert unread">' + count + '</span>' + highlightIcon[0].outerHTML + resetLinkSpan);
		else if (count > 0)
			unreadIcon.text(count);
		else if (count <= 0)
			unreadIcon.empty().remove();
		// update the unread icon

		return this;
	},

	updateHighlightIcon: function(count)
	{
		var messageBar = this.$msgs.find('div.top-message-bar'),
			linkLi = this.$link.find('a:first-child'),
			linkSpan = linkLi.find('span.link'),
			unreadIcon = linkLi.find('span.unread'),
			highlightIcon = linkLi.find('span.highlight'),
			resetLinkSpan = '<span class="link">' + this.get('title') + '</span>';

		if (unreadIcon[0] == undefined && highlightIcon[0] == undefined && count > 0)
			linkLi.empty().html('<span class="alert highlight">' + count + '</span>' + resetLinkSpan);
		else if (unreadIcon[0] != undefined && highlightIcon[0] == undefined && count > 0)
			linkLi.empty().html(unreadIcon[0].outerHTML + '<span class="alert highlight">' + count + '</span>' + resetLinkSpan);
		else if (count > 0)
			highlightIcon.text(count);
		else if (count <= 0)
			highlightIcon.empty().remove();
		// update the highlight icon

		if (count <= 0)
			messageBar.find('span.highlight-extra').empty().remove();
		else
			messageBar.find('span.alert.highlight').text(count);
		// update message bar because highlights seen has changed

		return this;
	},

	defaultMessageBar: function(messages, highlightCount)
	{
		if (messages == undefined || messages == null || messages <= 0 || this.get('type') != 'chan')
			return;
		// some housekeeping

		var elements = this.$msgs.find('div.mcontainer div.row[data-type=privmsg][data-read=false]').length,
			messageBar = this.$msgs.find('div.top-message-bar'),
			plural = (messages == 1) ? 'message' : 'messages',
			hplural = (highlightCount == 1) ? 'highlight' : 'highlights',
			remaining = (messages > elements) ? (messages - elements) : 0,
			highlightMarkup = (highlightCount <= 0) ? '' : '<span class="highlight-extra"> and <span class="alert highlight">' + highlightCount + '</span> ' + hplural + '</span>',
			markup = '<span class="left"><span class="hide">' + remaining + '</span><span class="message-number">' + messages + '</span> new ' + plural + highlightMarkup + ' since your last visit</span><span class="right"><a href="#" id="read-backlog">Mark as read</a></span>';
		// variable definitions

		this.set({unread: messages, highlights: highlightCount});
		// update badges

		messageBar.empty().html(markup).show();
		// insert the message bar
	},

	reCalculateScrollState: function()
	{
		var _this = this,
			messageBar = this.$msgs.find('div.top-message-bar'),
			container = this.$msgs.find('div.mcontainer'),
			scrollBottom = container.height() + container.scrollTop(),
			scrollTop = scrollBottom - container.height(),
			elements = highlights = topUnread = bottomUnread = unreadElements = 0,
			markAsRead = false;
		// a lot of variables here. So much shit going on

		if (this.get('type') != 'chan' && this.get('type') != 'query' && this.get('type') != 'window')
			return false;
		// ignore other tabs

		container.find('div.row[data-type=privmsg][data-read=false], div.row[data-type=notice][data-read=false]').each(function(n)
		{
			var offset = (scrollTop == 0) ? 0 : 0,
				topOffset = $(this)[0].offsetTop - offset,
				elHeight = $(this)[0].clientHeight,
				realOffset = (topOffset + elHeight);
			
			elements++;

			if ((scrollTop == 0 || realOffset > scrollTop && topOffset < _this.get('scrollPosition')) && selectedTab == _this.cid && window.isActive)
			{
				if ($(this).attr('data-highlight') == 'true')
					highlights++;
				
				markAsRead = true;
				$(this).attr('data-read', 'true');
			}
			// mark messages in the visible viewport as read
			else
			{
				if (_this.get('scrollPosition') <= 0)
					topUnread++;
				else if (realOffset < scrollTop)
					topUnread++;
				else if (topOffset > _this.get('scrollPosition'))
					bottomUnread++;
			}
			// otherwise do some calculations
		});

		var remainingNumber = parseInt(messageBar.find('.hide').text()),
			topBarUnread = topUnread + remainingNumber,
			actuallyUnread = (_this.get('scrollPosition') < 0) ? topBarUnread : topBarUnread + bottomUnread,
			newHighlights = (_this.get('type') == 'query') ? actuallyUnread : _this.get('highlights') - highlights;

		if (topBarUnread <= 0 && messageBar.is(':visible'))
			messageBar.hide();
		// hide top message bar

		if (topBarUnread > 1)
		{
			if (!messageBar.is(':visible'))
				_this.defaultMessageBar(topBarUnread, newHighlights);
			// show the messagge bar
			else	
				messageBar.find('.message-number').text(topBarUnread);
			// update the message bar
		}

		if (actuallyUnread > 0 || !markAsRead)
		{
			clearTimeout(_this.scrollTimeout);
			_this.scrollTimeout = setTimeout(function()
			{
				var all = (container.find('div.row[data-type=privmsg][data-read=false], div.mcontainer div.row[data-type=notice][data-read=false]').length == 0) ? true : false;
				_this.markAsRead(all);
			}, 5000);
			// we wait 5 seconds, this means they've been finished scrolling for around 5 seconds
			// before we tell the server that we've read those messages. Lower is a waste of bandwidth
			// higher we run the risk of the messages never being marked if a refresh happens
		}

		_this.set({unread: actuallyUnread, highlights: newHighlights, scrollPosition: scrollBottom});
		// update badges
	},

	scrollHandler: function()
	{
		if (this.get('type') == 'chan' || this.get('type') == 'query' || this.get('type') == 'window')
		{
			this.$msgs.find('.content').unbind('scroll');
			this.$msgs.find('.content').debounce('scroll', this.reCalculateScrollState.bind(this), 50);
		}
	},

	markAsRead: function(all)
	{
		var messageBar = this.$msgs.find('div.message-bar');

		if (all)
		{
			this.$msgs.find('div.mcontainer div.row[data-type=privmsg][data-read=false], div.mcontainer div.row[data-type=notice][data-read=false]').each(function(n) {
				$(this).attr('data-read', 'true')
			});

			var query = (this.get('type') == 'chan') ? {network: this.get('network'), target: this.get('name'), status: false, privmsg: true} : {network: this.get('network'), target: this.get('name'), from: userInfo.networks[this.get('network')].nick, status: false, privmsg: true};
				query = (this.get('type') == 'window') ? {network: this.get('network'), status: true, privmsg: false} : query;

			client.socket.emit('markRead', query);
			messageBar.hide();
			// hide message bar
		}
		// mark everything as read
		else
		{
			var marked = this.get('msgsMarkedRead'),
				msgs = [];
				marked = (marked == undefined) ? [] : marked;

			this.$msgs.find('div.mcontainer div.row[data-type=privmsg][data-read=true], div.mcontainer div.row[data-type=notice][data-read=true]').each(function(n)
			{
				var id = $(this).attr('data-id');
				if (marked.indexOf(id) == -1)
					msgs.push(id);
			});
		}
		// otherwise there are records that have already been marked as read by the scrollhandler
		// let's get these records and send it to the backend.

		if (!all && msgs.length > 0)
		{
			this.set({msgsMarkedRead: marked.concat(msgs)});

			var query = (this.get('type') == 'chan') ? {network: this.get('network'), target: this.get('name'), ids: msgs, status: false, privmsg: true} : {network: this.get('network'), target: this.get('name'), from: userInfo.networks[this.get('network')].nick, ids: msgs, status: false, privmsg: true};
				query = (this.get('type') == 'window') ? {network: this.get('network'), status: true, privmsg: false, ids: msgs} : query;

			client.socket.emit('markRead', query);
		}
		// we've only been told to mark a few messages as read so we do that here
	}
});Parser = Backbone.Model.extend({
	
	prependedFTS: 0,
	prependedLTS: 0,
	prependedTabId: '',
	prependedMessages: '',

	message: function(data)
	{
		var message = new BufferMessageView(this, data);
		
		message = null;
	},

	notice: function(data)
	{
		var message = new BufferNoticeView(data);
		
		message = null;
    },

	other: function(tabId, chan, msg, type, data)
	{
		var prepend = data.prepend || false,
			last = data.last || false,
			noDate = data.noDate || false,
			message = new BufferOtherView({tabId: tabId, chan: chan, msg: msg, type: type, time: data.time, _id: data._id, prepend: prepend, last: last, noDate: noDate});
		
		message = null;
	},

	windowNotice: function(tabId, msg, prepend, date)
	{
		var date = date || null,
			message = new BufferWindowNoticeView({tabId: tabId, msg: msg, prepend: prepend, time: date});
		
		message = null;
	}
});

var parser = new Parser();EventHandler = Backbone.Model.extend({

	whoisData: [],
	
	topic: function(data, modify)
	{
		if (data.command == 'TOPIC')
		{
			var tabId = mem[data.network + '-chan-' + data.args[0].substr(1).toLowerCase()],
				tab = tabCollections.getByCid(tabId),
				chan = data.args[0],
				newArgs = data.args.slice();
				newArgs = newArgs.splice(1),
				user = tab.get('ulCollection').filter(function(model) { return model.get('user') == data.nick; }.bind(this)),
				userLink = (user[0] == undefined) ? Helper.generateUserLink(data.network, data.nick, data.user, data.host, data.userPrefix, false, false) : user[0].userLink(false);
			
			parser.other(tabId, chan, '&ndash; ' + userLink + ' has changed the topic to: ' + IRCParser.exec(newArgs.join(' '), userInfo.networks[data.network]), 'topic', data);
		}
	},

	who: function(network, chan, data)
	{
		var tab = tabCollections.getByCid(mem[network + '-chan-' + chan.toLowerCase().substr(1)]),
			collection = tab.get('ulCollection');
			collection.reset();
		
		for (var user in data)
		{
			data[user].cid = mem[network + '-chan-' + chan.toLowerCase().substr(1)];
			data[user].network = network;
			collection.add([new UserModel(data[user])], {silent: true});
		}
		// find the @/+ etc and fire it in

		collection.render();
	},

	join: function(data, modify)
	{
		if (data.nick == userInfo.networks[data.network].nick && modify)
		{
			this.meJoin(data, modify);
		}
		else
		{
			this.otherJoin(data, modify);
		}
	},

	otherJoin: function(data, modify)
	{
		var tabId = mem[data.network + '-chan-' + data.args[0].substr(1).toLowerCase()],
			tab = tabCollections.getByCid(tabId);
		
		if (modify)
			tab.get('ulCollection').add([new UserModel({cid: tabId, network: data.network, user: data.nick, prefix: '', modes: '', away: false, hostname: data.prefix})], {silent: false});
	
		var user = tab.get('ulCollection').filter(function(model) { return model.get('user') == data.nick; }.bind(this)),
			userLink = (user[0] == undefined) ? Helper.generateUserLink(data.network, data.nick, data.user, data.host, data.userPrefix, false, false) : user[0].userLink(false);
		
		parser.other(tabId, data.args[0], '&rarr; ' + userLink + ' (' + data.prefix + ') has joined', 'join', data);
		// if *someone else* is joining a channel..
	},

	meJoin: function(data, modify)
	{
		var tabId = actions.createWindow(data.network, data.args[0], 'chan'),
			tab = tabCollections.getByCid(tabId);

		tab.$list.find('.left').text('Users');
		actions.selectTab(tabId);
		// if *we're* joining a channel.

		if (tab != undefined)
		{
			tab.set({disabled: false});
			
			var linkText = tab.$link.find('a span.link').text();
			if (linkText.substr(0, 1) == '(' && linkText.substr(linkText.length - 1, 1) == ')')
			{
				tab.$link.find('a span.link').text(data.args[0]);
				parser.other(tabId, data.args[0], '&rarr; You have joined', 'join', data);
				// let the user know we've rejoined the channel.
			}
			// mark network tab as connected by changing it to IRCNode
		}
		// disable the tab :3
	},

	part: function(data, modify)
	{
		if (data.nick == userInfo.networks[data.network].nick && modify)
		{
			this.mePart(data, modify);
		}
		else
		{
			this.otherPart(data, modify);
		}
		// handle parts
	},

	otherPart: function(data, modify)
	{
		var tabId = mem[data.network + '-chan-' + data.args[0].substr(1).toLowerCase()],
			tab = tabCollections.getByCid(tabId),
			user = tab.get('ulCollection').filter(function(model) { return model.get('user') == data.nick; }.bind(this)),
			userLink = (user[0] == undefined) ? Helper.generateUserLink(data.network, data.nick, data.user, data.host, data.userPrefix, false, false) : user[0].userLink(false),
			message = (data.args.length == 1) ? '' : data.args.splice(1).join(' ');

		parser.other(tabId, data.args[0], '&larr; ' + userLink + ' (' + data.prefix + ') has left: ' + message, 'part', data);
		
		if (modify)
		{
			var user = tab.get('ulCollection').filter(function(model) { return model.get('user') == data.nick; });
			
			if (user[0] != undefined)
				tab.get('ulCollection').remove(user[0], {silent: false});
		}
		// if *someone else* is parting a channel..
	},

	mePart: function(data, modify)
	{
		var tabId = mem[data.network + '-chan-' + data.args[0].substr(1).toLowerCase()],
			tab = tabCollections.getByCid(tabId);

		if (tab == undefined)
			return;
		
		tab.$link.find('a span.link').text('(' + data.args[0] + ')');
		tab.$list.find('.left, .right').empty();
		tab.$list.find('ul').empty();
		// make it clear we've parted.
		
		if (tabCollections.getByCid(tabId) != undefined)
			tabCollections.getByCid(tabId).set({disabled: true});
		// disable the tab :3
	},

	quit: function(data, modify)
	{
		var tabId = mem[data.network + '-chan-' + data.args[0].substr(1).toLowerCase()],
			tab = tabCollections.getByCid(tabId);

		if (tab == undefined)
			return;

		var user = tab.get('ulCollection').filter(function(model) { return model.get('user') == data.nick; }.bind(this)),
			userLink = (user[0] == undefined) ? Helper.generateUserLink(data.network, data.nick, data.user, data.host, data.userPrefix, false, false) : user[0].userLink(false),
			message = (data.args.length == 1) ? '' : data.args.splice(1).join(' ');

		parser.other(tab.cid, tab.get('name'), '&larr; ' + userLink + ' (' + data.prefix + ') has quit: ' + message, 'quit', data);
		
		if (user[0] != undefined && modify)
			tab.get('ulCollection').remove(user[0], {silent: false});
		// if someone is quitting
	},

	kick: function(data, modify)
	{
		if (modify && data.args[1] == userInfo.networks[data.network].nick)
		{
			this.meKick(data, modify);
		}
		else
		{
			this.otherKick(data, modify);
		}
		// handle kick
	},

	otherKick: function(data, modify)
	{
		var tabId = mem[data.network + '-chan-' + data.args[0].substr(1).toLowerCase()],
			tab = tabCollections.getByCid(tabId),
			user = tab.get('ulCollection').filter(function(model) { return model.get('user') == data.nick; }.bind(this)),
			userLink = (user[0] == undefined) ? Helper.generateUserLink(data.network, data.nick, data.user, data.host, data.userPrefix, false, false) : user[0].userLink(false),
			user2 = tab.get('ulCollection').filter(function(model) { return model.get('user') == data.args[0]; }.bind(this)),
			userLink2 = (user[0] == undefined) ? Helper.generateUserLink(data.network, data.args[0], 'unknown', 'unknown', '', false, false) : user2[0].userLink(false);
		
		parser.other(tabId, data.args[0], '&larr; ' + userLink + ' has kicked ' + userLink2 + ' (' + data.args[2] + ')', 'kick', data);
		
		if (modify)
		{
			var user = tab.get('ulCollection').filter(function(model) { return model.get('user') == data.args[1]; });
			
			if (user[0] != undefined)
				tab.get('ulCollection').remove(user[0], {silent: false});
		}
		// if *someone else* is being kicked from a channel..
	},

	meKick: function(data, modify)
	{
		var tabId = mem[data.network + '-chan-' + data.args[0].substr(1).toLowerCase()],
			tab = tabCollections.getByCid(tabId);
	
		tab.$link.find('a span.link').text('(' + data.args[0] + ')');
		// make it clear we've been kicked.
		
		tab.set({disabled: true});
		// disable the tab :3
	},

	nick: function(data, modify)
	{
		// not worth splitting this function up into meNick and otherNick
		// as they are basically performing identical tasks
		// TODO - Look into the user button at the bottom not changing on nick change

		if (data.args[0].indexOf(' ') > -1)
			data.args = data.args[0].split(' ');

		var tabId = mem[data.network + '-chan-' + data.args[0].substr(1).toLowerCase()],
			tab = tabCollections.getByCid(tabId),
			user = tab.get('ulCollection').filter(function(model) { return model.get('user') == data.nick; }),
			network = tab.get('network');
		
		if (user[0] != undefined && modify)
		{
			var prefix = user[0].get('prefix'),
				away = user[0].get('away'),
				hostname = user[0].get('hostname'),
				modes = user[0].get('modes');

			tab.get('ulCollection').remove(user[0], {silent: false});
			tab.get('ulCollection').add([new UserModel({cid: tab.get('id'), network: network, user: data.args[1], prefix: prefix, modes: modes, away: away, hostname: hostname})], {silent: false});
			// update the userlist
		}

		if (data.args[1] == userInfo.networks[network].nick)
		{
			parser.other(tab.get('id'), tab.get('name'), '&ndash; You are now known as ' + data.args[1], 'nick', data);
			
			if (modify)
			{
				userInfo.networks[network].nick = data.args[1];
				if (network == selectedNet)
					$('label#nick-button').text(data.args[1]);
			}
		}
		else
		{
			var user = tab.get('ulCollection').filter(function(model) { return model.get('user') == data.args[1]; }.bind(this)),
				userLink = (user[0] == undefined) ? Helper.generateUserLink(data.network, data.args[1], data.user, data.host, data.userPrefix, false, false) : user[0].userLink(false);
				
			parser.other(tab.get('id'), tab.get('name'), '&ndash; ' + data.nick + ' is now known as ' + userLink, 'nick', data);
		}
		// show it in the channels
	},
	
	mode: function(data)
	{
		if (data.command == 'RPL_CHANNELMODEIS')
			return;

		var network = userInfo.networks[data.network],
			target = data.args[0],
			tabId = (Helper.isChannel(network, target)) ? mem[data.network + '-chan-' + target.toLowerCase().substr(1)] : mem[data.network + '-window'],
			tab = tabCollections.getByCid(tabId),
			tabName = (tab.get('name') == undefined) ? '' : tab.get('name'),
			user = tab.get('ulCollection').filter(function(model) { return model.get('user') == data.nick; }.bind(this)),
			userLink = (user[0] == undefined) ? Helper.generateUserLink(data.network, data.nick, data.user, data.host, data.userPrefix, false, false) : user[0].userLink(false),
			newModes = (Helper.isChannel(network, target)) ? data.args.slice(1) : data.args;
			newModes = newModes.join(' ');
		
		parser.other(tabId, tabName, '&ndash; ' + userLink + ' sets ' + newModes, 'mode', data);
		// handle MODE
	},

	handleTopic: function(tab, data)
	{
		tab.set({topic: data.topic});
		tabCollections.resetTopicBar(tab);
		// reset the topic bar with the new topic
	},

	handleMode: function(tab, data)
	{
		tab.set({modes: '+' + data.modes});
		tabCollections.resetTopicBar(tab);
		// reset the topic bar with the new mode
	},

	handleUsers: function(tab, data)
	{
		for (var n in data.users)
		{
			var record = data.users[n],
				user = tab.get('ulCollection').filter(function(model) { return model.get('user') == record.user; });

			if (user[0] == undefined)
				return;
			// get the user and do some checking

			tab.get('ulCollection').remove(user[0], {silent: false});
			tab.get('ulCollection').add([new UserModel({cid: tab.get('id'), network: data.network, user: record.user, prefix: record.prefix, modes: record.modes, away: record.away, hostname: record.hostname})], {silent: false});
			// update the userlist
		}
		// loop through the changed users
	},

	away: function(data)
	{
		tabCollections.each(function(tab)
		{
			if (tab.get('network') != data.network)
				return;
			
			var user = tab.get('ulCollection').filter(function(model) { return model.get('user') == data.nick; }),
				away = (data.args[0] == undefined || data.args[0] == '' || data.args[0] == ':') ? false : true;

			user.set({away: away});
		});
		// for each channel that the nick is in handle it
	},

	listError: function(network, error)
	{
		var tabId = mem[network + '-other-list'];
		
		if (tabId == undefined)
		{
			var tabId = actions.createWindow(network, '/list', 'other'),
				tab = tabCollections.getByCid(tabId);
		}
		// create a new tab

		actions.selectTab(tabId);
		// select the tab

		tab.$table.empty().append('<thead><tr class="heading"><th>Channel</th><th>Users</th><th>Topic</th></tr></thead><tbody><tr><td colspan="3">' + error + '</td></tr></tbody>');
		tab.$link.find('a:first span.link').removeClass('net-loader').addClass('net-loaded');
		// if the table is empty, add a heading row
	},

	listStart: function(network)
	{
		var tabId = mem[network + '-other-list'];
		
		if (tabId == undefined)
		{
			var tabId = actions.createWindow(network, '/list', 'other'),
				tab = tabCollections.getByCid(tabId);
		}
		// create a new tab

		actions.selectTab(tabId);
		// select the tab

		tab.$table.empty().append('<thead><tr class="heading"><th>Channel</th><th>Users</th><th>Topic</th></tr></thead><tbody></tbody>');
		// if the table is empty, add a heading row
	},

	listEnd: function(network, buffer)
	{
		var tabId = mem[network + '-other-list'],
			tab = tabCollections.getByCid(tabId),
			list = new BufferListView({tabId: tabId, network: network, list: buffer});

		list = null;
		
		tab.$link.find('a:first span.link').removeClass('net-loader').addClass('net-loaded');
		tab.$table.tablesorter();
		// tell it to happen soon, as tablesorter errors for some reason
	},

	links: function(data)
	{
		parser.other(mem[data.network + '-other-links'], 'links', data.args.join(' '), 'other', data);
	},

	linksEnd: function(data)
	{
		var tabId = mem[data.network + '-other-links'],
			tab = tabCollections.getByCid(tabId);

		tab.$link.find('a:first span.link').removeClass('net-loader').addClass('net-loaded');
		tab.$table.tablesorter();
		// change some css and do the tablesorter.
	},

	motdStart: function(data)
	{
		parser.other(mem[data.network + '-window'], '', IRCParser.exec(data.args[1], userInfo.networks[data.network]), 'motd', data);
	},

	motd: function(data)
	{
		parser.other(mem[data.network + '-window'], '', IRCParser.exec(data.args[1], userInfo.networks[data.network]), 'motd', data);
	},

	motdEnd: function(data)
	{
		var tabId = mem[data.network + '-window'],
			tab = tabCollections.getByCid(tabId);

		tab.$msgs.scrollTop(tab.$msgs.find('.content').height());
	},

	numeric: function(data)
	{
		var tabId = mem[data.network + '-window'];
		parser.other(tabId, '', data.args.slice(1).join(' '), 'event', data);
	},

	error: function(data)
	{
		var tabId = mem[data.network + '-window'];
		parser.windowNotice(tabId, data.args.join(' '), false);
		actions.windowConnectState(data.network, tabId, 'closed', true, false);
	},

	invite: function(data)
	{
		var string = IRCParser.exec('You have been invited to ' + data.args[1] + ' by ' + data.args[0], userInfo.networks[selectedNet]);
		parser.other(selectedTab, '', string, 'event', data);
	},

	inviting: function(data)
	{
		var string = IRCParser.exec('You have invited ' + data.args[1] + ' to ' + data.args[2], userInfo.networks[selectedNet]);
		parser.other(selectedTab, '', string, 'event', data);
	},

	whois: function(data)
	{
		var whoisData = [],
			whoisView = new BufferWhoisView({network: data.network, user: data.nick});

		whoisData.push('(' + data.nick + '!' + data.info.user + '@' + data.info.host + '): ' + data.info.realname);
		
		if (data.info.channels != undefined)
			whoisData.push(IRCParser.exec(data.info.channels.join(' '), userInfo.networks[data.network]));

		whoisData.push(data.info.server + ': ' + data.info.serverinfo);
		// start constructing our whois data

		delete data.info.user;
		delete data.info.nick;
		delete data.info.host;
		delete data.info.realname;
		delete data.info.channels;
		delete data.info.server;
		delete data.info.serverinfo;
		// remove already used info

		for (var line in data.info)
			whoisData.push(data.info[line]);

		whoisView.render(whoisData);
		whoisView = null;
	}
});

var eventHandler = new EventHandler();UserModel = Backbone.Model.extend({
	
	initialize: function(options)
	{
		if (options.user == undefined) return;

		var hash = options.cid + '-' + this.cid,
			prefix = (options.prefix == '') ? 'Z' : userInfo.networks[options.network].extra.orderedStatusPrefix[options.prefix];
		// define some variables

		var prefixIcon = (prefix == 'Z') ? '&nbsp;' : options.prefix,
			hostname = options.hostname.split('@'),
			firstMode = options.modes.charAt(0),
			className = 'user';

		if (firstMode == 'q' || firstMode == 'a' || firstMode == 'o')
			className = 'op';
		else if (firstMode == 'h')
			className = 'halfop';
		else if (firstMode == 'v')
			className = 'voice';

		this.set({sortBy: prefix + options.user.toLowerCase()});
		this.modes = options.modes;
		this.prefix = options.prefix;
		this.ident = hostname[0]
		this.hostname = hostname[1];
		this.away = options.away;
		this.user = options.user;
		// set some variables

		this.aHref = Helper.generateUserLink(options.network, this.user, this.ident, this.hostname, this.prefix, options.away, true);
		this.el = 'li#user-' + hash;
		this.$el = '<li id="user-' + hash + '" data-type="'+ className + '">' + this.aHref + '</li>';
		// create the element
	},

	userLink: function(showPrefix)
	{
		var showPrefix = (showPrefix == undefined) ? true : showPrefix,
			href = $(this.$el).find('a')[0].outerHTML;

		if (!showPrefix)
		{
			href = href.replace(/\<span class=\"(prefix|prefix[^"]+)+\"\>[^\<]+\<\/span\>/i, '');
			return href;
		}
		else
		{
			return href;
		}
	}
});UserInfoParser = Backbone.Model.extend({
	
	incoming: function(data)
	{
		userInfo.account_type = data.account_type;
		userInfo.ident = data.ident;
		userInfo.ip = data.ip;
		userInfo.is_connected = (data.is_connected == undefined) ? false : data.is_connected;
		userInfo.logged_in = data.logged_in;
		userInfo.realname = data.real;
		userInfo.nickname = data.nick;
	},

	networks: function(data)
	{
		userInfo.networks = {};
		
		for (var network in data)
			this.addNetwork(network, data[network], false, function() {});
		// handle incoming userinfo.

		if ($.isEmptyObject(userInfo.networks[network]) && connected)
		{
			client.showNoNetworks().hideLoading();
			Backbone.history.start();
		}
		// no networks? handle this and do not proceed
		else
		{
			client.hideNoNetworks();
			if (window.location.hash == '' || window.location.hash == '#' || window.location.hash == '#!/')
				actions.selectTab(tabCollections.at(0).get('id'));
			// show everything
		}
		// there are networks, carry on sir.
	},

	addNetwork: function(network, networkInfo, now, callback)
	{
		var tabdata = {},
            tabId = '',
            alphabetStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            userInfo.networks[network] = networkInfo,
            extra = (now) ? {scrollLock: true} : {scrollLock: false};

		if (networkInfo.extra != undefined)
		{
			networkInfo.extra.orderedStatusPrefix = {};
			for (var i in networkInfo.extra.statusPrefix)
				networkInfo.extra.orderedStatusPrefix[networkInfo.extra.statusPrefix[i]] = alphabetStr.charAt(i);
		}
		// convert !/~/&/@/%/+ etc into a/b/c/d/e/f so they can be alphabetically ordered.

		if (netinfo[network] !== undefined)
		{
			tab = tabCollections.filter(function(tab) { return tab.get('rId') == network + '-window' })[0];
			
			if (networkInfo.status == 'connected')
				tab.$link.find('a:first-child span.link').text(networkInfo.name);
			
			callback();
			return {};
		}
		// network already exists, thats fine. bail!

		$('div#sidebar div#network').append($('<ul id="network-' + $.fastEncode(network) + '"></ul>'));
		tabId = actions.createWindow(network, networkInfo.name, 'window', extra);
		newData = true;
		
		if (networkInfo.status == 'connected')
		{
			for (var chan in networkInfo.chans)
				tabId = actions.createWindow(network, chan, 'chan', extra);
		}
		// we're connected, so just open the channel windows.

		netinfo[network] = networkInfo;
		tabdata.network = network;
		tabdata.chan = chan;
		tabdata.tabId = tabId;

		callback();

		return tabdata;
	}
});

var userInfoParser = new UserInfoParser();TabCollection = Backbone.Collection.extend({

	model: TabModel,

	/*
	 * changeTitleBar
	 *
	 * updates the title bar with new information
	 */
	changeTopicBar: function(chan, modes, tabId, topic)
	{
		$('.topbar .chan-title').text(chan);
		$('.topbar .chan-modes').text(modes);
		$('.topbar .chan-desc').empty().show().html(topic);
		$('.topbar .chan-desc').attr('data-id', tabId);
	},

	/*
	 * resetTopicBar
	 *
	 * reset / resize the topic bar
	 */
	resetTopicBar: function(tab)
	{
		if (tab.get('type') != 'window')
		{
			var maxPX = ($(window).width() - ($('.topbar a.brand').width() + 450 + $('.topbar .chan-title').width() + $('.topbar .chan-modes').width())),
				topic = (tab.get('topic') == null) ? '' : tab.get('topic'),
				modes = (tab.get('modes') == null) ? '' : tab.get('modes'),
				chars = modes.length + tab.get('name').length + topic.length;
			
			this.changeTopicBar(tab.get('name'), modes.split(' ')[0], tab.get('id'), IRCParser.exec(topic, userInfo.networks[tab.get('network')]));
			// calculate how much space we got for the topic and channel name?

			tab.$msgs.find('div.overlay-bar').empty().html('<span class="channel-name">' + tab.get('name') + '</span> <span class="modes">' + modes + '</span> <span class="topic">' + IRCParser.exec(topic, userInfo.networks[tab.get('network')]) + '</span>');
		}
	}
});

var tabCollections = new TabCollection([]);UserCollection = Backbone.Collection.extend({

	model: UserModel,
	heads: [
		{
			name: 'Operators',
			type: 'op'
		},
		{
			name: 'Half operators',
			type: 'halfop'
		},
		{
			name: 'Voiced',
			type: 'voice'
		},
		{
			name: 'Users',
			type: 'user'
		}
	],

	initialize: function(options)
	{
		this.tab = options.tab;
		this.el = options.view.userList.el;
		
		this.on('add', function(object) {
			this.addLIElement(object);
		});

		this.on('remove', function(object) {
			this.removeLIElement(object);
		});
	},

	_comparator: function(o)
	{
		return o.get('sortBy');
	},

	sorter: function()
	{
		this.comparator = this._comparator;
		this.sort().sort();
		this.comparator = undefined;
	},

	addLIElement: function(object)
	{
		this.sorter();
		
		var me = $(this.el),
			el = $(object.$el),
			enterAt = this.indexOf(object) + 1;
		// find out where to enter it in the <ul>

		if (this.at(enterAt) != undefined)
			el.insertBefore(this.at(enterAt).el);
		else if (this.at(enterAt + 1) != undefined)
			el.insertBefore(this.at(enterAt + 1).el);
		else
			me.find('ul').append(el);
		// determine where we enter it at.

		me.find('div.members-title span.right').text(this.length);

		this.renderHeaders(me);
	},

	removeLIElement: function(object)
	{
		var me = $(this.el),
			el = $(object.el);

		el.empty().remove();
		me.find('div.members-title span.right').text(this.length);
		
		this.renderHeaders(me);
	},

	renderHeaders: function(me)
	{
		for (var head in this.heads)
		{
			var name = this.heads[head].name,
				type = this.heads[head].type,
				first = me.find('ul li[data-type=' + type + ']:first'),
				head = me.find('ul li[data-type=' + type + '-head]'),
				num = me.find('ul li[data-type=' + type + ']').length,
				element = $('<li data-type="' + type + '-head" class="clear"><span class="left">' + name + '</span><span class="right">' + num + '</span></li>');
			
			$.when(head.remove()).done(function()
			{
				element.insertBefore(first);
			});
		}
		// loop through them, construct and add them
	},

	render: function()
	{
		var _this = this,
			htmlBuffer = '',
			me = $(_this.el);

		_this.sorter();
		_this.each(function(model) {
			if (model.$el != undefined)
				htmlBuffer += model.$el;
		});

		me.find('ul').empty().remove();
		me.find('div.members-title span.right').text(_this.length);
		$.when(me.append('<ul>' + htmlBuffer + '</ul>')).done(function()
		{
			_this.renderHeaders(me);
			// render headings
		});
		
		_this.tab.set({loading: false});
		
		return _this;
	}
});$.escape = function(text) { 
	return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

/*
 * $.serializeObject()
 *
 * Basically the same as $.serializeArray(), however, returns an object
 */
$.fn.serializeObject = function()
{
	var o = {};
	$.each(this.serializeArray(), function()
	{
		if (o[this.name] !== undefined)
		{
			if (!o[this.name].push)
				o[this.name] = [o[this.name]];
			o[this.name].push(this.value || '');
		}
		else
		{
			o[this.name] = this.value || '';
		}
	});
	return o;
};

/*
 * $.reset()
 *
 * Resets a form
 */
$.fn.reset = function ()
{
	$(this).each(function()
	{
		if ($(this).attr('type') != 'submit' || $(this).attr('type') != 'button')
			this.reset();
	});
};

/*
 * $.fastEncode()
 *
 * Function used to encode nicknames
 */
$.fastEncode = function(str)
{
	var hash = 0;
	if (str.length == 0) return hash;
	for (i = 0; i < str.length; i++)
	{
		hash = ((hash << 5) - hash) + str.charCodeAt(i);
		hash = hash & hash; // Convert to 32bit integer
	}
	return hash;
};

/*
 * $.isAtBottom()
 *
 * Function to determine if div is at the bottom.
 */
$.fn.isAtBottom = function()
{
	var inner = $(this).find('div.mcontainer'),
		row = inner.children('div.row:last-child');

	return ($(this)[0].scrollHeight - $(this).scrollTop() - $(this).outerHeight() - row.height() == 0);
};

/*
 * $.parse(network, inputText)
 *
 * Parse everything that gets outputted to the channel window, bold tags, links, etc.
 */
$.parse = function(network, inputText)
{
	if (inputText == undefined) return;

	return IRCParser.exec(inputText, userInfo.networks[network]);
};

/*
 * $.generateTime(time, extended)
 *
 * Generate a fancy timestamp, like 13:46 PM
 */
$.generateTime = function(time, extended)
{
	if (time == undefined)
		time = new Date();
	
	var ap = 'AM',
		now = new Date(time),
		hour = now.getHours(),
		minute = now.getMinutes();
		minute = (minute < 10) ? '0' + minute : minute,
		day = now.getDate(),
		day = (day < 10) ? '0' + day : day,
		month = now.getUTCMonth() + 1,
		month = (month < 10) ? '0' + month : month,
		year = now.getUTCFullYear();

	if (hour > 11) ap = 'PM';
	if (hour > 12) hour = hour - 12;
	if (hour == 0) hour = 12;
	
	if (extended)
		return day + '/' + month + '/' + year + ' ' + hour + ':' + minute + ' ' + ap;
	else
		return hour + ':' + minute + ' ' + ap;
};

$.generateTimestamp = function(time)
{
	if (time == undefined)
		time = new Date();
	
	var now = new Date(time),
		hour = now.getHours();
		hour = (hour < 10) ? '0' + hour : hour;
		minute = now.getMinutes();
		minute = (minute < 10) ? '0' + minute : minute;
		seconds = now.getSeconds();
		seconds = (seconds < 10) ? '0' + seconds : seconds;
	
	return hour + ':' + minute + ':' + seconds;
};

/*
 * $.generateAltTime(secs)
 *
 * Generate a a 00:00:00 from a number of seconds
 */
$.generateAltTime = function(secs)
{
	var hours = Math.floor(secs / (60 * 60)),
		hours = (hours.toString().length == 1) ? '0' + hours : hours,
		divisorForMinutes = secs % (60 * 60),
		minutes = Math.floor(divisorForMinutes / 60),
		minutes = (minutes.toString().length == 1) ? '0' + minutes : minutes,
		divisorForSeconds = divisorForMinutes % 60,
		seconds = Math.ceil(divisorForSeconds),
		seconds = (seconds.toString().length == 1) ? '0' + seconds : seconds;
   
	return hours + ':' + minutes + ':' + seconds;
};

/*
 * $.dateTimeBar()
 *
 * Determine if a date divider should be inserted, if so return the html
 */
$.dateTimeBar = function(tab, time, prepend, force)
{
	var force = force || false,
		timeDate = time.getDate() + '/' + time.getMonth() + '/' + time.getFullYear(),
		rTimeDate = tab.get('lastTime').getDate() + '/' + tab.get('lastTime').getMonth() + '/' + tab.get('lastTime').getFullYear(),
		rpTimeDate = tab.get('lastTimeP').getDate() + '/' + tab.get('lastTimeP').getMonth() + '/' + tab.get('lastTimeP').getFullYear(),
		newDate = new Date(time);
  
	if (!force)
	{
		if (prepend)
		{
			if (timeDate != rpTimeDate)
				tab.set({lastTimeP: time});
			else
				return null;
		}
		else
		{
			if (timeDate != rTimeDate)
				tab.set({lastTime: time});
			else
				return null;
		}
	}
	// we're not forcing it so it doesn't matter

	var dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
		monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
		date = dayNames[newDate.getDay()] + ', ' + newDate.getDate() + ' ' + monthNames[newDate.getMonth()] + ' ' + newDate.getFullYear(),
		prevSelector = tab.$msgs.find('div.mcontainer div.row[data-type=date-divider]:last');

	var markup = $.tmpl('dividerRow', {
		type: 'date-divider',
		message: date
	});

	if (!force && prevSelector.length != 0 && prevSelector.html() == markup.html())
		return null;
	// this is a failsafe measure (although we're not able to completely rely on it unfortunately)
	// this also removes duplicates from query windows

	return markup;
};

/*
 * $.findNetworkFromId(id)
 *
 * Find network data from id (irc.soandso.net:6667)..
 */
$.findNetworkFromId = function(id)
{
	for (network in userInfo.networks)
	{
		if (userInfo.networks[network].url == id)
			return network;
	}

	return false;
};

var main = {},
	mem = {},
	netinfo = {},
	actions = {},
	userInfo = {},
	cookieData = {},
	editNet = null,
	selectedNet = null,
	selectedChan = null,
	selectedTab = null,
	fullContentWidth = 0,
	height = 0,
	tabHeight = 0,
	borderPadding = 2,
	dblBorderPadding = borderPadding * 2,
	listPadding = 6,
	largePadding = 20,
	inputPadding = 46,
	messageWidth = 0,
	userListWidth = 170,
	maxMsgCount = 250,
	previousHashes = [],
	connected = false,
	loggedIn = true;
	// set some global variables up

	window.isActive = true;

	Templates.preDefine();
	IRCParser.initialise();
	// initialise our parser

/*
 * document.ready
 *
 * Everything that is executed when the DOM is ready is inside here
 */
$(window).load(function()
{
	/*
	 * callInitJSON
	 *
	 * Callback function for $.getJSON('/init');
	 */
	callInitJSON = function(data)
	{
		if (data.logged_in && data.endpoint == null)
		{
			client.hideLoading();
			client.onClose(true);
		}
		// if node is unreachable
		else if (data.logged_in)
		{
			loggedIn = true;
			$('div#holder').show();
			client.connect(data);
		}
		// we're logged in, connect the client
		else
		{
			loggedIn = false;
			client.onLoggedOut();
			client.hideLoading();
		}
		// we're logged out, or the node information is bogus
	};

	/*
	 * updateInitJSON
	 *
	 * Callback function for $.getJSON('/init'), except don't connect
	 */
	updateInitJSON = function(data)
	{
		if (data.logged_in)
			client.connect(data, false);
		// we're logged in, update everything
	};

	/*
	 * executeInitJSON
	 *
	 * Execute callInitJSON with a try catch and error handler
	 */
	executeInitJSON = function()
	{
		try
		{
			$.getJSON('/init', callInitJSON);
			// run init to see if we're logged in or not.
		}
		catch (error)
		{
			client.hideLoading();
			client.onClose(true);
			// obviously failed to load resource
		}
	};

	executeInitJSON();
		
	/*
	 * notifier
	 *
	 * Notifier class 
	 */
	notifier = {

		api: null,
		stack: {},

		checkPermissions: function()
		{
			if (window.Notification)
				this.api = window.Notification;

			if (window.webkitNotifications)
				this.api = window.webkitNotifications;

			if (this.api == null)
				return false;

			return ((this.api == window.Notification && Notification.permissionLevel === 'granted') ||
					(this.api == window.webkitNotifications && window.webkitNotifications.checkPermission() == 0));
		},

		requestPermission: function()
		{
			if (this.api == window.Notification)
				Notification.requestPermission();

			if (this.api == window.webkitNotifications)
				window.webkitNotifications.requestPermission();
		},

		notify: function(id, network, chan, msg)
		{
			if (!notifier.checkPermissions())
				return null;
			// no permissions

			if (this.api == window.Notification)
				var notification = new Notification(userInfo.networks[network].name + ' / ' + chan, msg, {tag: id});
			else if (this.api == window.webkitNotifications)
				var notification = window.webkitNotifications.createNotification('', userInfo.networks[network].name + ' / ' + chan, msg);

			notification.show();
			notifier.stack[id] = notification;

			setTimeout(function() {
				var notification = notifier.stack[id];
					notification.cancel();

				notifier.stack[id] = null;
			}, 5000);
			// let's show the notification!
		}
	};

	/*
	 * actions
	 *
	 * Actions object that contains things like createWindow, selectTab, destroyWindow etc.
	 */
	actions = {

		/* 
		 * selectTab
		 * 
		 * change the selected tab
		 */
		selectTab: function(tabId)
		{
			if (window.location.hash.substr(1, 1) == '?')
				return;
			// bail incase we've got ? on the go
			
			$('div#home-content').hide();
			$('div#footer div.link').removeClass('selected');

			if (tabCollections.size() == 1)
				client.hideNoNetworks();

			if (selectedTab == tabId)
			{
				tabCollections.getByCid(tabId).get('view').hide();
				tabCollections.getByCid(tabId).get('view').show();
				return;
			}

			if (tabCollections.getByCid(selectedTab) != undefined)
				tabCollections.getByCid(selectedTab).get('view').hide();

			if (tabCollections.getByCid(tabId) != undefined)
			{
				tabCollections.getByCid(tabId).get('view').show();
				client.socket.emit('changeTab', {tab: tabCollections.getByCid(tabId).get('rId'), active: window.isActive});
				// send the current tab to the server (so we can remember what the last one was (Y))
			}
		},

		/* 
		 * createWindow
		 * 
		 * create a new tab
		 */
		createWindow: function(network, chan, type, extra)
		{
			var oNetwork = network,
				extra = extra || {},
				oChan = chan;

				network = network;
				chan = chan.toLowerCase();
				ulId = 'ul#network-' + $.fastEncode(network);

			if (type == 'chan')
				var rTabId = network + '-chan-' + chan.substr(1);
			else if (type == 'query')
				var rTabId = network + '-query-' + chan;
			else if (type == 'window')
				var rTabId = network + '-window';
			else if (type == 'other')
				var rTabId = network + '-other-' + chan.substr(1);
			else
				return;
			// set some variables based on the type

			if (mem[rTabId] != undefined)
			{
				return mem[rTabId];
			}
			else
			{
				var tab = new TabModel({rId: rTabId, ulId: ulId, network: oNetwork, chan: oChan, type: type, extra: extra});
				return tab.get('id');
			}
		},

		/* 
		 * destroyWindow
		 * 
		 * destroy an existing tab cleanly
		 */
		destroyWindow: function(tabId, remove)
		{
			var tab = tabCollections.getByCid(tabId);
			if (tab != undefined)
			{
				if (tab.get('type') == 'window' && remove)
					var r = confirm("Are you sure you want to remove this network? Please note that your logs will be removed, you can download them in the log viewer.");

				if ((!remove || (remove && tab.get('type') == 'window' && r == true)) || tab.get('type') != 'window')
					tab.get('view').destroy(remove);
			}
		},

		/* 
		 * windowConnectState
		 * 
		 * change a windows connection state
		 */
		windowConnectState: function(network, tabId, state, silent, data)
		{
			var silent = silent || false,
				prepend = data.prepend || false,
				date = data.time || null;

			if (state == 'connected')
			{
				tabCollections.each(function(tab)
				{
					if (userInfo.networks[tab.get('network')] == undefined) return;
					// network doesn't exist but tab does? idk, bail anyway.
					
					var linkText = tab.$link.find('a span.link').text(),
						port = (userInfo.networks[tab.get('network')].secure) ? '+' + userInfo.networks[tab.get('network')].port : userInfo.networks[tab.get('network')].port;
					
					if (tab.cid == tabId && linkText.substr(0, 1) == '(')
						tab.$link.find('a:first-child span.link').text(linkText.substr(1, linkText.length - 2)).removeClass('net-loader').addClass('net-loaded');
					// mark network tab as connected by changing it to IRCNode

					if (tab.get('network') == network)
						tab.set({disabled: false});
					// mark tab as enabled

					if (tab.get('network') == network && tab.get('type') == 'window')
					{
						parser.windowNotice(tab.cid, 'Connected to ' + userInfo.networks[network].name + ' (' + userInfo.networks[network].host + ':' + port + ')...', prepend, date);
						
						tab.$link.find('span.link').removeClass('net-loader').addClass('net-loaded');
						$('a#connect-link').text('Disconnect');
					}
					// mark it as connected

					if (selectedTab == tab.cid)
						$('a#close-link').addClass('danger').text('Disconnect');
				});
				// mark all tabs as connected
			}
			else if (state == 'connecting')
			{
				tabCollections.each(function(tab)
				{
					if (userInfo.networks[tab.get('network')] == undefined) return;
					// network doesn't exist but tab does? idk, bail anyway.
					
					var linkText = tab.$link.find('a span.link').text(),
						port = (userInfo.networks[tab.get('network')].secure) ? '+' + userInfo.networks[tab.get('network')].port : userInfo.networks[tab.get('network')].port;
					
					if (tab.cid == tabId && linkText.substr(0, 1) == '(')
						tab.$link.find('a:first-child span.link').text(linkText.substr(1, linkText.length - 2)).removeClass('net-loaded').addClass('net-loader');
					else if (tab.get('network') == network && linkText.substr(0, 1) == '(')
						tab.$link.find('a:first-child span.link').text(linkText.substr(1, linkText.length - 2)).removeClass('net-loader');
					// mark network tab as connected by changing it to IRCNode

					if (tab.get('network') == network && tab.get('type') == 'window')
					{
						parser.windowNotice(tab.cid, 'Connecting to ' + userInfo.networks[network].name + ' (' + userInfo.networks[network].host + ':' + port + ')...', prepend, date);
						$('a#connect-link').text('Disconnect');
					}
					// find all tabs matching the network and determine the size it needs to be

					if (selectedTab == tab.cid)
						$('a#close-link').addClass('danger').text('Disconnect');
				});
				// mark all tabs as connected
			}
			else if (state == 'disconnected' || state == 'closed' || state == 'failed')
			{
				tabCollections.each(function(tab)
				{
					if (userInfo.networks[tab.get('network')] == undefined) return;
					// network doesn't exist but tab does? idk, bail anyway.

					var message = 'Disconnected from ' + userInfo.networks[network].name + ', would you like to <a href="#" class="connect-link" data-content="' + network + '">connect</a>?',
						linkText = tab.$link.find('a:first-child span.link').text();

					if (state == 'failed')
						message = 'Failed to reconnect to ' + userInfo.networks[network].name + ', would you like to manually <a href="#" class="connect-link" data-content="' + network + '">reconnect</a>?';
					// different message for a different state

					if (tab.cid == tabId && linkText.substr(0, 1) != '(')
						tab.$link.find('a:first-child span.link').text('(' + linkText + ')').removeClass('net-loader').addClass('net-loaded');
					// do the opposite and turn IRCNode into (IRCNode)

					if (tab.get('network') == network)
					{
						tab.set({disabled: true});
						// mark tab as disabled

						if (tab.get('type') != 'window' && !silent)
							actions.destroyWindow(tab.cid, true);
						else if (tab.get('type') != 'window' && silent && linkText.substr(0, 1) != '(')
							tab.$link.find(' a:first-child span.link').text('(' + linkText + ')');
						else if (tab.get('type') == 'window')
							parser.windowNotice(tab.cid, message, prepend, date);
					
						$('a#connect-link').text('Connect');

						if (selectedTab == tab.cid)
							$('a#close-link').addClass('danger').text('Close');
					}
					// this tab is under network, so remove it.
				});
				// mark all tabs as disconnected.
			}
			// are we disconnected?
		},

		/* 
		 * nickNameInUse
		 * 
		 * handle ERR_NICKNAMEINUSE
		 */
		nickNameInUse: function(network, tabId, data)
		{
			parser.windowNotice(tabId, 'Nickname ' + data.args[1] + ' in use, please choose another one...', false);
			main.chat.setValue('/nick ');
			main.$chat.focus();
		}
	};

	$(window).resize(function(e)
	{		
		var oldWidth = fullContentWidth;
			fullContentWidth = ($(this).width() - $('#sidebar').outerWidth());
			height = $(this).height();
			tabHeight = height - (inputPadding + $('.topbar').outerHeight()),
			footerHeight = 0;
		// here we resize height and stuff.

		$('div#content-container div#content, div#inner-content').height($('div#holder').outerHeight() - $('.topbar').outerHeight() - 4);
		$('div#sidebar').height($(this).height() - ($('div.sidebar div.header').outerHeight() + $('div.sidebar div#footer').outerHeight()));
		// resize the content
		
		var tab = tabCollections.getByCid(selectedTab);
			tab.get('view').reDraw(true);

		tabCollections.resetTopicBar(tab);
		// reset the topic bar size
	});
});
