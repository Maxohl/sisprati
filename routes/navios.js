const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const ExpressError = require('../utils/ExpressError');
const mysql = require('mysql2');
const { navioSchema } = require('../schemas.js');
const isLoggedIn = require('../utils/isLogged');
const con = require('../utils/pool');


function converte(date){
    date = new Date(date);
    //return date.getUTCFullYear() + '-' + ('00' + (date.getUTCMonth()+1)).slice(-2) + '-' + ('00' + date.getUTCDate()).slice(-2);
     return date.getUTCDate() + '/' + ('00' + (date.getUTCMonth()+1)).slice(-2) + '/' + ('0000' + date.getUTCFullYear()).slice(-4);    
    };

    const validateNavio = (req, res, next) => {    
        const { error } = navioSchema.validate(req.body);
        if(error){
            const msg = error.details.map(el => el.message).join(',')
            throw new ExpressError(msg, 400)
        } else {
            next();
        } 
    }    

router.get('/', isLoggedIn, (req,res) => {
    const navios = `SELECT * FROM navios where ID_agencia = ${req.user.ID_agencia}`;
    con.query(navios,function(err,result,fields){
        if(err) throw new ExpressError('Dados não encontrados', 400);
      
    res.render('navios/index',{title:'Lista Navios', naviosData:result});
   });
   });
   
   router.get('/new',isLoggedIn, (req,res) => {
       res.render('navios/new');
   });
   

   
   // adiciona navio no BD
   router.post('/', validateNavio, catchAsync(async(req,res,next) => {
   //   if(!req.body.navio) throw new ExpressError('Dados Invalidos', 400);     
     const caminho = req.body.navio;
     con.connect(function(err) {
       //   if(err)throw err;      
       const sql = `INSERT INTO navios (Navio,Bandeira,IMO,Viagem,armador,berco,ETA_Data,ETA_Time,DWT,GRT,LOA,Carga,ETB_Data,ETB_Time,ETS_Data,ETS_Time,C_proa,C_popa,CS_proa,CS_popa,situacao, ID_agencia) VALUES ("${caminho.Navio}", "${caminho.Bandeira}", "${caminho.IMO}","${caminho.Viagem}","${caminho.Armador}","${caminho.Berco}","${caminho.ETA}","${caminho.ETA_time}","${caminho.DWT}","${caminho.GRT}","${caminho.LOA}","${caminho.Carga}","${caminho.ETB}","${caminho.ETB_time}","${caminho.ETS}","${caminho.ETS_time}","${caminho.C_proa}","${caminho.C_popa}","${caminho.CS_proa}","${caminho.CS_popa}","${caminho.situation}","${req.user.ID_agencia}")`;
         con.query(sql,function(err,result){
              if(err)throw err;
              console.log(result);
             req.flash('Sucesso','Navio registrado com sucesso');
             res.redirect(`/navios/${result.insertId}`);            
             
         });
     }); 
   }));

   router.get('/:id', isLoggedIn,catchAsync(async(req,res,next) => {
    const navios = 'SELECT * FROM navios WHERE ID ='+mysql.escape(req.params.id);
    const cookie = req.cookies.ID;
    try {
    con.query(navios,function(err,result,fields){
        // if(err) console.log(err.stack);
        console.log(result[0].ID_agencia)
        console.log(cookie);
        if(result.length == 0 || result[0].ID_agencia != cookie){
            req.flash('error','Navio nao encontrado');
            return res.redirect('/navios');
        }
        const dateEta = converte(result[0].ETA_Data);
        const dateEtb = converte(result[0].ETB_Data);
        const dateEts = converte(result[0].ETS_Data);
        console.log(req.user.ID_agencia);
        // if(result[0] == undefined) throw new ExpressError('Pagina não encontrada', 404);         
        // console.log(result[0].ETA_Data);        
        
        res.render('navios/show',{title:'Show Navio', naviosData:result, dateEta,dateEtb,dateEts});
    });
}catch(err){ new ExpressError('Pagina nao encontrada', 404) } 
}));

router.get('/:id/edit',isLoggedIn, (req,res) => {
    const cookie = req.cookies.ID;
    const navios = 'SELECT * FROM navios WHERE ID ='+mysql.escape(req.params.id);
    con.query(navios,function(err,result,fields){
        if(result.length == 0 || result[0].ID_agencia != cookie){
            req.flash('error','Navio nao encontrado');
            return res.redirect('/navios');
        };
         const dateEta = converte(result[0].ETA_Data);
         const dateEtb = converte(result[0].ETB_Data);
         const dateEts = converte(result[0].ETS_Data);
        res.render('navios/edit',{title:'Edit Navio', naviosData:result, dateEta,dateEtb,dateEts});
    });
});

router.put('/:id', validateNavio, catchAsync(async(req,res,next) => {
    const caminho = req.body.navio;
    const idNavio = caminho.ID;
    con.connect(function(err){
        // if (err) throw err;
        const sql = `UPDATE navios SET Navio="${caminho.Navio}",Bandeira="${caminho.Bandeira}",IMO="${caminho.IMO}",Viagem="${caminho.Viagem}",armador="${caminho.Armador}",berco="${caminho.Berco}",ETA_Data="${caminho.ETA}",ETA_Time="${caminho.ETA_time}",DWT="${caminho.DWT=0}",GRT="${caminho.GRT=0}",LOA="${caminho.LOA=0}",Carga="${caminho.Carga}",ETB_Data="${caminho.ETB}",ETB_Time="${caminho.ETB_time}",ETS_Data="${caminho.ETS}",ETS_Time="${caminho.ETS_time}",C_proa="${caminho.C_proa}",C_popa="${caminho.C_popa}",CS_proa="${caminho.CS_proa}",CS_popa="${caminho.CS_popa}",situacao="${caminho.situation}"  WHERE ID =`+mysql.escape(req.params.id);
        con.query(sql,function(err,result) {
            // if (err) throw err;
            
        res.redirect(`/navios/${req.params.id}`);
        });
    })
    
    ;
}));

router.delete('/:id', catchAsync(async(req,res,next) => {
    const sql = `DELETE FROM navios WHERE ID = `+mysql.escape(req.params.id);
    con.query(sql,function(err,result){
        if(err) throw err;
        console.log('Number of records deleted:'+result.affectedRows);
        res.redirect('/navios');
    });
}));

module.exports = router;