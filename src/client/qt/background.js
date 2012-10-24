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
            chrome.omnibox.setDefaultSuggestion({"description":"<url><match>Qt API Search</match></url> " + text});
        } else {
            chrome.omnibox.setDefaultSuggestion({"description":"<url><match>Qt API Search</match></url>"});
        }
    };
    
    // Prefetch necessary data
    var qt_api_ = null;
    chrome.omnibox.onInputStarted.addListener(function(){
        console.log("Input started");
        setDefaultSuggestion('');
        
        if (localStorage.hasUnexpired('qt_api')) {
            qt_api_ = localStorage.getObject('qt_api');
        } else {
            xhr("http://doc.qt.nokia.com/latest/classes.html",
            function(url, req) {
                console.log('Received: '+url);
                qt_api_ = [];
                var text = req.responseText;
                var matches = text.match(new RegExp("<dd><a href=\"[^\"]*\">[^<]*</a></dd>", "g"));
                for (var i = 0; i < matches.length; ++i) {
                    var match = matches[i];
                    var hrefstartidx = match.indexOf("href=\"") + 6;
                    var hrefendidx = match.indexOf("\"", hrefstartidx);
                    var contentstartidx = match.indexOf(">", hrefendidx) + 1;
                    var contentendidx = match.indexOf("</a>", contentstartidx);
                    var href = match.substring(hrefstartidx, hrefendidx);
                    var content = match.substring(contentstartidx, contentendidx);
                    var class_url = "http://doc.qt.nokia.com/latest/" + href;
                    qt_api_.push({'name':content, 'url':class_url});
                }
                localStorage.setObject('qt_api', qt_api_);
            },
            function(url, req) {
                console.log('Failed to receive: '+url);
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
        
        var kMaxSuggestions = 10;
        var suggestions = [];
        var stripped_text = text.strip();
        if (!stripped_text) {
            return;
        }
        var qlower = stripped_text.toLowerCase();
        var qqlower = qlower;
        
        if (qqlower && (qqlower.charAt(0) != 'q')) {
            qqlower = 'q' + qqlower;
        }
        
        var second = [];
        if (qt_api_) {
            for (var i = 0; i < qt_api_.length; ++i) {
                var entry = qt_api_[i];
                var name = entry['name'];
                var namelower = name.toLowerCase();
                var url = entry['url'];
                var nameidx = namelower.indexOf(qlower);
                if (nameidx != -1) {
                    var suggestion = {
                        "content":url,
                        "description":["<match>", name, "</match> - <url>", url, "</url>"].join('')
                    };
                    
                    if ((nameidx == 0) || ((nameidx == 1) && (namelower.indexOf(qqlower) == 0))) {
                        suggestions.push(suggestion);
                    } else {
                        second.push(suggestion);
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
                if (suggestions.length > kMaxSuggestions) {
                    break;
                }
            }
        }
                
        if (stripped_text.length >= 2) {
            suggestions.push({"content":stripped_text +  " [Google Code Search]", 
                "description":["Search for \"<match>", stripped_text, "</match> <dim>lang:c++</dim>\" using <match><url>Google Code Search</url></match> - <url>http://code.google.com/codesearch#search/&amp;q=", encodeURIComponent(stripped_text + " lang:c++"), "</url>"].join('')}); 
            suggestions.push({"content":stripped_text +  " [Development and Coding Search]", 
                "description":["Search for \"<dim>Qt</dim> <match>", stripped_text, "</match>\" using <match><url>Develoment and Coding Search</url></match> - <url>http://www.google.com/cse?cx=005154715738920500810:fmizctlroiw&amp;q=", encodeURIComponent("Qt "+stripped_text), "</url>"].join('')});
        }
        suggest_callback(suggestions);
    });
    
    chrome.omnibox.onInputEntered.addListener(function(text) {
        console.log("Input entered: " + text);
        if (!text) {
            nav("http://doc.qt.nokia.com/latest/classes.html");
            return;
        }
        
        var stripped_text = text.strip();
        if (!stripped_text) {
            nav("http://doc.qt.nokia.com/latest/classes.html");
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
            nav("http://code.google.com/codesearch#search/&q=" + encodeURIComponent(newquery + " lang:c++"));
            return;
        }
        
        var devsearch_suffix = " [Development and Coding Search]";
        if (stripped_text.endsWith(devsearch_suffix)) {
            var newquery = stripped_text.substring(0, stripped_text.length - devsearch_suffix.length).strip();
            nav("http://www.google.com/cse?cx=005154715738920500810:fmizctlroiw&q=" + encodeURIComponent("Qt "+newquery));
            return;
        }
        
        var qlower = stripped_text.toLowerCase();
        var qqlower = qlower;
        
        if (qqlower && (qqlower.charAt(0) != 'q')) {
            qqlower = 'q' + qqlower;
        }
        
        if (qt_api_) {
            for (var i = 0; i < qt_api_.length; ++i) {
                var entry = qt_api_[i];
                var name = entry['name'];
                var namelower = name.toLowerCase();
                var url = entry['url'];
                if ((namelower == qlower) || (namelower == qqlower)) {
                    nav(url);
                    return;
                }
            }
        }
        
        nav("http://www.google.com/search?q=" + encodeURIComponent("Qt "+stripped_text));
    });
})();