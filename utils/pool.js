const mysql = require('mysql');

const pool = mysql.createPool({
    connectionLimit : 10,
    host: process.env.DB_HOST,
    user: "movimentacoes",
    password: process.env.DB_PASSWORD,
    database: "movimentacoes",
    port: "3306"
  });
  
  pool.getConnection(function(err){
    if(err){
      console.log('Erro de conexao SQL ' + err)
    } else {
      console.log('Sucesso de conexao SQL ');
    }
  });

  pool.on("close", function(err){
    console.log('Conexao SQL fechada: ' + err);
  });

  pool.on("error",function(err){
    console.log('Erro de conexao SQL: ' +err);
  })
  module.exports = pool;