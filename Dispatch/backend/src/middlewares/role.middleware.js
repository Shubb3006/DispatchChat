export const authorize = (...allowedRoles) => {
    

    return (req,res,next)=>{
        console.log(req.user)

        if(!req.user){
            return res.status(401).json({
                message:"Not authenticated"
            });
        }

        if(!allowedRoles.includes(req.user.role)){
            console.log("ACESS denied")
            return res.status(403).json({
                message:"Access denied"
            });
        }


        next();

    }

};