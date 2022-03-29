const inicioDebug = require('debug')('app:inicio');
const dbDebug = require('debug')('app:db');
const express = require('express'); // Importar express
const config = require('config');
const logger = require('./logger');
const morgan = require('morgan');
const Joi = require('joi') // Importa Joi
const app = express(); // Crea una instancia de express

/**
 * Middleware
 * El middleware es un bloque de codigo que se ejecuta
 * entre las peticiones del usuario (cliente) y el
 * request que llega al servidor. Es un enlace entre la peticion
 * del usuario y el servidor, antes de que este pueda dar una respuesta.
 * 
 * Las funciones del middleware son funciones que tienen accesso
 * al objeto de peticion (request, req), al objeto de respuesta (response, res)
 * y a la siguiente funcion de middleware en el ciclo de peticiones/respuestas
 * de la aplicacion. La siguiente funcion de middleware se denota
 * normalmente con una variable denominada next.
 * 
 * Las funciones de middleware pueden realizar las siguientes tareas:
 *      - Ejecutar cualquier codigo
 *      - realizar cambios en la peticion y los objetos de respuesta
 *      - Finalizar el ciclo de peticion/respuesta
 *      - Invocar la siguiente funcion de middleware en la pila
 * 
 * Express es un framework de direccionamiento y deuso de middleware
 * que permite que la aplicacion tenga funcionalidad minima propia.
 * 
 * Ya usamos algunos middleware como express.json()
 * transforma el body del req a formato JSON
 */

/**
 *           ------------------------
 * request -|-> json()  --> route() -|-> response
 *           ------------------------
 * 
 * route() --> Funciones GETm POST, PUT, DELETE
 */

/**
 * JSON hace un parsing de la entrada a formato JSON
 * De tal forma que lo que recibimos en el req de una
 * peticion este en formato JSON
 */
app.use(express.json()); // Se le dice a express que use este middleware
app.use(express.urlencoded({extended:true}));
app.use(express.static('public'));
// public es el nombre de la carpeta que tendra los recursos estaticos.
console.log(`Aplicacion: ${config.get('nombre')}`);
console.log(`DB server: ${config.get('configDB.host')}`);
/**
 * Configurar la variable de entorno para cambiar de modo:
 * LINUX:
 *      export NODE_ENV="production"
 *      export NODE_ENV="development"
 */

// Uso de middleware de tercero - morgan
if (app.get('env') == 'development'){
    app.use(morgan('tiny'));
    inicioDebug('Morgan esta habilitado');
}
// Operaciones con la base de datos
dbDebug('Conectado a la base de datos...');

//app.use(logger); // logger ya hace referencia a la funcion log (exports)
//app.use(function(req, res, next){
//    console.log('Autenticando...');
//    next();
//})

/**
 * Query String
 * url/?var2=valor1&va2=valor2&var3=valor3...
 */

/**
 * Hay cuatro tipos de peticiones
 * Asociadas con las operaciones CRUD de una base de datos
 * 
 * app.get(); // Consulta de datos
 * app.post(); // Enviar datos al servidor (insertar datos)
 * app.put(); // Actualizar datos
 * app.delete(); // Eliminar datos
 * 
 */

const usuarios = [
    {id: 1, nombre: 'Juan'},
    {id: 2, nombre: 'Ana'},
    {id: 3, nombre: 'Karen'},
    {id: 3, nombre: 'Luis'},
];

/**
 * Consulta en la ruta raiz de nuestro servidor
 * con una funcion callback
 */

app.get('/', (req, res) => {
    res.send('Hola mundo desde Express!');
});

app.get('/api/usuarios', (req, res) => {
    res.send(usuarios);
});

/**
 * Como pasar parametros dentro de las rutas
 * p. ej. solo quiero un usuario especifico en vez de todos
 * con los : antes del id Express sabe que es un parametro
 * a recibir
 */
// http://localhost:3000/api/usuarios/2022/03/sex='m'
app.get('/api/usuarios/:id', (req, res) => {
    // Devuelve el primer elemento del arreglo que cumpla con un predicado
    // parseInt hace el casteo a entero directamente
    let usuario = existeUsuario(req.params.id);
    if ( !usuario)
        res.status(404).send('El usuario no se encuentra'); // Devuelve el estado HTTP
    res.send(usuario);
    //res.send(req.query);
});

/**
 * Peticion PUT
 * Metodo para actualizar informacion
 * Recibe el id del usuario que se quiere modificar
 * Utilizando un parametro en la ruta :id
 */

app.put('/api/usuarios/:id', (req, res) =>{
    // Validar que el usuario se encuentre en los registros
    let usuario = existeUsuario(req.params.id);
    if (!usuario){
        res.status(404).send('El usuario no se encuentra'); // Devuelve el estado HTTP
        return;
    }
    // En el body del recuest debe venir la informacion para
    // hacer la actualizacion
    // Validar que el nombre cumpla con las condiciones
    
    const {value, error} = validarUsuario(req.body.nombre);
    if (error){
        const message = error.details[0].message;
        res.status(400).send(message);
        return;
    }
    // Actualiza el nombre del usuario
    usuario.nombre = value.nombre;
    res.send(usuario);

});

/**
 * Peticion DELETE
 * Metodo para eliminar informacion
 * Recibe el id del usuario que se quiere eliminar
 * Utilizando un parametro en la ruta :id
 */

app.delete('/api/usuarios/:id', (req, res) =>{
    const usuario = existeUsuario(req.params.id);
    if(!usuario){
        res.status(404).send('El usuario no se encuentra');
        return;
    }
    // Encontrar el indice del usuario dentro del arreglo
    // Devuelve el indice de la primera ocurrencia del elemento
    const index = usuarios.indexOf(usuario);
    usuarios.splice(index, 1); // Elimina el elemento en el indice indicado
    res.send(usuario); // Responde con el usuairo eliminado
});

/**
 * Tiene el mismo nombre que la peticion GET
 * Express hace la diferencia dependiendo del
 * tipo de peticion
 */
app.post('/api/usuarios', (req, res) => {
    // El objeto req tiene la propiedad body
    const {value, error} = validarUsuario(req.body.nombre);
    if (!error){
        const usuario = {
            id: usuarios.length + 1,
            nombre: req.body.nombre
        }
        usuarios.push(usuario);
        res.send(usuario);
    }
    else {
        const message = error.details[0].message;
        res.status(400).send(message);
    }
    //console.log(value, error);

    // El objeto req tiene la propiedad body
//    if (!req.body.nombre || req.body.nombre.length <= 2){ // comprueba que existe la propiedad nombre
//                                                          // y que tenga mas de 2 letras
//        res.status(400).send('Debe ingresar un nombre con al menos 3 letras');
//        return;
//    }
//    const usuario = {
//        id: usuarios.length + 1,
//        nombre: req.body.nombre
//    }
//    usuarios.push(usuario);
//    res.send(usuario);
});

/**
 * Usando el modulo process, se lee una variable de entorno
 * Si la variable no existe, va a tomar un valor  por default (3000)
 * 
 */ 
//console.log(process.env);
const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Escuchando en el puerto ${port}...`);
});

function existeUsuario(id){
    return (usuarios.find( u => u.id === parseInt(id)));
}
function validarUsuario(nom){
    const schema = Joi.object({
        nombre: Joi.string()
            .min(3)
            .required()
    });
    return (schema.validate({nombre: nom}));
}