const express = require('express');
const router = express.Router();

const User = require('./../models/User');

const UserVerication = require('./../models/UserVerification')


const nodemailer = require("nodemailer");

const {v4: uuidv4} =require("uuid");

require("dotenv").config()

const bcrypt =  require('bcrypt');

const path = require("path");
const { error } = require('console');

let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASS
    }
});

transporter.verify((error, success) =>{
    if(error){
        console.log(error);
    } else {
        console.log("Ready for message");
        console.log(success);
    }
});

router.post('/signup', (req,res) => {
    let {username,name, email, password, phone} = req.body;
    username = username.trim();
    email = email.trim();
    password = password.trim();

    if (username == "" || email == "" || password == ""){
        res.json({
            status: "FAILED",
            message: "Campos Vacios"
        });
    }else if(!/^[a-zA-Z ]*$/.test(name)){
        res.json({
            status: "FAILED",
            message: "Nombre de usuario Invalido"
        });
    }else if(!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)){
        res.json({
            status: "FAILED",
            message: "Nombre Invalido"
        });
    } else if(password.length < 8){
        res.json({
            status: "FAILED",
            message: "Contraseña Invalida"
        });
    }else{
        User.find({email}).then(result =>{
            if(result.length){
                res.json({
                    status: "FAILED",
                    message: "Usuario Existente"
                });
            }else{
                const saltRounds = 10;
                bcrypt.hash(password, saltRounds).then(hashedPassword => {
                    const newUser = new User({ 
                        username,
                        name,
                        email,
                        phone,
                        password: hashedPassword,
                        verified: false,
                        
                    });

                    newUser.save().then(result => {
                        sendVerificationEmail(result,res);
                    })
                    .catch(err => {
                        res.json({
                            status: "FAILED",
                            message: "Error en el guardado"
                        });
                    });
                })
                .catch(err => {
                    res.json({
                        status: "FAILED",
                        message: "user exist"
                    });
                });
            }
        }).catch(err => {
            console.log(err);
            res.json({
                status: "FAILED",
                message: "error"
            });
        });
    }
});

const sendVerificationEmail = ({_id, email}, res) =>{
    const currentUrl = "http://localhost:5000/";
    const uniqueString = uuidv4()+_id;

    const mailOptions = {
        from: process.env.AUTH_EMAIL,
        to: email,
        subject: "verify your Email",
        html: `<p>Verify your email address to comple the signUp and login into your account.</p><p>This link
        <b>expires in 6 hours.</b></p><p>Press <a href=${
            currentUrl + "user/verify/" + _id + uniqueString
        }>Here</a> to proceed.</p>`
    };

    const saltRounds = 10;
    bcrypt
        .hash(uniqueString,saltRounds)
        .then((hashedUniqueString) =>{
            const newVerification = new UserVerication({
                userId: _id,
                uniqueString: hashedUniqueString,
                createAt: Date.now(),
                expireAt: Date.now() + 21600000,
            });
            
            newVerification
            .save()
            .then(() =>{
                transporter
                .sendMail(mailOptions)
                .then(() => {
                    res.json({
                        status: "PENDING",
                        message: "Verification email sent"
                    }); 
                })
                .catch((error) =>{
                    console.log(error);
                    res.json({
                        status: "FAILED",
                        message: "Verification email failed!"
                    });  
                });
            })
            .catch(error => {
                console.log(error);
                res.json({
                    status: "FAILED",
                    message: "could not save verification email data!"
                }); 
            });
        })
        .catch(() =>{
            res.json({
                status: "FAILED",
                message: "Error ocurrido email data!"
            });
        })
};


router.get("/verify/:userId/:uniqueString",(req, res) => {
    let{userId,uniqueString} = req.params;

    UserVerication
    .find({userId})
    .then((result) => {
        if(result.length > 0){
            const {expireAt} = result[0];

            const hashedUniqueString = result[0].uniqueString;

            if(expireAt < Date.now()){
                UserVerication
                .deleteOne({userId})
                .then(() => {
                    User
                    .deleteOne({_id: userId})
                    .then(() =>{
                        let message = "link has expired";
                        res.redirect(`/user/verified/error=true&message=${message}`); 
                    })
                    .catch(error => {
                        let message = "clearing user with expired unique string failed";
                        res.redirect(`/user/verified/error=true&message=${message}`); 
                    })
                })
                .catch((error) => {
                    console.log(error);
                    let message = "error limpiado verificacion del usuario expirada";
                    res.redirect(`/user/verified/error=true&message=${message}`);
                })
            }else{
               bcrypt
               .compare(uniqueString, hashedUniqueString)
               .then(result => {
                    if(result){
                        User
                        .updateOne({_id: userId}, {verified: true})
                        .then(() => {
                            UserVerication
                            .deleteOne({userId})
                            .then(() => {
                              res.sendFile(path.join(__dirname, "./../views/verified.html")); 
                            })
                            .catch(error => {
                                console.log(error);
                                let message = "An error occurred while finalizing sucessful verification";
                                res.redirect(`/user/verified/error=true&message=${message}`);
                            })
                        })
                        .catch(error => {
                            console.log(error);
                            let message = "An error occurred while updating user record to show verified";
                            res.redirect(`/user/verified/error=true&message=${message}`);
                        })
                    }else{
                        let message = "Invalid verification details passed check your inbox";
                        res.redirect(`/user/verified/error=true&message=${message}`);  
                    }
               })
               .catch(error => {
                let message = "An error occurred while comparing unique strings";
                    res.redirect(`/user/verified/error=true&message=${message}`);
               })
            }
        }else{
            let message = "La cuenta no existe por favor registrese";
            res.redirect(`/user/verified/error=true&message=${message}`); 
        }
    })
    .catch((error) => {
        console.log(error);
        let message = "error check existencia de usuario verificado";
        res.redirect(`/user/verified/error=true&message=${message}`);
    })
});

router.get("/verified", (req, res) => {
    res.sendFile(path.join(__dirname, "./../views/verified.html"));
})

router.post('/signin' , (req,res) =>{
    let {email, password} = req.body;
    email = email.trim();
    password = password.trim();

    if (email == "" || password == ""){
        res.json({
            status: "FAILED",
            message: "Credenciales vacias"
        })
    }else{
        User.find({email})
        .then(data =>{
            if(data.length){

               if(!data[0].verified){
                res.json({
                    status: "FAILED",
                    message: "Email has not been verified yet. check your inbox"
                });
               } else {
                const hashedPassword = data[0].password;
                bcrypt.compare(password,hashedPassword).then(result =>{
                    if(result){
                        res.json({
                            status: "SUCCESS",
                            message: "signin successful",
                            data: data
                        })
                    }else{
                        res.json({
                            status: "FAILED",
                            message: "Contraseña Ingresada Invalida"
                        });
                    }
                })
                .catch((err) =>{
                    res.json({
                        status: "FAILED",
                    message: "Error en la comparacion de contraseña"
                    })
                });
               }
                
            }else{
                res.json({
                    status: "FAILED",
                    message: "Credenciales Invalidas"
                })
            }
        })
        .catch((err) => {
            res.json({
                status: "FAILED",
                message: "Error courrido en el check de existencia de usuario"
            })
        })
    }
})

module.exports = router;