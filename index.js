const express = require('express');
const app = express();
const dotenv = require('dotenv').config();
const cors = require('cors');
const PORT = process.env.PORT || 3001

app.use(cors());
app.use(express.json());
 

const authRoute = require('./routes/authRoutes');
const userRoute = require('./routes/userRoutes');
const transactionRoute = require('./routes/transactionRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const investmentRoutes = require('./routes/investmentRoutes');
const stockRoutes = require('./routes/stockRoutes');
const goalRoutes = require('./routes/goalRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const translationRoutes = require('./routes/translateRoutes');
const notificationRoutes = require('./routes/notificationRouter');




app.use('/api/auth/', authRoute);
app.use('/api/user/', userRoute);
app.use('/api/transaction/', transactionRoute);
app.use('/api/category/', categoryRoutes);
app.use('/api/investment/', investmentRoutes);
app.use('/api/stocks/', stockRoutes);
app.use('/api/goal/', goalRoutes);
app.use('/api/analytics/', analyticsRoutes);
app.use('/api/translation/', translationRoutes);
app.use('/api/notification/', notificationRoutes);



app.listen(PORT, () =>{
    console.log(`backend server is running at localhost:${PORT}`);
}); 