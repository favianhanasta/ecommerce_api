const express = require('express');
const app = express();
const cors = require('cors');
const dotenv = require('dotenv');
const bearerToken = require('express-bearer-token');
dotenv.config();


const PORT = process.env.PORT;
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use(bearerToken()); // untuk mengambil data token dari req.header client

// DB Check Connection
const {db} = require('./config/database')
db.getConnection((err,connection)=>{
    if(err){
        console.log('Error mysql', err.message)
    }
    console.log(`Connected to MySql Server : ${connection.threadId}` )
})

// Routes API Setup
app.get('/',(req,res)=>res.status(200).send('<h2>Welcome Ecommerce API</h2>'))
const {usersRoute, productsRoute, transactionsRoute} = require('./routes')

app.use('/users',usersRoute);
app.use('/products',productsRoute);
app.use('/transactions',transactionsRoute);

// config error handling
// app.use((data)=>{
//     console.log(data)
// })



app.listen(PORT, ()=>console.log('Ecommerce API RUNNING : ',PORT));