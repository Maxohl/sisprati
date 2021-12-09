const mysql = require('mysql');
 //Configurations for Database connection  
   const con = mysql.createConnection({
    host: process.env.DB_HOST,
    user: "movimentacoes",
    password:process.env.DB_PASSWORD,
    database:"movimentacoes"
});

module.exports = con;