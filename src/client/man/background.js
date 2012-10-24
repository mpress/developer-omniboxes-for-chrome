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
            chrome.omnibox.setDefaultSuggestion({"description":"<url><match>man</match></url> " + text});
        } else {
            chrome.omnibox.setDefaultSuggestion({"description":"<url><match>man</match></url> Search UNIX/POSIX Manual Pages"});
        }
    };
    
    // Prefetch necessary data
    var posix2004_functions_ = null;
    var posix2004_headers_ = null;
    var posix2004_utilities_ = null;
    var posix2008_functions_ = null;
    var posix2008_headers_ = null;
    var posix2008_utilities_ = null;
    var linux_man_pages_ = null;
    
    function fetchPosix2004Functions(callback_when_done) {
        if (posix2004_functions_) {
            return;
        }
        if (localStorage.hasUnexpired('posix2004_functions')) {
            posix2004_functions_ = localStorage.getObject('posix2004_functions');
            callback_when_done();
        } else {
            xhr("http://pubs.opengroup.org/onlinepubs/009695399/idx/functions.html", function(url, req) {
                console.log("Received POSIX 2004 function index.");
                posix2004_functions_ = {};
                var text = req.responseText;
                var matches = text.match(new RegExp("<i>[_A-Za-z]*</i>", "g"));
                for (var i = 0; i < matches.length; ++i) {
                    var match = matches[i];
                    var namestartidx = match.indexOf("<i>") + 3;
                    var namefinishidx = match.indexOf("</i>");
                    var name = match.substring(namestartidx, namefinishidx);
                    if (!name) {
                        continue;
                    }
                    posix2004_functions_[name] = ["http://pubs.opengroup.org/onlinepubs/009695399/functions/", name, ".html"].join('');
                }
                localStorage.setObject('posix2004_functions', posix2004_functions_);
                callback_when_done();
            }, function(url, req){
                console.log("Failed to retrieve: " + url);
                callback_when_done();
            }).send(null);
        }
    };
    
    function fetchPosix2008Functions() {
        if (posix2008_functions_) {
            return;
        }
        xhr("http://pubs.opengroup.org/onlinepubs/9699919799/idx/functions.html", function(url, req) {
            console.log("Received POSIX 2008 function index.");
            posix2008_functions_ = {};
            var text = req.responseText;
            var matches = text.match(new RegExp("<i>[_A-Za-z]*</i>", "g"));
            for (var i = 0; i < matches.length; ++i) {
                var match = matches[i];
                var namestartidx = match.indexOf("<i>") + 3;
                var namefinishidx = match.indexOf("</i>");
                var name = match.substring(namestartidx, namefinishidx);
                if (!name) {
                    continue;
                }
                posix2008_functions_[name] = ["http://pubs.opengroup.org/onlinepubs/9699919799/functions/", name, ".html"].join('');
            }
        }, function(url, req){
            console.log("Failed to retrieve: " + url);
        }).send(null);
    };
    
    function fetchPosix2004Utilities(callback_when_done) {
        if (posix2004_utilities_) {
            return;
        }
        if (localStorage.hasUnexpired('posix2004_utilities')) {
            posix2004_utilities_ = localStorage.getObject('posix2004_utilities');
            callback_when_done();
        } else {
            xhr("http://pubs.opengroup.org/onlinepubs/009695399/idx/utilities.html", function(url, req) {
                console.log("Received POSIX 2004 utility index.");
                posix2004_utilities_ = {};
                var text = req.responseText;
                var matches = text.match(new RegExp("<li><a href=\".*\" target=\"main\">.*</a>", "g"));
                for (var i = 0; i < matches.length; ++i) {
                    var match = matches[i];
                    var namestartidx = match.indexOf("target=\"main\">") + 14;
                    var namefinishidx = match.indexOf("</a>");
                    var name = match.substring(namestartidx, namefinishidx);
                    if (!name) {
                        continue;
                    }
                    posix2004_utilities_[name] = ["http://pubs.opengroup.org/onlinepubs/009695399/utilities/", name, ".html"].join('');
                }
                localStorage.setObject('posix2004_utilities', posix2004_utilities_);
                callback_when_done();
            }, function(url, req){
                console.log("Failed to retrieve: " + url);
                callback_when_done();
            }).send(null);
        }
    };
    
    function fetchPosix2008Utilities() {
        if (posix2008_utilities_) {
            return;
        }
        xhr("http://pubs.opengroup.org/onlinepubs/9699919799/idx/utilities.html", function(url, req) {
            console.log("Received POSIX 2008 utility index.");
            posix2008_utilities_ = {};
            var text = req.responseText;
            var matches = text.match(new RegExp("<li><a href=\".*\" target=\"main\">.*</a>", "g"));
            for (var i = 0; i < matches.length; ++i) {
                var match = matches[i];
                var namestartidx = match.indexOf("target=\"main\">") + 14;
                var namefinishidx = match.indexOf("</a>");
                var name = match.substring(namestartidx, namefinishidx);
                if (!name) {
                    continue;
                }
                posix2008_utilities_[name] = ["http://pubs.opengroup.org/onlinepubs/9699919799/utilities/", name, ".html"].join('');
            }
        }, function(url, req){
            console.log("Failed to retrieve: " + url);
        }).send(null);
    };
    
    function fetchPosix2004Headers(callback_when_done) {
        if (posix2004_headers_) {
            return;
        }
        if (localStorage.hasUnexpired('posix2004_headers')) {
            posix2004_headers_ = localStorage.getObject('posix2004_headers');
            callback_when_done();
        } else {
            xhr("http://pubs.opengroup.org/onlinepubs/009695399/idx/head.html", function(url, req) {
                console.log("Received POSIX 2004 headers index.");
                posix2004_headers_ = {};
                var text = req.responseText;
                var matches = text.match(new RegExp("&lt;.*&gt;", "g"));
                for (var i = 0; i < matches.length; ++i) {
                    var match = matches[i];
                    var namestartidx = 4;
                    var namefinishidx = match.indexOf("&gt;");
                    var name = match.substring(namestartidx, namefinishidx);
                    if (!name) {
                        continue;
                    }
                    posix2004_headers_[name] = ["http://pubs.opengroup.org/onlinepubs/009695399/basedefs/", name, ".html"].join('');
                }
                localStorage.setObject('posix2004_headers', posix2004_headers_);
                callback_when_done();
            }, function(url, req){
                console.log("Failed to retrieve: " + url);
                callback_when_done();
            }).send(null);
        }
    };
    
    function fetchPosix2008Headers() {
        if (posix2008_headers_) {
            return;
        }
        xhr("http://pubs.opengroup.org/onlinepubs/9699919799/idx/head.html", function(url, req) {
            console.log("Received POSIX 2008 headers index.");
            posix2008_headers_ = {};
            var text = req.responseText;
            var matches = text.match(new RegExp("&lt;.*&gt;", "g"));
            for (var i = 0; i < matches.length; ++i) {
                var match = matches[i];
                var namestartidx = 4;
                var namefinishidx = match.indexOf("&gt;");
                var name = match.substring(namestartidx, namefinishidx);
                if (!name) {
                    continue;
                }
                posix2008_headers_[name] = ["http://pubs.opengroup.org/onlinepubs/9699919799/basedefs/", name, ".html"].join('');
            }
        }, function(url, req){
            console.log("Failed to retrieve: " + url);
        }).send(null);
    };
        
    function fetchLinuxManPages() {
        if (linux_man_pages_) {
            return;
        }
        if (localStorage.hasUnexpired('linux_man_pages')) {
            linux_man_pages_ = localStorage.getObject('linux_man_pages');
        } else {
            linux_man_pages_ = {};
            var paths = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "other"];
            var completed = 0;
            for (var i = 0; i < paths.length; ++i) {
                var letter_url = ["http://linux.die.net/man/", paths[i], ".html"].join('');
                xhr(letter_url, function(url, req) {
                    console.log("Received Linux manpages index: " + url);
                    var text = req.responseText;
                    var matches = text.match(new RegExp("<dt><a href=\"[^\"]+\">[^<]*</a>", "g"));
                    for (var j = 0; j < matches.length; ++j) {
                        var match = matches[j];
                        var hrefstartidx = match.indexOf("href=\"") + 6;
                        var hrefendidx = match.indexOf("\"", hrefstartidx);
                        var href = "http://linux.die.net/man/" + match.substring(hrefstartidx, hrefendidx);
                        var namestartidx = match.indexOf(">", hrefendidx) + 1;
                        var nameendidx = match.indexOf("</a>", namestartidx);
                        var name = match.substring(namestartidx, nameendidx);
                        linux_man_pages_[name] = href;
                        var sectionendidx = match.indexOf("/", hrefstartidx);
                        var section =  match.substring(hrefstartidx, sectionendidx);
                        linux_man_pages_[name + " (section " + section + ")"] = href;
                    }
                    completed++;
                    if (completed >= paths.length) {
                        localStorage.setObject('linux_man_pages', linux_man_pages_);
                    }
                }, function(url, req){
                    console.log("Failed to retrieve: " + url);
                }).send(null);
            }
        }
    };
    
    chrome.omnibox.onInputStarted.addListener(function(){
        console.log("Input started");
        setDefaultSuggestion('');
        
        // Prefetch POSIX 2004 Functions, then 2008 version
        fetchPosix2004Functions(fetchPosix2008Functions);
        
        // Prefetch POSIX 2004 Shell Utilities, then 2008 version
        fetchPosix2004Utilities(fetchPosix2008Utilities);
        
        // Prefetch POSIX 2004 Headers, then 2008 version
        fetchPosix2004Headers(fetchPosix2008Headers);
                        
        // Prefetch Linux manpage content
        fetchLinuxManPages();

    });
    
    chrome.omnibox.onInputCancelled.addListener(function() {
        console.log("Input cancelled.");
        setDefaultSuggestion('');
    });
    
    setDefaultSuggestion('');
    
    chrome.omnibox.onInputEntered.addListener(function(text) {
        console.log("Input entered: " + text);
        if (!text) {
            nav("http://pubs.opengroup.org/onlinepubs/009695399/");
            return;
        }
        
        var stripped_text = text.strip();
        if (!stripped_text) {
            nav("http://pubs.opengroup.org/onlinepubs/009695399/");
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
        
        var posix2004_function_suffix = " [POSIX 2004 System Interface]";
        if (stripped_text.endsWith(posix2004_function_suffix)) {
            var newquery = stripped_text.substring(0, stripped_text.length - posix2004_function_suffix.length).strip();
            if (posix2004_functions_){
                if (posix2004_functions_[newquery]) {
                    nav(posix2004_functions_[newquery]);
                    return;
                }
                for (var key in posix2004_functions_) {
                    if (key.toLowerCase() == newquery.toLowerCase()) {
                        nav(posix2004_functions_[key]);
                        return;
                    }
                }
            }
            nav(["http://pubs.opengroup.org/cgi/s3search.cgi?KEYWORDS=", encodeURIComponent(newquery), "&SUBSTRING=substring&CONTEXT="].join(''));
            return;
        }
        
        var posix2004_utility_suffix = " [POSIX 2004 Shell Utility]";
        if (stripped_text.endsWith(posix2004_utility_suffix)) {
            var newquery = stripped_text.substring(0, stripped_text.length - posix2004_utility_suffix.length).strip();
            if (posix2004_utilities_){
                if (posix2004_utilities_[newquery]) {
                    nav(posix2004_utilities_[newquery]);
                    return;
                }
                for (var key in posix2004_utilities_) {
                    if (key.toLowerCase() == newquery.toLowerCase()) {
                        nav(posix2004_utilities_[key]);
                        return;
                    }
                }
            }
            nav(["http://pubs.opengroup.org/cgi/s3search.cgi?KEYWORDS=", encodeURIComponent(newquery), "&SUBSTRING=substring&CONTEXT="].join(''));
            return;
        }
        
        var posix2004_header_suffix = " [POSIX 2004 System Header]";
        if (stripped_text.endsWith(posix2004_header_suffix)) {
            var newquery = stripped_text.substring(0, stripped_text.length - posix2004_header_suffix.length).strip();
            if (posix2004_headers_){
                if (posix2004_headers_[newquery]) {
                    nav(posix2004_headers_[newquery]);
                    return;
                }
                for (var key in posix2004_headers_) {
                    if (key.toLowerCase() == newquery.toLowerCase()) {
                        nav(posix2004_headers_[key]);
                        return;
                    }
                }
            }
            nav(["http://pubs.opengroup.org/cgi/s3search.cgi?KEYWORDS=", encodeURIComponent(newquery), "&SUBSTRING=substring&CONTEXT="].join(''));
            return;
        }
        
        var posix2008_function_suffix = " [POSIX 2008 System Interface]";
        if (stripped_text.endsWith(posix2008_function_suffix)) {
            var newquery = stripped_text.substring(0, stripped_text.length - posix2008_function_suffix.length).strip();
            if (posix2008_functions_){
                if (posix2008_functions_[newquery]) {
                    nav(posix2008_functions_[newquery]);
                    return;
                }
                for (var key in posix2008_functions_) {
                    if (key.toLowerCase() == newquery.toLowerCase()) {
                        nav(posix2008_functions_[key]);
                        return;
                    }
                }
            }
            nav(["http://pubs.opengroup.org/cgi/s3search.cgi?KEYWORDS=", encodeURIComponent(newquery), "&SUBSTRING=substring&CONTEXT="].join(''));
            return;
        }
        
        var posix2008_utility_suffix = " [POSIX 2008 Shell Utility]";
        if (stripped_text.endsWith(posix2008_utility_suffix)) {
            var newquery = stripped_text.substring(0, stripped_text.length - posix2008_utility_suffix.length).strip();
            if (posix2008_utilities_){
                if (posix2008_utilities_[newquery]) {
                    nav(posix2008_utilities_[newquery]);
                    return;
                }
                for (var key in posix2008_utilities_) {
                    if (key.toLowerCase() == newquery.toLowerCase()) {
                        nav(posix2008_utilities_[key]);
                        return;
                    }
                }
            }
            nav(["http://pubs.opengroup.org/cgi/s3search.cgi?KEYWORDS=", encodeURIComponent(newquery), "&SUBSTRING=substring&CONTEXT="].join(''));
            return;
        }
        
        var posix2008_header_suffix = " [POSIX 2008 System Header]";
        if (stripped_text.endsWith(posix2008_header_suffix)) {
            var newquery = stripped_text.substring(0, stripped_text.length - posix2008_header_suffix.length).strip();
            if (posix2008_headers_){
                if (posix2008_headers_[newquery]) {
                    nav(posix2008_headers_[newquery]);
                    return;
                }
                for (var key in posix2008_headers_) {
                    if (key.toLowerCase() == newquery.toLowerCase()) {
                        nav(posix2008_headers_[key]);
                        return;
                    }
                }
            }
            nav(["http://pubs.opengroup.org/cgi/s3search.cgi?KEYWORDS=", encodeURIComponent(newquery), "&SUBSTRING=substring&CONTEXT="].join(''));
            return;
        }
        
        var linux_man_pages_suffix = " [Linux Man Page]";
        if (stripped_text.endsWith(linux_man_pages_suffix)) {
            var newquery = stripped_text.substring(0, stripped_text.length - linux_man_pages_suffix.length).strip();
            if (linux_man_pages_){
                if (linux_man_pages_[newquery]) {
                    nav(linux_man_pages_[newquery]);
                    return;
                }
                for (var key in linux_man_pages_) {
                    if (key.toLowerCase() == newquery.toLowerCase()) {
                        nav(linux_man_pages_[key]);
                        return;
                    }
                }
            }
            nav(["http://www.die.net/search/?q=", encodeURIComponent(newquery), "&sa=Search&ie=ISO-8859-1&cx=partner-pub-5823754184406795%3A54htp1rtx5u&cof=FORID%3A9&siteurl=linux.die.net%2Fman%2F"].join(''));
            return;
        }
        
        var google_codesearch_suffix = " [Google Code Search]";
        if (stripped_text.endsWith(google_codesearch_suffix)) {
            var newquery = stripped_text.substring(0, stripped_text.length - google_codesearch_suffix.length).strip();
            nav("http://code.google.com/codesearch#search/&q=" + encodeURIComponent(newquery));
            return;
        }
        
        var devsearch_suffix = " [Development and Coding Search]";
        if (stripped_text.endsWith(devsearch_suffix)) {
            var newquery = stripped_text.substring(0, stripped_text.length - devsearch_suffix.length).strip();
            nav("http://www.google.com/cse?cx=005154715738920500810:fmizctlroiw&q=" + encodeURIComponent(newquery));
            return;
        }
        
        var manpage_search_suffix = " [Linux Manpage Search]";
        if (stripped_text.endsWith(manpage_search_suffix)) {
            var newquery = stripped_text.substring(0, stripped_text.length - manpage_search_suffix.length).strip();
            nav("http://man.cx/" + encodeURIComponent(newquery));
            return;
        }
        
        if (posix2004_functions_ && posix2004_functions_[stripped_text]) {
            nav(posix2004_functions_[stripped_text]);
            return;
        }
        
        if (posix2008_functions_ && posix2008_functions_[stripped_text]) {
            nav(posix2008_functions_[stripped_text]);
            return;
        }
        
        if (posix2004_utilities_ && posix2004_utilities_[stripped_text]) {
            nav(posix2004_utilities_[stripped_text]);
            return;
        }
        
        if (posix2008_utilities_ && posix2008_utilities_[stripped_text]) {
            nav(posix2008_utilities_[stripped_text]);
            return;
        }
        
        if (posix2004_headers_ && posix2004_headers_[stripped_text]) {
            nav(posix2004_headers_[stripped_text]);
            return;
        }
        
        if (posix2008_headers_ && posix2008_headers_[stripped_text]) {
            nav(posix2008_headers_[stripped_text]);
            return;
        }
        
        if (linux_man_pages_ && linux_man_pages_[stripped_text]) {
            nav(linux_man_pages_[stripped_text]);
            return;
        }
        
        nav("http://www.google.com/search?q=" + encodeURIComponent("man " + stripped_text));
    });
    
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
        var posix2004_functions_found = 0;
        if (posix2004_functions_) {
            for (var key in posix2004_functions_) {
                if (key.toLowerCase().startsWith(qlower)) {
                    if (key.toLowerCase() == qlower) {
                        suggestions.push({"content":key + " [POSIX 2004 System Interface]", "description":["<match>", key, "</match> <dim>[POSIX 2004 System Interface]</dim> - <url>", posix2004_functions_[key], "</url>"].join('')});
                    } else {
                        suggestions.push({"content":key, "description":["<match>", key, "</match> <dim>[POSIX 2004 System Interface]</dim> - <url>", posix2004_functions_[key], "</url>"].join('')});
                    }
                    posix2004_functions_found++;
                    if (suggestions.length > kMaxSuggestions) {
                        break;
                    }
                }
            }
        }
        if (suggestions.length > kMaxSuggestions) {
            suggest_callback(suggestions);
            return;
        }
        if (posix2008_functions_) {
            for (var key in posix2008_functions_) {
                if (key.toLowerCase().startsWith(qlower)) {
                    suggestions.push({"content":key + " [POSIX 2008 System Interface]", "description":["<match>", key, "</match> <dim>[POSIX 2008 System Interface]</dim> - <url>", posix2008_functions_[key], "</url>"].join('')});
                    if (suggestions.length > kMaxSuggestions) {
                        break;
                    }
                }
            }
        }
        if (suggestions.length > kMaxSuggestions) {
            suggest_callback(suggestions);
            return;
        }
        var posix2004_utilities_found = 0;
        if (posix2004_utilities_) {
            for (var key in posix2004_utilities_) {
                if (key.toLowerCase().startsWith(qlower)) {
                    if ((key.toLowerCase() == qlower) || (posix2004_functions_ && posix2004_functions_[key])) {
                        suggestions.push({"content":key + " [POSIX 2004 Shell Utility]", "description":["<match>", key, "</match> <dim>[POSIX 2004 Shell Utility]</dim> - <url>", posix2004_utilities_[key], "</url>"].join('')});
                    } else {
                        suggestions.push({"content":key, "description":["<match>", key, "</match> <dim>[POSIX 2004 Shell Utility]</dim> - <url>", posix2004_utilities_[key], "</url>"].join('')});
                    }
                    posix2004_utilities_found++;
                    if (suggestions.length > kMaxSuggestions) {
                        break;
                    }
                }
            }
        }
        if (suggestions.length > kMaxSuggestions) {
            suggest_callback(suggestions);
            return;
        }
        if (posix2008_utilities_) {
            for (var key in posix2008_utilities_) {
                if (key.toLowerCase().startsWith(qlower)) {
                    suggestions.push({"content":key + " [POSIX 2008 Shell Utility]", "description":["<match>", key, "</match> <dim>[POSIX 2008 Shell Utility]</dim> - <url>", posix2008_utilities_[key], "</url>"].join('')});
                    if (suggestions.length > kMaxSuggestions) {
                        break;
                    }
                }
            }
        }
        if (suggestions.length > kMaxSuggestions) {
            suggest_callback(suggestions);
            return;
        }
        var posix2004_headers_found = 0;
        if (posix2004_headers_) {
            for (var key in posix2004_headers_) {
                if (key.toLowerCase().startsWith(qlower)) {
                    if ((key.toLowerCase() == qlower) || (posix2004_functions_ && posix2004_functions_[key]) || (posix2004_utilities_ && posix2004_utilities_[key])) {
                        suggestions.push({"content":key + " [POSIX 2004 System Header]", "description":["<match>", key, "</match> <dim>[POSIX 2004 System Header]</dim> - <url>", posix2004_headers_[key], "</url>"].join('')});
                    } else {
                        suggestions.push({"content":key, "description":["<match>", key, "</match> <dim>[POSIX 2004 System Header]</dim> - <url>", posix2004_headers_[key], "</url>"].join('')});
                    }
                    posix2004_headers_found++;
                    if (suggestions.length > kMaxSuggestions) {
                        break;
                    }
                }
            }
        }
        if (suggestions.length > kMaxSuggestions) {
            suggest_callback(suggestions);
            return;
        }
        if (posix2008_headers_) {
            for (var key in posix2008_headers_) {
                if (key.toLowerCase().startsWith(qlower)) {
                    suggestions.push({"content":key + " [POSIX 2008 System Header]", "description":["<match>", key, "</match> <dim>[POSIX 2008 System Header]</dim> - <url>", posix2004_headers_[key], "</url>"].join('')});
                    if (suggestions.length > kMaxSuggestions) {
                        break;
                    }
                }
            }
        }
        if (suggestions.length > kMaxSuggestions) {
            suggest_callback(suggestions);
            return;
        }
        if (linux_man_pages_) {
            var linux_urls_suggested = {};
            for (var key in linux_man_pages_) {
                if (key.toLowerCase().startsWith(qlower)) {
                    if (linux_urls_suggested[ linux_man_pages_[key] ]) {
                        continue;
                    }
                    if ((key.toLowerCase() == qlower) || (posix2004_functions_ && posix2004_functions_[key]) || (posix2004_utilities_ && posix2004_utilities_[key]) || (posix2004_headers_ && posix2004_headers_[key])) {
                        suggestions.push({"content":key + " [Linux Man Page]", "description":["<match>", key, "</match> <dim>[Linux Man Page]</dim> - <url>", linux_man_pages_[key], "</url>"].join('')});
                    } else {
                        suggestions.push({"content":key, "description":["<match>", key, "</match> <dim>[Linux Man Page]</dim> - <url>", linux_man_pages_[key], "</url>"].join('')});
                    }
                    linux_urls_suggested[ linux_man_pages_[key] ] = 1;
                    if (suggestions.length > kMaxSuggestions) {
                        break;
                    }
                }
            }
        }
        if (stripped_text.length >= 2) {
            if (suggestions.length == 0) {
                suggestions.push({"content":stripped_text + " [Linux Manpage Search]",
                "description":["Search for \"<match>", stripped_text, "</match>\" using <match><url>Linux Manpage Search</url></match> - <url>http://man.cx/", encodeURIComponent(stripped_text), "</url>"].join('')});
            }
            suggestions.push({"content":stripped_text +  " [Google Code Search]", 
                "description":["Search for \"<match>", stripped_text, "</match>\" using <match><url>Google Code Search</url></match> - <url>http://code.google.com/codesearch#search/&q=", encodeURIComponent(stripped_text), "</url>"].join('')}); 
            suggestions.push({"content":stripped_text +  " [Development and Coding Search]", 
                "description":["Search for \"<match>", stripped_text, "</match>\" using <match><url>Develoment and Coding Search</url></match> - <url>http://www.google.com/cse?cx=005154715738920500810:fmizctlroiw&amp;q=", encodeURIComponent(stripped_text), "</url>"].join('')});
        }
        suggest_callback(suggestions);
    });
})();