import * as firebase from 'firebase';
import {Appointment} from "./Appointment";

const firebaseConfig = {
    apiKey: "AIzaSyCEwH7H3TERDuRQDA_qbxLEs6VsdrfG2iM",
    authDomain: "asc-management-app.firebaseapp.com",
    databaseURL: "https://asc-management-app.firebaseio.com",
    projectId: "asc-management-app",
    storageBucket: "asc-management-app.appspot.com",
    messagingSenderId: "454260445359",
    appId: "1:454260445359:web:7116a9722bf14be0"
};
firebase.initializeApp(firebaseConfig);
const database = firebase.database(); // real time database
const firestore = firebase.firestore(); // fire store database
const auth = firebase.auth();

/********* reference of real time database *********/
const rootRef = database.ref();
const appointmentsRef = rootRef.child('appointments');


const getInstance = {

    // ============== ADD APPOINTMENT ============== //
    addAppointment: function(appt: any) {
        appointmentsRef.push(appt);

    },

    // addApptToStudent: function(studentID: string){
    //     this.getSpecificStudent(studentID);
    // },

    // addApptToTutor: function (tutorID: string, apptID: string){
    //     const tutorRef = firestore.collection('tutors').doc(tutorID);
    //     tutorRef.update('appointments', firebase.firestore.FieldValue.arrayUnion(apptID))
    //         .then(() => {
    //             console.log('Successfully added appt to tutor array');
    //         })
    //         .catch(error => {
    //             console.log('Error from addApptToTutor: ' + error);
    //         })
    // },
    // ============== END ADD APPOINTMENT ============== //


    getSpecificStudent: function (studentID: string){

        // working on this one
    },

    getAppts: function(){
        return new Promise((resolves, rejects) => {
            appointmentsRef.on('value', (snapshot) => {
                resolves(snapshot);
            }, (error: any) => {
                console.log(error);
            })
        })
    },

    getTutors: function () {
        return new Promise((resolves, rejects) => {
            firestore.collection('tutors').get()
                .then(collection => {
                    resolves(collection);
                })
                .catch(error => {
                    console.log(error);
                })
        })
    },

    getFireStore: function () {
        console.log(firestore);
    },


    login: function (email: string, password: string) {
        return new Promise((resolve, rejects) => {
            auth.signInWithEmailAndPassword(email, password)
                .then(snapshot => {
                    resolve(snapshot);
                })
                .catch((error: any) => {
                    rejects(error);
                });
        })

    },
    getSubjects: function () {
        return new Promise((resolve, rejects) => {
            firestore.collection('subjects').get()
                .then(snapshot => {
                    resolve(snapshot);
                })
                .catch(error => {
                    process.exit();
                });
        });
    },



    // ============== MIDDLEWARE FUNCTION ============== //
    isAuthenticated: function (req: any, res: any, next: any) {
        let user = auth.currentUser;
        if (user !== null) {
            req.user = user;
            next();
        } else {
            res.redirect('/login');
        }
    },
    isLoggedin: function (req: any, res: any, next: any) {
        let user = auth.currentUser;
        if (user != null) {
            req.user = user;
            res.redirect('/categories');
        } else {
            next();
        }
    }
}
export { getInstance };
