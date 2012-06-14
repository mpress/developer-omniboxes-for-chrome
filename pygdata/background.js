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
            chrome.omnibox.setDefaultSuggestion({"description":"<url><match>PyGData API Search</match></url> " + text});
        } else {
            chrome.omnibox.setDefaultSuggestion({"description":"<url><match>PyGData API Search</match></url>"});
        }
    };
    
    // Prefetch necessary data
    var modules_ = null;
    chrome.omnibox.onInputStarted.addListener(function(){
        console.log("Input started");
        setDefaultSuggestion('');
        
        if (localStorage.hasUnexpired('gdata_modules')) {
            modules_ = localStorage.getObject('gdata_modules');
        } else {
            xhr("http://gdata-python-client.googlecode.com/svn/trunk/pydocs/",
            function(url, req) {
                console.log("Received: "+url);
                modules_ = {};
                var text = req.responseText;
                var matches = text.match(new RegExp("<li><a href=\"[^\"]*\">[^<]*</a></li>", "g"));
                for (var i = 0; i < matches.length; ++i) {
                    var match = matches[i];
                    var hrefstartidx = match.indexOf("href=\"") + 6;
                    var hrefendidx = match.indexOf("\"", hrefstartidx);
                    var href = match.substring(hrefstartidx, hrefendidx);
                    if (!href.endsWith(".html")) {
                        continue;
                    }
                    var module = href.substring(0, href.indexOf(".html"));
                    var fullurl = url + href;
                    modules_[module] = {"name":module, "url":fullurl}; 
                }
                localStorage.setObject('gdata_modules', modules_);
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
        xhr(moduleobj["url"],
        function(url, req) {
            console.log("Received: "+url);
            var dash = new RegExp("-", "g");
            var text = req.responseText;
            var matches = text.match(new RegExp("<a name=\"[^\"]*\">", "g"));
            for (var i = 0; i < matches.length; ++i) {
                var match = matches[i];
                var startidx = match.indexOf("name=\"") + 6;
                var endidx = match.indexOf("\"", startidx);
                var content = match.substring(startidx, endidx);
                var fullurl = url + "#" + content;
                var name = moduleobj["name"] + "." + content.replace(dash, ".");
                moduleobj["moduledata"][name.toLowerCase()] = {"name":name, "url":fullurl};
            }
        },  
        function(url, req) {
            console.log("Failed to receive: "+url);
        }).send(null);
    };
    
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
        
        if (modules_) {
            for (var key in modules_) {
                var entry = modules_[key];
                if (key.startsWith(qlower)) {
                    fetchModule(entry);
                    var url = entry["url"];
                    var name = entry["name"];
                    suggestions.push({"content":name, "description":["<match>", name, "</match> - <url>", url, "</url>"].join('')});
                    if (suggestions.length > kMaxSuggestions) {
                        break;
                    }
                }
                
                if (entry["moduledata"] && (key.startsWith(qlower) || qlower.startsWith(key))) {
                    var moduledata = entry["moduledata"];
                    for (var subkey in moduledata) {
                        var subentry = moduledata[subkey];
                        var name = subentry["name"];
                        var url = subentry["url"];
                        suggestions.push({"content":name, "description":["<match>", name, "</match> - <url>", url, "</url>"].join('')});
                        if (suggestions.length > kMaxSuggestions) {
                            break;
                        }
                    }
                }
            }
        }
        
        if (stripped_text.length >= 2) {
            suggestions.push({"content":stripped_text +  " [Google Code Search]", 
                "description":["Search for \"<dim>gdata</dim> <match>", stripped_text, "</match> <dim>lang:python</dim>\" using <match><url>Google Code Search</url></match> - <url>http://code.google.com/codesearch#search/&amp;q=", encodeURIComponent("gdata " + stripped_text + " lang:python"), "</url>"].join('')}); 
            suggestions.push({"content":stripped_text +  " [Development and Coding Search]", 
                "description":["Search for \"<dim>Python GData</dim> <match>", stripped_text, "</match>\" using <match><url>Develoment and Coding Search</url></match> - <url>http://www.google.com/cse?cx=005154715738920500810:fmizctlroiw&amp;q=", encodeURIComponent("Python GData " + stripped_text), "</url>"].join('')});
        }
        suggest_callback(suggestions);
    });
    
    chrome.omnibox.onInputEntered.addListener(function(text) {
        console.log("Input entered: " + text);
        if (!text) {
            nav("http://code.google.com/p/gdata-python-client/");
            return;
        }
        
        var stripped_text = text.strip();
        if (!stripped_text) {
            nav("http://code.google.com/p/gdata-python-client/");
            return;
        }
        
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
            nav("http://code.google.com/codesearch#search/&q=" + encodeURIComponent("gdata "+ newquery + " lang:python"));
            return;
        }
        
        var devsearch_suffix = " [Development and Coding Search]";
        if (stripped_text.endsWith(devsearch_suffix)) {
            var newquery = stripped_text.substring(0, stripped_text.length - devsearch_suffix.length).strip();
            nav("http://www.google.com/cse?cx=005154715738920500810:fmizctlroiw&q=" + encodeURIComponent("Python GData "+newquery));
            return;
        }
        
        var qlower = stripped_text.toLowerCase();
        if (modules_) {
            if (modules_[qlower]) {
                nav(modules_[qlower]["url"]);
                return;
            }
            for (var key in modules_) {
                var entry = modules_[key];
                if (entry["moduledata"] && qlower.startsWith(key) && entry["moduledata"][qlower]) {
                    nav(entry["moduledata"][qlower]["url"]);
                    return;
                }
            }
        }
        
        nav("http://www.google.com/search?q=" + encodeURIComponent("Python GData "+stripped_text));
    });
})();