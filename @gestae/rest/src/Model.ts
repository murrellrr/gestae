
export abstract class Model {
    public id: string;

    constructor(id?: string) {
        this.id = id ?? new.target.name.toLowerCase();
    }
}

export class DefaultModel extends Model {}