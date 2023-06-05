(function(){
     
    function navigateTo( url ) {
        
        chrome.tabs.getSelected( null, function( tab ) {
            
            chrome.tabs.update( tab.id, { url: url } );
        } );
    };
    
    function setDefaultSuggestion( text ) {
        
        if ( text ) {
            
            chrome.omnibox.setDefaultSuggestion( { "description":"<url><match>PHP Search</match></url> " + text } );
        } else {
            
            chrome.omnibox.setDefaultSuggestion( { "description":"<url><match>PHP Search</match></url>" } );
        }
    };
    
    
    function mirror() {
        
        return localStorage['mirror'] || 'http://www.php.net/';
    };
    
    function baseurl() {
        return [ mirror() ].join('');
    };
    
    function loadBalanced(baseurl) {
    	
      if ( baseurl != "http://www.php.net/" ) {
          
        return baseurl;
      }
      
      var mirrors = [
        "http://us.php.net/",
        "http://us2.php.net/",
        "http://us3.php.net/",
        "http://www.php.net/"
      ];
      
      var randomIndex = Math.floor( Math.random() * mirrors.length );
      return mirrors[ randomIndex ];
    };
    
  
    var predefined_ = [
        { "name" : "bool", "url" : "manual/language.types.boolean.php" },
        { "name" : "boolean", "url" : "manual/language.types.boolean.php" },
        { "name" : "int", "url" : "manual/language.types.integer.php" },
        { "name" : "integer", "url" : "manual/language.types.integer.php" },
        { "name" : "float", "url" : "manual/language.types.float.php" },
        { "name" : "double", "url" : "manual/language.types.float.php" },
        { "name" : "real", "url" : "manual/language.types.float.php" },
        { "name" : "string", "url" : "manual/language.types.string.php" },
        { "name" : "array", "url" : "manual/language.types.array.php" },
        { "name" : "object", "url" : "manual/language.types.object.php" },
        { "name" : "resource", "url" : "manual/language.types.resource.php" },
        { "name" : "null", "url" : "manual/language.types.null.php" }
    ];

    chrome.omnibox.onInputStarted.addListener( function(){
        
        setDefaultSuggestion( '' );
    } );
    
    chrome.omnibox.onInputCancelled.addListener( function() {
        
        setDefaultSuggestion('');
    } );
    
    setDefaultSuggestion('');
    
    chrome.omnibox.onInputChanged.addListener( function( text, suggest_callback ) {
        
        setDefaultSuggestion( text );
        if ( !text ) {
            
            return;
        }
        
        var kMaxSuggestions = 10;
        var suggestions = [];
        var stripped_text = text.trim();
        if ( !stripped_text ) {
            
            return;
        }
        
        var arrow = new RegExp( "->", "g" );
        var qlower = stripped_text.toLowerCase();
        if ( qlower.endsWith( "-" ) ){
            
            qlower = qlower.substr( 0, qlower.length - 1 ) + ".";
        }
        qlower = qlower.replace( arrow, "." );
        var second = [];
        
        var base = baseurl();
        for( var i = 0; i < predefined_.length; ++i ){
            
            var entry = predefined_[ i ];
            var name = entry[ "name" ];
            var namelower = name.toLowerCase();
            var nameidx = namelower.indexOf( qlower );
            if( nameidx != -1 ){
                
                var url = base + entry[ "url" ];
                var target = null;
                if ( nameidx == 0 ) {
                    
                    target = suggestions;
                } else {
                    
                    target = second;
                }
                target.push( {
                    
                    "content":url,
                    "description":[ "<match>", name, "</match> - <url>", url, "</url>" ].join( '' ) }
                );
            }
            if( suggestions.length > kMaxSuggestions ) {
                
                break;
            }
        } 
        
        if( index ) {
            
            for ( var i = 0; i < index.length; ++i ) {
                
                var entry = index[ i ];
                var name = entry[ "name" ];
                var namelower = name.toLowerCase();
                var nameidx = namelower.indexOf( qlower );
                if ( nameidx != -1 ) {
                    
                    var url = base + entry[ "url" ];
                    var target = null;
                    if ( nameidx == 0 ) {
                        
                        target = suggestions;
                    } else {
                        
                        target = second;
                    }
                    target.push({
  
                        "content" : url,
                        "description" : [ "<match>", name, "</match> - <url>", url, "</url>" ].join( '' ) }
                    );
                }
                if( suggestions.length > kMaxSuggestions ) {
                    
                    break;
                }
            }
        }
      
        if( suggestions.length < kMaxSuggestions ) {
            
            for( var i = 0; i < second.length; ++i ) {
                
                suggestions.push( second[ i ] );
                if ( suggestions.length > kMaxSuggestions ) {
                    
                    break;
                }
            }
        }
        
        if ( stripped_text.length >= 2 ) {
            
            suggestions.push( { "content" : stripped_text + " [PHP Search]",
                "description" : ["Search for \"<match>", stripped_text, "</match>\" using <match><url>PHP Search</url></match> - <url>", base ,"manual-lookup.php?pattern=", encodeURIComponent(stripped_text), "&amp;lang=en</url>"].join('')});
            
            suggestions.push({"content":stripped_text +  " [Google Code Search]", 
                "description":["Search for \"<match>", stripped_text, "</match> <dim>lang:php</dim>\" using <match><url>Google Code Search</url></match> - <url>http://code.google.com/codesearch#search/&amp;q=", encodeURIComponent(stripped_text + " lang:php"), "</url>"].join('')}); 
            
            suggestions.push({"content":stripped_text +  " [Development and Coding Search]", 
                "description":["Search for \"<dim>PHP</dim> <match>", stripped_text, "</match>\" using <match><url>Develoment and Coding Search</url></match> - <url>http://www.google.com/cse?cx=005154715738920500810:fmizctlroiw&amp;q=", encodeURIComponent("PHP "+stripped_text), "</url>"].join('')});
        }
        
        suggest_callback( suggestions );
    } );
    
    chrome.omnibox.onInputEntered.addListener( function( text ) {
        
        var base = baseurl();
        if ( !text ) {
            
            navigateTo( base + "manual/index.php" );
            return;
        }
        
        var stripped_text = text.trim();
        
        if (!stripped_text || stripped_text == "" ) {
        
            navigateTo( base + "manual/index.php" );
            return;
        }
        
        if( stripped_text == "options" ) {
        
            chrome.tabs.create( { url : 'options.html' } );
            return;
        }
        
        
        if ( stripped_text.startsWith( "http://" ) || stripped_text.startsWith( "https://" ) ) {
            
            navigateTo( stripped_text );
            return;
        }
        
        if (stripped_text.startsWith("www.") || stripped_text.endsWith(".com") || stripped_text.endsWith(".net") || stripped_text.endsWith(".org") || stripped_text.endsWith(".edu")) {
            
            navigateTo("http://" + stripped_text);
            return;
        }
                
        var php_suffix = " [PHP Search]";
        if (stripped_text.endsWith(php_suffix)) {
            
            var newquery = stripped_text.substring(0, stripped_text.length - php_suffix.length).trim();
            navigateTo([base, "manual-lookup.php?pattern=", encodeURIComponent(newquery), "&lang=en"].join(''));
            return;
        }        
        
        var google_codesearch_suffix = " [Google Code Search]";
        if (stripped_text.endsWith(google_codesearch_suffix)) {
            var newquery = stripped_text.substring(0, stripped_text.length - google_codesearch_suffix.length).trim();
            navigateTo("http://code.google.com/codesearch#search/&q=" + encodeURIComponent(newquery + " lang:php"));
            return;
        }
        
        var devsearch_suffix = " [Development and Coding Search]";
        if (stripped_text.endsWith( devsearch_suffix ) ) {
            var newquery = stripped_text.substring(0, stripped_text.length - devsearch_suffix.length).trim();
            navigateTo("http://www.google.com/cse?cx=005154715738920500810:fmizctlroiw&q=" + encodeURIComponent("PHP "+newquery));
            return;
        }
        
        var qlower = stripped_text.toLowerCase();
        var arrow = new RegExp("->", "g");
        qlower = qlower.replace(arrow, ".");        
        for (var i = 0; i < predefined_.length; ++i) {
            var entry = predefined_[i];
            if (entry["name"].toLowerCase() == qlower) {
                
                navigateTo(base+entry["url"]);
                return;
            }
        }
        
        if ( index ) {
            for ( var i = 0; i < index.length; ++i ) {
                var entry = index[ i ];
                if ( entry[ "name" ].toLowerCase() == qlower ) {
                    
                    navigateTo( entry[ "url" ] );
                    return;
                }
            }
        }
        
        // if (php_api_) {
            // for (var i = 0; i < php_api_.length; ++i) {
                // var entry = php_api_[i];
                // if (entry["name"].toLowerCase() == qlower) {
                    // navigateTo(entry["url"]);
                    // return;
                // }
            // }
        // }
        
        navigateTo("http://www.google.com/search?q=" + encodeURIComponent( "PHP " + stripped_text));
    } );
} )();