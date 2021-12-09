const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const ExpressError = require('../utils/ExpressError');
const mysql = require('mysql');
const { condicionadaSchema } = require('../schemas.js');
const isLoggedIn = require('../utils/isLogged');
const converte = require('../utils/convertDate');
const con = require('../utils/connection');
require('dotenv').config();

let copia;
let nameShip;

const validateCondi = (req,res,next) => {
    const { error } = condicionadaSchema.validate(req.body);
    if(error){
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg,400)
    } else {
        next();
    }
}

function Redirecionar(result,res){
    console.log(result);
    const navio = 'SELECT * FROM navios ORDER BY Navio';
    con.query(navio,function(err,rows,fields){
        if(err) throw(err);
        res.render('condicionada/edit',{title:'Requisicao', requiData:result, Ship:nameShip, navioData:rows});
    })
    
}

function NomeNavio(ID,res){
    const navio = `SELECT * FROM navios where ID = ${ID[0].ID_NavioMain}`
    con.query(navio,function(err,rows,fields){
        if(err) throw(err)
        nameShip = rows.slice(0,1);       
        //return(rows[0].Navio);
        Redirecionar(ID,res);
    })
}

function listaNavios(result,res){
    const query = 'SELECT * FROM navios ORDER BY Navio';
    con.query(query,function(err,rows,fields){
        if(err) throw(err)
        res.render('condicionada/new',{title:'Lista Navios', condiData:result, navioData:rows});
    })
}

function allRequi(req){
    const searchQuery = `SELECT * FROM condicionado WHERE ID_agencia = ${req.user.ID_agencia} order by ID desc`;
    con.query(searchQuery,function(err,rows,fields){
        if(err) throw(err);
        //console.log(rows);
     copia = rows.slice(0,5);
     return(rows.slice(0,5));
    })
}

router.get('/', isLoggedIn,(req,res) => {
    allRequi(req); 
    const navios = `SELECT * FROM navios where ID_agencia = ${req.user.ID_agencia}`;
    con.query(navios,function(err,result,fields){
        if(err) throw(err);
     console.log(copia);  
    res.render('condicionada/index',{title:'Lista Navios', naviosData:result, requiData:copia});
   });
   });


router.post('/',validateCondi, isLoggedIn,catchAsync(async(req,res) => {
    const cookie = req.cookies.Agencia;
    const caminho = req.body.condi;
    const condicionada = `INSERT INTO condicionado (ID_NavioMain,ID_NavioSub,Data,Viagem,Servico,Berco,Posicao_Berco,OBS,Fatu,ID_Agencia) VALUES ("${caminho.ID_NavioMain}","${caminho.ID_NavioSub}","${caminho.Data}", "${caminho.Viagem}","${caminho.Servico}","${caminho.Berco}", "${caminho.Posicao_Berco}", "${caminho.OBS}", "${caminho.Fatu}", "${req.user.ID_agencia}")`;
    con.query(condicionada,function(err,result,fields){
        if(err) throw(err);
        console.log(result);
        req.flash('Sucesso','Requisição Condicionada registrada com sucesso');
        res.redirect('/navios');
    })
}));

router.get('/edit/:id',isLoggedIn,(req,res) => {
    const cookie = req.cookies.ID;
    const requisicao = 'SELECT * FROM condicionado WHERE ID ='+mysql.escape(req.params.id);
    con.query(requisicao,function(err,result,fields){
        if(err) throw(err);
        if(result[0].ID_Agencia == cookie){
        NomeNavio(result,res);   
        //console.log(nameShip[0].Navio);
        //res.render('requisicoes/edit',{title:'Requisicao', requiData:result});
    }else{
        req.flash('error','Requisição não encontrada');
        res.redirect('/condicionada');
    }})
   })


router.get('/:id', isLoggedIn, catchAsync(async(req,res,next) => {
    const cookie = req.cookies.ID;
    const requisicao = 'SELECT * FROM condicionado WHERE ID = '+mysql.escape(req.params.id);
    con.query(requisicao,function(err,result,fields){
        if(err) throw (err);
        if(result[0].ID_Agencia == cookie){
        const navio = `SELECT * FROM navios WHERE ID = ${result[0].ID_NavioMain}`
        console.log(navio);
        console.log(result[0]);
        con.query(navio, function(err,rows,fields){
            const nome = rows[0].Navio;
            res.render('condicionada/show',{Navio:nome, requiData:result})
        })
      }else{
          req.flash('error','Requisição não encontrada');
          res.redirect('/condicionada');
      }})  
}));

   router.put('/:id', validateCondi,catchAsync(async(req,res, next) => {
    const caminho = req.body.condi;
    const dataCondi = converte(caminho.Data);
    const sql = `UPDATE condicionado SET ID_NavioMain="${caminho.ID_NavioMain}", ID_NavioSub="${caminho.ID_NavioSub}", Data="${dataCondi}", Viagem="${caminho.Viagem}", Servico="${caminho.Servico}", Berco="${caminho.Berco}", Posicao_Berco="${caminho.Posicao_Berco}", OBS="${caminho.OBS}", Fatu="${caminho.Fatu}", ID_Agencia="${req.user.ID_agencia}" WHERE ID = ${caminho.ID}`;
    console.log(sql);
    con.query(sql,function(err,result,fields){
        if(err) throw(err);
        console.log(result);
        req.flash('Sucesso','Requisição Condicionada Atualizada com sucesso!');
        res.redirect('/navios');
    })

   }))

   router.post('/new',catchAsync(async(req,res,next) => {
    const caminho = req.body.condi;
    console.log(caminho);
    const Requi = `SELECT * from navios where ID = ${caminho.navioID} order by Navio`;
    con.query(Requi,function(err,result,fields){
         if(err) throw(err);
    
        listaNavios(result,res);
         // res.render('condicionada/new',{title:'Lista Navios', condiData:result});
    })
}));

router.delete('/:id',catchAsync(async(req,res,next) => {
    const cookie = req.cookies.Agencia;
    const sql = `DELETE FROM condicionado WHERE ID = `+mysql.escape(req.params.id);
    con.query(sql,function(err,result){
        if(err) throw(err)
        console.log('Number of records deleted:'+result.affectedRows);
        req.flash('Sucesso','Requisição Condicionada Cancelada!')
        res.redirect('/requisicoes');
    })
}))

   module.exports = router;