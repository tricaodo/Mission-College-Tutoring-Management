
export class Tutor {
    constructor(public id: string,
                public firstName: string,
                public lastName: string,
                public email: string,
                public work_schedules: {from: string, to: string}[],
                ) { }
}
