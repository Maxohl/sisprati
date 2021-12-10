const mysql = require('mysql2');
 //Configurations for Database connection  
   const con = mysql.createConnection({
    host: "187.45.196.164",
    user: "movimentacoes",
    password:process.env.DB_PASSWORD,
    database:"movimentacoes",
    port: "3306"
});

module.exports = con;