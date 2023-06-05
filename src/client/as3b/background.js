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
            chrome.omnibox.setDefaultSuggestion({"description":"<url><match>ActionScript 3.0 Beta</match></url> " + text});
        } else {
            chrome.omnibox.setDefaultSuggestion({"description":"<url><match>ActionScript 3.0 Beta</match></url>"});
        }
    };
    
    // Prefetch necessary data
    var as3_beta_ = null;
    chrome.omnibox.onInputStarted.addListener(function(){
        console.log("Input started");
        setDefaultSuggestion('');
        
        if (localStorage.hasUnexpired('as3b')) {
            as3_beta_ = localStorage.getObject('as3b');
        } else {
            xhr("http://help.adobe.com/en_US/FlashPlatform/beta/reference/actionscript/3/class-summary.html",
            function(url, req) {
                console.log("Received: "+url);
                as3_beta_ = [];
                var text = req.responseText;
                var slashes = new RegExp("/", "g");
                var dothtml = new RegExp(".html", "");
                var begin_italics = new RegExp("<I>", "g");
                var end_italics = new RegExp("</I>", "g");
                var begin_italics_lower = new RegExp("<i>", "g");
                var end_italics_lower = new RegExp("</i>", "g");
                var dotslash = new RegExp("^\.\/", "");
                var matches = text.match(new RegExp("<td class=\"summaryTableSecondCol\"><a(\\s+target=\"[^\"]*\")?(\\s+href=\"[^\"]*\")>(<i>)?[^<]*(</i>)?</a>(&nbsp;)?(<span(\\s+[^>]*)?>[^<]*</span>)?<br></td><td class=\"summaryTableCol\"><a(\\s+target=\"[^\"]*\")?(\\s+href=\"[^\"]*\")(\\s+onclick=\"[^\"]*\")?>(<i>)?[^<]*(</i>)?</a></td>", "g"));
                for (var i = 0; i < matches.length; i++) {
                    var match = matches[i];
                    var hrefidx = match.indexOf("href=\"");
                    if (hrefidx == -1 ){
                        continue;
                    }
                    hrefidx += 6;
                    var endhrefidx = match.indexOf("\">", hrefidx);
                    var href = match.substring(hrefidx, endhrefidx).replace(dotslash, "").trim();
                    var starta = match.indexOf(">", endhrefidx) + 1;
                    var stopa = match.indexOf("</a>", starta);
                    var classname = match.substring(starta, stopa).replace(begin_italics, "").replace(end_italics, "").replace(begin_italics_lower, "").replace(end_italics_lower, "").trim();
                    var fqn = href.replace(dothtml,"").replace(slashes, ".").trim();
                    as3_beta_.push({"name":classname, "fqn":fqn, "url":href});
                }
                localStorage.setObject('as3b', as3_beta_);
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
        var stripped_text = text.trim();
        if (!stripped_text) {
            return;
        }
        var qlower = stripped_text.toLowerCase();
        
        var second_ = [];
        var third_ = [];
        var fourth_ = [];
        if (as3_beta_) {
            for (var i = 0; i < as3_beta_.length; ++i) {
                var entry = as3_beta_[i];
                var name = entry["name"];
                var fqn = entry["fqn"];
                var url = "http://help.adobe.com/en_US/FlashPlatform/beta/reference/actionscript/3/" + entry["url"];
                var namelower = name.toLowerCase();
                var fqnlower = fqn.toLowerCase();
                var nameidx = namelower.indexOf(qlower);
                var fqnidx = fqnlower.indexOf(qlower);
                if ((namelower == qlower) || (fqnlower == qlower) || (nameidx !=-1) || (fqnidx !=-1)) {
                    var suggestion = {
                        "content":url,
                        "description":["<match>", name, "</match> (<match>", fqn, "</match>) - <url>", url, "</url>"].join('')};
                    if ((namelower == qlower) || (fqnlower == qlower) || (nameidx == 0)) {
                        suggestions.push(suggestion);
                    } else if (nameidx != -1) {
                        second_.push(suggestion);
                    } else if (fqnidx == 0) {
                        third_.push(suggestion);
                    } else {
                        fourth_.push(suggestion);
                    }
                }
                if (suggestions.length > kMaxSuggestions) {
                    break;
                }
            }
        }
        
        if (suggestions.length < kMaxSuggestions) {
            for (var i = 0; i < second_.length; ++i) {
                suggestions.push(second_[i]);
            }
        }

        if (suggestions.length < kMaxSuggestions) {
            for (var i = 0; i < third_.length; ++i) {
                suggestions.push(third_[i]);
            }
        }
        
        if (suggestions.length < kMaxSuggestions) {
            for (var i = 0; i < fourth_.length; ++i) {
                suggestions.push(fourth_[i]);
            }
        }
        
        if (stripped_text.length >= 2) {
            suggestions.push({"content":stripped_text +  " [Adobe Community Help]", 
                "description":["Search for \"<match>", stripped_text, "</match>\" using <match><url>Adobe Community Help Search</url></match> - <url>http://community.adobe.com/help/search.html?q=",
                encodeURIComponent(stripped_text), "&amp;loc=en_US&amp;hl=en_US&amp;lbl=0&amp;go=Search&amp;self=1&amp;site=communityhelp_platform_aslr</url>"].join('')}); 
            suggestions.push({"content":stripped_text +  " [Google Code Search]", 
                "description":["Search for \"<match>", stripped_text, "</match> <dim>lang:actionscript</dim>\" using <match><url>Google Code Search</url></match> - <url>http://code.google.com/codesearch#search/&amp;q=", encodeURIComponent(stripped_text + " lang:actionscript"), "</url>"].join('')}); 
            suggestions.push({"content":stripped_text +  " [Development and Coding Search]",  
                "description":["Search for \"<match>", stripped_text, "</match>\" using <match><url>Develoment and Coding Search</url></match> - <url>http://www.google.com/cse?cx=005154715738920500810:fmizctlroiw&amp;q=", encodeURIComponent(stripped_text), "</url>"].join('')});
        }
        suggest_callback(suggestions);
    });
    
    chrome.omnibox.onInputEntered.addListener(function(text) {
        console.log("Input entered: " + text);
        if (!text) {
            nav("http://help.adobe.com/en_US/FlashPlatform/beta/reference/actionscript/3/");
            return;
        }
        
        var stripped_text = text.trim();
        if (!stripped_text) {
            nav("http://help.adobe.com/en_US/FlashPlatform/beta/reference/actionscript/3/");
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
                        
        var adobe_help_suffix = " [Adobe Community Help]";
        if (stripped_text.endsWith(adobe_help_suffix)) {
            var newquery = stripped_text.substring(0, stripped_text.length - adobe_help_suffix.length).trim();
            nav(["http://community.adobe.com/help/search.html?q=", encodeURIComponent(newquery), "&loc=en_US&hl=en_US&lbl=0&go=Search&self=1&site=communityhelp_platform_aslr"].join(''));
            return;
        }
        
        var google_codesearch_suffix = " [Google Code Search]";
        if (stripped_text.endsWith(google_codesearch_suffix)) {
            var newquery = stripped_text.substring(0, stripped_text.length - google_codesearch_suffix.length).trim();
            nav("http://code.google.com/codesearch#search/&q=" + encodeURIComponent(newquery + " lang:actionscript"));
            return;
        }
        
        var devsearch_suffix = " [Development and Coding Search]";
        if (stripped_text.endsWith(devsearch_suffix)) {
            var newquery = stripped_text.substring(0, stripped_text.length - devsearch_suffix.length).trim();
            nav("http://www.google.com/cse?cx=005154715738920500810:fmizctlroiw&q=" + encodeURIComponent(newquery));
            return;
        }
        
        var qlower = stripped_text.toLowerCase();
        if (as3_beta_) {
            for (var i = 0; i < as3_beta_.length; ++i) {
                var entry = as3_beta_[i];
                var name = entry["name"];
                var fqn = entry["fqn"];
                var url = "http://help.adobe.com/en_US/FlashPlatform/beta/reference/actionscript/3/" + entry["url"];
                var namelower = name.toLowerCase();
                var fqnlower = fqn.toLowerCase();
                if ((namelower == qlower) || (fqnlower == qlower)) {
                    nav(url);
                    return;
                }
            }
        }
        
        nav("http://www.google.com/search?q=" + encodeURIComponent("ActionScript 3 Beta "+stripped_text));
    });
})();