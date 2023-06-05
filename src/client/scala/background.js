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
            chrome.omnibox.setDefaultSuggestion({"description":"<url><match>Scala API Search</match></url> " + text});
        } else {
            chrome.omnibox.setDefaultSuggestion({"description":"<url><match>Scala API Search</match></url>"});
        }
    };
    
    // Prefetch necessary data
    var scala_api_ = null;
    chrome.omnibox.onInputStarted.addListener(function(){
        console.log("Input started");
        setDefaultSuggestion('');
        if (localStorage.hasUnexpired('scala_api')) {
            scala_api_ = localStorage.getObject('scala_api');
        } else {
            xhr("http://www.scala-lang.org/api/current/index.js",
            function(url, req) {
                console.log("Received: " + url);

                scala_api_ = [];
				var Index = {};
				eval(req.responseText);
				for (scala_package_name in Index.PACKAGES) {
					if (!Index.PACKAGES.hasOwnProperty(scala_package_name)) {
						continue;
					}
                    console.log("Package: " + scala_package_name);
					var scala_package = Index.PACKAGES[scala_package_name];
					for (var member_index in scala_package) {
						member = scala_package[member_index];
				        var type = "Unknown type";
					    var href = "#";
                        if (member["trait"]) {
						    type = "Trait";
						    href = member["trait"];
					    } else if (member["class"]) {
					        type = "Class";
						    href = member["class"];
						} else if (member["case class"]) {
							type = "Case class";
							href = member["case class"];
				        } else if (member["object"]) {
					      type = "Object";
					      href = member["object"];
					    } else {
					      console.log("Unknown type: " + JSON.stringify(member));
					    }
						var name = member.name.substring(member.name.lastIndexOf(".") + 1, member.name.length);
                        var member_info = {"name": name, "fqn": member.name, "url": href, "type": type};
						console.log("Member: " + member_info.name);
                        scala_api_.push(member_info);
					}
			    }
                localStorage.setObject('scala_api', scala_api_);
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
        var stripped_text = text.trim();
        if (!stripped_text) {
            return;
        }
        var qlower = stripped_text.toLowerCase();
        
        var second = [];
        var third = [];
        var fourth = [];
		var fifth = [];
        if (scala_api_) {
            for (var i = 0; i < scala_api_.length; ++i) {
                var item = scala_api_[i];
                var fqn = item["fqn"];
                var url = "http://www.scala-lang.org/api/current/" + item["url"];
                var name = item["name"];
                var type = item["type"];
                var namelower = name.toLowerCase();
                var nameidx = namelower.indexOf(qlower);
                var fqnlower = fqn.toLowerCase();
                if ((nameidx != -1) || fqnlower.startsWith(qlower)) {
					console.log("Found sth for " + text);
                    var entry = {
                        "content":url,
                        "description":["<match>", name, "</match> <dim>(", type, " <match>", fqn, "</match>)</dim> - <url>", url, "</url>"].join('')
                    };
                    if (namelower == qlower) {
						suggestions.push(entry);
					} else if (fqnlower.startsWith("org.")) {
                        fifth.push(entry);
                    } else if (nameidx == 0) {
                        second.push(entry);
                    } else if (nameidx != -1) {
                        third.push(entry);
                    } else {
                        fourth.push(entry);
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

		if (suggestions.length < kMaxSuggestions) {
			for (var i = 0; i < fifth.length; ++i) {
				suggestions.push(fifth[i]);
			}
		}
        
        if (stripped_text.length >= 2) {
            suggestions.push({"content":stripped_text +  " [Google Code Search]", 
                "description":["Search for \"<match>", stripped_text, "</match> <dim>lang:scala</dim>\" using <match><url>Google Code Search</url></match> - <url>http://code.google.com/codesearch#search/&amp;q=", encodeURIComponent(stripped_text + " lang:scala"), "</url>"].join('')}); 
            suggestions.push({"content":stripped_text +  " [Development and Coding Search]", 
                "description":["Search for \"<match>", stripped_text, "</match>\" using <match><url>Develoment and Coding Search</url></match> - <url>http://www.google.com/cse?cx=005154715738920500810:fmizctlroiw&amp;q=", encodeURIComponent(stripped_text), "</url>"].join('')});
        }
        suggest_callback(suggestions);
    });
    
    chrome.omnibox.onInputEntered.addListener(function(text) {
        console.log("Input entered: " + text);
        if (!text) {
            nav("http://www.scala-lang.org/api/current/");
            return;
        }
        
        var stripped_text = text.trim();
        if (!stripped_text) {
            nav("http://www.scala-lang.org/api/current/");
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
            nav("http://code.google.com/codesearch#search/&q=" + encodeURIComponent(newquery + " lang:scala"));
            return;
        }
        
        var devsearch_suffix = " [Development and Coding Search]";
        if (stripped_text.endsWith(devsearch_suffix)) {
            var newquery = stripped_text.substring(0, stripped_text.length - devsearch_suffix.length).trim();
            nav("http://www.google.com/cse?cx=005154715738920500810:fmizctlroiw&q=" + encodeURIComponent(newquery));
            return;
        }
        
        var qlower = stripped_text.toLowerCase();
        var backup_url = null;
        if (scala_api_) {
            for (var i = 0; i < scala_api_.length; ++i) {
                var item = scala_api_[i];
                var fqn = item["fqn"];
                var url = "http://www.scala-lang.org/api/current/" + item["url"];
                var name = item["name"];
                var fqnlower = fqn.toLowerCase();
                if (fqnlower == qlower) {
                    nav(url);
                    return;
                }
                if (name.toLowerCase() == qlower) {
                    if (fqnlower.startsWith("org.")) {
                        if (!backup_url) {
                            backup_url = url;
                        }
                    } else {
                        nav(url);
                        return;
                    }
                }
            }
        }
        if (backup_url) {
            nav(backup_url);
            return;
        }
        
        nav("http://www.google.com/search?q=" + encodeURIComponent("Scala "+stripped_text));
    });
})();
