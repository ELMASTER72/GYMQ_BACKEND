const express = require('express');
const router = express.Router();

const User = require('./../models/User');

const bcrypt =  require('bcrypt');

router.post('/signup', (req,res) => {
    let {username, email, password, dateOfBirth, phone} = req.body;
    username = username.trim();
    email = email.trim();
    password = password.trim();
    dateOfBirth = dateOfBirth.trim();
    phone = phone.trim();

    if (username == "" || email == "" || password == "" || dateOfBirth == ""|| phone == ""){
        res.json({
            status: "FAILED",
            message: "Empty"
        });
    }else if(!/^[a-zA-Z ]*$/.test(username)){
        res.json({
            status: "FAILED",
            message: "Invalid username"
        })
    }else if(!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)){
        res.json({
            status: "FAILED",
            message: "Invalid name"
        })
    }else if(!new Date(dateOfBirth).getTime()){
        res.json({
            status: "FAILED",
            message: "Invalid nacimiento"
        })
    }else if(phone.length < 10){
        res.json({
            status: "FAILED",
            message: "Invalid phone"
        })
    } else if(password.length < 8){
        res.json({
            status: "FAILED",
            message: "Invalid password"
        })
    }else{
        User.find({email}).then(result =>{
            if(result.length){
                res.json({
                    status: "FAILED",
                    message: "exists"
                })
            }else{
                const saltRounds = 10;
                bcrypt.hash(password, saltRounds).then(hashedPassword => {
                    const newUser = new User({ 
                        username,
                        email,
                        phone,
                        password: hashedPassword,
                        dateOfBirth
                        
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
                            message: "ocurred save"
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

router.post('/' , (req,res) =>{

})

module.exports = router;