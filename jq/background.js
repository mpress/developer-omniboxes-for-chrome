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
            chrome.omnibox.setDefaultSuggestion({"description":"<url><match>jQuery API Search</match></url> " + text});
        } else {
            chrome.omnibox.setDefaultSuggestion({"description":"<url><match>jQuery API Search</match></url>"});
        }
    };
    
    function simplifiedName(canonical_name) {
        var simplified_name = canonical_name;
        if (simplified_name.startsWith("jquery.")) {
            simplified_name = "$." + simplified_name.substr(7);
        } else if (simplified_name == "jquery") {
            simplified_name = "$";
        }
        if (simplified_name.startsWith(".")) {
            simplified_name = "$" + simplified_name;
        }
        var selector_index = simplified_name.indexOf(" selector");
        if (selector_index != -1) {
            simplified_name = simplified_name.substring(0, selector_index).strip();
        }
        var template_index = simplified_name.indexOf(" template tag");
        if (template_index != -1) {
            simplified_name = simplified_name.substring(0, template_index).strip();
        }
        if (simplified_name.endsWith("()")) {
            simplified_name = simplified_name.substr(0, simplified_name.length - 2);
        }
        return simplified_name;
    }
    
    // Prefetch necessary data
    var jquery_api_ = null;
    chrome.omnibox.onInputStarted.addListener(function(){
        console.log("Input started");
        setDefaultSuggestion('');
        
        if (localStorage.hasUnexpired('jquery_api')) {
            jquery_api_ = localStorage.getObject('jquery_api');
        } else {
            xhr("http://api.jquery.com/",
            function(url, req) {
                console.log("Received: "+url);
                jquery_api_ = [];
                var text = req.responseText;
                var matches = text.match(new RegExp("<li id=\"[^\"]*\" class=\"[^\"]*\"><h2 class=\"entry-title\"><a class=\"title-link\" href=\"http://api.jquery.com/[^\"]*\" rel=\"bookmark\" title=\"[^\"]*\">[^<]*</a></h2>.*<p class=\"desc\">([^<]|(<code>)|(</code>)|<a href=\"[^\"]*\">|</a>)*</p></li>", "g"));
                var jquerydot = new RegExp("jquery\.", "g");
                var a_start = new RegExp("<a href=\"[^\"]*\">", "g");
                var a_end = new RegExp("</a>", "g");
                var code_start = new RegExp("<code>", "g");
                var code_end = new RegExp("</code>", "g");
                for (var i = 0; i < matches.length; i++) {
                    var match = matches[i];
                    var urlstartidx = match.indexOf("api.jquery.com/") + 15;
                    var urlfinishidx = match.indexOf("/\" rel=\"");
                    var href = match.substring(urlstartidx, urlfinishidx);
                    if (!href) { continue; }
                    var contentstartidx = match.indexOf(">", urlfinishidx) + 1;
                    var contentfinishidx = match.indexOf("</a>");
                    var descstartidx = match.indexOf("<p class=\"desc\">") + 16;
                    var descendidx = match.indexOf("</p>");
                    var description = match.substring(descstartidx, descendidx).replace(a_start, "").replace(a_end, "").replace(code_start, "").replace(code_end, "");
                    var name = String(match.substring(contentstartidx, contentfinishidx));
                    var fqn = (new String(href)).replace(new RegExp(".*/(.*)/$"), "$1").toLowerCase();
                    var namelower = name.toLowerCase();
                    var simple_name = simplifiedName(namelower);
                    jquery_api_.push({"name":name, "simple_name":simple_name, "fqn":fqn, "url":"http://api.jquery.com/" + href, "description":description});
                }
                localStorage.setObject('jquery_api', jquery_api_);
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
        
        if ("jquery".startsWith(qlower) || (qlower == "jquery")) {
            suggestions.push({
                "content":"http://api.jquery.com/jQuery",
                "description":"<match>jQuery</match> - Accepts a string containing a CSS selector which is then used to match a set of elements."});
        } else if ("$".startsWith(qlower) || (qlower == "$")) {
            suggestions.push({
                "content":"http://api.jquery.com/jQuery",
                "description":"<match>$</match> - Accepts a string containing a CSS selector which is then used to match a set of elements."});
        }

        var qlowersimplified = simplifiedName(qlower);
        var jquerymatcher = /^jQuery/;
        var dotmatcher = /^\./;
        var use_dollar_sign = false;
        if (qlower.startsWith("$")) {
            use_dollar_sign = true;
            qlower = 'jquery'+qlower.substr(1);
        }
        
        var second = [];
        var third = [];
        if (jquery_api_) {
            for (var i = 0; i < jquery_api_.length; ++i) {
                var entry = jquery_api_[i];
                var name = entry["name"];
                var namelower = name.toLowerCase();
                var simple_name = entry["simple_name"];
                var nameloweridx = namelower.indexOf(qlower);
                var simpleidx = simple_name.indexOf(qlowersimplified);
                
                if ((nameloweridx != -1) || (simpleidx != -1)) {
                    var target = null;
                    if ((simple_name.startsWith(':'+qlowersimplified)) || (simple_name.startsWith("$."+qlowersimplified)) || (simple_name.startsWith("$"+qlowersimplified))) {
                        target = suggestions;
                    } else if ((simpleidx == 0) || (nameloweridx == 0)) {
                        target = second;
                    } else {
                        target = third;
                    }
                    
                    if (use_dollar_sign) {
                        target.push({
                            "content":entry["url"],
                            "description":["<match>", name.replace(jquerymatcher, "$").replace(dotmatcher, "$."), "</match> - ", entry["description"]].join('')});
                    } else {
                        target.push({
                            "content":entry["url"],
                            "description":["<match>", name, "</match> - ", entry["description"]].join('')});
                    }
                }
                
                if (suggestions.length > kMaxSuggestions) {
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
        
        if (stripped_text.length >= 2) {
            suggestions.push({"content":stripped_text +  " [Google Code Search]", 
                "description":["Search for \"<dim>jquery</dim> <match>", stripped_text, "</match> <dim>lang:javascript</dim>\" using <match><url>Google Code Search</url></match> - <url>http://code.google.com/codesearch#search/&amp;q=", encodeURIComponent("jquery " + stripped_text + " lang:javascript"), "</url>"].join('')}); 
            suggestions.push({"content":stripped_text +  " [Development and Coding Search]", 
                "description":["Search for \"<dim>jQuery</dim> <match>", stripped_text, "</match>\" using <match><url>Develoment and Coding Search</url></match> - <url>http://www.google.com/cse?cx=005154715738920500810:fmizctlroiw&amp;q=", encodeURIComponent("jQuery "+stripped_text), "</url>"].join('')});
        }
        suggest_callback(suggestions);
    });
    
    chrome.omnibox.onInputEntered.addListener(function(text) {
        console.log("Input entered: " + text);
        if (!text) {
            nav("http://api.jquery.com/");
            return;
        }
        
        var stripped_text = text.strip();
        if (!stripped_text) {
            nav("http://api.jquery.com/");
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
            nav("http://code.google.com/codesearch#search/&q=" + encodeURIComponent("jquery "+newquery + " lang:javascript"));
            return;
        }
        
        var devsearch_suffix = " [Development and Coding Search]";
        if (stripped_text.endsWith(devsearch_suffix)) {
            var newquery = stripped_text.substring(0, stripped_text.length - devsearch_suffix.length).strip();
            nav("http://www.google.com/cse?cx=005154715738920500810:fmizctlroiw&q=" + encodeURIComponent("jQuery "+newquery));
            return;
        }
        
        var qlower = stripped_text.toLowerCase();
        if ((qlower == "jquery") || (qlower == "$")) {
            nav("http://api.jquery.com/jQuery");
            return;
        }
        
        if (jquery_api_) {
            var qlowersimplified = simplifiedName(qlower);
            for (var i = 0; i < jquery_api_.length; ++i) {
                var entry = jquery_api_[i];
                var name = entry["name"];
                var namelower = name.toLowerCase();
                var simple_name = entry["simple_name"];
                              
                if ((namelower == qlower) || (simple_name == qlowersimplified) || (simple_name == ('$.'+qlowersimplified)) || (simple_name == (':'+qlowersimplified)) || (simple_name == ('{{'+qlowersimplified + '}}')) || (entry["fqn"].toLowerCase() == qlower)) {
                    nav(entry["url"]);
                    return;
                }
            }
        }
        
        nav("http://www.google.com/search?q=" + encodeURIComponent("jQuery "+stripped_text));
    });
})();