var http = require( 'http' );
var fs = require( 'fs' );

var options = {
  host: 'help.adobe.com',
  port: 80,
  path: '/en_US/FlashPlatform/reference/actionscript/3/class-summary.html',
  method: 'GET'
};

fs.writeFile( './result', '', function( error ) {} );

var scrapeData = function(){
  
  console.log( 'do the do be do be do' );
}

var downloaded = false;

var req = http.request( options, function( res ) {
  
  //console.log( 'STATUS: ' + res.statusCode );
  //console.log( 'HEADERS: ' + JSON.stringify( res.headers ) );
  res.setEncoding( 'utf8' );
  
  res.on( 'data', function ( chunk ) {
    
      fs.appendFile( './result', chunk, function( error ) {
    
        if( error ) {
          
            console.log( error );
        } else {
          
           // console.log("The file was saved!", downloaded );
            if( downloaded ) {
              
              scrapeData();
            }
            
        }
      } );
  } );
  
  res.on( 'end', function() {
    
    console.log( "File downloaded" );
    downloaded = true;
  } );
} );


req.on( 'error', function( e ) {

  console.log( 'problem with request: ' + e.message );
} );

// write data to request body
req.write( 'data\n' );
req.write( 'data\n' );
req.end();