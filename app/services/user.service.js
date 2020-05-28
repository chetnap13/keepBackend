var crypto = require('crypto');
var nodemailer = require('nodemailer');
var User = require('../models/user.model')
var bcrypt = require('bcrypt-nodejs')
var Token = require('../models/token.model')
var eventEmitter = require('../../events/event')
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
         token.save( function(err){
            if(err)
            {
                return res.status(500).send({
                    message:err.message
                })
            }
            else{
                let subject = 'account verification token'
                text=token.token
                eventEmitter.emit('sendEmail',subject,user,text)

            }
        })
        console.log(userResponse.name)
        res.send({
            
            status:userResponse.name+' registered'
        })
    })

}