# Guide to SISPRATI


This is a port of the SISPRATI system originally created utilizing Delphi.

## Instructions

If you would like to download the code and try it for yourself:

1. Clone the repo: `git clone git@github.com:Maxohl/sisprati.git`
1. Install packages: `npm install`
1. Edit the database configuration: `config/database.js`
1. Create the database schema: `node scripts/create_database.js`
2. Add e-mails to utils/emails.js
3. Launch: `node app.js`
5. Visit in your browser at: `http://localhost:8080`


Because of how registering works for this kind of system, a Register User route was removed but the code is still there as well as the View Page.

Licence: 1
