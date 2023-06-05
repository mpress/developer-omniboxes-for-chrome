

String.prototype.encode = function() {
    
    return encodeURIComponent( String( this ) );
};

//
// String.prototype.strip = function() {
//
//         var str = String( this );
//
//         if ( !str ) {
//
//             return "";
//         }
//
//         var startidx = 0;
//         var lastidx = str.length - 1;
//
//         while( ( startidx < str.length ) && ( str.charAt( startidx ) == ' ' ) ){
//
//             startidx++;
//         }
//         while( ( lastidx >= startidx ) && ( str.charAt( lastidx ) == ' ' ) ){
//
//             lastidx--;
//         }
//
//         if ( lastidx < startidx ) {
//
//             return "";
//         }
//
//         return str.substring( startidx, lastidx + 1 );
// };
