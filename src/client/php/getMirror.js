var request = new XMLHttpRequest();

request.open( "GET", "http://www.php.net/mirrors.php" );
request.onreadystatechange=function(){
    
    
    if ( request.readyState == 4 ){
        
        var status=request.status;
        if ( ( status == 200 ) || ( status == 301 ) || ( status == 302 ) ) {
            
            var text = request.responseText;
            
            var parser = new DOMParser();
            var xDoc = parser.parseFromString( text, "text/xml" );
            var mirrorList = xDoc.getElementsByTagName( 'table' );//( "mirrors" );
           
            if( mirrorList.length == 2 ) {
              
                var anchors = mirrorList[ 0 ].getElementsByTagName( 'a' );
              
                //TODO randomise tag selection
                var href = anchors[ 0 ].getAttribute( "href" );
            }
           
            localStorage[ 'mirror' ] = href;
        }
    }
};

if( !!localStorage[ 'mirror' ] ) {

    request.send( null );
}