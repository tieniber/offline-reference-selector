define([
    "dojo/_base/declare",
    "mxui/widget/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/text!OfflineReferenceSelector/template/OfflineReferenceSelector.html"
], function (declare, _WidgetBase, _TemplatedMixin, lang, array, template) {
    "use strict";
    // Declare widget.
    return declare("OfflineReferenceSelector.widget.OfflineReferenceSelector", [_WidgetBase, _TemplatedMixin], {
        templateString: template,

        // General variables
        _wgtNode: null,
        _contextObj: null,
        _handles: null,
        
        // Extra variables
        _menu: null,
        _menuButton: null,
        _hasStarted: null,
        _refguid: null,
        _referenceStr: null,

        constructor: function () {
            this._handles = [];
            this._hasStarted = false;
        },

        postCreate: function () {
            logger.debug(this.id + "OfflineReferenceSelector - postCreate");

            this._referenceStr = this.reference.split("/")[0];

            this._wgtNode = this.domNode;

            if(this.showLabel) {
                this.labelNode.innerText = this.fieldCaption;
            } else {
                this._wgtNode.removeChild(this.labelNode);
            }
            
            if(this.orientation === "horizontal") {
                var labelClass= "col-sm-" + this.labelWeight;
                var selectorColumnClass = "col-sm-" + (12 - this.labelWeight);
                this.labelNode.classList.add(labelClass);
                this.selectorColumnNode.classList.add(selectorColumnClass);
            }

            this._setupEvents();

        },

        update: function (obj, callback) {
            // startup
            logger.debug(this.id + "OfflineReferenceSelector - update");

            // Release handle on previous object, if any.
            if (obj === null) {
                // Sorry no data no show!
                logger.debug(this.id + "OfflineReferenceSelector  - update - We did not get any context object!");
            } else {
                //set contextobject
                this._contextObj = obj;
                // Subscribe to object updates.
                this._resetSubscriptions();
                if(this._menu === null){
                    this._buildMenu();
                }
                
            }
            callback();
        },

        _setupEvents: function () {
            logger.debug(this.id + "OfflineReferenceSelector - setup events");

            this.connect(this.inputNode, "click", lang.hitch(this, function (event) {
                if (dojo.query(".alert", this._wgtNode).length > 0) {
                    dojo.destroy(dojo.query(".alert", this._wgtNode)[0]);
                }
            }));

        },

        _resetSubscriptions: function () {
            this.unsubscribeAll();
            //subscribe to changes on the main reference
            this._subsribeToReference();
            //subscribe to any listening paths specified
            this._subscribeToConstraints();
        },

        _subsribeToReference: function() {
            this.subscribe({
                guid: this._contextObj.getGuid(),
                attr: this._referenceStr,
                callback: function() {
                    this._setCreateDefault();
                }.bind(this)
            });
        },

        _subscribeToConstraints: function() {
            for (var i=0; i<this.listenList.length; i++) {
                var currentItem = this.listenList[i],
                    currentPath;
                if (currentItem.reference) {
                    currentPath = this.listenList[i].reference.split("/");
                } else if (currentItem.referenceSet) {
                    currentPath = this.listenList[i].referenceSet.split("/");
                }
                
                if (currentPath) {
                    this.subscribe({
                        guid: this._contextObj.getGuid(),
                        attr: currentPath[0],
                        callback: function() {
                            this._fetchItems();
                        }.bind(this)
                    });
                }
            }
        },

        _fetchItems: function () {
            if (this.nfSelector) {
                this._execNf(this.nfSelector, lang.hitch(this, function(objs) {
                    this._addMenuItems(objs);
                }));
            } else if (this.xpathConstraint) {
                logger.debug(this.id + "OfflineReferenceSelector - selection xpath defined");
                //selection xpath defined
                mx.data.get({
                    xpath: this.xpathConstraint,
                    callback: lang.hitch(this, function (objs) {
                        this._addMenuItems(objs);
                    })
                });
            } else if (this.mfSelector) {
                logger.debug(this.id + "OfflineReferenceSelector - selection mf defined");
                //selection mf defined
                mx.data.action({
                    params: {
                        actionname: this.mfSelector
                    },
                    callback: lang.hitch(this, function (list) {
                        this._addMenuItems(list);
                    }),
                    error: function (error) {
                        logger.debug(this.id + error.description);
                    }
                }, this);
            } else {
                //default fetch
                logger.debug(this.id + "OfflineReferenceSelector - default fetch");
                var refEntity = this.reference.split("/")[1];
                mx.data.get({
                    xpath: "//" + refEntity,
                    callback: lang.hitch(this, function (objs) {
                        this._addMenuItems(objs);
                    })
                });
            }
        },


        _buildMenu: function () {
            logger.debug(this.id + "OfflineReferenceSelector - build menu");

            this._referenceStr = this.reference.split("/")[0];
            this._refguid = this._contextObj.getReference(this._referenceStr);
            var menuItem = null;
            //build the drop down
            this._menu = this.inputNode;

            
            this._menu.onchange = lang.hitch(this,function(event){
                if(event.target.value != ""){
                    this._setAsReference(event.target.value);
                    if (dojo.query(".alert", this._wgtNode).length > 0) {
                        dojo.destroy(dojo.query(".alert", this._wgtNode)[0]);
                    }
                    if(this._onChangeMf) {
                        this._execMf(this.onChangeMf)
                    }
                    if (this._onChangeNf) {
                        this._execNf(this.onChangeNf);
                    }
                } 
                else{
                    this._contextObj.removeReferences(this._referenceStr, [this._refguid]);
                    if(this._onChangeMf) {
                        this._execMf(this.onChangeMf)
                    }
                    if (this._onChangeNf) {
                        this._execNf(this.onChangeNf);
                    }
                }
            });
            //add empty menuitem
            menuItem = document.createElement('option');
            menuItem.value = "";
            menuItem.innerText = "";
            this._menu.add(menuItem);


            this._setCreateDefault();
            
            if(!this.lazyLoad) {
                this._fetchItems();
            }

        },

        _setCreateDefault: function () {
            // create default selection
            this._refguid = this._contextObj.getReference(this._referenceStr);
            if (this._refguid) {
                mx.data.get({
                    guid: this._refguid,
                    callback: lang.hitch(this, function (obj) {
                        var defaultVal = this._checkMenuItem(obj).value;
                        this._menu.value = defaultVal;
                    })
                });

            } else {
                this._menu.value = "";
            }
        },

        _checkMenuItem: function (obj) {
            //run a check to see if the item already exists (based on the item value)
            logger.debug(this.id + "OfflineReferenceSelector - check menu item");
            var value = obj.getGuid(),
                allItems = this._menu.options,
                containsItem = false,
                item = null;

            if (allItems.length > 1) {
                for (var i=0; i< allItems.length; i++) {
                    if (allItems[i].value === value) {
                        containsItem = true;
                        item = allItems[i];
                        allItems[i].isDirty = false;
                        break;
                    }
                }
            }

            if (!containsItem) {
                return this._createMenuItem(obj);
            } else {
                return item;
            }
        },

        _createMenuItem: function (obj) {
            //create a new dijit menu item
            logger.debug(this.id + "OfflineReferenceSelector - create menu item");
            var menuItem = document.createElement('option');
            menuItem.value = obj.getGuid();
            menuItem.innerText = obj.get(this.displayAttr);
            menuItem.isDirty = false;

            this._menu.add(menuItem);
            return menuItem;
        },

        _setAsReference: function (guid) {
            logger.debug(this.id + "OfflineReferenceSelector - set as reference");
            this._contextObj.addReference(this._referenceStr, guid);
        },

        _addMenuItems: function (objs) {
            logger.debug(this.id + "OfflineReferenceSelector - add menu items");
            var self = this;

            //mark existing menu items as dirty
            array.forEach(this._menu.options, function(item) {
                if (item.value){
                    item.isDirty = true;
                }
            });

            //add new ones
            array.forEach(objs, function (obj, i) {
                self._checkMenuItem(obj);
            });

            //remove the missing (dirty) ones
            //var i = this._menu.options.length,
            //        listCopy = [];
            //while (i--) listCopy[i] = this._menu.options[i];
            
            //start from the end of the array while removing, so we don't miss any
            for (var i=this._menu.options.length-1; i>=0; i=i-1) {
                var item = this._menu.options[i];
                if(item.isDirty) {
                    item.remove();
                }
            }
            this._hasStarted = true;
        },

        _execMf: function (mf) {
            logger.debug(this.id + "OfflineReferenceSelector - execute mf");
            if (mf) {
                mx.data.action({
                    params: {
                        actionname: mf
                    },
                    store: {
                        caller: this.mxform
                    },
                    callback: lang.hitch(this, function () {
                        //ok
                    }),
                    error: function (error) {
                        console.error(error.description);
                    }
                }, this);
            }
        },

        _execNf: function (nf, callback) {
            logger.debug(this.id + "OfflineReferenceSelector - execute mf");
            if (nf) {
                var validCallback = callback;
                if (!validCallback) {
                    validCallback = function() {};
                }
                mx.data.callNanoflow({
                    nanoflow: nf,
                    orgin: this.mxform,
                    context: this.mxcontext,
                    callback: validCallback,
                    error: function (error) {
                        console.error(error.description);
                    }
                });
            }
        }
    });
});

require(["OfflineReferenceSelector/widget/OfflineReferenceSelector"], function() {
    "use strict";
});
