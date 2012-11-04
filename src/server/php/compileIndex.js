/*
 * Storage.prototype.setObject = function(key, value, opt_expiration) {
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

*/

var http = require('http');

var fs = require('fs');

eval( fs.readFileSync( '../common/String.js' ) + '' );




var TARGET_PATH = '/manual/en/indexes.functions.php';

var TARGET_HOST = 'www.php.net';



if (fs.existsSync('./result.tmp') ) {

    fs.writeFile('./result.tmp', '', function(error) {
    });
} else {

    fs.open('./result.tmp', 'w');
}

if (fs.existsSync('index.js')) {

    fs.writeFile('index.js', '', function(error) {
    });
}

var downloaded = false;

var scrapeData = function() {

    console.log( "scrape data" );
    php_functions_ = [];
    var text = fs.readFileSync( './result.tmp', 'utf8');
    var arrow = new RegExp( "->", "g" );
    var matches = text.match( new RegExp( "<li><a href=\"[^\"]*\" class=\"index\">[^<]*</a>[^<]*</li>", "g" ) );
    for( var i = 0; i < matches.length; ++i ) {
        
        var match = matches[ i ];
        var hrefStartIdX = match.indexOf( "href=\"" ) + 6;
        var hrefEndIdX = match.indexOf( "\"", hrefStartIdX );
        
        var href = match.substring( hrefStartIdX, hrefEndIdX );
        
        var contentStartIdX = match.indexOf( "class=\"index\">", hrefEndIdX ) + 14;
        var contentEndIdX = match.indexOf( "</a>", contentStartIdX );
        var content = match.substring( contentStartIdX, contentEndIdX );
        
        if( content.endsWith( "()" ) ) {
        
            content = content.substr( 0, content.length - 2 );
        }
        php_functions_.push(
            { "name" : content.replace( arrow, "." ), 
              "url" : [ "www.php.net", "manual/", href ].join( '' ) }//base, "manual/", href ].join( '' ) }
        );
    }
   // localStorage.setObject('php_functions', php_functions_);
    fs.appendFileSync( 'index.js', "var index = " + JSON.stringify( php_functions_ ) );

}
var options = {
    host : TARGET_HOST,
    port : 80,
    path : TARGET_PATH
};

var req = http.get( options, function( res ) {

    console.log( 'STATUS: ' + res.statusCode );
    console.log( 'HEADERS: ' + JSON.stringify( res.headers ) );
    res.setEncoding( 'utf8' );

    res.on('data', function( chunk ) {

        fs.appendFile('./result.tmp', chunk, function(error) {

            if ( error ) {

                console.log( error );
            } else {

                if ( downloaded ){

                    scrapeData();

                   // fs.unlinkSync('./result.tmp');
                }
            }
        });
    });

    res.on('end', function() {

        downloaded = true;
    });
});

req.on('error', function(e) {

    console.log('problem with request: ' + e.message);
});




















/*

(function(){
    // Issue a new GET request
    function xhr(url, ifexists, ifnotexists, retry_interval) {
        var retry_time = retry_interval || 5;
        var req = new XMLHttpRequest();
        console.log("Fetching: " + url);
        req.open("GET", url);
        req.setRequestHeader("Cache-Control", "max-age=2592000"); // 30 days
        req.onreadystatechange=function(){
            if (req.readyState == 4){
                var status=req.status;
                if ((status == 200) || (status == 301) || (status == 302)) {
                    ifexists(url, req);
                } else {
                    ifnotexists(url, req);
                    setTimeout(function() { xhr(url, ifexists, ifnotexists, retry_time * 10).send(null); }, retry_time);
                }
            }
        };
        return req;
    };
    
    function mirror() {
        return 'www.php.net';
    };
    
    function baseurl() {
        
        return 'http://www.php.net';
      //  return ['http://', mirror(), '/'].join('');
    };
    
    function loadBalanced(baseurl) {
      if (baseurl != "http://www.php.net/") {
        return baseurl;
      }
      
      var mirrors = [
        "http://us.php.net/",
        "http://us2.php.net/",
        "http://us3.php.net/",
        "http://www.php.net/"
      ];
      
      var randomIndex = Math.floor(Math.random()*mirrors.length);
      return mirrors[randomIndex];
    };
    
    // Navigates to the specified URL.
    function nav(url) {
        url = url.replace(new RegExp("http://.*\.php\.net/"), baseurl());
        console.log("Navigating to: " + url);
        chrome.tabs.getSelected(null, function(tab) {
            chrome.tabs.update(tab.id, {url: url});
        });
    };
    
    // Sets the the default styling for the first search item
    function setDefaultSuggestion(text) {
        if (text) {
            chrome.omnibox.setDefaultSuggestion({"description":"<url><match>PHP Search</match></url> " + text});
        } else {
            chrome.omnibox.setDefaultSuggestion({"description":"<url><match>PHP Search</match></url>"});
        }
    };
    
    // Prefetch necessary data
    var php_functions_ = null;
    var php_api_ = null;
    var php_extensions_ = null;
    var predefined_ = [
        {"name":"bool","url":"manual/language.types.boolean.php"},
        {"name":"boolean","url":"manual/language.types.boolean.php"},
        {"name":"int","url":"manual/language.types.integer.php"},
        {"name":"integer","url":"manual/language.types.integer.php"},
        {"name":"float","url":"manual/language.types.float.php"},
        {"name":"double","url":"manual/language.types.float.php"},
        {"name":"real","url":"manual/language.types.float.php"},
        {"name":"string","url":"manual/language.types.string.php"},
        {"name":"array","url":"manual/language.types.array.php"},
        {"name":"object","url":"manual/language.types.object.php"},
        {"name":"resource","url":"manual/language.types.resource.php"},
        {"name":"null","url":"manual/language.types.null.php"}
    ];

    chrome.omnibox.onInputStarted.addListener(function(){
        console.log("Input started");
        setDefaultSuggestion('');
        
        var mirror_domain = mirror();
        var base = ["http://", mirror_domain, "/"].join('');
        var loadBalancedBase = loadBalanced(base);
        
        if (localStorage.hasUnexpired('php_functions')) {
            php_functions_ = localStorage.getObject('php_functions');
        } else {
            xhr(loadBalancedBase + "manual/en/indexes.functions.php",
            function(url, req) {
                console.log("Received: "+url);
                php_functions_ = [];
                var text = req.responseText;
                var arrow = new RegExp("->", "g");
                var matches = text.match(new RegExp("<li><a href=\"[^\"]*\" class=\"index\">[^<]*</a>[^<]*</li>", "g"));
                for (var i = 0; i < matches.length; ++i) {
                    var match = matches[i];
                    var hrefStartIdX = match.indexOf("href=\"") + 6;
                    var hrefEndIdX = match.indexOf("\"", hrefStartIdX);
                    var href = match.substring(hrefStartIdX, hrefEndIdX);
                    var contentStartIdX = match.indexOf("class=\"index\">", hrefEndIdX) + 14;
                    var contentEndIdX = match.indexOf("</a>", contentStartIdX);
                    var content = match.substring(contentStartIdX, contentEndIdX);
                    if (content.endsWith("()")) {
                        content = content.substr(0, content.length - 2);
                    }
                    php_functions_.push({"name":content.replace(arrow, "."), "url":[base, "manual/", href].join('')})
                }
                localStorage.setObject('php_functions', php_functions_);
            },
            function(url, req) {
                console.log("Failed to receive: "+url);
            }).send(null);
        }
        
        if (localStorage.hasUnexpired('php_api')) {
            php_api_ = localStorage.getObject('php_api');
        } else {
            xhr(loadBalancedBase + "quickref.php",
            function(url, req) {
                console.log("Received: "+url);
                php_api_ = [];
                var text = req.responseText;
                var arrow = new RegExp("->", "g");
                var matches = text.match(new RegExp("<a href=\".*manual.*\">.*</a>", "g"));
                for (var i = 0; i < matches.length; i++) {
                    var match = matches[i];
                    var hrefStartIdX = match.indexOf("href=\"") + 6; 
                    var hrefEndIdX = match.indexOf("\"", hrefStartIdX);
                    var href = match.substring(hrefStartIdX, hrefEndIdX);
                    var contentStartIdX = match.indexOf(">", hrefEndIdX) + 1;
                    var contentEndIdX = match.indexOf("</a>", contentStartIdX);
                    var content = match.substring(contentStartIdX, contentEndIdX);
                    php_api_.push({"name":content.replace(arrow, "."), "url":["http://", mirror_domain, href].join('')});
                }
                localStorage.setObject('php_api', php_api_);
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
        var arrow = new RegExp("->", "g");
        var qlower = stripped_text.toLowerCase();
        if (qlower.endsWith("-")) {
            qlower = qlower.substr(0, qlower.length - 1) + ".";
        }
        qlower = qlower.replace(arrow, ".");
        var second = [];
        
        var base = baseurl();
        for (var i = 0; i < predefined_.length; ++i) {
            var entry = predefined_[i];
            var name = entry["name"];
            var namelower = name.toLowerCase();
            var nameidx = namelower.indexOf(qlower);
            if (nameidx != -1) {
                var url = base + entry["url"];
                var target = null;
                if (nameidx == 0) {
                    target = suggestions;
                } else {
                    target = second;
                }
                target.push({
                    "content":url,
                    "description":["<match>", name, "</match> - <url>", url, "</url>"].join('')});
            }
            if (suggestions.length > kMaxSuggestions) {
                break;
            }
        } 
        
        if (php_functions_) {
            for (var i = 0; i < php_functions_.length; ++i) {
                var entry = php_functions_[i];
                var name = entry["name"];
                var namelower = name.toLowerCase();
                var nameidx = namelower.indexOf(qlower);
                if (nameidx != -1) {
                    var url = entry["url"];
                    var target = null;
                    if (nameidx == 0) {
                        target = suggestions;
                    } else {
                        target = second;
                    }
                    target.push({
                        "content":url,
                        "description":["<match>", name, "</match> - <url>", url, "</url>"].join('')});
                }
                if (suggestions.length > kMaxSuggestions) {
                    break;
                }
            }
        }
        
        if (php_api_) {
            for (var i = 0; i < php_api_.length; ++i) {
                var entry = php_api_[i];
                var name = entry["name"];
                var namelower = name.toLowerCase();
                var nameidx = namelower.indexOf(qlower);
                if (nameidx != -1) {
                    var url = entry["url"];
                    var target = null;
                    if (nameidx == 0) {
                        target = suggestions;
                    } else {
                        target = second;
                    }
                    target.push({
                        "content":url,
                        "description":["<match>", name, "</match> - <url>", url, "</url>"].join('')});
                }
                if (suggestions.length > kMaxSuggestions) {
                    break;
                }
            }
        }
        
        if (suggestions.length < kMaxSuggestions) {
            for (var i = 0; i < second.length; ++i) {
                suggestions.push(second[i]);
                if (suggestions.length > kMaxSuggestions) {
                    break;
                }
            }
        }
        
        if (stripped_text.length >= 2) {
            suggestions.push({"content":stripped_text + " [PHP Search]",
                "description":["Search for \"<match>", stripped_text, "</match>\" using <match><url>PHP Search</url></match> - <url>", base ,"manual-lookup.php?pattern=", encodeURIComponent(stripped_text), "&amp;lang=en</url>"].join('')});
            suggestions.push({"content":stripped_text +  " [Google Code Search]", 
                "description":["Search for \"<match>", stripped_text, "</match> <dim>lang:php</dim>\" using <match><url>Google Code Search</url></match> - <url>http://code.google.com/codesearch#search/&amp;q=", encodeURIComponent(stripped_text + " lang:php"), "</url>"].join('')}); 
            suggestions.push({"content":stripped_text +  " [Development and Coding Search]", 
                "description":["Search for \"<dim>PHP</dim> <match>", stripped_text, "</match>\" using <match><url>Develoment and Coding Search</url></match> - <url>http://www.google.com/cse?cx=005154715738920500810:fmizctlroiw&amp;q=", encodeURIComponent("PHP "+stripped_text), "</url>"].join('')});
        }
        suggest_callback(suggestions);
    });
    
    chrome.omnibox.onInputEntered.addListener(function(text) {
        console.log("Input entered: " + text);
        var base = baseurl();
        if (!text) {
            nav(base + "manual/index.php");
            return;
        }
        
        var stripped_text = text.strip();
        if (!stripped_text) {
            nav(base + "manual/index.php");
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
                
        var php_suffix = " [PHP Search]";
        if (stripped_text.endsWith(php_suffix)) {
            var newquery = stripped_text.substring(0, stripped_text.length - php_suffix.length).strip();
            nav([base, "manual-lookup.php?pattern=", encodeURIComponent(newquery), "&lang=en"].join(''));
            return;
        }        
        
        var google_codesearch_suffix = " [Google Code Search]";
        if (stripped_text.endsWith(google_codesearch_suffix)) {
            var newquery = stripped_text.substring(0, stripped_text.length - google_codesearch_suffix.length).strip();
            nav("http://code.google.com/codesearch#search/&q=" + encodeURIComponent(newquery + " lang:php"));
            return;
        }
        
        var devsearch_suffix = " [Development and Coding Search]";
        if (stripped_text.endsWith(devsearch_suffix)) {
            var newquery = stripped_text.substring(0, stripped_text.length - devsearch_suffix.length).strip();
            nav("http://www.google.com/cse?cx=005154715738920500810:fmizctlroiw&q=" + encodeURIComponent("PHP "+newquery));
            return;
        }
        
        var qlower = stripped_text.toLowerCase();
        var arrow = new RegExp("->", "g");
        qlower = qlower.replace(arrow, ".");        
        for (var i = 0; i < predefined_.length; ++i) {
            var entry = predefined_[i];
            if (entry["name"].toLowerCase() == qlower) {
                nav(base+entry["url"]);
                return;
            }
        }
        
        if (php_functions_) {
            for (var i = 0; i < php_functions_.length; ++i) {
                var entry = php_functions_[i];
                if (entry["name"].toLowerCase() == qlower) {
                    nav(entry["url"]);
                    return;
                }
            }
        }
        
        if (php_api_) {
            for (var i = 0; i < php_api_.length; ++i) {
                var entry = php_api_[i];
                if (entry["name"].toLowerCase() == qlower) {
                    nav(entry["url"]);
                    return;
                }
            }
        }
        
        nav("http://www.google.com/search?q=" + encodeURIComponent("PHP "+stripped_text));
    });
})();




*/