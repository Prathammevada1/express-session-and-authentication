const pg=require('pg');
const {Pool}=pg;
const pool=new Pool({
  host:"localhost",
  user:"postgres",
  password:"Pratham",
  database:"learn_auth",
  port:5432
})

module.exports=pool;