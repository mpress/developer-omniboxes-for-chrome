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
String.prototype.startsWith = function(str) {
    if (str.length > this.length) {
        return false;
    }
    return (String(this).substr(0, str.length) == str);
};
String.prototype.endsWith = function(str) {
    if (str.length > this.length) {
        return false;
    }
    return (String(this).substr(this.length - str.length, this.length) == str);
};
String.prototype.encode = function() {
    return encodeURIComponent(String(this));
};
String.prototype.strip = function() {
    var str = String(this);
    if (!str) {
        return "";
    }
    var startidx=0;
    var lastidx=str.length-1;
    while ((startidx<str.length)&&(str.charAt(startidx)==' ')){
        startidx++;
    }
    while ((lastidx>=startidx)&&(str.charAt(lastidx)==' ')){
        lastidx--;
    }
    if (lastidx < startidx) {
        return "";
    }
    return str.substring(startidx, lastidx+1);
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
            chrome.omnibox.setDefaultSuggestion({"description":"<url><match>Python3 Search</match></url> " + text});
        } else {
            chrome.omnibox.setDefaultSuggestion({"description":"<url><match>Python3 Search</match></url>"});
        }
    };
    
    // Prefetch necessary data
    var predefined_ = {
        "assert":"reference/simple_stmts.html#the-assert-statement",
        "pass":"reference/simple_stmts.html#the-pass-statement",
        "del":"reference/simple_stmts.html#the-del-statement",
        "return":"reference/simple_stmts.html#the-return-statement",
        "yield":"reference/simple_stmts.html#the-yield-statement",
        "raise":"reference/simple_stmts.html#the-raise-statement",
        "break":"reference/simple_stmts.html#the-break-statement",
        "continue":"reference/simple_stmts.html#the-continue-statement",
        "import":"reference/simple_stmts.html#the-import-statement",
        "future":"reference/simple_stmts.html#future-statements",
        "__future__":"reference/simple_stmts.html#future-statements",
        "global":"reference/simple_stmts.html#the-global-statement",
        "exec":"reference/simple_stmts.html#the-exec-statement",
        "if":"reference/compound_stmts.html#the-if-statement",
        "while":"reference/compound_stmts.html#the-while-statement",
        "for":"reference/compound_stmts.html#the-for-statement",
        "try":"reference/compound_stmts.html#the-try-statement",
        "except":"reference/compound_stmts.html#the-try-statement",
        "with":"reference/compound_stmts.html#the-with-statement",
        "def":"reference/compound_stmts.html#function-definitions",
        "class":"tutorial/classes.html#a-first-look-at-classes",
        "classes":"tutorial/classes.html#a-first-look-at-classes",
        "inheritance":"tutorial/classes.html#inheritance",
        "private":"tutorial/classes.html#private-variables",
        "encapsulation":"tutorial/classes.html#private-variables",
        "private variables":"tutorial/classes.html#private-variables",
        "double underscore":"tutorial/classes.html#private-variables",
        "and":"library/stdtypes.html#boolean-operations-and-or-not",
        "or":"library/stdtypes.html#boolean-operations-and-or-not",
        "not":"library/stdtypes.html#boolean-operations-and-or-not",
        "<":"library/stdtypes.html#comparisons",
        "<=":"library/stdtypes.html#comparisons",
        ">":"library/stdtypes.html#comparisons",
        ">=":"library/stdtypes.html#comparisons",
        "==":"library/stdtypes.html#comparisons",
        "!=":"library/stdtypes.html#comparisons",
        "is":"library/stdtypes.html#comparisons",
        "is not":"library/stdtypes.html#comparisons",
        "int":"library/stdtypes.html#numeric-types-int-float-complex",
        "float":"library/stdtypes.html#numeric-types-int-float-complex",
        "complex":"library/stdtypes.html#numeric-types-int-float-complex",
        "iterator":"library/stdtypes.html#iterator-types",
        "str":"library/stdtypes.html#string-methods",
        "object":"reference/datamodel.html#objects-values-and-types",
        "__slots__":"reference/datamodel.html#slots",
        "__metaclass__":"reference/datamodel.html#customizing-class-creation",
        "metaclass":"reference/datamodel.html#customizing-class-creation",
        "metaclasses":"reference/datamodel.html#customizing-class-creation"
    };
    var builtin_functions_ = null;
    var constants_ = null;
    var types_ = null;
    var exceptions_ = null;
    var datamodel_ = null;
    var modules_ = null;
    chrome.omnibox.onInputStarted.addListener(function(){
        console.log("Input started");
        setDefaultSuggestion('');
        
        if (localStorage.hasUnexpired('python_builtin_functions')) {
            builtin_functions_ = localStorage.getObject('python_builtin_functions');
        } else {
            xhr("http://docs.python.org/py3k/library/functions.html",
            function(url, req) {
                console.log("Received: "+url);
                builtin_functions_ = {};
                builtin_functions_["builtin functions"] = {"name":"Builtin Functions", "url":"http://docs.python.org/py3k/library/functions.html"};
                var text = req.responseText;
                var matches = text.match(new RegExp("<a title=\"[^\"]*\" class=\"reference [a-z]*\" href=\"[^\"]*\"><tt class=\"xref docutils literal\"><span class=\"pre\">[^<]*</span></tt></a></td>", "g"));
                for (var i = 0; i < matches.length; ++i) {
                    var match = matches[i];
                    var hrefstartidx = match.indexOf("href=\"") + 6;
                    var hrefendidx = match.indexOf("\"", hrefstartidx);
                    var href = match.substring(hrefstartidx, hrefendidx);
                    var hashidx = href.indexOf("#");
                    var name = href.substr(hashidx+1);
                    var url = (hashidx == 0) ? ("http://docs.python.org/py3k/library/functions.html" + href) : ("http://docs.python.org/py3k/library/" + href);
                    builtin_functions_[name.toLowerCase()] = {"name":name, "url":url};
                }
                localStorage.setObject('python_builtin_functions', builtin_functions_);
            },
            function (url, req) {
                console.log("Failed to receive: "+url);
            }).send(null);
        }
        
        if (localStorage.hasUnexpired('python_constants')) {
            constants_ = localStorage.getObject('python_constants');
        } else {
            xhr("http://docs.python.org/py3k/library/constants.html",
            function(url, req) {
                console.log("Received: "+url);
                constants_ = {};
                constants_["constants"] = {"name":"Constants", "url":"http://docs.python.org/py3k/library/constants.html"};
                var text = req.responseText;
                var matches = text.match(new RegExp("<a class=\"headerlink\" href=\"#[^\"]*\" title=\"Permalink to this definition\">[^\"]*</a>", "g"));
                for (var i = 0; i < matches.length; ++i) {
                    var match = matches[i];
                    var hrefstartidx = match.indexOf("href=\"") + 6;
                    var hrefendidx = match.indexOf("\"", hrefstartidx);
                    var href = match.substring(hrefstartidx, hrefendidx);
                    var name = href.substr(1);
                    constants_[name.toLowerCase()] = {"name":name, "url":url + href};
                }
                localStorage.setObject('python_constants', constants_);
            },
            function (url, req) {
                console.log("Failed to receive: "+url);
            }).send(null);
        }
        
        if (localStorage.hasUnexpired('python_types')) {
            types_ = localStorage.getObject('python_types');
        } else {
            xhr("http://docs.python.org/py3k/library/stdtypes.html",
            function(url, req) {
                console.log("Received: "+url);
                types_ = {};
                types_["types"] = {"name":"Types", "url":"http://docs.python.org/py3k/library/stdtypes.html"};
                var text = req.responseText;
                var matches = text.match(new RegExp("<a class=\"headerlink\" href=\"#[^\"]*\" title=\"Permalink to this definition\">[^\"]*</a>", "g"));
                for (var i = 0; i < matches.length; ++i) {
                    var match = matches[i];
                    var hrefstartidx = match.indexOf("href=\"") + 6;
                    var hrefendidx = match.indexOf("\"", hrefstartidx);
                    var href = match.substring(hrefstartidx, hrefendidx);
                    var name = href.substr(1);
                    types_[name.toLowerCase()] = {"name":name, "url":url + href};
                }
                localStorage.setObject('python_types', types_);
            },
            function (url, req) {
                console.log("Failed to receive: "+url);
            }).send(null);
        }
        
        if (localStorage.hasUnexpired('python_exceptions')) {
            exceptions_ = localStorage.getObject('python_exceptions');
        } else {
            xhr("http://docs.python.org/py3k/library/exceptions.html",
            function(url, req) {
                console.log("Received: "+url);
                exceptions_ = {};
                exceptions_["exceptions"] = {"name":"exceptions", "url":"http://docs.python.org/py3k/library/exceptions.html"};
                var text = req.responseText;
                var matches = text.match(new RegExp("<a class=\"headerlink\" href=\"#[^\"]*\" title=\"Permalink to this definition\">[^\"]*</a>", "g"));
                for (var i = 0; i < matches.length; ++i) {
                    var match = matches[i];
                    var hrefstartidx = match.indexOf("href=\"") + 6;
                    var hrefendidx = match.indexOf("\"", hrefstartidx);
                    var href = match.substring(hrefstartidx, hrefendidx);
                    var name = href.substr(1);
                    exceptions_[name.toLowerCase()] = {"name":name, "url":url + href};
                    var exceptions_dot_index = name.indexOf("exceptions.");
                    if (exceptions_dot_index == 0) {
                        var shortname = name.substr(11);
                        types_[shortname.toLowerCase()] = {"name":shortname, "url":url + href};
                    }
                }
                localStorage.setObject('python_exceptions', exceptions_);
            },
            function(url, req) {
                console.log("Failed to receive: "+url);
            }).send(null);
        }
        
        if (localStorage.hasUnexpired('python_datamodel')) {
            datamodel_ = localStorage.getObject('python_datamodel');
        } else {
            xhr("http://docs.python.org/py3k/reference/datamodel.html",
            function(url, req) {
                console.log("Received: "+url);
                datamodel_ = {};
                var text = req.responseText;
                var matches = text.match(new RegExp("<a class=\"headerlink\" href=\"#[^\"]*\" title=\"Permalink to this definition\">[^<]*</a>", "g"));
                for (var i = 0; i < matches.length; ++i) {
                    var match = matches[i];
                    var match = matches[i];
                    var hrefstartidx = match.indexOf("href=\"") + 6;
                    var hrefendidx = match.indexOf("\"", hrefstartidx);
                    var href = match.substring(hrefstartidx, hrefendidx);
                    var name = href.substr(1);
                    datamodel_[name.toLowerCase()] = {"name":name, "url":url + href};
                    if (name.startsWith("object.")) {
                        var shortname = name.substr(7);
                        datamodel_[shortname.toLowerCase()] = {"name":shortname, "url":url + href};
                    } else if (name.startsWith("class.")) {
                        var shortname = name.substr(6);
                        datamodel_[shortname.toLowerCase()] = {"name":shortname, "url":url + href};
                    }
                }
                localStorage.setObject('python_datamodel', datamodel_);
            },
            function(url, req) {
                console.log("Failed to receive: "+url);
            }).send(null);
        }
        
        if (localStorage.hasUnexpired('python_modules')) {
            modules_ = localStorage.getObject('python_modules');
        } else {
            var tt_start = new RegExp("<tt class=\"xref\">", "g");
            var tt_end = new RegExp("</tt></a>", "g");
            var em_start = new RegExp("<em>", "g");
            var em_end = new RegExp("</em>", "g");
            var td = new RegExp("</td><td>", "g");
            var deprecated = new RegExp("<strong>Deprecated:</strong>", "g");
            xhr("http://docs.python.org/py3k/py-modindex.html",
            function(url, req) {
                console.log("Received: "+url);
                modules_ = {};
                var text = req.responseText;
                var matches = text.match(new RegExp("<a href=\"library/[^\"]*.html#module-[^\"]*\"><tt class=\"xref\">[^<]*</tt></a>( <em>\\(.*\\)</em>)?</td><td>(<strong>Deprecated:</strong>)?", "g"));
                for (var i = 0; i < matches.length; ++i) {
                    var match = matches[i];
                    var hrefstartidx = match.indexOf("href=\"") + 6;
                    var hrefendidx = match.indexOf("\"", hrefstartidx);
                    var href = match.substring(hrefstartidx, hrefendidx);
                    var namestartidx = match.indexOf("\"xref\">") + 7;
                    var nameendidx = match.indexOf("</tt>", namestartidx);
                    var name = match.substring(namestartidx, nameendidx);
                    var fullurl = "http://docs.python.org/py3k/" + href;
                    var description = [match.substr(match.indexOf("<tt"))
                                            .replace(tt_start, "<match>")
                                            .replace(tt_end, "</match>")
                                            .replace(em_start, "<dim>")
                                            .replace(em_end, "</dim>")
                                            .replace(td, "")
                                            .replace(deprecated, " <match>[DEPRECATED]</match>"),
                                        " - <url>", fullurl, "</url>"].join('');
                    modules_[name.toLowerCase()] = {"name":name, "url":fullurl, "description":description};
                }
                localStorage.setObject('python_modules', modules_);
            },
            function(url, req) {
                console.log("Failed to receive: "+url);
            }).send(null);
        }
    });
    
    function fetchModule(moduleobj) {
        if (moduleobj["moduledata"]) {
            return;
        }
        moduleobj["moduledata"] = {};
        var moduleurl = moduleobj["url"];
        var hashidx = moduleurl.indexOf("#");
        var url = (hashidx == -1) ? moduleurl : moduleurl.substring(0, hashidx);
        xhr(url,
        function(url, req) {
            console.log("Received: "+url);
            var text = req.responseText;
            var matches = text.match(new RegExp("<a class=\"headerlink\" href=\"#[^\"]*\" title=\"Permalink to this definition\">[^<]*</a>", "g"));
            if (matches) {
                for (var i = 0; i < matches.length; ++i) {
                    var match = matches[i];
                    var hrefstartidx = match.indexOf("href=\"") + 6;
                    var hrefendidx = match.indexOf("\"", hrefstartidx);
                    var href = match.substring(hrefstartidx, hrefendidx);
                    var name = href.substr(1);
                    moduleobj["moduledata"][name.toLowerCase()] = {"name":name, "url":url + href};
                }
            }
        },
        function(url, req) {
            console.log("Failed to receive: "+url);
        }).send(null);
    }
    
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
        var stripped_text = text.strip();
        if (!stripped_text) {
            return;
        }
        var qlower = stripped_text.toLowerCase();
        
        if ("print".startsWith(qlower)) {
          suggestions.push({
            "content":"http://docs.python.org/release/3.0.1/library/functions.html#print",
            "description":"<match>print<match> - <url>http://docs.python.org/release/3.0.1/library/functions.html#print</url>"});
        }
        
        for (var key in predefined_) {
            if (key.startsWith(qlower)) {
                var url = "http://docs.python.org/py3k/" + predefined_[key];
                suggestions.push({"content":url, "description":["<match>", key, "</match> - <url>", url, "</url>"].join('')});
                if (suggestions.length > kMaxSuggestions) {
                    break;
                }
            }
        }
        
        if (suggestions.length > kMaxSuggestions) {
            suggest_callback(suggestions);
            return;
        }
        
        if (datamodel_) {
            for (var key in datamodel_) {
                if (key.startsWith(qlower)) {
                    var entry = datamodel_[key];
                    var url = entry["url"];
                    var name = entry["name"];
                    suggestions.push({"content":url, "description":["<match>", name, "</match> - <url>", url, "</url>"].join('')});
                    if (suggestions.length > kMaxSuggestions) {
                        break;
                    }
                }
            }
        }
        
        if (suggestions.length > kMaxSuggestions) {
            suggest_callback(suggestions);
            return;
        }
        
        if (types_) {
            for (var key in types_) {
                if (key.startsWith(qlower)) {
                    var entry = types_[key];
                    var url = entry["url"];
                    var name = entry["name"];
                    suggestions.push({"content":url, "description":["<match>", name, "</match> - <url>", url, "</url>"].join('')});
                    if (suggestions.length > kMaxSuggestions) {
                        break;
                    }
                }
            }
        }
        
        if (suggestions.length > kMaxSuggestions) {
            suggest_callback(suggestions);
            return;
        }
        
        if (exceptions_) {
            for (var key in exceptions_) {
                if (key.startsWith(qlower)) {
                    var entry = exceptions_[key];
                    var url = entry["url"];
                    var name = entry["name"];
                    suggestions.push({"content":url, "description":["<match>", name, "</match> - <url>", url, "</url>"].join('')});
                    if (suggestions.length > kMaxSuggestions) {
                        break;
                    }
                }
            }
        }
        
        if (suggestions.length > kMaxSuggestions) {
            suggest_callback(suggestions);
            return;
        }
        
        if (builtin_functions_) {
            for (var key in builtin_functions_) {
                if (key.startsWith(qlower)) {
                    var entry = builtin_functions_[key];
                    var url = entry["url"];
                    var name = entry["name"];
                    if (types_[key] || predefined_[key]) {
                        suggestions.push({"content":url, "description":["<match>", name, "</match> <dim>(function)</dim> - <url>", url, "</url>"].join('')});
                    } else {
                        suggestions.push({"content":url, "description":["<match>", name, "</match> - <url>", url, "</url>"].join('')});
                    }
                    if (suggestions.length > kMaxSuggestions) {
                        break;
                    }
                }
            }
        }
        
        if (suggestions.length > kMaxSuggestions) {
            suggest_callback(suggestions);
            return;
        }

        if (constants_) {
            for (var key in constants_) {
                if (key.startsWith(qlower)) {
                    var entry = constants_[key];
                    var url = entry["url"];
                    var name = entry["name"];
                    suggestions.push({"content":url, "description":["<match>", name, "</match> - <url>", url, "</url>"].join('')});
                    if (suggestions.length > kMaxSuggestions) {
                        break;
                    }
                }
            }
        }
        
        if (suggestions.length > kMaxSuggestions) {
            suggest_callback(suggestions);
            return;
        }

        if (modules_) {
            for (var key in modules_) {
                if (key.startsWith(qlower)) {
                    var entry = modules_[key];
                    fetchModule(entry);
                    var url = entry["url"];
                    var name = entry["name"];
                    suggestions.push({"content":url, "description":entry["description"]});
                    if (suggestions.length > kMaxSuggestions) {
                        break;
                    }
                }
                if (key.startsWith(qlower) || qlower.startsWith(key)) {
                    var entry = modules_[key];
                    if (entry["moduledata"]) {
                        var moduledata = entry["moduledata"];
                        for (var subkey in moduledata) {
                            if (subkey.startsWith(qlower)) {
                                var subentry = moduledata[subkey];
                                var url = subentry["url"];
                                var name = subentry["name"];
                                suggestions.push({"content":url, "description":["<match>", name, "</match> - <url>", url, "</url>"].join('')});
                                if (suggestions.length > kMaxSuggestions) {
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        }
        
        if (suggestions.length > kMaxSuggestions) {
            suggest_callback(suggestions);
            return;
        }

        if (stripped_text.length >= 2) {
            suggestions.push({"content":stripped_text +  " [Google Code Search]", 
                "description":["Search for \"<match>", stripped_text, "</match> <dim>lang:python</dim>\" using <match><url>Google Code Search</url></match> - <url>http://code.google.com/codesearch#search/&amp;q=", encodeURIComponent(stripped_text + " lang:python"), "</url>"].join('')}); 
            suggestions.push({"content":stripped_text +  " [Development and Coding Search]", 
                "description":["Search for \"<match>", stripped_text, "</match>\" using <match><url>Develoment and Coding Search</url></match> - <url>http://www.google.com/cse?cx=005154715738920500810:fmizctlroiw&amp;q=", encodeURIComponent(stripped_text), "</url>"].join('')});
        }
        suggest_callback(suggestions);
    });
    
    chrome.omnibox.onInputEntered.addListener(function(text) {
        console.log("Input entered: " + text);
        if (!text) {
            nav("http://docs.python.org/py3k/");
            return;
        }
        
        var stripped_text = text.strip();
        if (!stripped_text) {
            nav("http://docs.python.org/py3k/");
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
            var newquery = stripped_text.substring(0, stripped_text.length - google_codesearch_suffix.length).strip();
            nav("http://code.google.com/codesearch#search/&q=" + encodeURIComponent(newquery + " lang:python"));
            return;
        }
        
        var devsearch_suffix = " [Development and Coding Search]";
        if (stripped_text.endsWith(devsearch_suffix)) {
            var newquery = stripped_text.substring(0, stripped_text.length - devsearch_suffix.length).strip();
            nav("http://www.google.com/cse?cx=005154715738920500810:fmizctlroiw&q=" + encodeURIComponent(newquery));
            return;
        }
        
        if (qlower == "print") {
            nav("http://docs.python.org/release/3.0.1/library/functions.html#print");
            return;
        }
        
        if (predefined_[qlower]) {
            nav("http://docs.python.org/py3k/" + predefined_[qlower]);
            return;
        }
        
        if (datamodel_ && datamodel_[qlower]) {
            nav(datamodel_[qlower]["url"]);
            return;
        }
        
        if (types_ && types_[qlower]) {
            nav(types_[qlower]["url"]);
            return;
        }
        
        if (exceptions_ && exceptions_[qlower]) {
            nav(exceptions_[qlower]["url"]);
            return;
        }
        
        if (builtin_functions_ && builtin_functions_[qlower]) {
            nav(builtin_functions_[qlower]["url"]);
            return;
        }

        if (constants_ && constants_[qlower]) {
            nav(constants_[qlower]["url"]);
            return;
        }

        if (modules_) {
            if (modules_[qlower]) {
                nav(modules_[qlower]["url"]);
                return;
            }
                
            for (var key in modules_) {
                if (qlower.startsWith(key)) {
                    var entry = modules_[key];
                    if (entry["moduledata"] && entry["moduledata"][qlower]) {
                        nav(entry["moduledata"][qlower]["url"]);
                        return;
                    }
                }
            }
        }
        
        nav("http://www.google.com/search?q=" + encodeURIComponent("Python "+stripped_text));
    });
})();