export class Appointment {

    constructor(
                public tutor?: string,
                public apptDate?: string,
                public time?: {from: string, to: string},
                public id?: string,
                public dateCreated?: string,
                public student?: string,
                public subject?: string,
    ) {

    }


}
