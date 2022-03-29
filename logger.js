function log(req, res, next){
    console.log('Logging...');
    next(); // Indica que se vaya a la siguiente función o ruta
}

module.exports = log;