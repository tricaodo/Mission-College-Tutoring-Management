import express = require('express');
import bodyParser = require('body-parser');
import path = require('path');

import * as db from './models/Database';
import {Subject} from "./models/Subject";
import { Student } from './models/Student';

const app: express.Application = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../../src/web/public')));
// define the relative path for views folder
const viewPath = path.join(__dirname, '../../src/web/views');
app.set('views', viewPath);
app.set('view engine', 'ejs');

// ============== LANDING PAGE ============== // 
app.get('/', (_, res) => {
    res.render('landing');
});

// ============== LOGIN PAGE ============== // 
let errorMessage = ''; // error messge
app.get('/login', db.getInstance.isLoggedin, (_, res) => {
    res.render('login', {errorMessage: errorMessage});
});

app.post('/login', (req, res) => {
    let name = req.body.emailInput;
    let password = req.body.passwordInput;
    let loginFunc = db.getInstance.login(name, password);
    
    // db.getInstance.auth.onAuthStateChanged(firebaseUser => {
    //     if(firebaseUser){
    //         res.redirect('/categories');
    //     }else{
    //         res.render('login', {errorMessage: 'Wrong username or password'});
    //     }
    // });
    db.getInstance.login(name, password)
        .then((value: any) => {
            if(value){
                const userID: string = value.user.uid;
                const userEmail: string = value.user.providerData[0].email;
                const student: Student = new Student(userID, userEmail);
                res.redirect('/categories');
            }else{
             
            }

        })
        .catch((error: any) => {
            res.render('login', {errorMessage: 'Wrong username or password'});
        })

});

// ============== FORGET PAGE ============== // 
app.get('/forget', (_, res) => {
    res.render('forget')
});

// ============== SELECT CATEGORIES AFTER LOGIN ============== // 
app.get('/categories', db.getInstance.isAuthenticated,(_, res) => {
    res.render('category')
});

// ============== BOOKING APPOINTMENT ============== // 
app.get('/categories/booking', db.getInstance.isAuthenticated, (_, res) => {
    let subject: Subject[] = [];
    db.getInstance.getSubjects()
        .then((value: any) => {
            for(let i = 0; i < value.size; i++){
                const id = value.docs[i].id;
                const data = value.docs[i].data();
                subject.push(new Subject(id, data['full'], data['label']));
            }
            res.render('booking', {subject: subject});
        })
        .catch(error => {
            // throw error;
        });
});
// ============== MANAGE APPOINTMENT ============== // 
app.get('/categories/manage', db.getInstance.isAuthenticated, (_, res) => {
    res.render('manage')
});

app.listen(3000, () => console.log('Server has started...'));
