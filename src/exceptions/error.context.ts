class ErrorContext {
    class_name: string
    method: string
    details: any
    message: any
    constructor(className: string, method: string, details: any, message: any = null) {
        this.class_name = className
        this.method = method
        this.details = details
        this.message = message
    }
}
export default ErrorContext
