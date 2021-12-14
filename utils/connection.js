const mysql = require('mysql2');

 const con = mysql.createConnection({
  host: process.env.DB_HOST,
  user: "movimentacoes",
  password:process.env.DB_PASSWORD,
  database:"movimentacoes",
  port: "3306"
});
module.exports = con;


