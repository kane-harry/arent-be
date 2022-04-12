class ErrorContext {
    className: string
    method: string
    details: any
    constructor(className: string, method: string, details: any) {
        this.className = className
        this.method = method
        this.details = details
    }
}
export default ErrorContext
