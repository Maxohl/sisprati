// config/database.js
module.exports = {
    'connection': {
        'host': process.env.DB_HOST,
        'user': 'movimentacoes',
        'password': process.env.DB_PASSWORD
    },
	'database': 'movimentacoes',
    'users_table': 'ususarios'
};