const inicioDebug = require('debug')('app:inicio');
const express = require('express'); // Importar express
const dbDebug = require('debug')('app:db');
const config = require('config');
const logger = require('./logger');
const morgan = require('morgan');
const app = express(); // Construcción de instancia de express
const Joi = require('joi'); // Importa Joi

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

//JSON hace un parsing de la entrada a formato JSON
// De tal forma que lo que recibamos en lo recibamos en req de una
// petición está en formato JSON

app.use(express.json()); // Se le dice a express que use este middleware
app.use(express.urlencoded({extended:true}));
// public es el nombre de la carpeta que tendrá los recursos estáticos
app.use(express.static('public'));

// Uso de middleware de tercero - morgan
if (app.get('env') == 'development'){
    app.use(morgan('tiny'));
    inicioDebug('Morgan esta habilitado');
}
// Operaciones con la base de datos
dbDebug('Conectado a la base de datos...');

console.log(`Aplicacion: ${config.get('nombre')}`);
console.log(`DB server: ${config.get('configDB.host')}`);

// Crear funcion middleware
//app.use(logger);

// app.use(function(req, res, next){
//     console.log('Autenticando...');
//     next();
// })

// Query string
// url/?var1=valor1&var2=valor2&var3=valor3...
// Hay cuatro tipos de peticiones 
// Acciones con las operaciones CRUD de una base de datos
// app.get(); // Consulta de datos
// app.post(); // Envía datos al servidor (insertar datos)
// app.put(); // Actualiza datos
// app.delete(); // Elimina datos

const usuarios = [
    {id:1, nombre:'Raul'},
    {id:2, nombre:'Juan'},
    {id:3, nombre:'Aldo'},
    {id:4, nombre:'Zair'}
]

// Consulta en la ruta raíz de nuestro servidor 
// Con una función callback
app.get('/', (req, res) => {
   res.send('Hola mundo desde Express');
});


// req es el requisito que recibe la app por parte del usuario
// res es la respuesta a la peticion del usuario
app.get('/api/usuarios', (req, res) => {
    res.send(usuarios);
});

// Cómo pasar parametros dentro de las rutas
// p. ej. solo quiero un usario específico en vez de todos
// Con los dos : delante del id Espress 
// sabe que es un parámetro a recibir
app.get('/api/usuarios/:id', (req, res) => {
    //Find devuelve el primer elemento del arreglo que cumpla con un predicado
    // ParseInt hace el casteo a entero directamente
    let usuario = usuarios.find(u => u.id === parseInt(req.params.id));
    // Si no existe
    if(!usuario){
        res.status(404).send('El usuario no se encuentra'); // Devuelve el estado HTTP
    }
    res.send(usuario);
});

app.post('api/usuarios', (req, res) => {
    const {value, error} = validarUsuario({nombre: req.body.nombre});
    //console.log(value, error)
    if(!error){
        const usuario = {
            id:usuarios.length + 1,
            nombre:req.body.nombre
        }
        usuarios.push(usuario);
        res.send(usuario);
    }
    else{
        const mensaje = error.details[0].message;
        res.status(400).send(mensaje);
    }
});

// Peticion PUT
// Meotod para actualizar información
// Recibe el id del usuario que se quiere modificar
// Utilizando un parámetro en la ruta :id
app.put('/api/usuarios/:id', (req, res) => {
    // Validar que el usuario se encuentre
    // en los registros 
    let usuario = existeUsuario(req.params.id)
    //let usuario = usuarios.find(u => u.id === parseInt(req.params.id));
    if(!usuario){
        res.status(404).send('El usuario no se encuentra'); // Devuelve el estado HTTP
        return;
    }
    // En el body del request debe venir la información
    // para hacer la actualización
    // const schema = Joi.object({
    //     nombre: Joi.string().min(3).required()
    // });
    //const {value, error} = schema.validate({nombre:req.body.nombre});
    const {value, error} = validarUsuario({nombre: req.body.nombre});
    if(error ){
        const mensaje = error.details[0].message;
        res.status(400).send(mensaje);
        return;
    }
    // Actualiza el nombre del usuario
    usuario.nombre = value.nombre;
    res.send(usuario);
});

// Petición DELETE
// Recibe el id del usuario que se quiere eliminar
// Utilizando un parámetro en la ruta :id
app.delete('/api/usuarios/:id', (req, res) => {
    const usuario = existeUsuario(req.params.id);
    if(!usuario){
       res.status(400).send('El usuario no se encuentra');
       return;
    }
    // Encontrar el indice del usuario dentro del arreglo
    // Devuelve el indice de la primera ocurrencia del elemento
    const index = usuarios.indexOf(usuario);
    usuarios.splice(index, 1) // splice(posInicial, elementosELiminar)
    res.send(usuario); // Responde con el usuario eliminado 
    
});


// Si el puerto ya esta ocupado podemos hacer lo siguiente
// Es utilizar una variable de entorno
// Usando el moódulo process, se lee una variable
// de entorno
// Si la variable no existe, va a tomar un valor
// por default (3000)
const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Escuchando en el puerto ${port}`);
});

function existeUsuario(id){
    return(usuarios.find( u => u.id === parseInt(id)));
}

function validarUsuario(nombre){
    const schema = Joi.object({
        nombre: Joi.string().min(3).required()
    });
    return (schema.validate({nombre:nom}));
}