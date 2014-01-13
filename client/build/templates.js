this["App"] = this["App"] || {};
this["App"]["TEMPLATES"] = this["App"]["TEMPLATES"] || {};

this["App"]["TEMPLATES"]["client/templates/index.hbs"] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
  var buffer = '', stack1, hashTypes, hashContexts, options, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;


  data.buffer.push("<!doctype html>\r\n<html>\r\n	<head>\r\n		<title>Title of the document</title>\r\n\r\n		<script src=\"//js/lib/ember.js\"></script>\r\n		<script src=\"//js/lib/handlebars.js\"></script>\r\n		<script src=\"//socket.io/socket.io.js\"></script>\r\n	</head>\r\n	<body>\r\n		<div id=\"main-holder\" class=\"clear\">\r\n			<div class=\"topbar clear main\">\r\n				<ul id=\"main-menu\">\r\n					<li class=\"logo\"><a href=\"");
  hashTypes = {};
  hashContexts = {};
  options = {hash:{},contexts:[depth0],types:["STRING"],hashContexts:hashContexts,hashTypes:hashTypes,data:data};
  data.buffer.push(escapeExpression(((stack1 = helpers.pathFor || depth0.pathFor),stack1 ? stack1.call(depth0, "home", options) : helperMissing.call(depth0, "pathFor", "home", options))));
  data.buffer.push("\">IRCAnywhere</a></li>\r\n					<li><a href=\"");
  hashTypes = {};
  hashContexts = {};
  options = {hash:{},contexts:[depth0],types:["STRING"],hashContexts:hashContexts,hashTypes:hashTypes,data:data};
  data.buffer.push(escapeExpression(((stack1 = helpers.pathFor || depth0.pathFor),stack1 ? stack1.call(depth0, "signup", options) : helperMissing.call(depth0, "pathFor", "signup", options))));
  data.buffer.push("\">Signup</a></li>\r\n				</ul>\r\n				<div class=\"topbar inner\"></div>\r\n			</div>\r\n			");
  hashTypes = {};
  hashContexts = {};
  data.buffer.push(escapeExpression(helpers._triageMustache.call(depth0, "yield", {hash:{},contexts:[depth0],types:["ID"],hashContexts:hashContexts,hashTypes:hashTypes,data:data})));
  data.buffer.push("\r\n			<div id=\"main-footer\">\r\n				<p><a href=\"");
  hashTypes = {};
  hashContexts = {};
  options = {hash:{},contexts:[depth0],types:["STRING"],hashContexts:hashContexts,hashTypes:hashTypes,data:data};
  data.buffer.push(escapeExpression(((stack1 = helpers.pathFor || depth0.pathFor),stack1 ? stack1.call(depth0, "signup", options) : helperMissing.call(depth0, "pathFor", "signup", options))));
  data.buffer.push("\">Signup</a> &middot; <a href=\"https://twitter.com/ircanywhere\" target=\"_blank\">@ircanywhere</a></p>\r\n				<p>© 2013 IRCAnywhere. All rights reserved.</p>\r\n			</div>\r\n		</div>\r\n	</body>\r\n</html>");
  return buffer;
  
});