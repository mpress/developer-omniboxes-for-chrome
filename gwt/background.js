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
            chrome.omnibox.setDefaultSuggestion({"description":"<url><match>Web Toolkit™ API Search</match></url> " + text});
        } else {
            chrome.omnibox.setDefaultSuggestion({"description":"<url><match>Web Toolkit™ API Search</match></url>"});
        }
    };
    
    // Prefetch necessary data
    var gwt23_api_ = null;
    chrome.omnibox.onInputStarted.addListener(function(){
        console.log("Input started");
        setDefaultSuggestion('');
        if (localStorage.hasUnexpired('gwt23_api')) {
            gwt23_api_ = localStorage.getObject('gwt23_api');
        } else {
            xhr("http://google-web-toolkit.googlecode.com/svn/javadoc/2.3/allclasses-frame.html",
            function(url, req) {
                console.log("Received: " + url);
                gwt23_api_ = [];
                var text = req.responseText;
                var italic_begin = new RegExp("<I>", "g");
                var italic_end = new RegExp("</I>", "g");
                var slashes = new RegExp("/", "g");
                var dothtml = new RegExp(".html", "g");
                var matches = text.match(new RegExp("<A HREF=\".*\" title=\".*\" target=\"classFrame\">.*</A>", "g"));
                for (var i = 0; i < matches.length; i++) {
                    var match = matches[i];
                    var hrefstartidx = match.indexOf("HREF=\"") + 6;
                    var hrefendidx = match.indexOf("\"", hrefstartidx);
                    var href = match.substring(hrefstartidx, hrefendidx);
                    var titlestartidx = match.indexOf("title=\"") + 7;
                    var titleendidx = match.indexOf("\"", titlestartidx);
                    var title = match.substring(titlestartidx, titleendidx);
                    var contentstartidx = match.indexOf(">", titleendidx) + 1;
                    var contentendidx = match.indexOf("</A>", contentstartidx);
                    var content = match.substring(contentstartidx, contentendidx).replace(italic_begin, "").replace(italic_end, "");
                    var type = title.substring(0, title.indexOf(" in ")).strip();
                    type = type.charAt(0).toUpperCase() + type.substr(1);
                    var fqn = href.replace(slashes, ".").replace(dothtml, "");
                    gwt23_api_.push({"name":content, "fqn":fqn, "url":href, "type":type});
                }
                localStorage.setObject('gwt23_api', gwt23_api_);
            },
            function (url, req) {
                console.log("Failed to receive: " + url);
            }).send(null);
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
        
        var suggestions = [];
        var kMaxSuggestions = 10;
        var stripped_text = text.strip();
        if (!stripped_text) {
            return;
        }
        var qlower = stripped_text.toLowerCase();
        
        var second = [];
        var third = [];
        
        if (gwt23_api_) {
            for (var i = 0; i < gwt23_api_.length; ++i) {
                var item = gwt23_api_[i];
                var fqn = item["fqn"];
                var url = "http://google-web-toolkit.googlecode.com/svn/javadoc/2.4/" + item["url"];
                var name = item["name"];
                var type = item["type"];
                var namelower = name.toLowerCase();
                var nameidx = namelower.indexOf(qlower);
                var fqnlower = fqn.toLowerCase();
                
                if ((nameidx != -1) || fqnlower.startsWith(qlower)) {
                    var entry = {
                        "content":url,
                        "description":["<match>", name, "</match> <dim>(", type, " <match>", fqn, "</match>)</dim> - <url>", url, "</url>"].join('')
                    };
                    if (nameidx == 0) {
                        suggestions.push(entry);
                    } else if (nameidx != -1) {
                        second.push(entry);
                    } else {
                        third.push(entry);
                    }
                    
                    if (suggestions.length > kMaxSuggestions) {
                        break;
                    }
                }
            }
        }
        
        if (suggestions.length < kMaxSuggestions) {
            for (var i = 0; i < second.length; ++i) {
                suggestions.push(second[i]);
            }
        }
        
        if (suggestions.length < kMaxSuggestions) {
            for (var i = 0; i < third.length; ++i) {
                suggestions.push(third[i]);
            }
        }

        
        if ("overview".startsWith(qlower)) {
            suggestions.push({"content":"http://code.google.com/webtoolkit/overview.html", "description":"<match>Google Web Toolkit Overview</match> - <url>http://code.google.com/webtoolkit/overview.html</url>"});
        }
        if ("developer guide".startsWith(qlower) || "developers guide".startsWith(qlower) || "developer's guide".startsWith(qlower)) {
            suggestions.push({"content":"http://code.google.com/webtoolkit/doc/latest/DevGuide.html", "description":"<match>Google Web Toolkit Developer's Guide</match> - <url>http://code.google.com/webtoolkit/doc/latest/DevGuide.html</url>"});
        }
        if ("getting started".startsWith(qlower) || "get started".startsWith(qlower) || "getting started guide".startsWith(qlower) || "get started guide".startsWith(qlower) ||
            "gettingstarted".startsWith(qlower) || "getstarted".startsWith(qlower) || "gettingstarted guide".startsWith(qlower) || "getstarted guide".startsWith(qlower)) {
            suggestions.push({"content":"http://code.google.com/webtoolkit/gettingstarted.html", "description":"<match>Google Web Toolkit Getting Started Guide</match> - <url>http://code.google.com/webtoolkit/gettingstarted.html</url>"});    
        }
        if ("tutorials".startsWith(qlower)) {
            suggestions.push({"content":"http://code.google.com/webtoolkit/doc/latest/tutorial/index.html", "description":"<match>Google Web Toolkit Tutorials</match> - <url>http://code.google.com/webtoolkit/doc/latest/tutorial/index.html</url>"});
        }
        if ("downloads".startsWith(qlower)) {
            suggestions.push({"content":"http://code.google.com/webtoolkit/download.html", "description":"<match>Google Web Toolkit Downloads</match> - <url>http://code.google.com/webtoolkit/download.html</url>"});
        }
        
        if (stripped_text.length >= 2) {
            suggestions.push({"content":stripped_text +  " [Google Code Search]", 
                "description":["Search for \"<dim>gwt</dim> <match>", stripped_text, "</match> <dim>lang:java</dim>\" using <match><url>Google Code Search</url></match> - <url>http://code.google.com/codesearch#search/&amp;q=", encodeURIComponent("gwt " + stripped_text + " lang:java"), "</url>"].join('')}); 
            suggestions.push({"content":stripped_text +  " [Development and Coding Search]", 
                "description":["Search for \"<dim>gwt</dim> <match>", stripped_text, "</match>\" using <match><url>Develoment and Coding Search</url></match> - <url>http://www.google.com/cse?cx=005154715738920500810:fmizctlroiw&amp;q=", encodeURIComponent("gwt "+stripped_text), "</url>"].join('')});
        }
        suggest_callback(suggestions);
    });
    
    chrome.omnibox.onInputEntered.addListener(function(text) {
        console.log("Input entered: " + text);
        if (!text) {
            nav("http://google-web-toolkit.googlecode.com/svn/javadoc/2.4/index.html");
            return;
        }
        
        var stripped_text = text.strip();
        if (!stripped_text) {
            nav("http://google-web-toolkit.googlecode.com/svn/javadoc/2.4/index.html");
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
            nav("http://code.google.com/codesearch#search/&q=" + encodeURIComponent("gwt " + newquery + " lang:java"));
            return;
        }
        
        var devsearch_suffix = " [Development and Coding Search]";
        if (stripped_text.endsWith(devsearch_suffix)) {
            var newquery = stripped_text.substring(0, stripped_text.length - devsearch_suffix.length).strip();
            nav("http://www.google.com/cse?cx=005154715738920500810:fmizctlroiw&q=" + encodeURIComponent("gwt " + newquery));
            return;
        }
        
        var qlower = stripped_text.toLowerCase();
        if (gwt23_api_) {
            for (var i = 0; i < gwt23_api_.length; ++i) {
                var item = gwt23_api_[i];
                var fqn = item["fqn"];
                var url = "http://google-web-toolkit.googlecode.com/svn/javadoc/2.4/" + item["url"];
                var name = item["name"];
                if (name.toLowerCase() == qlower || fqn.toLowerCase() == qlower) {
                    nav(url);
                    return;
                }
            }
        }
        
        nav("http://www.google.com/search?q=" + encodeURIComponent("GWT "+stripped_text));
    });
})();