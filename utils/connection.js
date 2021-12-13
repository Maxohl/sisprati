const mysql = require('mysql2');
 //Configurations for Database connection
//  module.exports.makeConnection = ()=>{
//   return new Promise((resolve,reject)=>{
//   const conDB = mysql.createConnection({
//     host: process.env.DB_HOST,
//     user: "movimentacoes",
//     password:process.env.DB_PASSWORD,
//     database:"movimentacoes",
//     port: "3306"
// });
// conDB.connect((err) => {
//   if(err){
//     reject(err)
//   }
//   resolve(conDB)
// });
// })
//  }

//  module.exports.closeConnection =  (conDB)=> {
//    conDB.destroy();
//  }



 const con = mysql.createConnection({
  host: process.env.DB_HOST,
  user: "movimentacoes",
  password:process.env.DB_PASSWORD,
  database:"movimentacoes",
  port: "3306"
});

module.exports = con;


