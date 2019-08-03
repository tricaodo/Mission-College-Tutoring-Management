import express = require('express');
import bodyParser = require('body-parser');
import path = require('path');

import * as db from './models/Database';
import { Subject } from "./models/Subject";
import { Student } from "./models/Student";
import { Tutor } from "./models/Tutor";
import {Appointment} from "./models/Appointment";

const app: express.Application = express();
app.use(bodyParser.urlencoded({ extended: true })); // for form data
app.use( bodyParser.json()); // for passing data from ajax call

app.use(express.static(path.join(__dirname, '../../src/web/public')));
// define the relative path for views folder
const viewPath = path.join(__dirname, '../../src/web/views');
app.set('views', viewPath);
app.set('view engine', 'ejs');

let uid = '';
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
            uid = userID;
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

app.post('/categories/show-tutors-days-times', isAuthenticated, (req, res) => {

    let subjectObj = JSON.parse(req.body.dropdownSubject);
    let selectedDate = req.body.datepick;
    let selectedSubjectID = subjectObj.id;
    let selectedSubject = subjectObj.subject;

    let unformattedDate = new Date(selectedDate);
    let unixTimeStamp = Math.floor(unformattedDate.getTime()/1000); // get unix time to save when student click on confirm box
    let indexOfDay = unformattedDate.getDay(); // get the index of day  -> ex: arr[0] = sunday

    // convert to readable string date for confirmation box
    const weekday = new Array(7);
            weekday[0] = "Sun";
            weekday[1] = "Mon";
            weekday[2] = "Tue";
            weekday[3] = "Wed";
            weekday[4] = "Thu";
            weekday[5] = "Fri";
            weekday[6] = "Sat";
    // let defaultdate = unformattedDate.getDate();
    // let defaultdayOfWeek = weekday[unformattedDate.getDay()];
    // let defaultmonth = unformattedDate.getMonth() + 1;
    // let defaultyear = unformattedDate.getFullYear();
    // let formatedDate = defaultdayOfWeek + ' ' + defaultmonth + '/' + defaultdate + '/' + defaultyear;


    let tutors: Tutor[] = [];
    db.getInstance.getTutors()
        .then((value: any) => {
            value.forEach((doc: any) => {

                let data = doc.data();
                const subjects: any[] = data['subjects'];
                for (let i = 0; i < subjects.length; i++) {

                    // filter the subject which student already chose
                    if (subjects[i] === selectedSubjectID) {
                        const work_schedules = data['work_schedule'][indexOfDay];
                        if(work_schedules != null){
                            const id = doc.id;
                            const firstName = data['first_name'];
                            const lastName = data['last_name'];
                            const email = data['email'];
                            let tutor = new Tutor(
                                        id,
                                        firstName,
                                        lastName,
                                        email,
                                        work_schedules,)
                            tutors.push(tutor);
                        }
                    }

                }

            });
            console.log('Tutors: ' + tutors);
            console.log('Subject: ' + selectedSubject);
            console.log('Date: ' + selectedDate)
            console.log('SubjectID: ' + selectedSubjectID);
            console.log('Unix Time: ' + unixTimeStamp);
            res.render('show-days-times', {
                tutors: tutors,
                selectedSubject: selectedSubject,
                selectedDate: selectedDate,
                selectedSubjectID: selectedSubjectID,
                unixTimeStamp: unixTimeStamp,
                userID: uid
            });
        })

        .catch(error => {
            console.log(error);
        })
});

app.post('/confirm-appointment', isAuthenticated, (req, res) => {
    console.log('Receiving Request: ');
    console.log(req.body);
    const apptObj = req.body;
    const appt = new Appointment(
        apptObj.apptDate,
        apptObj.dateCreated,
        apptObj.student_id,
        apptObj.subject_id,
        apptObj.time,
        apptObj.tutor
    )
    db.getInstance.addAppointment(appt);
})

// ============== MANAGE APPOINTMENT ============== // 
app.get('/categories/manage', isAuthenticated, (_, res) => {


});

app.listen(3000, () => console.log('Server has started...'));
