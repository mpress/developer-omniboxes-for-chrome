(function(){
    
    function navigateTo( url ) {
        
        chrome.tabs.getSelected( null, function( tab ) {
            
            chrome.tabs.update( tab.id, { url: url } );
        } );
    };
    
    function setDefaultSuggestion( text ) {
        
        if ( text ) {
            
            chrome.omnibox.setDefaultSuggestion( { "description":"<url><match>Java API Search</match></url> " + text } );
        } else {
            
            chrome.omnibox.setDefaultSuggestion( { "description":"<url><match>Java API Search</match></url>" } );
        }
    };
    
    
    chrome.omnibox.onInputCancelled.addListener(function() {
       
        setDefaultSuggestion( '' );
    });
    
    setDefaultSuggestion( '' );
    
    
    chrome.omnibox.onInputChanged.addListener( function( text, suggest_callback ) {
    	
        setDefaultSuggestion( text );
        if( !text ) {

            return;
        }
        
        var kMaxSuggestions = 10;
        var suggestions = [];
        var stripped_text = text.strip();
        if (!stripped_text) {
        	
            return;
        }
        var qlower = stripped_text.toLowerCase();
        
        var second = [];
        var third = [];
        var fourth = [];
        if ( index ) {
        	
            for ( var i = 0; i < index.length; ++i) {
            	
                var item = index[ i ];
                var fqn = item[ "fqn" ];
                var url = "http://docs.oracle.com/javase/7/docs/api/" + item[ "url" ];
                var name = item[ "name" ];
                var type = item[ "type" ];
                var namelower = name.toLowerCase();
                var nameidx = namelower.indexOf( qlower );
                var fqnlower = fqn.toLowerCase();
                if ( ( nameidx != -1 ) || fqnlower.startsWith( qlower ) ) {
                	
                    var entry = {
                    
                        "content" : url,
                        "description" : [ "<match>", name, "</match> <dim>(", type, " <match>", fqn, "</match>)</dim> - <url>", url, "</url>" ].join( '' )
                    };
                    
                    if ( fqnlower.startsWith( "org." ) ) {
                    	
                        fourth.push( entry );
                    } else if ( nameidx == 0 ) {
                        
                        suggestions.push( entry );
                    } else if ( nameidx != -1 ) {
                        
                        second.push( entry );
                    } else {
                        
                        third.push( entry );
                    }
                    if ( suggestions.length > kMaxSuggestions ) {
                        
                        break;
                    }
                }
            }
        }
        
        if( suggestions.length < kMaxSuggestions ) {
           
            for( var i = 0; i < second.length; ++i ) {
           
                suggestions.push( second[ i ] );
            }
        }
        
        if( suggestions.length < kMaxSuggestions ) {
        	
            for ( var i = 0; i < third.length; ++i ) {
            
                suggestions.push( third[ i ] );
            }
        }
        
        if( suggestions.length < kMaxSuggestions ) {
        	
            for ( var i = 0; i < fourth.length; ++i ) {
            
                suggestions.push( fourth[ i ] );
            }
        }
        
        if( stripped_text.length >= 2 ) {
        	
            suggestions.push( { "content" : stripped_text +  " [Google Code Search]", 
                "description" : [ "Search for \"<match>", stripped_text, "</match> <dim>lang:java</dim>\" using <match><url>Google Code Search</url></match> - <url>http://code.google.com/codesearch#search/&amp;q=", encodeURIComponent( stripped_text + " lang:java" ), "</url>" ].join( '' ) } ); 
          
            suggestions.push( { "content" : stripped_text +  " [Development and Coding Search]", 
                "description" : [ "Search for \"<match>", stripped_text, "</match>\" using <match><url>Develoment and Coding Search</url></match> - <url>http://www.google.com/cse?cx=005154715738920500810:fmizctlroiw&amp;q=", encodeURIComponent( stripped_text ), "</url>" ].join( '' ) } );
        }
        suggest_callback( suggestions );
    });
    
    chrome.omnibox.onInputEntered.addListener( function( text ) {
    	
        if( !text ) {
        
            navigateTo( "http://docs.oracle.com/javase/7/docs/api/" );
            return;
        }
        
        var stripped_text = text.strip();
        if( !stripped_text || stripped_text == ' ' ) {
        
            navigateTo( "http://docs.oracle.com/javase/7/docs/api/" );
            return;
        }
        
        if( stripped_text.startsWith( "http://" ) || stripped_text.startsWith( "https://" ) ) {
        
            navigateTo( stripped_text );
            return;
        }
        
        if( stripped_text.startsWith( "www." ) || stripped_text.endsWith( ".com" ) || stripped_text.endsWith( ".net" ) || stripped_text.endsWith( ".org" ) || stripped_text.endsWith( ".edu" ) ) {
            
            navigateTo( "http://" + stripped_text );
            return;
        }
                
        var google_codesearch_suffix = " [Google Code Search]";
        if( stripped_text.endsWith(google_codesearch_suffix ) ) {
        
            var newquery = stripped_text.substring( 0, stripped_text.length - google_codesearch_suffix.length ).strip();
            navigateTo( "http://code.google.com/codesearch#search/&q=" + encodeURIComponent( newquery + " lang:java" ) );
            return;
        }
        
        var devsearch_suffix = " [Development and Coding Search]";
        if( stripped_text.endsWith( devsearch_suffix ) ) {
        
            var newquery = stripped_text.substring(0, stripped_text.length - devsearch_suffix.length).strip();
            navigateTo("http://www.google.com/cse?cx=005154715738920500810:fmizctlroiw&q=" + encodeURIComponent(newquery));
            return;
        }
        
        var qlower = stripped_text.toLowerCase();
        var backup_url = null;
        if( index ) {
        	
            for ( var i = 0; i < index.length; ++i ) {
            	
                var item = index[ i ];
                var fqn = item[ "fqn" ];
                var url = "http://docs.oracle.com/javase/7/docs/api/" + item[ "url" ];
                var name = item[ "name" ];
                var fqnlower = fqn.toLowerCase();
                if ( fqnlower == qlower ) {
                	
                    navigateTo( url );
                    return;
                }
                if ( name.toLowerCase() == qlower ) {
                	
                    if ( fqnlower.startsWith( "org." ) ) {
                    	
                        if ( !backup_url ) {
                        	
                            backup_url = url;
                        }
                    } else {
                    	
                        navigateTo( url );
                        return;
                    }
                }
            }
        }
        if ( backup_url ) {
        	
            navigateTo( backup_url );
            return;
        }
        
        navigateTo( "http://www.google.com/search?q=" + encodeURIComponent( "Java "+stripped_text ) );
    });
})();