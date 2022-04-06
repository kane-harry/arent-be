import { ErrorCode } from './error.code'

export class ErrorException extends Error {
    public status: number = 500;
    public metaData: any = null;
    constructor(code: string = ErrorCode.UnknownError, metaData: any = null) {
        super(code);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = code;
        this.status = 500;
        this.metaData = metaData;
        switch (code) {
            case ErrorCode.BadRequest:
                this.status = 400;
                break;
            case ErrorCode.Unauthorized:
                this.status = 401;
                break;
            case ErrorCode.Forbidden:
                this.status = 403;
                break;
            case ErrorCode.NotFound:
                this.status = 404;
                break;
            case ErrorCode.NotImplemented:
                this.status = 501;
                break;
            default:
                this.status = 500;
                break;
        }
    }
}