function clearStatus() {
                
        document.getElementById( "status" ).innerHTML = '';
    };


function selectionChanged() {
    
    var selected_option = this.options[ this.selectedIndex ];
    var value = selected_option.value;
    if ( value == "www.php.net/" ) {
        
        delete localStorage[ 'mirror' ];
    } else {
        
        localStorage[ 'mirror' ] = value + '/';
    }
    
    document.getElementById( "status" ).innerHTML = '<font color=\"green\">Changes saved.</font>';
    setTimeout( clearStatus, 1000 );
};

var total = 1;
var req = new XMLHttpRequest();
req.open( "GET", "http://www.php.net/mirrors.php" );
req.onreadystatechange=function(){
    
    if ( req.readyState == 4 ){
        
        var status=req.status;
        if ( ( status == 200 ) || ( status == 301 ) || ( status == 302 ) ) {
            
            var text = req.responseText;
            var matches = text.match( new RegExp( "<td><a href=\"http://([a-z]|[A-Z]|[0-9])+\.php\.net/\">([a-z]|[A-Z]|[0-9])+\.php\.net</a></td>", "g" ) );
            for ( var i = 0; i < matches.length; ++i ) {
                
                var match = matches[ i ];
                var hrefstartiddx = match.indexOf( "http://" ) + 7;
                var hrefendidx = match.indexOf( "/", hrefstartiddx );
                var value = match.substring( hrefstartiddx, hrefendidx );
                if ( value != "www.php.net" ) {
                    
                    document.extension_configuration.mirror_sites.options[ total ] = new Option( value, value );
                    if ( localStorage[ 'mirror' ] && ( value == localStorage[ 'mirror' ] ) ) {
                        
                        document.extension_configuration.mirror_sites.selectedIndex = total;
                    }
                    total++;
                }
            }
            
            document.extension_configuration.mirror_sites.onchange = selectionChanged;
            document.getElementById( "status" ).innerHTML = '';
            document.getElementById( "content" ).style.display = "block";
        }
    }
};
req.send( null );