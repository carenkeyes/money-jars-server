module.exports.disableWithToken = (req, res, next) => {
    if (req.headers.Authorization || req.headers.authorization){
        return res.status(400).json({
            generalMessage: 'Auth Problem',
            messages: ['I have no idea what this means but something about route access']
        });
    }
    return next();
}