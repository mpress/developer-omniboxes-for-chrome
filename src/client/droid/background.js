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
            chrome.omnibox.setDefaultSuggestion({"description":"<url><match>Android™ API Search</match></url> " + text});
        } else {
            chrome.omnibox.setDefaultSuggestion({"description":"<url><match>Android™ API Search</match></url>"});
        }
    };
    
    // Prefetch necessary data
    var android_api_ = null;
    chrome.omnibox.onInputStarted.addListener(function(){
        console.log("Input started");
        setDefaultSuggestion('');
        
        if (localStorage.hasUnexpired('android_api')) {
            android_api_ = localStorage.getObject('android_api');
        } else {
            xhr("http://developer.android.com/reference/classes.html",
            function(url, req) {
                console.log("Received: "+url);
                android_api_ = [];
                var slash_reference = new RegExp("/reference/");
                var dothtml = new RegExp(".html$");
                var slash = new RegExp("/", "g");
                var text = req.responseText;
                var nbsp = new RegExp("&nbsp;", "g");
                var andnbsp = new RegExp("&amp;nbsp;", "g");
                var pstart = new RegExp("<p>", "g");
                var pend = new RegExp("</p>", "g");
                var codestart = new RegExp("<code>", "g");
                var codeend = new RegExp("</code>", "g");
                var spaces = new RegExp("\\s+", "g");
                var matches = text.match(new RegExp("<tr class=\"(alt-color)?\\s*api\\s*apilevel-[0-9]+\"\\s*>\\s*<td class=\"jd-linkcol\"><a href=\"/reference/[^\"]*\">[^<]*</a></td>\\s*<td class=\"jd-descrcol\" width=\"100%\">(<code>|<p>|<a href=\"[^\"]*\">[^<]*</a>|[^<])*</td>\\s*</tr>", "g"));
                for (var i = 0; i < matches.length; ++i) {
                    var match = matches[i];
                    console.log(match);
                    var apilevelstartidx = match.indexOf("apilevel-") + 9;
                    var apilevelendidx = match.indexOf("\"", apilevelstartidx);
                    var apilevel = match.substring(apilevelstartidx, apilevelendidx);
                    var hrefstartidx = match.indexOf("href=\"", apilevelendidx) + 6;
                    var hrefendidx = match.indexOf("\"", hrefstartidx);
                    var href = match.substring(hrefstartidx, hrefendidx);
                    var namestartidx = match.indexOf(">", hrefendidx) + 1;
                    var nameendidx = match.indexOf("</a>", namestartidx);
                    var name = match.substring(namestartidx, nameendidx);
                    var descriptionstartidx = match.indexOf("width=\"100%\">") + 13;
                    var descriptionendidx = match.indexOf("</td>", descriptionstartidx);
                    var description = match.substring(descriptionstartidx, descriptionendidx).replace(nbsp, " ").replace(andnbsp, " ").replace(pstart, "").replace(pend, "").replace(codestart, "").replace(codeend, "").replace(spaces, " ").strip();
                    var url = "http://developer.android.com" + href;
                    var fqn = href.replace(slash_reference, "").replace(dothtml, "").replace(slash, "."); 
                    android_api_.push({"fqn":fqn, "name":name, "url":url, "apilevel":apilevel, "description":description});
                }
                localStorage.setObject('android_api', android_api_);
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
        
        var second = [];
        var third = [];
        var fourth = [];
        if (android_api_) {
            for (var i = 0; i < android_api_.length; ++i) {
                var item = android_api_[i];
                var fqn = item["fqn"];
                var name = item["name"];
                var namelower = name.toLowerCase();
                var nameidx = namelower.indexOf(qlower);
                var fqnlower = fqn.toLowerCase();
                var fqnidx = fqn.indexOf(qlower);
                if ((nameidx != -1) || (fqnidx != -1)) {
                    var url = item["url"];
                    var description = item["description"];
                    var apilevel = item["apilevel"];
                    var target = null;
                    if (nameidx == 0) {
                        target = suggestions;
                    } else if (nameidx != -1) {
                        target = second;
                    } else if (fqnidx == 0) {
                        target = third;
                    } else {
                        target = fourth;
                    }
                    
                    if (description && (description.length > 5)) {
                        target.push({"content":url, "description":["<match>", name, "</match> (<match>", fqn, "</match>) <dim>[API Level: <match>", apilevel, "</match>]</dim> - ", description].join('')});
                    } else {
                        target.push({"content":url, "description":["<match>", name, "</match> (<match>", fqn, "</match>) <dim>[API Level: <match>", apilevel, "</match>]</dim> - <url>", url, "</url>"].join('')});
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
        
        if (suggestions.length < kMaxSuggestions) {
            for (var i = 0; i < fourth.length; ++i) {
                suggestions.push(fourth[i]);
            }
        }
        
        if (stripped_text.length >= 2) {
            suggestions.push({"content":stripped_text + " [Android Developers' Search]",
                "description":["Search for \"<match>", stripped_text, "</match>\" using <match><url>Android Developers' Search</url></match> - <url>http://developer.android.com/search.html#q=", encodeURIComponent(stripped_text) ,"&amp;t=0</url>"].join('')});
            suggestions.push({"content":stripped_text +  " [Google Code Search]", 
                "description":["Search for \"<dim>android</dim> <match>", stripped_text, "</match> <dim>lang:java</dim>\" using <match><url>Google Code Search</url></match> - <url>http://code.google.com/codesearch#search/&amp;q=", encodeURIComponent("android " + stripped_text + " lang:java"), "</url>"].join('')}); 
            suggestions.push({"content":stripped_text +  " [Development and Coding Search]", 
                "description":["Search for \"<dim>android</dim> <match>", stripped_text, "</match>\" using <match><url>Develoment and Coding Search</url></match> - <url>http://www.google.com/cse?cx=005154715738920500810:fmizctlroiw&amp;q=", encodeURIComponent("android "+stripped_text), "</url>"].join('')});
        }
        suggest_callback(suggestions);
    });
    
    chrome.omnibox.onInputEntered.addListener(function(text) {
        console.log("Input entered: " + text);
        if (!text) {
            nav("http://developer.android.com/reference/classes.html");
            return;
        }
        
        var stripped_text = text.strip();
        if (!stripped_text) {
            nav("http://developer.android.com/reference/classes.html");
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
                
        var android_devsearch_suffix = " [Android Developers' Search]";
        if (stripped_text.endsWith(android_devsearch_suffix)) {
            var newquery = stripped_text.substring(0, stripped_text.length - android_devsearch_suffix.length).strip();
            nav("http://developer.android.com/search.html#q=" + encodeURIComponent(newquery) + "&t=0");
            return;
        }

        
        var google_codesearch_suffix = " [Google Code Search]";
        if (stripped_text.endsWith(google_codesearch_suffix)) {
            var newquery = stripped_text.substring(0, stripped_text.length - google_codesearch_suffix.length).strip();
            nav("http://code.google.com/codesearch#search/&q=" + encodeURIComponent("android "+newquery + " lang:java"));
            return;
        }
        
        var devsearch_suffix = " [Development and Coding Search]";
        if (stripped_text.endsWith(devsearch_suffix)) {
            var newquery = stripped_text.substring(0, stripped_text.length - devsearch_suffix.length).strip();
            nav("http://www.google.com/cse?cx=005154715738920500810:fmizctlroiw&q=" + encodeURIComponent("android "+newquery));
            return;
        }
        
        var qlower = stripped_text.toLowerCase();
        if (android_api_) {
            for (var i = 0; i < android_api_.length; ++i) {
                var item = android_api_[i];
                var fqn = item["fqn"];
                var name = item["name"];
                if ((name.toLowerCase() == qlower) || (fqn.toLowerCase() == qlower)) {
                    nav(item["url"]);
                    return;
                }
            }
        }
          
        nav("http://www.google.com/search?q=" + encodeURIComponent("Android "+stripped_text));
    });
})();