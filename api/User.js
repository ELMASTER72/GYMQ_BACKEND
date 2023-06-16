const express = require('express');
const router = express.Router();

const User = require('./../models/User');

const bcrypt =  require('bcrypt');

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
        })
    }else if(!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)){
        res.json({
            status: "FAILED",
            message: "Nombre Invalido"
        })
    } else if(password.length < 8){
        res.json({
            status: "FAILED",
            message: "Contraseña Invalida"
        })
    }else{
        User.find({email}).then(result =>{
            if(result.length){
                res.json({
                    status: "FAILED",
                    message: "Usuario Existente"
                })
            }else{
                const saltRounds = 10;
                bcrypt.hash(password, saltRounds).then(hashedPassword => {
                    const newUser = new User({ 
                        username,
                        name,
                        email,
                        phone,
                        password: hashedPassword,
                        
                    });

                    newUser.save().then(result => {
                        res.json({
                            status: "SUCCESS",
                            message: "signup successful",
                            data:  result,
                        })
                    })
                    .catch(err => {
                        res.json({
                            status: "FAILED",
                            message: "Error en el guardado"
                        })
                    })
                })
                .catch(err => {
                    res.json({
                        status: "FAILED",
                        message: "user exist"
                    })
                })
            }
        }).catch(err => {
            console.log(err);
            res.json({
                status: "FAILED",
                message: "error"
            })
        })
    }
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
            if(data){
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
                        })
                    }
                })
                .catch(err =>{
                    res.json({
                        status: "FAILED",
                    message: "Error en la comparacion de contraseña"
                    })
                })
            }else{
                res.json({
                    status: "FAILED",
                    message: "Credenciales Invalidas"
                })
            }
        })
        .catch(err => {
            res.json({
                status: "FAILED",
                message: "Error courrido en el check de existencia de usuario"
            })
        })
    }
})

module.exports = router;