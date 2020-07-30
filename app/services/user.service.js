var crypto = require('crypto');
var nodemailer = require('nodemailer');
var User = require('../models/user.model')
var bcrypt = require('bcrypt-nodejs')
var Token = require('../models/token.model')
var eventEmitter = require('../../events/event')
var jwt = require('jsonwebtoken')


exports.signUp=async function(req,res){
    var userExist = await User.findOne({
        email:req.body.email
    })
    if(userExist){
        res.send({
            message:'user already exist'
        })
    }
    let user = new User({
        name:req.body.name,
        email:req.body.email,
        password:req.body.password

    })

    await bcrypt.hash(req.body.password,bcrypt.genSaltSync(10),null,async function(err,hash){
        if(err)
        {
            throw err
        }
        else{
            user.password=hash
        }

        let userResponse=await User.create(user)
        var token=await new Token({
            _userId:userResponse._id,
            token:crypto.randomBytes(16).toString('hex')
        })
         await token.save( function(err){
            if(err)
            {
                return res.status(500).send({
                    message:err.message
                })
            }
            else{
                let subject = 'account verification token'
                text=token.token
                eventEmitter.emit('sendEmail',subject, userResponse,text)

            }
        })
        console.log(userResponse.name)
        res.send({
            
            status:userResponse.name+' registered'
        })
    })

}

exports.generateVerificationToken = async function(req,res){
    var userExt = await User.findOne({
        email: req.body.email
    })
    if(userExist){
        tokenCreation(userExist)
    }
    else{
        return res.status(401).send({
            message:'Invalid email address'
        })
    }
}
exports.confirmAccount =async function(req,res){
    var tokenData=await Token.findOne({token:req.params.token})
if(!tokenData){
    return res.send({
        message:'invalid token Passed'

    })
}
var userData = await User.findOne({
    _id:tokenData._userId
})
 
if(!userData){
    return res.status(401).send({
        massage:'user does nt exist,may be account is deleted'

    })
}
if(userData.isVerified){
    return res.send({
        message:'user is already verified'

    })
}

userData.isVerified = true
 userData.save(function(err){
     if(err){
         return res.status(500).send({
             message:err.message
         })
     }
     else{
         return res.status(200).send('account is verified')
     }
 })
 if(status){
     res.send({
         message:'account verified successfully'

     })
 }
}

exports.login=async function(req,res){
    try {
       var userExist = await User.findOne({
           email:req.body.email
       }) 

       if(userExist){
           if(bcrypt.compareSync(req.body.password,userExist.password)){
               if(!userExist.isVerified){
                   return res.status(400).send({
                       message:'user is not verified'
                   })
               }
               const payload = {
                   _id:userExist._id,
                   email:userExist.email,
                   name:userExist.name
               }

               let token = jwt.sign(payload,process.env.SECRET_KEY,{
                   expiresIn:1440
               })

               res.send(token)
           }
           else{
               return res.send(401).send({
                   message:'wrong password,please check'
               })
           }

       }
       else{
           return res.status(401).send({
               message:'Invalid user email address please check'
           })
       }
    } catch (err) {
        throw err
    }
}

exports.forgetPassword = async function(req,res){
    /**
     * Getting user details by using email
     */
    var userExist = await User.findOne({
        email: req.body.email        
    })
    /**
     * Checks whether user exists or not
     */
    if(userExist){
         tokenCreation(userExist);
        res.send({
            status: userExist.email+' token is send'
        })
    }   
    else{
        return res.status(401).send({
            message:'User does not exists, may be account is deleted'
        })
    }           
}
exports.updatePassword = async function(req,res){
    var tokenData = await Token.findOne({
        token:req.params.token
    })
    if(!tokenData){
        return res.send({
            message:'invalid token pass'
        })
    }
    var userData =await User.findOne({
        _id:tokenData._userId
    })
    console.log(userData)
    await bcrypt.hash(req.body.password,bcrypt.genSaltSync(10),null,function(err,hash){
        if(err)
        {
            throw err
        }
        else{
            userData.password=hash
        }
    
    })
    userData.save(function(err){
        if(err){
            return res.status(500).send({
                message:'something went wrong'
            })
        }
        return res.status(200).send({
            message:'password has reset successfully'
        })

    }
        )
   
}


function tokenCreation(registeredUser){
    return new Promise(async function(resolve,reject){
       try{
           var token = await new Token({
               _userId :registeredUser._id,
               token: crypto.randomBytes(16).toString('hex')
           })
           console.log(token)
            await token.save(function(err){
               if(err){
                   return res.status(500).send({
                       message:err.message
                   })
                   //reject(err.message) 
                                         
               }
               else{
                   let subject = 'account verification token'
                   let text = token.token
                   eventEmitter.emit('sendEmail',subject,registeredUser,text)                    
               }
           })
       }
       catch(error){
           reject(error)
        }
    })
}