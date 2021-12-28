const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const ExpressError = require('../utils/ExpressError');
const mysql = require('mysql');
const { condicionadaSchema } = require('../schemas.js');
const isLoggedIn = require('../utils/isLogged');
const converte = require('../utils/convertDate');
const con = require('../utils/pool');
const sgMail = require('@sendgrid/mail')
require('dotenv').config();

let copia;
let nameShip;
let lista = [];

//Email para requisicoes condicionadas
const mailCondi = {

    Subject: '',
    Navio: '',
    Data: '',
    Servico:'',
    Condicao:'',
    Berco: '',
    Posicao:'',
    IMO:'',
    Bandeira:'',
    Armador:'',
    Carga:'',
    GRT:'',
    DWT:'',
    LOA:'',
    Entrada: '',
    Saida: '',
    Faturamento: '',
    Obs : '',   
}

//Pega lista de e-mails para envio e adiciona eles para variavel lista
function mailList(){
    const query = 'SELECT email FROM emails';
    con.query(query,function(err,result,fields){ 
        for(let i = 0; i < result.length; i++){
           lista.push(result[i].email);
        }
    })
    }

//Envia e-mail de requisicao condicionada
function sendCondi(cookie){
    // const sgMail = require('@sendgrid/mail')
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    let situacao;
    if(mailCondi.Servico =='DESATRACACAO' || 'DESATRACACAOF'){
        situacao = `<b>CALADO DE SAÍDA: </b>${mailCondi.Saida}<br>`;    
    }else{
        situacao = `<b>CALADO DE ENTRADA: </b>${mailCondi.Entrada}<br>`;
    }
    //conteudo do e-mail
    const msg = {
       // Change to your recipient
      to: 'maxohl@hotmail.com;maxohl@gmail.com',
      from: 'sisprati@hotmail.com', // Change to your verified sender
    //   to: [lista],
      subject: `${mailCondi.Subject} ${mailCondi.Navio}`,
      text: 'Teste',
      html:
           `<h1><b>${cookie}</b></h1><br>
           <b>NAVIO:${mailCondi.Navio}</b><br>
           <b>DATA:</b> ${mailCondi.Data}<br>
           <b>SERVIÇO:</b> ${mailCondi.Servico}<br>
           <b>BERÇO:</b> ${mailCondi.Berco}<br>
           <b>POSIÇÃO:</b> ${mailCondi.Posicao}<br>
           <b>IMO:</b> ${mailCondi.IMO}<br>
           <b>BANDEIRA:</b> ${mailCondi.Bandeira}<br>
           <b>ARMADOR:</b> ${mailCondi.Armador}<br>
           <b>CARGA:</b> ${mailCondi.Carga}<br>
           <b>GROSS/TBR:</b> ${mailCondi.GRT}<br>
           <b>DWT:</b> ${mailCondi.DWT}<br>
           <b>LOA:</b> ${mailCondi.LOA}<br>
           ${situacao}
           <b>FATURAMENTO:</b> ${mailCondi.Faturamento}<br>
           <b>OBS/CONTATOS:</b> ${mailCondi.Obs}`
    }
    sgMail
      .sendMultiple(msg)
      .then(() => {
        console.log('Email sent')
      })
      .catch((error) => {
        console.error(error)
      })
    }    

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
    console.log('redirecionar');
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
        mailCondi.Navio = rows[0].Navio;
        mailCondi.IMO = rows[0].IMO;
        mailCondi.Bandeira = rows[0].Bandeira;
        mailCondi.Armador = rows[0].armador;
        mailCondi.Carga = rows[0].Carga;
        mailCondi.GRT = rows[0].GRT;
        mailCondi.DWT = rows[0].DWT;
        mailCondi.LOA = rows[0].LOA;
        mailCondi.Entrada = 'FWD: '+rows[0].C_proa+'m  AFT: '+rows[0].C_popa+'m';
        mailCondi.Saida = 'FWD: '+rows[0].CS_proa+'m AFT: '+rows[0].CS_popa+'m';    
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
    const searchQuery = `SELECT * FROM Condicionado WHERE ID_agencia = ${req.user.ID_agencia} order by ID desc`;
    con.query(searchQuery,function(err,rows,fields){
        if(err) throw(err);
        //console.log(rows);
     copia = rows.slice(0,5);
     return(rows.slice(0,5));
    })
}

router.get('/', isLoggedIn,(req,res) => {
    mailList();
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
    const condicionada = `INSERT INTO Condicionado (ID_NavioMain,ID_NavioSub,Data,Viagem,Servico,Berco,Posicao_Berco,OBS,Fatu,ID_Agencia) VALUES ("${caminho.ID_NavioMain}","${caminho.ID_NavioSub}","${caminho.Data}", "${caminho.Viagem}","${caminho.Servico}","${caminho.Berco}", "${caminho.Posicao_Berco}", "${caminho.OBS}", "${caminho.Fatu}", "${req.user.ID_agencia}")`;
    con.query(condicionada,function(err,result,fields){
        if(err) throw(err);
        console.log(result);
        mailCondi.Subject = 'REQUISIÇÃO DE SERVIÇOS DE PRATICAGEM ';
        mailCondi.Data = converte(caminho.Data) ;
        mailCondi.Berco = caminho.Berco;  
        mailCondi.Servico = caminho.Servico; 
        mailCondi.Posicao = caminho.Posicao_Berco; 
        mailCondi.Faturamento = caminho.Fatu;    
        mailCondi.Obs = caminho.OBS; 
        sendCondi(cookie,mailCondi);
        req.flash('Sucesso','Requisição Condicionada registrada com sucesso');
        res.redirect('/navios');
    })
}));

router.get('/edit/:id',isLoggedIn,(req,res) => {
    const cookie = req.cookies.ID;
    const requisicao = 'SELECT * FROM Condicionado WHERE ID ='+mysql.escape(req.params.id);
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
    const requisicao = 'SELECT * FROM Condicionado WHERE ID = '+mysql.escape(req.params.id);
    con.query(requisicao,function(err,result,fields){
        if(err) throw (err);
        if(result[0].ID_Agencia == cookie){
        const navio = `SELECT * FROM navios WHERE ID = ${result[0].ID_NavioMain}`
        console.log(navio);
        console.log(result[0]);
        mailCondi.Data = converte(result[0].Data);
        mailCondi.Berco = result[0].Berco;  
        mailCondi.Servico = result[0].Servico; 
        mailCondi.Posicao = result[0].Posicao_Berco; 
        mailCondi.Faturamento = result[0].Fatu;    
        mailCondi.Obs = result[0].OBS; 
        con.query(navio, function(err,rows,fields){
            const nome = rows[0].Navio;
            mailCondi.Navio = rows[0].Navio;
            mailCondi.IMO = rows[0].IMO;
            mailCondi.Bandeira = rows[0].Bandeira;
            mailCondi.Armador = rows[0].armador;
            mailCondi.Carga = rows[0].Carga;
            mailCondi.GRT = rows[0].GRT;
            mailCondi.DWT = rows[0].DWT;
            mailCondi.LOA = rows[0].LOA;
            mailCondi.Entrada = 'FWD: '+rows[0].C_proa+'m  AFT: '+rows[0].C_popa+'m';
            mailCondi.Saida = 'FWD: '+rows[0].CS_proa+'m AFT: '+rows[0].CS_popa+'m';
            res.render('condicionada/show',{Navio:nome, requiData:result})
        })
      }else{
          req.flash('error','Requisição não encontrada');
          res.redirect('/condicionada');
      }})  
}));

   router.put('/:id', validateCondi,catchAsync(async(req,res, next) => {
    const cookie = req.cookies.ID;
    const caminho = req.body.condi;
    const dataCondi = converte(caminho.Data);
    const sql = `UPDATE Condicionado SET ID_NavioMain="${caminho.ID_NavioMain}", ID_NavioSub="${caminho.ID_NavioSub}", Data="${dataCondi}", Viagem="${caminho.Viagem}", Servico="${caminho.Servico}", Berco="${caminho.Berco}", Posicao_Berco="${caminho.Posicao_Berco}", OBS="${caminho.OBS}", Fatu="${caminho.Fatu}", ID_Agencia="${req.user.ID_agencia}" WHERE ID = ${caminho.ID}`;
    console.log(sql);
    con.query(sql,function(err,result,fields){
        if(err) throw(err);
        mailCondi.Subject = 'ATUALIZAÇÃO DE REQUISIÇÃO CONDICIONADA DE SERVIÇOS DE PRATICAGEM' 
        mailCondi.Data = dataCondi;
        mailCondi.Berco = caminho.Berco;  
        mailCondi.Servico = caminho.Servico; 
        mailCondi.Posicao = caminho.Posicao_Berco; 
        mailCondi.Faturamento = caminho.Fatu;    
        mailCondi.Obs = caminho.OBS; 
                       
        sendCondi(cookie,mailCondi);
        req.flash('Sucesso','Requisição Condicionada Atualizada com sucesso!');
        res.redirect('/navios');
    })

   }))

   router.post('/new',catchAsync(async(req,res,next) => {
    const caminho = req.body.condi;
    const Requi = `SELECT * from navios where ID = ${caminho.navioID} order by Navio`;
    con.query(Requi,function(err,result,fields){
         if(err) throw(err);
         mailCondi.Navio = result[0].Navio;
         mailCondi.IMO = result[0].IMO;
         mailCondi.Bandeira = result[0].Bandeira;
         mailCondi.Armador = result[0].armador;
         mailCondi.Carga = result[0].Carga;
         mailCondi.GRT = result[0].GRT;
         mailCondi.DWT = result[0].DWT;
         mailCondi.LOA = result[0].LOA;
         mailCondi.Entrada = 'FWD: '+result[0].C_proa+'m  AFT: '+result[0].C_popa+'m';
         mailCondi.Saida = 'FWD: '+result[0].CS_proa+'m AFT: '+result[0].CS_popa+'m';
        listaNavios(result,res);
         // res.render('condicionada/new',{title:'Lista Navios', condiData:result});
    })
}));

router.delete('/:id',catchAsync(async(req,res,next) => {
    const cookie = req.cookies.Agencia;
    const sql = `DELETE FROM Condicionado WHERE ID = `+mysql.escape(req.params.id);
    con.query(sql,function(err,result){
        if(err) throw(err)
        console.log('Number of records deleted:'+result.affectedRows);
        mailCondi.Subject = 'CANCELAMENTO DE REQUISIÇÃO CONDICIONADA DE SERVIÇOS DE PRATICAGEM' 
        sendCondi(cookie,mailCondi);
        req.flash('Sucesso','Requisição Condicionada Cancelada!')
        res.redirect('/requisicoes');
    })
}))

   module.exports = router;