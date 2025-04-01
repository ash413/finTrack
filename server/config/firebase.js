const admin = require('firebase-admin')
require('dotenv').config()

const { initializeApp } = require('firebase/app')
const { getDatabase } = require('firebase/database')

//path to service account file
const serviceAccount = require('../fintrack-9-firebase-adminsdk-fbsvc-30cc718f65.json')

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`
})

//firebase config for client interactions
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: `${process.env.FIREBASE_PROJECT_ID}.firebaseapp.com`,
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
}

//initialize firebase
const firebaseApp = initializeApp(firebaseConfig)
const realtTimeDb = getDatabase(firebaseApp)


module.exports = {
    admin,
    realtTimeDb
};