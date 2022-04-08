
##build a database

const Database = require('better-sqlite3');
const db = new Database('database.db', { verbose: console.log });
(function(){
	let stmt = db.prepare('CREATE TABLE IF NOT EXISTS "users" ("id" TEXT NOT NULL, "username" TEXT NOT NULL, "data" TEXT, PRIMARY KEY("id"));');
    stmt.run()
}());

##frontend

##login/registrationsystem
