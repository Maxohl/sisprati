const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const ExpressError = require('../utils/ExpressError');
const mysql = require('mysql');
const { requiSchema } = require('../schemas.js');
const isLoggedIn = require('../utils/isLogged');
const moment = require('moment');
const converte = require('../utils/convertDate');
const con = require('../utils/pool');
const listEmail = require('../utils/emails');
// const con = require('../utils/connection')
require('dotenv').config();

//constante para pegar informacios para o e-mail
const mailLetter = {

    Subject: '',
    Navio: '',
    Data: '',
    Servico:'',
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

//Email para requisicoes condicionadas
const mailCondi = {

    Subject: '',
    Navio: '',
    Data: '',
    Servico:'',
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

//Variaveis para copiar nome do navio, entre outros
let copia;
let nameShip;
let lista = [];


//Valida requisicoes
const validateRequi = (req,res,next) => {
    const { error } = requiSchema.validate(req.body);
    if(error){
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg,400)
    } else {
        next();
    }
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

//Envia e-mail
function sendMail(cookie){
const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)
let situacao;

if(mailLetter.Servico == 'DESATRACACAO' || mailLetter.Servico == 'DESATRACACAOF'){
    situacao = `<b>CALADO DE SAÍDA: </b>${mailLetter.Saida}<br>`;    
}else{
    situacao = `<b>CALADO DE ENTRADA: </b>${mailLetter.Entrada}<br>`;
}
//conteudo do e-mail
const msg = {    
  from: 'sisprati@hotmail.com', 
  to: listEmail,
  subject: `${mailLetter.Subject} ${mailLetter.Navio}`,
  text: 'Teste',
  html:
       `<h1><b>${cookie}</b></h1><br>
       <b>NAVIO:${mailLetter.Navio}</b><br>
       <b>DATA:</b> ${mailLetter.Data}<br>
       <b>SERVIÇO:</b> ${mailLetter.Servico}<br>
       <b>BERÇO:</b> ${mailLetter.Berco}<br>
       <b>POSIÇÃO:</b> ${mailLetter.Posicao}<br>
       <b>IMO:</b> ${mailLetter.IMO}<br>
       <b>BANDEIRA:</b> ${mailLetter.Bandeira}<br>
       <b>ARMADOR:</b> ${mailLetter.Armador}<br>
       <b>CARGA:</b> ${mailLetter.Carga}<br>
       <b>GROSS/TBR:</b> ${mailLetter.GRT}<br>
       <b>DWT:</b> ${mailLetter.DWT}<br>
       <b>LOA:</b> ${mailLetter.LOA}<br>
       ${situacao}
       <b>FATURAMENTO:</b> ${mailLetter.Faturamento}<br>
       <b>OBS/CONTATOS:</b> ${mailLetter.Obs}`
}

sgMail
  .sendMultiple(msg)
  .then(() => {
    console.log('Email enviado')
  })
  .catch((error) => {
    console.error(error)
  })
}

//Envia e-mail de requisicao condicionada
function sendCondi(cookie){
    const sgMail = require('@sendgrid/mail')
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    let situacao;
    if(mailCondi.Servico == 'DESATRACACAO' || mailCondi.Servico == 'DESATRACACAOF'){
        situacao = `<b>CALADO DE SAÍDA: </b>${mailCondi.Saida}<br>`;    
    }else{
        situacao = `<b>CALADO DE ENTRADA: </b>${mailCondi.Entrada}<br>`;
    }
    //conteudo do e-mail
    const msg = {
      to: listEmail, // Change to your recipient
      from: 'sisprati@hotmail.com', // Change to your verified sender
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

//Puxa todas as requisicoes da agencia do usuario atual
function allRequi(req){
    const searchQuery = `SELECT * FROM requisicoes WHERE ID_agencia = ${req.user.ID_agencia} order by ID desc`;
    con.query(searchQuery,function(err,rows,fields){
        if(err) throw(err);
        //console.log(rows);
     copia = rows.slice(0,5);
     
     return(rows.slice(0,5));
    })
}

//verifica se ha uma requisicao no mesmo horario que a requisicao sendo feita, ou dentro de uma hora apos e antes da hora escolhida
function loop(resultado,hrNovo){
    if(resultado != undefined){
    for(let i = 0; i < resultado.length; i++){
        var hrOld = resultado[i].Hora_requi;
        var ms = moment(hrNovo,"HH:mm:ss").diff(moment(hrOld,"HH:mm:ss"));
        console.log("ms:"+ms);
        var d = moment.duration(ms);
        console.log("d:"+d);
        var s = Math.floor(d.asHours()) + "h" + moment.utc(ms).format(" mm")+"m";
        console.log("s:"+s);          
        if(ms > -3600000 && ms < 3600000) {                    
            console.log('ja existe requisicao para essa data e hora')
            return false;
             // continuar = false;                                          
        }
    }
    }else{
        return false;
    }
}

//Pega nome do navio e preenche parte das informacoes para e-mail de requisicao
function NomeNavio(ID,res){
    const navio = `SELECT * FROM navios where ID = ${ID[0].ID_Navio}`
    con.query(navio,function(err,rows,fields){
        if(err) throw(err)
        nameShip = rows.slice(0,1);  
        mailLetter.Navio = rows[0].Navio;
        mailLetter.IMO = rows[0].IMO;
        mailLetter.Bandeira = rows[0].Bandeira;
        mailLetter.Armador = rows[0].armador;
        mailLetter.Carga = rows[0].Carga;
        mailLetter.GRT = rows[0].GRT;
        mailLetter.DWT = rows[0].DWT;
        mailLetter.LOA = rows[0].LOA;
        mailLetter.Entrada = 'FWD: '+rows[0].C_proa+'m  AFT: '+rows[0].C_popa+'m';
        mailLetter.Saida = 'FWD: '+rows[0].CS_proa+'m AFT: '+rows[0].CS_popa+'m';      
        //return(rows[0].Navio);
        
        Redirecionar(ID,res);
    })
}

function Redirecionar(result,res){
    console.log(result);
    res.render('requisicoes/edit',{title:'Requisicao', requiData:result, Ship:nameShip});
}

//verifica se existe navio condicionado para a requisicao atual e envia um e-mail da requisicao condicionada para 1 hora depois da
//requisicao atual
function checkCondi(caminho,cookie){
const dateCondi = converte(caminho.Data_requi);
let horaCondi = caminho.Hora_requi;
const minCondi = caminho.Hora_requi.slice(3,6);
let hora = parseInt(horaCondi.slice(0,2));
hora = hora + 1;
if(hora === 24){
    hora = '00';
}else{
    if(hora === 25){
        hora = '01';
    }
}
horaCondi = hora + ':'+minCondi;

const condicionada = `SELECT * FROM Condicionado WHERE ID_NavioSub = ${caminho.ID_Navio} AND Data = "${dateCondi}"`;
con.query(condicionada,function(err,result,fields){
    if(err) throw(err);
    console.log(condicionada);
    if(result.length != 0){
        const navio = `SELECT * FROM navios WHERE ID = ${result[0].ID_NavioMain}`;
        con.query(navio,function(err,rows,fields){
            if(err) throw(err);
            mailCondi.Subject = 'REQUISIÇÃO CONDICIONADA DE SERVIÇOS DE PRATICAGEM';
            mailCondi.Navio = rows[0].Navio;
            if(hora === '00' || hora === '01'){  //verifica se a requisicao condicionada passa para o proximo dia
                const novaData = new Date();
                mailCondi.Data = converte(novaData.setDate(novaData.getDate()+1)) + ' ' + horaCondi;
            }else{
            mailCondi.Data = converte(result[0].Data) + ' ' + horaCondi ;
            }
            mailCondi.Servico = result[0].Servico;
            mailCondi.Berco = result[0].Berco;
            mailCondi.Posicao = result[0].Posicao_Berco;
            mailCondi.IMO = rows[0].IMO;
            mailCondi.Bandeira = rows[0].Bandeira;
            mailCondi.Armador = rows[0].armador;
            mailCondi.Carga = rows[0].Carga;
            mailCondi.GRT = rows[0].GRT;
            mailCondi.DWT = rows[0].DWT;
            mailCondi.LOA = rows[0].LOA;
            mailCondi.Entrada = rows[0].C_proa;
            mailCondi.Saida = rows[0].C_popa;
            mailCondi.Faturamento = result[0].Fatu;
            mailCondi.Obs = result[0].OBS;
            
            sendCondi(cookie);
        })
    
    }
})
}

router.get('/', isLoggedIn,(req,res) => {
    allRequi(req);
    mailList(); 
    const navios = `SELECT * FROM navios where ID_agencia = ${req.user.ID_agencia}`;
    con.query(navios,function(err,result,fields){
        if(err){
            console.log(err);
        }
    // con.release;
    res.render('requisicoes/index',{title:'Lista Navios', naviosData:result, requiData:copia});
   });
   });

// router.post('/navios',async(req,res)=>{
//     console.log(req.body.navio.Navio)
//     res.send(req.body.navio)
// });


router.post('/', validateRequi,catchAsync(async(req,res, next) => {
    const cookie = req.cookies.Agencia;
    const caminho = req.body.requi;
    const dataRequi = converte(caminho.Data_requi);
    const promise = await new Promise(function(resolve,reject){
    con.getConnection(function(err) {
        const busca = `Select * from requisicoes WHERE Data_requi = "${dataRequi}"`;
        con.query(busca,function(err,result){    
            var hrNovo = caminho.Hora_requi+':00';     
             const requiLoop = loop(result,hrNovo);
             
            if(requiLoop == false){
                req.flash('error','Já existe requisição para esse horário');
                res.redirect('requisicoes');
            }else{
                con.getConnection(function(err) {
                    const sql = `INSERT INTO requisicoes (ID_Navio,Data_requi,Hora_requi,Fatu_requi,Obs_requi,Requi_servico,berco_requi,posicao_requi,viagem,ID_Agencia) VALUES ("${caminho.ID_Navio}", "${caminho.Data_requi}","${caminho.Hora_requi}","${caminho.Fatu_requi}","${caminho.Obs_requi}","${caminho.Requi_servico}","${caminho.berco_requi}" ,"${caminho.posicao_requi}","${caminho.viagem}","${req.user.ID_agencia}")`;
                    con.query(sql,function(err,rows){
                        if(err)throw err; 
                        mailLetter.Subject = 'REQUISIÇÃO DE SERVIÇOS DE PRATICAGEM ';
                        mailLetter.Data = dataRequi + ' ' +caminho.Hora_requi;
                        mailLetter.Berco = caminho.berco_requi;  
                        mailLetter.Servico = caminho.Requi_servico; 
                        mailLetter.Posicao = caminho.posicao_requi; 
                        mailLetter.Faturamento = caminho.Fatu_requi;    
                        mailLetter.Obs = caminho.Obs_requi; 
                            
                        sendMail(cookie,mailLetter);                        
                        checkCondi(caminho,cookie);
                      })
                     req.flash('Sucesso','Requisicao registrada com sucesso!');                     
                     res.redirect('/navios');
                    });
            }
        })
    }) 
    
});
}));


router.post('/new',catchAsync(async(req,res,next) => {
    const caminho = req.body.requi;
    const Requi = `SELECT * from navios where ID = ${caminho.nomeNavio}`;
    con.query(Requi,function(err,result,fields){
         if(err) throw(err);
    console.log(result);
    mailLetter.Navio = result[0].Navio;
    mailLetter.IMO = result[0].IMO;
    mailLetter.Bandeira = result[0].Bandeira;
    mailLetter.Armador = result[0].armador;
    mailLetter.Carga = result[0].Carga;
    mailLetter.GRT = result[0].GRT;
    mailLetter.DWT = result[0].DWT;
    mailLetter.LOA = result[0].LOA;
    mailLetter.Entrada = 'FWD: '+result[0].C_proa+'m  AFT: '+result[0].C_popa+'m';
    mailLetter.Saida = 'FWD: '+result[0].CS_proa+'m AFT: '+result[0].CS_popa+'m';
    
    res.render('requisicoes/new',{title:'Lista Navios', requiData:result});
    })
}));


router.get('/edit/:id',isLoggedIn,(req,res) => {
 const requisicao = 'SELECT * FROM requisicoes WHERE ID ='+mysql.escape(req.params.id);
 const cookie = req.cookies.ID;
 con.query(requisicao,function(err,result,fields){
     if(err) throw(err);
     console.log(result[0].ID_Agencia);
     console.log(cookie);
     
     if(result[0].ID_Agencia == cookie){
     NomeNavio(result,res) 
     }else{
         req.flash('error','Requisição não existe!')
         res.redirect('/requisicoes');
     }
     //console.log(nameShip[0].Navio);
     //res.render('requisicoes/edit',{title:'Requisicao', requiData:result});
 })
})

router.get('/:id', isLoggedIn, catchAsync(async(req,res,next) => {
 const requisicao = 'SELECT * FROM requisicoes WHERE ID = '+mysql.escape(req.params.id);
 const cookie = req.cookies.ID;
 con.query(requisicao,function(err,result,fields){
     if(err) throw (err);
     if(result[0].ID_Agencia == cookie){     
     mailLetter.Data = converte(result[0].Data_requi) + ' ' +result[0].Hora_requi;
     mailLetter.Berco = result[0].berco_requi;  
     mailLetter.Servico = result[0].Requi_servico; 
     mailLetter.Posicao = result[0].posicao_requi; 
     mailLetter.Faturamento = result[0].Fatu_requi;    
     mailLetter.Obs = result[0].Obs_requi; 
     
     
     const navio = `SELECT * FROM navios WHERE ID = ${result[0].ID_Navio}`
     con.query(navio, function(err,rows,fields){
         const nome = rows[0].Navio;
         mailLetter.Navio = rows[0].Navio;
         mailLetter.IMO = rows[0].IMO;
         mailLetter.Bandeira = rows[0].Bandeira;
         mailLetter.Armador = rows[0].armador;
         mailLetter.Carga = rows[0].Carga;
         mailLetter.GRT = rows[0].GRT;
         mailLetter.DWT = rows[0].DWT;
         mailLetter.LOA = rows[0].LOA;
         mailLetter.Entrada = 'FWD: '+rows[0].C_proa+'m  AFT: '+rows[0].C_popa+'m';
         mailLetter.Saida = 'FWD: '+rows[0].CS_proa+'m AFT: '+rows[0].CS_popa+'m';
         
         res.render('requisicoes/show',{Navio:nome, requiData:result});   
     })
 }else{
     req.flash('error','Requisição não existe!');
     res.redirect('/requisicoes');
 }})  
}));



router.put('/:id', validateRequi,catchAsync(async(req,res, next) => {
    const cookie = req.cookies.Agencia;
    const caminho = req.body.requi;
    const dataRequi = converte(caminho.Data_requi);
    const promise = await new Promise(function(resolve,reject){
    con.getConnection(function(err) {
        const busca = `Select * from requisicoes WHERE Data_requi = "${dataRequi}" and ID <> ${caminho.ID}`;
        console.log(busca);
        con.query(busca,function(err,result){    
            var hrNovo = caminho.Hora_requi+':00';      
             console.log('before loop '+result);        
             const requiLoop = loop(result,hrNovo);
             
            if(requiLoop == false){
                req.flash('error','Já existe requisição para esse horário');
                res.redirect('/requisicoes');
            }else{
                con.getConnection(function(err) {
                    const sql = `UPDATE requisicoes SET ID_Navio="${caminho.ID_Navio}", Data_requi="${caminho.Data_requi}", Hora_requi="${caminho.Hora_requi}", Fatu_requi="${caminho.Fatu_requi}", Obs_requi="${caminho.Obs_requi}", Requi_servico="${caminho.Requi_servico}", berco_requi="${caminho.berco_requi}", posicao_requi="${caminho.posicao_requi}", viagem="${caminho.viagem}", ID_Agencia="${req.user.ID_agencia}" WHERE ID = ${caminho.ID}`;
                    con.query(sql,function(err,rows){
                        if(err)throw err;
                        mailLetter.Subject = 'ATUALIZAÇÃO DE REQUISIÇÃO DE SERVIÇOS DE PRATICAGEM' 
                        mailLetter.Data = dataRequi + ' ' +caminho.Hora_requi;
                        mailLetter.Berco = caminho.berco_requi;  
                        mailLetter.Servico = caminho.Requi_servico; 
                        mailLetter.Posicao = caminho.posicao_requi; 
                        mailLetter.Faturamento = caminho.Fatu_requi;    
                        mailLetter.Obs = caminho.Obs_requi; 
                       
                               
                        sendMail(cookie,mailLetter);
                      })
                     req.flash('Sucesso','Requisição Atualizada com sucesso!');
                     res.redirect('/requisicoes');
                    });
            }
        })
    }) 
    
});
}));

router.delete('/:id',catchAsync(async(req,res,next) => {
    const cookie = req.cookies.Agencia;
    const sql = `DELETE FROM requisicoes WHERE ID = `+mysql.escape(req.params.id);
    con.query(sql,function(err,result){
        if(err) throw(err)
        mailLetter.Subject = 'CANCELAMENTO DE REQUISIÇÃO DE SERVIÇOS DE PRATICAGEM' 
        sendMail(cookie,mailLetter);
        console.log('Number of records deleted:'+result.affectedRows);
        req.flash('Sucesso','Requisição Cancelada!')       
        res.redirect('/requisicoes');
    })
}))


module.exports = router;