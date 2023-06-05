
Object.defineProperty(String.prototype, "encode", {
    
    enumerable : false,
    
    value: function( str ){

      return encodeURIComponent( String( this ) );
    }
} );

//
// Object.defineProperty(String.prototype, "strip", {
//
//     enumerable : false,
//
//     value: function( str ){
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
//     }
// } );
