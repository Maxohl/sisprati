const mysql = require('mysql2');

const pool = mysql.createPool({
    connectionLimit : 10,
    host: process.env.DB_HOST,
    user: "movimentacoes",
    password: process.env.DB_PASSWORD,
    database: "movimentacoes",
    port: "3306"
  });
  
  module.exports = pool;