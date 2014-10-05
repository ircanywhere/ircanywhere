/* 
 https://github.com/JamesHight/emberjs-touch

 Copyright (c) 2012 by:

 * James Hight 

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

Ember.fastclick=function(){function t(){if(e.enabled){e.enabled=false;setTimeout(function(){e.enabled=true},400)}}var e={start:false,x:null,y:null,enabled:true};Ember.EventDispatcher.reopen({setupHandler:function(n,r,i){if(!e.enabled)return;var s=this,o;n.delegate(".ember-view",r+".ember",function(n,r){switch(n.type){case"touchstart":this.setAttribute("data-original-class",this.className);this.className+=" pseudo-active";e.start=true;e.x=n.originalEvent.touches[0].clientX;e.y=n.originalEvent.touches[0].clientY;n.stopPropagation();break;case"touchmove":if(e.start){o=Math.max(Math.abs(n.originalEvent.touches[0].clientX-e.x),Math.abs(n.originalEvent.touches[0].clientY-e.y));if(o>20)e.start=false}break;case"touchcancel":if(this.getAttribute("data-original-class"))this.className=this.getAttribute("data-original-class");break;case"touchend":if(e.start){if(this.getAttribute("data-original-class"))this.className=this.getAttribute("data-original-class");o=Math.max(Math.abs(n.originalEvent.changedTouches[0].clientX-e.x),Math.abs(n.originalEvent.changedTouches[0].clientY-e.y));if(o<20&&!$(n.target).is("input:not([type=checkbox]), textarea")){n.preventDefault();n.stopImmediatePropagation();if(e.enabled){setTimeout(function(){$(n.target).click()},50)}}e.start=false}break}var u=Ember.View.views[this.id],a=true,f=null;f=s._findNearestEventManager(u,i);if(f&&f!==r){if(i=="click"){if(e.enabled)t();else return false}a=s._dispatchEvent(f,n,i,u)}else if(u){a=s._bubbleEvent(u,n,i)}else{n.stopPropagation()}return a});n.delegate("[data-ember-action]",r+".ember",function(n){var r=Ember.$(n.currentTarget).attr("data-ember-action"),s=Ember.Handlebars.ActionHelper.registeredActions[r],o;if(s){o=s.handler;if(s.eventName===i){if(e.enabled)t();else return false;return o(n)}}})}})};Ember.fastclick()