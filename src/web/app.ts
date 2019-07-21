import express = require('express');
import bodyParser = require('body-parser');
import path = require('path');

import * as db from './models/Database';
import { Subject } from "./models/Subject";
import { Student } from "./models/Student";
import { Tutor } from "./models/Tutor";

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

// ============== MIDDLEWARE ============== //
const isLoggedin = db.getInstance.isLoggedin;
const isAuthenticated = db.getInstance.isAuthenticated;

// ============== LOGIN PAGE ============== // 
let errorMessage = ''; // error messge
app.get('/login', isLoggedin, (_, res) => {
    res.render('login', { errorMessage: errorMessage });
});

app.post('/login', (req, res) => {
    let name = req.body.emailInput;
    let password = req.body.passwordInput;
    db.getInstance.login(name, password)
        .then((value: any) => {
            const userID: string = value.user.uid;
            const userEmail: string = value.user.providerData[0].email;
            const student: Student = new Student(userID, userEmail);
            res.redirect('/categories');
        })
        .catch((error: any) => {
            errorMessage = error;
            res.render('login', { errorMessage: errorMessage });
        });
});

// ============== FORGET PAGE ============== // 
app.get('/forget', isLoggedin, (_, res) => {
    res.render('forget')
});

// ============== SELECT CATEGORIES AFTER LOGIN ============== // 
app.get('/categories', isAuthenticated, (_, res) => {
    res.render('category')
});

// ============== BOOKING APPOINTMENT ============== // 
app.get('/categories/booking', isAuthenticated, (_, res) => {
    let subject: Subject[] = [];
    db.getInstance.getSubjects()
        .then((value: any) => {
            for (let i = 0; i < value.size; i++) {
                const id = value.docs[i].id;
                const data = value.docs[i].data();
                subject.push(new Subject(id, data['full'], data['label']));
            }
            res.render('booking', { subject: subject });
        })
        .catch(error => {
            // throw error;
        });
});

app.get('/categories/show-tutors-days-times', isAuthenticated, (req, res) => {
    // will check whether the tutor is having this subject
    let selectedSubject = req.query.subject;

    // console.log(req.query);
    let tutors: Tutor[] = [];

    db.getInstance.getTutors()
        .then((value: any) => {
            value.forEach((doc: any) => {
                const data = doc.data();
                const subjects: any[] = data['subjects'];
                for (let i = 0; i < subjects.length; i++) {
                    if (subjects[i] === selectedSubject) {
                        const id = doc.id;
                        const firstName = data['first_name'];
                        const lastName = data['last_name'];
                        const email = data['email'];
                        const work_schedules = data['work_schedule'];

                        let tutor = new Tutor(id, firstName, lastName,
                            email, subjects, work_schedules);
                        tutors.push(tutor);
                    }
                }
            });
            res.render('show-days-times', { tutors: tutors });

        })

        .catch(error => {
            console.log(error);
        })
})
// ============== MANAGE APPOINTMENT ============== // 
app.get('/categories/manage', isAuthenticated, (_, res) => {


});

app.listen(3000, () => console.log('Server has started...'));
