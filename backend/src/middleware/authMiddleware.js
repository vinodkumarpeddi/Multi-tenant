const jwt = require('jsonwebtoken');
const apiResponse = require('../utils/apiResponse');
require('dotenv').config();

const protect = (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Add user info to request
            req.user = decoded;

            next();
        } catch (error) {
            console.error(error);
            return apiResponse(res, 401, false, 'Not authorized, token failed');
        }
    }

    if (!token) {
        return apiResponse(res, 401, false, 'Not authorized, no token');
    }
};

module.exports = { protect };
