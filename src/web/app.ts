// import functions = require('firebase-functions');
import express = require('express');
import bodyParser = require('body-parser');
import path = require('path');
import moment = require('moment');

import * as db from './models/Database';
import {Subject} from "./models/Subject";
import {Student} from "./models/Student";




const app: express.Application = express();
app.use(bodyParser.urlencoded({extended: true})); // for form data
app.use(bodyParser.json()); // for passing data from ajax call

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
    res.render('login', {errorMessage: errorMessage});
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
            res.render('login', {errorMessage: errorMessage});
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
            res.render('booking', {subject: subject});
        })
        .catch(error => {
            // throw error;
        });
});

app.get('/show-appointments', (_, res) => {
    res.render('show-appointments');

});


app.post('/demo', isAuthenticated, (req, res) => {

    let subjectObj = JSON.parse(req.body.dropdownSubject);
    let selectedDate = req.body.datepick;
    let selectedSubjectID = subjectObj.id;
    let selectedSubject = subjectObj.subject;
    let unformattedDate = new Date(selectedDate);
    // let unixTimeStamp = Math.floor(unformattedDate.getTime()/1000); // get unix time to save when student click on confirm box
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


    // get tutors
    let tutors: {
        id: string, firstName: string, lastName: string,
        work_schedules: { from: string, to: string }[],
        // timeArrToCompare: string[]
    }[] = [];
    const tutorPromise = db.getInstance.getTutors()
        .then((value: any) => {
            value.forEach((doc: any) => {
                let data = doc.data();
                const subjects: any[] = data['subjects'];
                for (let i = 0; i < subjects.length; i++) {
                    // filter the subject which student already chose
                    if (subjects[i] === selectedSubjectID) {
                        const work_schedules = data['work_schedule'][indexOfDay];
                        if (work_schedules != null) {
                            const tutor = {
                                id: doc.id,
                                firstName: data['first_name'],
                                lastName: data['last_name'],
                                work_schedules: work_schedules,
                                // timeArrToCompare: timeArrToCompare
                            }
                            tutors.push(tutor);
                        }
                    }
                }

            });

        })
        .catch(error => {
            console.log(error);
        });
    // get appts
    let appts: { apptDate: string, tutorID: string, time: { from: string, to: string } }[] = [];
    const apptPromise = db.getInstance.getAppts()
        .then((snapshot: any) => {
            let apptSnapshot: any = Object.values(snapshot.val());

            for (let i = 0; i < apptSnapshot.length; i++) {
                const appt = {
                    apptDate: apptSnapshot[i]['apptDate'],
                    tutorID: apptSnapshot[i]['tutor_id'],
                    time: apptSnapshot[i]['time']
                }
                appts.push(appt);
            }
            // console.log(appts);
            return appts;
        });

    Promise.all([tutorPromise, apptPromise])
        .then((result) => {
            console.log(appts);
            console.log(tutors);
            let finalResArr: {
                tutorID: string, firstName: string, lastName: string,
                work_schedules: { from: string, to: string }[],
                subjectID: string, subject: string
            }[] = [];
            for (let appIndex = 0; appIndex < appts.length; appIndex++) {
                const apptData: any = appts[appIndex];
                const apptTutorID = apptData['tutorID'];
                for (let tutorIndex = 0; tutorIndex < tutors.length; tutorIndex++) {
                    const tutorData: any = tutors[tutorIndex], timeArr = tutorData['timeArrToCompare'];
                    if(apptTutorID === tutorData['id']){
                        let isValid = false;

                        const readableDateTime = moment(apptData['apptDate'] * 1000).format('MM-DD-YYYY HH:mm:ss').split(" "); // convert from database
                        const readableDate = readableDateTime[0];
                        const readableTime = readableDateTime[1];
                        const work_schedules = tutorData['work_schedules'];
                        // get the map of schedule_times \\ seperate function
                        let unfilterTimeArr: any = Object.values(work_schedules);
                        for (let i = 0; i < unfilterTimeArr.length; i++) {
                            const splitTimeFrom = unfilterTimeArr[i]['from']['time'].split(" ")[0];
                            const appendSplitTime = splitTimeFrom + ":00"

                            // same date and different time zone
                            const timeArr: {from: string, to: string}[] = [];
                            if(readableDate === selectedDate){
                                if(readableTime !== appendSplitTime){
                                    isValid = true;
                                    const splitTimeTo = unfilterTimeArr[i]['to']['time'].split(" ")[0]
                                    console.log(readableDate + ' - ' + selectedDate);
                                    console.log(readableTime + ' - ' + appendSplitTime);
                                    timeArr.push({from: splitTimeFrom, to: splitTimeTo});
                                    // const finalRes = {
                                    //     tutorID: tutorData['id'],
                                    //     firstName: tutorData['firstName'],
                                    //     lastName: tutorData['lastName'],
                                    //     work_schedules: timeArr,
                                    //     subjectID: selectedSubjectID,
                                    //     subject: selectedSubject
                                    // }
                                    // finalResArr.push(finalRes);
                                }
                            }
                            if(isValid){
                                const finalRes = {
                                    tutorID: tutorData['id'],
                                    firstName: tutorData['firstName'],
                                    lastName: tutorData['lastName'],
                                    work_schedules: Object.assign({}, timeArr),
                                    subjectID: selectedSubjectID,
                                    subject: selectedSubject
                                }
                                finalResArr.push(finalRes);
                                isValid = false;
                            }
                        }


                        // for(let timeIndex = 0; timeIndex < timeArr.length; timeIndex++){
                        //     if(readableDate !== timeArr[timeIndex]){
                        //         const finalRes = {
                        //             tutorID: tutorData['id'],
                        //             firstName: tutorData['firstName'],
                        //             lastName: tutorData['lastName'],
                        //             work_schedules: work_schedules,
                        //             subjectID: selectedSubjectID,
                        //             subject: selectedSubject
                        //         }
                        //         finalResArr.push(finalRes);
                        //     }
                        // }
                    }else{
                        let isValid = false;

                        const readableDateTime = moment(apptData['apptDate'] * 1000).format('MM-DD-YYYY HH:mm:ss').split(" "); // convert from database
                        const readableDate = readableDateTime[0];
                        const readableTime = readableDateTime[1];
                        const work_schedules = tutorData['work_schedules'];
                        // get the map of schedule_times \\ seperate function
                        let unfilterTimeArr: any = Object.values(work_schedules);
                        for (let i = 0; i < unfilterTimeArr.length; i++) {
                            const splitTimeFrom = unfilterTimeArr[i]['from']['time'].split(" ")[0];
                            const appendSplitTime = splitTimeFrom + ":00"

                            // same date and different time zone
                            const timeArr: {from: string, to: string}[] = [];
                            if(readableDate === selectedDate){
                                if(readableTime !== appendSplitTime){
                                    isValid = true;
                                    const splitTimeTo = unfilterTimeArr[i]['to']['time'].split(" ")[0]
                                    console.log(readableDate + ' - ' + selectedDate);
                                    console.log(readableTime + ' - ' + appendSplitTime);
                                    timeArr.push({from: splitTimeFrom, to: splitTimeTo});
                                    // const finalRes = {
                                    //     tutorID: tutorData['id'],
                                    //     firstName: tutorData['firstName'],
                                    //     lastName: tutorData['lastName'],
                                    //     work_schedules: timeArr,
                                    //     subjectID: selectedSubjectID,
                                    //     subject: selectedSubject
                                    // }
                                    // finalResArr.push(finalRes);
                                }
                            }
                            if(isValid){
                                const finalRes = {
                                    tutorID: tutorData['id'],
                                    firstName: tutorData['firstName'],
                                    lastName: tutorData['lastName'],
                                    work_schedules: Object.assign({}, timeArr),
                                    subjectID: selectedSubjectID,
                                    subject: selectedSubject
                                }
                                finalResArr.push(finalRes);
                                isValid = false;
                            }
                        }
                    }
                }
            }
            console.log(finalResArr);
            // for (let i = 0; i < tutors.length; i++) {
            //     const tutorData: any = tutors[i];
            //     const tutorID = tutorData['id'], timeArr = tutorData['timeArrToCompare'];
            //
            //     for (let l = 0; l < timeArr.length; l++) {
            //         const timeArrEl = timeArr[l];
            //         for (let j = 0; j < appts.length; j++) {
            //             const apptData: any = appts[j];
            //             const readableDate = moment(apptData['apptDate'] * 1000).format('MM-DD-YYYY HH:mm:ss'); // convert from database
            //             const apptTutorID = apptData['tutorID'];
            //
            //             if (tutorID === apptTutorID && readableDate !== timeArrEl) {
            //                 const firstName = tutorData['firstName'], lastName = tutorData['lastName'],
            //                         work_schedules = tutorData['work_schedules']
            //                 const finalRes = {
            //                     tutorID: tutorID,
            //                     firstName: firstName,
            //                     lastName: lastName,
            //                     work_schedules: work_schedules,
            //                     subjectID: selectedSubjectID,
            //                     subject: selectedSubject
            //                 }
            //                 finalResArr.push(finalRes);
            //             }
            //
            //         }
            //     }
            // }

            res.render('demo', {
                // finalRes: finalResArr
                tutors: tutors,
                appts: appts,
            });
        })
        .catch(error => {
            console.log(error);
        });

});


// working on how to push data to array in promise because it only adds the last element

/*
app.post('/categories/show-tutors-days-times', isAuthenticated, (req, res) => {

    let subjectObj = JSON.parse(req.body.dropdownSubject);
    let selectedDate = req.body.datepick;
    let selectedSubjectID = subjectObj.id;
    let selectedSubject = subjectObj.subject;
    console.log(selectedDate);
    let unformattedDate = new Date(selectedDate);
    // let unixTimeStamp = Math.floor(unformattedDate.getTime()/1000); // get unix time to save when student click on confirm box
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
    let timesArrdemo: any[] = [];
    // get tutors
     db.getInstance.getTutors()
        .then( (value: any) => {
            value.forEach( async (doc: any) => {

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
                            const generateDateArr:string[] = [] // use to compare with appointment

                            // convert schedule time to array
                            Object.keys(work_schedules).map(function(key) {
                                timesArrdemo.push((work_schedules[key]));
                            });
                            timesArrdemo.forEach(value => {
                                let splitTime = value['from']['time'].split(" ")[0] + ":00";
                                generateDateArr.push(selectedDate + ' ' + splitTime);
                            })

                            let tutor = new Tutor(
                                id,
                                firstName,
                                lastName,
                                email,
                                work_schedules,)
                            tutors.push(tutor);

                            //


                        }
                    }



                }
                console.log(tutors);
            });
            res.render('show-days-times', {
                tutors: tutors,
                selectedSubject: selectedSubject,
                selectedDate: selectedDate,
                selectedSubjectID: selectedSubjectID,
                userID: uid,
                timesArrdemo: timesArrdemo
            });
        })

        .catch(error => {
            console.log(error);
        })
});

*/

// ============== CONFIRMATION ============== //
app.post('/confirm-appointment', isAuthenticated, (req, res) => {
    const apptObj = req.body;
    db.getInstance.addAppointment(apptObj);

});

// ============== MANAGE APPOINTMENT ============== // 
app.get('/categories/manage', isAuthenticated, (_, res) => {


});
// exports.app = functions.https.onRequest(app);

app.listen(3000, () => console.log('Server has started...'));
