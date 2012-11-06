var http = require('http');

var fs = require('fs');

eval( fs.readFileSync( '../common/String.js' ) + '' );

var TARGET_PATH = '/manual/en/indexes.functions.php';

var TARGET_HOST = 'www.php.net';


if ( fs.existsSync('./result.tmp' ) ) {

    fs.writeFile( './result.tmp', '', function( error ) {
    } );
} else {

    fs.open( './result.tmp', 'w' );
}

if ( fs.existsSync( 'index.js') ) {

    fs.writeFile('index.js', '', function( error ) {
    } );
}

var downloaded = false;

var scrapeData = function() {

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
              "url" : [ "manual/", href ].join( '' ) }//base, "manual/", href ].join( '' ) }
        );
    }
    
    fs.appendFileSync( 'index.js', "var index = " + JSON.stringify( php_functions_ ) );

}
var options = {
    host : TARGET_HOST,
    port : 80,
    path : TARGET_PATH
};

var req = http.get( options, function( res ) {

    // console.log( 'STATUS: ' + res.statusCode );
    // console.log( 'HEADERS: ' + JSON.stringify( res.headers ) );
    res.setEncoding( 'utf8' );

    res.on( 'data', function( chunk ) {

        fs.appendFile( './result.tmp', chunk, function( error ) {

            if ( error ) {

                console.log( error );
            } else {

                if ( downloaded ){

                    scrapeData();

                   // fs.unlinkSync('./result.tmp');
                }
            }
        } );
    } );

    res.on( 'end', function() {

        downloaded = true;
    } );
} );

req.on( 'error', function( e ) {

    console.log( 'problem with request: ' + e.message );
} );