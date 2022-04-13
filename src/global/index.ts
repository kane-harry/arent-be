declare global {
    namespace Express {
        interface User {
            firstName: string
            lastName: string
            nickName: string
            email: string
            password: string
            pin: string
            phone: string
            country: string
            playerId: string
        }
    }
}

export {}
