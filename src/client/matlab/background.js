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
            chrome.omnibox.setDefaultSuggestion({"description":"<url><match>Matlab API Search</match></url> " + text});
        } else {
            chrome.omnibox.setDefaultSuggestion({"description":"<url><match>Matlab API Search</match></url>"});
        }
    };
    
    // Prefetch necessary data
    var matlab_api_ = null;
    chrome.omnibox.onInputStarted.addListener(function(){
        console.log("Input started");
        setDefaultSuggestion('');
        
        if (localStorage.hasUnexpired('matlab_api')) {
            matlab_api_ = localStorage.getObject('matlab_api');
            return;
        }
        
        xhr("http://www.mathworks.com/help/techdoc/ref/funcalpha.html",
        function(url, req) {
            console.log("Received: "+url);
            matlab_api_ = [];
            var text = req.responseText;
            var matches = text.match(new RegExp("<tr><td valign=\"top\">(&nbsp;&nbsp;&nbsp;&nbsp;)?(<a name=\"[A-Z]\"></a>)?<a href=\"([A-Z]|[a-z]|[0-9]|_|\\.)+\\.html\">([^<](<tt>)?(</tt>)?)*</a></td><td>([^<](<tt>)?(</tt>)?)*</td></tr>", "g"));
            var hrefregex = new RegExp("([A-Za-z0-9]|_|\\.)+\\.html");
            var tt_start = new RegExp("<tt>", "g");
            var tt_end = new RegExp("</tt>", "g");
            var spaces = new RegExp("[\\s]+", "g");
            var html_suffix = new RegExp("\\.html", "g");
            for (var i = 0; i < matches.length; ++i) {
                var match = matches[i];
                var hrefidx = match.indexOf("<a href=\"");
                var hrefstartidx = hrefidx + 9;
                var hrefendidx = match.indexOf("\"", hrefstartidx);
                var href = match.substring(hrefstartidx, hrefendidx);
                if (!href.match(hrefregex)) {
                    continue;
                }
                var contentstartidx = match.indexOf("</td><td>", hrefendidx) + 9;
                var contentendidx = match.indexOf("</td>", contentstartidx);
                var content = match.substring(contentstartidx, contentendidx).replace(tt_start, "").replace(tt_end, "").replace(spaces, " ");
                var name = href.replace(html_suffix, "");
                if (match.indexOf("&nbsp;&nbsp;&nbsp;&nbsp;") != -1) {
                    var first_dot = name.indexOf(".");
                    if (first_dot != -1) {
                        name = name.substr(first_dot+1);
                    }
                }
                matlab_api_.push({'name':name, 'description':content, 'url':'http://www.mathworks.com/help/techdoc/ref/'+href});
            }
            localStorage.setObject('matlab_api', matlab_api_);
        },
        function(url, req) {
            console.log("Failed to receive: "+url);
        }).send();
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
        
        var second = [];
        if (matlab_api_) {
            for (var i = 0; i < matlab_api_.length; i++) {
                var entry = matlab_api_[i];
                var name = entry["name"];
                var url = entry["url"];
                var description = entry["description"];
                var namelower = name.toLowerCase();
                var idx = namelower.indexOf(qlower);
                if (idx != -1) {
                    var suggestion = {
                        "content":url,
                        "description":["<match>", name, "</match> (", description, ") - <url>", url, "</url>"].join('')
                    };
                    if (idx == 0) {
                        suggestions.push(suggestion);
                    } else {
                        second.push(suggestion);
                    }
                }
                if (suggestions.length > kMaxSuggestions) {
                    break;
                }
            }
        }
        
        if (suggestions.length < kMaxSuggestions) {
            for (var i = 0; i < second.length; i++) {
                suggestions.push(second[i]);
                if (suggestions.length > kMaxSuggestions) {
                    break;
                }
            }
        }
        
        if (stripped_text.length >= 2) {
            suggestions.push({"content":stripped_text +  " [Google Code Search]", 
                "description":["Search for \"<match>", stripped_text, "</match> <dim>lang:matlab</dim>\" using <match><url>Google Code Search</url></match> - <url>http://code.google.com/codesearch#search/&amp;q=", encodeURIComponent(stripped_text+" lang:matlab"), "</url>"].join('')}); 
            suggestions.push({"content":stripped_text +  " [Development and Coding Search]", 
                "description":["Search for \"<dim>Matlab</dim> <match>", stripped_text, "</match>\" using <match><url>Develoment and Coding Search</url></match> - <url>http://www.google.com/cse?cx=005154715738920500810:fmizctlroiw&amp;q=", encodeURIComponent("Matlab "+stripped_text), "</url>"].join('')});
        }
        suggest_callback(suggestions);
    });
    
    chrome.omnibox.onInputEntered.addListener(function(text) {
        console.log("Input entered: " + text);
        if (!text) {
            nav("http://www.mathworks.com/help/techdoc/index.html");
            return;
        }
        
        var stripped_text = text.strip();
        if (!stripped_text) {
            nav("http://www.mathworks.com/help/techdoc/index.html");
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
            nav("http://code.google.com/codesearch#search/&q=" + encodeURIComponent(newquery+" lang:matlab"));
            return;
        }
        
        var devsearch_suffix = " [Development and Coding Search]";
        if (stripped_text.endsWith(devsearch_suffix)) {
            var newquery = stripped_text.substring(0, stripped_text.length - devsearch_suffix.length).strip();
            nav("http://www.google.com/cse?cx=005154715738920500810:fmizctlroiw&q=" + encodeURIComponent("Matlab "+newquery));
            return;
        }
        
        var qlower = stripped_text.toLowerCase();
        if (matlab_api_) {
            for (var i = 0; i < matlab_api_.length; i++) {
                var entry = matlab_api_[i];
                var name = entry["name"];
                var url = entry["url"];
                if (name.toLowerCase() == qlower) {
                    nav(url);
                    return;
                }
            }
        }
        
        nav("http://www.google.com/search?q=" + encodeURIComponent("Matlab "+stripped_text));
    });
})();