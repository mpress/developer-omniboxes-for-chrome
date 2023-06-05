// == Helper Prototype Extensions ==
Storage.prototype.setObject = function(key, value, opt_expiration) {
	
  var expiration = opt_expiration || 3e9; // defaults to a little bit more than 1 month
    
  if ( expiration > 0 ) {	
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
    
    // Creates a URL that is relative to the given base URL
    function relurl(baseurl, url) {
        if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("ftp://")) {
            return url;
        } else if (url.startsWith("/")) {
            var dot_slash_idx = baseurl.indexOf("://");
            if (dot_slash_idx == -1) {
                return null;
            }
            var first_slash_idx = baseurl.indexOf("/", dot_slash_idx + 3);
            if (first_slash_idx == -1) {
                return baseurl + url;
            } else {
                return baseurl.substring(0, first_slash_idx) + url;
            }
        } else {
            return baseurl + url;
        }
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
            chrome.omnibox.setDefaultSuggestion({"description":"<url><match>JavaScript API</match></url> " + text});
        } else {
            chrome.omnibox.setDefaultSuggestion({"description":"<url><match>JavaScript API</match></url>"});
        }
    };
    
    
    var predefined_ = 
    [
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
        {"name":"", "fqn":"", "description":"", "url":""},
    ];
    
    // Prefetch necessary data
    chrome.omnibox.onInputStarted.addListener(function(){
        console.log("Input started");
        setDefaultSuggestion('');
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
        
        var kBaseURL = "https://developer.mozilla.org/en/JavaScript/";
        var kMaxSuggestions = 10;
        var suggestions = [];
        var stripped_text = text.trim();
        if (!stripped_text) {
            return;
        }
        var qlower = stripped_text.toLowerCase();
        
        // TODO
        
        if (stripped_text.length >= 2) {
            suggestions.push({"content":stripped_text +  " [Google Code Search]", 
                "description":["Search for \"<match>", stripped_text, "</match> <dim>lang:javascript</dim>\" using <match><url>Google Code Search</url></match> - <url>http://code.google.com/codesearch#search/&amp;q=", encodeURIComponent(stripped_text + " lang:javascript"), "</url>"].join('')}); 
            suggestions.push({"content":stripped_text +  " [Development and Coding Search]", 
                "description":["Search for \"<dim>JavaScript</dim> <match>", stripped_text, "</match>\" using <match><url>Develoment and Coding Search</url></match> - <url>http://www.google.com/cse?cx=005154715738920500810:fmizctlroiw&amp;q=", encodeURIComponent("JavaScript "+stripped_text), "</url>"].join('')});
            suggestions.push({"content":stripped_text + " [Mozilla Developer Network]",
                "description":["Search for \"<match>", stripped_text, "</match>\" using <match><url>Mozilla Developer Network Search</url></match> - <url>https://developer.mozilla.org/en-US/search?q=", encodeURIComponent(stripped_text), "</url>"].join('')});
        }
        suggest_callback(suggestions);
    });
    
    chrome.omnibox.onInputEntered.addListener(function(text) {
        console.log("Input entered: " + text);
        if (!text) {
            nav("https://developer.mozilla.org/en/JavaScript");
            return;
        }
        
        var stripped_text = text.trim();
        var qlower = stripped_text.toLowerCase();
        
        if (!stripped_text) {
            nav("https://developer.mozilla.org/en/JavaScript");
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
            nav("http://code.google.com/codesearch#search/&q=" + encodeURIComponent(newquery + " lang:javascript"));
            return;
        }
        
        var devsearch_suffix = " [Development and Coding Search]";
        if (stripped_text.endsWith(devsearch_suffix)) {
            var newquery = stripped_text.substring(0, stripped_text.length - devsearch_suffix.length).trim();
            nav("http://www.google.com/cse?cx=005154715738920500810:fmizctlroiw&q=" + encodeURIComponent("JavaScript "+newquery));
            return;
        }
        
        var mdn_suffix = " [Mozilla Developer Network]";
        if (stripped_text.endsWith(mdn_suffix)) {
            var newquery = stripped_text.substring(0, stripped_text.length - mdn_suffix.length).trim();
            nav("https://developer.mozilla.org/en-US/search?q=" + encodeURIComponent(newquery));
            return;
        }
        
        for (var i = 0; i < predefined_.length; ++i) {
            var entry = predefined_[i];
            var namelower = entry["name"].toLowerCase();
            if (namelower == qlower) {
                nav( entry["url"] );
                return;
            }
        }
        
        nav("http://www.google.com/search?q=" + encodeURIComponent("JavaScript "+stripped_text));
    });
})();