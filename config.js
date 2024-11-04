const admin = require('firebase-admin');
const firebase =  require('firebase')
var serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_KEY);;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  //databaseURL: "https://opsc7312-bd8a4.firebaseio.com"
});


const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: "opsc7312-bd8a4.firebaseapp.com",
    projectId: "opsc7312-bd8a4",
    storageBucket: "opsc7312-bd8a4.appspot.com",
    messagingSenderId: "577849445889",
    appId: "1:577849445889:web:a758f756d9b38cf0adba00",
    measurementId: "G-5SLBCM53T5"
  };

  firebase.initializeApp(firebaseConfig)

  const auth = firebase.auth();
  const db = firebase.firestore()
  const batch = db.batch()
  
  const User = db.collection('Users')
  const Transaction = db.collection('Transactions')
  const Category = db.collection('Categories')
  const Goal = db.collection('Goals')
  const Notification = db.collection('Notifications')
  const Investment = db.collection('Investments')

  module.exports = { auth, admin, batch, db, User, Transaction, Category, Goal, Notification, Investment };