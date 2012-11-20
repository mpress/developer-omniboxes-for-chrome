String.prototype.startsWith = function( str ) {
    
    if ( str.length > this.length ) {

        return false;
    }
    return( String( this ).substr( 0, str.length ) == str );
};


String.prototype.endsWith = function( str ) {
    
    if( str.length > this.length ) {
        
        return false;
    }
    return( String( this ).substr( this.length - str.length, this.length ) == str );
};


String.prototype.encode = function() {
    
    return encodeURIComponent( String( this ) );
};


String.prototype.strip = function() {
    
        var str = String( this );
   
        if ( !str ) {
     
            return "";
        }
  
        var startidx = 0;
        var lastidx = str.length - 1;

        while( ( startidx < str.length ) && ( str.charAt( startidx ) == ' ' ) ){
       
            startidx++;
        }
        while( ( lastidx >= startidx ) && ( str.charAt( lastidx ) == ' ' ) ){
       
            lastidx--;
        }
   
        if ( lastidx < startidx ) {
       
            return "";
        }
     
        return str.substring( startidx, lastidx + 1 );
};
