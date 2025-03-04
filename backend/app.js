const dotenv = require('dotenv');
dotenv.config();

const express = require('express'); 
const app = express();
const cors = require('cors');
const connectToDb = require('./db/db');
connectToDb();
const cookieParser = require('cookie-parser');


app.use(cors());    
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());


const riderRoutes = require('./routes/rider/rider.routes');

app.get('/',(request,response)=>{
    response.send(' Hello World');
});

app.use('/users', riderRoutes);

module.exports = app;