const jwt=require('jsonwebtoken');
const Organizer=require('../models/Organizers');

const requireOrganizerAuth=async(req,res,next)=>{
    // verify if user is authenticated
    const authorization=req.headers.authorization;
    if(!authorization){
        return res.status(401).json({error:'Unauthorized, authentication token missing'})
    }
    const token=authorization.split(' ')[1];
    try {
        const {_id}=jwt.verify(token,process.env.SECRET_JWT_KEY);
        req.Organizer=await Organizer.findOne({_id}).select('_id');
        next();
    } catch (error) {
        console.log(error);
        return res.status(401).json({error:'Unauthorized, invalid token'})
    }
}

module.exports=requireOrganizerAuth;