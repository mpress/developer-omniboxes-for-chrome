// == Helper Prototype Extensions ==
Storage.prototype.setObject = function(key, value, opt_expiration) {
    var expiration = opt_expiration || 3e9; // defaults to a little bit more than 1 month
    if (expiration > 0) {
        expiration += Date.now();
    }
    this.setItem(key, JSON.stringify(value));
    this.setItem(key + "__expiration", expiration);
};
Storage.prototype.getObject = function(key) {
    return JSON.parse(this.getItem(key));
};
Storage.prototype.hasUnexpired = function(key) {
    if (!this.getItem(key + "__expiration") || !this.getItem(key)) {
        return false;
    }
    var expiration = +this.getItem(key + "__expiration");
    return expiration < Date.now();
};
String.prototype.encode = function() {
    return encodeURIComponent(String(this));
};

// == Autocompletion Chrome Extension ==
(function(){
    // Issue a new GET request
    function xhr(url, ifexists, ifnotexists, retry_interval) {
        var retry_time = retry_interval || 5;
        var req = new XMLHttpRequest();
        console.log("Fetching: " + url);
        req.open("GET", url);
        req.onreadystatechange=function(){
            if (req.readyState == 4){
                var status=req.status;
                if ((status == 200) || (status == 301) || (status == 302)) {
                    ifexists(url, req);
                } else {
                    ifnotexists(url, req);
                    setTimeout(function() { xhr(url, ifexists, ifnotexists, retry_time + 5).send(null); }, retry_time);
                }
            }
        };
        return req;
    };
    
    // Navigates to the specified URL.
    function nav(url) {
        console.log("Navigating to: " + url);
        chrome.tabs.getSelected(null, function(tab) {
            chrome.tabs.update(tab.id, {url: url});
        });
    };
    
    // Sets the the default styling for the first search item
    function setDefaultSuggestion(text) {
        if (text) {
            chrome.omnibox.setDefaultSuggestion({"description":"<url><match>Closure API Search</match></url> " + text});
        } else {
            chrome.omnibox.setDefaultSuggestion({"description":"<url><match>Closure API Search</match></url>"});
        }
    };
    
    // Prefetch necessary data
    var classes_ = null;
    var files_ = null;
    var interfaces_ = null;
    var namespaces_ = null;
    var base_items_ = [
        "abstractMethod",
        "addDependency",
        "base",
        "bind",
        "exportProperty",
        "exportSymbol",
        "getCssName",
        "getMsg",
        "getObjectByName",
        "getUid",
        "globalEval",
        "inherits",
        "isArray",
        "isArrayLike",
        "isBoolean",
        "isDateLike",
        "isDef",
        "isDefAndNotNull",
        "isFunction",
        "isNull",
        "isNumber",
        "isObject",
        "isString",
        "mixin",
        "nullFunction",
        "partial",
        "provide",
        "removeUid",
        "require",
        "scope",
        "setCssNameMapping",
        "setTestOnly",
        "typeOf",
        "basePath"
    ];
    
    function parseIndexTree(tree, parent_name) {
        if (!tree) {
            return;
        }
    
        for (var key in tree) {
            console.log("Parsing \"" + key + "\" at level " + (parent_name || []).length + ".");
            var name = key;
            var value = tree[name];
            var type = value[0];
            var url = value[1];
            var fqn = [];
            if (parent_name) {
                for (var i = 0; i < parent_name.length; ++i) {
                    fqn.push(parent_name[i]);
                }
            }
            if ((fqn.length != 0) || ((name != "fileIndex") && (name != "root") && (name != "closure") && (name != "typeIndex"))) {
                fqn.push(name);
            }
            if (type == "file") {
                files_.push({"name":name, "fqn":fqn.join('/'), "type":"File", "url":url});
            } else if (type == "class") {
                classes_.push({"name":name, "fqn":fqn.join('.'), "type":"Class", "url":url});
            } else if (type == "namespace") {
                namespaces_.push({"name":name, "fqn":fqn.join('.'), "type":"Namespace", "url":url});
            } else if (type == "interface") {
                interfaces_.push({"name":name, "fqn":fqn.join('.'), "type":"Interface", "url":url});
            } 
            
            parseIndexTree(value[2], fqn);
        }
    };
    
    function parseIndexForrest(forrest) {
        for (var i = 0; i < forrest.length; ++i) {
            parseIndexTree(forrest[i], []);
        }
    }
    
    window['parseIndexForrest'] = parseIndexForrest;
    
    chrome.omnibox.onInputStarted.addListener(function(){
        console.log("Input started");
        setDefaultSuggestion('');
        
        if (!localStorage.hasUnexpired('closure_classes') || !localStorage.hasUnexpired('closure_files') || !localStorage.hasUnexpired('closure_interfaces') || !localStorage.hasUnexpired('closure_namespaces')) {
            xhr("http://closure-library.googlecode.com/svn/docs/doc_json_index.js",
                function(url, req) {
                    console.log("Received: "+url);
                    classes_ = [];
                    files_ = [];
                    interfaces_ = [];
                    namespaces_ = [];
                    var action = ["parseIndexForrest([", req.responseText, "]);"].join('');
                    eval(action);
                    localStorage.setObject('closure_classes', classes_);
                    localStorage.setObject('closure_files', files_);
                    localStorage.setObject('closure_interfaces', interfaces_);
                    localStorage.setObject('closure_namespaces', namespaces_);
                },
                function(url, req) {
                    console.log("Failed to receive: " + url);
                }).send(null);
        } else {
            classes_ = localStorage.getObject('closure_classes');
            files_ = localStorage.getObject('closure_files');
            interfaces_ = localStorage.getObject('closure_interfaces');
            namespaces_ = localStorage.getObject('closure_namespaces');
        }
    });
    
    chrome.omnibox.onInputCancelled.addListener(function() {
        console.log("Input cancelled.");
        setDefaultSuggestion('');
    });
    
    setDefaultSuggestion('');
    
    chrome.omnibox.onInputChanged.addListener(function(text, suggest_callback) {
        setDefaultSuggestion(text);
        if (!text) {
            return;
        }
        
        var kMaxSuggestions = 10;
        var suggestions = [];
        var stripped_text = text.trim();
        if (!stripped_text) {
            return;
        }
        var qlower = stripped_text.toLowerCase();
        var secondary = [];
        
        for (var i = 0; i < base_items_.length; ++i) {
            var entry = base_items_[i];
            var namelower = entry.toLowerCase();
            if (namelower.startsWith(qlower) || (namelower == qlower) || ("goog."+namelower).startsWith(qlower) || (("goog."+namelower) == qlower)) {
                var url = "http://closure-library.googlecode.com/svn/docs/closure_goog_base.js.html#goog."+entry;
                suggestions.push({"content":url, "description":["<match>goog.", entry, "</match> - <url>", url, "</url>"].join('')});
            }
        }
        
        if (interfaces_) {
            for (var i = 0; i < interfaces_.length; ++i) {
                var entry = interfaces_[i];
                var namelower = entry["name"].toLowerCase();
                if (namelower.startsWith(qlower) || (namelower == qlower)) {
                    suggestions.push({
                        "content":"http://closure-library.googlecode.com/svn/docs/"+entry["url"],
                        "description":["<match>", entry["name"], "</match> (<dim>Interface</dim> <match>", entry["fqn"], "</match>) - <url>http://closure-library.googlecode.com/svn/docs/", entry["url"], "</url>"].join('')});
                } else if (entry["fqn"].toLowerCase().indexOf(qlower) != -1) {
                    secondary.push({
                        "content":"http://closure-library.googlecode.com/svn/docs/"+entry["url"],
                        "description":["<match>", entry["name"], "</match> (<dim>Interface</dim> <match>", entry["fqn"], "</match>) - <url>http://closure-library.googlecode.com/svn/docs/", entry["url"], "</url>"].join('')});
                }
                if (suggestions.length > kMaxSuggestions) {
                    break;
                }
            }
        }
        
        if (classes_) {
            for (var i = 0; i < classes_.length; ++i) {
                var entry = classes_[i];
                var namelower = entry["name"].toLowerCase();
                if (namelower.startsWith(qlower) || (namelower == qlower)) {
                    suggestions.push({
                        "content":"http://closure-library.googlecode.com/svn/docs/"+entry["url"],
                        "description":["<match>", entry["name"], "</match> (<dim>Class</dim> <match>", entry["fqn"], "</match>) - <url>http://closure-library.googlecode.com/svn/docs/", entry["url"], "</url>"].join('')});
                } else if (entry["fqn"].toLowerCase().indexOf(qlower) != -1) {
                    secondary.push({
                        "content":"http://closure-library.googlecode.com/svn/docs/"+entry["url"],
                        "description":["<match>", entry["name"], "</match> (<dim>Class</dim> <match>", entry["fqn"], "</match>) - <url>http://closure-library.googlecode.com/svn/docs/", entry["url"], "</url>"].join('')});
                }
                if (suggestions.length > kMaxSuggestions) {
                    break;
                }
            }
        }
        
        if (namespaces_) {
            for (var i = 0; i < namespaces_.length; ++i) {
                var entry = namespaces_[i];
                var namelower = entry["name"].toLowerCase();
                if (namelower.startsWith(qlower) || (namelower == qlower)) {
                    suggestions.push({
                        "content":"http://closure-library.googlecode.com/svn/docs/"+entry["url"],
                        "description":["<match>", entry["name"], "</match> (<dim>Namespace</dim> <match>", entry["fqn"], "</match>) - <url>http://closure-library.googlecode.com/svn/docs/", entry["url"], "</url>"].join('')});
                } else if (entry["fqn"].toLowerCase().indexOf(qlower) != -1) {
                    secondary.push({
                        "content":"http://closure-library.googlecode.com/svn/docs/"+entry["url"],
                        "description":["<match>", entry["name"], "</match> (<dim>Namespace</dim> <match>", entry["fqn"], "</match>) - <url>http://closure-library.googlecode.com/svn/docs/", entry["url"], "</url>"].join('')});
                }
                if (suggestions.length > kMaxSuggestions) {
                    break;
                }
            }
        }
        
        if (files_) {
            for (var i = 0; i < files_.length; ++i) {
                var entry = files_[i];
                var namelower = entry["name"].toLowerCase();
                if (namelower.startsWith(qlower) || (namelower == qlower)) {
                    suggestions.push({
                        "content":"http://closure-library.googlecode.com/svn/docs/"+entry["url"],
                        "description":["<match>", entry["name"], "</match> (<dim>File</dim> <match>", entry["fqn"], "</match>) - <url>http://closure-library.googlecode.com/svn/docs/", entry["url"], "</url>"].join('')});
                } else if (entry["fqn"].toLowerCase().indexOf(qlower) != -1) {
                    secondary.push({
                        "content":"http://closure-library.googlecode.com/svn/docs/"+entry["url"],
                        "description":["<match>", entry["name"], "</match> (<dim>File</dim> <match>", entry["fqn"], "</match>) - <url>http://closure-library.googlecode.com/svn/docs/", entry["url"], "</url>"].join('')});
                }
                if (suggestions.length > kMaxSuggestions) {
                    break;
                }
            }
        }
        
        if (suggestions.length < kMaxSuggestions) {
            for (var i = 0; i < secondary.length; ++i) {
                suggestions.push(secondary[i]);
            }
        }
        
        if (stripped_text.length >= 2) {
            suggestions.push({"content":stripped_text +  " [Google Code Search]", 
                "description":["Search for \"<match>", stripped_text, "</match> <dim>lang:javascript</dim>\" using <match><url>Google Code Search</url></match> - <url>http://code.google.com/codesearch#search/&amp;q=", encodeURIComponent(stripped_text + " lang:javascript"), "</url>"].join('')}); 
            suggestions.push({"content":stripped_text +  " [Development and Coding Search]", 
                "description":["Search for \"<dim>Google Closure</dim> <match>", stripped_text, "</match>\" using <match><url>Develoment and Coding Search</url></match> - <url>http://www.google.com/cse?cx=005154715738920500810:fmizctlroiw&amp;q=", encodeURIComponent("Google Closure "+stripped_text), "</url>"].join('')});
        }
        suggest_callback(suggestions);
    });
    
    chrome.omnibox.onInputEntered.addListener(function(text) {
        console.log("Input entered: " + text);
        if (!text) {
            nav("http://closure-library.googlecode.com/svn/docs/index.html");
            return;
        }
        
        var stripped_text = text.trim();
        if (!stripped_text) {
            nav("http://closure-library.googlecode.com/svn/docs/index.html");
            return;
        }
        var qlower = stripped_text.toLowerCase();
        
        if (stripped_text.startsWith("http://") || stripped_text.startsWith("https://")) {
            nav(stripped_text);
            return;
        }
        
        if (stripped_text.startsWith("www.") || stripped_text.endsWith(".com") || stripped_text.endsWith(".net") || stripped_text.endsWith(".org") || stripped_text.endsWith(".edu")) {
            nav("http://" + stripped_text);
            return;
        }
                
        var google_codesearch_suffix = " [Google Code Search]";
        if (stripped_text.endsWith(google_codesearch_suffix)) {
            var newquery = stripped_text.substring(0, stripped_text.length - google_codesearch_suffix.length).trim();
            nav("http://code.google.com/codesearch#search/&q=" + encodeURIComponent(newquery + " lang:javascript"));
            return;
        }
        
        var devsearch_suffix = " [Development and Coding Search]";
        if (stripped_text.endsWith(devsearch_suffix)) {
            var newquery = stripped_text.substring(0, stripped_text.length - devsearch_suffix.length).trim();
            nav("http://www.google.com/cse?cx=005154715738920500810:fmizctlroiw&q=" + encodeURIComponent("Google Closure "+newquery));
            return;
        }
        
        for (var i = 0; i < base_items_.length; ++i) {
            var entry = base_items_[i];
            var namelower = entry.toLowerCase();
            if ((namelower == qlower) || (("goog."+namelower) == qlower)) {
                nav("http://closure-library.googlecode.com/svn/docs/closure_goog_base.js.html#goog."+entry);
                return;
            }
        }
        
        if (interfaces_) {
            for (var i = 0; i < interfaces_.length; ++i) {
                var entry = interfaces_[i];
                var namelower = entry["name"].toLowerCase();
                if (namelower == qlower) {
                    nav("http://closure-library.googlecode.com/svn/docs/"+entry["url"]);
                    return;
                }
            }
        }
        
        if (classes_) {
            for (var i = 0; i < classes_.length; ++i) {
                var entry = classes_[i];
                var namelower = entry["name"].toLowerCase();
                if (namelower == qlower) {
                    nav("http://closure-library.googlecode.com/svn/docs/"+entry["url"]);
                    return;
                }
            }
        }
        
        if (namespaces_) {
            for (var i = 0; i < namespaces_.length; ++i) {
                var entry = namespaces_[i];
                var namelower = entry["name"].toLowerCase();
                if (namelower == qlower) {
                    nav("http://closure-library.googlecode.com/svn/docs/"+entry["url"]);
                    return;
                }
            }
        }
        
        if (files_) {
            for (var i = 0; i < files_.length; ++i) {
                var entry = files_[i];
                var namelower = entry["name"].toLowerCase();
                if (namelower == qlower) {
                    nav("http://closure-library.googlecode.com/svn/docs/"+entry["url"]);
                    return;
                }
            }
        }
        
        nav("http://www.google.com/search?q=" + encodeURIComponent("Google Closure "+stripped_text));
    });
})();