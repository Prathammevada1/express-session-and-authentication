const express=require('express');
const app=express();
const bcrypt=require('bcrypt');
const crypto=require('crypto');
const pool=require('./connection');
const session_secret="1234";
const cookie_parser=require('cookie-parser');

app.use(express.json());
app.use(cookie_parser());
app.use(express.urlencoded({ extended: true }));
app.post('/signup',async (req,res)=>{
  const email=req.body.email;
  const password=req.body.password;

  const hash_p=await bcrypting(password);

  const query="insert into users(email,password) values ($1,$2) returning *";
  const result=await pool.query(query,[email,hash_p]);

  await sessionMaking(req,res);
  res.json({"msg":"You are signed in"});
  
})

async function sessionMaking(req,res){
  const query1="insert into sessions(session_id,created_at,expires_at) values ($1,$2,$3) returning *";
  const session_id=crypto.randomBytes(32).toString("hex");
  await pool.query(query1,[session_id,new Date(Date.now()),new Date(Date.now()+1000*60*5)]);
  makingCookie(res,session_id);
}

function signSession(sessionId){
  return crypto.createHmac('sha256',session_secret).update(sessionId).digest('hex');
}


function makingCookie(res,sessionId){
  const value= signSession(sessionId);
  const oneHour=1000*60*5;
  try{
    res.cookie("session",`${value}.${sessionId}`,{
      maxAge:oneHour,
      secure:false
    })
  }catch(err){
    console.log("Error signing/logging in"+err);
  }
}


async function login(req,res){
  const {email,password}=req.body;
  const query="select * from users where email=$1";
  const result=await pool.query(query,[email]);
  if(result.rows.length===0){
    return res.send("alert('Incorrect email')")
  }
  const pass=result.rows[0];
  const isValid=await bcrypt.compare(password,pass.password);
  if(!isValid){
    return res.json({msg:"Enter correct details"});
  }

  await sessionMaking(req,res);
  res.json({msg:"thanks for logging"});
}

app.get('/',(req,res)=>{
  res.send(`<a href="http://localhost:3000/login">Login</a>`)
})
app.get('/login',(req,res)=>{
  res.send(`<form method="post" action="/login">
    Email:<input type="email" name="email">
    Password:<input type="password" name="password">
    <button type="submit">Submit</button>
    </form>`)
})

app.post('/login',login);


async function isAuthenticated(req,res,next){

  if(!req.cookies.session)
  return res.send("<h1>Login first</h1>");

  const id=req.cookies.session;
  const sessionId=verifySession(id);
  if(!sessionId){
    return res.send("Login first")
  }
  const query='select * from sessions where session_id=$1';
  const result=await pool.query(query,[sessionId]);

  if(!result.rows.length)
    return res.send("Invalid SessionId");

  next();
}

function verifySession(signedValue){
  const [hash, sessionId] = signedValue.split('.');
  const expectedHash = signSession(sessionId);
  return crypto.timingSafeEqual(Buffer.from(hash),Buffer.from(expectedHash)) ? sessionId : null;

}

app.get('/protected',isAuthenticated,(req,res)=>{
  return res.send("<h2>Hi you are logged in</h2>")
});

async function bcrypting(password){
  const saltRounds=12;
  return await bcrypt.hash(password,saltRounds);
}
setInterval(async()=>{
  await pool.query("delete from sessions where expires_at<now()");
},1000*60*5);

app.listen(3000);