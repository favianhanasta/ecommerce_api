const {db, dbQuery} = require('../config/database');
const Crypto = require('crypto'); // untuk enkripsi password
const {hashPassword, createToken} = require('../config/encrip');
const { transporter } = require('../config/nodemailer');

module.exports={
    getData: (req,res,next)=>{
        db.query(`Select username,email,role,status from users;`, (err,results)=> {
            if(err){
                console.log(err)
                res.status(500).send(err);
            }
            res.status(200).send(results);
        })
    },
    register: async (req,res)=>{
        try{
            let {username,password,email} = req.body;
            let insertSQL=`insert into users (username,email,password) values (${db.escape(username)},${db.escape(email)},${db.escape(hashPassword(password))});`;
            let getSQL = `select * from users where email=${db.escape(email)};`
            let checkEmail = await dbQuery(getSQL);
            if(checkEmail.length>0){
                res.status(400).send({
                    message : 'email exist',
                    success : true,
                    error : ""
                });
            }else{
                let insertUser = await dbQuery(insertSQL);
                if(insertUser.insertId){
                    // get data user berdasarkan insertID
                    let getUser = await dbQuery(`select * from users where idusers = ${insertUser.insertId}`)
                    let {idusers,username,email,role,status} = getUser[0];
                    let token = createToken({idusers,username,email,role,status});
                    // mengirimkan email yang  berisi token untuk login
                    await transporter.sendMail({
                        from : 'Admin Commerce',
                        to:"rexeevo11@gmail.com",
                        subject : "confirm registration",
                        html : `<div>
                        <h3>Klik link dibawah ini untuk verifikasi akun anda</h3>
                        <a href='http://localhost:3000/verification/${token}'>Klik disini</a>
                        </div>`
                    })
                    res.status(200).send({
                        success: true,
                        message: "register success",
                        error  : ""
                    })
                }
            }
        }
        catch (error){
            console.log(error)
            res.status(500).send({
                success : false,
                message : 'failed'
            })
        }
    },
    login: (req,res)=>{
        let {email,password} = req.body;
        console.log(req.body);
        let loginSQL = `select * from users where email=${db.escape(email)} and password=${db.escape(hashPassword(password))};`;
        db.query(loginSQL,(err,results)=>{
            if(err){
                console.log(err)
                res.status(500).send({
                    success : false,
                    message:'failed',
                    error : err
                });
            }
            if(results.length > 0){
                let {idusers,username,email,role,status} = results[0];
                let token = createToken({idusers,username,email,role,status})
                res.status(200).send({
                    message: 'Login Success',
                    success : true,
                    dataLogin: { email,username,role,status,token },
                    error:""
                })
            }
            else{
                res.status(400).send({
                    message: 'Login Failed',
                    success : false,
                    dataLogin:{},
                    error:""
                })
            }
        })
    },
    keepLogin: (req,res)=>{
        console.log(req.dataUser)
        if(req.dataUser.idusers){
            let keepLoginSQL = `select * from users where idusers=${req.dataUser.idusers}`
            db.query(keepLoginSQL, (err,results)=>{
                if(err){
                    console.log(err)
                    res.status(500).send(err)
                }
                if(results.length>0){
                    let {idusers,username,email,password,role,status} = results[0]
                    let token = createToken({idusers,username,email,role,status});
                    res.status(200).send({
                        message : 'dapat data login',
                        success : true,
                        dataLogin : {idusers,username,email,role,status,token},
                        error:""
                    })  
                }else{
                    res.status(500).send({
                        success : false,
                        message : 'login failed'
                    })
                }
            })
        }
    },
    verify : (req,res)=>{
        console.log('token',req.dataUser)
        let verify = `select * from users where idusers=${req.dataUser.idusers}`;
        db.query(verify,(err,results)=>{
            if(err){
                console.log(err);
            }
            if(results.length>0){
                db.query(`UPDATE ecommerce.users SET status = "verified" WHERE idusers = ${req.dataUser.idusers};`,(err2,rslt)=>{
                    if(err2){
                        console.log(err2);
                    }
                    let {idusers,username,email,password,role,status}=results[0];
                    let token = createToken({idusers,username,email,password,role,status});
                    res.status(200).send({
                        success : 'true',
                        dataVerify : {idusers,username,email,password,role,status,token}
                    })
                })
            }else{
                res.status(500).send({
                    success : false,
                    message : 'login failed'
                })
            }
        })
    }
}