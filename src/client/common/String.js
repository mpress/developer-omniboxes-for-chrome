

String.prototype.encode = function() {
    
    return encodeURIComponent( String( this ) );
};
