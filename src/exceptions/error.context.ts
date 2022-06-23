class ErrorContext {
    className: string
    method: string
    details: any
    message: any
    constructor(className: string, method: string, details: any, message:any = null) {
        this.className = className
        this.method = method
        this.details = details
        this.message = message
    }
}
export default ErrorContext
