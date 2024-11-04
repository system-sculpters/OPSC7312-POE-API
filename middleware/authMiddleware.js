const { admin } = require('../config');
const jwt = require('jsonwebtoken')

const verifyToken = async (req, res, next) => {
    const token = req.headers.authorization?.split('Bearer ')[1]

    if(!token){
        return res.status(401).json({ error: 'Unauthorized: No token provided'});
    }

    try{
        jwt.verify(token, process.env.POLYGON_API_KEY, (err, decoded) => {
               
            // Add the decoded user info to the request object
            req.user = decoded;
            next();
        });
    } catch(error){
        console.error('Error verifying ID token:', error);
        return res.status(403).json({ message: "Invalid token" });
          
    }
}


const checkToken = async (req, res, next) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1]

    if(!idToken){
        return res.status(401).json({ error: 'Unauthorized: No token provided'});
    }

    try{
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedToken; 
        return res.status(200).json({ message: 'Token valid'});
    } catch(error){
        console.error('Error verifying ID token:', error);
        return res.status(401).json({ message: "Token expired" });  
    }
}

const verifyUser = (req, res, next) => {
    const { id } = req.params;

    if (req.user.uid !== id) {
        console.log(`${req.user.uid} = ${id}`)
        return res.status(403).json({ message: 'User does not match' });
    }

    next();
};

module.exports = { verifyToken, checkToken, verifyUser }