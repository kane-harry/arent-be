enum Environments {
    local = 'local',
    staging = 'staging',
    production = 'production'
}

class Environment {
    private environment: String;

    constructor(environment: String) {
        this.environment = environment;
    }

    getPort(): Number {
        if (this.environment === Environments.local) {
            return 3000;
        } else {
            return 80;
        }
    }

    getDBName(): String {
        return 'db_test';
    }

}


export default new Environment(Environments.local);