export class Appointment {
    constructor(public apptDate: string,
                public dateCreated: string,
                public student: string,
                public subject: string,
                public time: {from: string, to: string},
                public tutor: string) {

    }
}
