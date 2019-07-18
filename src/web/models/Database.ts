import * as firebase from 'firebase';

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
const tutorRef = rootRef.child('tutors');


const getInstance = {
    getTutors: function () {
        tutorRef.on('value', (snapshot) => {
            console.log(snapshot.val());
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
    isLoggedin: function (req: any, res: any, next: any){
        let user = auth.currentUser;
        if(user != null){
            req.user = user;
            res.redirect('/categories');
        }else{
            next();
        }
    }
}
export {getInstance};
