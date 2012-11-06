( function(){
   
    function navigateTo( url ) {
        
        console.log( "Navigating to: " + url );
        chrome.tabs.getSelected( null, function( tab ) {
            
            chrome.tabs.update( tab.id, { url: url } );
        } );
    };
    
    function setDefaultSuggestionStyle( text ) {
        
        if( text ) {
            
            chrome.omnibox.setDefaultSuggestion( { "description" : "<url><match>ActionScript 3.0</match></url> " + text } );
        } else {
            
            chrome.omnibox.setDefaultSuggestion( { "description" : "<url><match>ActionScript 3.0</match></url>" } );
        }
    };
    
   
    chrome.omnibox.onInputStarted.addListener( function(){
        
        setDefaultSuggestionStyle( '' );
    } );
    
    chrome.omnibox.onInputCancelled.addListener( function() {
        
        setDefaultSuggestionStyle( '' );
    } );
    
    setDefaultSuggestionStyle( '' );
    
    chrome.omnibox.onInputChanged.addListener( function( text, suggest_callback ) {
        
        setDefaultSuggestionStyle( text );
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
        
        if( suggestions.length < kMaxSuggestions ) {
            
            for ( var i = 0; i < second_.length; ++i ) {
                 
                suggestions.push( second_[ i ] );
            }
        }

        if( suggestions.length < kMaxSuggestions ) {
            
            for ( var i = 0; i < third_.length; ++ i ) {
                
                suggestions.push( third_[ i ] );
            }
        }
        
        if( suggestions.length < kMaxSuggestions ) {
            
            for ( var i = 0; i < fourth_.length; ++i ) {
                
                suggestions.push( fourth_[ i ] );
            }
        }
        
        if( stripped_text.length >= 2 ) {
            
            suggestions.push( { 
                
                "content" : stripped_text + " [Adobe Community Help]", 
                "description" : [ "Search for \"<match>", stripped_text, "</match>\" using <match><url>Adobe Community Help Search</url></match> - <url>http://community.adobe.com/help/search.html?q=",
                    encodeURIComponent( stripped_text ), "&amp;loc=en_US&amp;hl=en_US&amp;lbl=0&amp;go=Search&amp;self=1&amp;site=communityhelp_platform_aslr</url>" ].join( '' ) } 
            ); 
            
            suggestions.push( { 
                
                "content" : stripped_text +  " [Google Code Search]", 
                "description" : [ "Search for \"<match>", stripped_text, "</match> <dim>lang:actionscript</dim>\" using <match><url>Google Code Search</url></match> - <url>http://code.google.com/codesearch#search/&amp;q=",
                    encodeURIComponent( stripped_text + " lang:actionscript" ), "</url>" ].join( '' ) } 
            ); 
            
            suggestions.push( {
                
                "content":stripped_text +  " [Development and Coding Search]",  
                "description" : [ "Search for \"<match>", stripped_text, "</match>\" using <match><url>Develoment and Coding Search</url></match> - <url>http://www.google.com/cse?cx=005154715738920500810:fmizctlroiw&amp;q=",
                encodeURIComponent(stripped_text), "</url>" ].join( '' ) }
            );
        }
        
        suggest_callback( suggestions );
    });
    
    chrome.omnibox.onInputEntered.addListener(function(text) {
        
        if ( text == " " ) {
            
            navigateTo( "http://help.adobe.com/en_US/FlashPlatform/reference/actionscript/3/" );
            return;
        }
        
        var stripped_text = text.strip();
        if ( !stripped_text ) {
            
            navigateTo( "http://help.adobe.com/en_US/FlashPlatform/reference/actionscript/3/" );
            return;
        }
        
        if ( stripped_text.startsWith( "http://" ) || stripped_text.startsWith( "https://" ) ) {
            
            navigateTo( stripped_text );
            return;
        }
        
        if(stripped_text.startsWith( "www." ) || stripped_text.endsWith( ".com" ) || stripped_text.endsWith( ".net" ) || stripped_text.endsWith( ".org" ) || stripped_text.endsWith( ".edu" ) ) {
          
            navigateTo( "http://" + stripped_text );
            return;
        }
                        
        var adobe_help_suffix = " [Adobe Community Help]";
        if( stripped_text.endsWith(adobe_help_suffix ) ) {
         
            var newquery = stripped_text.substring( 0, stripped_text.length - adobe_help_suffix.length ).strip();
            navigateTo( [ "http://community.adobe.com/help/search.html?q=", encodeURIComponent( newquery ), 
                "&loc=en_US&hl=en_US&lbl=0&go=Search&self=1&site=communityhelp_platform_aslr" ].join( '' ) );
            return;
        }
        
        var google_codesearch_suffix = " [Google Code Search]";
        if( stripped_text.endsWith( google_codesearch_suffix ) ) {
            
            var newquery = stripped_text.substring(0, stripped_text.length - google_codesearch_suffix.length).strip();
            navigateTo( "http://code.google.com/codesearch#search/&q=" + encodeURIComponent( newquery + " lang:actionscript") );
            return;
        }
        
        var devsearch_suffix = " [Development and Coding Search]";
        if( stripped_text.endsWith( devsearch_suffix ) ) {
            
            var newquery = stripped_text.substring( 0, stripped_text.length - devsearch_suffix.length ).strip();
            navigateTo( "http://www.google.com/cse?cx=005154715738920500810:fmizctlroiw&q=" + encodeURIComponent(newquery));
            return;
        }
        
        var qlower = stripped_text.toLowerCase();
        if( index ) {
            
            for ( var i = 0; i < index.length; ++i ) {
                
                var entry = index[ i ];
                var name = entry[ "name" ];
                var fqn = entry[ "fqn" ];
                var url = "http://help.adobe.com/en_US/FlashPlatform/reference/actionscript/3/" + entry[ "url" ];
                var namelower = name.toLowerCase();
                var fqnlower = fqn.toLowerCase();
                if( ( namelower == qlower ) || ( fqnlower == qlower ) ) {
                    
                    navigateTo( url );
                    return;
                }
            }
        }
        
    navigateTo("http://www.google.com/search?q=" + encodeURIComponent("ActionScript 3 "+stripped_text));
  } );
} )();
