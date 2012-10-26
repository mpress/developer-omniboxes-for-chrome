
// for ( var i=0; i < 5; i++ ) {
//     
  // alert( index[ i ].name, index[ i ].fqn, index[ i ].url );
// };

// == Helper Prototype Extensions ==

Storage.prototype.setObject = function( key, value, opt_expiration ) {
    
  var expiration = opt_expiration || 3e9; // defaults to a little bit more than 1 month
  
  if ( expiration > 0 ) {
      
    expiration += Date.now();
  }
  
  this.setItem( key, JSON.stringify( value ) );
  this.setItem( key + "__expiration", expiration );
};

Storage.prototype.getObject = function( key ) {
    
  return JSON.parse( this.getItem( key ) );
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

( function(){
    
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
    function setDefaultSuggestion( text ) {
        
        if( text ) {
            
            chrome.omnibox.setDefaultSuggestion( { "description":"<url><match>ActionScript 3.0</match></url> " + text } );
        } else {
            
            chrome.omnibox.setDefaultSuggestion( { "description":"<url><match>ActionScript 3.0</match></url>" } );
        }
    };
    
   
    chrome.omnibox.onInputStarted.addListener( function(){
        
        setDefaultSuggestion('');
    } );
    
    chrome.omnibox.onInputCancelled.addListener( function() {
        
        setDefaultSuggestion( '' );
    } );
    
    setDefaultSuggestion( '' );
    
    chrome.omnibox.onInputChanged.addListener( function( text, suggest_callback ) {
        
        alert( 'listening' );
        setDefaultSuggestion( text );
        if ( !text ) {
            
            return;
        }
        
        var kMaxSuggestions = 10;
        var suggestions = [];
        var stripped_text = text.strip();
        if ( !stripped_text ) {
            
            return;
        }
        var qlower = stripped_text.toLowerCase();
        
        var second_ = [];
        var third_ = [];
        var fourth_ = [];
        if ( index ) {
            
            for ( var i = 0; i < index.length; ++i ) {
                
                var entry = index[ i ];
                var name = entry[ "name" ];
                var fqn = entry[ "fqn" ];
                var url = "http://help.adobe.com/en_US/FlashPlatform/reference/actionscript/3/" + entry[ "url" ];
                var namelower = name.toLowerCase();
                var fqnlower = fqn.toLowerCase();
                var nameidx = namelower.indexOf( qlower );
                var fqnidx = fqnlower.indexOf( qlower );
                if ( ( namelower == qlower ) || ( fqnlower == qlower ) || ( nameidx != -1 ) || ( fqnidx !=-1 ) ) {
                    
                    var suggestion = {
                        
                        "content":url,
                        "description":["<match>", name, "</match> (<match>", fqn, "</match>) - <url>", url, "</url>"].join('')
                    };
                    
                    if( ( namelower == qlower ) || ( fqnlower == qlower ) || ( nameidx == 0 ) ) {
                        
                        suggestions.push(suggestion);
                    } else if ( nameidx != -1 ) {
                        
                        second_.push(suggestion);
                    } else if ( fqnidx == 0 ) {
                        
                        third_.push( suggestion );
                    } else {
                        
                        fourth_.push( suggestion );
                    }
                }
                if ( suggestions.length > kMaxSuggestions ) {
                    
                    break;
                }
            }
        }
        
        if ( suggestions.length < kMaxSuggestions ) {
            
            for ( var i = 0; i < second_.length; ++i ) {
                 
                suggestions.push( second_[ i ] );
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
        
        if ( stripped_text.length >= 2 ) {
            
            suggestions.push({"content":stripped_text +  " [Adobe Community Help]", 
                "description":["Search for \"<match>", stripped_text, "</match>\" using <match><url>Adobe Community Help Search</url></match> - <url>http://community.adobe.com/help/search.html?q=",
                encodeURIComponent(stripped_text), "&amp;loc=en_US&amp;hl=en_US&amp;lbl=0&amp;go=Search&amp;self=1&amp;site=communityhelp_platform_aslr</url>"].join('')}); 
            suggestions.push({"content":stripped_text +  " [Google Code Search]", 
                "description":["Search for \"<match>", stripped_text, "</match> <dim>lang:actionscript</dim>\" using <match><url>Google Code Search</url></match> - <url>http://code.google.com/codesearch#search/&amp;q=", encodeURIComponent(stripped_text + " lang:actionscript"), "</url>"].join('')}); 
            suggestions.push({"content":stripped_text +  " [Development and Coding Search]",  
                "description":["Search for \"<match>", stripped_text, "</match>\" using <match><url>Develoment and Coding Search</url></match> - <url>http://www.google.com/cse?cx=005154715738920500810:fmizctlroiw&amp;q=", encodeURIComponent(stripped_text), "</url>"].join('')});
        }
        suggest_callback( suggestions );
    });
    
    chrome.omnibox.onInputEntered.addListener(function(text) {
        
        //TODO - method doesn't fire if we search for empty string so need to move this ...
        if ( !text ) {
            
            nav("http://help.adobe.com/en_US/FlashPlatform/reference/actionscript/3/");
            return;
        }
        
        var stripped_text = text.strip();
        if (!stripped_text) {
            nav("http://help.adobe.com/en_US/FlashPlatform/reference/actionscript/3/");
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
            var newquery = stripped_text.substring(0, stripped_text.length - adobe_help_suffix.length).strip();
            nav(["http://community.adobe.com/help/search.html?q=", encodeURIComponent(newquery), "&loc=en_US&hl=en_US&lbl=0&go=Search&self=1&site=communityhelp_platform_aslr"].join(''));
            return;
        }
        
        var google_codesearch_suffix = " [Google Code Search]";
        if (stripped_text.endsWith(google_codesearch_suffix)) {
            var newquery = stripped_text.substring(0, stripped_text.length - google_codesearch_suffix.length).strip();
            nav("http://code.google.com/codesearch#search/&q=" + encodeURIComponent(newquery + " lang:actionscript"));
            return;
        }
        
        var devsearch_suffix = " [Development and Coding Search]";
        if (stripped_text.endsWith(devsearch_suffix)) {
            var newquery = stripped_text.substring(0, stripped_text.length - devsearch_suffix.length).strip();
            nav("http://www.google.com/cse?cx=005154715738920500810:fmizctlroiw&q=" + encodeURIComponent(newquery));
            return;
        }
        
        var qlower = stripped_text.toLowerCase();
        if (index) {
            for (var i = 0; i < index.length; ++i) {
                var entry = index[i];
                var name = entry["name"];
                var fqn = entry["fqn"];
                var url = "http://help.adobe.com/en_US/FlashPlatform/reference/actionscript/3/" + entry["url"];
                var namelower = name.toLowerCase();
                var fqnlower = fqn.toLowerCase();
                if ((namelower == qlower) || (fqnlower == qlower)) {
                    nav(url);
                    return;
                }
            }
        }
        
    nav("http://www.google.com/search?q=" + encodeURIComponent("ActionScript 3 "+stripped_text));
  });
})();
