const { string } = require('joi');
const BaseJoi = require('joi');
const sanitizeHtml = require('sanitize-html');


const extension = (joi) => ({
    type: 'string',
    base: joi.string(),
    messages: {
        'string.escapeHTML': '{{#label}} must not include HTML'
    },
    rules: {
        escapeHTML: {
        validate(value,helpers) {
            const clean = sanitizeHtml(value, {
                allowedTags: [],
                allowedAttributes: {},
            });
            if(clean !== value) return helpers.error('string.escapeHTML', { value })
            return clean;
          }
        }
    }
});

const Joi = BaseJoi.extend(extension);

module.exports.navioSchema = Joi.object({
    navio: Joi.object({
        Navio: Joi.string().required().escapeHTML(),
        Bandeira: Joi.string().required().escapeHTML(),
        Viagem: Joi.number().required().min(1),
        Carga: Joi.string().required().escapeHTML(),
        Berco: Joi.number().required().min(1).max(3),
        ETA: Joi.date().required(),
        ETA_time: Joi.string().required().escapeHTML(),
        ETB: Joi.date().required(),
        ETB_time: Joi.string().required().escapeHTML(),
        ETS: Joi.date().required(),
        ETS_time: Joi.string().required().escapeHTML(),
        C_proa: Joi.number().required().min(0),
        C_popa: Joi.number().required().min(0), 
        CS_proa: Joi.number().min(0),
        CS_popa: Joi.number().min(0),
        situation: Joi.string().required().escapeHTML(),
        Armador: Joi.string().optional().escapeHTML(),
        IMO: Joi.string().escapeHTML(),
        DWT: Joi.number().min(0),
        GRT: Joi.number().min(0),
        LOA: Joi.number().min(0)
    }).required()
});


module.exports.requiSchema = Joi.object({
    requi: Joi.object({
        ID: Joi.number(),
        ID_Navio : Joi.number().required(),
        Data_requi: Joi.date().required(),
        Hora_requi: Joi.string().required().escapeHTML(),
        Fatu_requi: Joi.string().optional().escapeHTML(),
        Obs_requi: Joi.string().optional().escapeHTML(),
        Requi_servico: Joi.string().required().escapeHTML(),
        berco_requi: Joi.number().required(),
        posicao_requi: Joi.string().optional().escapeHTML(),
        viagem: Joi.number().required()
    })
})

module.exports.condicionadaSchema = Joi.object({
    condi: Joi.object({
        ID: Joi.number(),
        ID_NavioMain : Joi.number().required(),
        ID_NavioSub : Joi.number().required(),
        Data: Joi.date().required(),
        Fatu: Joi.string().optional().escapeHTML(),
        OBS: Joi.string().optional().escapeHTML(),
        Servico: Joi.string().required().escapeHTML(),
        Berco: Joi.number().required(),
        Posicao_Berco: Joi.string().optional().escapeHTML(),
        Viagem: Joi.number().required()
    })
})