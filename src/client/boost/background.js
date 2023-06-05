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
            chrome.omnibox.setDefaultSuggestion({"description":"<url><match>Boost API Search</match></url> " + text});
        } else {
            chrome.omnibox.setDefaultSuggestion({"description":"<url><match>Boost API Search</match></url>"});
        }
    };
    
    var predefined_ = {
        "any":"http://www.boost.org/doc/libs/release/doc/html/boost/any.html",
        "any_cast":"http://www.boost.org/doc/libs/release/doc/html/boost/any_cast.html",
        "array":"http://www.boost.org/doc/libs/release/doc/html/boost/array.html",
        "call_traits":"http://www.boost.org/doc/libs/release/libs/utility/call_traits.htm",
        "smart_ptr":"http://www.boost.org/doc/libs/release/libs/smart_ptr",
        "weak_ptr":"http://www.boost.org/doc/libs/release/libs/smart_ptr/weak_ptr.htm",
        "shared_ptr":"http://www.boost.org/doc/libs/release/libs/smart_ptr/shared_ptr.htm",
        "scoped_ptr":"http://www.boost.org/doc/libs/release/libs/smart_ptr/scoped_ptr.htm",
        "shared_array":"http://www.boost.org/doc/libs/release/libs/smart_ptr/shared_array.htm",
        "scoped_array":"http://www.boost.org/doc/libs/release/libs/smart_ptr/scoped_array.htm",
        "intrusive_ptr":"http://www.boost.org/doc/libs/release/libs/smart_ptr/intrusive_ptr.html",
        "tuple":"http://www.boost.org/doc/libs/release/libs/tuple/doc/tuple_users_guide.html",
        "make_tuple":"http://www.boost.org/doc/libs/release/libs/tuple/doc/tuple_users_guide.html#make_tuple",
        "any":"http://www.boost.org/doc/libs/release/doc/html/any.html",
        "lexical_cast":"http://www.boost.org/doc/libs/release/libs/conversion/lexical_cast.htm",
        "variant":"http://www.boost.org/doc/libs/release/doc/html/variant.html",
        "type_traits":"http://www.boost.org/doc/libs/release/libs/type_traits/doc/html/index.html",
        "fusion":"http://www.boost.org/doc/libs/release/libs/fusion/doc/html/index.html",
        "thread":"http://www.boost.org/doc/libs/release/doc/html/thread.html",
        "thread_specific_ptr":"http://www.boost.org/doc/libs/release/doc/html/thread/thread_local_storage.html#thread.thread_local_storage.thread_specific_ptr",
        "lock":"http://www.boost.org/doc/libs/release/doc/html/thread/synchronization.html#thread.synchronization.locks",
        "scoped_lock":"http://www.boost.org/doc/libs/release/doc/html/boost/interprocess/scoped_lock.html",
        "scoped_try_lock":"http://www.boost.org/doc/libs/release/doc/html/thread/synchronization.html#thread.synchronization.locks.scoped_try_lock",
        "lock_guard":"http://www.boost.org/doc/libs/release/doc/html/thread/synchronization.html#thread.synchronization.locks.lock_guard",
        "unique_ptr":"http://www.boost.org/doc/libs/release/doc/html/boost/interprocess/unique_ptr.html",
        "unique_lock":"http://www.boost.org/doc/libs/release/doc/html/thread/synchronization.html#thread.synchronization.locks.unique_lock",
        "shared_lock":"http://www.boost.org/doc/libs/release/doc/html/thread/synchronization.html#thread.synchronization.locks.shared_lock",
        "mutex":"http://www.boost.org/doc/libs/release/doc/html/thread/synchronization.html#thread.synchronization.mutex_types.mutex",
        "condition_variable":"http://www.boost.org/doc/libs/release/doc/html/thread/synchronization.html#thread.synchronization.condvar_ref.condition_variable",
        "asio":"http://www.boost.org/doc/libs/release/doc/html/boost_asio.html",
        "enable_if":"http://www.boost.org/doc/libs/release/libs/utility/enable_if.html",
        "exception":"http://www.boost.org/doc/libs/release/libs/exception/doc/boost-exception.html",
        "enable_shared_from_this":"http://www.boost.org/doc/libs/release/libs/smart_ptr/enable_shared_from_this.html",
        "signals2":"http://www.boost.org/doc/libs/release/doc/html/signals2.html",
        "signals":"http://www.boost.org/doc/libs/release/doc/html/signals.html",
        "make_shared":"http://www.boost.org/doc/libs/release/libs/smart_ptr/make_shared.html",
        "allocate_shared":"http://www.boost.org/doc/libs/release/libs/smart_ptr/make_shared.html",
        "try_mutex":"http://www.boost.org/doc/libs/release/doc/html/thread/synchronization.html#thread.synchronization.mutex_types.try_mutex",
        "timed_mutex":"http://www.boost.org/doc/libs/release/doc/html/thread/synchronization.html#thread.synchronization.mutex_types.timed_mutex",
        "recursive_mutex":"http://www.boost.org/doc/libs/release/doc/html/thread/synchronization.html#thread.synchronization.mutex_types.recursive_mutex",
        "recursive_timed_mutex":"http://www.boost.org/doc/libs/release/doc/html/thread/synchronization.html#thread.synchronization.mutex_types.recursive_timed_mutex",
        "shared_mutex":"http://www.boost.org/doc/libs/release/doc/html/thread/synchronization.html#thread.synchronization.mutex_types.shared_mutex",
        "condition_variable":"http://www.boost.org/doc/libs/release/doc/html/thread/synchronization.html#thread.synchronization.condvar_ref.condition_variable",
        "condition_variable_any":"http://www.boost.org/doc/libs/release/doc/html/thread/synchronization.html#thread.synchronization.condvar_ref.condition_variable_any",
        "once_flag":"http://www.boost.org/doc/libs/release/doc/html/thread/synchronization.html#thread.synchronization.once.once_flag",
        "call_once":"http://www.boost.org/doc/libs/release/doc/html/thread/synchronization.html#thread.synchronization.once.call_once",
        "barrier":"http://www.boost.org/doc/libs/release/doc/html/thread/synchronization.html#thread.synchronization.barriers.barrier",
        "promise":"http://www.boost.org/doc/libs/relase/doc/html/thread/synchronization.html#thread.synchronization.futures.reference.promise",
        "packaged_task":"http://www.boost.org/doc/libs/release/doc/html/thread/synchronization.html#thread.synchronization.futures.reference.packaged_task",
        "wait_for_all":"http://www.boost.org/doc/libs/release/doc/html/thread/synchronization.html#thread.synchronization.futures.reference.wait_for_all",
        "shared_future":"http://www.boost.org/doc/libs/release/doc/html/thread/synchronization.html#thread.synchronization.futures.reference.shared_future",
        "unique_future":"http://www.boost.org/doc/libs/release/doc/html/thread/synchronization.html#thread.synchronization.futures.reference.unique_future",
        "wait_for_any":"http://www.boost.org/doc/libs/release/doc/html/thread/synchronization.html#thread.synchronization.futures.reference.wait_for_any",
        "path":"http://www.boost.org/doc/libs/release/libs/filesystem/v3/doc/reference.html#class-path",
        "filesystem_error":"http://www.boost.org/doc/libs/release/libs/filesystem/v3/doc/reference.html#Class-filesystem_error",
        "directory_entry":"http://www.boost.org/doc/libs/release/libs/filesystem/v3/doc/reference.html#Class-directory_entry",
        "directory_iterator":"http://www.boost.org/doc/libs/release/libs/filesystem/v3/doc/reference.html#Class-directory_iterator",
        "recursive_directory_iterator":"http://www.boost.org/doc/libs/release/libs/filesystem/v3/doc/reference.html#Class-recursive_directory_iterator",
        "file_status":"http://www.boost.org/doc/libs/release/libs/filesystem/v3/doc/reference.html#file_status",
        "socket":"http://www.boost.org/doc/libs/release/doc/html/boost_asio/reference/ip__tcp/socket.html",
        "ip::tcp::socket":"http://www.boost.org/doc/libs/release/doc/html/boost_asio/reference/ip__tcp/socket.html",
        "ip::udp::socket":"http://www.boost.org/doc/libs/release/doc/html/boost_asio/reference/ip__udp/socket.html",
        "io_service":"http://www.boost.org/doc/libs/release/doc/html/boost_asio/reference/io_service.html",
        "stream_socket_service":"http://www.boost.org/doc/libs/release/doc/html/boost_asio/reference/stream_socket_service.html",
        "socket_acceptor_service":"http://www.boost.org/doc/libs/release/doc/html/boost_asio/reference/socket_acceptor_service.html",
        "host_name":"http://www.boost.org/doc/libs/release/doc/html/boost_asio/reference/ip__host_name.html",
        "read":"http://www.boost.org/doc/libs/release/doc/html/boost_asio/reference/read.html",
        "write":"http://www.boost.org/doc/libs/release/doc/html/boost_asio/reference/write.html",
        "async_read":"http://www.boost.org/doc/libs/release/doc/html/boost_asio/reference/async_read.html",
        "async_write":"http://www.boost.org/doc/libs/release/doc/html/boost_asio/reference/async_write.html",
        "adjacency_list":"http://www.boost.org/doc/libs/release/libs/graph/doc/using_adjacency_list.html",
        "adjacency_matrix":"http://www.boost.org/doc/libs/release/libs/graph/doc/adjacency_matrix.html",
        "compressed_pair":"http://www.boost.org/doc/libs/release/libs/utility/compressed_pair.htm",
        "compressed_sparse_row_graph":"http://www.boost.org/doc/libs/release/libs/graph/doc/compressed_sparse_row.html"
    };
    
    var boost_libraries_ = null;
    
    // Prefetch necessary data
    chrome.omnibox.onInputStarted.addListener(function(){
        console.log("Input started");
        setDefaultSuggestion('');
        
        if (localStorage.hasUnexpired('boost_libraries')) {
            boost_libraries_ = localStorage.getObject('boost_libraries');
        } else {
            xhr("http://www.boost.org/doc/libs/",
            function (url, req) {
                console.log('Received: '+url);
                boost_libraries_ = [];
                var text = req.responseText;
                var matches = text.match(new RegExp("<dt><a href=\"[^\"]*\">[^<]*</a></dt>", "g"));
                for (var i = 0; i < matches.length; ++i) {
                    var match = matches[i];
                    var hrefstartidx = match.indexOf("href=\"") + 6;
                    var hrefendidx = match.indexOf("\"", hrefstartidx);
                    var contentstartidx = match.indexOf(">", hrefendidx) + 1;
                    var contentendidx = match.indexOf("</a>");
                    var href = match.substring(hrefstartidx, hrefendidx);
                    var content = match.substring(contentstartidx, contentendidx);
                    var link = href;
                    if (!href.startsWith("http://") && !href.startsWith("https://")) {
                        if (href.startsWith("/")) {
                            link = "http://www.boost.org" + href;
                        } else {
                            link = "http://www.boost.org/doc/libs/" + href;
                        }
                    }
                    boost_libraries_.push({"name":content, "url":link});
                }
                localStorage.setObject('boost_libraries', boost_libraries_);
            },
            function (url, req) {
                console.log('Failed to receive: '+url);
            }).send();
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
        
        var deferred = [];
        
        for (var key in predefined_) {
            var keylower = key.toLowerCase();
            var url = predefined_[key];
            var keyidx = keylower.indexOf(qlower);
            if (keyidx != -1) {
                var entry = {
                    "content":url,
                    "description":["<match>", key, "</match> - <url>", url, "</url>"].join('')};
                if (keyidx == 0) {
                    suggestions.push(entry);
                } else {
                    deferred.push(entry);
                }
            }
        }
        
        if (boost_libraries_) {
            for (var i = 0; i < boost_libraries_.length; ++i) {
                var lib = boost_libraries_[i];
                var name = lib["name"];
                var url = lib["url"];
                var namelower = name.toLowerCase();
                var nameidx = namelower.indexOf(qlower);
                if (nameidx != -1 ) {
                    var suggestion = {
                        "content":url,
                        "description":["<match>", name, "</match> - <url>", url, "</url>"].join('')
                    };
                    
                    if (nameidx == 0) {
                        suggestions.push(suggestion);
                    } else {
                        deferred.push(suggestion);
                    }
                }
                
                if (suggestions.length > kMaxSuggestions) {
                    break;
                }
            }
        }
        
        if (suggestions.length < kMaxSuggestions) {
            for (var i = 0; i < deferred.length; ++i) {
                suggestions.push(deferred[i]);
                if (suggestions.length > kMaxSuggestions) {
                    break;
                }
            }
        }
                
        
        if (stripped_text.length >= 2) {
            // suggestions.push({"content":stripped_text +  " [Boost Custom Search]",
                // "description":["Search for \"<match>", stripped_text, "</match>\" using <match><url>Boost Custom Search</url></match> - <url>http://www.google.com/custom?cof=LW%3A277%3BL%3Ahttp%3A%2F%2Fwww.boost.org%2Fboost.png%3BLH%3A86%3BAH%3Acenter%3BGL%3A0%3BS%3Ahttp%3A%2F%2Fwww.boost.org%3BAWFID%3A9b83d16ce652ed5a%3B&amp;sa=Google+Search&amp;domains=www.boost.org%3Blists.boost.org&amp;hq=site%3Awww.boost.org+OR+site%3Alists.boost.org&amp;q=", encodeURIComponent(stripped_text), "</url>"].join('')});
            suggestions.push({"content":stripped_text +  " [Google Code Search]", 
                "description":["Search for \"<dim>boost</dim> <match>", stripped_text, "</match> <dim>lang:c++</dim>\" using <match><url>Google Code Search</url></match> - <url>http://code.google.com/codesearch#search/&amp;q=", encodeURIComponent("boost "+stripped_text+" lang:c++"), "</url>"].join('')}); 
            suggestions.push({"content":stripped_text +  " [Development and Coding Search]", 
                "description":["Search for \"<dim>boost</dim> <match>", stripped_text, "</match>\" using <match><url>Develoment and Coding Search</url></match> - <url>http://www.google.com/cse?cx=005154715738920500810:fmizctlroiw&amp;q=", encodeURIComponent("boost "+stripped_text), "</url>"].join('')});
        }
        suggest_callback(suggestions);
    });
    
    chrome.omnibox.onInputEntered.addListener(function(text) {
        console.log("Input entered: " + text);
        if (!text) {
            nav("http://www.boost.org/doc/libs/");
            return;
        }
        
        var stripped_text = text.trim();
        if (!stripped_text) {
            nav("http://www.boost.org/doc/libs/");
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
        
        var boost_search_suffix = " [Boost Custom Search]";
        if (stripped_text.endsWith(boost_search_suffix)) {
            var newquery = stripped_text.substring(0, stripped_text.length - boost_search_suffix.length).trim();
            nav("http://www.google.com/custom?cof=LW%3A277%3BL%3Ahttp%3A%2F%2Fwww.boost.org%2Fboost.png%3BLH%3A86%3BAH%3Acenter%3BGL%3A0%3BS%3Ahttp%3A%2F%2Fwww.boost.org%3BAWFID%3A9b83d16ce652ed5a%3B&sa=Google+Search&domains=www.boost.org%3Blists.boost.org&hq=site%3Awww.boost.org+OR+site%3Alists.boost.org&q=" + encodeURIComponent(stripped_text));
            return;
        }
                                
        var google_codesearch_suffix = " [Google Code Search]";
        if (stripped_text.endsWith(google_codesearch_suffix)) {
            var newquery = stripped_text.substring(0, stripped_text.length - google_codesearch_suffix.length).trim();
            nav("http://code.google.com/codesearch#search/&q=" + encodeURIComponent("boost "+newquery+" lang:c++"));
            return;
        }
        
        var devsearch_suffix = " [Development and Coding Search]";
        if (stripped_text.endsWith(devsearch_suffix)) {
            var newquery = stripped_text.substring(0, stripped_text.length - devsearch_suffix.length).trim();
            nav("http://www.google.com/cse?cx=005154715738920500810:fmizctlroiw&q=" + encodeURIComponent("boost "+newquery));
            return;
        }

        var qlower = stripped_text.toLowerCase();
        for (var key in predefined_) {
            var keylower = key.toLowerCase();
            var url = predefined_[key];
            if (keylower == qlower) {
                nav(url);
                return;
            }
        }
        
        if (boost_libraries_) {
            for (var i = 0; i < boost_libraries_.length; ++i) {
                var lib = boost_libraries_[i];
                var name = lib["name"];
                var url = lib["url"];
                var namelower = name.toLowerCase();
                if (namelower == qlower) {
                    nav(url);
                    return;
                }
            }
        }

        nav("http://www.google.com/search?q=" + encodeURIComponent("Boost "+stripped_text));
    });
})();