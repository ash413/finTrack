const { admin } = require('../config/firebase')

const verifyToken = async (req, res, next) => {
    try {
        //get toklen from auth header
        const token = req.headers.authorization?.split('Bearer ')[1]

        if (!token) {
            return res.status(401).json({
                message: 'no authentication token provided!'
            })
        }

        //verify token
        const decodeToken = await admin.auth().verifyIdToken(token);

        req.user = decodeToken;

        next();

    } catch (error) {
        console.error('error verifying token: ', error)
        return res.status(403).json({
            message: 'unauthorized!'
        })
    }
}

module.exports = {
    verifyToken
}