module.exports = function converte(date){
    date = new Date(date);
    return date.getUTCFullYear() + '-' + ('00' + (date.getUTCMonth()+1)).slice(-2) + '-' + ('00' + date.getUTCDate()).slice(-2);
    //  return date.getUTCDate() + '/' + ('00' + (date.getUTCMonth()+1)).slice(-2) + '/' + ('0000' + date.getUTCFullYear()).slice(-4);    
    };