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
            chrome.omnibox.setDefaultSuggestion({"description":"<url><match>Standard Template Library</match></url> " + text});
        } else {
            chrome.omnibox.setDefaultSuggestion({"description":"<url><match>Standard Template Library</match></url>"});
        }
    };
    
    // Prefetch necessary data
    var stl_ = null;
    chrome.omnibox.onInputStarted.addListener(function(){
        console.log("Input started");
        setDefaultSuggestion('');
        
        if (localStorage.hasUnexpired('stl')) {
            stl_ = localStorage.getObject('stl');
        } else {
            xhr("http://www.sgi.com/tech/stl/table_of_contents.html",
            function(url, req) {
                console.log("Received: "+url);
                stl_ = {};
                var text = req.responseText;
                var matches = text.match(new RegExp("<LI>[^<]*<A href=\"[^\"]*\">[^<]*</A>", "g"));
                for (var i = 0; i < matches.length; ++i) {
                    var match = matches[i];
                    var hrefstartidx = match.indexOf("href=\"") + 6;
                    var hrefendidx = match.indexOf("\"", hrefstartidx);
                    var contentstartidx = match.indexOf(">", hrefendidx) + 1;
                    var contentendidx = match.indexOf("</A>", contentstartidx);
                    var href = match.substring(hrefstartidx, hrefendidx);
                    var content = match.substring(contentstartidx, contentendidx);
                    stl_[content.toLowerCase()] = {"name":content, "url":"http://www.sgi.com/tech/stl/"+href};
                }
                localStorage.setObject('stl', stl_);
            },
            function(url, req) {
                console.log("Failed to receive: "+url);
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
        
        var prefix = "";
        if (qlower.startsWith("std::")) {
            prefix = "std::";
            qlower = qlower.substr(5);
        }
        
        if (!qlower) {
            return;
        }
        
        if (stl_) {
            for (var key in stl_) {
                if (key.startsWith(qlower) && (key == stl_[key]["name"])) {
                    var item = stl_[key];
                    var name = item["name"];
                    var url = item["url"];
                    suggestions.push({"content":prefix + name, "description":["<match>", prefix + name, "</match> - <url>", url, "</url>"].join('')});
                    if (suggestions.length > kMaxSuggestions) {
                        break;
                    }
                }
            }
            if (prefix.length == 0) {
                for (var key in stl_) {
                    if (key.startsWith(qlower) && (key != stl_[key]["name"])) {
                        var item = stl_[key];
                        var name = item["name"];
                        var url = item["url"];
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
                "description":["Search for \"<match>", stripped_text, "</match> <dim>lang:c++</dim>\" using <match><url>Google Code Search</url></match> - <url>http://code.google.com/codesearch#search/&amp;q=", encodeURIComponent(stripped_text + " lang:c++"), "</url>"].join('')}); 
            suggestions.push({"content":stripped_text +  " [Development and Coding Search]", 
                "description":["Search for \"<match>", stripped_text, "</match>\" using <match><url>Develoment and Coding Search</url></match> - <url>http://www.google.com/cse?cx=005154715738920500810:fmizctlroiw&amp;q=", encodeURIComponent(stripped_text), "</url>"].join('')});
        }
        suggest_callback(suggestions);
    });
    
    chrome.omnibox.onInputEntered.addListener(function(text) {
        console.log("Input entered: " + text);
        if (!text) {
            nav("http://www.sgi.com/tech/stl/");
            return;
        }
        
        var stripped_text = text.strip();
        if (!stripped_text) {
            nav("http://www.sgi.com/tech/stl/");
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
            nav("http://code.google.com/codesearch#search/&q=" + encodeURIComponent(newquery +" lang:c++"));
            return;
        }
        
        var devsearch_suffix = " [Development and Coding Search]";
        if (stripped_text.endsWith(devsearch_suffix)) {
            var newquery = stripped_text.substring(0, stripped_text.length - devsearch_suffix.length).strip();
            nav("http://www.google.com/cse?cx=005154715738920500810:fmizctlroiw&q=" + encodeURIComponent(newquery));
            return;
        }
        
        var qlower = stripped_text.toLowerCase();
        if (qlower.startsWith("std::")) {
            qlower = qlower.substr(5);
        }
        
        if (stl_ && stl_[qlower]) {
            nav(stl_[qlower]["url"]);
            return;
        }
        
        nav("http://www.google.com/search?q=" + encodeURIComponent("C++ STL "+stripped_text));
    });
})();