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
            chrome.omnibox.setDefaultSuggestion({"description":"<url><match>Ruby API Search</match></url> " + text});
        } else {
            chrome.omnibox.setDefaultSuggestion({"description":"<url><match>Ruby API Search</match></url>"});
        }
    };
    
    // Prefetch necessary data
    var ruby_core_classes_ = null;
    var ruby_core_functions_ = null;  
    chrome.omnibox.onInputStarted.addListener(function(){
        console.log("Input started");
        setDefaultSuggestion('');
        
        if (localStorage.hasUnexpired('ruby_core_classes') &&
            localStorage.hasUnexpired('ruby_core_functions')) {
            ruby_core_classes_ = localStorage.getObject('ruby_core_classes');
            ruby_core_functions_ = localStorage.getObject('ruby_core_functions');
        } else {
            xhr("http://www.ruby-doc.org/core/",
            function (url, req) {
                console.log("Received: "+url);
                ruby_core_classes_ = [];
                ruby_core_functions_ = [];
                var text = req.responseText;
                var matches = text.match(new RegExp("<p class=\"class\"><span class=\"[^\"]*\">[^<]*</span><a href=\"[^\"]*\">[^<]*</a></p>", "g"));
                for (var i = 0; i < matches.length; ++i) {
                    var match = matches[i];
                    var hrefstartidx = match.indexOf("href=\"") + 6;
                    var hrefendidx = match.indexOf("\"", hrefstartidx);
                    var contentstartidx = match.indexOf(">", hrefendidx) + 1;
                    var contentendidx = match.indexOf("</a>", contentstartidx);
                    var url = "http://www.ruby-doc.org/core/" + match.substring(hrefstartidx, hrefendidx);
                    var fqn = match.substring(contentstartidx, contentendidx);
                    var classname = fqn;
                    var last_double_colon = fqn.lastIndexOf("::");
                    if (last_double_colon != -1) {
                        classname = fqn.substr(last_double_colon + 2);
                    }
                    ruby_core_classes_.push({"url":url, "fqn":fqn, "name":classname});
                }
                localStorage.setObject('ruby_core_classes', ruby_core_classes_);
                
                matches = text.match(new RegExp("<p><span class=\"[^\"]*\">[^<]*</span><a href=\"[^\"]*\">[^<]*</a></p>", "g"));
                for (var i = 0; i < matches.length; ++i) {
                    var match = matches[i];
                    var hrefstartidx = match.indexOf("href=\"") + 6;
                    var hrefendidx = match.indexOf("\"", hrefstartidx);
                    var contentstartidx = match.indexOf(">", hrefendidx) + 1;
                    var contentendidx = match.indexOf("</a>", contentstartidx);
                    var url = "http://www.ruby-doc.org/core/" + match.substring(hrefstartidx, hrefendidx);
                    ruby_core_functions_.push({"url":url, "name":match.substring(contentstartidx, contentendidx)});
                }
                localStorage.setObject('ruby_core_functions', ruby_core_functions_);
                
            },
            function (url, req) {
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
        var stripped_text = text.trim();
        if (!stripped_text) {
            return;
        }
        var qlower = stripped_text.toLowerCase();
        
        var second = [];
        var third = [];
        if (ruby_core_classes_) {
            for (var i = 0; i < ruby_core_classes_.length; ++i) {
                var entry = ruby_core_classes_[i];
                var url = entry["url"];
                var name = entry["name"];
                var fqn = entry["fqn"];
                var namelower = name.toLowerCase();
                var fqnlower = fqn.toLowerCase();
                var namestartswith = namelower.startsWith(qlower);
                var fqnstartswith = fqnlower.startsWith(qlower);
                var containsword = fqnlower.indexOf(qlower) != -1;
                if (namestartswith || fqnstartswith || containsword) {
                    var completion = {
                        "content":url,
                        "description":["<match>", name, "</match> (<match>", fqn, "</match>) <dim>[Class]</dim> - <url>", url, "</url>"].join('')
                    };
                    if (namestartswith) {
                        suggestions.push(completion);
                    } else if (fqnstartswith) {
                        second.push(completion);
                    } else {
                        third.push(completion);
                    }
                }
                if (suggestions.length >= kMaxSuggestions) {
                    break;
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
        
        if (ruby_core_functions_) {
            for (var i = 0; i < ruby_core_functions_.length; ++i) {
                var entry = ruby_core_functions_[i];
                var name = entry["name"];
                var url = entry["url"];
                var namelower = name.toLowerCase();
                if (namelower.startsWith(qlower) || namelower == qlower) {
                    suggestions.push({
                        "content":url,
                        "description":["<match>", name, "</match> <dim>[Function]</dim> - <url>", url, "</url>"].join('')
                    });
                    if (suggestions.length > kMaxSuggestions) {
                        break;
                    }
                }
            }
        }

        if (stripped_text.length >= 2) {
            suggestions.push({"content":stripped_text +  " [Google Code Search]", 
                "description":["Search for \"<match>", stripped_text, "</match> <dim>lang:ruby</dim>\" using <match><url>Google Code Search</url></match> - <url>http://code.google.com/codesearch#search/&amp;q=", encodeURIComponent(stripped_text + " lang:ruby"), "</url>"].join('')}); 
            suggestions.push({"content":stripped_text +  " [Development and Coding Search]", 
                "description":["Search for \"Ruby <match>", stripped_text, "</match>\" using <match><url>Develoment and Coding Search</url></match> - <url>http://www.google.com/cse?cx=005154715738920500810:fmizctlroiw&amp;q=", encodeURIComponent("Ruby "+stripped_text), "</url>"].join('')});
        }
        suggest_callback(suggestions);
    });
    
    chrome.omnibox.onInputEntered.addListener(function(text) {
        console.log("Input entered: " + text);
        if (!text) {
            nav("http://www.ruby-doc.org/");
            return;
        }
        
        var stripped_text = text.trim();
        if (!stripped_text) {
            nav("http://www.ruby-doc.org/");
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
            var newquery = stripped_text.substring(0, stripped_text.length - google_codesearch_suffix.length).trim();
            nav("http://code.google.com/codesearch#search/&q=" + encodeURIComponent(newquery + " lang:ruby"));
            return;
        }
        
        var devsearch_suffix = " [Development and Coding Search]";
        if (stripped_text.endsWith(devsearch_suffix)) {
            var newquery = stripped_text.substring(0, stripped_text.length - devsearch_suffix.length).trim();
            nav("http://www.google.com/cse?cx=005154715738920500810:fmizctlroiw&q=" + encodeURIComponent("Ruby "+newquery));
            return;
        }
        
        var qlower = stripped_text.toLowerCase();
        if (ruby_core_classes_) {
            for (var i = 0; i < ruby_core_classes_.length; ++i) {
                var entry = ruby_core_classes_[i];
                var namelower = entry["name"].toLowerCase();
                var fqnlower = entry["fqn"].toLowerCase();
                if ((namelower == qlower) || (fqnlower == qlower)) {
                    nav(entry["url"]);
                    return;
                }
            }
        }
        if (ruby_core_functions_) {
            for (var i = 0; i < ruby_core_functions_.length; ++i) {
                var entry = ruby_core_functions_[i];
                var namelower = entry["name"].toLowerCase();
                if (namelower == qlower) {
                    nav(entry["url"]);
                    return;
                }
            }
        }
        
        nav("http://www.google.com/search?q=" + encodeURIComponent("Ruby "+stripped_text));
    });
})();